import { ItemComments } from "../ItemComments";

interface ItemCommentsCardProps {
  itemId: string;
}

export function ItemCommentsCard({ itemId }: ItemCommentsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <ItemComments itemId={itemId} />
    </div>
  );
}
