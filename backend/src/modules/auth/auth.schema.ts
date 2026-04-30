import { z } from 'zod';
import { SPORTS } from '../../constants/sports';

const passwordSchema = z
  .string()
  .min(8, 'Au moins 8 caractères')
  .regex(/[A-Z]/, 'Au moins une majuscule')
  .regex(/\d/, 'Au moins un chiffre');

export const registerSchema = z.object({
  body: z
    .object({
      email:      z.string().email('Email invalide'),
      password:   passwordSchema,
      firstName:  z.string().min(1, 'Prénom requis'),
      lastName:   z.string().min(1, 'Nom requis'),
      role:       z.enum(['CLIENT', 'COACH']).default('CLIENT'),
      specialties: z.array(z.enum(SPORTS)).max(3).optional(),
      bio:        z.string().optional(),
    })
    .refine(
      (d) => d.role !== 'COACH' || (d.specialties && d.specialties.length > 0),
      { message: 'Au moins une spécialité requise pour un compte coach', path: ['specialties'] },
    ),
});

export const loginSchema = z.object({
  body: z.object({
    email:    z.string().email('Email invalide'),
    password: z.string().min(1, 'Mot de passe requis'),
  }),
});

// Refresh token comes from the HttpOnly cookie; body field kept as optional fallback
export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().optional(),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput    = z.infer<typeof loginSchema>['body'];
