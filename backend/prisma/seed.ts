import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SESSION_IDS = {
  YOGA_PAST:      'a0000000-0000-0000-0000-000000000001',
  YOGA_FUTURE:    'a0000000-0000-0000-0000-000000000002',
  CROSSFIT_FULL:  'a0000000-0000-0000-0000-000000000003',
  BOXING:         'a0000000-0000-0000-0000-000000000004',
  PILATES:        'a0000000-0000-0000-0000-000000000005',
  CROSSFIT_PAST:  'a0000000-0000-0000-0000-000000000006',
};

async function main(): Promise<void> {
  const BCRYPT_COST = 10;

  const adminHash  = await bcrypt.hash('Admin123!',  BCRYPT_COST);
  const coachHash  = await bcrypt.hash('Coach123!',  BCRYPT_COST);
  const clientHash = await bcrypt.hash('Client123!', BCRYPT_COST);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sportify.fr' },
    update: {},
    create: {
      email: 'admin@sportify.fr',
      passwordHash: adminHash,
      firstName: 'Admin',
      lastName: 'System',
      role: Role.ADMIN,
    },
  });

  const coach1 = await prisma.user.upsert({
    where: { email: 'marie.dupont@sportify.fr' },
    update: {},
    create: {
      email: 'marie.dupont@sportify.fr',
      passwordHash: coachHash,
      firstName: 'Marie',
      lastName: 'Dupont',
      role: Role.COACH,
      coachProfile: {
        create: { bio: 'Coach certifiée yoga et pilates depuis 8 ans.', specialty: 'Yoga, Pilates' },
      },
    },
  });

  const coach2 = await prisma.user.upsert({
    where: { email: 'jean.martin@sportify.fr' },
    update: {},
    create: {
      email: 'jean.martin@sportify.fr',
      passwordHash: coachHash,
      firstName: 'Jean',
      lastName: 'Martin',
      role: Role.COACH,
      coachProfile: {
        create: { bio: 'Expert CrossFit et boxe cardio.', specialty: 'CrossFit, Boxe' },
      },
    },
  });

  const client1 = await prisma.user.upsert({
    where: { email: 'alice.bernard@example.com' },
    update: {},
    create: {
      email: 'alice.bernard@example.com',
      passwordHash: clientHash,
      firstName: 'Alice',
      lastName: 'Bernard',
      role: Role.CLIENT,
    },
  });

  const client2 = await prisma.user.upsert({
    where: { email: 'bob.leroy@example.com' },
    update: {},
    create: {
      email: 'bob.leroy@example.com',
      passwordHash: clientHash,
      firstName: 'Bob',
      lastName: 'Leroy',
      role: Role.CLIENT,
    },
  });

  const client3 = await prisma.user.upsert({
    where: { email: 'charlie.petit@example.com' },
    update: {},
    create: {
      email: 'charlie.petit@example.com',
      passwordHash: clientHash,
      firstName: 'Charlie',
      lastName: 'Petit',
      role: Role.CLIENT,
    },
  });

  const now = new Date();
  const past   = (days: number) => new Date(now.getTime() - days * 86400000);
  const future = (days: number) => new Date(now.getTime() + days * 86400000);

  const session1 = await prisma.session.upsert({
    where: { id: SESSION_IDS.YOGA_PAST },
    update: {},
    create: {
      id: SESSION_IDS.YOGA_PAST,
      coachId: coach1.id,
      title: 'Yoga du matin — Débutants',
      description: 'Séance de yoga douce pour bien commencer la journée.',
      startAt: past(3),
      durationMin: 60,
      capacity: 10,
      location: 'Salle A',
    },
  });

  const session2 = await prisma.session.upsert({
    where: { id: SESSION_IDS.YOGA_FUTURE },
    update: {},
    create: {
      id: SESSION_IDS.YOGA_FUTURE,
      coachId: coach1.id,
      title: 'Yoga avancé',
      description: 'Postures avancées et pranayama.',
      startAt: future(2),
      durationMin: 75,
      capacity: 8,
      location: 'Salle A',
    },
  });

  const session3 = await prisma.session.upsert({
    where: { id: SESSION_IDS.CROSSFIT_FULL },
    update: {},
    create: {
      id: SESSION_IDS.CROSSFIT_FULL,
      coachId: coach2.id,
      title: 'CrossFit Intensif',
      description: 'Circuit training haute intensité.',
      startAt: future(1),
      durationMin: 45,
      capacity: 3,
      location: 'Salle B',
    },
  });

  const session4 = await prisma.session.upsert({
    where: { id: SESSION_IDS.BOXING },
    update: {},
    create: {
      id: SESSION_IDS.BOXING,
      coachId: coach2.id,
      title: 'Boxe Cardio',
      description: 'Initiation à la boxe cardio.',
      startAt: future(4),
      durationMin: 60,
      capacity: 8,
      location: 'Ring',
    },
  });

  await prisma.session.upsert({
    where: { id: SESSION_IDS.PILATES },
    update: {},
    create: {
      id: SESSION_IDS.PILATES,
      coachId: coach1.id,
      title: 'Pilates Corps & Esprit',
      description: 'Renforcement musculaire et équilibre.',
      startAt: future(7),
      durationMin: 55,
      capacity: 10,
      location: 'Salle C',
    },
  });

  await prisma.session.upsert({
    where: { id: SESSION_IDS.CROSSFIT_PAST },
    update: {},
    create: {
      id: SESSION_IDS.CROSSFIT_PAST,
      coachId: coach2.id,
      title: 'CrossFit Débutants',
      description: 'Introduction au CrossFit.',
      startAt: past(7),
      durationMin: 60,
      capacity: 10,
      location: 'Salle B',
    },
  });

  // Réservations session1 (passée) — alice + bob
  await prisma.booking.upsert({
    where: { sessionId_clientId: { sessionId: session1.id, clientId: client1.id } },
    update: {},
    create: { sessionId: session1.id, clientId: client1.id },
  });
  await prisma.booking.upsert({
    where: { sessionId_clientId: { sessionId: session1.id, clientId: client2.id } },
    update: {},
    create: { sessionId: session1.id, clientId: client2.id },
  });

  // session3 (complète) — alice + bob + charlie
  await prisma.booking.upsert({
    where: { sessionId_clientId: { sessionId: session3.id, clientId: client1.id } },
    update: {},
    create: { sessionId: session3.id, clientId: client1.id },
  });
  await prisma.booking.upsert({
    where: { sessionId_clientId: { sessionId: session3.id, clientId: client2.id } },
    update: {},
    create: { sessionId: session3.id, clientId: client2.id },
  });
  await prisma.booking.upsert({
    where: { sessionId_clientId: { sessionId: session3.id, clientId: client3.id } },
    update: {},
    create: { sessionId: session3.id, clientId: client3.id },
  });

  // session4 (partielle) — alice
  await prisma.booking.upsert({
    where: { sessionId_clientId: { sessionId: session4.id, clientId: client1.id } },
    update: {},
    create: { sessionId: session4.id, clientId: client1.id },
  });

  // session2 (future) — bob
  await prisma.booking.upsert({
    where: { sessionId_clientId: { sessionId: session2.id, clientId: client2.id } },
    update: {},
    create: { sessionId: session2.id, clientId: client2.id },
  });

  console.info('Seed terminé.');
  console.info('Admin:    admin@sportify.fr        / Admin123!');
  console.info('Coach 1:  marie.dupont@sportify.fr / Coach123!');
  console.info('Coach 2:  jean.martin@sportify.fr  / Coach123!');
  console.info('Client 1: alice.bernard@example.com / Client123!');
  console.info('Client 2: bob.leroy@example.com    / Client123!');
  console.info('Client 3: charlie.petit@example.com / Client123!');
  void admin;
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => { void prisma.$disconnect(); });
