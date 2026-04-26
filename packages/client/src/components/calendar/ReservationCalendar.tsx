import { useState } from "react";
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
import { Link } from "react-router-dom";
import type { Reservation, Loan } from "@ting/shared";

interface ReservationCalendarProps {
  reservations: Reservation[];
  loans: Loan[];
  onCancelReservation: (id: string) => void;
}

export function ReservationCalendar({
  reservations,
  loans,
  onCancelReservation,
}: ReservationCalendarProps) {
  const { t } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selected, setSelected] = useState<{
    type: "reservation" | "loan";
    id: string;
  } | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getDayEntries = (date: Date) => {
    const entries: Array<{
      type: "reservation" | "loan";
      id: string;
      itemName: string;
      status?: string;
    }> = [];

    for (const r of reservations) {
      const start = new Date(r.startDate);
      const end = new Date(r.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      if (
        isWithinInterval(date, { start, end }) ||
        isSameDay(date, start) ||
        isSameDay(date, end)
      ) {
        entries.push({
          type: "reservation",
          id: r.id,
          itemName: r.item?.name ?? "?",
          status: r.status,
        });
      }
    }

    for (const l of loans) {
      if (!l.returnedAt) {
        const start = new Date(l.checkedOutAt);
        const end = new Date(l.dueDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        if (
          isWithinInterval(date, { start, end }) ||
          isSameDay(date, start) ||
          isSameDay(date, end)
        ) {
          entries.push({
            type: "loan",
            id: l.id,
            itemName: l.item?.name ?? "?",
          });
        }
      }
    }

    return entries;
  };

  const selectedReservation =
    selected?.type === "reservation"
      ? reservations.find((r) => r.id === selected.id)
      : null;
  const selectedLoan =
    selected?.type === "loan" ? loans.find((l) => l.id === selected.id) : null;

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 rounded"
          aria-label="Previous month"
        >
          ‹
        </button>
        <h3 className="font-semibold text-lg">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 rounded"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div
            key={d}
            className="text-center text-xs font-medium text-gray-500 py-1"
          >
            {t(`calendar.weekdays.${d.toLowerCase()}`, d)}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 border-l border-t">
        {days.map((day) => {
          const entries = getDayEntries(day);
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              className={`border-r border-b min-h-[64px] p-1 ${
                isCurrentMonth ? "bg-white" : "bg-gray-50"
              }`}
            >
              <div
                className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                  isToday
                    ? "bg-indigo-600 text-white"
                    : isCurrentMonth
                      ? "text-gray-900"
                      : "text-gray-400"
                }`}
              >
                {format(day, "d")}
              </div>
              <div className="space-y-0.5">
                {entries.slice(0, 2).map((e, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      setSelected(
                        selected?.id === e.id
                          ? null
                          : { type: e.type, id: e.id },
                      )
                    }
                    className={`w-full text-left text-xs px-1 py-0.5 rounded truncate ${
                      e.type === "loan"
                        ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                        : e.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                          : "bg-green-100 text-green-800 hover:bg-green-200"
                    }`}
                    title={e.itemName}
                  >
                    {e.itemName}
                  </button>
                ))}
                {entries.length > 2 && (
                  <div className="text-xs text-gray-400">
                    +{entries.length - 2}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-3 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-100 border border-green-300 inline-block" />
          {t("calendar.legend.confirmed")}
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300 inline-block" />
          {t("calendar.legend.pending")}
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-blue-100 border border-blue-300 inline-block" />
          {t("calendar.legend.loan")}
        </div>
      </div>

      {/* Detail panel */}
      {selectedReservation && (
        <div className="mt-4 p-4 border rounded-lg bg-white shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-medium">
                <Link
                  to={`/items/${selectedReservation.item?.slug ?? selectedReservation.itemId}`}
                  className="text-indigo-600 hover:underline"
                >
                  {selectedReservation.item?.name}
                </Link>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {new Date(selectedReservation.startDate).toLocaleDateString()} –{" "}
                {new Date(selectedReservation.endDate).toLocaleDateString()}
              </div>
              <div className="mt-1">
                <span
                  className={`px-2 py-0.5 text-xs rounded ${
                    selectedReservation.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {t(
                    `dashboard.reservations.statusValues.${selectedReservation.status.toLowerCase()}`,
                  )}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {selectedReservation.status !== "COMPLETED" && (
                <button
                  onClick={() => {
                    onCancelReservation(selectedReservation.id);
                    setSelected(null);
                  }}
                  className="text-sm text-red-600 hover:text-red-900 border border-red-200 px-3 py-1 rounded"
                >
                  {t("dashboard.reservations.cancel")}
                </button>
              )}
              <button
                onClick={() => setSelected(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedLoan && (
        <div className="mt-4 p-4 border rounded-lg bg-white shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-medium">
                <Link
                  to={`/items/${selectedLoan.item?.slug ?? selectedLoan.itemId}`}
                  className="text-indigo-600 hover:underline"
                >
                  {selectedLoan.item?.name}
                </Link>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {t("dashboard.loans.checkedOut")}:{" "}
                {new Date(selectedLoan.checkedOutAt).toLocaleDateString()}
              </div>
              <div className="text-sm text-gray-500">
                {t("dashboard.loans.dueDate")}:{" "}
                {new Date(selectedLoan.dueDate).toLocaleDateString()}
                {new Date(selectedLoan.dueDate) < new Date() && (
                  <span className="ml-1 text-red-600 font-semibold">
                    ({t("dashboard.loans.overdue")})
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
