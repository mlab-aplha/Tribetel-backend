import pool from '../config/database';
import { AvailabilityService } from './availabilityService';

export interface CreateBookingData {
  userId: number;
  roomId: number;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  totalAmount: number;
  specialRequests?: string;
}

export interface BookingResult {
  success: boolean;
  booking?: any;
  error?: string;
}

export class BookingService {
   
  static async createBooking(bookingData: CreateBookingData): Promise<BookingResult> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

       
      const dateValidation = AvailabilityService.validateBookingDates(
        bookingData.checkIn, 
        bookingData.checkOut
      );
      
      if (!dateValidation.isValid) {
        return { success: false, error: dateValidation.error };
      }

       
      const availability = await AvailabilityService.checkRoomAvailability(
        bookingData.roomId,
        bookingData.checkIn,
        bookingData.checkOut
      );
      
      if (!availability.isAvailable) {
        return { 
          success: false, 
          error: 'Room is not available for the selected dates' 
        };
      }

      
      const roomQuery = 'SELECT capacity FROM rooms WHERE id = $1';
      const roomResult = await client.query(roomQuery, [bookingData.roomId]);
      
      if (roomResult.rows.length === 0) {
        return { success: false, error: 'Room not found' };
      }
      
      const roomCapacity = roomResult.rows[0].capacity;
      const totalGuests = bookingData.adults + bookingData.children;
      
      if (totalGuests > roomCapacity) {
        return { 
          success: false, 
          error: `Room capacity exceeded. Maximum ${roomCapacity} guests allowed.` 
        };
      }

       
      const insertQuery = `
        INSERT INTO bookings (
          user_id, room_id, check_in, check_out, adults, children, 
          total_amount, special_requests, status, payment_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'confirmed', 'pending')
        RETURNING *
      `;
      
      const bookingResult = await client.query(insertQuery, [
        bookingData.userId,
        bookingData.roomId,
        bookingData.checkIn,
        bookingData.checkOut,
        bookingData.adults,
        bookingData.children,
        bookingData.totalAmount,
        bookingData.specialRequests || null
      ]);
      
      await client.query('COMMIT');
      
      return { 
        success: true, 
        booking: bookingResult.rows[0] 
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Booking creation error:', error);
      return { success: false, error: 'Failed to create booking' };
    } finally {
      client.release();
    }
  }

  
  static async getBookingById(bookingId: number): Promise<any> {
    try {
      const query = `
        SELECT 
          b.*,
          u.first_name, u.last_name, u.email, u.phone,
          r.room_number, r.room_type, r.price_per_night
        FROM bookings b
        LEFT JOIN users u ON b.user_id = u.id
        LEFT JOIN rooms r ON b.room_id = r.id
        WHERE b.id = $1
      `;
      
      const result = await pool.query(query, [bookingId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Get booking error:', error);
      throw new Error('Failed to get booking');
    }
  }
 
  static async getUserBookings(userId: number): Promise<any[]> {
    try {
      const query = `
        SELECT 
          b.*,
          r.room_number, r.room_type, r.price_per_night
        FROM bookings b
        LEFT JOIN rooms r ON b.room_id = r.id
        WHERE b.user_id = $1
        ORDER BY b.created_at DESC
      `;
      
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Get user bookings error:', error);
      throw new Error('Failed to get user bookings');
    }
  }
 
  static async updateBookingStatus(
    bookingId: number, 
    status: string
  ): Promise<boolean> {
    try {
      const validStatuses = ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'];
      
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid booking status');
      }
      
      const query = 'UPDATE bookings SET status = $1 WHERE id = $2';
      await pool.query(query, [status, bookingId]);
      
      return true;
    } catch (error) {
      console.error('Update booking status error:', error);
      throw new Error('Failed to update booking status');
    }
  }
 
  static async cancelBooking(bookingId: number, userId: number): Promise<boolean> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
       
      const verifyQuery = 'SELECT id FROM bookings WHERE id = $1 AND user_id = $2';
      const verifyResult = await client.query(verifyQuery, [bookingId, userId]);
      
      if (verifyResult.rows.length === 0) {
        throw new Error('Booking not found or access denied');
      }
      
       
      const updateQuery = 'UPDATE bookings SET status = $1 WHERE id = $2';
      await client.query(updateQuery, ['cancelled', bookingId]);
      
      await client.query('COMMIT');
      return true;
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Cancel booking error:', error);
      throw new Error('Failed to cancel booking');
    } finally {
      client.release();
    }
  }

   
  static async getBookingStats(): Promise<any> {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_bookings,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
          COUNT(CASE WHEN status = 'checked_in' THEN 1 END) as active_stays,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
          COALESCE(SUM(total_amount), 0) as total_revenue,
          AVG(total_amount) as average_booking_value
        FROM bookings
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      `;
      
      const result = await pool.query(query);
      return result.rows[0];
    } catch (error) {
      console.error('Get booking stats error:', error);
      throw new Error('Failed to get booking statistics');
    }
  }
}

export default BookingService;
