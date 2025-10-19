import { Request, Response } from 'express';
import pool from '../config/database';

export const getRooms = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM rooms ORDER BY id');
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rooms'
    });
  }
};

export const getRoomById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('SELECT * FROM rooms WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Room not found'
      });
      return;
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch room'
    });
  }
};

export const createRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const { room_number, room_type, price_per_night, capacity } = req.body;
    
    const result = await pool.query(
      'INSERT INTO rooms (room_number, room_type, price_per_night, capacity) VALUES ($1, $2, $3, $4) RETURNING *',
      [room_number, room_type, price_per_night, capacity]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create room'
    });
  }
};

export const updateRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { room_number, room_type, price_per_night, capacity } = req.body;
    
    const result = await pool.query(
      'UPDATE rooms SET room_number = $1, room_type = $2, price_per_night = $3, capacity = $4 WHERE id = $5 RETURNING *',
      [room_number, room_type, price_per_night, capacity, id]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Room not found'
      });
      return;
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update room'
    });
  }
};

export const deleteRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM rooms WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Room not found'
      });
      return;
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Room deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete room'
    });
  }
};

export const getAvailableRooms = async (req: Request, res: Response): Promise<void> => {
  try {
    const { check_in, check_out, room_type } = req.query;
    
    let query = `
      SELECT r.* 
      FROM rooms r
      WHERE r.id NOT IN (
        SELECT b.room_id 
        FROM bookings b 
        WHERE (b.check_in, b.check_out) OVERLAPS ($1::date, $2::date)
        AND b.status IN ('confirmed', 'checked_in')
      )
    `;
    
    const queryParams = [check_in, check_out];
    
    if (room_type) {
      query += ' AND r.room_type = $3';
      queryParams.push(room_type as string);
    }
    
    query += ' ORDER BY r.room_number';
    
    const result = await pool.query(query, queryParams);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    console.error('Error fetching available rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available rooms'
    });
  }
};

export const updateRoomStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['available', 'occupied', 'maintenance', 'cleaning'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Invalid room status'
      });
      return;
    }
    
    const result = await pool.query(
      'UPDATE rooms SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Room not found'
      });
      return;
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating room status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update room status'
    });
  }
};