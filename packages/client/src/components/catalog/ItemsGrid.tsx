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
      <div className="text-center py-12 text-gray-500">
        {t("catalog.noItems")}
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
