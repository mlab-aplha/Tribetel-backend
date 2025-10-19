import { CorsOptions } from 'cors';
import { env } from './env';

const allowedOrigins = env.CORS_ORIGINS.split(',');

export const corsOptions: CorsOptions = {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};