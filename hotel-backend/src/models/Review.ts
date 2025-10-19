import pool from '../config/database';

export interface Review {
    id?: number;
    user_id: number;
    room_id: number;
    rating: number;
    comment?: string;
    created_at?: string;
}

export const createReviewsTable = async () => {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                room_id INTEGER NOT NULL,
                rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
                comment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
            )
        `);
        console.log('Reviews table ready');
    } catch (err) {
        console.error('Error creating reviews table:', err);
        throw err;
    } finally {
        client.release();
    }
};
