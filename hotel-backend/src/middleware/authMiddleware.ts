import { Request, Response, NextFunction } from 'express';

interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Access token required' });
    return;
  }

  // Mock user for testing
  req.user = {
    userId: '1',
    email: 'user@example.com',
    role: 'customer'
  };
  
  next();
};

export const adminMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Access token required' });
    return;
  }

  // Mock admin user
  req.user = {
    userId: '1',
    email: 'admin@example.com',
    role: 'admin'
  };
  
  next();
};
