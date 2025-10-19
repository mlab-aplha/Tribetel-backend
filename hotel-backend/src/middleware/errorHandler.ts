import { Request, Response } from 'express';

export const errorHandler = (error: any, req: Request, res: Response): void => {
  console.error('Error:', error.message);
  console.error('URL:', req.originalUrl); // Use req parameter

  if (error.name === 'ValidationError') {
    res.status(400).json({ success: false, message: 'Validation failed' });
    return;
  }

  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({ success: false, message: 'Invalid token' });
    return;
  }

  res.status(500).json({ success: false, message: 'Internal server error' });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
};
