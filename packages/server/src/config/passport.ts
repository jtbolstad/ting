import passport from "passport";
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from "passport-google-oauth20";
import { prisma } from "../prisma.js";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || "http://localhost:3001/api/auth/google/callback";

// Users signing in with Google are not invited to an organization, so they are
// enrolled in this one. Override with OAUTH_DEFAULT_ORG_SLUG; set it to an empty
// string to leave Google users without a membership.
const DEFAULT_ORG_SLUG =
  process.env.OAUTH_DEFAULT_ORG_SLUG ?? "hpv-tingbibliotek";

/**
 * Give the user a membership in the default organization unless they already
 * have one. Never throws: a missing organization or a race with a concurrent
 * sign-in must not fail the login.
 */
export async function ensureDefaultMembership(userId: string): Promise<void> {
  if (!DEFAULT_ORG_SLUG) return;

  try {
    const organization = await prisma.organization.findUnique({
      where: { slug: DEFAULT_ORG_SLUG },
      select: { id: true },
    });

    if (!organization) {
      console.warn(
        `⚠️  Default OAuth organization "${DEFAULT_ORG_SLUG}" not found; user ${userId} signed in without a membership`,
      );
      return;
    }

    const existing = await prisma.membership.findUnique({
      where: {
        userId_organizationId: { userId, organizationId: organization.id },
      },
      select: { id: true },
    });
    if (existing) return;

    // Only the user's first membership becomes the default one.
    const membershipCount = await prisma.membership.count({ where: { userId } });

    await prisma.membership.create({
      data: {
        userId,
        organizationId: organization.id,
        role: "MEMBER",
        status: "ACTIVE",
        isDefault: membershipCount === 0,
      },
    });
  } catch (error) {
    console.error("Failed to assign default OAuth membership:", error);
  }
}

export function initializePassport() {
  // Only configure Google strategy if credentials are provided
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.log("⚠️  Google OAuth not configured (GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET missing)");
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
        scope: ["email", "profile"],
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: VerifyCallback
      ) => {
        try {
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value;
          const name = profile.displayName || profile.name?.givenName || "User";

          if (!email) {
            return done(new Error("No email provided by Google"));
          }

          // Check if OAuth account already exists
          const existingOAuth = await prisma.oAuthAccount.findUnique({
            where: {
              provider_providerAccountId: {
                provider: "google",
                providerAccountId: googleId,
              },
            },
            include: { user: true },
          });

          if (existingOAuth) {
            // User already linked to this Google account
            await ensureDefaultMembership(existingOAuth.user.id);
            return done(null, existingOAuth.user);
          }

          // Check if a user with this email already exists
          const existingUser = await prisma.user.findUnique({
            where: { email },
          });

          if (existingUser) {
            // Link Google account to existing user
            await prisma.oAuthAccount.create({
              data: {
                provider: "google",
                providerAccountId: googleId,
                userId: existingUser.id,
              },
            });
            await ensureDefaultMembership(existingUser.id);
            return done(null, existingUser);
          }

          // Create new user + OAuth account
          const newUser = await prisma.user.create({
            data: {
              email,
              name,
              role: "MEMBER",
              // passwordHash is null for OAuth-only users
              oauthAccounts: {
                create: {
                  provider: "google",
                  providerAccountId: googleId,
                },
              },
            },
          });

          await ensureDefaultMembership(newUser.id);
          return done(null, newUser);
        } catch (error) {
          console.error("Google OAuth error:", error);
          return done(error as Error);
        }
      }
    )
  );

  console.log("✅ Google OAuth configured");
}

export default passport;
