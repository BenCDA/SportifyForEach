import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';

export async function createBooking(clientId: string, sessionId: string) {
  return prisma.$transaction(async (tx) => {
    const session = await tx.session.findUnique({
      where: { id: sessionId },
      include: { _count: { select: { bookings: true } } },
    });
    if (!session) throw new AppError(404, 'SESSION_NOT_FOUND', 'Session not found');

    if (session._count.bookings >= session.capacity) {
      throw new AppError(409, 'SESSION_FULL', 'Session is at full capacity');
    }

    const existingBooking = await tx.booking.findUnique({
      where: { sessionId_clientId: { sessionId, clientId } },
    });
    if (existingBooking) {
      throw new AppError(409, 'ALREADY_BOOKED', 'You already have a booking for this session');
    }

    const sessionEndAt = new Date(session.startAt.getTime() + session.durationMin * 60000);

    const overlapping = await tx.booking.findFirst({
      where: {
        clientId,
        session: {
          startAt: { lt: sessionEndAt },
          AND: {
            startAt: {
              gt: new Date(session.startAt.getTime() - 1),
            },
          },
        },
      },
      include: { session: true },
    });

    if (overlapping) {
      const otherSession = overlapping.session;
      const otherEnd = new Date(otherSession.startAt.getTime() + otherSession.durationMin * 60000);
      const newStart = session.startAt;
      const newEnd = sessionEndAt;
      if (otherSession.startAt < newEnd && otherEnd > newStart) {
        throw new AppError(409, 'SCHEDULE_CONFLICT', 'You have a conflicting booking during this time');
      }
    }

    return tx.booking.create({
      data: { sessionId, clientId },
      include: {
        session: {
          include: {
            coach: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });
  });
}

export async function listMyBookings(clientId: string, page: number, limit: number) {
  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where: { clientId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        session: {
          include: {
            coach: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    }),
    prisma.booking.count({ where: { clientId } }),
  ]);
  return { bookings, meta: { page, limit, total } };
}

export async function cancelBooking(bookingId: string, clientId: string, role: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { session: true },
  });
  if (!booking) throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found');

  if (role !== 'ADMIN' && booking.clientId !== clientId) {
    throw new AppError(403, 'FORBIDDEN', 'You can only cancel your own bookings');
  }

  if (role !== 'ADMIN' && new Date() >= booking.session.startAt) {
    throw new AppError(403, 'SESSION_STARTED', 'Cannot cancel a booking after the session has started');
  }

  await prisma.booking.delete({ where: { id: bookingId } });
}
