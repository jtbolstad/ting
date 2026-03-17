import type {
  ApiResponse,
  CreateReservationInput,
  Reservation,
  UpdateReservationInput,
} from "@ting/shared";
import type { Router as ExpressRouter, Response } from "express";
import { Router } from "express";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import {
  hasOrgRole,
  withOrganizationContext,
} from "../middleware/organization.js";
import { prisma } from "../prisma.js";

const router: ExpressRouter = Router();

router.use(authenticate);
router.use(withOrganizationContext());

function serializeReservation(reservation: any): Reservation {
  return {
    id: reservation.id,
    userId: reservation.userId,
    user: reservation.user,
    itemId: reservation.itemId,
    item: reservation.item,
    startDate: reservation.startDate.toISOString(),
    endDate: reservation.endDate.toISOString(),
    status: reservation.status,
    createdAt: reservation.createdAt.toISOString(),
  };
}

// Check item availability for a date range
router.get("/availability/:itemId", async (req: AuthRequest, res: Response) => {
  try {
    const { itemId } = req.params;
    const { startDate, endDate } = req.query as any;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: "startDate and endDate are required",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Find conflicting reservations or loans
    const item = await prisma.item.findFirst({
      where: { id: itemId, organizationId: req.organization!.id },
    });

    if (!item) {
      return res
        .status(404)
        .json({ success: false, error: "Item not found in this organization" });
    }

    const [reservations, loans] = await Promise.all([
      prisma.reservation.findMany({
        where: {
          itemId,
          organizationId: req.organization!.id,
          status: { in: ["PENDING", "CONFIRMED"] },
          OR: [
            {
              AND: [{ startDate: { lte: end } }, { endDate: { gte: start } }],
            },
          ],
        },
      }),
      prisma.loan.findMany({
        where: {
          itemId,
          organizationId: req.organization!.id,
          returnedAt: null,
          OR: [
            {
              AND: [
                { checkedOutAt: { lte: end } },
                { dueDate: { gte: start } },
              ],
            },
          ],
        },
      }),
    ]);

    const available = reservations.length === 0 && loans.length === 0;

    const response: ApiResponse<any> = {
      success: true,
      data: {
        available,
        conflicts: available
          ? undefined
          : [...reservations.map(serializeReservation), ...loans],
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Check availability error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to check availability" });
  }
});

// List user's reservations
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const requestedUserId = req.query.userId as string | undefined;
    const canViewAll = req.user!.role === "ADMIN" || hasOrgRole(req, "MANAGER");
    const userId = canViewAll ? requestedUserId : req.user!.id;

    const reservations = await prisma.reservation.findMany({
      where: {
        organizationId: req.organization!.id,
        ...(userId ? { userId } : {}),
      },
      include: {
        item: { include: { category: true } },
        user: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const response: ApiResponse<Reservation[]> = {
      success: true,
      data: reservations.map(serializeReservation),
    };

    res.json(response);
  } catch (error) {
    console.error("List reservations error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch reservations" });
  }
});

// Create reservation
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { itemId, startDate, endDate } = req.body as CreateReservationInput;
    const userId = req.user!.id;

    if (!itemId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: "itemId, startDate, and endDate are required",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check if item exists and is available
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

    // Check for conflicts
    const conflicts = await prisma.reservation.findMany({
      where: {
        itemId,
        organizationId: req.organization!.id,
        status: { in: ["PENDING", "CONFIRMED"] },
        OR: [
          {
            AND: [{ startDate: { lte: end } }, { endDate: { gte: start } }],
          },
        ],
      },
    });

    if (conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        error: "Item is not available for the selected dates",
      });
    }

    const reservation = await prisma.reservation.create({
      data: {
        organizationId: req.organization!.id,
        userId,
        itemId,
        startDate: start,
        endDate: end,
        status: "CONFIRMED",
      },
      include: {
        item: { include: { category: true } },
        user: true,
      },
    });

    const response: ApiResponse<Reservation> = {
      success: true,
      data: serializeReservation(reservation),
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Create reservation error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to create reservation" });
  }
});

// Update reservation
router.patch("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, status } = req.body as UpdateReservationInput;

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!reservation) {
      return res
        .status(404)
        .json({ success: false, error: "Reservation not found" });
    }

    if (reservation.organizationId !== req.organization!.id) {
      return res.status(404).json({
        success: false,
        error: "Reservation not found in this organization",
      });
    }

    // Users can only update their own reservations, admins can update any
    if (reservation.userId !== req.user!.id && req.user!.role !== "ADMIN") {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const updateData: any = {};
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (status) updateData.status = status;

    const updated = await prisma.reservation.update({
      where: { id },
      data: updateData,
      include: {
        item: { include: { category: true } },
        user: true,
      },
    });

    const response: ApiResponse<Reservation> = {
      success: true,
      data: serializeReservation(updated),
    };

    res.json(response);
  } catch (error) {
    console.error("Update reservation error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to update reservation" });
  }
});

// Cancel reservation
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const reservation = await prisma.reservation.findUnique({ where: { id } });

    if (!reservation) {
      return res
        .status(404)
        .json({ success: false, error: "Reservation not found" });
    }

    if (reservation.organizationId !== req.organization!.id) {
      return res.status(404).json({
        success: false,
        error: "Reservation not found in this organization",
      });
    }

    // Users can only cancel their own reservations, admins can cancel any
    if (reservation.userId !== req.user!.id && req.user!.role !== "ADMIN") {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    await prisma.reservation.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Cancel reservation error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to cancel reservation" });
  }
});

export default router;
