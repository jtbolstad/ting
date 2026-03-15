import { useTranslation } from "react-i18next";
import type { Category } from "@ting/shared";

interface CategoriesSidebarProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

export function CategoriesSidebar({
  categories,
  selectedCategory,
  onCategoryChange,
}: CategoriesSidebarProps) {
  const { t } = useTranslation();

  return (
    <div className="w-64 flex-shrink-0">
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
