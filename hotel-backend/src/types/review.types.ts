export interface Review {
  id: number;
  user_id: number;
  room_id: number;
  booking_id: number;
  rating: number;
  comment?: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}


export interface ReviewWithRelations extends Review {
  user?: {
    first_name: string;
    last_name: string;
  };
  room?: {
    room_number: string;
    room_type: string;
  };
}


export interface CreateReviewRequest {
  user_id: number;
  room_id: number;
  booking_id: number;
  rating: number;
  comment?: string;
}


export interface UpdateReviewRequest {
  rating?: number;
  comment?: string;
  is_approved?: boolean;
}


export interface ReviewResponse {
  id: number;
  rating: number;
  comment?: string;
  created_at: string;
  user: {
    first_name: string;
    last_name: string;
  };
  room: {
    room_number: string;
    room_type: string;
  };
}

 
export interface ReviewStats {
  average_rating: number;
  total_reviews: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  recent_reviews: ReviewResponse[];
}


export interface ReviewSearchParams {
  room_id?: number;
  user_id?: number;
  min_rating?: number;
  max_rating?: number;
  is_approved?: boolean;
}

 
export interface RatingSummary {
  room_id: number;
  average_rating: number;
  total_reviews: number;
  recommendation_rate: number;  
}
