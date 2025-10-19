import { Request, Response, NextFunction } from 'express';

const requestCounts = new Map();

export const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; 
  const maxRequests = 100;

  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, []);
  }

  const requests = requestCounts.get(ip);
  const windowStart = now - windowMs;

  
  while (requests.length > 0 && requests[0] < windowStart) {
    requests.shift();
  }

   
  if (requests.length >= maxRequests) {
    res.status(429).json({ 
      success: false, 
      message: 'Too many requests, please try again later.' 
    });
    return;
  }

  
  requests.push(now);
  
  next();
};
