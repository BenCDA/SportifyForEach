# Sportify Pro

![CI](https://github.com/BenCDA/SportyForEach/actions/workflows/ci.yml/badge.svg)
![Tests](https://img.shields.io/badge/tests-62%20passing-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-79%25-green)

Application web de gestion de séances de coaching sportif. 3 rôles : CLIENT, COACH, ADMIN.

## Stack

| Couche | Technologies |
|--------|-------------|
| Backend | Node.js 20 · Express · TypeScript · Prisma · PostgreSQL 16 |
| Auth | JWT (access 15 min + refresh 7 j) · bcrypt (cost 10) |
| Validation | Zod (backend + frontend) |
| Tests | Vitest · Supertest (45 tests) |
| Frontend | React 18 · Vite · TypeScript · TailwindCSS · React Router · React Hook Form · Axios |
| Infra | Docker · Docker Compose · Nginx |

## Prérequis

- Docker Desktop 24+ et Docker Compose v2
- (dev local) Node.js 20+, PostgreSQL 16

## Installation — Docker (1 commande)

```bash
cp .env.example .env
docker compose up --build
```

Services disponibles :
- **Frontend** : http://localhost:5173
- **API** : http://localhost:3000
- **Swagger UI** : http://localhost:3000/api/docs

## Installation locale (sans Docker)

### Backend

```bash
cp .env.example .env
# Adapter DATABASE_URL dans .env
cd backend
npm install
npx prisma migrate dev
npx tsx prisma/seed.ts
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `DATABASE_URL` | URL PostgreSQL | `postgresql://sportify:sportify@localhost:5432/sportify` |
| `JWT_ACCESS_SECRET` | Secret JWT access token (≥32 chars) | — |
| `JWT_REFRESH_SECRET` | Secret JWT refresh token (≥32 chars) | — |
| `BCRYPT_COST` | Facteur de coût bcrypt | `10` |
| `CORS_ORIGIN` | Origine CORS autorisée | `http://localhost:5173` |
| `PORT` | Port du serveur backend | `3000` |
| `VITE_API_URL` | URL de l'API pour le frontend | `/api` |

## Comptes seed

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| admin@sportify.fr | Admin123! | ADMIN |
| marie.dupont@sportify.fr | Coach123! | COACH |
| jean.martin@sportify.fr | Coach123! | COACH |
| alice.bernard@example.com | Client123! | CLIENT |
| bob.leroy@example.com | Client123! | CLIENT |
| charlie.petit@example.com | Client123! | CLIENT |

## Principaux endpoints

```
POST   /api/auth/register          Inscription
POST   /api/auth/login             Connexion
POST   /api/auth/refresh           Renouvellement token
GET    /api/auth/me                Profil courant

GET    /api/sessions               Liste séances (filtres: from, to, coachId, page, limit)
POST   /api/sessions               Créer séance (COACH|ADMIN)
GET    /api/sessions/:id           Détail séance
PUT    /api/sessions/:id           Modifier séance (COACH owner|ADMIN)
DELETE /api/sessions/:id           Supprimer séance (COACH owner|ADMIN)

POST   /api/bookings               Réserver (CLIENT)
GET    /api/bookings/me            Mes réservations
DELETE /api/bookings/:id           Annuler réservation

GET    /api/users                  Liste utilisateurs (ADMIN)
GET    /api/users/me               Mon profil
PUT    /api/users/:id              Modifier utilisateur (ADMIN)
DELETE /api/users/:id              Supprimer utilisateur (ADMIN)

GET    /health                     Health check
GET    /api/docs                   Swagger UI
```

## Lancer les tests

```bash
cd backend
npm test
# ou avec couverture :
npm run test:coverage
```

## Choix techniques

Voir [/docs/08-choix-techniques.md](docs/08-choix-techniques.md) pour le détail des décisions architecturales.

Résumé :
- **Transactions Prisma** pour les réservations (prévient les race conditions sur la capacité)
- **Chevauchement d'horaires** vérifié en base dans la même transaction
- **AppError centralisée** + middleware `errorHandler` pour un format d'erreur uniforme
- **Swagger UI** sur `/api/docs` avec fichier `openapi.yaml` versionné
- **Seed idempotent** via `upsert` (relançable sans erreur)

## Documentation

| Fichier | Contenu |
|---------|---------|
| [01-cahier-des-charges.md](docs/01-cahier-des-charges.md) | Contexte, acteurs, contraintes |
| [02-user-stories.md](docs/02-user-stories.md) | User stories avec critères d'acceptation |
| [03-use-cases.md](docs/03-use-cases.md) | Diagrammes de cas d'usage (Mermaid) |
| [04-class-diagram.md](docs/04-class-diagram.md) | Diagramme de classes (Mermaid) |
| [05-mcd-mld.md](docs/05-mcd-mld.md) | MCD, MLD et script SQL |
| [06-architecture.md](docs/06-architecture.md) | Architecture 3-tiers (Mermaid) |
| [07-wireframes.md](docs/07-wireframes.md) | Wireframes ASCII |
| [08-choix-techniques.md](docs/08-choix-techniques.md) | Décisions techniques et ambiguïtés |
