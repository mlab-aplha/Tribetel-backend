import pool from '../config/database';

export interface AvailabilityCheck {
  roomId: number;
  checkIn: string;
  checkOut: string;
}

export interface AvailabilityResult {
  isAvailable: boolean;
  conflictingBookings?: Array<{
    id: number;
    checkIn: string;
    checkOut: string;
  }>;
}

export class AvailabilityService {
   
  static async checkRoomAvailability(
    roomId: number, 
    checkIn: string, 
    checkOut: string
  ): Promise<AvailabilityResult> {
    try {
      const query = `
        SELECT id, check_in, check_out 
        FROM bookings 
        WHERE room_id = $1 
        AND status IN ('confirmed', 'checked_in')
        AND (
          (check_in <= $2 AND check_out >= $2) OR
          (check_in <= $3 AND check_out >= $3) OR
          (check_in >= $2 AND check_out <= $3)
        )
      `;
      
      const result = await pool.query(query, [roomId, checkIn, checkOut]);
      const conflictingBookings = result.rows;

      return {
        isAvailable: conflictingBookings.length === 0,
        conflictingBookings: conflictingBookings.length > 0 ? conflictingBookings : undefined
      };
    } catch (error) {
      console.error('Availability check error:', error);
      throw new Error('Failed to check room availability');
    }
  }

   
  static async getAvailableRooms(
    checkIn: string, 
    checkOut: string, 
    roomType?: string
  ): Promise<any[]> {
    try {
      let query = `
        SELECT r.* 
        FROM rooms r
        WHERE r.status = 'available'
        AND NOT EXISTS (
          SELECT 1 FROM bookings b
          WHERE b.room_id = r.id
          AND b.status IN ('confirmed', 'checked_in')
          AND (
            (b.check_in <= $1 AND b.check_out >= $1) OR
            (b.check_in <= $2 AND b.check_out >= $2) OR
            (b.check_in >= $1 AND b.check_out <= $2)
          )
        )
      `;
      
      const params: any[] = [checkIn, checkOut];
      
      if (roomType) {
        query += ' AND r.room_type = $3';
        params.push(roomType);
      }
      
      query += ' ORDER BY r.price_per_night ASC';
      
      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Get available rooms error:', error);
      throw new Error('Failed to get available rooms');
    }
  }

   
  static async getRoomAvailabilityCalendar(
    roomId: number, 
    startDate: string, 
    endDate: string
  ): Promise<{ date: string; available: boolean }[]> {
    try {
      const query = `
        SELECT 
          date_series.date,
          NOT EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.room_id = $1
            AND b.status IN ('confirmed', 'checked_in')
            AND b.check_in <= date_series.date
            AND b.check_out > date_series.date
          ) as available
        FROM generate_series($2::date, $3::date, '1 day'::interval) as date_series(date)
        ORDER BY date_series.date
      `;
      
      const result = await pool.query(query, [roomId, startDate, endDate]);
      return result.rows;
    } catch (error) {
      console.error('Availability calendar error:', error);
      throw new Error('Failed to get availability calendar');
    }
  }

   
  static validateBookingDates(checkIn: string, checkOut: string): { isValid: boolean; error?: string } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    if (checkInDate < today) {
      return { isValid: false, error: 'Check-in date cannot be in the past' };
    }
    
    if (checkOutDate <= checkInDate) {
      return { isValid: false, error: 'Check-out date must be after check-in date' };
    }
    
    const minStay = 1;  
    const maxStay = 30;
    
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (nights < minStay) {
      return { isValid: false, error: `Minimum stay is ${minStay} night` };
    }
    
    if (nights > maxStay) {
      return { isValid: false, error: `Maximum stay is ${maxStay} nights` };
    }
    
    return { isValid: true };
  }
}

export default AvailabilityService;
