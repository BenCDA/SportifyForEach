import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { RegisterInput, LoginInput } from './auth.schema';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function sanitizeUser(user: {
  id: string; email: string; firstName: string;
  lastName: string; role: string; createdAt: Date;
}) {
  return {
    id: user.id, email: user.email,
    firstName: user.firstName, lastName: user.lastName,
    role: user.role, createdAt: user.createdAt,
  };
}

async function storeRefreshToken(userId: string, token: string): Promise<void> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: { userId, tokenHash: hashToken(token), expiresAt },
  });
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new AppError(409, 'EMAIL_TAKEN', 'Email déjà utilisé');

  const passwordHash = await bcrypt.hash(input.password, env.bcryptCost);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role ?? 'CLIENT',
      },
    });

    if (input.role === 'COACH') {
      await tx.coachProfile.create({
        data: {
          userId: created.id,
          specialties: input.specialties ?? [],
          bio: input.bio ?? '',
        },
      });
    }

    return created;
  });

  const payload = { userId: user.id, role: user.role };
  const accessToken  = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  await storeRefreshToken(user.id, refreshToken);

  return { accessToken, refreshToken, user: sanitizeUser(user) };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw new AppError(401, 'INVALID_CREDENTIALS', 'Email ou mot de passe invalide');

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw new AppError(401, 'INVALID_CREDENTIALS', 'Email ou mot de passe invalide');

  const payload = { userId: user.id, role: user.role };
  const accessToken  = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  await storeRefreshToken(user.id, refreshToken);

  return { accessToken, refreshToken, user: sanitizeUser(user) };
}

export async function refresh(token: string) {
  let payload: { userId: string; role: string };
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new AppError(401, 'TOKEN_INVALID', 'Refresh token invalide ou expiré');
  }

  const tokenHash = hashToken(token);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!stored || stored.revokedAt !== null || stored.expiresAt < new Date()) {
    // Possible replay attack — révoque tous les tokens de cet utilisateur
    if (stored) {
      await prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    throw new AppError(401, 'TOKEN_REVOKED', 'Refresh token révoqué ou expiré');
  }

  // Rotation : révoque l'ancien, émet un nouveau
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) throw new AppError(401, 'USER_NOT_FOUND', 'Utilisateur introuvable');

  const newPayload     = { userId: user.id, role: user.role };
  const accessToken    = signAccessToken(newPayload);
  const newRefreshToken = signRefreshToken(newPayload);
  await storeRefreshToken(user.id, newRefreshToken);

  return { accessToken, refreshToken: newRefreshToken };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { coachProfile: true },
  });
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'Utilisateur introuvable');
  return sanitizeUser(user);
}
