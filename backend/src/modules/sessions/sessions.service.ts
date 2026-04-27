import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';

export interface CreateSessionInput {
  title: string;
  description?: string;
  startAt: string;
  durationMin: number;
  capacity: number;
  location: string;
}

export async function listSessions(
  page: number,
  limit: number,
  filters: { from?: string; to?: string; coachId?: string },
) {
  const where: Record<string, unknown> = {};
  if (filters.from || filters.to) {
    where['startAt'] = {
      ...(filters.from ? { gte: new Date(filters.from) } : {}),
      ...(filters.to ? { lte: new Date(filters.to) } : {}),
    };
  }
  if (filters.coachId) where['coachId'] = filters.coachId;

  const [sessions, total] = await Promise.all([
    prisma.session.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { startAt: 'asc' },
      include: {
        coach: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { bookings: true } },
      },
    }),
    prisma.session.count({ where }),
  ]);

  return {
    sessions: sessions.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      startAt: s.startAt,
      durationMin: s.durationMin,
      capacity: s.capacity,
      location: s.location,
      createdAt: s.createdAt,
      coach: s.coach,
      bookingsCount: s._count.bookings,
    })),
    meta: { page, limit, total },
  };
}

export async function getSessionById(id: string, requesterId: string, requesterRole: string) {
  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      coach: { select: { id: true, firstName: true, lastName: true, email: true } },
      _count: { select: { bookings: true } },
      bookings: {
        include: {
          client: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      },
    },
  });
  if (!session) throw new AppError(404, 'SESSION_NOT_FOUND', 'Session not found');

  const canSeeParticipants =
    requesterRole === 'ADMIN' || session.coachId === requesterId;

  return {
    id: session.id,
    title: session.title,
    description: session.description,
    startAt: session.startAt,
    durationMin: session.durationMin,
    capacity: session.capacity,
    location: session.location,
    createdAt: session.createdAt,
    coach: session.coach,
    bookingsCount: session._count.bookings,
    participants: canSeeParticipants ? session.bookings.map((b) => b.client) : undefined,
  };
}

export async function createSession(coachId: string, input: CreateSessionInput) {
  return prisma.session.create({
    data: {
      coachId,
      title: input.title,
      description: input.description,
      startAt: new Date(input.startAt),
      durationMin: input.durationMin,
      capacity: input.capacity,
      location: input.location,
    },
  });
}

export async function updateSession(
  id: string,
  requesterId: string,
  requesterRole: string,
  data: Partial<CreateSessionInput>,
) {
  const session = await prisma.session.findUnique({ where: { id } });
  if (!session) throw new AppError(404, 'SESSION_NOT_FOUND', 'Session not found');
  if (requesterRole !== 'ADMIN' && session.coachId !== requesterId) {
    throw new AppError(403, 'FORBIDDEN', 'You can only edit your own sessions');
  }

  return prisma.session.update({
    where: { id },
    data: {
      ...data,
      startAt: data.startAt ? new Date(data.startAt) : undefined,
    },
  });
}

export async function deleteSession(id: string, requesterId: string, requesterRole: string) {
  const session = await prisma.session.findUnique({ where: { id } });
  if (!session) throw new AppError(404, 'SESSION_NOT_FOUND', 'Session not found');
  if (requesterRole !== 'ADMIN' && session.coachId !== requesterId) {
    throw new AppError(403, 'FORBIDDEN', 'You can only delete your own sessions');
  }
  await prisma.session.delete({ where: { id } });
}
