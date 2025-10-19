export type RoomType = 'standard' | 'deluxe' | 'suite' | 'family' | 'executive';
export type RoomStatus = 'available' | 'occupied' | 'maintenance' | 'cleaning';

export interface Room {
  id: number;
  room_number: string;
  room_type: RoomType;
  description?: string;
  price_per_night: number;
  capacity: number;
  amenities?: string[];
  images?: string[];
  status: RoomStatus;
  created_at: string;
  updated_at: string;
}


export interface CreateRoomRequest {
  room_number: string;
  room_type: RoomType;
  description?: string;
  price_per_night: number;
  capacity: number;
  amenities?: string[];
  images?: string[];
}


export interface UpdateRoomRequest {
  room_number?: string;
  room_type?: RoomType;
  description?: string;
  price_per_night?: number;
  capacity?: number;
  amenities?: string[];
  images?: string[];
  status?: RoomStatus;
}

 
export interface RoomSearchParams {
  room_type?: RoomType;
  min_price?: number;
  max_price?: number;
  capacity?: number;
  amenities?: string[];
  check_in?: string;
  check_out?: string;
  status?: RoomStatus;
}

 
export interface RoomAvailability {
  room_id: number;
  room_number: string;
  room_type: RoomType;
  price_per_night: number;
  capacity: number;
  amenities: string[];
  is_available: boolean;
  unavailable_dates?: string[];
}


export interface RoomWithAvailability extends Room {
  is_available: boolean;
  next_available_date?: string;
}
