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

const router: ExpressRouter = Router();

const MANAGER_ROLES = ['MANAGER', 'ADMIN', 'OWNER'];

function serializeItem(item: any): Item {
  const averageRating = item._avg?.rating || item.averageRating;
  const reviewCount = item._count?.reviews || item.reviewCount;

  return {
    id: item.id,
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
    manuals: item.manuals ?? undefined,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    averageRating: averageRating ? Number(averageRating.toFixed(1)) : undefined,
    reviewCount: reviewCount || undefined,
  };
}

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
        where.OR = [
          { name: { contains: q } },
          { description: { contains: q } },
          { tags: { some: { name: { contains: q } } } },
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
            _count: { select: { reviews: true } },
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
      const { id } = req.params;

      const [item, reviewAggregate] = await Promise.all([
        prisma.item.findFirst({
          where: { id, organizationId: req.organization!.id },
          include: {
            category: true,
            location: true,
            tags: true,
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

      const item = await prisma.item.create({
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
        include: { category: true, location: true, tags: true },
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
      const { id } = req.params;
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
      const { id } = req.params;
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
      const { id } = req.params;
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
        include: { category: true, location: true, tags: true, manuals: true },
      });

      res.json({ success: true, data: serializeItem(item) });
    } catch (error) {
      console.error("Update item error:", error);
      res.status(500).json({ success: false, error: "Failed to update item" });
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
      const { id } = req.params;
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
    const { id } = req.params;
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
    const { id } = req.params;
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
    const { id, manualId } = req.params;

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

export default router;
