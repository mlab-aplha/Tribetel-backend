import { Router } from 'express';

const router = Router();

router.get('/');

router.get('/profile');

router.put('/profile');

router.get('/:id');

router.put('/:id');

router.delete('/:id')

router.get('/:id/bookings');

router.get('/:id/reviews');

router.get('/:id/payments');

export default router;