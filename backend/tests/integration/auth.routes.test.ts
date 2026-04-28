import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/index';

const { mockRefreshToken, mockTxUser, mockTxCoachProfile } = vi.hoisted(() => ({
  mockRefreshToken: {
    create:     vi.fn().mockResolvedValue({}),
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
    refreshToken: mockRefreshToken,
    $transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) =>
      fn({ user: mockTxUser, coachProfile: mockTxCoachProfile }),
    ),
  },
}));

vi.mock('bcrypt', () => ({
  default: {
    hash:    vi.fn().mockResolvedValue('hashed-password'),
    compare: vi.fn(),
  },
}));

import { prisma } from '../../src/config/prisma';
import bcrypt from 'bcrypt';

const db = prisma as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
  refreshToken: typeof mockRefreshToken;
  $transaction: ReturnType<typeof vi.fn>;
};

const mockUser = {
  id: 'user-id-1', email: 'test@example.com', passwordHash: 'hashed-password',
  firstName: 'Test', lastName: 'User', role: 'CLIENT', createdAt: new Date(),
};

describe('Auth Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRefreshToken.create.mockResolvedValue({});
  });

  describe('POST /api/auth/register', () => {
    it('returns 201 with tokens on valid registration', async () => {
      db.user.findUnique.mockResolvedValueOnce(null);
      mockTxUser.create.mockResolvedValueOnce(mockUser);
      db.$transaction.mockImplementationOnce((fn: (tx: unknown) => Promise<unknown>) =>
        fn({ user: mockTxUser, coachProfile: mockTxCoachProfile }),
      );

      const res = await request(app).post('/api/auth/register').send({
        email: 'newuser@example.com', password: 'ValidPass1!',
        firstName: 'New', lastName: 'User', role: 'CLIENT',
      });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('returns 400 on invalid email', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'not-an-email', password: 'ValidPass1!',
        firstName: 'New', lastName: 'User', role: 'CLIENT',
      });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 on weak password', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'new@example.com', password: 'weak',
        firstName: 'New', lastName: 'User', role: 'CLIENT',
      });
      expect(res.status).toBe(400);
    });

    it('returns 409 when email already taken', async () => {
      db.user.findUnique.mockResolvedValueOnce(mockUser);

      const res = await request(app).post('/api/auth/register').send({
        email: 'test@example.com', password: 'ValidPass1!',
        firstName: 'Test', lastName: 'User', role: 'CLIENT',
      });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('EMAIL_TAKEN');
    });

    it('returns 400 when COACH registers without specialty', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'coach@example.com', password: 'ValidPass1!',
        firstName: 'Coach', lastName: 'Test', role: 'COACH',
      });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('returns 200 with tokens on valid credentials', async () => {
      db.user.findUnique.mockResolvedValueOnce(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);

      const res = await request(app).post('/api/auth/login').send({
        email: 'test@example.com', password: 'ValidPass1!',
      });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
    });

    it('returns 401 on invalid credentials', async () => {
      db.user.findUnique.mockResolvedValueOnce(null);

      const res = await request(app).post('/api/auth/login').send({
        email: 'wrong@example.com', password: 'WrongPass',
      });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('returns 401 on wrong password', async () => {
      db.user.findUnique.mockResolvedValueOnce(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(false as never);

      const res = await request(app).post('/api/auth/login').send({
        email: 'test@example.com', password: 'WrongPassword1!',
      });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('returns 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('returns 204 with valid refresh token', async () => {
      const { signRefreshToken } = await import('../../src/utils/jwt');
      const token = signRefreshToken({ userId: 'u1', role: 'CLIENT' });
      mockRefreshToken.findUnique.mockResolvedValueOnce({
        id: 'rt-1', userId: 'u1', revokedAt: null,
      });
      mockRefreshToken.update.mockResolvedValueOnce({});

      const res = await request(app).post('/api/auth/logout').send({ refreshToken: token });
      expect(res.status).toBe(204);
    });

    it('returns 204 even without a refresh token (idempotent)', async () => {
      const res = await request(app).post('/api/auth/logout').send({});
      expect(res.status).toBe(204);
    });
  });

  describe('GET /health', () => {
    it('returns 200', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
    });
  });
});
