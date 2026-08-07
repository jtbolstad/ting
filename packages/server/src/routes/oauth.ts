import type { Router as ExpressRouter, Request, Response, NextFunction } from "express";
import { Router } from "express";
import passport from "../config/passport.js";
import { prisma } from "../prisma.js";
import { generateToken, serializeUser } from "../services/auth.js";

const router: ExpressRouter = Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const OAUTH_DEFAULT_ORG_SLUG = process.env.OAUTH_DEFAULT_ORG_SLUG ?? "hpv-tingbibliotek";

// Check if Google OAuth credentials are present on the server
function hasGoogleCredentials(): boolean {
  return Boolean(GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/**
 * Look up the GOOGLE_LOGIN feature flag in the default organisation's DB row.
 * Falls back to `true` (enabled) when no row exists so the feature works
 * out-of-the-box without an admin needing to explicitly turn it on.
 */
async function isGoogleLoginFlagEnabled(): Promise<boolean> {
  try {
    const org = await prisma.organization.findUnique({
      where: { slug: OAUTH_DEFAULT_ORG_SLUG },
      select: { id: true },
    });
    if (!org) return true; // No default org yet — don't block login
    const row = await prisma.featureFlag.findUnique({
      where: { organizationId_key: { organizationId: org.id, key: "GOOGLE_LOGIN" } },
    });
    // When no row exists the flag has never been set; treat as enabled
    return row ? row.enabled : true;
  } catch {
    return true; // Non-fatal: DB unavailable → don't block login
  }
}

// GET /api/auth/status - Check which OAuth providers are available
// Unauthenticated: checks both credentials AND the admin feature flag
router.get("/status", async (req: Request, res: Response) => {
  const credentialsOk = hasGoogleCredentials();
  const flagEnabled = credentialsOk ? await isGoogleLoginFlagEnabled() : false;
  res.json({
    success: true,
    data: {
      google: credentialsOk && flagEnabled,
    },
  });
});

// GET /api/auth/google - Redirect to Google consent screen
router.get(
  "/google",
  async (req: Request, res: Response, next: NextFunction) => {
    if (!hasGoogleCredentials()) {
      return res.status(501).json({
        success: false,
        error: "Google OAuth is not configured",
      });
    }
    if (!await isGoogleLoginFlagEnabled()) {
      return res.status(501).json({
        success: false,
        error: "Google login is disabled",
      });
    }
    next();
  },
  passport.authenticate("google", {
    session: false,
    scope: ["email", "profile"],
  })
);

// GET /api/auth/google/callback - Handle Google's response
router.get(
  "/google/callback",
  async (req: Request, res: Response, next: NextFunction) => {
    if (!hasGoogleCredentials() || !await isGoogleLoginFlagEnabled()) {
      return res.redirect(`${CLIENT_URL}/login?error=oauth_not_configured`);
    }
    next();
  },
  (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("google", { session: false }, (err: Error | null, user: any) => {
      if (err || !user) {
        console.error("Google OAuth callback error:", err);
        return res.redirect(`${CLIENT_URL}/login?error=oauth_failed`);
      }
      // Attach user to request for the next handler
      (req as any).oauthUser = user;
      next();
    })(req, res, next);
  },
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).oauthUser;

      // Fetch memberships for the user
      const membershipsData = await prisma.membership.findMany({
        where: {
          userId: user.id,
          status: "ACTIVE",
        },
        include: {
          organization: true,
          groups: {
            include: {
              group: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      const serializedUser = serializeUser(user, membershipsData);
      const token = generateToken(serializedUser);

      // Redirect to client with token
      // The client will extract the token and store it
      res.redirect(`${CLIENT_URL}/oauth-callback?token=${encodeURIComponent(token)}`);
    } catch (error) {
      console.error("OAuth callback token generation error:", error);
      res.redirect(`${CLIENT_URL}/login?error=token_generation_failed`);
    }
  }
);

export default router;
