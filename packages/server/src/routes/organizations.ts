import type {
  ApiResponse,
  MemberGroup,
  Membership,
  Organization,
} from "@ting/shared";
import type { Router as ExpressRouter, Response } from "express";
import { Router } from "express";
import crypto from "crypto";
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
import {
  hashPassword,
  serializeMemberGroup,
  serializeMembership,
  serializeOrganization,
  serializeUser,
} from "../services/auth.js";

const router: ExpressRouter = Router();

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

router.get("/public", async (_req, res: Response) => {
  try {
    const organizations = await prisma.organization.findMany({
      orderBy: { name: "asc" },
    });

    const response: ApiResponse<Organization[]> = {
      success: true,
      data: organizations.map(serializeOrganization),
    };

    res.json(response);
  } catch (error) {
    console.error("List organizations error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch organizations" });
  }
});

router.use(authenticate);

router.get("/me", async (req: AuthRequest, res: Response) => {
  try {
    const memberships = await prisma.membership.findMany({
      where: { userId: req.user!.id, status: "ACTIVE" },
      include: {
        organization: true,
        groups: {
          include: { group: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const response: ApiResponse<Membership[]> = {
      success: true,
      data: memberships.map(serializeMembership),
    };

    res.json(response);
  } catch (error) {
    console.error("List memberships error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch memberships" });
  }
});

router.post("/", requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, slug, description, type } = req.body as {
      name?: string;
      slug?: string;
      description?: string;
      type?: string;
    };

    if (!name) {
      return res
        .status(400)
        .json({ success: false, error: "Name is required" });
    }

    if (type && !['neighborhood', 'school', 'company', 'friends'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: "Type must be one of: neighborhood, school, company, friends",
      });
    }

    const organization = await prisma.organization.create({
      data: {
        name,
        slug: slug || slugify(name),
        description: description || null,
        type: type || null,
      },
    });

    // Create default category
    await prisma.category.create({
      data: {
        organizationId: organization.id,
        name: "General",
        description: "Default category",
      },
    });

    const membership = await prisma.membership.create({
      data: {
        organizationId: organization.id,
        userId: req.user!.id,
        role: "OWNER",
        status: "ACTIVE",
        isDefault: true,
      },
      include: {
        organization: true,
        groups: {
          include: { group: true },
        },
      },
    });

    const response: ApiResponse<{
      organization: Organization;
      membership: Membership;
    }> = {
      success: true,
      data: {
        organization: serializeOrganization(organization),
        membership: serializeMembership(membership),
      },
    };

    res.status(201).json(response);
  } catch (error: any) {
    console.error("Create organization error:", error);
    if (error?.code === "P2002") {
      return res
        .status(409)
        .json({ success: false, error: "Organization slug already exists" });
    }
    res
      .status(500)
      .json({ success: false, error: "Failed to create organization" });
  }
});

// Update organization (OWNER/ADMIN only)
router.patch(
  "/:id",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { name, description, loanDurationDays } = req.body;

      const org = await prisma.organization.findUnique({ where: { id } });
      if (!org) {
        return res.status(404).json({ success: false, error: "Organization not found" });
      }

      // Check permission
      const membership = await prisma.membership.findFirst({
        where: {
          userId: req.user!.id,
          organizationId: id,
          status: "ACTIVE",
        },
      });

      if (req.user!.role !== "ADMIN" && (!membership || !["OWNER", "ADMIN"].includes(membership.role))) {
        return res.status(403).json({ success: false, error: "Only organization admins can edit" });
      }

      const updated = await prisma.organization.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(loanDurationDays && { loanDurationDays }),
        },
      });

      const response: ApiResponse<Organization> = {
        success: true,
        data: serializeOrganization(updated),
      };

      res.json(response);
    } catch (error) {
      console.error("Update organization error:", error);
      res.status(500).json({ success: false, error: "Failed to update organization" });
    }
  },
);

router.get(
  "/members",
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
          organization: true,
          groups: {
            include: { group: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const response: ApiResponse<any[]> = {
        success: true,
        data: memberships.map((membership: any) => ({
          membership: serializeMembership(membership),
          user: serializeUser(membership.user, [membership]),
        })),
      };

      res.json(response);
    } catch (error) {
      console.error("List members error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch members" });
    }
  },
);

router.post(
  "/members",
  withOrganizationContext(),
  requireOrgRole("ADMIN"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { email, role = "MEMBER" } = req.body as {
        email?: string;
        role?: string;
      };

      if (!email) {
        return res
          .status(400)
          .json({ success: false, error: "Email is required" });
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }

      const existing = await prisma.membership.findFirst({
        where: {
          userId: user.id,
          organizationId: req.organization!.id,
        },
      });

      let membership;
      if (existing) {
        membership = await prisma.membership.update({
          where: { id: existing.id },
          data: { role },
          include: {
            organization: true,
            groups: {
              include: { group: true },
            },
          },
        });
      } else {
        membership = await prisma.membership.create({
          data: {
            organizationId: req.organization!.id,
            userId: user.id,
            role,
            status: "ACTIVE",
          },
          include: {
            organization: true,
            groups: {
              include: { group: true },
            },
          },
        });
      }

      const response: ApiResponse<Membership> = {
        success: true,
        data: serializeMembership(membership),
      };

      res.status(existing ? 200 : 201).json(response);
    } catch (error) {
      console.error("Add member error:", error);
      res.status(500).json({ success: false, error: "Failed to add member" });
    }
  },
);

router.patch(
  "/members/:membershipId",
  withOrganizationContext(),
  requireOrgRole("ADMIN"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { membershipId } = req.params;
      const { role, status, isDefault } = req.body as {
        role?: string;
        status?: string;
        isDefault?: boolean;
      };

      const membership = await prisma.membership.findUnique({
        where: { id: membershipId },
        include: {
          organization: true,
          groups: {
            include: { group: true },
          },
        },
      });

      if (!membership || membership.organizationId !== req.organization!.id) {
        return res
          .status(404)
          .json({ success: false, error: "Membership not found" });
      }

      if (isDefault) {
        await prisma.membership.updateMany({
          where: {
            userId: membership.userId,
          },
          data: { isDefault: false },
        });
      }

      const updated = await prisma.membership.update({
        where: { id: membershipId },
        data: {
          role: role || membership.role,
          status: status || membership.status,
          isDefault: isDefault ?? membership.isDefault,
        },
        include: {
          organization: true,
          groups: {
            include: { group: true },
          },
        },
      });

      const response: ApiResponse<Membership> = {
        success: true,
        data: serializeMembership(updated),
      };

      res.json(response);
    } catch (error) {
      console.error("Update membership error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to update membership" });
    }
  },
);

router.get(
  "/groups",
  withOrganizationContext(),
  requireOrgRole("MANAGER"),
  async (req: AuthRequest, res: Response) => {
    try {
      const groups = await prisma.memberGroup.findMany({
        where: { organizationId: req.organization!.id },
        include: {
          _count: { select: { memberships: true } },
        },
        orderBy: { name: "asc" },
      });

      const response: ApiResponse<
        Array<MemberGroup & { memberCount: number }>
      > = {
        success: true,
        data: groups.map((group: any) => ({
          ...serializeMemberGroup(group),
          memberCount: group._count.memberships,
        })),
      };

      res.json(response);
    } catch (error) {
      console.error("List groups error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch groups" });
    }
  },
);

router.post(
  "/groups",
  withOrganizationContext(),
  requireOrgRole("ADMIN"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { name, description } = req.body as {
        name?: string;
        description?: string;
      };

      if (!name) {
        return res
          .status(400)
          .json({ success: false, error: "Name is required" });
      }

      const group = await prisma.memberGroup.create({
        data: {
          organizationId: req.organization!.id,
          name,
          description: description || null,
        },
      });

      const response: ApiResponse<MemberGroup> = {
        success: true,
        data: serializeMemberGroup(group),
      };

      res.status(201).json(response);
    } catch (error) {
      console.error("Create group error:", error);
      res.status(500).json({ success: false, error: "Failed to create group" });
    }
  },
);

router.patch(
  "/groups/:groupId",
  withOrganizationContext(),
  requireOrgRole("ADMIN"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { groupId } = req.params;
      const { name, description } = req.body as {
        name?: string;
        description?: string;
      };

      const group = await prisma.memberGroup.findUnique({ where: { id: groupId } });
      if (!group || group.organizationId !== req.organization!.id) {
        return res.status(404).json({ success: false, error: "Group not found" });
      }

      const updated = await prisma.memberGroup.update({
        where: { id: groupId },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
        },
      });

      const response: ApiResponse<MemberGroup> = {
        success: true,
        data: serializeMemberGroup(updated),
      };

      res.json(response);
    } catch (error) {
      console.error("Update group error:", error);
      res.status(500).json({ success: false, error: "Failed to update group" });
    }
  },
);

router.delete(
  "/groups/:groupId",
  withOrganizationContext(),
  requireOrgRole("ADMIN"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { groupId } = req.params;

      const group = await prisma.memberGroup.findUnique({ where: { id: groupId } });
      if (!group || group.organizationId !== req.organization!.id) {
        return res.status(404).json({ success: false, error: "Group not found" });
      }

      await prisma.memberGroup.delete({ where: { id: groupId } });

      res.json({ success: true });
    } catch (error) {
      console.error("Delete group error:", error);
      res.status(500).json({ success: false, error: "Failed to delete group" });
    }
  },
);

router.post(
  "/groups/:groupId/members",
  withOrganizationContext(),
  requireOrgRole("MANAGER"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { groupId } = req.params;
      const { membershipId } = req.body as { membershipId?: string };

      if (!membershipId) {
        return res
          .status(400)
          .json({ success: false, error: "membershipId is required" });
      }

      const [group, membership] = await Promise.all([
        prisma.memberGroup.findUnique({ where: { id: groupId } }),
        prisma.membership.findUnique({ where: { id: membershipId } }),
      ]);

      if (!group || group.organizationId !== req.organization!.id) {
        return res.status(404).json({
          success: false,
          error: "Group not found in this organization",
        });
      }

      if (!membership || membership.organizationId !== req.organization!.id) {
        return res.status(404).json({
          success: false,
          error: "Membership not found in this organization",
        });
      }

      await prisma.memberGroupMembership.upsert({
        where: {
          membershipId_groupId: {
            membershipId,
            groupId,
          },
        },
        update: {},
        create: {
          membershipId,
          groupId,
        },
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Add group member error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to add member to group" });
    }
  },
);

// Reset user password (org admin/owner)
router.post(
  "/members/:membershipId/reset-password",
  authenticate,
  withOrganizationContext(),
  requireOrgRole(["ADMIN", "OWNER"]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { membershipId } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          error: "newPassword is required and must be at least 6 characters",
        });
      }

      const membership = await prisma.membership.findUnique({
        where: { id: membershipId },
        include: { user: true },
      });

      if (!membership || membership.organizationId !== req.organization!.id) {
        return res.status(404).json({
          success: false,
          error: "Membership not found",
        });
      }

      // Prevent resetting owner password unless you are owner
      if (membership.role === "OWNER" && req.membership!.role !== "OWNER") {
        return res.status(403).json({
          success: false,
          error: "Cannot reset owner password",
        });
      }

      const passwordHash = await hashPassword(newPassword);
      await prisma.user.update({
        where: { id: membership.userId },
        data: { passwordHash },
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to reset password",
      });
    }
  },
);

// Send invitation
router.post(
  "/invitations/send",
  authenticate,
  withOrganizationContext(),
  requireOrgRole(["MEMBER", "MANAGER", "ADMIN", "OWNER"]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { email, role = "MEMBER" } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: "Email is required",
        });
      }

      // Validate: only ADMIN/OWNER can invite non-MEMBER roles
      if (role !== "MEMBER") {
        const inviterRole = req.membership!.role;
        if (inviterRole !== "ADMIN" && inviterRole !== "OWNER") {
          return res.status(403).json({
            success: false,
            error: "Only ADMIN or OWNER can invite non-MEMBER roles",
          });
        }
      }

      // Check if user already member
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        const existingMembership = await prisma.membership.findFirst({
          where: {
            userId: existingUser.id,
            organizationId: req.organization!.id,
          },
        });
        if (existingMembership) {
          return res.status(400).json({
            success: false,
            error: "User is already a member",
          });
        }
      }

      // Generate token
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      const invitation = await prisma.organizationInvitation.create({
        data: {
          organizationId: req.organization!.id,
          email,
          token,
          role,
          expiresAt,
          createdBy: req.user!.id,
        },
      });

      const inviteLink = `${process.env.CLIENT_URL || "http://localhost:5173"}/register?invite=${token}`;

      // Send invitation email
      try {
        const { emailService } = await import("../services/email.js");
        // Fetch inviter's full name from DB
        const inviter = await prisma.user.findUnique({
          where: { id: req.user!.id },
          select: { name: true },
        });
        await emailService.sendOrganizationInvitation(
          email,
          req.organization!.name,
          inviter?.name || req.user!.email,
          inviteLink,
          role,
        );
      } catch (emailError) {
        console.error("Failed to send invitation email:", emailError);
        // Don't fail request if email fails
      }

      res.status(201).json({
        success: true,
        data: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          inviteLink,
          expiresAt: invitation.expiresAt,
        },
      });
    } catch (error) {
      console.error("Send invitation error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to send invitation",
      });
    }
  },
);

// Get invitations for organization
router.get(
  "/invitations",
  authenticate,
  withOrganizationContext(),
  requireOrgRole("MANAGER"),
  async (req: AuthRequest, res: Response) => {
    try {
      const invitations = await prisma.organizationInvitation.findMany({
        where: {
          organizationId: req.organization!.id,
        },
        orderBy: { createdAt: "desc" },
      });

      res.json({
        success: true,
        data: invitations.map((inv) => ({
          id: inv.id,
          email: inv.email,
          role: inv.role,
          expiresAt: inv.expiresAt,
          usedAt: inv.usedAt,
          createdAt: inv.createdAt,
        })),
      });
    } catch (error) {
      console.error("Get invitations error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch invitations",
      });
    }
  },
);

// Get invitation details (public, no auth required)
router.get(
  "/invitations/:token",
  async (req: AuthRequest, res: Response) => {
    try {
      const { token } = req.params;

      const invitation = await prisma.organizationInvitation.findUnique({
        where: { token },
        include: { organization: true },
      });

      if (!invitation) {
        return res.status(404).json({
          success: false,
          error: "Invitation not found",
        });
      }

      if (invitation.usedAt) {
        return res.status(400).json({
          success: false,
          error: "Invitation already used",
        });
      }

      if (new Date() > invitation.expiresAt) {
        return res.status(400).json({
          success: false,
          error: "Invitation expired",
        });
      }

      res.json({
        success: true,
        data: {
          email: invitation.email,
          organizationName: invitation.organization.name,
          role: invitation.role,
        },
      });
    } catch (error) {
      console.error("Get invitation error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch invitation",
      });
    }
  },
);

// Accept invitation (public, no org context)
router.post(
  "/invitations/:token/accept",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { token } = req.params;

      const invitation = await prisma.organizationInvitation.findUnique({
        where: { token },
        include: { organization: true },
      });

      if (!invitation) {
        return res.status(404).json({
          success: false,
          error: "Invitation not found",
        });
      }

      if (invitation.usedAt) {
        return res.status(400).json({
          success: false,
          error: "Invitation already used",
        });
      }

      if (new Date() > invitation.expiresAt) {
        return res.status(400).json({
          success: false,
          error: "Invitation expired",
        });
      }

      // Check if user already member
      const existingMembership = await prisma.membership.findFirst({
        where: {
          userId: req.user!.id,
          organizationId: invitation.organizationId,
        },
      });

      if (existingMembership) {
        return res.status(400).json({
          success: false,
          error: "Already a member of this organization",
        });
      }

      // Create membership
      const membership = await prisma.membership.create({
        data: {
          userId: req.user!.id,
          organizationId: invitation.organizationId,
          role: invitation.role,
          status: "ACTIVE",
        },
        include: {
          organization: true,
          groups: {
            include: { group: true },
          },
        },
      });

      // Mark invitation as used
      await prisma.organizationInvitation.update({
        where: { id: invitation.id },
        data: { usedAt: new Date() },
      });

      res.json({
        success: true,
        data: {
          membership: serializeMembership(membership),
          organization: serializeOrganization(invitation.organization),
        },
      });
    } catch (error) {
      console.error("Accept invitation error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to accept invitation",
      });
    }
  },
);

export default router;
