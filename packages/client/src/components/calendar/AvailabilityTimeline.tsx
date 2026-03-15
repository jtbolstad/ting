import { useEffect, useState } from "react";
import { format, addDays, differenceInDays, isWithinInterval } from "date-fns";
import { apiClient } from "../../api/client";
import type { Reservation, Loan } from "@ting/shared";

interface AvailabilityTimelineProps {
  itemId: string;
  compact?: boolean;
  daysAhead?: number;
}

interface TimelineBlock {
  start: Date;
  end: Date;
  type: "reservation" | "loan";
  data: Reservation | Loan;
}

export function AvailabilityTimeline({
  itemId,
  compact = false,
  daysAhead = 60,
}: AvailabilityTimelineProps) {
  const [blocks, setBlocks] = useState<TimelineBlock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTimeline();
  }, [itemId]);

  const loadTimeline = async () => {
    setLoading(true);
    try {
      const allReservations = await apiClient.getReservations();
      const itemReservations = allReservations.filter(
        (r) =>
          r.itemId === itemId && ["PENDING", "CONFIRMED"].includes(r.status),
      );

      const activeLoans = await apiClient.getLoans({ active: true });
      const itemLoans = activeLoans.filter((l) => l.itemId === itemId);

      const today = new Date();
      const endDate = addDays(today, daysAhead);

      const timelineBlocks: TimelineBlock[] = [];

      // Add reservations
      itemReservations.forEach((res) => {
        const start = new Date(res.startDate);
        const end = new Date(res.endDate);

        if (start <= endDate && end >= today) {
          timelineBlocks.push({
            start: start > today ? start : today,
            end: end < endDate ? end : endDate,
            type: "reservation",
            data: res,
          });
        }
      });

      // Add loans
      itemLoans.forEach((loan) => {
        const start = new Date(loan.checkedOutAt);
        const end = new Date(loan.dueDate);

        if (start <= endDate && end >= today) {
          timelineBlocks.push({
            start: start > today ? start : today,
            end: end < endDate ? end : endDate,
            type: "loan",
            data: loan,
          });
        }
      });

      // Sort by start date
      timelineBlocks.sort((a, b) => a.start.getTime() - b.start.getTime());
      setBlocks(timelineBlocks);
    } catch (error) {
      console.error("Failed to load timeline:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderTimeline = () => {
    const today = new Date();
    const endDate = addDays(today, daysAhead);
    const totalDays = differenceInDays(endDate, today);

    const getPosition = (date: Date) => {
      const daysSinceStart = differenceInDays(date, today);
      return (daysSinceStart / totalDays) * 100;
    };

    const getWidth = (start: Date, end: Date) => {
      const duration = differenceInDays(end, start) + 1;
      return (duration / totalDays) * 100;
    };

    // Find next available date
    const getNextAvailable = () => {
      let checkDate = new Date(today);
      checkDate.setHours(0, 0, 0, 0);

      for (let i = 0; i < daysAhead; i++) {
        const isBlocked = blocks.some((block) =>
          isWithinInterval(checkDate, { start: block.start, end: block.end }),
        );

        if (!isBlocked) {
          return checkDate;
        }

        checkDate = addDays(checkDate, 1);
      }

      return null;
    };

    const nextAvailable = getNextAvailable();

    if (compact) {
      return (
        <div className="text-sm">
          {blocks.length === 0 ? (
            <span className="text-green-600 font-medium">✓ Available now</span>
          ) : nextAvailable ? (
            <span className="text-amber-600">
              Next available: {format(nextAvailable, "MMM d")}
            </span>
          ) : (
            <span className="text-red-600">
              Fully booked ({daysAhead} days)
            </span>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{format(today, "MMM d")}</span>
          <span className="text-xs">Next {daysAhead} days</span>
          <span>{format(endDate, "MMM d, yyyy")}</span>
        </div>

        <div className="relative h-12 bg-gray-100 rounded">
          {/* Timeline bar */}
          <div className="absolute inset-0 bg-green-50 rounded"></div>

          {/* Blocks */}
          {blocks.map((block, index) => {
            const left = getPosition(block.start);
            const width = getWidth(block.start, block.end);
            const bgColor =
              block.type === "loan" ? "bg-red-400" : "bg-amber-400";

            return (
              <div
                key={index}
                className={`absolute h-full ${bgColor} rounded group cursor-help`}
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                }}
                title={`${block.type === "loan" ? "Checked out" : "Reserved"}: ${format(
                  block.start,
                  "MMM d",
                )} - ${format(block.end, "MMM d")}`}
              >
                <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-10">
                  {block.type === "loan" ? "🔒 Checked Out" : "📅 Reserved"}
                  <br />
                  {format(block.start, "MMM d")} - {format(block.end, "MMM d")}
                </div>
              </div>
            );
          })}

          {/* Today marker */}
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500 z-10">
            <div className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 text-xs text-blue-600 font-medium whitespace-nowrap">
              Today
            </div>
          </div>
        </div>

        {/* Legend and status */}
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex gap-3">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-50 border border-green-200 rounded"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-amber-400 rounded"></div>
              <span>Reserved</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-400 rounded"></div>
              <span>Checked Out</span>
            </div>
          </div>

          {nextAvailable && blocks.length > 0 && (
            <span className="text-green-600 font-medium">
              Next available: {format(nextAvailable, "MMM d")}
            </span>
          )}
        </div>
      </div>
    );
  };

  if (loading && !compact) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        Loading availability...
      </div>
    );
  }

  if (loading && compact) {
    return <div className="text-sm text-gray-400">...</div>;
  }

  return <div>{renderTimeline()}</div>;
}
