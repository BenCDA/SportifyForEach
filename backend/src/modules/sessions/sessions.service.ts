import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';

export interface LocationInput {
  locationName: string;
  address:      string;
  city:         string;
  postalCode:   string;
  latitude?:    number;
  longitude?:   number;
}

export interface CreateSessionInput extends LocationInput {
  title:        string;
  description?: string;
  requirements?: string;
  startAt:      string;
  durationMin:  number;
  capacity:     number;
}

function formatSession(s: {
  id: string; coachId: string; title: string; description: string | null;
  requirements: string | null;
  startAt: Date; durationMin: number; capacity: number;
  locationName: string; address: string; city: string; postalCode: string;
  latitude: number | null; longitude: number | null;
  createdAt: Date;
  coach: { id: string; firstName: string; lastName: string; email: string };
  _count: { bookings: number };
}) {
  return {
    id: s.id, title: s.title, description: s.description, requirements: s.requirements,
    startAt: s.startAt, durationMin: s.durationMin, capacity: s.capacity,
    locationName: s.locationName, address: s.address, city: s.city,
    postalCode: s.postalCode, latitude: s.latitude, longitude: s.longitude,
    createdAt: s.createdAt, coach: s.coach, bookingsCount: s._count.bookings,
  };
}

export async function listSessions(
  page: number,
  limit: number,
  filters: { from?: string; to?: string; coachId?: string; q?: string },
) {
  const where: Record<string, unknown> = {};
  if (filters.from || filters.to) {
    where['startAt'] = {
      ...(filters.from ? { gte: new Date(filters.from) } : {}),
      ...(filters.to   ? { lte: new Date(filters.to)   } : {}),
    };
  }
  if (filters.coachId) where['coachId'] = filters.coachId;
  if (filters.q) {
    where['OR'] = [
      { title:        { contains: filters.q, mode: 'insensitive' } },
      { city:         { contains: filters.q, mode: 'insensitive' } },
      { locationName: { contains: filters.q, mode: 'insensitive' } },
    ];
  }

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

  return { sessions: sessions.map(formatSession), meta: { page, limit, total } };
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

  const canSeeParticipants = requesterRole === 'ADMIN' || session.coachId === requesterId;

  return {
    ...formatSession(session),
    participants: canSeeParticipants ? session.bookings.map((b) => b.client) : undefined,
  };
}

export async function createSession(coachId: string, input: CreateSessionInput) {
  return prisma.session.create({
    data: {
      coachId,
      title:        input.title,
      description:  input.description,
      requirements: input.requirements,
      startAt:      new Date(input.startAt),
      durationMin:  input.durationMin,
      capacity:     input.capacity,
      locationName: input.locationName,
      address:      input.address,
      city:         input.city,
      postalCode:   input.postalCode,
      latitude:     input.latitude,
      longitude:    input.longitude,
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
