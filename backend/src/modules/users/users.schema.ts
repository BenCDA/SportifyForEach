import { z } from 'zod';

export const listUsersSchema = z.object({
  query: z.object({
    page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
    limit: z.string().optional().transform((v) => (v ? Math.min(parseInt(v, 10), 100) : 10)),
    role: z.enum(['CLIENT', 'COACH', 'ADMIN']).optional(),
  }),
  body: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const updateUserSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid user ID') }),
  body: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    email: z.string().email().optional(),
    role: z.enum(['CLIENT', 'COACH', 'ADMIN']).optional(),
  }),
});

export const userIdSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid user ID') }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
});
