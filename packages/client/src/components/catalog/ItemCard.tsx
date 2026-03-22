import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ReviewStars } from "../ReviewStars";
import type { Item } from "@ting/shared";

interface ItemCardProps {
  item: Item;
}

export function ItemCard({ item }: ItemCardProps) {
  const { t } = useTranslation();

  return (
    <Link
      to={`/items/${item.id}`}
      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
    >
      <div className="h-48 bg-gray-200 flex items-center justify-center">
        {(item.images?.[0]?.url || item.imageUrl) ? (
          <img
            src={item.images?.[0]?.url ?? item.imageUrl!}
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
            ? t(`categories.${item.category.name}`, item.category.name)
            : ""}
        </p>
        <p className="text-sm text-gray-700 line-clamp-2">{item.description}</p>
        {item.reviewCount !== undefined && item.reviewCount > 0 && (
          <div className="mt-2">
            <ReviewStars
              rating={Math.round(item.averageRating || 0)}
              readonly
              size="sm"
              showCount
              count={item.reviewCount}
            />
          </div>
        )}
        {item.tags && item.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {item.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                {tag}
              </span>
            ))}
          </div>
        )}
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
  );
}
