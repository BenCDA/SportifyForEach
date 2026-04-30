# Audit de la Base de Données — Sportify Pro

## Préambule : JWT en base ou non ?

**Access token JWT** : NON, jamais stocké en base. Un JWT est auto-vérifiable par sa signature cryptographique — le serveur n'a pas besoin de le retrouver. Le stocker créerait une table inutile, forcerait un round-trip DB à chaque requête authentifiée et annulerait l'intérêt architectural du JWT (vérification stateless).

**Refresh token** : OUI, stocké en base sous forme de **hash** (`tokenHash`), jamais en clair. La table `RefreshToken` contient `userId`, `tokenHash`, `expiresAt`, `revokedAt`, `createdAt`, `userAgent`, `ip`. Elle permet la révocation unitaire, la rotation sécurisée, la détection de rejeu (token révoqué réutilisé → révocation de tous les tokens du compte) et l'audit de session. Conforme OWASP.

**Règle absolue : aucun JWT n'est jamais stocké en clair en base, sous aucune forme.**

---

## a) Inventaire des tables

### Table `User`

| Colonne | Type | Contraintes |
|---------|------|-------------|
| `id` | `TEXT` | PK, NOT NULL, `gen_random_uuid()` |
| `email` | `TEXT` | NOT NULL, UNIQUE |
| `passwordHash` | `TEXT` | NOT NULL |
| `firstName` | `TEXT` | NOT NULL |
| `lastName` | `TEXT` | NOT NULL |
| `role` | `Role` (enum) | NOT NULL, DEFAULT `CLIENT` |
| `avatarUrl` | `TEXT` | NULL |
| `createdAt` | `TIMESTAMP(3)` | NOT NULL, DEFAULT `now()` |
| `updatedAt` | `TIMESTAMP(3)` | NOT NULL, auto-updated |
| `deletedAt` | `TIMESTAMP(3)` | NULL (soft delete) |

Index : `User_email_key` (UNIQUE)

### Table `CoachProfile`

| Colonne | Type | Contraintes |
|---------|------|-------------|
| `id` | `TEXT` | PK |
| `userId` | `TEXT` | NOT NULL, UNIQUE, FK → User(id) CASCADE |
| `bio` | `TEXT` | NULL |
| `specialties` | `TEXT[]` | NOT NULL (array) |
| `updatedAt` | `TIMESTAMP(3)` | NOT NULL, auto-updated |

Index : `CoachProfile_userId_key` (UNIQUE)

### Table `Session`

| Colonne | Type | Contraintes |
|---------|------|-------------|
| `id` | `TEXT` | PK |
| `coachId` | `TEXT` | NOT NULL, FK → User(id) CASCADE |
| `title` | `TEXT` | NOT NULL |
| `sport` | `TEXT` | NULL |
| `description` | `TEXT` | NULL |
| `requirements` | `TEXT` | NULL |
| `startAt` | `TIMESTAMP(3)` | NOT NULL |
| `durationMin` | `INTEGER` | NOT NULL |
| `capacity` | `INTEGER` | NOT NULL |
| `locationName` | `TEXT` | NOT NULL |
| `address` | `TEXT` | NOT NULL |
| `city` | `TEXT` | NOT NULL |
| `postalCode` | `TEXT` | NOT NULL |
| `latitude` | `DOUBLE PRECISION` | NULL |
| `longitude` | `DOUBLE PRECISION` | NULL |
| `coverImageUrl` | `TEXT` | NULL |
| `createdAt` | `TIMESTAMP(3)` | NOT NULL, DEFAULT `now()` |
| `updatedAt` | `TIMESTAMP(3)` | NOT NULL, auto-updated |

Index : `Session_startAt_idx`, `Session_city_idx`

### Table `Booking`

| Colonne | Type | Contraintes |
|---------|------|-------------|
| `id` | `TEXT` | PK |
| `sessionId` | `TEXT` | NOT NULL, FK → Session(id) CASCADE |
| `clientId` | `TEXT` | NOT NULL, FK → User(id) CASCADE |
| `createdAt` | `TIMESTAMP(3)` | NOT NULL, DEFAULT `now()` |

Index : `Booking_sessionId_clientId_key` (UNIQUE), `Booking_clientId_sessionId_idx`

### Table `RefreshToken`

| Colonne | Type | Contraintes |
|---------|------|-------------|
| `id` | `TEXT` | PK |
| `userId` | `TEXT` | NOT NULL, FK → User(id) CASCADE |
| `tokenHash` | `TEXT` | NOT NULL, UNIQUE |
| `expiresAt` | `TIMESTAMP(3)` | NOT NULL |
| `revokedAt` | `TIMESTAMP(3)` | NULL |
| `userAgent` | `TEXT` | NULL |
| `ip` | `TEXT` | NULL |
| `createdAt` | `TIMESTAMP(3)` | NOT NULL, DEFAULT `now()` |

Index : `RefreshToken_tokenHash_key` (UNIQUE), `RefreshToken_userId_idx`

### Table `AuditLog`

| Colonne | Type | Contraintes |
|---------|------|-------------|
| `id` | `TEXT` | PK |
| `userId` | `TEXT` | NULL, FK → User(id) SET NULL |
| `action` | `TEXT` | NOT NULL (ex: `USER_CREATED`, `SESSION_DELETED`) |
| `entityType` | `TEXT` | NOT NULL (ex: `user`, `session`, `booking`) |
| `entityId` | `TEXT` | NULL |
| `metadata` | `JSONB` | NULL |
| `createdAt` | `TIMESTAMP(3)` | NOT NULL, DEFAULT `now()` |

Index : `AuditLog_userId_idx`, `AuditLog_createdAt_idx`

---

## b) Vérifications structurelles

| Critère | Statut | Commentaire |
|---------|--------|-------------|
| **3NF — Normalisation** | ✅ | Pas de redondance. `sport` sur Session est une valeur libre (string) cohérente avec une liste de référence frontend. Pas de champs calculés stockés. |
| **Intégrité référentielle** | ✅ | Toutes les FK déclarées avec `onDelete` cohérent : `Booking → User/Session CASCADE` (logique : une réservation n'existe pas sans sa session ni son client), `CoachProfile → User CASCADE`, `Session → User (coach) CASCADE`, `RefreshToken → User CASCADE`, `AuditLog → User SET NULL` (les logs persistent même si l'utilisateur est supprimé). |
| **Index** | ✅ | `email` UNIQUE sur User ✓, `startAt` sur Session ✓, `city` sur Session ✓, `(sessionId, clientId)` UNIQUE sur Booking ✓, `tokenHash` UNIQUE sur RefreshToken ✓, `userId` sur RefreshToken ✓, `userId` + `createdAt` sur AuditLog ✓ |
| **Soft delete** | ✅ | `User.deletedAt` présent. ⚠️ Les requêtes ne filtrent pas encore les utilisateurs supprimés (à instrumenter progressivement dans les services). |
| **Timestamps** | ✅ | `createdAt` sur toutes les tables. `updatedAt @updatedAt` ajouté sur `User`, `CoachProfile`, `Session`. `RefreshToken` et `Booking` n'ont pas `updatedAt` — par design (entités immuables après création). `AuditLog` : immuable par nature, pas d'`updatedAt`. |
| **Types** | ✅ | Enum `Role` pour les rôles ✓. `sport` en `String?` acceptable (liste de référence gérée frontend). `specialties TEXT[]` adapté au modèle PostgreSQL. `metadata JSONB` sur AuditLog documenté. |
| **Sécurité données** | ✅ | `passwordHash` jamais retourné (`sanitizeUser()` dans auth.service et users.service). `tokenHash` en base (jamais le token brut). Pas de PII sensible non nécessaire. |

---

## c) Tables attendues — checklist

| Table | Statut | Champs manquants |
|-------|--------|-----------------|
| `User` | ✅ | — (updatedAt + deletedAt ajoutés via migration 20260429) |
| `CoachProfile` | ✅ | — (updatedAt ajouté) |
| `Session` | ✅ | — (updatedAt ajouté) |
| `Booking` | ✅ | — |
| `RefreshToken` | ✅ | — (userAgent + ip ajoutés) |
| `AuditLog` | ✅ | — (créée via migration 20260429) |

---

## d) Diagramme MCD/MLD

Voir [docs/05-mcd-mld.md](05-mcd-mld.md) — régénéré avec l'état final du schéma.

---

## e) Script SQL

Voir [docs/script.sql](script.sql) — généré via `prisma migrate diff --from-empty --to-schema-datamodel`.

---

## f) Recommandations

### Implémentées (triviales et sûres)
- `updatedAt @updatedAt` sur User, CoachProfile, Session — suivi des modifications
- `deletedAt DateTime?` sur User — soft delete prêt à l'emploi
- `userAgent` et `ip` sur RefreshToken — audit de session, détection d'anomalies
- `AuditLog` — traçabilité des actions sensibles (non instrumenté en application, prêt à l'usage)
- Index `Session.city` — requêtes de filtrage géographique

### Recommandations futures (non implémentées)
| Amélioration | Justification | Effort |
|-------------|---------------|--------|
| `@db.Citext` sur `User.email` | Évite les doublons à casse différente (`Bob@test.com` vs `bob@test.com`) sans normaliser en application | Migration + extension PostgreSQL `citext` |
| Filtrer `deletedAt IS NULL` dans tous les services | Concrétiser le soft delete — les utilisateurs supprimés ne doivent pas apparaître | Modifier chaque `findMany` et `findUnique` sur User |
| Instrumenter `AuditLog` | Logger `USER_DELETED`, `ROLE_CHANGED`, `SESSION_DELETED` dans les services admin | Faible, itératif |
| Index `Session.coachId` | Si on filtre souvent les sessions par coach (dashboard) | `@@index([coachId])` dans le schema |
| Contrainte CHECK `capacity > 0` et `durationMin > 0` | Intégrité métier en base, pas seulement en Zod | `@db.Check` (Prisma 5.x raw) ou trigger |
| Sport en table de référence | Si les sports doivent être administrables, remplacer `String?` par FK vers `Sport(id)` | Migration + seed sports |
