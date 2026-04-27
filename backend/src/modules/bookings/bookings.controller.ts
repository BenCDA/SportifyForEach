import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import * as bookingsService from './bookings.service';
import { success } from '../../utils/response';

export async function createBookingHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sessionId } = req.body as { sessionId: string };
    const booking = await bookingsService.createBooking(req.user!.userId, sessionId);
    res.status(201).json(success(booking));
  } catch (err) {
    next(err);
  }
}

export async function listMyBookingsHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page = '1', limit = '10' } = req.query as Record<string, string>;
    const result = await bookingsService.listMyBookings(
      req.user!.userId,
      parseInt(page, 10),
      Math.min(parseInt(limit, 10), 100),
    );
    res.json(success(result.bookings, result.meta));
  } catch (err) {
    next(err);
  }
}

export async function cancelBookingHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await bookingsService.cancelBooking(String(req.params['id']), req.user!.userId, req.user!.role);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
