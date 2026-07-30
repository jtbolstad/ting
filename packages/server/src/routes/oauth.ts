import type { Router as ExpressRouter, Request, Response, NextFunction } from "express";
import { Router } from "express";
import passport from "../config/passport.js";
import { prisma } from "../prisma.js";
import { generateToken, serializeUser } from "../services/auth.js";

const router: ExpressRouter = Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Check if Google OAuth is configured
function isGoogleConfigured(): boolean {
  return Boolean(GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

// GET /api/auth/oauth/status - Check which OAuth providers are available
router.get("/status", (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      google: isGoogleConfigured(),
    },
  });
});

// GET /api/auth/google - Redirect to Google consent screen
router.get(
  "/google",
  (req: Request, res: Response, next: NextFunction) => {
    if (!isGoogleConfigured()) {
      return res.status(501).json({
        success: false,
        error: "Google OAuth is not configured",
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
  (req: Request, res: Response, next: NextFunction) => {
    if (!isGoogleConfigured()) {
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
