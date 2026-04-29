import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/index';
import { makeAccessToken } from '../helpers';

vi.mock('../../src/config/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    session: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../../src/modules/uploads/uploads.service', () => ({
  processAvatar: vi.fn().mockResolvedValue('/uploads/avatars/user-1-123.webp'),
  processSessionCover: vi.fn().mockResolvedValue('/uploads/sessions/session-1-123.webp'),
  safeDeleteFile: vi.fn(),
}));

import { prisma } from '../../src/config/prisma';

const mockPrisma = prisma as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  session: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
};

const clientToken = makeAccessToken('user-1', 'CLIENT');
const coachToken  = makeAccessToken('coach-1', 'COACH');
const otherCoach  = makeAccessToken('coach-2', 'COACH');

const SESSION_UUID = '00000000-0000-0000-0000-000000000099';

const mockUser = {
  id: 'user-1', email: 'alice@example.com', passwordHash: 'hash',
  firstName: 'Alice', lastName: 'Bernard', role: 'CLIENT' as const,
  avatarUrl: null, createdAt: new Date(),
};

const mockSession = {
  id: SESSION_UUID, coachId: 'coach-1', title: 'Yoga',
  sport: 'Yoga', description: null, requirements: null,
  startAt: new Date(Date.now() + 86400000), durationMin: 60, capacity: 10,
  locationName: 'Studio Zen', address: '12 rue test', city: 'Lille',
  postalCode: '59000', latitude: null, longitude: null,
  coverImageUrl: null, createdAt: new Date(),
};

// Minimal 1×1 JPEG buffer (valid MIME, tiny size)
const jpegBuffer = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkS' +
  'Ew8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJ' +
  'CQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy' +
  'MjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/' +
  'EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/' +
  'aAAwDAQACEQMRAD8AJQAB/9k=',
  'base64'
);

describe('Avatar routes', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe('POST /api/users/me/avatar', () => {
    it('uploads avatar successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);
      mockPrisma.user.update.mockResolvedValueOnce({ ...mockUser, avatarUrl: '/uploads/avatars/user-1-123.webp' });

      const res = await request(app)
        .post('/api/users/me/avatar')
        .set('Authorization', `Bearer ${clientToken}`)
        .attach('avatar', jpegBuffer, { filename: 'photo.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(200);
      expect(res.body.data.avatarUrl).toMatch(/\/uploads\/avatars\//);
    });

    it('rejects invalid MIME type', async () => {
      const res = await request(app)
        .post('/api/users/me/avatar')
        .set('Authorization', `Bearer ${clientToken}`)
        .attach('avatar', Buffer.from('fake pdf'), { filename: 'doc.pdf', contentType: 'application/pdf' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_FILE_TYPE');
    });

    it('rejects file exceeding 2 MB', async () => {
      const bigBuffer = Buffer.alloc(2 * 1024 * 1024 + 1, 0xff);

      const res = await request(app)
        .post('/api/users/me/avatar')
        .set('Authorization', `Bearer ${clientToken}`)
        .attach('avatar', bigBuffer, { filename: 'big.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('FILE_TOO_LARGE');
    });

    it('returns 401 without token', async () => {
      const res = await request(app)
        .post('/api/users/me/avatar')
        .attach('avatar', jpegBuffer, { filename: 'photo.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/users/me/avatar', () => {
    it('deletes avatar and returns 204', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        ...mockUser, avatarUrl: '/uploads/avatars/user-1-old.webp',
      });
      mockPrisma.user.update.mockResolvedValueOnce({ ...mockUser, avatarUrl: null });

      const res = await request(app)
        .delete('/api/users/me/avatar')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(204);
    });

    it('returns 401 without token', async () => {
      const res = await request(app).delete('/api/users/me/avatar');
      expect(res.status).toBe(401);
    });
  });
});

describe('Session cover routes', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe('POST /api/sessions/:id/cover', () => {
    it('allows coach owner to upload cover', async () => {
      mockPrisma.session.findUnique.mockResolvedValueOnce(mockSession);
      mockPrisma.session.update.mockResolvedValueOnce({
        ...mockSession, coverImageUrl: '/uploads/sessions/session-1-123.webp',
      });

      const res = await request(app)
        .post(`/api/sessions/${SESSION_UUID}/cover`)
        .set('Authorization', `Bearer ${coachToken}`)
        .attach('cover', jpegBuffer, { filename: 'cover.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(200);
      expect(res.body.data.coverImageUrl).toMatch(/\/uploads\/sessions\//);
    });

    it('returns 403 for a different coach', async () => {
      mockPrisma.session.findUnique.mockResolvedValueOnce(mockSession);

      const res = await request(app)
        .post(`/api/sessions/${SESSION_UUID}/cover`)
        .set('Authorization', `Bearer ${otherCoach}`)
        .attach('cover', jpegBuffer, { filename: 'cover.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(403);
    });

    it('rejects invalid MIME type', async () => {
      const res = await request(app)
        .post(`/api/sessions/${SESSION_UUID}/cover`)
        .set('Authorization', `Bearer ${coachToken}`)
        .attach('cover', Buffer.from('fake'), { filename: 'doc.pdf', contentType: 'application/pdf' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_FILE_TYPE');
    });
  });

  describe('DELETE /api/sessions/:id/cover', () => {
    it('allows coach owner to delete cover', async () => {
      mockPrisma.session.findUnique.mockResolvedValueOnce({
        ...mockSession, coverImageUrl: '/uploads/sessions/session-1-old.webp',
      });
      mockPrisma.session.update.mockResolvedValueOnce({ ...mockSession, coverImageUrl: null });

      const res = await request(app)
        .delete(`/api/sessions/${SESSION_UUID}/cover`)
        .set('Authorization', `Bearer ${coachToken}`);

      expect(res.status).toBe(204);
    });

    it('returns 403 for a different coach', async () => {
      mockPrisma.session.findUnique.mockResolvedValueOnce(mockSession);

      const res = await request(app)
        .delete(`/api/sessions/${SESSION_UUID}/cover`)
        .set('Authorization', `Bearer ${otherCoach}`);

      expect(res.status).toBe(403);
    });
  });
});
