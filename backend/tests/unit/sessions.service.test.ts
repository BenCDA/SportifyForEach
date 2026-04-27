import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/config/prisma', () => ({
  prisma: {
    session: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { prisma } from '../../src/config/prisma';
import * as sessionsService from '../../src/modules/sessions/sessions.service';

const mockSession = {
  id: 'session-1',
  coachId: 'coach-1',
  title: 'Yoga',
  description: null,
  startAt: new Date(),
  durationMin: 60,
  capacity: 10,
  location: 'Salle A',
  createdAt: new Date(),
};

describe('SessionsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateSession', () => {
    it('throws FORBIDDEN when coach tries to edit another coach session', async () => {
      vi.mocked(prisma.session.findUnique).mockResolvedValueOnce(mockSession as never);

      await expect(
        sessionsService.updateSession('session-1', 'other-coach', 'COACH', { title: 'New Title' })
      ).rejects.toMatchObject({ code: 'FORBIDDEN', statusCode: 403 });
    });

    it('allows admin to edit any session', async () => {
      vi.mocked(prisma.session.findUnique).mockResolvedValueOnce(mockSession as never);
      vi.mocked(prisma.session.update).mockResolvedValueOnce({ ...mockSession, title: 'New Title' } as never);

      const result = await sessionsService.updateSession('session-1', 'admin-id', 'ADMIN', { title: 'New Title' });
      expect(result.title).toBe('New Title');
    });

    it('allows coach owner to edit their session', async () => {
      vi.mocked(prisma.session.findUnique).mockResolvedValueOnce(mockSession as never);
      vi.mocked(prisma.session.update).mockResolvedValueOnce({ ...mockSession, title: 'Updated' } as never);

      const result = await sessionsService.updateSession('session-1', 'coach-1', 'COACH', { title: 'Updated' });
      expect(result.title).toBe('Updated');
    });
  });

  describe('deleteSession', () => {
    it('throws FORBIDDEN when coach tries to delete another coach session', async () => {
      vi.mocked(prisma.session.findUnique).mockResolvedValueOnce(mockSession as never);

      await expect(
        sessionsService.deleteSession('session-1', 'other-coach', 'COACH')
      ).rejects.toMatchObject({ code: 'FORBIDDEN', statusCode: 403 });
    });

    it('throws SESSION_NOT_FOUND when session does not exist', async () => {
      vi.mocked(prisma.session.findUnique).mockResolvedValueOnce(null);

      await expect(
        sessionsService.deleteSession('nonexistent', 'coach-1', 'COACH')
      ).rejects.toMatchObject({ code: 'SESSION_NOT_FOUND', statusCode: 404 });
    });
  });

  describe('listSessions', () => {
    it('returns paginated sessions', async () => {
      const sessions = [{ ...mockSession, coach: { id: 'coach-1', firstName: 'A', lastName: 'B', email: 'a@b.com' }, _count: { bookings: 0 } }];
      vi.mocked(prisma.session.findMany).mockResolvedValueOnce(sessions as never);
      vi.mocked(prisma.session.count).mockResolvedValueOnce(1);

      const result = await sessionsService.listSessions(1, 10, {});
      expect(result.meta).toEqual({ page: 1, limit: 10, total: 1 });
      expect(result.sessions).toHaveLength(1);
    });
  });
});
