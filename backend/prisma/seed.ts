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

  // DiceBear deterministic avatars (B&W shapes style)
  const dicebear = (seed: string) =>
    `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundColor=1a1a1a&textColor=ffffff`;

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sportify.fr' },
    update: {},
    create: {
      email: 'admin@sportify.fr',
      passwordHash: adminHash,
      firstName: 'Admin',
      lastName: 'System',
      role: Role.ADMIN,
      avatarUrl: dicebear('Admin System'),
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
      avatarUrl: dicebear('Marie Dupont'),
      coachProfile: {
        create: {
          bio: 'Coach certifiée yoga et pilates depuis 8 ans. Passionnée par le bien-être et la pleine conscience.',
          specialties: ['Yoga', 'Pilates'],
        },
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
      avatarUrl: dicebear('Jean Martin'),
      coachProfile: {
        create: {
          bio: 'Expert CrossFit, boxe et HIIT. Ancien compétiteur, coach depuis 5 ans.',
          specialties: ['Crossfit', 'Boxe', 'HIIT'],
        },
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
      avatarUrl: dicebear('Alice Bernard'),
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
      sport: 'Yoga',
      description: 'Séance de yoga douce pour bien commencer la journée. Convient à tous les niveaux.',
      requirements: 'Tapis de yoga recommandé. Vêtements souples.',
      startAt: past(3),
      durationMin: 60,
      capacity: 10,
      locationName: 'Studio Yoga Zen',
      address: '12 rue de Béthune',
      city: 'Lille',
      postalCode: '59000',
      latitude: 50.6367,
      longitude: 3.0635,
    },
  });

  const session2 = await prisma.session.upsert({
    where: { id: SESSION_IDS.YOGA_FUTURE },
    update: {},
    create: {
      id: SESSION_IDS.YOGA_FUTURE,
      coachId: coach1.id,
      title: 'Yoga avancé',
      sport: 'Yoga',
      description: 'Postures avancées et pranayama. Pour pratiquants réguliers.',
      requirements: 'Expérience yoga requise (6 mois minimum). Tapis et blocs de yoga.',
      startAt: future(2),
      durationMin: 75,
      capacity: 8,
      locationName: 'Studio Yoga Zen',
      address: '12 rue de Béthune',
      city: 'Lille',
      postalCode: '59000',
      latitude: 50.6367,
      longitude: 3.0635,
    },
  });

  const session3 = await prisma.session.upsert({
    where: { id: SESSION_IDS.CROSSFIT_FULL },
    update: {},
    create: {
      id: SESSION_IDS.CROSSFIT_FULL,
      coachId: coach2.id,
      title: 'CrossFit Intensif',
      sport: 'Crossfit',
      description: 'Circuit training haute intensité. Cardio + force fonctionnelle.',
      requirements: 'Niveau intermédiaire requis. Chaussures de sport stables obligatoires.',
      startAt: future(1),
      durationMin: 45,
      capacity: 3,
      locationName: 'CrossFit Le Five Wasquehal',
      address: '156 rue Léon Jouhaux',
      city: 'Wasquehal',
      postalCode: '59290',
      latitude: 50.6686,
      longitude: 3.1315,
    },
  });

  const session4 = await prisma.session.upsert({
    where: { id: SESSION_IDS.BOXING },
    update: {},
    create: {
      id: SESSION_IDS.BOXING,
      coachId: coach2.id,
      title: 'Boxe Cardio',
      sport: 'Boxe',
      description: 'Initiation à la boxe cardio. Travail sur sac et mitaines.',
      requirements: 'Aucun prérequis. Gants de boxe fournis ou apporter les vôtres.',
      startAt: future(4),
      durationMin: 60,
      capacity: 8,
      locationName: 'Boxing Club Nord',
      address: '23 rue de Lannoy',
      city: 'Roubaix',
      postalCode: '59100',
      latitude: 50.6936,
      longitude: 3.1820,
    },
  });

  await prisma.session.upsert({
    where: { id: SESSION_IDS.PILATES },
    update: {},
    create: {
      id: SESSION_IDS.PILATES,
      coachId: coach1.id,
      title: 'Pilates Corps & Esprit',
      sport: 'Pilates',
      description: 'Renforcement musculaire profond et équilibre postural.',
      requirements: 'Tapis de sol. Chaussettes antidérapantes recommandées.',
      startAt: future(7),
      durationMin: 55,
      capacity: 10,
      locationName: 'Espace Bien-être Pilates',
      address: '45 avenue du Peuple Belge',
      city: 'Lille',
      postalCode: '59800',
      latitude: 50.6497,
      longitude: 3.0601,
    },
  });

  await prisma.session.upsert({
    where: { id: SESSION_IDS.CROSSFIT_PAST },
    update: {},
    create: {
      id: SESSION_IDS.CROSSFIT_PAST,
      coachId: coach2.id,
      title: 'CrossFit Débutants',
      sport: 'Crossfit',
      description: 'Introduction au CrossFit. Apprentissage des mouvements fondamentaux.',
      requirements: 'Aucun prérequis. Tenir à jour votre carnet d\'entraînement.',
      startAt: past(7),
      durationMin: 60,
      capacity: 10,
      locationName: 'Complexe Sportif Villeneuve',
      address: '99 avenue de Dunkerque',
      city: 'Villeneuve-d\'Ascq',
      postalCode: '59650',
      latitude: 50.6169,
      longitude: 3.1350,
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
