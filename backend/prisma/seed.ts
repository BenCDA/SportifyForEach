import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const dicebear = (seed: string) =>
  `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundColor=1a1a1a&textColor=ffffff`;

async function main(): Promise<void> {
  const BCRYPT_COST = 10;

  // Skip seed if users already exist (idempotent — preserves data across restarts)
  const existing = await prisma.user.count();
  if (existing > 0) {
    console.info('Seed skipped — database already populated.');
    return;
  }

  const [adminHash, coachHash, clientHash] = await Promise.all([
    bcrypt.hash('Admin123!',  BCRYPT_COST),
    bcrypt.hash('Coach123!',  BCRYPT_COST),
    bcrypt.hash('Client123!', BCRYPT_COST),
  ]);

  // ADMIN
  await prisma.user.upsert({
    where:  { email: 'admin@sportify.fr' },
    update: {},
    create: {
      email:        'admin@sportify.fr',
      passwordHash: adminHash,
      firstName:    'Admin',
      lastName:     'System',
      role:         Role.ADMIN,
      avatarUrl:    dicebear('Admin System'),
    },
  });

  // COACH — Ben Coach
  await prisma.user.upsert({
    where:  { email: 'bencoach@sportify.com' },
    update: {},
    create: {
      email:        'bencoach@sportify.com',
      passwordHash: coachHash,
      firstName:    'Ben',
      lastName:     'Coach',
      role:         Role.COACH,
      avatarUrl:    dicebear('Ben Coach'),
      coachProfile: {
        create: {
          bio:         'Coach certifié musculation et cross-training. Passionné par la performance fonctionnelle.',
          specialties: ['Musculation', 'Cross-training'],
        },
      },
    },
  });

  // CLIENT — Benjamin Cardoso
  await prisma.user.upsert({
    where:  { email: 'benjamincardoso@sportify.com' },
    update: {},
    create: {
      email:        'benjamincardoso@sportify.com',
      passwordHash: clientHash,
      firstName:    'Benjamin',
      lastName:     'Cardoso',
      role:         Role.CLIENT,
      avatarUrl:    dicebear('Benjamin Cardoso'),
    },
  });

  console.info('Seed terminé — base propre.');
  console.info('Admin:   admin@sportify.fr          / Admin123!');
  console.info('Coach:   bencoach@sportify.com       / Coach123!');
  console.info('Client:  benjamincardoso@sportify.com / Client123!');
  console.info('Sessions: 0 | Réservations: 0');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => { void prisma.$disconnect(); });
