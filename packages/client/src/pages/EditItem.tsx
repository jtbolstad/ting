import type { Category, Location } from "@ting/shared";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient } from "../api/client";
import { ImageInput } from "../components/ImageInput";
import { useAuth } from "../context/AuthContext";
import { useOrganization } from "../context/OrganizationContext";

export function EditItem() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const { activeOrganizationId } = useOrganization();
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    categoryId: "",
    imageUrl: "",
    status: "AVAILABLE",
    locationId: "",
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!activeOrganizationId) {
      setError(t("editItem.selectOrganization"));
      setLoading(false);
      return;
    }

    loadData();
  }, [isAuthenticated, activeOrganizationId, id]);

  const loadData = async () => {
    try {
      const [item, categoriesData, locationsData] = await Promise.all([
        apiClient.getItem(id!),
        apiClient.getCategories(activeOrganizationId!),
        apiClient.getLocations(),
      ]);

      setCategories(categoriesData);
      setLocations(locationsData);
      setFormData({
        name: item.name,
        description: item.description || "",
        categoryId: item.categoryId,
        imageUrl: item.imageUrl || "",
        status: item.status,
        locationId: item.locationId || "",
      });
    } catch (error: any) {
      console.error("Failed to load item:", error);
      setError(error.message || t("editItem.loadError"));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await apiClient.updateItem(id!, {
        name: formData.name,
        description: formData.description || undefined,
        categoryId: formData.categoryId,
        imageUrl: formData.imageUrl || undefined,
        status: formData.status as any,
        locationId: formData.locationId || null,
      });

      navigate(`/items/${id}`);
    } catch (err: any) {
      setError(err.message || t("errors.updateItemFailed"));
    } finally {
      setSubmitting(false);
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">{t("common.loading")}</div>
      </div>
    );
  }

  if (!activeOrganizationId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">{t("editItem.selectOrganization")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">{t("editItem.title")}</h1>
        <p className="text-gray-600 mb-8">{t("editItem.description")}</p>

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
              {t("editItem.name")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="categoryId"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("editItem.category")} <span className="text-red-500">*</span>
            </label>
            <select
              id="categoryId"
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">{t("editItem.selectCategory")}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {t(`categories.${category.name}`, category.name)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("editItem.status")} <span className="text-red-500">*</span>
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="AVAILABLE">{t("catalog.status.available")}</option>
              <option value="CHECKED_OUT">
                {t("catalog.status.checkedOut")}
              </option>
              <option value="MAINTENANCE">
                {t("catalog.status.maintenance")}
              </option>
              <option value="RETIRED">{t("catalog.status.retired")}</option>
            </select>
          </div>

          {locations.length > 0 && (
            <div>
              <label
                htmlFor="locationId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("editItem.location")}
              </label>
              <select
                id="locationId"
                name="locationId"
                value={formData.locationId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">{t("editItem.noLocation")}</option>
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
              {t("editItem.descriptionLabel")}
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder={t("editItem.descriptionPlaceholder")}
            />
          </div>

          <ImageInput
            value={formData.imageUrl}
            onChange={(url) =>
              setFormData((prev) => ({ ...prev, imageUrl: url }))
            }
            label={t("editItem.imageUrl")}
          />

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? t("editItem.updating") : t("editItem.submit")}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/items/${id}`)}
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
