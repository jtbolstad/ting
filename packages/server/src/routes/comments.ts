import type {
  ApiResponse,
  Comment,
  CreateCommentInput,
  UpdateCommentInput,
} from "@ting/shared";
import type { Router as ExpressRouter, Response } from "express";
import { Router } from "express";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { prisma } from "../prisma.js";

const router: ExpressRouter = Router();

function serializeComment(comment: any): Comment {
  return {
    id: comment.id,
    itemId: comment.itemId,
    userId: comment.userId,
    user: comment.user
      ? {
          id: comment.user.id,
          email: comment.user.email,
          name: comment.user.name,
          role: comment.user.role,
          createdAt: comment.user.createdAt.toISOString(),
          updatedAt: comment.user.updatedAt.toISOString(),
        }
      : undefined,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
  };
}

// Get comments for an item (public)
router.get(
  "/item/:itemId",
  async (req: AuthRequest, res: Response) => {
    try {
      const { itemId } = req.params;

      // Find the item to determine organization and verify it's public
      const item = await prisma.item.findUnique({
        where: { id: itemId },
        select: { organizationId: true, approvalStatus: true },
      });

      if (!item || item.approvalStatus !== "APPROVED") {
        return res
          .status(404)
          .json({ success: false, error: "Item not found" });
      }

      const comments = await prisma.comment.findMany({
        where: { itemId, organizationId: item.organizationId },
        include: { user: true },
        orderBy: { createdAt: "desc" },
      });

      const response: ApiResponse<Comment[]> = {
        success: true,
        data: comments.map(serializeComment),
      };

      res.json(response);
    } catch (error) {
      console.error("Get comments error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch comments" });
    }
  },
);

// Create comment (authenticated users only)
router.post(
  "/",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { itemId, content } = req.body as CreateCommentInput;

      if (!itemId || !content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Item ID and content are required",
        });
      }

      // Find item to determine organization
      const item = await prisma.item.findUnique({
        where: { id: itemId },
        select: { organizationId: true, approvalStatus: true },
      });

      if (!item) {
        return res
          .status(404)
          .json({ success: false, error: "Item not found" });
      }

      const comment = await prisma.comment.create({
        data: {
          organizationId: item.organizationId,
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
      console.error("Create comment error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to create comment" });
    }
  },
);

// Update comment (own comments only)
router.patch(
  "/:id",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { content } = req.body as UpdateCommentInput;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Content is required",
        });
      }

      // Find comment and verify ownership
      const existingComment = await prisma.comment.findUnique({
        where: { id },
      });

      if (!existingComment) {
        return res
          .status(404)
          .json({ success: false, error: "Comment not found" });
      }

      if (existingComment.userId !== req.user!.id) {
        return res.status(403).json({
          success: false,
          error: "You can only edit your own comments",
        });
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
      console.error("Update comment error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to update comment" });
    }
  },
);

// Delete comment (own comments only)
router.delete(
  "/:id",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Find comment and verify ownership
      const existingComment = await prisma.comment.findUnique({
        where: { id },
      });

      if (!existingComment) {
        return res
          .status(404)
          .json({ success: false, error: "Comment not found" });
      }

      if (existingComment.userId !== req.user!.id) {
        return res.status(403).json({
          success: false,
          error: "You can only delete your own comments",
        });
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
      console.error("Delete comment error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to delete comment" });
    }
  },
);

export default router;
