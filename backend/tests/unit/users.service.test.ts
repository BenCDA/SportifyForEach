import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError } from '../../src/utils/AppError';

vi.mock('../../src/config/prisma', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      count:    vi.fn(),
      findUnique: vi.fn(),
      update:   vi.fn(),
      delete:   vi.fn(),
    },
  },
}));

import { prisma } from '../../src/config/prisma';
import * as usersService from '../../src/modules/users/users.service';

const mockUser = {
  id: 'u1', email: 'alice@example.com', passwordHash: 'hash',
  firstName: 'Alice', lastName: 'Bernard', role: 'CLIENT' as const, createdAt: new Date(),
};

describe('UsersService', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe('listUsers', () => {
    it('returns paginated users without passwordHash', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValueOnce([mockUser] as never);
      vi.mocked(prisma.user.count).mockResolvedValueOnce(1);

      const result = await usersService.listUsers(1, 10);
      expect(result.meta).toEqual({ page: 1, limit: 10, total: 1 });
      expect(result.users[0]).not.toHaveProperty('passwordHash');
    });
  });

  describe('getUserById', () => {
    it('throws USER_NOT_FOUND when user does not exist', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
      await expect(usersService.getUserById('nope')).rejects.toMatchObject({
        code: 'USER_NOT_FOUND', statusCode: 404,
      });
    });

    it('returns sanitized user', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser as never);
      const user = await usersService.getUserById('u1');
      expect(user.email).toBe('alice@example.com');
      expect(user).not.toHaveProperty('passwordHash');
    });
  });

  describe('updateUser', () => {
    it('throws USER_NOT_FOUND when user does not exist', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
      await expect(usersService.updateUser('nope', { firstName: 'X' })).rejects.toMatchObject({
        code: 'USER_NOT_FOUND',
      });
    });

    it('throws EMAIL_TAKEN when new email already used', async () => {
      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(mockUser as never)
        .mockResolvedValueOnce({ ...mockUser, id: 'other-user' } as never);

      await expect(
        usersService.updateUser('u1', { email: 'other@example.com' }),
      ).rejects.toMatchObject({ code: 'EMAIL_TAKEN', statusCode: 409 });
    });

    it('updates user successfully', async () => {
      const updated = { ...mockUser, firstName: 'Updated' };
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser as never);
      vi.mocked(prisma.user.update).mockResolvedValueOnce(updated as never);

      const result = await usersService.updateUser('u1', { firstName: 'Updated' });
      expect(result.firstName).toBe('Updated');
      expect(result).not.toHaveProperty('passwordHash');
    });
  });

  describe('deleteUser', () => {
    it('throws USER_NOT_FOUND when user does not exist', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
      await expect(usersService.deleteUser('nope')).rejects.toMatchObject({
        code: 'USER_NOT_FOUND',
      });
    });

    it('deletes user successfully', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser as never);
      vi.mocked(prisma.user.delete).mockResolvedValueOnce(mockUser as never);
      await expect(usersService.deleteUser('u1')).resolves.toBeUndefined();
    });
  });
});
