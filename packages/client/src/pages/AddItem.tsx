import type { Category, Location } from "@ting/shared";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../api/client";
import { ImageInput } from "../components/ImageInput";
import { TagInput } from "../components/TagInput";
import { useAuth } from "../context/AuthContext";
import { useOrganization } from "../context/OrganizationContext";

export function AddItem() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { activeOrganizationId } = useOrganization();
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tags, setTags] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    categoryId: "",
    imageUrl: "",
    locationId: "",
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!activeOrganizationId) {
      setError(t("addItem.selectOrganization"));
      return;
    }

    loadCategories();
  }, [isAuthenticated, activeOrganizationId]);

  const loadCategories = async () => {
    try {
      const [cats, locs] = await Promise.all([
        apiClient.getCategories(activeOrganizationId!),
        apiClient.getLocations(),
      ]);
      setCategories(cats);
      setLocations(locs);
    } catch (error) {
      console.error("Failed to load categories:", error);
      setError(t("addItem.loadCategoriesError"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let pdfUrl: string | undefined;
      if (pdfFile) {
        setUploading(true);
        try {
          const result = await apiClient.uploadManual(pdfFile);
          pdfUrl = result.url;
        } finally {
          setUploading(false);
        }
      }

      const item = await apiClient.createItem({
        name: formData.name,
        description: formData.description || undefined,
        categoryId: formData.categoryId,
        imageUrl: formData.imageUrl || undefined,
        locationId: formData.locationId || undefined,
        tags: tags.length > 0 ? tags : undefined,
      });

      if (pdfUrl) {
        await apiClient.createManual(item.id, {
          type: "PDF",
          label: pdfFile!.name.replace(/\.pdf$/i, ""),
          url: pdfUrl,
        });
      }

      navigate(`/items/${item.id}`);
    } catch (err: any) {
      setError(err.message || t("errors.createItemFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (!activeOrganizationId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">{t("addItem.selectOrganization")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">{t("addItem.title")}</h1>
        <p className="text-gray-600 mb-8">{t("addItem.description")}</p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow p-6 space-y-4"
        >
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("addItem.name")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder={t("addItem.namePlaceholder")}
            />
          </div>

          <div>
            <label
              htmlFor="categoryId"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("addItem.category")} <span className="text-red-500">*</span>
            </label>
            <select
              id="categoryId"
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">{t("addItem.selectCategory")}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {t(`categories.${category.name}`, category.name)}
                </option>
              ))}
            </select>
          </div>

          {locations.length > 0 && (
            <div>
              <label
                htmlFor="locationId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("addItem.location")}
              </label>
              <select
                id="locationId"
                name="locationId"
                value={formData.locationId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">{t("addItem.noLocation")}</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("addItem.descriptionLabel")}
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder={t("addItem.descriptionPlaceholder")}
            />
          </div>

          <ImageInput
            value={formData.imageUrl}
            onChange={(url) =>
              setFormData((prev) => ({ ...prev, imageUrl: url }))
            }
            label={t("addItem.imageUrl")}
          />

          <TagInput
            tags={tags}
            onChange={setTags}
            label={t("tags.label")}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("addItem.manualLabel")}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                {t("addItem.manualChooseFile")}
              </button>
              {pdfFile ? (
                <span className="text-sm text-gray-700 truncate max-w-xs">{pdfFile.name}</span>
              ) : (
                <span className="text-sm text-gray-400">{t("addItem.manualNoFile")}</span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">{t("addItem.manualHint")}</p>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {uploading ? t("addItem.uploadingManual") : loading ? t("addItem.creating") : t("addItem.submit")}
            </button>
            <button
              type="button"
              onClick={() => navigate("/catalog")}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              {t("common.cancel")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
