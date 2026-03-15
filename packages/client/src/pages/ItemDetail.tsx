import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiClient } from "../api/client";
import { ItemDetailsCard } from "../components/item/ItemDetailsCard";
import { ItemTimeline } from "../components/item/ItemTimeline";
import { ItemReservationForm } from "../components/item/ItemReservationForm";
import { ItemCommentsCard } from "../components/item/ItemCommentsCard";
import { ItemReviewsCard } from "../components/item/ItemReviewsCard";
import type { Item } from "@ting/shared";

export function ItemDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItem();
  }, [id]);

  const loadItem = async () => {
    try {
      const data = await apiClient.getItem(id!);
      setItem(data);
    } catch (error) {
      console.error("Failed to load item:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">{t("item.loading")}</div>;
  }

  if (!item) {
    return <div className="text-center py-12">{t("item.notFound")}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <ItemDetailsCard item={item} />
        <ItemTimeline itemId={id!} daysAhead={60} />
        <ItemReservationForm itemId={id!} itemStatus={item.status} />
        <ItemCommentsCard itemId={id!} />
        <ItemReviewsCard itemId={id!} />
      </div>
    </div>
  );
}
