import pool from '../config/database';

export interface Room {
    id?: number;
    room_number: string;
    room_type: string;
    description?: string;
    price_per_night: number;
    capacity: number;
    amenities?: any;
    status?: string;
    created_at?: string;
}

export const createRoomsTable = async () => {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS rooms (
                id SERIAL PRIMARY KEY,
                room_number VARCHAR(10) UNIQUE NOT NULL,
                room_type VARCHAR(50) NOT NULL,
                description TEXT,
                price_per_night DECIMAL(10,2) NOT NULL,
                capacity INTEGER NOT NULL,
                amenities JSONB,
                status VARCHAR(20) DEFAULT 'available',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Rooms table ready');
    } catch (err) {
        console.error('Error creating rooms table:', err);
        throw err;
    } finally {
        client.release();
    }
};
