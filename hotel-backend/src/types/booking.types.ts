export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Booking {
  id: number;
  user_id: number;
  room_id: number;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  total_amount: number;
  status: BookingStatus;
  payment_status: PaymentStatus;
  special_requests?: string;
  created_at: string;
  updated_at: string;
}

 
export interface BookingWithRelations extends Booking {
  user?: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  room?: {
    room_number: string;
    room_type: string;
    price_per_night: number;
  };
}

 
export interface CreateBookingRequest {
  user_id: number;
  room_id: number;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  total_amount: number;
  special_requests?: string;
}

 
export interface UpdateBookingRequest {
  check_in?: string;
  check_out?: string;
  adults?: number;
  children?: number;
  total_amount?: number;
  status?: BookingStatus;
  payment_status?: PaymentStatus;
  special_requests?: string;
}
 
export interface BookingSearchParams {
  user_id?: number;
  room_id?: number;
  status?: BookingStatus;
  payment_status?: PaymentStatus;
  check_in_from?: string;
  check_in_to?: string;
  check_out_from?: string;
  check_out_to?: string;
}

export interface AvailabilityCheck {
  room_id: number;
  check_in: string;
  check_out: string;
}

export interface BookingSummary {
  total_bookings: number;
  confirmed_bookings: number;
  revenue: number;
  average_stay: number;
}

export interface BookingTimeline {
  date: string;
  check_ins: number;
  check_outs: number;
  occupied_rooms: number;
}
