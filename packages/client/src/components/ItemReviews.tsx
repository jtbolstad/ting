import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { apiClient } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { ReviewStars } from "./ReviewStars";
import type { Review, ReviewStats } from "@ting/shared";

interface ItemReviewsProps {
  itemId: string;
}

export function ItemReviews({ itemId }: ItemReviewsProps) {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReviews();
  }, [itemId]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const [reviewsData, statsData] = await Promise.all([
        apiClient.getItemReviews(itemId),
        apiClient.getItemReviewStats(itemId),
      ]);
      setReviews(reviewsData);
      setStats(statsData);

      // Check if user has already reviewed
      if (user && reviewsData.some((r) => r.userId === user.id)) {
        const userReview = reviewsData.find((r) => r.userId === user.id);
        if (userReview) {
          setRating(userReview.rating);
          setComment(userReview.comment || "");
        }
      }
    } catch (error) {
      console.error("Failed to load reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError(t("reviews.errors.ratingRequired"));
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await apiClient.createReview({
        itemId,
        rating,
        comment: comment.trim() || undefined,
      });
      setShowForm(false);
      setRating(0);
      setComment("");
      await loadReviews();
    } catch (err: any) {
      setError(err.message || t("reviews.errors.submitFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm(t("reviews.confirmDelete"))) return;

    try {
      await apiClient.deleteReview(reviewId);
      await loadReviews();
      setRating(0);
      setComment("");
    } catch (err: any) {
      setError(err.message || t("reviews.errors.deleteFailed"));
    }
  };

  const userReview = user ? reviews.find((r) => r.userId === user.id) : null;
  const canReview = isAuthenticated && !userReview;

  if (loading) {
    return (
      <div className="text-center py-4 text-gray-500">
        {t("reviews.loading")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t("reviews.title")}</h2>
      </div>

      {/* Stats Summary */}
      {stats && stats.totalReviews > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-3xl font-bold">
                {stats.averageRating.toFixed(1)}
              </div>
              <ReviewStars rating={Math.round(stats.averageRating)} readonly />
            </div>
            <div className="text-sm text-gray-600">
              {t("reviews.totalCount", { count: stats.totalReviews })}
            </div>
          </div>
        </div>
      )}

      {/* Review Form */}
      {canReview && (
        <div className="border-t pt-6">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              {t("reviews.writeReview")}
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("reviews.yourRating")}
                </label>
                <ReviewStars
                  rating={rating}
                  onRatingChange={setRating}
                  size="lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("reviews.comment")} ({t("reviews.optional")})
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder={t("reviews.commentPlaceholder")}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting || rating === 0}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400"
                >
                  {submitting ? t("reviews.submitting") : t("reviews.submit")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setRating(0);
                    setComment("");
                    setError("");
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  {t("common.cancel")}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* User's Review */}
      {userReview && (
        <div className="border-t pt-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-medium">{t("reviews.yourReview")}</div>
                <ReviewStars rating={userReview.rating} readonly size="sm" />
              </div>
              <button
                onClick={() => handleDelete(userReview.id)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                {t("common.delete")}
              </button>
            </div>
            {userReview.comment && (
              <p className="text-gray-700 mt-2">{userReview.comment}</p>
            )}
            <div className="text-xs text-gray-500 mt-2">
              {format(new Date(userReview.createdAt), "MMM d, yyyy")}
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-4 border-t pt-6">
          <h3 className="font-medium">{t("reviews.allReviews")}</h3>
          {reviews
            .filter((r) => !user || r.userId !== user.id)
            .map((review) => (
              <div key={review.id} className="border-b pb-4 last:border-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium">
                      {review.user?.name || t("reviews.anonymous")}
                    </div>
                    <ReviewStars rating={review.rating} readonly size="sm" />
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(review.createdAt), "MMM d, yyyy")}
                  </div>
                </div>
                {review.comment && (
                  <p className="text-gray-700 mt-2">{review.comment}</p>
                )}
              </div>
            ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          {t("reviews.noReviews")}
        </div>
      )}
    </div>
  );
}
