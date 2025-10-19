import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

 
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

 
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('PostgreSQL connection error:', err);
});

 
export const initializeDatabase = async () => {
  try {
    console.log('Initializing database tables...');
    
    
    const { createUsersTable } = await import('../models/User');
    const { createRoomsTable } = await import('../models/Room');
    const { createBookingsTable } = await import('../models/Booking');
    
    await createUsersTable();
    await createRoomsTable();
    await createBookingsTable();
    
    console.log('All database tables initialized');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
};

export default pool;