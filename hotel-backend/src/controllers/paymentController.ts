import { Request, Response } from 'express';
import pool from '../config/database';

export const getPayments = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT 
        p.*,
        b.guest_name,
        b.guest_email,
        r.room_number,
        r.room_type
      FROM payments p
      LEFT JOIN bookings b ON p.booking_id = b.id
      LEFT JOIN rooms r ON b.room_id = r.id
      ORDER BY p.created_at DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments'
    });
  }
};

export const getPaymentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        p.*,
        b.guest_name,
        b.guest_email,
        b.guest_phone,
        b.check_in,
        b.check_out,
        b.total_amount as booking_total,
        r.room_number,
        r.room_type,
        r.price_per_night
      FROM payments p
      LEFT JOIN bookings b ON p.booking_id = b.id
      LEFT JOIN rooms r ON b.room_id = r.id
      WHERE p.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
      return;
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment'
    });
  }
};

export const createPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      booking_id, 
      amount, 
      payment_method, 
      payment_status,
      transaction_id,
      card_last_four
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO payments (
        booking_id, amount, payment_method, payment_status, 
        transaction_id, card_last_four
      ) VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *`,
      [booking_id, amount, payment_method, payment_status || 'pending', transaction_id, card_last_four]
    );
    
     
    if (payment_status === 'completed') {
      await pool.query(
        'UPDATE bookings SET payment_status = $1 WHERE id = $2',
        ['paid', booking_id]
      );
    }
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment'
    });
  }
};

export const updatePaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { payment_status, transaction_id } = req.body;
    
    const result = await pool.query(
      `UPDATE payments 
       SET payment_status = $1, transaction_id = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3 
       RETURNING *`,
      [payment_status, transaction_id, id]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
      return;
    }
    
    
    if (payment_status === 'completed') {
      await pool.query(
        'UPDATE bookings SET payment_status = $1 WHERE id = $2',
        ['paid', result.rows[0].booking_id]
      );
    } else if (payment_status === 'failed') {
      await pool.query(
        'UPDATE bookings SET payment_status = $1 WHERE id = $2',
        ['failed', result.rows[0].booking_id]
      );
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment'
    });
  }
};

export const getPaymentsByBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookingId } = req.params;
    
    const result = await pool.query(
      `SELECT * FROM payments WHERE booking_id = $1 ORDER BY created_at DESC`,
      [bookingId]
    );
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching booking payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking payments'
    });
  }
};

export const processRefund = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { refund_amount, refund_reason } = req.body;
    
    const result = await pool.query(
      `UPDATE payments 
       SET payment_status = 'refunded', refund_amount = $1, refund_reason = $2, 
           refunded_at = CURRENT_TIMESTAMP 
       WHERE id = $3 
       RETURNING *`,
      [refund_amount, refund_reason, id]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
      return;
    }
    
    
    await pool.query(
      'UPDATE bookings SET payment_status = $1 WHERE id = $2',
      ['refunded', result.rows[0].booking_id]
    );
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Refund processed successfully'
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund'
    });
  }
};