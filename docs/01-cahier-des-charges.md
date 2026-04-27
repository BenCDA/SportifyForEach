# Cahier des Charges — Sportify Pro

## 1. Présentation du projet

**Sportify Pro** est une application web de gestion de séances de coaching sportif. Elle permet à des clients de réserver des séances proposées par des coachs, et à des administrateurs de superviser l'ensemble de la plateforme.

## 2. Contexte et objectifs

- Numériser la gestion des plannings de coaching sportif.
- Simplifier les réservations pour les clients.
- Donner aux coachs un outil de gestion de leur activité.
- Centraliser la supervision pour les administrateurs.

## 3. Acteurs

| Rôle  | Description |
|-------|-------------|
| CLIENT | Utilisateur final qui réserve des séances sportives |
| COACH  | Professionnel qui crée et gère ses propres séances |
| ADMIN  | Superviseur de la plateforme avec accès total |

## 4. Fonctionnalités par rôle

### CLIENT
- Créer un compte et se connecter
- Consulter la liste des séances disponibles (filtres : date, coach)
- Réserver une séance (sous réserve de capacité disponible)
- Annuler une réservation avant le début de la séance
- Consulter ses réservations en cours et passées

### COACH
- Se connecter à son espace coach
- Consulter son planning de séances
- Créer, modifier et supprimer ses propres séances
- Consulter la liste des participants à ses séances

### ADMIN
- Gérer les utilisateurs (CRUD)
- Superviser toutes les séances et réservations
- Supprimer toute séance ou réservation

## 5. Contraintes techniques

- API RESTful avec documentation Swagger
- Authentification JWT (access 15 min + refresh 7 jours)
- Chiffrement des mots de passe avec bcrypt (cost 10)
- Validation des données avec Zod
- Tests automatisés (≥ 60 % sur services critiques)
- Déployable via Docker Compose en une seule commande

## 6. Contraintes métier

- Capacité maximale d'une séance respectée via transaction DB
- Aucun double-booking : chevauchement d'horaires refusé
- Annulation uniquement avant le début de la séance
- Un coach ne peut gérer que ses propres séances

## 7. Livrables

- Code source complet (monorepo)
- Documentation technique (/docs)
- Tests automatisés (Vitest + Supertest)
- Docker Compose opérationnel
- README complet
