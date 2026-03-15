import { useState } from "react";

interface ReviewStarsProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  count?: number;
}

export function ReviewStars({
  rating,
  onRatingChange,
  readonly = false,
  size = "md",
  showCount = false,
  count,
}: ReviewStarsProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: "text-sm",
    md: "text-xl",
    lg: "text-3xl",
  };

  const displayRating = hoverRating || rating;

  const handleClick = (newRating: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(newRating);
    }
  };

  const handleMouseEnter = (starRating: number) => {
    if (!readonly) {
      setHoverRating(starRating);
    }
  };

  const handleMouseLeave = () => {
    setHoverRating(0);
  };

  return (
    <div className="flex items-center gap-1">
      <div className={`flex items-center ${sizeClasses[size]}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            onMouseLeave={handleMouseLeave}
            disabled={readonly}
            className={`${
              readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
            } transition-transform ${
              star <= displayRating ? "text-yellow-400" : "text-gray-300"
            }`}
            aria-label={`${star} star${star !== 1 ? "s" : ""}`}
          >
            {star <= displayRating ? "★" : "☆"}
          </button>
        ))}
      </div>
      {showCount && count !== undefined && (
        <span className="text-sm text-gray-600 ml-1">({count})</span>
      )}
    </div>
  );
}
