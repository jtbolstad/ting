import { useState } from "react";
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
  const { user, isAdmin, isOrgAdmin, isOrgManager } = useAuth();
  const navigate = useNavigate();
  const canEdit = isAdmin || isOrgAdmin || isOrgManager || (!!user && user.id === item.ownerId);

  const allImages = item.images && item.images.length > 0
    ? item.images
    : item.imageUrl
      ? [{ id: "legacy", url: item.imageUrl, position: 0, itemId: item.id }]
      : [];

  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = allImages[activeIndex];

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="md:flex">
        <div className="md:w-1/2 flex flex-col">
          <div className="bg-gray-200 flex items-center justify-center h-56 md:h-80">
            {activeImage ? (
              <img
                src={activeImage.url}
                alt={item.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-gray-400 text-8xl">📦</span>
            )}
          </div>
          {allImages.length > 1 && (
            <div className="flex gap-1.5 p-2 overflow-x-auto bg-gray-50">
              {allImages.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  className={`flex-shrink-0 w-14 h-14 rounded overflow-hidden border-2 transition-colors ${i === activeIndex ? "border-indigo-500" : "border-transparent"}`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="md:w-1/2 p-4 md:p-8">
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

          <div className="mb-4 flex flex-wrap gap-2">
            <span
              className={`inline-block px-3 py-1 rounded ${
                item.status === "AVAILABLE"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {t(`catalog.status.${item.status.toLowerCase()}`)}
            </span>
            {item.condition && (
              <span className={`inline-block px-3 py-1 rounded text-sm ${
                item.condition === "GOOD" ? "bg-emerald-100 text-emerald-800" :
                item.condition === "FAIR" ? "bg-yellow-100 text-yellow-800" :
                "bg-orange-100 text-orange-800"
              }`}>
                {t(`item.condition.${item.condition === "NEEDS_REPAIR" ? "needsRepair" : item.condition.toLowerCase()}`)}
              </span>
            )}
          </div>

          {item.location && (
            <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
              <span>📍</span>
              <span>{item.location.name}{item.location.address ? ` – ${item.location.address}` : ""}</span>
            </div>
          )}

          <p className="text-gray-700 mb-4">
            {item.description || t("item.noDescription")}
          </p>

          {item.tags && item.tags.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-sm rounded border border-indigo-100">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {canEdit && (
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
