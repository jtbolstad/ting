import type { ApiResponse, CheckoutInput, Loan } from "@ting/shared";
import type { Router as ExpressRouter, Response } from "express";
import { Router } from "express";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import {
  hasOrgRole,
  requireOrgRole,
  withOrganizationContext,
} from "../middleware/organization.js";
import { prisma } from "../prisma.js";
import { emailService } from "../services/email.js";
import { audit } from "../services/auditLog.js";

const router: ExpressRouter = Router();

router.use(authenticate);
router.use(withOrganizationContext());

function serializeLoan(loan: any): Loan {
  return {
    id: loan.id,
    userId: loan.userId,
    user: loan.user,
    itemId: loan.itemId,
    item: loan.item,
    reservationId: loan.reservationId,
    reservation: loan.reservation,
    checkedOutAt: loan.checkedOutAt.toISOString(),
    dueDate: loan.dueDate.toISOString(),
    returnedAt: loan.returnedAt ? loan.returnedAt.toISOString() : null,
    damageNote: loan.damageNote ?? null,
  };
}

// List loans
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { active, overdue, userId } = req.query as any;

    const canViewAll = req.user!.role === "ADMIN" || hasOrgRole(req, "MANAGER");
    const where: any = {
      organizationId: req.organization!.id,
    };
    if (canViewAll) {
      if (userId) {
        where.userId = userId;
      }
    } else {
      where.userId = req.user!.id;
    }
    if (active === "true") where.returnedAt = null;
    if (overdue === "true") {
      where.returnedAt = null;
      where.dueDate = { lt: new Date() };
    }

    const loans = await prisma.loan.findMany({
      where,
      include: {
        item: { include: { category: true } },
        user: true,
        reservation: true,
      },
      orderBy: { checkedOutAt: "desc" },
    });

    const response: ApiResponse<Loan[]> = {
      success: true,
      data: loans.map(serializeLoan),
    };

    res.json(response);
  } catch (error) {
    console.error("List loans error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch loans" });
  }
});

// Get overdue loans (org manager+)
router.get(
  "/overdue",
  requireOrgRole("MANAGER"),
  async (req: AuthRequest, res: Response) => {
    try {
      const loans = await prisma.loan.findMany({
        where: {
          organizationId: req.organization!.id,
          returnedAt: null,
          dueDate: { lt: new Date() },
        },
        include: {
          item: { include: { category: true } },
          user: true,
        },
        orderBy: { dueDate: "asc" },
      });

      const response: ApiResponse<Loan[]> = {
        success: true,
        data: loans.map(serializeLoan),
      };

      res.json(response);
    } catch (error) {
      console.error("List overdue loans error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch overdue loans" });
    }
  },
);

// Checkout item (admin only, or user with valid reservation)
router.post("/checkout", async (req: AuthRequest, res: Response) => {
  try {
    const { itemId, userId, reservationId, dueDate } =
      req.body as CheckoutInput;

    if (!itemId || !dueDate) {
      return res.status(400).json({
        success: false,
        error: "itemId and dueDate are required",
      });
    }

    // Determine the user for checkout
    const canCheckoutForOthers =
      req.user!.role === "ADMIN" || hasOrgRole(req, "MANAGER");
    const checkoutUserId =
      canCheckoutForOthers && userId ? userId : req.user!.id;

    // Check if item exists
    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) {
      return res.status(404).json({ success: false, error: "Item not found" });
    }
    if (item.organizationId !== req.organization!.id) {
      return res.status(403).json({
        success: false,
        error: "Item does not belong to this organization",
      });
    }

    // Check if item is already checked out
    const existingLoan = await prisma.loan.findFirst({
      where: {
        itemId,
        organizationId: req.organization!.id,
        returnedAt: null,
      },
    });

    if (existingLoan) {
      return res.status(409).json({
        success: false,
        error: "Item is already checked out",
      });
    }

    // Block checkout if a confirmed reservation from another user is active
    const today = new Date();
    const blockingReservation = await prisma.reservation.findFirst({
      where: {
        itemId,
        organizationId: req.organization!.id,
        status: "CONFIRMED",
        endDate: { gte: today },
        userId: { not: checkoutUserId },
        ...(reservationId ? {} : {}), // always block if not the same user
      },
    });

    if (blockingReservation) {
      return res.status(409).json({
        success: false,
        error: "Item has an active reservation. Checkout must be linked to that reservation.",
      });
    }

    // If reservationId provided, verify it's valid, confirmed, belongs to the user, and matches the item
    if (reservationId) {
      const reservation = await prisma.reservation.findUnique({
        where: { id: reservationId },
      });

      if (
        !reservation ||
        reservation.userId !== checkoutUserId ||
        reservation.organizationId !== req.organization!.id
      ) {
        return res.status(404).json({
          success: false,
          error: "Reservation not found or does not belong to user",
        });
      }

      if (reservation.itemId !== itemId) {
        return res.status(400).json({
          success: false,
          error: "Reservation is for a different item",
        });
      }

      if (reservation.status !== "CONFIRMED") {
        return res.status(400).json({
          success: false,
          error: "Reservation must be CONFIRMED before checkout",
        });
      }
    }

    // Create loan and update item status
    const [loan] = await Promise.all([
      prisma.loan.create({
        data: {
          organizationId: req.organization!.id,
          userId: checkoutUserId,
          itemId,
          reservationId: reservationId || null,
          dueDate: new Date(dueDate),
        },
        include: {
          item: { include: { category: true } },
          user: true,
          reservation: true,
        },
      }),
      prisma.item.update({
        where: { id: itemId },
        data: { status: "CHECKED_OUT" },
      }),
      reservationId
        ? prisma.reservation.update({
            where: { id: reservationId },
            data: { status: "COMPLETED" },
          })
        : null,
    ]);

    emailService.sendCheckedOut(
      loan.user.email,
      loan.user.name,
      loan.item.name,
      loan.dueDate,
    ).catch(console.error);

    audit({ organizationId: req.organization!.id, actorUserId: req.user!.id, action: "loan.checkout", entityType: "Loan", entityId: loan.id, metadata: { itemId, userId: checkoutUserId, dueDate } });

    const response: ApiResponse<Loan> = {
      success: true,
      data: serializeLoan(loan),
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Checkout error:", error);
    res.status(500).json({ success: false, error: "Failed to checkout item" });
  }
});

// Checkin item (return)
router.post("/:id/checkin", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { damageNote } = req.body;

    const loan = await prisma.loan.findUnique({
      where: { id },
      include: { item: true },
    });

    if (!loan) {
      return res.status(404).json({ success: false, error: "Loan not found" });
    }

    if (loan.organizationId !== req.organization!.id) {
      return res
        .status(404)
        .json({ success: false, error: "Loan not found in this organization" });
    }

    if (loan.returnedAt) {
      return res
        .status(400)
        .json({ success: false, error: "Item already returned" });
    }

    // Only admins or the user who checked it out can return
    if (
      loan.userId !== req.user!.id &&
      !(req.user!.role === "ADMIN" || hasOrgRole(req, "MANAGER"))
    ) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    // Update loan and item status
    const [updated] = await Promise.all([
      prisma.loan.update({
        where: { id },
        data: { returnedAt: new Date(), damageNote: damageNote || null },
        include: {
          item: { include: { category: true } },
          user: true,
          reservation: true,
        },
      }),
      prisma.item.update({
        where: { id: loan.itemId },
        data: {
          status: "AVAILABLE",
          ...(req.body.condition ? { condition: req.body.condition } : {}),
        },
      }),
    ]);

    emailService.sendCheckedIn(
      updated.user.email,
      updated.user.name,
      updated.item.name,
    ).catch(console.error);

    audit({ organizationId: req.organization!.id, actorUserId: req.user!.id, action: "loan.checkin", entityType: "Loan", entityId: updated.id, metadata: { itemId: loan.itemId, userId: loan.userId, returnedAt: updated.returnedAt } });

    const response: ApiResponse<Loan> = {
      success: true,
      data: serializeLoan(updated),
    };

    res.json(response);
  } catch (error) {
    console.error("Checkin error:", error);
    res.status(500).json({ success: false, error: "Failed to checkin item" });
  }
});

export default router;
