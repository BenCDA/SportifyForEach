import { Role } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';

function sanitizeUser(user: { id: string; email: string; firstName: string; lastName: string; role: string; createdAt: Date }) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export async function listUsers(page: number, limit: number, role?: Role) {
  const where = role ? { role } : {};
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);
  return { users: users.map(sanitizeUser), meta: { page, limit, total } };
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  return sanitizeUser(user);
}

export async function updateUser(
  id: string,
  data: { firstName?: string; lastName?: string; email?: string; role?: Role },
) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');

  if (data.email && data.email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new AppError(409, 'EMAIL_TAKEN', 'Email already in use');
  }

  const updated = await prisma.user.update({ where: { id }, data });
  return sanitizeUser(updated);
}

export async function deleteUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  await prisma.user.delete({ where: { id } });
}
