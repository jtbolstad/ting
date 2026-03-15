import { useState, useEffect } from "react";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useTranslation } from "react-i18next";
import { apiClient } from "../../api/client";

interface DateRangePickerProps {
  itemId: string;
  onSelect: (start: Date, end: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}

export function DateRangePicker({
  itemId,
  onSelect,
  minDate,
  maxDate,
}: DateRangePickerProps) {
  const { t } = useTranslation();
  const [range, setRange] = useState<DateRange | undefined>();

  const [disabledDays, setDisabledDays] = useState<Date[]>([]);
  const [checking, setChecking] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState("");

  useEffect(() => {
    loadBlockedDates();
  }, [itemId]);

  useEffect(() => {
    if (range?.from && range?.to) {
      checkAvailability(range.from, range.to);
    } else {
      setAvailabilityMessage("");
    }
  }, [range]);

  const loadBlockedDates = async () => {
    try {
      // Fetch reservations and loans
      const allReservations = await apiClient.getReservations();
      const itemReservations = allReservations.filter(
        (r) =>
          r.itemId === itemId && ["PENDING", "CONFIRMED"].includes(r.status),
      );

      const activeLoans = await apiClient.getLoans({ active: true });
      const itemLoans = activeLoans.filter((l) => l.itemId === itemId);

      // Build list of disabled dates
      const blocked: Date[] = [];

      itemReservations.forEach((res) => {
        const start = new Date(res.startDate);
        const end = new Date(res.endDate);
        const current = new Date(start);

        while (current <= end) {
          blocked.push(new Date(current));
          current.setDate(current.getDate() + 1);
        }
      });

      itemLoans.forEach((loan) => {
        const start = new Date(loan.checkedOutAt);
        const end = new Date(loan.dueDate);
        const current = new Date(start);

        while (current <= end) {
          blocked.push(new Date(current));
          current.setDate(current.getDate() + 1);
        }
      });

      setDisabledDays(blocked);
    } catch (error) {
      console.error("Failed to load blocked dates:", error);
    }
  };

  const checkAvailability = async (start: Date, end: Date) => {
    setChecking(true);
    setAvailabilityMessage("");

    try {
      const result = await apiClient.checkAvailability(
        itemId,
        start.toISOString().split("T")[0],
        end.toISOString().split("T")[0],
      );

      if (result.available) {
        setAvailabilityMessage("✅ " + t("calendar.availableForDates"));
        onSelect(start, end);
      } else {
        setAvailabilityMessage("❌ " + t("calendar.notAvailable"));
      }
    } catch (error: any) {
      setAvailabilityMessage(`⚠️ ${error.message}`);
    } finally {
      setChecking(false);
    }
  };

  const handleRangeSelect = (selectedRange: DateRange | undefined) => {
    setRange(selectedRange);
  };

  const today = new Date();
  const effectiveMinDate = minDate || today;
  const effectiveMaxDate =
    maxDate ||
    new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <DayPicker
          mode="range"
          selected={range}
          onSelect={handleRangeSelect}
          disabled={[
            { before: effectiveMinDate, after: effectiveMaxDate },
            ...disabledDays,
          ]}
          numberOfMonths={2}
          className="border rounded-lg p-4"
          modifiersStyles={{
            selected: {
              backgroundColor: "#6366f1",
              color: "white",
            },
          }}
        />
      </div>

      {checking && (
        <div className="text-center text-sm text-gray-600">
          {t("calendar.checkingAvailability")}
        </div>
      )}

      {availabilityMessage && !checking && (
        <div
          className={`p-3 rounded text-sm ${
            availabilityMessage.includes("Available")
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {availabilityMessage}
        </div>
      )}

      <div className="text-xs text-gray-500 space-y-1">
        <p>• {t("calendar.clickToStart")}</p>
        <p>• {t("calendar.grayedOutInfo")}</p>
        <p>
          •{" "}
          {t("calendar.maxBooking", {
            days: Math.floor(
              (effectiveMaxDate.getTime() - effectiveMinDate.getTime()) /
                (1000 * 60 * 60 * 24),
            ),
          })}
        </p>
      </div>
    </div>
  );
}
