import { Router } from 'express';
import authRoutes from './authRoutes';
import roomRoutes from './roomRoutes';
import  bookingRoutes from './bookingRoutes';
import paymentRoutes from './paymentRoutes';
import reviewRoutes from './reviewRoutes';
import searchRoutes from './searchRoutes';
import userRoutes from './userRoutes';
import uploadRoutes from './uploadRoutes';

const router = Router();

router.use('/auth',authRoutes);
router.use('/rooms',roomRoutes);
router.use('/bookings',bookingRoutes);
router.use('/payments',paymentRoutes);
router.use('/reviews',reviewRoutes);
router.use('/search', searchRoutes);
router.use('/userRoutes', userRoutes);
router.use('/upload', uploadRoutes);

export default router;