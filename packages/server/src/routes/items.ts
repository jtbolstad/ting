import { Router } from 'express';
import type { Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { resolveOrganizationPublic, withOrganizationContext, requireOrgRole } from '../middleware/organization.js';
import type { Item, CreateItemInput, UpdateItemInput, ItemSearchParams, ApiResponse, PaginatedResponse } from '@ting/shared';

const router = Router();

function serializeItem(item: any): Item {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    categoryId: item.categoryId,
    category: item.category,
    status: item.status,
    imageUrl: item.imageUrl,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

// List/search items (requires organization context, public access allowed)
router.get('/', resolveOrganizationPublic, async (req: AuthRequest, res: Response) => {
  try {
    const { q, categoryId, status, page = 1, limit = 20 } = req.query as any;

    const where: any = {
      organizationId: req.organization!.id,
    };
    
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { description: { contains: q } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (status) {
      where.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        include: { category: true },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.item.count({ where }),
    ]);

    const response: ApiResponse<PaginatedResponse<Item>> = {
      success: true,
      data: {
        items: items.map(serializeItem),
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };

    res.json(response);
  } catch (error) {
    console.error('List items error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch items' });
  }
});

// Get item by ID (public)
router.get('/:id', resolveOrganizationPublic, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const item = await prisma.item.findFirst({
      where: { id, organizationId: req.organization!.id },
      include: { category: true },
    });

    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    const response: ApiResponse<Item> = {
      success: true,
      data: serializeItem(item),
    };

    res.json(response);
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch item' });
  }
});

// Create item (org manager+)
router.post('/', authenticate, withOrganizationContext(), requireOrgRole('MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, categoryId, imageUrl } = req.body as CreateItemInput;

    if (!name || !categoryId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name and categoryId are required' 
      });
    }

    // Ensure category belongs to organization
    const category = await prisma.category.findFirst({
      where: { id: categoryId, organizationId: req.organization!.id },
    });

    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found in this organization' });
    }

    const item = await prisma.item.create({
      data: {
        organizationId: req.organization!.id,
        name,
        description: description || null,
        categoryId,
        imageUrl: imageUrl || null,
        status: 'AVAILABLE',
      },
      include: { category: true },
    });

    const response: ApiResponse<Item> = {
      success: true,
      data: serializeItem(item),
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ success: false, error: 'Failed to create item' });
  }
});

// Update item (org manager+)
router.patch('/:id', authenticate, withOrganizationContext(), requireOrgRole('MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, categoryId, status, imageUrl } = req.body as UpdateItemInput;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description || null;
    if (categoryId) updateData.categoryId = categoryId;
    if (status) updateData.status = status;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null;

    const existing = await prisma.item.findUnique({ where: { id } });

    if (!existing || existing.organizationId !== req.organization!.id) {
      return res.status(404).json({ success: false, error: 'Item not found in this organization' });
    }

    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, organizationId: req.organization!.id },
      });
      if (!category) {
        return res.status(404).json({ success: false, error: 'Category not found in this organization' });
      }
    }

    const item = await prisma.item.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });

    const response: ApiResponse<Item> = {
      success: true,
      data: serializeItem(item),
    };

    res.json(response);
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ success: false, error: 'Failed to update item' });
  }
});

// Delete item (org admin+)
router.delete('/:id', authenticate, withOrganizationContext(), requireOrgRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.item.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== req.organization!.id) {
      return res.status(404).json({ success: false, error: 'Item not found in this organization' });
    }

    await prisma.item.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete item' });
  }
});

export default router;
