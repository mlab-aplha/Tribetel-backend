import { User, Hotel, Room, Booking, Payment, Review } from "../models";

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationInfo;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Auth Types
export interface JwtPayload {
  id: string;
  iat?: number;
  exp?: number;
}

export interface TokenResponse {
  success: boolean;
  token: string;
  refreshToken: string;
  user: User;
}

// Request Body Types
export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  password: string;
}

// Hotel Types
export interface CreateHotelRequest {
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  latitude?: number;
  longitude?: number;
  star_rating: number;
  phone_number: string;
  email: string;
  website?: string;
  check_in_time?: string;
  check_out_time?: string;
  policies?: Record<string, any>;
  amenity_ids?: string[];
}

export interface UpdateHotelRequest extends Partial<CreateHotelRequest> {}

export interface HotelSearchQuery {
  page?: string;
  limit?: string;
  city?: string;
  country?: string;
  min_price?: string;
  max_price?: string;
  star_rating?: string;
  amenities?: string;
  search?: string;
}

// Room Types
export interface CreateRoomRequest {
  room_type: string;
  description?: string;
  price_per_night: number;
  capacity: number;
  size_sqm?: number;
  bed_type: string;
  number_of_beds?: number;
  total_rooms: number;
  amenities?: Record<string, any>;
  images?: string[];
}

export interface UpdateRoomRequest extends Partial<CreateRoomRequest> {}

export interface RoomAvailabilityQuery {
  check_in?: string;
  check_out?: string;
  number_of_rooms?: string;
  guests?: string;
}

// Booking Types
export interface CreateBookingRequest {
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  number_of_guests: number;
  number_of_rooms?: number;
  special_requests?: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
}

export interface UpdateBookingStatusRequest {
  status: "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled";
}

export interface CancelBookingRequest {
  cancellation_reason?: string;
}

export interface BookingQuery {
  page?: string;
  limit?: string;
  status?: string;
  hotel_id?: string;
  date_from?: string;
  date_to?: string;
}

// Review Types
export interface CreateReviewRequest {
  hotel_id: string;
  rating: number;
  title: string;
  comment: string;
  cleanliness_rating?: number;
  service_rating?: number;
  location_rating?: number;
  value_rating?: number;
}

export interface UpdateReviewRequest extends Partial<CreateReviewRequest> {}

export interface ReviewQuery {
  page?: string;
  limit?: string;
  sort?: "recent" | "highest" | "lowest";
}

// Payment Types
export interface ConfirmPaymentRequest {
  payment_intent_id: string;
}

export interface StripeWebhookEvent {
  type: string;
  data: {
    object: any;
  };
}

// Favorite Types
export interface AddFavoriteRequest {
  hotel_id: string;
}

// Amenity Types
export interface CreateAmenityRequest {
  name: string;
  category:
    | "general"
    | "room"
    | "bathroom"
    | "kitchen"
    | "entertainment"
    | "outdoor"
    | "service";
  icon?: string;
}

export interface UpdateAmenityRequest extends Partial<CreateAmenityRequest> {}

// User Types
export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
}

export interface UserSearchQuery {
  page?: string;
  limit?: string;
  role?: "user" | "admin";
  search?: string;
}

// Email Types
export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export interface BookingEmailData {
  id: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
}

// Cloudinary Types
export interface CloudinaryUploadResult {
  url: string;
  public_id: string;
}

// Stripe Types
export interface StripePaymentIntentMetadata {
  booking_id: string;
  user_id: string;
  hotel_name: string;
}
