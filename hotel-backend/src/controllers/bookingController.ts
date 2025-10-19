import { Request, Response } from 'express';
import pool from '../config/database';

export const getBookings = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT 
        b.*,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        r.room_number,
        r.room_type,
        r.price_per_night
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      JOIN rooms r ON b.room_id = r.id
      ORDER BY b.created_at DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings'
    });
  }
};

export const getBookingById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        b.*,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        r.room_number,
        r.room_type,
        r.description as room_description,
        r.price_per_night,
        r.capacity,
        r.amenities,
        p.amount as payment_amount,
        p.payment_method,
        p.status as payment_status
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      JOIN rooms r ON b.room_id = r.id
      LEFT JOIN payments p ON p.booking_id = b.id
      WHERE b.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
      return;
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking'
    });
  }
};

export const createBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      user_id, 
      room_id, 
      check_in, 
      check_out, 
      adults, 
      children, 
      total_amount, 
      special_requests,
      number_of_guests
    } = req.body;
    
    
    const finalAdults = adults || number_of_guests;
    const finalUserId = user_id || null;
    
    const result = await pool.query(
      `INSERT INTO bookings (
        user_id, room_id, check_in, check_out, adults, children, 
        total_amount, special_requests
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *`,
      [finalUserId, room_id, check_in, check_out, finalAdults, children, total_amount, special_requests]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking'
    });
  }
};

export const updateBookingStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const result = await pool.query(
      'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
      return;
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking'
    });
  }
};

export const getUserBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        b.*,
        r.room_number,
        r.room_type,
        r.price_per_night
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
    `, [userId]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user bookings'
    });
  }
};

export const updateBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { 
      check_in, 
      check_out, 
      adults, 
      children, 
      total_amount, 
      special_requests,
      status 
    } = req.body;
    
    const result = await pool.query(
      `UPDATE bookings 
       SET check_in = $1, check_out = $2, adults = $3, children = $4, 
           total_amount = $5, special_requests = $6, status = $7
       WHERE id = $8 
       RETURNING *`,
      [check_in, check_out, adults, children, total_amount, special_requests, status, id]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
      return;
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking'
    });
  }
};

export const deleteBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM bookings WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
      return;
    }
    
    res.json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete booking'
    });
  }
};