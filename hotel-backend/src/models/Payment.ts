import pool from '../config/database';

export interface Payment {
    id?: number;
    booking_id: number;
    amount: number;
    payment_method: string;
    status: string;
    stripe_payment_intent_id?: string;
    created_at?: string;
}

export const createPaymentsTable = async () => {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id SERIAL PRIMARY KEY,
                booking_id INTEGER NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                payment_method VARCHAR(50) NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                stripe_payment_intent_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
            )
        `);
        console.log('Payments table ready');
    } catch (err) {
        console.error('Error creating payments table:', err);
        throw err;
    } finally {
        client.release();
    }
};
