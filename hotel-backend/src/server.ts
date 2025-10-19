require('dotenv').config();
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { initializeDatabase } from './config/database';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import roomRoutes from './routes/roomRoutes';
import bookingRoutes from './routes/bookingRoutes';
import paymentRoutes from './routes/paymentRoutes';
import reviewRoutes from './routes/reviewRoutes';
import searchRoutes from './routes/searchRoutes';
import uploadRoutes from './routes/uploadRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log('Starting Hotel Booking API Server...');
    
    await initializeDatabase();
    console.log('Database tables initialized successfully');
    
    app.use(cors());
    app.use(express.json());
    app.use(helmet());
    
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,  
      max: 100  
    });
    app.use(limiter);
    
    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/rooms', roomRoutes);
    app.use('/api/bookings', bookingRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/reviews', reviewRoutes);
    app.use('/api/search', searchRoutes);
    app.use('/api/upload', uploadRoutes);
    
    app.get('/api/health', (_req, res) => {
      res.status(200).json({ 
        status: 'OK', 
        message: 'Hotel Booking API is running',
        timestamp: new Date().toISOString()
      });
    });
    
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API Documentation available at http://localhost:${PORT}/api/health`);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
