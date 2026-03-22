import type { Category, Item } from "@ting/shared";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { apiClient } from "../api/client";
import { CatalogHeader } from "../components/catalog/CatalogHeader";
import { CatalogSearchBar } from "../components/catalog/CatalogSearchBar";
import { CategoriesSidebar } from "../components/catalog/CategoriesSidebar";
import { ItemsGrid } from "../components/catalog/ItemsGrid";
import { useOrganization } from "../context/OrganizationContext";
import { Spinner } from "../components/ui/Spinner";

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
    return <Spinner />;
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
      <CatalogHeader organization={activeOrganization ?? null} />

      {/* Mobile: search + category chips above grid */}
      <div className="lg:hidden space-y-3 mb-4">
        <CatalogSearchBar defaultValue={searchQuery} onSearch={handleSearch} />
        <CategoriesSidebar
          categories={categories}
          selectedCategory={categoryFilter}
          onCategoryChange={handleCategoryChange}
          variant="chips"
        />
      </div>

      {/* Desktop: sidebar + grid */}
      <div className="hidden lg:flex gap-8">
        <div className="w-64 flex-shrink-0 space-y-4">
          <CatalogSearchBar
            defaultValue={searchQuery}
            onSearch={handleSearch}
          />
          <CategoriesSidebar
            categories={categories}
            selectedCategory={categoryFilter}
            onCategoryChange={handleCategoryChange}
          />
        </div>

        <div className="flex-1">
          <ItemsGrid items={items} />
        </div>
      </div>

      {/* Mobile: grid */}
      <div className="lg:hidden">
        <ItemsGrid items={items} />
      </div>
    </div>
  );
}
