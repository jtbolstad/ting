import type { ApiResponse, Organization, User } from "@ting/shared";
import type { Router as ExpressRouter, Response } from "express";
import { Router } from "express";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { prisma } from "../prisma.js";
import { emailService } from "../services/email.js";

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
        type: org.type ?? null,
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
        type: organization.type ?? null,
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
      const { name, role, email } = req.body;

      if (!name && role === undefined && !email) {
        return res.status(400).json({
          success: false,
          error: "At least one field (name, role, email) is required",
        });
      }

      if (role && !["ADMIN", "ORG_ADMIN", "USER"].includes(role)) {
        return res.status(400).json({
          success: false,
          error: "Role must be ADMIN, ORG_ADMIN, or USER",
        });
      }

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (role !== undefined) updateData.role = role;
      if (email !== undefined) updateData.email = email;

      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      if (role !== undefined && role !== user.role) {
        emailService.sendOrgRoleChanged(user.email, user.name, 'Ting', role).catch(console.error);
      }

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

// Add user to organization (platform admin only)
router.post(
  "/users/:userId/memberships",
  authenticate,
  requirePlatformAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { userId } = req.params;
      const { organizationId, role = "MEMBER" } = req.body;

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          error: "organizationId is required",
        });
      }

      // Check if user exists
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      // Check if organization exists
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
      });
      if (!org) {
        return res.status(404).json({
          success: false,
          error: "Organization not found",
        });
      }

      // Check if membership already exists
      const existing = await prisma.membership.findUnique({
        where: {
          userId_organizationId: { userId, organizationId },
        },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          error: "User is already a member of this organization",
        });
      }

      const membership = await prisma.membership.create({
        data: {
          userId,
          organizationId,
          role,
          status: "ACTIVE",
        },
      });

      const response: ApiResponse<{
        id: string;
        role: string;
        status: string;
      }> = {
        success: true,
        data: {
          id: membership.id,
          role: membership.role,
          status: membership.status,
        },
      };

      res.status(201).json(response);
    } catch (error) {
      console.error("Add membership error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to add user to organization",
      });
    }
  }
);

// Remove user from organization (platform admin only)
router.delete(
  "/users/:userId/memberships/:orgId",
  authenticate,
  requirePlatformAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { userId, orgId } = req.params;

      const membership = await prisma.membership.findUnique({
        where: {
          userId_organizationId: { userId, organizationId: orgId },
        },
      });

      if (!membership) {
        return res.status(404).json({
          success: false,
          error: "Membership not found",
        });
      }

      await prisma.membership.delete({
        where: {
          userId_organizationId: { userId, organizationId: orgId },
        },
      });

      const response: ApiResponse<{ deleted: boolean }> = {
        success: true,
        data: { deleted: true },
      };

      res.json(response);
    } catch (error) {
      console.error("Remove membership error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to remove user from organization",
      });
    }
  }
);

// Update organization (platform admin only)
router.patch(
  "/organizations/:orgId",
  authenticate,
  requirePlatformAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { orgId } = req.params;
      const { name, description, slug, type } = req.body;

      if (!name && !description && !slug && type === undefined) {
        return res.status(400).json({
          success: false,
          error: "At least one field (name, description, slug, type) is required",
        });
      }

      if (type !== undefined && type !== null && !['neighborhood', 'school', 'company', 'friends'].includes(type)) {
        return res.status(400).json({
          success: false,
          error: "Type must be one of: neighborhood, school, company, friends",
        });
      }

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (slug !== undefined) updateData.slug = slug;
      if (type !== undefined) updateData.type = type;

      const org = await prisma.organization.update({
        where: { id: orgId },
        data: updateData,
        include: {
          _count: {
            select: { memberships: true, items: true },
          },
        },
      });

      const response: ApiResponse<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        type: string | null;
        memberCount: number;
        itemCount: number;
      }> = {
        success: true,
        data: {
          id: org.id,
          name: org.name,
          slug: org.slug,
          description: org.description,
          type: org.type ?? null,
          memberCount: org._count.memberships,
          itemCount: org._count.items,
        },
      };

      res.json(response);
    } catch (error) {
      console.error("Update organization error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update organization",
      });
    }
  }
);

// Delete organization (platform admin only)
router.delete(
  "/organizations/:orgId",
  authenticate,
  requirePlatformAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { orgId } = req.params;

      // Check if organization has items or active memberships
      const itemCount = await prisma.item.count({
        where: { organizationId: orgId },
      });

      if (itemCount > 0) {
        return res.status(400).json({
          success: false,
          error: "Cannot delete organization with items. Delete items first.",
        });
      }

      // Delete all memberships first
      await prisma.membership.deleteMany({
        where: { organizationId: orgId },
      });

      // Then delete the organization
      await prisma.organization.delete({
        where: { id: orgId },
      });

      const response: ApiResponse<{ deleted: boolean }> = {
        success: true,
        data: { deleted: true },
      };

      res.json(response);
    } catch (error) {
      console.error("Delete organization error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete organization",
      });
    }
  }
);

// Send test email (platform admin only)
router.post(
  "/send-test-email",
  authenticate,
  requirePlatformAdmin,
  async (req: AuthRequest, res: Response) => {
    const { to, subject, text } = req.body as { to?: string; subject?: string; text?: string };
    if (!to || !subject || !text) {
      return res.status(400).json({ success: false, error: "to, subject, and text are required" });
    }
    // Basic email validation
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(to)) {
      return res.status(400).json({ success: false, error: "Invalid email address" });
    }
    try {
      await emailService.sendEmail({ to, subject, text, event: "test" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to send email" });
    }
  },
);

// Email log (platform admin only)
router.get(
  "/email-logs",
  authenticate,
  requirePlatformAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const limit = Math.min(parseInt((req.query.limit as string) || '100'), 500);
      const logs = await prisma.emailLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      res.json({ success: true, data: logs });
    } catch (error) {
      console.error('Email log error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch email logs' });
    }
  },
);

// Audit log (platform admin only)
// Supports filtering: ?orgId=&action=&userId=&from=&to=&limit=
router.get(
  "/audit-logs",
  authenticate,
  requirePlatformAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const limit = Math.min(parseInt((req.query.limit as string) || '100'), 1000);
      const { orgId, action, userId, from, to } = req.query as Record<string, string | undefined>;

      const where: any = {};
      if (orgId) where.organizationId = orgId;
      if (action) where.action = { contains: action };
      if (userId) where.actorUserId = userId;
      if (from || to) {
        where.createdAt = {};
        if (from) where.createdAt.gte = new Date(from);
        if (to) where.createdAt.lte = new Date(to);
      }

      const logs = await prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          actor: { select: { id: true, name: true, email: true } },
          organization: { select: { id: true, name: true } },
        },
      });

      res.json({ success: true, data: logs });
    } catch (error) {
      console.error('Audit log error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch audit logs' });
    }
  },
);

export default router;
