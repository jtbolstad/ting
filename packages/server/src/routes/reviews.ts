import type {
  ApiResponse,
  CreateReviewInput,
  Review,
  ReviewStats,
} from "@ting/shared";
import type { Router as ExpressRouter, Response } from "express";
import { Router } from "express";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { prisma } from "../prisma.js";

const router: ExpressRouter = Router();

function serializeReview(review: any): Review {
  return {
    id: review.id,
    itemId: review.itemId,
    userId: review.userId,
    user: review.user
      ? {
          id: review.user.id,
          name: review.user.name,
        }
      : undefined,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
  };
}

// Get reviews for an item (public)
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

      const reviews = await prisma.review.findMany({
        where: { itemId, organizationId: item.organizationId },
        include: { user: true },
        orderBy: { createdAt: "desc" },
      });

      const response: ApiResponse<Review[]> = {
        success: true,
        data: reviews.map(serializeReview),
      };

      res.json(response);
    } catch (error) {
      console.error("Get reviews error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch reviews" });
    }
  },
);

// Get review stats for an item (public)
router.get(
  "/item/:itemId/stats",
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

      const reviews = await prisma.review.findMany({
        where: { itemId, organizationId: item.organizationId },
        select: { rating: true },
      });

      const totalReviews = reviews.length;
      const averageRating =
        totalReviews > 0
          ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
            totalReviews
          : 0;

      const ratingDistribution = {
        1: reviews.filter((r: any) => r.rating === 1).length,
        2: reviews.filter((r: any) => r.rating === 2).length,
        3: reviews.filter((r: any) => r.rating === 3).length,
        4: reviews.filter((r: any) => r.rating === 4).length,
        5: reviews.filter((r: any) => r.rating === 5).length,
      };

      const stats: ReviewStats = {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews,
        ratingDistribution,
      };

      const response: ApiResponse<ReviewStats> = {
        success: true,
        data: stats,
      };

      res.json(response);
    } catch (error) {
      console.error("Get review stats error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch review stats" });
    }
  },
);

// Create or update review (authenticated users only)
router.post(
  "/",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { itemId, rating, comment } = req.body as CreateReviewInput;

      if (!itemId || !rating) {
        return res.status(400).json({
          success: false,
          error: "Item ID and rating are required",
        });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          error: "Rating must be between 1 and 5",
        });
      }

      // Find item to determine organization
      const item = await prisma.item.findUnique({
        where: { id: itemId },
        select: { organizationId: true },
      });

      if (!item) {
        return res
          .status(404)
          .json({ success: false, error: "Item not found" });
      }

      // Upsert review (create or update if exists)
      const review = await prisma.review.upsert({
        where: {
          userId_itemId: {
            userId: req.user!.id,
            itemId,
          },
        },
        create: {
          organizationId: item.organizationId,
          itemId,
          userId: req.user!.id,
          rating,
          comment: comment?.trim() || null,
        },
        update: {
          rating,
          comment: comment?.trim() || null,
        },
        include: { user: true },
      });

      const response: ApiResponse<Review> = {
        success: true,
        data: serializeReview(review),
      };

      res.status(201).json(response);
    } catch (error) {
      console.error("Create/update review error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to create review" });
    }
  },
);

// Delete review (authenticated users only, own review)
router.delete(
  "/:id",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Verify review exists and belongs to user
      const review = await prisma.review.findUnique({
        where: { id },
      });

      if (!review || review.userId !== req.user!.id) {
        return res
          .status(404)
          .json({ success: false, error: "Review not found" });
      }

      await prisma.review.delete({ where: { id } });

      const response: ApiResponse<{ deleted: boolean }> = {
        success: true,
        data: { deleted: true },
      };

      res.json(response);
    } catch (error) {
      console.error("Delete review error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to delete review" });
    }
  },
);

export default router;
