import { z } from 'zod';

export const createBookingSchema = z.object({
  body: z.object({
    sessionId: z.string().uuid('Invalid session ID'),
  }),
});

export const bookingIdSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid booking ID') }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const listBookingsSchema = z.object({
  query: z.object({
    page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
    limit: z.string().optional().transform((v) => (v ? Math.min(parseInt(v, 10), 100) : 10)),
  }),
  body: z.object({}).optional(),
  params: z.object({}).optional(),
});
