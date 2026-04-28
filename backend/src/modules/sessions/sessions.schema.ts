import { z } from 'zod';

const optionalDate = z
  .string()
  .optional()
  .refine((v) => !v || !Number.isNaN(Date.parse(v)), 'Format de date invalide');

const optionalUuid = z
  .string()
  .optional()
  .refine(
    (v) => !v || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v),
    'UUID invalide',
  );

const locationFields = {
  locationName: z.string().min(1, 'Nom du lieu requis'),
  address:      z.string().min(1, 'Adresse requise'),
  city:         z.string().min(1, 'Ville requise'),
  postalCode:   z.string().min(1, 'Code postal requis'),
  latitude:     z.number().optional(),
  longitude:    z.number().optional(),
};

export const createSessionSchema = z.object({
  body: z.object({
    title:        z.string().min(1, 'Titre requis'),
    sport:        z.string().optional(),
    description:  z.string().optional(),
    requirements: z.string().optional(),
    startAt:      z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Date invalide'),
    durationMin:  z.number().int().min(1, 'Durée minimum 1 min'),
    capacity:     z.number().int().min(1, 'Capacité minimum 1'),
    ...locationFields,
  }),
});

export const updateSessionSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    title:        z.string().min(1).optional(),
    sport:        z.string().optional(),
    description:  z.string().optional(),
    requirements: z.string().optional(),
    startAt:      z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Date invalide').optional(),
    durationMin:  z.number().int().min(1).optional(),
    capacity:     z.number().int().min(1).optional(),
    locationName: z.string().min(1).optional(),
    address:      z.string().min(1).optional(),
    city:         z.string().min(1).optional(),
    postalCode:   z.string().min(1).optional(),
    latitude:     z.number().optional(),
    longitude:    z.number().optional(),
  }),
});

export const listSessionsSchema = z.object({
  query: z.object({
    from:    optionalDate,
    to:      optionalDate,
    coachId: optionalUuid,
    q:       z.string().optional(),
    page:    z.string().optional().transform((v) => (v ? Number.parseInt(v, 10) : 1)),
    limit:   z.string().optional().transform((v) => (v ? Math.min(Number.parseInt(v, 10), 100) : 10)),
  }),
  body:   z.object({}).optional(),
  params: z.object({}).optional(),
});

export const sessionIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body:   z.object({}).optional(),
  query:  z.object({}).optional(),
});
