import { Request, Response } from 'express';
import { AuthService } from '../services/authService';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { email, password, first_name, last_name, phone } = req.body;

       
      if (!email || !password || !first_name || !last_name) {
        return res.status(400).json({
          success: false,
          message: 'Email, password, first name, and last name are required'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }

      const result = await AuthService.registerUser({
        email,
        password,
        first_name,
        last_name,
        phone
      });

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result
      });

    } catch (error: any) {
      console.error('Registration error:', error);

      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      const result = await AuthService.loginUser({ email, password });

      return res.json({
        success: true,
        message: 'Login successful',
        data: result
      });

    } catch (error: any) {
      console.error('Login error:', error);

      return res.status(401).json({
        success: false,
        message: error.message
      });
    }
  }

  static async logout(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
      }

      const { refreshToken } = req.body;
      await AuthService.logoutUser(parseInt(userId), refreshToken);

      return res.json({ 
        success: true, 
        message: 'Logged out successfully' 
      });

    } catch (error: any) {
      console.error('Logout error:', error);

      return res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
  }

  static async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
      }

      const tokens = await AuthService.refreshAccessToken(refreshToken);

      return res.json({ 
        success: true, 
        message: 'Token refreshed successfully',
        data: tokens 
      });

    } catch (error: any) {
      console.error('Refresh token error:', error);

      return res.status(401).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Not authenticated' 
        });
      }

      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ 
          success: false, 
          message: 'No token provided' 
        });
      }

      const user = await AuthService.validateToken(token);
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid token' 
        });
      }

      return res.json({ 
        success: true, 
        data: { user } 
      });

    } catch (error: any) {
      console.error('Get profile error:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to get profile'
      });
    }
  }

  static async checkEmail(req: Request, res: Response) {
    try {
      const { email } = req.query;

      if (!email || typeof email !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Email query parameter is required'
        });
      }

      const exists = await AuthService.checkEmailExists(email);

      return res.json({
        success: true,
        data: { 
          email, 
          exists,
          available: !exists
        }
      });

    } catch (error: any) {
      console.error('Check email error:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to check email'
      });
    }
  }
}