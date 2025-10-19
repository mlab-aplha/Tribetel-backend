import { Request, Response, NextFunction } from 'express';

export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const { body } = req;
  
   
  if (body.email && !/\S+@\S+\.\S+/.test(body.email)) {
    res.status(400).json({ success: false, message: 'Invalid email format' });
    return;
  }

  
  if (body.password && body.password.length < 6) {
    res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    return;
  }

  next();
};

export const validateRoom = (req: Request, res: Response, next: NextFunction): void => {
  const { body } = req;
  
  if (!body.room_number) {
    res.status(400).json({ success: false, message: 'Room number is required' });
    return;
  }

  if (!body.price_per_night || body.price_per_night <= 0) {
    res.status(400).json({ success: false, message: 'Valid price is required' });
    return;
  }

  next();
};

export const validateBooking = (req: Request, res: Response, next: NextFunction): void => {
  const { body } = req;
  
  if (!body.room_id) {
    res.status(400).json({ success: false, message: 'Room ID is required' });
    return;
  }

  if (!body.check_in || !body.check_out) {
    res.status(400).json({ success: false, message: 'Check-in and check-out dates are required' });
    return;
  }

  next();
};
