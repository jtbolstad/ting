import type { ApiResponse } from "@ting/shared";
import type { Router as ExpressRouter, Response } from "express";
import { Router } from "express";
import {
  authenticate,
  requireAdmin,
  type AuthRequest,
} from "../middleware/auth.js";
import {
  requireOrgRole,
  withOrganizationContext,
} from "../middleware/organization.js";
import { prisma } from "../prisma.js";
import { serializeUser } from "../services/auth.js";

const router: ExpressRouter = Router();

// All user routes require authentication
router.use(authenticate);

// List all users within the active organization (org manager+)
router.get(
  "/",
  withOrganizationContext(),
  requireOrgRole("MANAGER"),
  async (req: AuthRequest, res: Response) => {
    try {
      const memberships = await prisma.membership.findMany({
        where: {
          organizationId: req.organization!.id,
        },
        include: {
          user: true,
          groups: {
            include: { group: true },
          },
          organization: true,
        },
        orderBy: { createdAt: "desc" },
      });

      const response: ApiResponse<any[]> = {
        success: true,
        data: memberships.map((membership) =>
          serializeUser(membership.user, [membership]),
        ),
      };

      res.json(response);
    } catch (error) {
      console.error("List users error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch users" });
    }
  },
);

// Get user by ID
router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Users can view their own profile, admins can view any
    if (req.user!.id !== id && req.user!.role !== "ADMIN") {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const memberships = await prisma.membership.findMany({
      where: { userId: user.id, status: "ACTIVE" },
      include: {
        organization: true,
        groups: {
          include: { group: true },
        },
      },
    });

    const response: ApiResponse<any> = {
      success: true,
      data: serializeUser(user, memberships),
    };

    res.json(response);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch user" });
  }
});

// Update user
router.patch("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { email, name, role } = req.body;

    // Users can update their own profile (except role), admins can update any
    if (req.user!.id !== id && req.user!.role !== "ADMIN") {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    // Only admins can change roles
    if (role && req.user!.role !== "ADMIN") {
      return res
        .status(403)
        .json({ success: false, error: "Only admins can change roles" });
    }

    const updateData: any = {};
    if (email) updateData.email = email;
    if (name) updateData.name = name;
    if (role && req.user!.role === "ADMIN") updateData.role = role;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    const response: ApiResponse<any> = {
      success: true,
      data: serializeUser(user),
    };

    res.json(response);
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ success: false, error: "Failed to update user" });
  }
});

// Delete user (admin only)
router.delete("/:id", requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ success: false, error: "Failed to delete user" });
  }
});

export default router;
