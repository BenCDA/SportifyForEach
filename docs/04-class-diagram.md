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
        +String specialty
        +update(bio, specialty) CoachProfile
    }

    class Session {
        +String id
        +String coachId
        +String title
        +String description
        +DateTime startAt
        +Int durationMin
        +Int capacity
        +String location
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
    Session "1" --> "0..*" Booking : has
    User --> Role : has
```

## Description des classes

### User
Entité principale représentant un utilisateur de la plateforme. Le rôle détermine les droits d'accès.

### CoachProfile
Extension du profil pour les coachs. Contient la biographie et la spécialité sportive du coach.

### Session
Représente une séance de coaching. Appartient à un coach, peut avoir plusieurs réservations jusqu'à sa capacité maximale.

### Booking
Lien entre un client et une séance. Garantit l'unicité (un client ne réserve qu'une fois par séance). La suppression représente l'annulation.

### TokenPair
Objet de valeur retourné lors de l'authentification, contenant le JWT access token et le refresh token.

### Role (enum)
- **CLIENT** : peut réserver des séances
- **COACH** : peut gérer ses propres séances
- **ADMIN** : accès total à toutes les ressources
