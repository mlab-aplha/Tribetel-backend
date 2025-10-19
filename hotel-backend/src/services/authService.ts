import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: string;
}

export interface AuthResult {
  user: User;
  token: string;
  refreshToken: string;
}

export class AuthService {
  private static JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
  private static JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';

  static async checkEmailExists(email: string): Promise<boolean> {
    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    return result.rows.length > 0;
  }

  static async registerUser(userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
  }): Promise<AuthResult> {
    const { email, password, first_name, last_name, phone } = userData;

    const userExists = await this.checkEmailExists(email);
    if (userExists) {
      throw new Error('User already exists with this email');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (email, password, first_name, last_name, phone) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, email, first_name, last_name, role, phone`,
      [email, hashedPassword, first_name, last_name, phone]
    );

    const user: User = result.rows[0];
    const tokens = this.generateTokens(user);

    return {
      user,
      token: tokens.token,
      refreshToken: tokens.refreshToken
    };
  }

  static async loginUser(credentials: {
    email: string;
    password: string;
  }): Promise<AuthResult> {
    const { email, password } = credentials;

    const result = await pool.query(
      'SELECT id, email, password, first_name, last_name, phone, role FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    const tokens = this.generateTokens(user);
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token: tokens.token,
      refreshToken: tokens.refreshToken
    };
  }

  static async logoutUser(userId: number, refreshToken?: string): Promise<void> {
    try {
       
      if (refreshToken) {
        await pool.query(
          'DELETE FROM refresh_tokens WHERE user_id = $1 AND token = $2',
          [userId, refreshToken]
        );
        console.log(`User ${userId} logged out (specific token revoked)`);
      } else {
         
        await pool.query(
          'DELETE FROM refresh_tokens WHERE user_id = $1',
          [userId]
        );
        console.log(`User ${userId} logged out (all tokens revoked)`);
      }
    } catch (error) {
      console.error('Error during logout:', error);
       
    }
  }

  static async refreshAccessToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    try {
      const decoded = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as any;
      
       
      const tokenCheck = await pool.query(
        'SELECT * FROM refresh_tokens WHERE token = $1 AND user_id = $2',
        [refreshToken, decoded.userId]
      );

      if (tokenCheck.rows.length === 0) {
        throw new Error('Invalid refresh token');
      }

      const result = await pool.query(
        'SELECT id, email, first_name, last_name, phone, role FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const user: User = result.rows[0];
      const newTokens = this.generateTokens(user);

       
      await pool.query(
        'UPDATE refresh_tokens SET token = $1 WHERE user_id = $2 AND token = $3',
        [newTokens.refreshToken, user.id, refreshToken]
      );

      return newTokens;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  static async validateToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      
      const result = await pool.query(
        'SELECT id, email, first_name, last_name, phone, role FROM users WHERE id = $1',
        [decoded.userId]
      );

      return result.rows[0] || null;
    } catch (error) {
      return null;
    }
  }

  private static generateTokens(user: User): { token: string; refreshToken: string } {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(payload, this.JWT_SECRET, { expiresIn: '7d' });
    const refreshToken = jwt.sign(payload, this.JWT_REFRESH_SECRET, { expiresIn: '30d' });

    return { token, refreshToken };
  }

   
  static async initRefreshTokensTable(): Promise<void> {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS refresh_tokens (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token TEXT NOT NULL UNIQUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
        )
      `);
      console.log('Refresh tokens table initialized');
    } catch (error) {
      console.error('Error initializing refresh tokens table:', error);
    }
  }
}