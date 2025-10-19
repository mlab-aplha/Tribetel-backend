import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
    path: path.resolve(__dirname, '../../.env'),
});

export interface EnvConfig {
    NODE_ENV: 'development' | 'production' | string;
    PORT: number;
    DATABASE_URL: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    CORS_ORIGINS: string;
}

function getEnv(): EnvConfig {
    const {
        NODE_ENV,
        PORT,
        DATABASE_URL,
        JWT_SECRET,
        JWT_EXPIRES_IN,
        CORS_ORIGINS,

    } = process.env;

    if (!NODE_ENV) {
        throw new Error('NODE_ENV is not defined');
    }

    if (!PORT) {
        throw new Error('PORT is not defined');
    }

    if (!DATABASE_URL) {
        throw new Error('DATABASE_URL is not defined');
    }

    if (!JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined');
    }

    if (!JWT_EXPIRES_IN) {
        throw new Error('JWT_EXPIRES_IN is not defined');
    }

    if (!CORS_ORIGINS) {
        throw new Error('CORS_ORIGINS is not defined');
    }

    return {
        NODE_ENV,
        PORT: parseInt(PORT, 10),
        DATABASE_URL,
        JWT_SECRET,
        JWT_EXPIRES_IN,
        CORS_ORIGINS,
        
    };
}

export const env = getEnv();