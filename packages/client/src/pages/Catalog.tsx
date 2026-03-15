import React, { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiClient } from "../api/client";
import { useOrganization } from "../context/OrganizationContext";
import type { Item, Category } from "@ting/shared";

export function Catalog() {
  const { t } = useTranslation();
  const { activeOrganizationId, activeOrganization } = useOrganization();
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const searchQuery = searchParams.get("q") || "";
  const categoryFilter = searchParams.get("category") || "";

  const loadData = useCallback(async () => {
    if (!activeOrganizationId) return;

    setLoading(true);
    try {
      const [itemsResponse, categoriesData] = await Promise.all([
        apiClient.getItems({
          organizationId: activeOrganizationId,
          q: searchQuery || undefined,
          categoryId: categoryFilter || undefined,
        }),
        apiClient.getCategories(activeOrganizationId),
      ]);
      setItems(itemsResponse.items);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }, [activeOrganizationId, searchQuery, categoryFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get("search") as string;
    setSearchParams((prev) => {
      if (query) prev.set("q", query);
      else prev.delete("q");
      return prev;
    });
  };

  const handleCategoryChange = (categoryId: string) => {
    setSearchParams((prev) => {
      if (categoryId) prev.set("category", categoryId);
      else prev.delete("category");
      return prev;
    });
  };

  if (loading) {
    return <div className="text-center py-12">{t("catalog.loading")}</div>;
  }

  if (!activeOrganizationId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No organization selected</p>
          <p className="text-sm text-gray-400">
            Please select an organization from the navigation bar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-4xl font-bold">{t("catalog.title")}</h1>
        {activeOrganization && (
          <p className="text-gray-600 mt-2">{activeOrganization.name}</p>
        )}
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-4">{t("catalog.categories")}</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleCategoryChange("")}
                className={`block w-full text-left px-3 py-2 rounded ${
                  !categoryFilter
                    ? "bg-indigo-100 text-indigo-700"
                    : "hover:bg-gray-100"
                }`}
              >
                {t("catalog.allItems")}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`block w-full text-left px-3 py-2 rounded ${
                    categoryFilter === cat.id
                      ? "bg-indigo-100 text-indigo-700"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {t(`categories.${cat.name}`, cat.name)} ({cat.itemCount || 0})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1">
          {/* Search */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                name="search"
                defaultValue={searchQuery}
                placeholder={t("catalog.searchPlaceholder")}
                className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                {t("catalog.search")}
              </button>
            </div>
          </form>

          {/* Items grid */}
          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {t("catalog.noItems")}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <Link
                  key={item.id}
                  to={`/items/${item.id}`}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
                >
                  <div className="h-48 bg-gray-200 flex items-center justify-center">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-400 text-4xl">📦</span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {item.category?.name
                        ? t(
                            `categories.${item.category.name}`,
                            item.category.name,
                          )
                        : ""}
                    </p>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {item.description}
                    </p>
                    <div className="mt-3">
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded ${
                          item.status === "AVAILABLE"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {t(`catalog.status.${item.status.toLowerCase()}`)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
