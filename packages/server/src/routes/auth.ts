import type {
  ApiResponse,
  AuthResponse,
  CreateUserInput,
  LoginInput,
  Membership,
} from "@ting/shared";
import type { Router as ExpressRouter, Request, Response } from "express";
import { Router } from "express";
import crypto from "crypto";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { prisma } from "../prisma.js";
import {
  comparePassword,
  generateToken,
  hashPassword,
  serializeMembership,
  serializeUser,
} from "../services/auth.js";
import { emailService } from "../services/email.js";
import { audit } from "../services/auditLog.js";

const router: ExpressRouter = Router();
const membershipInclude = {
  organization: true,
  groups: {
    include: {
      group: true,
    },
  },
} as const;

async function getMemberships(userId: string) {
  return prisma.membership.findMany({
    where: {
      userId,
      status: "ACTIVE",
    },
    include: membershipInclude,
    orderBy: {
      createdAt: "asc",
    },
  });
}

function buildAuthResponse(user: any, membershipsData: any[]) {
  const serializedMemberships = membershipsData.map(serializeMembership);
  const serializedUser = serializeUser(user, membershipsData);
  const activeMembership =
    membershipsData.find((m) => m.isDefault) ?? membershipsData[0] ?? null;

  const token = generateToken(serializedUser);

  return {
    serializedUser,
    token,
    serializedMemberships,
    activeMembershipId: activeMembership?.id ?? null,
  };
}

// Register new user
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password, name, organizationId } =
      req.body as CreateUserInput & { organizationId?: string | null };

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: "Email, password, and name are required",
      });
    }

    let organization = null;
    if (organizationId) {
      organization = await prisma.organization.findUnique({
        where: { id: organizationId },
      });
      if (!organization) {
        return res
          .status(404)
          .json({ success: false, error: "Organization not found" });
      }
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "Email already registered",
      });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: "MEMBER",
      },
    });

    // Create membership only if organizationId provided
    if (organizationId) {
      await prisma.membership.create({
        data: {
          userId: user.id,
          organizationId,
          role: "MEMBER",
          status: "ACTIVE",
          isDefault: true,
        },
      });
    }

    const membershipsData = await getMemberships(user.id);
    const { serializedUser, token, serializedMemberships, activeMembershipId } =
      buildAuthResponse(user, membershipsData);

    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: {
        user: serializedUser,
        token,
        memberships: serializedMemberships as Membership[],
        activeMembershipId,
      },
    };

    if (organization && organizationId) {
      emailService.sendWelcome(user.email, user.name, organization.name).catch(console.error);
      audit({ organizationId, actorUserId: user.id, action: "auth.register", entityType: "User", entityId: user.id, metadata: { email: user.email } });
    }

    res.status(201).json(response);
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ success: false, error: "Registration failed" });
  }
});

// Login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as LoginInput;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    const validPassword = await comparePassword(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    const membershipsData = await getMemberships(user.id);
    const { serializedUser, token, serializedMemberships, activeMembershipId } =
      buildAuthResponse(user, membershipsData);

    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: {
        user: serializedUser,
        token,
        memberships: serializedMemberships as Membership[],
        activeMembershipId,
      },
    };

    const loginOrgId = membershipsData[0]?.organizationId;
    if (loginOrgId) {
      audit({ organizationId: loginOrgId, actorUserId: user.id, action: "auth.login.success", entityType: "User", entityId: user.id, metadata: { email: user.email } });
    }

    res.json(response);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, error: "Login failed" });
  }
});

// Get current user
router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const membershipsData = await getMemberships(user.id);
    const serializedUser = serializeUser(user, membershipsData);
    const serializedMemberships = membershipsData.map(serializeMembership);
    const activeMembership =
      membershipsData.find((m: any) => m.isDefault) ??
      membershipsData[0] ??
      null;

    const response: ApiResponse<any> = {
      success: true,
      data: {
        user: serializedUser,
        memberships: serializedMemberships as Membership[],
        activeMembershipId: activeMembership?.id ?? null,
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ success: false, error: "Failed to get user" });
  }
});

// Change password
router.post("/change-password", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: "currentPassword and newPassword are required" });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const valid = await comparePassword(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(400).json({ success: false, error: "Current password is incorrect" });
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    res.json({ success: true });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ success: false, error: "Failed to change password" });
  }
});

// Request password reset
router.post("/request-reset-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: "Email is required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success (prevent email enumeration)
    if (!user) {
      return res.json({ success: true, data: { message: "If account exists, reset email sent" } });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpiresAt: expiresAt,
      },
    });

    // Send email with reset link (in dev mode, just log)
    const resetLink = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;
    console.log(`Password reset link for ${email}: ${resetLink}`);

    // TODO: Send actual email in production
    // await emailService.sendPasswordReset(email, user.name, resetLink);

    res.json({ success: true, data: { message: "If account exists, reset email sent" } });
  } catch (error) {
    console.error("Request reset password error:", error);
    res.status(500).json({ success: false, error: "Failed to process request" });
  }
});

// Reset password with token
router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Token and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters",
      });
    }

    const user = await prisma.user.findUnique({
      where: { resetPasswordToken: token },
    });

    if (!user || !user.resetPasswordExpiresAt || user.resetPasswordExpiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired reset token",
      });
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpiresAt: null,
      },
    });

    res.json({ success: true, data: { message: "Password reset successfully" } });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ success: false, error: "Failed to reset password" });
  }
});

// Get users without organization (waiting room) - platform admin only
router.get("/waiting-users", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== "ADMIN") {
      return res.status(403).json({ success: false, error: "Admin access required" });
    }

    const usersWithoutOrg = await prisma.user.findMany({
      where: {
        memberships: {
          none: {},
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      data: usersWithoutOrg.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        createdAt: u.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Get waiting users error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch waiting users" });
  }
});

export default router;
