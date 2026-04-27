import { z } from 'zod';

const optionalDate = z
  .string()
  .optional()
  .refine((v) => !v || !isNaN(Date.parse(v)), 'Format de date invalide');

const optionalUuid = z
  .string()
  .optional()
  .refine((v) => !v || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v), 'UUID invalide');

export const createSessionSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Titre requis'),
    description: z.string().optional(),
    startAt: z.string().refine((v) => !isNaN(Date.parse(v)), 'Date invalide'),
    durationMin: z.number().int().min(1, 'Durée minimum 1 min'),
    capacity: z.number().int().min(1, 'Capacité minimum 1'),
    location: z.string().min(1, 'Lieu requis'),
  }),
});

export const updateSessionSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    startAt: z.string().refine((v) => !isNaN(Date.parse(v)), 'Date invalide').optional(),
    durationMin: z.number().int().min(1).optional(),
    capacity: z.number().int().min(1).optional(),
    location: z.string().min(1).optional(),
  }),
});

export const listSessionsSchema = z.object({
  query: z.object({
    from:    optionalDate,
    to:      optionalDate,
    coachId: optionalUuid,
    page:  z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
    limit: z.string().optional().transform((v) => (v ? Math.min(parseInt(v, 10), 100) : 10)),
  }),
  body:   z.object({}).optional(),
  params: z.object({}).optional(),
});

export const sessionIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body:   z.object({}).optional(),
  query:  z.object({}).optional(),
});
