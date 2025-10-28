import { Router } from 'express';

const router = Router();
 
 router.get('/global');
 router.get('/rooms');
 router.get('/users');
 router.get('/bookings');

export default router;
