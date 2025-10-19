import { Request, Response } from 'express';
import pool from '../config/database';

export const getReviews = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT 
        r.*,
        u.first_name,
        u.last_name,
        rm.room_number,
        rm.room_type
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN rooms rm ON r.room_id = rm.id
      WHERE r.status = 'approved'
      ORDER BY r.created_at DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews'
    });
  }
};

export const getReviewById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        r.*,
        u.first_name,
        u.last_name,
        u.email,
        rm.room_number,
        rm.room_type,
        rm.description as room_description
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN rooms rm ON r.room_id = rm.id
      WHERE r.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Review not found'
      });
      return;
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review'
    });
  }
};

export const createReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      user_id, 
      room_id, 
      booking_id,
      rating, 
      comment, 
      title 
    } = req.body;
    
     
    const existingReview = await pool.query(
      'SELECT id FROM reviews WHERE user_id = $1 AND room_id = $2',
      [user_id, room_id]
    );
    
    if (existingReview.rows.length > 0) {
      res.status(400).json({
        success: false,
        message: 'You have already reviewed this room'
      });
      return;
    }
    
     
    const validBooking = await pool.query(
      `SELECT id FROM bookings 
       WHERE user_id = $1 AND room_id = $2 AND status = 'completed' 
       AND check_out < CURRENT_DATE`,
      [user_id, room_id]
    );
    
    if (validBooking.rows.length === 0) {
      res.status(400).json({
        success: false,
        message: 'You can only review rooms you have stayed in'
      });
      return;
    }
    
    const result = await pool.query(
      `INSERT INTO reviews (
        user_id, room_id, booking_id, rating, comment, title, status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'pending') 
      RETURNING *`,
      [user_id, room_id, booking_id, rating, comment, title]
    );
    
     
    await updateRoomRating(room_id);
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create review'
    });
  }
};

export const updateReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { rating, comment, title } = req.body;
    
    const result = await pool.query(
      `UPDATE reviews 
       SET rating = $1, comment = $2, title = $3, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4 
       RETURNING *`,
      [rating, comment, title, id]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Review not found'
      });
      return;
    }
    
     
    await updateRoomRating(result.rows[0].room_id);
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review'
    });
  }
};

export const deleteReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM reviews WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Review not found'
      });
      return;
    }
    
     
    await updateRoomRating(result.rows[0].room_id);
    
    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review'
    });
  }
};

export const getReviewsByRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        r.*,
        u.first_name,
        u.last_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.room_id = $1 AND r.status = 'approved'
      ORDER BY r.created_at DESC
    `, [roomId]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching room reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch room reviews'
    });
  }
};

export const getReviewsByUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        r.*,
        rm.room_number,
        rm.room_type
      FROM reviews r
      LEFT JOIN rooms rm ON r.room_id = rm.id
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC
    `, [userId]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user reviews'
    });
  }
};

export const updateReviewStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: pending, approved, or rejected'
      });
      return;
    }
    
    const result = await pool.query(
      'UPDATE reviews SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Review not found'
      });
      return;
    }
    
    
    if (status === 'approved') {
      await updateRoomRating(result.rows[0].room_id);
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating review status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review status'
    });
  }
};


async function updateRoomRating(roomId: number): Promise<void> {
  try {
    const ratingResult = await pool.query(`
      SELECT AVG(rating) as average_rating, COUNT(*) as review_count
      FROM reviews 
      WHERE room_id = $1 AND status = 'approved'
    `, [roomId]);
    
    const averageRating = ratingResult.rows[0].average_rating;
    const reviewCount = ratingResult.rows[0].review_count;
    
    await pool.query(
      'UPDATE rooms SET average_rating = $1, review_count = $2 WHERE id = $3',
      [averageRating, reviewCount, roomId]
    );
  } catch (error) {
    console.error('Error updating room rating:', error);
  }
}