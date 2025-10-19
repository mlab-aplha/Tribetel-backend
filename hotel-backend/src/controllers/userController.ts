import { Request, Response } from 'express';
import pool from '../config/database';
import bcrypt from 'bcryptjs';

export const getUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT 
        id, first_name, last_name, email, phone, role, 
        is_active, created_at, updated_at
      FROM users 
      ORDER BY created_at DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        id, first_name, last_name, email, phone, role, 
        is_active, created_at, updated_at
      FROM users 
      WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    });
  }
};

export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
     
    const userId = (req as any).user?.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }
    
    const result = await pool.query(`
      SELECT 
        id, first_name, last_name, email, phone, role, 
        is_active, created_at, updated_at
      FROM users 
      WHERE id = $1
    `, [userId]);
    
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile'
    });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      first_name,
      last_name,
      email,
      password,
      phone,
      role = 'customer'
    } = req.body;
    
     
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
      return;
    }
    
     
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const result = await pool.query(
      `INSERT INTO users (
        first_name, last_name, email, password_hash, phone, role
      ) VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING id, first_name, last_name, email, phone, role, created_at`,
      [first_name, last_name, email, hashedPassword, phone, role]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user'
    });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      email,
      phone,
      role
    } = req.body;
    
     
    const userCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [id]
    );
    
    if (userCheck.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }
    
    
    if (email) {
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, id]
      );
      
      if (emailCheck.rows.length > 0) {
        res.status(409).json({
          success: false,
          message: 'Email already taken by another user'
        });
        return;
      }
    }
    
    const result = await pool.query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           email = COALESCE($3, email),
           phone = COALESCE($4, phone),
           role = COALESCE($5, role),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 
       RETURNING id, first_name, last_name, email, phone, role, updated_at`,
      [first_name, last_name, email, phone, role, id]
    );
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const {
      first_name,
      last_name,
      email,
      phone
    } = req.body;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }
    
     
    if (email) {
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      );
      
      if (emailCheck.rows.length > 0) {
        res.status(409).json({
          success: false,
          message: 'Email already taken by another user'
        });
        return;
      }
    }
    
    const result = await pool.query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           email = COALESCE($3, email),
           phone = COALESCE($4, phone),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 
       RETURNING id, first_name, last_name, email, phone, role, updated_at`,
      [first_name, last_name, email, phone, userId]
    );
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const { current_password, new_password } = req.body;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }
    
     
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }
    
    
    const isValidPassword = await bcrypt.compare(
      current_password, 
      userResult.rows[0].password_hash
    );
    
    if (!isValidPassword) {
      res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
      return;
    }
    
     
    const saltRounds = 10;
    const newHashedPassword = await bcrypt.hash(new_password, saltRounds);
    
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newHashedPassword, userId]
    );
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
};

export const updateUserStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    
    const result = await pool.query(
      'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, first_name, last_name, email, is_active',
      [is_active, id]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: `User ${is_active ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
     
    const activeBookings = await pool.query(
      `SELECT id FROM bookings 
       WHERE user_id = $1 AND status NOT IN ('cancelled', 'completed')`,
      [id]
    );
    
    if (activeBookings.rows.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete user with active bookings'
      });
      return;
    }
    
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
};

export const getUserStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const statsResult = await pool.query(`
      SELECT 
        COUNT(b.id) as total_bookings,
        COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_bookings,
        COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as upcoming_bookings,
        COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END) as cancelled_bookings,
        COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.total_amount END), 0) as total_spent,
        COUNT(r.id) as total_reviews,
        COALESCE(AVG(r.rating), 0) as average_rating
      FROM users u
      LEFT JOIN bookings b ON u.id = b.user_id
      LEFT JOIN reviews r ON u.id = r.user_id
      WHERE u.id = $1
      GROUP BY u.id
    `, [id]);
    
    if (statsResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }
    
    res.json({
      success: true,
      data: statsResult.rows[0]
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user stats'
    });
  }
};