# Fiche de soutenance — Sportify Pro

## Pitch 30 secondes

> Sportify Pro est une application web de gestion de séances de coaching sportif avec trois rôles : client, coach et administrateur. Les clients réservent des séances, les coachs gèrent leur planning, l'admin supervise l'activité. Le tout sécurisé par JWT avec rotation des tokens, validé par Zod des deux côtés, et déployable en une commande via Docker Compose.

---

## Démo — Chemin conseillé (15 min)

### 1. Architecture (2 min)
- Montrer `docs/06-architecture.md` : schéma 3-tiers React → Express → PostgreSQL
- Ouvrir `docker-compose.yml` : 3 containers, healthcheck DB, depends_on conditionnel
- Montrer Swagger UI sur `http://localhost:3000/api/docs`

### 2. Authentification (3 min)
- **Register coach** : `marie.dupont@sportify.fr` / `Coach123!` → montrer spécialités requises
- Inspecter le réseau : la réponse contient `accessToken` + `refreshToken`, jamais `passwordHash`
- **Login admin** : `admin@sportify.fr` / `Admin123!`
- Montrer le token JWT décodé sur jwt.io : payload `{ userId, role, iat, exp }`
- Expliquer la rotation : chaque `POST /auth/refresh` révoque l'ancien token en DB

### 3. Règles métier — Réservation (3 min)
- Se connecter en CLIENT (`alice.bernard@example.com` / `Client123!`)
- Aller sur `/sessions` → barre de recherche → taper "yoga" → résultats filtrés
- Réserver une séance → confirmation 2 étapes → export ICS
- Ouvrir `backend/src/modules/bookings/bookings.service.ts` → montrer la transaction Prisma
- Expliquer les 3 vérifications atomiques : capacité, double-booking, chevauchement horaire

### 4. Planning coach (2 min)
- Se connecter en COACH (`jean.martin@sportify.fr` / `Coach123!`)
- Créer une séance avec `LocationAutocomplete` (Nominatim/OpenStreetMap)
- Voir les participants → montrer que c'est restreint au propriétaire/admin

### 5. Administration (2 min)
- Se connecter en ADMIN
- `/admin/sessions` : KPIs total/à venir/passées, supprimer une séance en direct
- `/admin/users` : modifier le rôle d'un utilisateur, avatars visibles dans le tableau
- Tenter `PUT /api/sessions/:id` sur la séance d'un autre coach → 403 en live

### 6. Tests (2 min)
- `cd backend && npm test` → 62 tests verts en direct
- Pointer `tests/integration/bookings.routes.test.ts` : scénarios SESSION_FULL, ALREADY_BOOKED, 403

### 7. CI/CD (1 min)
- Montrer `.github/workflows/ci.yml` : lint + typecheck + tests à chaque push
- Montrer `.github/workflows/cd.yml` : build + push image Docker sur GHCR

---

## Justifications des choix techniques majeurs

| Choix | Pourquoi | Alternative écartée |
|-------|----------|---------------------|
| **Prisma** | Type-safe, migrations versionnées, ORM mature | TypeORM — moins ergonomique pour PostgreSQL |
| **JWT access (15 min) + refresh (7 j)** | Access court = surface d'attaque réduite si intercepté | Session côté serveur — état difficile à scaler |
| **Rotation des refresh tokens** | Détection de rejeu : si token révoqué réutilisé, tous les tokens de l'utilisateur sont révoqués | Token statique — vulnérable au vol silencieux |
| **Transactions Prisma pour les réservations** | Prévient les race conditions sur la capacité en charge concurrente | Vérification en 2 temps — TOCTOU possible |
| **Zod** | Validation back + front avec le même schéma, inférence TypeScript native | Joi — pas d'inférence TypeScript |
| **Vitest + Supertest** | Vitest s'intègre nativement à l'écosystème Vite/ESM, Supertest lève un vrai serveur HTTP | Jest — config plus lourde pour ESM |
| **Architecture 3-tiers containerisée** | Isolation totale, reproductibilité, déploiement en une commande | VPS nu — dépendances fragiles |
| **Nginx pour le frontend** | Sert les assets statiques efficacement, `try_files` pour le routing SPA | Node.js en prod — overhead inutile pour du statique |
| **Design off-white éditorial** | Lisibilité maximale, pas de surcharge visuelle, focus sur le contenu | Dark mode + glassmorphism — tendance mais fatiguant |

---

## Points forts à mettre en avant

1. **Sécurité réelle** — Rotation des refresh tokens avec détection de rejeu, rate limiting sur `/auth/login`, bcrypt cost 10, sanitizeUser systématique (jamais de `passwordHash`), upload sécurisé (MIME check, size limit, nommage hashé)
2. **Transactions atomiques** — La vérification de capacité et de chevauchement horaire est faite dans une seule transaction Prisma → race conditions impossibles même sous charge
3. **Validation bout en bout** — Zod valide les inputs côté API ET côté front (React Hook Form + Zod resolver) avec les mêmes règles
4. **62 tests, 79 % coverage** — Unit (services mockés) + intégration (supertest sur vrais handlers), tous les cas d'erreur métier couverts
5. **CI/CD complet** — GitHub Actions : lint + typecheck + tests à chaque push, build + push Docker sur GHCR à chaque tag
6. **Médias** — Upload avatar (react-easy-crop crop UI, resize sharp 512×512 webp), images de sport auto via Unsplash désaturé, cover optionnelle par séance, service statique avec headers immuables
7. **UX pensée** — Export ICS, recherche debounced 300 ms, squelettes de chargement, confirmation 2 étapes, page profil, bannières KPI admin

---

## Limitations connues + corrections V2

| Limitation | Correction V2 |
|-----------|---------------|
| Logout ne révoque pas l'access token (expire dans 15 min) | Blacklist Redis des JTI révoqués |
| Pas de soft-delete sur User | Ajouter `deletedAt`, filtrer les requêtes, conserver les séances/réservations historiques |
| Frontend stocke les tokens en localStorage | Passer l'access token en mémoire, le refresh en httpOnly cookie |
| Pas de tests frontend | Playwright e2e : register → login → réservation |
| Pas de notifications push | WebSocket ou SSE pour alertes en temps réel |
| Localisation via Nominatim (usage limité en prod) | Passer sur Mapbox ou Google Maps avec clé API |
