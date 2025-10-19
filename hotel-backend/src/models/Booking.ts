import pool from '../config/database';

export interface Booking {
    id?: number;
    user_id: number;
    room_id: number;
    check_in_date: string;
    check_out_date: string;
    adults: number;
    children: number;
    total_amount: number;
    status: string;
    payment_status: string;
    special_requests?: string;
    created_at?: string;
}

export const createBookingsTable = async () => { 
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS bookings (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
                check_in DATE NOT NULL,
                check_out DATE NOT NULL,
                adults INTEGER DEFAULT 1,
                children INTEGER DEFAULT 0,
                total_amount DECIMAL(10, 2) NOT NULL,
                status VARCHAR(20) DEFAULT 'confirmed',
                payment_status VARCHAR(20) DEFAULT 'pending',
                special_requests TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Bookings table ready');
    } catch (err) {
        console.error('Error creating bookings table:', err);
        throw err;
    } finally {
        client.release();
    }
};
