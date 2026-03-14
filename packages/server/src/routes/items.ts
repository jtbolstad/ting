import { Router } from 'express';
import type { Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticate, requireAdmin, type AuthRequest } from '../middleware/auth.js';
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

// List/search items (public)
router.get('/', async (req, res: Response) => {
  try {
    const { q, categoryId, status, page = 1, limit = 20 } = req.query as any;

    const where: any = {};
    
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
router.get('/:id', async (req, res: Response) => {
  try {
    const { id } = req.params;

    const item = await prisma.item.findUnique({
      where: { id },
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

// Create item (admin only)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, categoryId, imageUrl } = req.body as CreateItemInput;

    if (!name || !categoryId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name and categoryId are required' 
      });
    }

    const item = await prisma.item.create({
      data: {
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

// Update item (admin only)
router.patch('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, categoryId, status, imageUrl } = req.body as UpdateItemInput;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description || null;
    if (categoryId) updateData.categoryId = categoryId;
    if (status) updateData.status = status;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null;

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

// Delete item (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.item.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete item' });
  }
});

export default router;
