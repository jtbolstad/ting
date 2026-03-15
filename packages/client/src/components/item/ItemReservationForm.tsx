import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiClient } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { ItemAvailabilityCalendar } from "../calendar/ItemAvailabilityCalendar";

interface ItemReservationFormProps {
  itemId: string;
  itemStatus: string;
}

export function ItemReservationForm({
  itemId,
  itemStatus,
}: ItemReservationFormProps) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reserving, setReserving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCalendar, setShowCalendar] = useState(true);

  const handleDateSelect = (start: Date, end: Date) => {
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
    setError("");
  };

  const handleReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setReserving(true);

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    try {
      await apiClient.createReservation({
        itemId,
        startDate,
        endDate,
      });
      setSuccess(t("messages.reservationSuccess"));
      setStartDate("");
      setEndDate("");
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err: any) {
      setError(err.message || t("errors.reservationFailed"));
    } finally {
      setReserving(false);
    }
  };

  if (itemStatus !== "AVAILABLE") {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{t("item.reserve.title")}</h2>
        <button
          type="button"
          onClick={() => setShowCalendar(!showCalendar)}
          className="text-indigo-600 hover:underline text-sm"
        >
          {showCalendar
            ? t("item.reserve.hideCalendar")
            : t("item.reserve.showCalendar")}
        </button>
      </div>

      {!isAuthenticated ? (
        <div className="p-4 bg-gray-50 rounded border border-gray-200">
          <p className="text-gray-600">
            {t("item.reserve.loginRequired")}{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-indigo-600 hover:underline"
            >
              {t("item.reserve.loginLink")}
            </button>
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Calendar View */}
          {showCalendar && (
            <div className="border-t pt-6">
              <ItemAvailabilityCalendar
                itemId={itemId}
                onDateSelect={handleDateSelect}
                selectedStart={startDate ? new Date(startDate) : undefined}
                selectedEnd={endDate ? new Date(endDate) : undefined}
              />
            </div>
          )}

          {/* Reservation Form */}
          <div className="border-t pt-6">
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                {success}
              </div>
            )}

            <form onSubmit={handleReservation} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("item.reserve.startDate")}
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("item.reserve.endDate")}
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || new Date().toISOString().split("T")[0]}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={reserving || !startDate || !endDate}
                className="w-full py-3 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {reserving
                  ? t("item.reserve.creating")
                  : t("item.reserve.submit")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
