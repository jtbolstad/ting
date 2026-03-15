import { useTranslation } from "react-i18next";
import { AvailabilityTimeline } from "../calendar/AvailabilityTimeline";

interface ItemTimelineProps {
  itemId: string;
  daysAhead?: number;
}

export function ItemTimeline({ itemId, daysAhead = 60 }: ItemTimelineProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">
        {t("item.availability.title", { days: daysAhead })}
      </h2>
      <AvailabilityTimeline itemId={itemId} daysAhead={daysAhead} />
    </div>
  );
}
