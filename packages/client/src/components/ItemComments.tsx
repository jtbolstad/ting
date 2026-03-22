import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { apiClient } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useConfirm } from "./ui/ConfirmModal";
import type { Comment } from "@ting/shared";

interface ItemCommentsProps {
  itemId: string;
}

export function ItemComments({ itemId }: ItemCommentsProps) {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const confirm = useConfirm();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadComments();
  }, [itemId]);

  const loadComments = async () => {
    try {
      const data = await apiClient.getItemComments(itemId);
      setComments(data);
    } catch (error) {
      console.error("Failed to load comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      await apiClient.createComment({
        itemId,
        content: newComment.trim(),
      });
      setNewComment("");
      await loadComments();
    } catch (err: any) {
      setError(err.message || t("errors.commentFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      await apiClient.updateComment(commentId, editContent.trim());
      setEditingId(null);
      setEditContent("");
      await loadComments();
    } catch (err: any) {
      setError(err.message || t("errors.updateCommentFailed"));
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!await confirm(t("comments.confirmDelete"))) return;

    try {
      await apiClient.deleteComment(commentId);
      await loadComments();
    } catch (err: any) {
      setError(err.message || t("errors.deleteCommentFailed"));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t("comments.justNow");
    if (diffMins < 60) return t("comments.minutesAgo", { count: diffMins });
    if (diffHours < 24) return t("comments.hoursAgo", { count: diffHours });
    if (diffDays < 7) return t("comments.daysAgo", { count: diffDays });

    return date.toLocaleDateString();
  };

  if (loading) {
    return <div className="text-center py-4">{t("common.loading")}</div>;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">
        {t("comments.title")} ({comments.length})
      </h3>

      {/* New Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmitComment} className="space-y-2">
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {error}
            </div>
          )}
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t("comments.placeholder")}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {submitting ? t("comments.submitting") : t("comments.submit")}
          </button>
        </form>
      ) : (
        <div className="p-4 bg-gray-50 rounded border border-gray-200">
          <p className="text-gray-600 text-sm">{t("comments.loginRequired")}</p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            {t("comments.noComments")}
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="font-medium text-gray-900">
                    {comment.user?.name || "Unknown User"}
                  </span>
                  <span className="text-gray-500 text-sm ml-2">
                    {formatDate(comment.createdAt)}
                  </span>
                  {comment.createdAt !== comment.updatedAt && (
                    <span className="text-gray-400 text-xs ml-1">
                      ({t("comments.edited")})
                    </span>
                  )}
                </div>

                {isAuthenticated && user?.id === comment.userId && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleStartEdit(comment)}
                      className="text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      {t("common.edit")}
                    </button>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      {t("common.delete")}
                    </button>
                  </div>
                )}
              </div>

              {editingId === comment.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleUpdateComment(comment.id)}
                      className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                    >
                      {t("common.save")}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                    >
                      {t("common.cancel")}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-700 whitespace-pre-wrap">
                  {comment.content}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
