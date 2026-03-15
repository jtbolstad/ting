import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiClient } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { ItemAvailabilityCalendar } from "../components/calendar/ItemAvailabilityCalendar";
import { AvailabilityTimeline } from "../components/calendar/AvailabilityTimeline";
import { ItemComments } from "../components/ItemComments";
import type { Item } from "@ting/shared";

export function ItemDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reserving, setReserving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCalendar, setShowCalendar] = useState(true);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadItem();
  }, [id]);

  const loadItem = async () => {
    try {
      const data = await apiClient.getItem(id!);
      setItem(data);
    } catch (error) {
      console.error("Failed to load item:", error);
    } finally {
      setLoading(false);
    }
  };

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
        itemId: id!,
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

  if (loading) {
    return <div className="text-center py-12">{t("item.loading")}</div>;
  }

  if (!item) {
    return <div className="text-center py-12">{t("item.notFound")}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Item Details Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/2 bg-gray-200 flex items-center justify-center h-96">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-gray-400 text-8xl">📦</span>
              )}
            </div>

            <div className="md:w-1/2 p-8">
              <h1 className="text-3xl font-bold mb-2">{item.name}</h1>
              <p className="text-gray-600 mb-4">
                {item.category?.name
                  ? t(`categories.${item.category.name}`, item.category.name)
                  : ""}
              </p>

              <div className="mb-6">
                <span
                  className={`inline-block px-3 py-1 rounded ${
                    item.status === "AVAILABLE"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {t(`catalog.status.${item.status.toLowerCase()}`)}
                </span>
              </div>

              <p className="text-gray-700 mb-8">
                {item.description || t("item.noDescription")}
              </p>

              {isAuthenticated && (
                <div className="flex space-x-3">
                  <button
                    onClick={() => navigate(`/items/${id}/edit`)}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                  >
                    {t("item.edit")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Availability Timeline */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            {t("item.availability.title", { days: 60 })}
          </h2>
          <AvailabilityTimeline itemId={id!} daysAhead={60} />
        </div>

        {/* Calendar & Reservation Form */}
        {item.status === "AVAILABLE" && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {t("item.reserve.title")}
              </h2>
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
                      itemId={id!}
                      onDateSelect={handleDateSelect}
                      selectedStart={
                        startDate ? new Date(startDate) : undefined
                      }
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
                          min={
                            startDate || new Date().toISOString().split("T")[0]
                          }
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
        )}

        {/* Comments Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <ItemComments itemId={id!} />
        </div>
      </div>
    </div>
  );
}
