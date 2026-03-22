import { useTranslation } from "react-i18next";
import type { Category } from "@ting/shared";

interface CategoriesSidebarProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
  variant?: "sidebar" | "chips";
}

export function CategoriesSidebar({
  categories,
  selectedCategory,
  onCategoryChange,
  variant = "sidebar",
}: CategoriesSidebarProps) {
  const { t } = useTranslation();

  if (variant === "chips") {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => onCategoryChange("")}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm border ${
            !selectedCategory
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-white text-gray-700 border-gray-300"
          }`}
        >
          {t("catalog.allItems")}
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm border ${
              selectedCategory === cat.id
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-700 border-gray-300"
            }`}
          >
            {t(`categories.${cat.name}`, cat.name)} ({cat.itemCount || 0})
          </button>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-bold mb-4">{t("catalog.categories")}</h3>
        <div className="space-y-2">
          <button
            onClick={() => onCategoryChange("")}
            className={`block w-full text-left px-3 py-2 rounded ${
              !selectedCategory
                ? "bg-indigo-100 text-indigo-700"
                : "hover:bg-gray-100"
            }`}
          >
            {t("catalog.allItems")}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`block w-full text-left px-3 py-2 rounded ${
                selectedCategory === cat.id
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
  );
}
