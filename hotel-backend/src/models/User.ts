import pool from '../config/database';

export interface User {
    id?: number;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
    role: string;
    created_at?: string;
}

export const createUsersTable = async () => {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password TEXT NOT NULL,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                phone VARCHAR(20),
                role VARCHAR(50) DEFAULT 'customer',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Users table ready');
    } catch (err) {
        console.error('Error creating users table:', err);
        throw err;
    } finally {
        client.release();
    }
};
