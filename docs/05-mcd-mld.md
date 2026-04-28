# MCD, MLD et Script SQL — Sportify Pro

## MCD (Modèle Conceptuel de Données)

```mermaid
erDiagram
    USER {
        uuid id PK
        string email UK
        string passwordHash
        string firstName
        string lastName
        enum role
        datetime createdAt
    }

    COACH_PROFILE {
        uuid id PK
        uuid userId FK,UK
        string bio
        string[] specialties
    }

    SESSION {
        uuid id PK
        uuid coachId FK
        string title
        string description
        string requirements
        datetime startAt
        int durationMin
        int capacity
        string locationName
        string address
        string city
        string postalCode
        float latitude
        float longitude
        datetime createdAt
    }

    BOOKING {
        uuid id PK
        uuid sessionId FK
        uuid clientId FK
        datetime createdAt
    }

    REFRESH_TOKEN {
        uuid id PK
        uuid userId FK
        string tokenHash UK
        datetime expiresAt
        datetime revokedAt
        datetime createdAt
    }

    USER ||--o| COACH_PROFILE : "has profile"
    USER ||--o{ SESSION : "coaches"
    USER ||--o{ BOOKING : "makes"
    USER ||--o{ REFRESH_TOKEN : "owns"
    SESSION ||--o{ BOOKING : "has"
```

## MLD (Modèle Logique de Données)

```
USER(id, email*, passwordHash, firstName, lastName, role, createdAt)
  PK: id
  UK: email
  role ∈ {CLIENT, COACH, ADMIN}

COACH_PROFILE(id, userId#, bio, specialties[])
  PK: id
  FK: userId → USER(id) ON DELETE CASCADE
  UK: userId

SESSION(id, coachId#, title, description, requirements, startAt,
        durationMin, capacity, locationName, address, city, postalCode,
        latitude, longitude, createdAt)
  PK: id
  FK: coachId → USER(id) ON DELETE CASCADE
  INDEX: startAt, city

BOOKING(id, sessionId#, clientId#, createdAt)
  PK: id
  FK: sessionId → SESSION(id) ON DELETE CASCADE
  FK: clientId → USER(id) ON DELETE CASCADE
  UK: (sessionId, clientId)
  INDEX: (clientId, sessionId)

REFRESH_TOKEN(id, userId#, tokenHash*, expiresAt, revokedAt, createdAt)
  PK: id
  FK: userId → USER(id) ON DELETE CASCADE
  UK: tokenHash
  INDEX: userId
```

## Script SQL

Voir [script.sql](script.sql) pour le script complet de création reflétant le schéma courant.
