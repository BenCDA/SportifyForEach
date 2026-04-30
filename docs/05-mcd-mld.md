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
        string avatarUrl
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }

    COACH_PROFILE {
        uuid id PK
        uuid userId FK,UK
        string bio
        string[] specialties
        datetime updatedAt
    }

    SESSION {
        uuid id PK
        uuid coachId FK
        string title
        string sport
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
        string coverImageUrl
        datetime createdAt
        datetime updatedAt
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
        string userAgent
        string ip
        datetime createdAt
    }

    AUDIT_LOG {
        uuid id PK
        uuid userId FK
        string action
        string entityType
        string entityId
        json metadata
        datetime createdAt
    }

    USER ||--o| COACH_PROFILE : "has profile"
    USER ||--o{ SESSION : "coaches"
    USER ||--o{ BOOKING : "makes"
    USER ||--o{ REFRESH_TOKEN : "owns"
    USER ||--o{ AUDIT_LOG : "generates"
    SESSION ||--o{ BOOKING : "has"
```

## MLD (Modèle Logique de Données)

```
USER(id, email*, passwordHash, firstName, lastName, role, avatarUrl, createdAt, updatedAt, deletedAt)
  PK: id
  UK: email
  role ∈ {CLIENT, COACH, ADMIN}
  deletedAt : soft delete (NULL = actif)

COACH_PROFILE(id, userId#, bio, specialties[], updatedAt)
  PK: id
  FK: userId → USER(id) ON DELETE CASCADE
  UK: userId

SESSION(id, coachId#, title, sport, description, requirements, startAt,
        durationMin, capacity, locationName, address, city, postalCode,
        latitude, longitude, coverImageUrl, createdAt, updatedAt)
  PK: id
  FK: coachId → USER(id) ON DELETE CASCADE
  INDEX: startAt, city

BOOKING(id, sessionId#, clientId#, createdAt)
  PK: id
  FK: sessionId → SESSION(id) ON DELETE CASCADE
  FK: clientId → USER(id) ON DELETE CASCADE
  UK: (sessionId, clientId)
  INDEX: (clientId, sessionId)

REFRESH_TOKEN(id, userId#, tokenHash*, expiresAt, revokedAt, userAgent, ip, createdAt)
  PK: id
  FK: userId → USER(id) ON DELETE CASCADE
  UK: tokenHash
  INDEX: userId
  Note: tokenHash = bcrypt/sha256 du refresh token — jamais le JWT en clair

AUDIT_LOG(id, userId#?, action, entityType, entityId?, metadata, createdAt)
  PK: id
  FK: userId → USER(id) ON DELETE SET NULL (log conservé si user supprimé)
  INDEX: userId, createdAt
```

## Script SQL

Voir [script.sql](script.sql) pour le script complet de création reflétant le schéma courant.
