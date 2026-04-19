import type { ApiResponse, Organization, User } from "@ting/shared";
import type { Router as ExpressRouter, Response } from "express";
import { Router } from "express";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { prisma } from "../prisma.js";

const router: ExpressRouter = Router();

// Middleware to verify platform admin
function requirePlatformAdmin(req: AuthRequest, res: Response, next: Function) {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      error: "Platform admin access required",
    });
  }
  next();
}

// List all organizations with member count and item count
router.get(
  "/organizations",
  authenticate,
  requirePlatformAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const organizations = await prisma.organization.findMany({
        include: {
          _count: {
            select: { memberships: true, items: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const data = organizations.map((org) => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        description: org.description,
        memberCount: org._count.memberships,
        itemCount: org._count.items,
        createdAt: org.createdAt.toISOString(),
        updatedAt: org.updatedAt.toISOString(),
      }));

      const response: ApiResponse<typeof data> = {
        success: true,
        data,
      };

      res.json(response);
    } catch (error) {
      console.error("Get organizations error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch organizations",
      });
    }
  }
);

// List all users with their organization memberships
router.get(
  "/users",
  authenticate,
  requirePlatformAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const users = await prisma.user.findMany({
        include: {
          memberships: {
            include: { organization: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const data = users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        memberships: user.memberships.map((m) => ({
          organizationId: m.organizationId,
          organizationName: m.organization.name,
          organizationSlug: m.organization.slug,
          role: m.role,
          status: m.status,
        })),
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      }));

      const response: ApiResponse<typeof data> = {
        success: true,
        data,
      };

      res.json(response);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch users",
      });
    }
  }
);

// Get organization details with members
router.get(
  "/organizations/:orgId",
  authenticate,
  requirePlatformAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { orgId } = req.params;

      const organization = await prisma.organization.findUnique({
        where: { id: orgId },
        include: {
          memberships: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  role: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
          _count: {
            select: { items: true },
          },
        },
      });

      if (!organization) {
        return res.status(404).json({
          success: false,
          error: "Organization not found",
        });
      }

      const data = {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        description: organization.description,
        itemCount: organization._count.items,
        members: organization.memberships.map((m) => ({
          userId: m.user.id,
          userEmail: m.user.email,
          userName: m.user.name,
          userRole: m.user.role,
          membershipRole: m.role,
          status: m.status,
          joinedAt: m.createdAt.toISOString(),
        })),
        createdAt: organization.createdAt.toISOString(),
        updatedAt: organization.updatedAt.toISOString(),
      };

      const response: ApiResponse<typeof data> = {
        success: true,
        data,
      };

      res.json(response);
    } catch (error) {
      console.error("Get organization error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch organization",
      });
    }
  }
);

// Update user (platform admin only)
router.patch(
  "/users/:userId",
  authenticate,
  requirePlatformAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { userId } = req.params;
      const { name, role } = req.body;

      if (!name && role === undefined) {
        return res.status(400).json({
          success: false,
          error: "At least one field (name, role) is required",
        });
      }

      if (role && !["ADMIN", "USER"].includes(role)) {
        return res.status(400).json({
          success: false,
          error: "Role must be ADMIN or USER",
        });
      }

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (role !== undefined) updateData.role = role;

      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      const response: ApiResponse<{
        id: string;
        email: string;
        name: string;
        role: string;
      }> = {
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };

      res.json(response);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update user",
      });
    }
  }
);

export default router;
