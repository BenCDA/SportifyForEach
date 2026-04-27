import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError } from '../../src/utils/AppError';

vi.mock('../../src/config/prisma', () => {
  const mockTx = {
    session: { findUnique: vi.fn() },
    booking: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      delete: vi.fn(),
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
import * as bookingsService from '../../src/modules/bookings/bookings.service';

const mockSession = {
  id: 'session-1',
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

const mockFullSession = { ...mockSession, _count: { bookings: 10 } };

const mockPrisma = prisma as unknown as {
  $transaction: ReturnType<typeof vi.fn>;
  _mockTx: {
    session: { findUnique: ReturnType<typeof vi.fn> };
    booking: {
      findUnique: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
  };
};

describe('BookingsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createBooking', () => {
    it('throws SESSION_FULL when capacity is reached', async () => {
      mockPrisma._mockTx.session.findUnique.mockResolvedValueOnce(mockFullSession);

      await expect(bookingsService.createBooking('client-1', 'session-1')).rejects.toMatchObject({
        code: 'SESSION_FULL',
        statusCode: 409,
      });
    });

    it('throws ALREADY_BOOKED when booking exists', async () => {
      mockPrisma._mockTx.session.findUnique.mockResolvedValueOnce(mockSession);
      mockPrisma._mockTx.booking.findUnique.mockResolvedValueOnce({ id: 'existing-booking' });

      await expect(bookingsService.createBooking('client-1', 'session-1')).rejects.toMatchObject({
        code: 'ALREADY_BOOKED',
        statusCode: 409,
      });
    });

    it('throws SESSION_NOT_FOUND when session does not exist', async () => {
      mockPrisma._mockTx.session.findUnique.mockResolvedValueOnce(null);

      await expect(bookingsService.createBooking('client-1', 'nonexistent')).rejects.toMatchObject({
        code: 'SESSION_NOT_FOUND',
        statusCode: 404,
      });
    });

    it('creates booking successfully', async () => {
      mockPrisma._mockTx.session.findUnique.mockResolvedValueOnce(mockSession);
      mockPrisma._mockTx.booking.findUnique.mockResolvedValueOnce(null);
      mockPrisma._mockTx.booking.findFirst.mockResolvedValueOnce(null);
      const createdBooking = { id: 'booking-1', sessionId: 'session-1', clientId: 'client-1', createdAt: new Date(), session: mockSession };
      mockPrisma._mockTx.booking.create.mockResolvedValueOnce(createdBooking);

      const result = await bookingsService.createBooking('client-1', 'session-1');
      expect(result).toHaveProperty('id', 'booking-1');
    });
  });

  describe('cancelBooking', () => {
    it('throws BOOKING_NOT_FOUND when booking does not exist', async () => {
      vi.mocked(prisma.booking.findUnique).mockResolvedValueOnce(null);

      await expect(bookingsService.cancelBooking('nonexistent', 'client-1', 'CLIENT')).rejects.toMatchObject({
        code: 'BOOKING_NOT_FOUND',
        statusCode: 404,
      });
    });

    it('throws FORBIDDEN when client tries to cancel another client booking', async () => {
      vi.mocked(prisma.booking.findUnique).mockResolvedValueOnce({
        id: 'booking-1',
        clientId: 'other-client',
        sessionId: 'session-1',
        createdAt: new Date(),
        session: { ...mockSession },
      } as never);

      await expect(bookingsService.cancelBooking('booking-1', 'client-1', 'CLIENT')).rejects.toMatchObject({
        code: 'FORBIDDEN',
        statusCode: 403,
      });
    });

    it('throws SESSION_STARTED when session has already started', async () => {
      const pastSession = {
        ...mockSession,
        startAt: new Date(Date.now() - 3600000),
      };
      vi.mocked(prisma.booking.findUnique).mockResolvedValueOnce({
        id: 'booking-1',
        clientId: 'client-1',
        sessionId: 'session-1',
        createdAt: new Date(),
        session: pastSession,
      } as never);

      await expect(bookingsService.cancelBooking('booking-1', 'client-1', 'CLIENT')).rejects.toMatchObject({
        code: 'SESSION_STARTED',
        statusCode: 403,
      });
    });

    it('allows admin to cancel any booking', async () => {
      vi.mocked(prisma.booking.findUnique).mockResolvedValueOnce({
        id: 'booking-1',
        clientId: 'other-client',
        sessionId: 'session-1',
        createdAt: new Date(),
        session: mockSession,
      } as never);
      vi.mocked(prisma.booking.delete).mockResolvedValueOnce({} as never);

      await expect(
        bookingsService.cancelBooking('booking-1', 'admin-id', 'ADMIN')
      ).resolves.toBeUndefined();
    });
  });
});
