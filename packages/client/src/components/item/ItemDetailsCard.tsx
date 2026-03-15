import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { ReviewStars } from "../ReviewStars";
import type { Item } from "@ting/shared";

interface ItemDetailsCardProps {
  item: Item;
}

export function ItemDetailsCard({ item }: ItemDetailsCardProps) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
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

          {item.reviewCount !== undefined && item.reviewCount > 0 && (
            <div className="mb-4">
              <ReviewStars
                rating={Math.round(item.averageRating || 0)}
                readonly
                size="md"
                showCount
                count={item.reviewCount}
              />
            </div>
          )}

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
                onClick={() => navigate(`/items/${item.id}/edit`)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                {t("item.edit")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
