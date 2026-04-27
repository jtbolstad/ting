import type {
  ApiResponse,
  CreateItemInput,
  CreateManualInput,
  Item,
  PaginatedResponse,
  UpdateItemInput,
} from "@ting/shared";
import type { Router as ExpressRouter, Response } from "express";
import { Router } from "express";
import { authenticate, optionalAuthenticate, type AuthRequest } from "../middleware/auth.js";
import {
  hasOrgRole,
  requireOrgRole,
  resolveOrganizationPublic,
  withOrganizationContext,
} from "../middleware/organization.js";
import { prisma } from "../prisma.js";
import { emailService } from "../services/email.js";
import { audit } from "../services/auditLog.js";

const router: ExpressRouter = Router();

const MANAGER_ROLES = ['MANAGER', 'ADMIN', 'OWNER'];

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function generateSlug(name: string, id: string): string {
  return `${toSlug(name)}-${id.slice(-6)}`;
}

async function resolveItemId(slugOrId: string, orgId: string): Promise<string | null> {
  const item = await prisma.item.findFirst({
    where: { organizationId: orgId, OR: [{ id: slugOrId }, { slug: slugOrId }] },
    select: { id: true },
  });
  return item?.id ?? null;
}

function serializeItem(item: any): Item {
  const averageRating = item._avg?.rating || item.averageRating;
  const reviewCount = item._count?.reviews || item.reviewCount;

  return {
    id: item.id,
    slug: item.slug ?? undefined,
    name: item.name,
    description: item.description,
    categoryId: item.categoryId,
    category: item.category,
    status: item.status,
    imageUrl: item.imageUrl,
    locationId: item.locationId ?? null,
    location: item.location ?? undefined,
    ownerId: item.ownerId ?? null,
    ownerType: item.ownerType ?? 'ORGANIZATION',
    approvalStatus: item.approvalStatus ?? 'APPROVED',
    rejectionNote: item.rejectionNote ?? null,
    condition: item.condition ?? null,
    tags: item.tags ? item.tags.map((t: any) => t.name) : undefined,
    images: item.images ?? undefined,
    manuals: item.manuals ?? undefined,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    averageRating: averageRating ? Number(averageRating.toFixed(1)) : undefined,
    reviewCount: reviewCount || undefined,
    nextAvailableDate: item.loans && item.loans.length > 0 ? item.loans[0].dueDate.toISOString() : null,
  } as Item;
}

// Get user's own pending/rejected items
router.get(
  "/my-pending",
  authenticate,
  withOrganizationContext(),
  async (req: AuthRequest, res: Response) => {
    try {
      const items = await prisma.item.findMany({
        where: {
          organizationId: req.organization!.id,
          ownerId: req.user!.id,
          approvalStatus: { in: ['PENDING', 'REJECTED'] },
        },
        include: { category: true, location: true, tags: true, images: { orderBy: { position: 'asc' as const } } },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ success: true, data: items.map(serializeItem) });
    } catch (error) {
      console.error("My pending items error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch pending items" });
    }
  },
);

// List/search items
router.get(
  "/",
  optionalAuthenticate,
  resolveOrganizationPublic,
  async (req: AuthRequest, res: Response) => {
    try {
      const { q, categoryId, locationId, status, approvalStatus, page = 1, limit = 20 } = req.query as any;

      const isManager = req.user && req.membership && MANAGER_ROLES.includes(req.membership.role);
      const isPlatformAdmin = req.user?.role === 'ADMIN';

      const where: any = { organizationId: req.organization!.id };

      if (q) {
        const tagMatches = await prisma.itemTag.findMany({
          where: {
            name: { contains: q },
            item: { organizationId: req.organization!.id },
          },
          select: { itemId: true },
        });
        const tagItemIds = tagMatches.map((t) => t.itemId);

        where.OR = [
          { name: { contains: q } },
          { description: { contains: q } },
          ...(tagItemIds.length > 0 ? [{ id: { in: tagItemIds } }] : []),
        ];
      }
      if (categoryId) where.categoryId = categoryId;
      if (locationId) where.locationId = locationId;
      if (status) where.status = status;

      // Approval filter: admins can filter freely, others only see APPROVED
      if (isManager || isPlatformAdmin) {
        if (approvalStatus) where.approvalStatus = approvalStatus;
        else where.approvalStatus = 'APPROVED';
      } else {
        where.approvalStatus = 'APPROVED';
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const [items, total] = await Promise.all([
        prisma.item.findMany({
          where,
          include: {
            category: true,
            location: true,
            tags: true,
            images: { orderBy: { position: 'asc' as const } },
            _count: { select: { reviews: true } },
            loans: {
              where: { returnedAt: null },
              orderBy: { dueDate: 'asc' as const },
              take: 1,
            },
          },
          skip,
          take,
          orderBy: { createdAt: "desc" },
        }),
        prisma.item.count({ where }),
      ]);

      const itemIds = items.map((item) => item.id);
      const reviewAggregates = await prisma.review.groupBy({
        by: ["itemId"],
        where: { itemId: { in: itemIds } },
        _avg: { rating: true },
      });
      const reviewMap = new Map(reviewAggregates.map((agg: any) => [agg.itemId, agg._avg.rating]));

      const itemsWithStats = items.map((item: any) => ({
        ...item,
        averageRating: reviewMap.get(item.id),
        reviewCount: item._count.reviews,
      }));

      const response: ApiResponse<PaginatedResponse<Item>> = {
        success: true,
        data: {
          items: itemsWithStats.map(serializeItem),
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      };

      res.json(response);
    } catch (error) {
      console.error("List items error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch items" });
    }
  },
);

// Get item by ID (public)
router.get(
  "/:id",
  optionalAuthenticate,
  resolveOrganizationPublic,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id: slugOrId } = req.params;
      const id = await resolveItemId(slugOrId, req.organization!.id) ?? slugOrId;

      const [item, reviewAggregate] = await Promise.all([
        prisma.item.findFirst({
          where: { id, organizationId: req.organization!.id },
          include: {
            category: true,
            location: true,
            tags: true,
            images: { orderBy: { position: 'asc' as const } },
            manuals: { orderBy: { createdAt: 'asc' } },
            _count: { select: { reviews: true } },
          },
        }),
        prisma.review.aggregate({
          where: { itemId: id },
          _avg: { rating: true },
        }),
      ]);

      if (!item) {
        return res.status(404).json({ success: false, error: "Item not found" });
      }

      const isManager = req.user && req.membership && MANAGER_ROLES.includes(req.membership.role);
      const isPlatformAdmin = req.user?.role === 'ADMIN';
      const isOwner = req.user && item.ownerId === req.user.id;

      if (item.approvalStatus !== 'APPROVED' && !isManager && !isPlatformAdmin && !isOwner) {
        return res.status(404).json({ success: false, error: "Item not found" });
      }

      const itemWithStats = {
        ...item,
        averageRating: reviewAggregate._avg.rating,
        reviewCount: item._count.reviews,
      };

      res.json({ success: true, data: serializeItem(itemWithStats) });
    } catch (error) {
      console.error("Get item error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch item" });
    }
  },
);

// Create item
router.post(
  "/",
  authenticate,
  withOrganizationContext(),
  requireOrgRole("MEMBER"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { name, description, categoryId, imageUrl, locationId, tags } = req.body as CreateItemInput;

      if (!name || !categoryId) {
        return res.status(400).json({ success: false, error: "Name and categoryId are required" });
      }

      const category = await prisma.category.findFirst({
        where: { id: categoryId, organizationId: req.organization!.id },
      });
      if (!category) {
        return res.status(404).json({ success: false, error: "Category not found in this organization" });
      }

      if (locationId) {
        const loc = await prisma.location.findFirst({ where: { id: locationId, organizationId: req.organization!.id } });
        if (!loc) return res.status(404).json({ success: false, error: "Location not found" });
      }

      const isManager = hasOrgRole(req, 'MANAGER');
      const approvalStatus = isManager ? 'APPROVED' : 'PENDING';
      const ownerType = isManager ? 'ORGANIZATION' : 'MEMBER';
      const ownerId = isManager ? null : req.user!.id;

      const created = await prisma.item.create({
        data: {
          organizationId: req.organization!.id,
          name,
          description: description || null,
          categoryId,
          imageUrl: imageUrl || null,
          locationId: locationId || null,
          status: 'AVAILABLE',
          ownerType,
          ownerId,
          approvalStatus,
          tags: tags && tags.length > 0
            ? { create: tags.map((t: string) => ({ name: t.toLowerCase().trim() })) }
            : undefined,
        },
        select: { id: true },
      });
      const item = await prisma.item.update({
        where: { id: created.id },
        data: { slug: generateSlug(name, created.id) },
        include: { category: true, location: true, tags: true, images: true },
      });

      // Notify admins if pending approval
      if (approvalStatus === 'PENDING') {
        const admins = await prisma.membership.findMany({
          where: {
            organizationId: req.organization!.id,
            status: 'ACTIVE',
            role: { in: ['MANAGER', 'ADMIN', 'OWNER'] },
          },
          include: { user: true },
        });
        const adminEmails = admins.map((m: any) => m.user.email);
        if (adminEmails.length > 0) {
          prisma.user.findUnique({ where: { id: req.user!.id } }).then((u) => {
            emailService.sendApprovalRequest(
              adminEmails,
              u?.name ?? req.user!.email,
              name,
              req.organization!.name,
            ).catch((e) => console.error('Failed to send approval request email:', e));
          });
        }
      }

      audit({ organizationId: req.organization!.id, actorUserId: req.user!.id, action: "item.created", entityType: "Item", entityId: item.id, metadata: { name: item.name, ownerType: item.ownerType } });
      res.status(201).json({ success: true, data: serializeItem(item) });
    } catch (error) {
      console.error("Create item error:", error);
      res.status(500).json({ success: false, error: "Failed to create item" });
    }
  },
);

// Approve item (MANAGER+)
router.post(
  "/:id/approve",
  authenticate,
  withOrganizationContext(),
  requireOrgRole("MANAGER"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id: slugOrId } = req.params;
      const id = await resolveItemId(slugOrId, req.organization!.id) ?? slugOrId;
      const existing = await prisma.item.findFirst({ where: { id, organizationId: req.organization!.id } });
      if (!existing) return res.status(404).json({ success: false, error: "Item not found" });
      if (existing.approvalStatus !== 'PENDING') {
        return res.status(400).json({ success: false, error: "Item is not pending approval" });
      }

      const item = await prisma.item.update({
        where: { id },
        data: { approvalStatus: 'APPROVED', rejectionNote: null },
        include: { category: true, location: true, manuals: true },
      });

      // Notify owner
      if (existing.ownerId) {
        const owner = await prisma.user.findUnique({ where: { id: existing.ownerId } });
        if (owner) {
          emailService.sendItemApproved(owner.email, owner.name, existing.name, req.organization!.name)
            .catch((e) => console.error('Failed to send approval email:', e));
        }
      }

      audit({ organizationId: req.organization!.id, actorUserId: req.user!.id, action: "item.approved", entityType: "Item", entityId: item.id, metadata: { name: item.name } });
      res.json({ success: true, data: serializeItem(item) });
    } catch (error) {
      console.error("Approve item error:", error);
      res.status(500).json({ success: false, error: "Failed to approve item" });
    }
  },
);

// Reject item (MANAGER+)
router.post(
  "/:id/reject",
  authenticate,
  withOrganizationContext(),
  requireOrgRole("MANAGER"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id: slugOrId } = req.params;
      const id = await resolveItemId(slugOrId, req.organization!.id) ?? slugOrId;
      const { note } = req.body;

      const existing = await prisma.item.findFirst({ where: { id, organizationId: req.organization!.id } });
      if (!existing) return res.status(404).json({ success: false, error: "Item not found" });
      if (existing.approvalStatus !== 'PENDING') {
        return res.status(400).json({ success: false, error: "Item is not pending approval" });
      }

      const item = await prisma.item.update({
        where: { id },
        data: { approvalStatus: 'REJECTED', rejectionNote: note || null },
        include: { category: true, location: true, manuals: true },
      });

      // Notify owner
      if (existing.ownerId) {
        const owner = await prisma.user.findUnique({ where: { id: existing.ownerId } });
        if (owner) {
          emailService.sendItemRejected(owner.email, owner.name, existing.name, req.organization!.name, note)
            .catch((e) => console.error('Failed to send rejection email:', e));
        }
      }

      audit({ organizationId: req.organization!.id, actorUserId: req.user!.id, action: "item.rejected", entityType: "Item", entityId: item.id, metadata: { name: item.name, note } });
      res.json({ success: true, data: serializeItem(item) });
    } catch (error) {
      console.error("Reject item error:", error);
      res.status(500).json({ success: false, error: "Failed to reject item" });
    }
  },
);

// Update item
router.patch(
  "/:id",
  authenticate,
  withOrganizationContext(),
  requireOrgRole("MEMBER"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id: slugOrId } = req.params;
      const id = await resolveItemId(slugOrId, req.organization!.id) ?? slugOrId;
      const { name, description, categoryId, status, imageUrl, locationId, condition, tags } = req.body as UpdateItemInput;

      const existing = await prisma.item.findUnique({ where: { id } });
      if (!existing || existing.organizationId !== req.organization!.id) {
        return res.status(404).json({ success: false, error: "Item not found in this organization" });
      }

      // Only owner or MANAGER+ can edit
      const isManager = hasOrgRole(req, 'MANAGER');
      const isPlatformAdmin = req.user?.role === 'ADMIN';
      const isOwner = existing.ownerId === req.user!.id;
      if (!isManager && !isPlatformAdmin && !isOwner) {
        return res.status(403).json({ success: false, error: "Kun eier eller administrator kan redigere dette tinget" });
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description || null;
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null;
      if (locationId !== undefined) updateData.locationId = locationId || null;
      if (status && (isManager || isPlatformAdmin)) updateData.status = status;
      if (condition !== undefined && (isManager || isPlatformAdmin)) updateData.condition = condition || null;

      if (categoryId) {
        const category = await prisma.category.findFirst({
          where: { id: categoryId, organizationId: req.organization!.id },
        });
        if (!category) return res.status(404).json({ success: false, error: "Category not found" });
        updateData.categoryId = categoryId;
      }

      if (tags !== undefined) {
        await prisma.itemTag.deleteMany({ where: { itemId: id } });
        if (tags.length > 0) {
          await prisma.itemTag.createMany({
            data: tags.map((t: string) => ({ itemId: id, name: t.toLowerCase().trim() })),
          });
        }
      }

      const item = await prisma.item.update({
        where: { id },
        data: updateData,
        include: { category: true, location: true, tags: true, images: { orderBy: { position: 'asc' as const } }, manuals: true },
      });

      audit({ organizationId: req.organization!.id, actorUserId: req.user!.id, action: "item.updated", entityType: "Item", entityId: item.id, metadata: { changedFields: Object.keys(updateData) } });
      res.json({ success: true, data: serializeItem(item) });
    } catch (error) {
      console.error("Update item error:", error);
      res.status(500).json({ success: false, error: "Failed to update item" });
    }
  },
);

// Status transition (MANAGER+)
const VALID_TRANSITIONS: Record<string, string[]> = {
  AVAILABLE: ['MAINTENANCE', 'RETIRED'],
  CHECKED_OUT: ['AVAILABLE', 'MAINTENANCE'],
  MAINTENANCE: ['AVAILABLE', 'RETIRED'],
  RETIRED: ['AVAILABLE'],
};

router.patch(
  "/:id/status",
  authenticate,
  withOrganizationContext(),
  requireOrgRole("MANAGER"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id: slugOrId } = req.params;
      const id = await resolveItemId(slugOrId, req.organization!.id) ?? slugOrId;
      const { status } = req.body as { status: string };

      if (!status) {
        return res.status(400).json({ success: false, error: "Status is required" });
      }

      const existing = await prisma.item.findFirst({ where: { id, organizationId: req.organization!.id } });
      if (!existing) return res.status(404).json({ success: false, error: "Item not found" });

      const allowed = VALID_TRANSITIONS[existing.status] ?? [];
      if (!allowed.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid transition from ${existing.status} to ${status}. Allowed: ${allowed.join(', ') || 'none'}`,
        });
      }

      const item = await prisma.item.update({
        where: { id },
        data: { status: status as any },
        include: { category: true, location: true, tags: true, images: { orderBy: { position: 'asc' as const } } },
      });

      audit({
        organizationId: req.organization!.id,
        actorUserId: req.user!.id,
        action: "item.status_changed",
        entityType: "Item",
        entityId: item.id,
        metadata: { fromStatus: existing.status, toStatus: status },
      });

      res.json({ success: true, data: serializeItem(item) });
    } catch (error) {
      console.error("Status transition error:", error);
      res.status(500).json({ success: false, error: "Failed to update item status" });
    }
  },
);

// Delete item (admin or owner)
router.delete(
  "/:id",
  authenticate,
  withOrganizationContext(),
  requireOrgRole("MEMBER"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id: slugOrId } = req.params;
      const id = await resolveItemId(slugOrId, req.organization!.id) ?? slugOrId;
      const existing = await prisma.item.findUnique({ where: { id } });
      if (!existing || existing.organizationId !== req.organization!.id) {
        return res.status(404).json({ success: false, error: "Item not found in this organization" });
      }

      const isManager = hasOrgRole(req, 'ADMIN');
      const isPlatformAdmin = req.user?.role === 'ADMIN';
      const isOwner = existing.ownerId === req.user!.id;
      if (!isManager && !isPlatformAdmin && !isOwner) {
        return res.status(403).json({ success: false, error: "Utilstrekkelige rettigheter" });
      }

      await prisma.item.delete({ where: { id } });
      audit({ organizationId: req.organization!.id, actorUserId: req.user!.id, action: "item.deleted", entityType: "Item", entityId: id, metadata: { name: existing.name } });
      res.json({ success: true });
    } catch (error) {
      console.error("Delete item error:", error);
      res.status(500).json({ success: false, error: "Failed to delete item" });
    }
  },
);

// --- Manuals ---

// List manuals for item (public)
router.get("/:id/manuals", resolveOrganizationPublic, async (req: AuthRequest, res: Response) => {
  try {
    const { id: slugOrId } = req.params;
    const id = await resolveItemId(slugOrId, req.organization!.id) ?? slugOrId;
    const item = await prisma.item.findFirst({ where: { id, organizationId: req.organization!.id } });
    if (!item) return res.status(404).json({ success: false, error: "Item not found" });

    const manuals = await prisma.itemManual.findMany({
      where: { itemId: id },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: manuals });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch manuals" });
  }
});

// Add manual (owner or MANAGER+)
router.post("/:id/manuals", authenticate, withOrganizationContext(), requireOrgRole("MEMBER"), async (req: AuthRequest, res: Response) => {
  try {
    const { id: slugOrId } = req.params;
    const id = await resolveItemId(slugOrId, req.organization!.id) ?? slugOrId;
    const { type, label, url, content } = req.body as CreateManualInput;

    if (!type || !label) return res.status(400).json({ success: false, error: "Type og label er påkrevd" });
    if (!['PDF', 'LINK', 'TEXT'].includes(type)) return res.status(400).json({ success: false, error: "Type må være PDF, LINK eller TEXT" });

    const item = await prisma.item.findFirst({ where: { id, organizationId: req.organization!.id } });
    if (!item) return res.status(404).json({ success: false, error: "Item not found" });

    const isManager = hasOrgRole(req, 'MANAGER');
    const isPlatformAdmin = req.user?.role === 'ADMIN';
    const isOwner = item.ownerId === req.user!.id;
    if (!isManager && !isPlatformAdmin && !isOwner) {
      return res.status(403).json({ success: false, error: "Kun eier eller administrator kan legge til manualer" });
    }

    const manual = await prisma.itemManual.create({
      data: { itemId: id, type, label, url: url || null, content: content || null },
    });
    res.status(201).json({ success: true, data: manual });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to add manual" });
  }
});

// Delete manual (owner or MANAGER+)
router.delete("/:id/manuals/:manualId", authenticate, withOrganizationContext(), requireOrgRole("MEMBER"), async (req: AuthRequest, res: Response) => {
  try {
    const { id: slugOrId, manualId } = req.params;
    const id = await resolveItemId(slugOrId, req.organization!.id) ?? slugOrId;

    const item = await prisma.item.findFirst({ where: { id, organizationId: req.organization!.id } });
    if (!item) return res.status(404).json({ success: false, error: "Item not found" });

    const isManager = hasOrgRole(req, 'MANAGER');
    const isPlatformAdmin = req.user?.role === 'ADMIN';
    const isOwner = item.ownerId === req.user!.id;
    if (!isManager && !isPlatformAdmin && !isOwner) {
      return res.status(403).json({ success: false, error: "Utilstrekkelige rettigheter" });
    }

    await prisma.itemManual.delete({ where: { id: manualId } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to delete manual" });
  }
});

// --- Images ---

// Add image to item
router.post("/:id/images", authenticate, withOrganizationContext(), async (req: AuthRequest, res: Response) => {
  try {
    const { id: slugOrId } = req.params;
    const id = await resolveItemId(slugOrId, req.organization!.id) ?? slugOrId;
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, error: "url is required" });

    const item = await prisma.item.findFirst({ where: { id, organizationId: req.organization!.id } });
    if (!item) return res.status(404).json({ success: false, error: "Item not found" });

    const isManager = hasOrgRole(req, 'MANAGER');
    const isPlatformAdmin = req.user?.role === 'ADMIN';
    if (!isManager && !isPlatformAdmin && item.ownerId !== req.user!.id) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const count = await prisma.itemImage.count({ where: { itemId: id } });
    const image = await prisma.itemImage.create({ data: { itemId: id, url, position: count } });
    res.status(201).json({ success: true, data: image });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to add image" });
  }
});

// Delete image from item
router.delete("/:id/images/:imageId", authenticate, withOrganizationContext(), async (req: AuthRequest, res: Response) => {
  try {
    const { id: slugOrId, imageId } = req.params;
    const id = await resolveItemId(slugOrId, req.organization!.id) ?? slugOrId;

    const item = await prisma.item.findFirst({ where: { id, organizationId: req.organization!.id } });
    if (!item) return res.status(404).json({ success: false, error: "Item not found" });

    const isManager = hasOrgRole(req, 'MANAGER');
    const isPlatformAdmin = req.user?.role === 'ADMIN';
    if (!isManager && !isPlatformAdmin && item.ownerId !== req.user!.id) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    await prisma.itemImage.delete({ where: { id: imageId } });

    // Reindex remaining images
    const remaining = await prisma.itemImage.findMany({ where: { itemId: id }, orderBy: { position: 'asc' } });
    await Promise.all(remaining.map((img, i) => prisma.itemImage.update({ where: { id: img.id }, data: { position: i } })));

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to delete image" });
  }
});

// Reorder images (send full ordered array of ids)
router.patch("/:id/images/reorder", authenticate, withOrganizationContext(), async (req: AuthRequest, res: Response) => {
  try {
    const { id: slugOrId } = req.params;
    const id = await resolveItemId(slugOrId, req.organization!.id) ?? slugOrId;
    const { imageIds } = req.body as { imageIds: string[] };
    if (!Array.isArray(imageIds)) return res.status(400).json({ success: false, error: "imageIds must be an array" });

    const item = await prisma.item.findFirst({ where: { id, organizationId: req.organization!.id } });
    if (!item) return res.status(404).json({ success: false, error: "Item not found" });

    const isManager = hasOrgRole(req, 'MANAGER');
    const isPlatformAdmin = req.user?.role === 'ADMIN';
    if (!isManager && !isPlatformAdmin && item.ownerId !== req.user!.id) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    await Promise.all(imageIds.map((imgId, i) => prisma.itemImage.update({ where: { id: imgId }, data: { position: i } })));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to reorder images" });
  }
});

export default router;
