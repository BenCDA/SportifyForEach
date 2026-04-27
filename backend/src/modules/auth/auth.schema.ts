import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Au moins 8 caractères')
  .regex(/[A-Z]/, 'Au moins une majuscule')
  .regex(/\d/, 'Au moins un chiffre');

export const registerSchema = z.object({
  body: z
    .object({
      email:     z.string().email('Email invalide'),
      password:  passwordSchema,
      firstName: z.string().min(1, 'Prénom requis'),
      lastName:  z.string().min(1, 'Nom requis'),
      role:      z.enum(['CLIENT', 'COACH']).default('CLIENT'),
      specialty: z.string().min(1, 'Spécialité requise pour les coachs').optional(),
      bio:       z.string().optional(),
    })
    .refine(
      (data) => data.role !== 'COACH' || (data.specialty && data.specialty.length > 0),
      { message: 'La spécialité est requise pour un compte coach', path: ['specialty'] },
    ),
});

export const loginSchema = z.object({
  body: z.object({
    email:    z.string().email('Email invalide'),
    password: z.string().min(1, 'Mot de passe requis'),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token requis'),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput    = z.infer<typeof loginSchema>['body'];
