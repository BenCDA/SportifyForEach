import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/index';
import { makeAccessToken } from '../helpers';

vi.mock('../../src/config/prisma', () => {
  const mockTx = {
    session: { findUnique: vi.fn() },
    booking: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  };
  return {
    prisma: {
      $transaction: vi.fn((fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx)),
      booking: {
        findMany: vi.fn(),
        count: vi.fn(),
        findUnique: vi.fn(),
        delete: vi.fn(),
      },
      _mockTx: mockTx,
    },
  };
});

import { prisma } from '../../src/config/prisma';

const mockPrisma = prisma as unknown as {
  $transaction: ReturnType<typeof vi.fn>;
  booking: {
    findMany: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  _mockTx: {
    session: { findUnique: ReturnType<typeof vi.fn> };
    booking: {
      findUnique: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
  };
};

const clientToken = makeAccessToken('client-1', 'CLIENT');
const coachToken = makeAccessToken('coach-1', 'COACH');

const SESSION_UUID = '00000000-0000-0000-0000-000000000011';
const BOOKING_UUID = '00000000-0000-0000-0000-000000000012';

const mockSession = {
  id: SESSION_UUID,
  coachId: 'coach-1',
  title: 'Yoga',
  description: null,
  startAt: new Date(Date.now() + 86400000),
  durationMin: 60,
  capacity: 10,
  location: 'Salle A',
  createdAt: new Date(),
  _count: { bookings: 5 },
};

const mockBooking = {
  id: BOOKING_UUID,
  sessionId: SESSION_UUID,
  clientId: 'client-1',
  createdAt: new Date(),
  session: mockSession,
};

describe('Bookings Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/bookings', () => {
    it('returns 403 when non-CLIENT tries to book', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({ sessionId: SESSION_UUID });

      expect(res.status).toBe(403);
    });

    it('returns 401 without token', async () => {
      const res = await request(app).post('/api/bookings').send({ sessionId: SESSION_UUID });
      expect(res.status).toBe(401);
    });

    it('returns 201 on successful booking', async () => {
      mockPrisma._mockTx.session.findUnique.mockResolvedValueOnce(mockSession);
      mockPrisma._mockTx.booking.findUnique.mockResolvedValueOnce(null);
      mockPrisma._mockTx.booking.findFirst.mockResolvedValueOnce(null);
      mockPrisma._mockTx.booking.create.mockResolvedValueOnce(mockBooking);

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ sessionId: SESSION_UUID });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
    });

    it('returns 409 when session is full', async () => {
      const fullSession = { ...mockSession, _count: { bookings: 10 } };
      mockPrisma._mockTx.session.findUnique.mockResolvedValueOnce(fullSession);

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ sessionId: SESSION_UUID });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('SESSION_FULL');
    });

    it('returns 409 when already booked', async () => {
      mockPrisma._mockTx.session.findUnique.mockResolvedValueOnce(mockSession);
      mockPrisma._mockTx.booking.findUnique.mockResolvedValueOnce({ id: 'existing' });

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ sessionId: SESSION_UUID });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('ALREADY_BOOKED');
    });

    it('returns 400 on invalid sessionId', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ sessionId: 'not-a-uuid' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/bookings/me', () => {
    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/bookings/me');
      expect(res.status).toBe(401);
    });

    it('returns my bookings list', async () => {
      mockPrisma.booking.findMany.mockResolvedValueOnce([mockBooking]);
      mockPrisma.booking.count.mockResolvedValueOnce(1);

      const res = await request(app)
        .get('/api/bookings/me')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
    });
  });

  describe('DELETE /api/bookings/:id', () => {
    it('returns 401 without token', async () => {
      const res = await request(app).delete('/api/bookings/booking-id-uuid-1234-5678-9012');
      expect(res.status).toBe(401);
    });

    it('returns 403 when cancelling after session started', async () => {
      const pastSession = { ...mockSession, startAt: new Date(Date.now() - 3600000) };
      vi.mocked(prisma.booking.findUnique).mockResolvedValueOnce({
        ...mockBooking,
        session: pastSession,
      } as never);

      const res = await request(app)
        .delete('/api/bookings/00000000-0000-0000-0000-000000000001')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('SESSION_STARTED');
    });

    it('returns 204 on successful cancellation', async () => {
      vi.mocked(prisma.booking.findUnique).mockResolvedValueOnce(mockBooking as never);
      vi.mocked(prisma.booking.delete).mockResolvedValueOnce(mockBooking as never);

      const res = await request(app)
        .delete('/api/bookings/00000000-0000-0000-0000-000000000001')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(204);
    });
  });
});
