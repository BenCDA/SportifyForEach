# Diagramme de Classes — Sportify Pro

```mermaid
classDiagram
    class User {
        +String id
        +String email
        +String passwordHash
        +String firstName
        +String lastName
        +Role role
        +DateTime createdAt
        +register(email, password, firstName, lastName) User
        +login(email, password) TokenPair
        +getProfile() UserDTO
    }

    class CoachProfile {
        +String id
        +String userId
        +String bio
        +String[] specialties
        +update(bio, specialties) CoachProfile
    }

    class Session {
        +String id
        +String coachId
        +String title
        +String description
        +String requirements
        +DateTime startAt
        +Int durationMin
        +Int capacity
        +String locationName
        +String address
        +String city
        +String postalCode
        +Float latitude
        +Float longitude
        +DateTime createdAt
        +create(data) Session
        +update(data) Session
        +delete() void
        +getParticipants() User[]
        +isFull() Boolean
        +hasStarted() Boolean
    }

    class Booking {
        +String id
        +String sessionId
        +String clientId
        +DateTime createdAt
        +create(sessionId, clientId) Booking
        +cancel() void
        +isOwner(userId) Boolean
    }

    class RefreshToken {
        +String id
        +String userId
        +String tokenHash
        +DateTime expiresAt
        +DateTime revokedAt
        +DateTime createdAt
        +revoke() void
        +isValid() Boolean
    }

    class TokenPair {
        +String accessToken
        +String refreshToken
    }

    class Role {
        <<enumeration>>
        CLIENT
        COACH
        ADMIN
    }

    User "1" --> "0..1" CoachProfile : has
    User "1" --> "0..*" Session : coaches
    User "1" --> "0..*" Booking : makes
    User "1" --> "0..*" RefreshToken : owns
    Session "1" --> "0..*" Booking : has
    User --> Role : has
```

## Description des classes

### User
Entité principale représentant un utilisateur de la plateforme. Le rôle détermine les droits d'accès.

### CoachProfile
Extension du profil pour les coachs. Contient la biographie et le tableau de spécialités sportives (1 à 3 valeurs parmi une liste prédéfinie).

### Session
Représente une séance de coaching. Appartient à un coach, peut avoir plusieurs réservations jusqu'à sa capacité maximale. La localisation est décomposée en champs structurés (nom du lieu, adresse, ville, code postal, coordonnées GPS optionnelles).

### Booking
Lien entre un client et une séance. Garantit l'unicité (un client ne réserve qu'une fois par séance). La suppression représente l'annulation.

### RefreshToken
Jeton de rafraîchissement stocké sous forme de hash SHA-256. Supporte la rotation (revokedAt) et la détection de rejeu (si un token révoqué est réutilisé, tous les tokens actifs de l'utilisateur sont révoqués).

### TokenPair
Objet de valeur retourné lors de l'authentification, contenant le JWT access token (15 min) et le refresh token (7 jours).

### Role (enum)
- **CLIENT** : peut réserver des séances
- **COACH** : peut gérer ses propres séances
- **ADMIN** : accès total à toutes les ressources
