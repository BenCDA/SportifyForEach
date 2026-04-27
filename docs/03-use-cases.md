# Cas d'Usage — Sportify Pro

## Diagramme global

```mermaid
graph TD
    Visiteur["👤 Visiteur"]
    Client["👤 Client"]
    Coach["👤 Coach"]
    Admin["👤 Admin"]

    subgraph Authentification
        UC1[S'inscrire]
        UC2[Se connecter]
        UC3[Rafraîchir le token]
        UC4[Voir son profil]
    end

    subgraph "Gestion des séances - Client"
        UC5[Lister les séances]
        UC6[Réserver une séance]
        UC7[Consulter ses réservations]
        UC8[Annuler une réservation]
    end

    subgraph "Gestion des séances - Coach"
        UC9[Consulter son planning]
        UC10[Créer une séance]
        UC11[Modifier une séance]
        UC12[Supprimer une séance]
        UC13[Voir les participants]
    end

    subgraph "Administration"
        UC14[Gérer les utilisateurs]
        UC15[Superviser les séances]
        UC16[Supprimer toute réservation]
    end

    Visiteur --> UC1
    Visiteur --> UC2

    Client --> UC2
    Client --> UC3
    Client --> UC4
    Client --> UC5
    Client --> UC6
    Client --> UC7
    Client --> UC8

    Coach --> UC2
    Coach --> UC3
    Coach --> UC4
    Coach --> UC9
    Coach --> UC10
    Coach --> UC11
    Coach --> UC12
    Coach --> UC13

    Admin --> UC14
    Admin --> UC15
    Admin --> UC16
    Admin --> UC4
    Admin --> UC13
```

## Cas d'usage détaillés

### UC-01 : S'inscrire

```mermaid
sequenceDiagram
    actor Visiteur
    participant Frontend
    participant API
    participant DB

    Visiteur->>Frontend: Remplit le formulaire d'inscription
    Frontend->>API: POST /api/auth/register {email, password, firstName, lastName}
    API->>API: Valide les données (Zod)
    API->>DB: Vérifie unicité email
    DB-->>API: OK
    API->>DB: Crée l'utilisateur (password hashé bcrypt)
    DB-->>API: User créé
    API-->>Frontend: 201 {data: {accessToken, refreshToken, user}}
    Frontend-->>Visiteur: Redirige vers le dashboard
```

### UC-02 : Réserver une séance

```mermaid
sequenceDiagram
    actor Client
    participant Frontend
    participant API
    participant DB

    Client->>Frontend: Clique sur "Réserver"
    Frontend->>API: POST /api/bookings {sessionId}
    API->>API: Vérifie JWT (auth middleware)
    API->>DB: BEGIN TRANSACTION
    DB->>DB: Compte les réservations existantes
    alt Capacité atteinte
        DB-->>API: Rollback
        API-->>Frontend: 409 Capacity full
    else Chevauchement horaire
        DB-->>API: Rollback
        API-->>Frontend: 409 Schedule conflict
    else Double-booking
        DB-->>API: Rollback
        API-->>Frontend: 409 Already booked
    else OK
        DB->>DB: INSERT booking
        DB-->>API: COMMIT
        API-->>Frontend: 201 {data: booking}
        Frontend-->>Client: Confirmation de réservation
    end
```

### UC-03 : Annuler une réservation

```mermaid
sequenceDiagram
    actor Client
    participant API
    participant DB

    Client->>API: DELETE /api/bookings/:id
    API->>API: Vérifie JWT
    API->>DB: Récupère la réservation
    DB-->>API: {booking + session}
    alt Pas propriétaire
        API-->>Client: 403 Forbidden
    else Séance déjà commencée
        API-->>Client: 403 Session already started
    else OK
        API->>DB: DELETE booking
        DB-->>API: OK
        API-->>Client: 204 No Content
    end
```

### UC-04 : Créer une séance (Coach)

```mermaid
sequenceDiagram
    actor Coach
    participant API
    participant DB

    Coach->>API: POST /api/sessions {title, startAt, durationMin, capacity, location}
    API->>API: Vérifie JWT + rôle COACH|ADMIN
    API->>API: Valide les données (Zod)
    API->>DB: INSERT session (coachId = userId connecté)
    DB-->>API: Session créée
    API-->>Coach: 201 {data: session}
```
