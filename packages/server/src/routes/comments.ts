import { Router } from 'express';
import type { Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { resolveOrganizationPublic, withOrganizationContext } from '../middleware/organization.js';
import type { Comment, CreateCommentInput, UpdateCommentInput, ApiResponse } from '@ting/shared';

const router = Router();

function serializeComment(comment: any): Comment {
  return {
    id: comment.id,
    itemId: comment.itemId,
    userId: comment.userId,
    user: comment.user ? {
      id: comment.user.id,
      email: comment.user.email,
      name: comment.user.name,
      role: comment.user.role,
      createdAt: comment.user.createdAt.toISOString(),
      updatedAt: comment.user.updatedAt.toISOString(),
    } : undefined,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
  };
}

// Get comments for an item (public)
router.get('/item/:itemId', resolveOrganizationPublic, async (req: AuthRequest, res: Response) => {
  try {
    const { itemId } = req.params;

    // Verify item exists and belongs to organization
    const item = await prisma.item.findFirst({
      where: { id: itemId, organizationId: req.organization!.id },
    });

    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    const comments = await prisma.comment.findMany({
      where: { itemId, organizationId: req.organization!.id },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });

    const response: ApiResponse<Comment[]> = {
      success: true,
      data: comments.map(serializeComment),
    };

    res.json(response);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch comments' });
  }
});

// Create comment (authenticated users only)
router.post('/', authenticate, withOrganizationContext(), async (req: AuthRequest, res: Response) => {
  try {
    const { itemId, content } = req.body as CreateCommentInput;

    if (!itemId || !content || content.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Item ID and content are required' 
      });
    }

    // Verify item exists and belongs to organization
    const item = await prisma.item.findFirst({
      where: { id: itemId, organizationId: req.organization!.id },
    });

    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    const comment = await prisma.comment.create({
      data: {
        organizationId: req.organization!.id,
        itemId,
        userId: req.user!.id,
        content: content.trim(),
      },
      include: { user: true },
    });

    const response: ApiResponse<Comment> = {
      success: true,
      data: serializeComment(comment),
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ success: false, error: 'Failed to create comment' });
  }
});

// Update comment (own comments only)
router.patch('/:id', authenticate, withOrganizationContext(), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body as UpdateCommentInput;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Content is required' 
      });
    }

    // Find comment and verify ownership
    const existingComment = await prisma.comment.findFirst({
      where: { id, organizationId: req.organization!.id },
    });

    if (!existingComment) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    if (existingComment.userId !== req.user!.id) {
      return res.status(403).json({ success: false, error: 'You can only edit your own comments' });
    }

    const comment = await prisma.comment.update({
      where: { id },
      data: { content: content.trim() },
      include: { user: true },
    });

    const response: ApiResponse<Comment> = {
      success: true,
      data: serializeComment(comment),
    };

    res.json(response);
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ success: false, error: 'Failed to update comment' });
  }
});

// Delete comment (own comments only)
router.delete('/:id', authenticate, withOrganizationContext(), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Find comment and verify ownership
    const existingComment = await prisma.comment.findFirst({
      where: { id, organizationId: req.organization!.id },
    });

    if (!existingComment) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    if (existingComment.userId !== req.user!.id) {
      return res.status(403).json({ success: false, error: 'You can only delete your own comments' });
    }

    await prisma.comment.delete({
      where: { id },
    });

    const response: ApiResponse<void> = {
      success: true,
      data: undefined,
    };

    res.json(response);
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete comment' });
  }
});

export default router;
