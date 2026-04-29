# Choix Techniques — Sportify Pro

## Résumé des décisions architecturales

### 1. Sécurité de l'authentification : cookies HttpOnly + CSRF double-submit

**Décision :** Tokens JWT stockés dans des cookies HttpOnly (jamais dans `localStorage`). Protection CSRF via le schéma OWASP Double-Submit Cookie.

**Raison :** `localStorage` est accessible par tout script de la page (XSS). Un cookie HttpOnly est opaque au JavaScript — même une injection XSS ne peut pas lire le token. Le cookie `SameSite=Lax` sur l'access token protège contre CSRF pour les navigations cross-site, mais pas pour les requêtes cross-origin avec `fetch`/`axios`. La couche CSRF double-submit couvre ce cas résiduel.

**Architecture des cookies :**

| Cookie | HttpOnly | SameSite | TTL | Rôle |
|--------|----------|----------|-----|------|
| `access_token` | ✅ | Lax | 15 min | Authentification courante |
| `refresh_token` | ✅ | Strict | 7 jours | Rotation silencieuse (path `/api/auth`) |
| `csrf_token` | ❌ | Strict | 15 min | Double-submit CSRF (lu par JS) |

**Flux CSRF :** À chaque login/register/refresh, le serveur émet les 3 cookies simultanément. Côté frontend, l'intercepteur Axios lit `csrf_token` via `document.cookie` et l'ajoute en header `X-CSRF-Token` sur toutes les requêtes mutantes. Le middleware `csrfProtect` compare cookie et header — divergence → 403 `CSRF_INVALID`.

**Bypass CSRF intentionnels :**
- Méthodes sûres (`GET/HEAD/OPTIONS`) : pas de side-effect, pas de protection nécessaire
- Header `Authorization: Bearer ...` présent : client API ou suite de tests, pas cookie-driven
- Pas de cookie `access_token` : session inexistante, le middleware d'auth retournera 401

**Comparaison localStorage vs cookie HttpOnly :**

| Critère | localStorage | Cookie HttpOnly |
|---------|-------------|-----------------|
| Accessible en XSS | ✅ Oui (vulnérable) | ❌ Non (protégé) |
| Persiste après fermeture | ✅ Oui | Selon `maxAge` |
| Envoi automatique cross-origin | ❌ Non (header manuel) | Selon `SameSite` |
| Risque CSRF | ❌ Non | ✅ Nécessite protection |
| SSR-compatible | ⚠️ Non (window) | ✅ Oui |

**Refresh silencieux avec queue :** L'intercepteur de réponse Axios intercepte les 401, appelle `/api/auth/refresh` (cookie envoyé automatiquement), met en file les requêtes parallèles pendant le refresh, puis les rejoue. Si le refresh échoue, toutes les requêtes en file sont rejetées et l'utilisateur est redirigé vers `/login`.

### 2. Format des IDs
**Décision :** UUID v4 (via `gen_random_uuid()` PostgreSQL / `crypto.randomUUID()` Prisma).
**Raison :** Évite l'énumération des ressources, compatible avec une éventuelle architecture distribuée future.

### 3. Gestion des erreurs
**Décision :** Classe `AppError` centralisée + middleware `errorHandler` unique en fin de chaîne Express.
**Raison :** Format uniforme `{ error: { code, message } }` pour toutes les erreurs, facilite la gestion côté frontend.

### 4. Transactions Prisma pour les bookings
**Décision :** Utilisation de `prisma.$transaction()` pour la vérification de capacité + création de réservation.
**Raison :** Évite les race conditions en cas de réservations simultanées (ex: 2 utilisateurs qui réservent le dernier slot en même temps).

### 5. Validation Zod
**Décision :** Schémas Zod dans des fichiers `schema.ts` dédiés par module, middleware `validate` générique.
**Raison :** Validation centralisée, typage inféré automatiquement, réutilisable côté frontend.

### 6. Pagination
**Décision :** Paramètres `page` (1-indexé) et `limit` (défaut 10, max 100) en query string.
**Raison :** Standard REST simple, compatible avec la majorité des clients.

### 7. Suppression en cascade
**Décision :** `ON DELETE CASCADE` sur les FK de Booking et CoachProfile vers User, et Booking vers Session.
**Raison :** Simplifie la logique de suppression (supprimer un user supprime ses bookings, supprimer une session supprime ses bookings).

### 8. Nginx pour le frontend
**Décision :** Build Vite statique servi par Nginx (pas de SSR).
**Raison :** Performances optimales, simplicité de déploiement, pas de besoin de rendu serveur pour cette application.

### 9. Rate limiting sur /auth
**Décision :** `express-rate-limit` : 10 requêtes par 15 min sur les routes /auth/login et /auth/register.
**Raison :** Protection basique contre le brute force sans complexité supplémentaire.

### 10. Tests — séparation base de données
**Décision :** Tests Vitest avec base SQLite en mémoire pour les tests de services, Supertest sur l'app Express complète pour les tests d'intégration.
**Raison :** Tests rapides (SQLite), tests réalistes (Supertest). La base de test est réinitialisée avant chaque suite.

### 11. Chevauchement des réservations
**Décision :** Vérification en base via requête Prisma (pas côté client) : `startAt < endAt_nouvelle AND endAt > startAt_nouvelle`.
**Raison :** La vérification côté serveur dans la même transaction garantit la cohérence.

### 12. Choix React Hook Form + Zod côté frontend
**Décision :** `react-hook-form` avec resolver Zod pour la validation des formulaires.
**Raison :** Performances (pas de re-render à chaque frappe), validation cohérente avec le backend, messages d'erreur typés.

### 13. Swagger OpenAPI
**Décision :** Fichier `openapi.yaml` versionné dans le code source, monté via `swagger-ui-express`.
**Raison :** Documentation contractuelle versionnable dans Git, génération potentielle de clients SDK.

### 14. Seed déterministe
**Décision :** `upsert` avec emails fixes pour que le seed soit idempotent (re-exécutable sans erreur).
**Raison :** Le seed peut être relancé après une migration ou un reset de la DB sans erreur de duplication.

### 15. CORS configurable via env
**Décision :** `CORS_ORIGIN` en variable d'environnement (défaut `http://localhost:5173`).
**Raison :** Permet de configurer l'origine autorisée sans modifier le code en production.

### 16. Direction artistique frontend — Option A « Off-white éditorial »
**Décision :** Palette off-white (`#F5F3EE` paper, `#FFFFFF` surface, `#1A1A1A` ink, `#E63946` accent), typographie tripartite Instrument Serif (titres italiques) / Inter Tight (corps UI) / JetBrains Mono (métadonnées, labels, chiffres tabulaires).
**Références :** Linear, Vercel, Stripe, Whoop — minimalisme éditorial, magazine sportif haut de gamme.
**Raison :** Aucun gradient, aucun glassmorphisme, `rounded-none` sur tous les boutons, inputs underline-only. Cohérence immédiate sur portfolio de studio : la hiérarchie typographique remplace l'ornement visuel. Le rouge `#E63946` accent est utilisé uniquement pour les erreurs, la disponibilité complète et les badges ADMIN — jamais comme décoration.

### 17. Modélisation du Rôle : enum PostgreSQL vs table dédiée

**Décision :** Rôle modélisé comme enum PostgreSQL (`CLIENT | COACH | ADMIN`) sur le modèle `User`, sans table `Role` séparée.

**Justification technique :**

| Critère | Enum PostgreSQL | Table Role séparée |
|---------|----------------|--------------------|
| Intégrité référentielle | ✅ Garantie par la contrainte de type au niveau moteur | ✅ Garantie par FK + contrainte UNIQUE |
| Validation à l'insertion | ✅ Rejet immédiat d'une valeur invalide par le SGBD | ✅ Via FK (erreur 23503) |
| Performances | ✅ Aucune jointure nécessaire | ⚠️ JOIN systématique sur chaque requête User |
| Évolutivité (ajout de rôle) | ⚠️ Migration DDL requise (`ALTER TYPE ... ADD VALUE`) | ✅ Simple INSERT |
| Lisibilité du schéma | ✅ Un champ, valeur auto-documentée | ⚠️ Indirection via FK |
| Pertinence pour ce domaine | ✅ 3 rôles fixes, domaine fermé, aucun attribut associé au rôle | — |

**Conclusion :** Dans un système à rôles fixes sans attributs propres au rôle (pas de permissions dynamiques, pas de label multilingue), l'enum est la modélisation idiomatic PostgreSQL. Elle garantit les mêmes contraintes d'intégrité qu'une table séparée avec moins de complexité. Si les rôles devaient devenir configurables (RBAC fin), une migration vers une table `Role` serait envisageable.

**Contraintes d'intégrité équivalentes :**
- `NOT NULL` + type enum → valeur toujours définie et valide
- Zod validation côté application (`z.enum(['CLIENT','COACH','ADMIN'])`) → double filet
- Tests d'intégration vérifient le 403 sur rôle insuffisant

---

### 18. Stratégie médias (avatars & covers de séances)

**Décision :** Stockage local dans `backend/uploads/` (avatars 512×512, covers 1600×900) avec traitement via `sharp` (resize + conversion webp). Nommage hashé `{id}-{timestamp}.webp`. Migration prévue vers S3/R2 en production.

**Sécurité :**
- Validation MIME côté serveur (`multer` `fileFilter` : jpeg/png/webp uniquement)
- Limites de taille : 2 Mo avatars, 5 Mo covers
- Nommage jamais basé sur le nom original du fichier (prévention path traversal)
- `path.resolve` + vérification `startsWith(UPLOADS_BASE)` avant toute suppression
- Headers `Cache-Control: public, max-age=31536000, immutable` (noms hashés = immuables)
- CORP (`cross-origin-resource-policy: cross-origin`) activé pour les assets statiques

**Images de sport :** Mapping `sport → URL Unsplash désaturée (sat=-100)` côté frontend. La séance hérite de l'image du sport si aucune cover custom n'est uploadée. Fallback : image gym générique.

**Migration prod vers S3 :**
- Remplacer `processAvatar`/`processSessionCover` par upload vers S3 via `@aws-sdk/client-s3`
- L'URL stockée en DB passe de `/uploads/avatars/xxx.webp` à `https://cdn.exemple.com/avatars/xxx.webp`
- Aucun changement frontend requis (URL opaque dans les deux cas)

---

## Ambiguïtés résolues

| Ambiguïté | Décision prise |
|-----------|----------------|
| Format retour annulation booking | 204 No Content (standard REST DELETE) |
| Un ADMIN peut-il créer des séances ? | Oui, rôle COACH\|ADMIN sur POST /sessions |
| Refresh token stocké côté serveur ? | Oui (table `RefreshToken`) — rotation avec révocation |
| La suppression d'une séance supprime les bookings ? | Oui, cascade DB |
| GET /sessions retourne les séances passées ? | Oui, avec filtre `from`/`to` optionnel |
| Participants visibles sur GET /sessions/:id ? | Uniquement si coach propriétaire ou admin |
