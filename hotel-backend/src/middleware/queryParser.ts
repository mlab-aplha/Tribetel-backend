import { Request, Response, NextFunction } from 'express';

export const queryParser = (req: Request, res: Response, next: NextFunction): void => {
  const { query } = req;
  
  
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const limit = Math.min(Math.max(1, parseInt(query.limit as string) || 10), 100);
  const offset = (page - 1) * limit;

   
  (req as any).pagination = { page, limit, offset };
  
  
  res.locals.parsedQuery = { page, limit, offset };
  
  next();
};
