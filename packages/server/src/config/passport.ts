import passport from "passport";
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from "passport-google-oauth20";
import { prisma } from "../prisma.js";
import { ensureDefaultMembership } from "../services/membership.js";

export { ensureDefaultMembership };

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || "http://localhost:3001/api/auth/google/callback";

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
