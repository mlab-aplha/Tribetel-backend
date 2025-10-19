import { JwtPayload } from '../utils/jwtHelpers';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & {
        userId: number;
        email: string;
        role: string;
      };
      
      requestId?: string;
      startTime?: number;
      
       
      pagination?: {
        page: number;
        limit: number;
        offset: number;
        sortBy: string;
        sortOrder: 'ASC' | 'DESC';
      };
      
       
      files?: Express.Multer.File[];
      file?: Express.Multer.File;
    }

    interface Response {
      
      apiSuccess: <T>(data: T, message?: string, statusCode?: number) => void;
      apiError: (message: string, statusCode?: number, error?: any) => void;
      apiCreated: <T>(data: T, message?: string) => void;
      apiNotFound: (message?: string) => void;
      apiBadRequest: (message: string, error?: any) => void;
      apiUnauthorized: (message?: string) => void;
      apiForbidden: (message?: string) => void;
    }

    interface Locals {
       
      validatedData?: any;
      paginationResult?: {
        data: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
      cacheKey?: string;
      skipCache?: boolean;
    }
  }
}

 
export {};
