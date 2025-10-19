import { Router } from 'express';
import { 
    getBookings,
    getBookingById,
    createBooking,
    updateBookingStatus,
    getUserBookings,
    
} from '../controllers/bookingController';

const router = Router();

router.get('/',getBookings);
router.get('/:id',getBookingById);
router.put('/:id/status/:userId',updateBookingStatus);

router.post('/',createBooking);
router.get('/user/:userId',getUserBookings);

export default router;
