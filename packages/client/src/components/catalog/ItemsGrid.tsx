import { useTranslation } from "react-i18next";
import { ItemCard } from "./ItemCard";
import type { Item } from "@ting/shared";

interface ItemsGridProps {
  items: Item[];
}

export function ItemsGrid({ items }: ItemsGridProps) {
  const { t } = useTranslation();

  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <div className="text-5xl mb-3">🔍</div>
        <p className="text-lg">{t("catalog.noItems")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
