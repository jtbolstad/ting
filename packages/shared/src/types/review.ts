export interface Review {
  id: string;
  itemId: string;
  userId: string;
  rating: number; // 1-5
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
  };
}

export interface CreateReviewInput {
  itemId: string;
  rating: number; // 1-5
  comment?: string;
}

export interface UpdateReviewInput {
  rating?: number; // 1-5
  comment?: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}
