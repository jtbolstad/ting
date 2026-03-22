import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiClient } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../ui/Toast";
import { useConfirm } from "../ui/ConfirmModal";
import type { ItemManual } from "@ting/shared";

interface ItemManualsCardProps {
  itemId: string;
}

export function ItemManualsCard({ itemId }: ItemManualsCardProps) {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [manuals, setManuals] = useState<ItemManual[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<"PDF" | "LINK" | "TEXT">("LINK");
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadManuals();
  }, [itemId]);

  const loadManuals = async () => {
    try {
      const data = await apiClient.getItemManuals(itemId);
      setManuals(data);
    } catch {
      // silently fail if no manuals
    }
  };

  const handleUploadPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await apiClient.uploadManual(file);
      setUrl(result.url);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.createManual(itemId, {
        type,
        label,
        url: type !== "TEXT" ? url : undefined,
        content: type === "TEXT" ? content : undefined,
      });
      setLabel("");
      setUrl("");
      setContent("");
      setType("LINK");
      setShowForm(false);
      await loadManuals();
    } catch (err: any) {
      toast.error(err.message || "Failed to add manual");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (manualId: string) => {
    if (!await confirm(t("item.manuals.confirmDelete"))) return;
    try {
      await apiClient.deleteManual(itemId, manualId);
      await loadManuals();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete manual");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{t("item.manuals.title")}</h2>
        {isAdmin && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            {t("item.manuals.addManual")}
          </button>
        )}
      </div>

      {manuals.length === 0 && !showForm && (
        <p className="text-gray-500 text-sm">{t("item.manuals.noManuals")}</p>
      )}

      <ul className="space-y-2 mb-4">
        {manuals.map((manual) => (
          <li key={manual.id} className="flex items-center justify-between border rounded px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 uppercase">
                {manual.type}
              </span>
              {manual.type === "TEXT" ? (
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium text-gray-800">{manual.label}</summary>
                  <p className="mt-2 text-gray-600 whitespace-pre-wrap">{manual.content}</p>
                </details>
              ) : (
                <a
                  href={manual.url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-indigo-600 hover:underline"
                >
                  {manual.label}
                </a>
              )}
            </div>
            {isAdmin && (
              <button
                onClick={() => handleDelete(manual.id)}
                className="text-red-500 hover:text-red-700 text-sm ml-4"
              >
                {t("item.manuals.delete")}
              </button>
            )}
          </li>
        ))}
      </ul>

      {showForm && isAdmin && (
        <form onSubmit={handleSubmit} className="border rounded p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">{t("item.manuals.type")}</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "PDF" | "LINK" | "TEXT")}
              className="w-full px-3 py-2 border rounded text-sm"
            >
              <option value="LINK">{t("item.manuals.typeLink")}</option>
              <option value="PDF">{t("item.manuals.typePdf")}</option>
              <option value="TEXT">{t("item.manuals.typeText")}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("item.manuals.label")}</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              placeholder={t("item.manuals.labelPlaceholder")}
              className="w-full px-3 py-2 border rounded text-sm"
            />
          </div>

          {type === "PDF" && (
            <div>
              <label className="block text-sm font-medium mb-1">{t("item.manuals.uploadPdf")}</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleUploadPdf}
                className="hidden"
              />
              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  {uploading ? t("item.manuals.uploading") : t("item.manuals.uploadPdf")}
                </button>
                {url && <span className="text-xs text-green-600 truncate max-w-xs">{url}</span>}
              </div>
            </div>
          )}

          {type === "LINK" && (
            <div>
              <label className="block text-sm font-medium mb-1">{t("item.manuals.url")}</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                placeholder={t("item.manuals.urlPlaceholder")}
                className="w-full px-3 py-2 border rounded text-sm"
              />
            </div>
          )}

          {type === "TEXT" && (
            <div>
              <label className="block text-sm font-medium mb-1">{t("item.manuals.content")}</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={4}
                placeholder={t("item.manuals.contentPlaceholder")}
                className="w-full px-3 py-2 border rounded text-sm"
              />
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting || (type === "PDF" && !url)}
              className="px-4 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? t("item.manuals.adding") : t("item.manuals.add")}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-gray-200 rounded text-sm hover:bg-gray-300"
            >
              {t("common.cancel")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
