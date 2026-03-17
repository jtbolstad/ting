import type {
  ApiResponse,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@ting/shared";
import type { Router as ExpressRouter, Response } from "express";
import { Router } from "express";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import {
  requireOrgRole,
  resolveOrganizationPublic,
  withOrganizationContext,
} from "../middleware/organization.js";
import { prisma } from "../prisma.js";

const router: ExpressRouter = Router();

// List all categories (public)
router.get(
  "/",
  resolveOrganizationPublic,
  async (req: AuthRequest, res: Response) => {
    try {
      const categories = await prisma.category.findMany({
        where: {
          organizationId: req.organization!.id,
        },
        include: {
          _count: {
            select: { items: true },
          },
        },
        orderBy: { name: "asc" },
      });

      const serialized = categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        parentId: cat.parentId,
        itemCount: cat._count.items,
      }));

      const response: ApiResponse<any[]> = {
        success: true,
        data: serialized,
      };

      res.json(response);
    } catch (error) {
      console.error("List categories error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch categories" });
    }
  },
);

// Get category by ID (public)
router.get(
  "/:id",
  resolveOrganizationPublic,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const category = await prisma.category.findFirst({
        where: { id, organizationId: req.organization!.id },
        include: {
          children: true,
          parent: true,
          _count: {
            select: { items: true },
          },
        },
      });

      if (!category) {
        return res
          .status(404)
          .json({ success: false, error: "Category not found" });
      }

      const serialized = {
        id: category.id,
        name: category.name,
        description: category.description,
        parentId: category.parentId,
        children: category.children,
        itemCount: category._count.items,
      };

      const response: ApiResponse<any> = {
        success: true,
        data: serialized,
      };

      res.json(response);
    } catch (error) {
      console.error("Get category error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch category" });
    }
  },
);

// Create category (org manager+)
router.post(
  "/",
  authenticate,
  withOrganizationContext(),
  requireOrgRole("MANAGER"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { name, description, parentId } = req.body as CreateCategoryInput;

      if (!name) {
        return res
          .status(400)
          .json({ success: false, error: "Name is required" });
      }

      if (parentId) {
        const parent = await prisma.category.findFirst({
          where: { id: parentId, organizationId: req.organization!.id },
        });
        if (!parent) {
          return res.status(404).json({
            success: false,
            error: "Parent category not found in this organization",
          });
        }
      }

      const category = await prisma.category.create({
        data: {
          organizationId: req.organization!.id,
          name,
          description: description || null,
          parentId: parentId || null,
        },
      });

      const response: ApiResponse<any> = {
        success: true,
        data: category,
      };

      res.status(201).json(response);
    } catch (error) {
      console.error("Create category error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to create category" });
    }
  },
);

// Update category (org manager+)
router.patch(
  "/:id",
  authenticate,
  withOrganizationContext(),
  requireOrgRole("MANAGER"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { name, description, parentId } = req.body as UpdateCategoryInput;

      const updateData: any = {};
      if (name) updateData.name = name;
      if (description !== undefined)
        updateData.description = description || null;
      if (parentId !== undefined) updateData.parentId = parentId || null;

      const existing = await prisma.category.findUnique({ where: { id } });
      if (!existing || existing.organizationId !== req.organization!.id) {
        return res.status(404).json({
          success: false,
          error: "Category not found in this organization",
        });
      }

      if (parentId) {
        const parent = await prisma.category.findFirst({
          where: { id: parentId, organizationId: req.organization!.id },
        });
        if (!parent) {
          return res.status(404).json({
            success: false,
            error: "Parent category not found in this organization",
          });
        }
      }

      const category = await prisma.category.update({
        where: { id },
        data: updateData,
      });

      const response: ApiResponse<any> = {
        success: true,
        data: category,
      };

      res.json(response);
    } catch (error) {
      console.error("Update category error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to update category" });
    }
  },
);

// Delete category (org admin+)
router.delete(
  "/:id",
  authenticate,
  withOrganizationContext(),
  requireOrgRole("ADMIN"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Check if category has items
      const category = await prisma.category.findUnique({
        where: { id },
        include: { _count: { select: { items: true } } },
      });

      if (!category || category.organizationId !== req.organization!.id) {
        return res
          .status(404)
          .json({ success: false, error: "Category not found" });
      }

      if (category._count.items > 0) {
        return res.status(400).json({
          success: false,
          error: "Cannot delete category with items",
        });
      }

      await prisma.category.delete({ where: { id } });

      res.json({ success: true });
    } catch (error) {
      console.error("Delete category error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to delete category" });
    }
  },
);

export default router;
