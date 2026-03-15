import { useEffect, useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isWithinInterval,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { useTranslation } from "react-i18next";
import { apiClient } from "../../api/client";
import type { Reservation, Loan } from "@ting/shared";

interface ItemAvailabilityCalendarProps {
  itemId: string;
  onDateSelect?: (startDate: Date, endDate: Date) => void;
  selectedStart?: Date;
  selectedEnd?: Date;
}

interface DateStatus {
  date: Date;
  available: boolean;
  type?: "reservation" | "loan" | "selected";
  reservation?: Reservation;
  loan?: Loan;
}

export function ItemAvailabilityCalendar({
  itemId,
  onDateSelect,
  selectedStart,
  selectedEnd,
}: ItemAvailabilityCalendarProps) {
  const { t } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectingStart, setSelectingStart] = useState<Date | null>(null);

  useEffect(() => {
    loadAvailability();
  }, [itemId, currentMonth]);

  const loadAvailability = async () => {
    setLoading(true);
    try {
      // Fetch reservations for this item
      const allReservations = await apiClient.getReservations();
      const itemReservations = allReservations.filter(
        (r) =>
          r.itemId === itemId && ["PENDING", "CONFIRMED"].includes(r.status),
      );
      setReservations(itemReservations);

      // Fetch active loans for this item
      const activeLoans = await apiClient.getLoans({ active: true });
      const itemLoans = activeLoans.filter((l) => l.itemId === itemId);
      setLoans(itemLoans);
    } catch (error) {
      console.error("Failed to load availability:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDateStatus = (date: Date): DateStatus => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    // Check if date is in the past
    if (checkDate < today) {
      return { date, available: false, type: undefined };
    }

    // Check if date is selected
    if (selectedStart && selectedEnd) {
      if (
        isWithinInterval(checkDate, { start: selectedStart, end: selectedEnd })
      ) {
        return { date, available: true, type: "selected" };
      }
    } else if (selectedStart && isSameDay(checkDate, selectedStart)) {
      return { date, available: true, type: "selected" };
    }

    // Check for loans
    for (const loan of loans) {
      const loanStart = new Date(loan.checkedOutAt);
      loanStart.setHours(0, 0, 0, 0);
      const loanEnd = new Date(loan.dueDate);
      loanEnd.setHours(0, 0, 0, 0);

      if (isWithinInterval(checkDate, { start: loanStart, end: loanEnd })) {
        return { date, available: false, type: "loan", loan };
      }
    }

    // Check for reservations
    for (const reservation of reservations) {
      const resStart = new Date(reservation.startDate);
      resStart.setHours(0, 0, 0, 0);
      const resEnd = new Date(reservation.endDate);
      resEnd.setHours(0, 0, 0, 0);

      if (isWithinInterval(checkDate, { start: resStart, end: resEnd })) {
        return { date, available: false, type: "reservation", reservation };
      }
    }

    return { date, available: true };
  };

  const handleDateClick = (date: Date) => {
    if (!onDateSelect) return;

    const status = getDateStatus(date);
    if (!status.available) return;

    if (!selectingStart) {
      setSelectingStart(date);
    } else {
      const start = selectingStart < date ? selectingStart : date;
      const end = selectingStart < date ? date : selectingStart;

      // Check if all dates in range are available
      const daysInRange = eachDayOfInterval({ start, end });
      const allAvailable = daysInRange.every((d) => getDateStatus(d).available);

      if (allAvailable) {
        onDateSelect(start, end);
        setSelectingStart(null);
      } else {
        // Reset if range contains unavailable dates
        setSelectingStart(date);
      }
    }
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];

    days.forEach((day, index) => {
      currentWeek.push(day);
      if ((index + 1) % 7 === 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    return (
      <div>
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded"
            type="button"
          >
            ←
          </button>
          <h3 className="text-lg font-semibold">
            {format(currentMonth, "MMMM yyyy")}
          </h3>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded"
            type="button"
          >
            →
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["sun", "mon", "tue", "wed", "thu", "fri", "sat"].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-gray-500 py-2"
            >
              {t(`calendar.weekdays.${day}`)}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const status = getDateStatus(day);
            const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
            const isToday = isSameDay(day, new Date());

            let bgColor = "bg-white hover:bg-gray-50";
            let textColor = isCurrentMonth ? "text-gray-900" : "text-gray-400";
            let cursor = "cursor-default";

            if (!isCurrentMonth) {
              bgColor = "bg-gray-50";
            } else if (status.type === "selected") {
              bgColor = "bg-indigo-500 text-white";
              textColor = "text-white";
              cursor = "cursor-pointer";
            } else if (status.type === "loan") {
              bgColor = "bg-red-100";
              textColor = "text-red-800";
            } else if (status.type === "reservation") {
              bgColor = "bg-amber-100";
              textColor = "text-amber-800";
            } else if (status.available) {
              bgColor = "bg-green-50 hover:bg-green-100";
              cursor = "cursor-pointer";
            } else {
              bgColor = "bg-gray-100";
              textColor = "text-gray-400";
            }

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => handleDateClick(day)}
                disabled={!status.available || !isCurrentMonth}
                className={`
                  ${bgColor} ${textColor} ${cursor}
                  aspect-square flex items-center justify-center rounded
                  text-sm font-medium
                  ${isToday ? "ring-2 ring-blue-500" : ""}
                  disabled:cursor-not-allowed
                  transition-colors
                `}
                title={
                  status.type === "loan"
                    ? t("calendar.legend.checkedOut")
                    : status.type === "reservation"
                      ? t("calendar.legend.reserved")
                      : status.available
                        ? t("calendar.legend.available")
                        : ""
                }
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
            <span>{t("calendar.legend.available")}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-100 border border-amber-200 rounded"></div>
            <span>{t("calendar.legend.reserved")}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
            <span>{t("calendar.legend.checkedOut")}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-indigo-500 rounded"></div>
            <span>{t("calendar.legend.selected")}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 ring-2 ring-blue-500 rounded"></div>
            <span>{t("calendar.legend.today")}</span>
          </div>
        </div>

        {selectingStart && (
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
            {t("calendar.completeSelection")}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        {t("calendar.loading")}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {renderCalendar()}
    </div>
  );
}
