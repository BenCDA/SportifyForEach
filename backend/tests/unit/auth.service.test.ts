import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';
import { AppError } from '../../src/utils/AppError';

const { mockRefreshToken, mockTxUser, mockTxCoachProfile } = vi.hoisted(() => ({
  mockRefreshToken: {
    create:     vi.fn(),
    findUnique: vi.fn(),
    update:     vi.fn(),
    updateMany: vi.fn(),
  },
  mockTxUser:         { create: vi.fn() },
  mockTxCoachProfile: { create: vi.fn() },
}));

vi.mock('../../src/config/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create:     vi.fn(),
    },
    coachProfile: { create: vi.fn() },
    refreshToken: mockRefreshToken,
    $transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) =>
      fn({ user: mockTxUser, coachProfile: mockTxCoachProfile }),
    ),
  },
}));

vi.mock('bcrypt', () => ({
  default: { hash: vi.fn(), compare: vi.fn() },
}));

import { prisma } from '../../src/config/prisma';
import * as authService from '../../src/modules/auth/auth.service';

// Typed alias to avoid repeated `as unknown`
const db = prisma as unknown as {
  user:         { findUnique: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
  refreshToken: typeof mockRefreshToken;
  $transaction: ReturnType<typeof vi.fn>;
};

const mockUser = {
  id: 'user-id-1', email: 'test@example.com', passwordHash: 'hashed',
  firstName: 'Test', lastName: 'User', role: 'CLIENT' as const, createdAt: new Date(),
};

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRefreshToken.create.mockResolvedValue({});
  });

  describe('register', () => {
    it('throws EMAIL_TAKEN when email exists', async () => {
      db.user.findUnique.mockResolvedValueOnce(mockUser);

      const error = await authService
        .register({ email: 'test@example.com', password: 'Pass123!', firstName: 'A', lastName: 'B', role: 'CLIENT' })
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe('EMAIL_TAKEN');
    });

    it('creates CLIENT user and returns tokens', async () => {
      db.user.findUnique.mockResolvedValueOnce(null);
      vi.mocked(bcrypt.hash).mockResolvedValueOnce('hashed' as never);
      mockTxUser.create.mockResolvedValueOnce(mockUser);
      db.$transaction.mockImplementationOnce((fn: (tx: unknown) => Promise<unknown>) =>
        fn({ user: mockTxUser, coachProfile: mockTxCoachProfile }),
      );

      const result = await authService.register({
        email: 'new@example.com', password: 'Pass123!',
        firstName: 'New', lastName: 'User', role: 'CLIENT',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).not.toHaveProperty('passwordHash');
    });
  });

  describe('login', () => {
    it('throws INVALID_CREDENTIALS when user not found', async () => {
      db.user.findUnique.mockResolvedValueOnce(null);
      await expect(
        authService.login({ email: 'no@example.com', password: 'Pass123!' }),
      ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    });

    it('throws INVALID_CREDENTIALS on wrong password', async () => {
      db.user.findUnique.mockResolvedValueOnce(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(false as never);
      await expect(
        authService.login({ email: 'test@example.com', password: 'Wrong' }),
      ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    });

    it('returns tokens on success', async () => {
      db.user.findUnique.mockResolvedValueOnce(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);

      const result = await authService.login({ email: 'test@example.com', password: 'Pass123!' });
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).not.toHaveProperty('passwordHash');
    });
  });

  describe('refresh', () => {
    it('throws TOKEN_INVALID on bad JWT', async () => {
      await expect(authService.refresh('bad-token')).rejects.toMatchObject({
        code: 'TOKEN_INVALID',
      });
    });

    it('throws TOKEN_REVOKED when token not in DB', async () => {
      const { signRefreshToken } = await import('../../src/utils/jwt');
      const token = signRefreshToken({ userId: 'u1', role: 'CLIENT' });
      mockRefreshToken.findUnique.mockResolvedValueOnce(null);

      await expect(authService.refresh(token)).rejects.toMatchObject({
        code: 'TOKEN_REVOKED',
      });
    });
  });
});
