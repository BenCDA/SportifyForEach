# Choix Techniques — Sportify Pro

## Résumé des décisions architecturales

### 1. Structure des tokens JWT
**Décision :** Access token 15 min en mémoire (React Context), refresh token 7 jours en localStorage.
**Raison :** Compromis entre sécurité (access token court-vécu) et UX (pas de reconnexion fréquente). Le refresh en localStorage simplifie l'implémentation tout en conservant une durée raisonnable.

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

## Ambiguïtés résolues

| Ambiguïté | Décision prise |
|-----------|----------------|
| Format retour annulation booking | 204 No Content (standard REST DELETE) |
| Un ADMIN peut-il créer des séances ? | Oui, rôle COACH\|ADMIN sur POST /sessions |
| Refresh token stocké côté serveur ? | Non (stateless) — rotation simple côté client |
| La suppression d'une séance supprime les bookings ? | Oui, cascade DB |
| GET /sessions retourne les séances passées ? | Oui, avec filtre `from`/`to` optionnel |
| Participants visibles sur GET /sessions/:id ? | Uniquement si coach propriétaire ou admin |
