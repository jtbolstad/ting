import { ItemReviews } from "../ItemReviews";

interface ItemReviewsCardProps {
  itemId: string;
}

export function ItemReviewsCard({ itemId }: ItemReviewsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <ItemReviews itemId={itemId} />
    </div>
  );
}
