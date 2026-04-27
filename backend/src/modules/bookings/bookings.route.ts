import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/role';
import { validate } from '../../middlewares/validate';
import { createBookingSchema, bookingIdSchema, listBookingsSchema } from './bookings.schema';
import { createBookingHandler, listMyBookingsHandler, cancelBookingHandler } from './bookings.controller';

const router = Router();

router.use(authenticate);

router.post('/', requireRole('CLIENT'), validate(createBookingSchema), createBookingHandler);
router.get('/me', validate(listBookingsSchema), listMyBookingsHandler);
router.delete('/:id', validate(bookingIdSchema), cancelBookingHandler);

export default router;
