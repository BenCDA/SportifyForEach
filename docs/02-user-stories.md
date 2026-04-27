# User Stories — Sportify Pro

## Authentification

### US-01 — Inscription
**En tant que** visiteur, **je veux** créer un compte avec mon email et un mot de passe, **afin de** accéder à la plateforme en tant que client.

**Critères d'acceptation :**
- [ ] L'email doit être unique et valide
- [ ] Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre
- [ ] Un JWT access + refresh est retourné à l'inscription réussie
- [ ] Le mot de passe n'est jamais retourné dans la réponse

### US-02 — Connexion
**En tant que** utilisateur enregistré, **je veux** me connecter avec mon email et mot de passe, **afin de** accéder à mon espace personnel.

**Critères d'acceptation :**
- [ ] Retourne access token (15 min) + refresh token (7 jours)
- [ ] Retourne 401 si identifiants incorrects
- [ ] Ne retourne pas le hash du mot de passe

### US-03 — Rafraîchissement du token
**En tant que** utilisateur connecté, **je veux** renouveler mon access token automatiquement, **afin de** rester connecté sans re-saisir mes identifiants.

**Critères d'acceptation :**
- [ ] Accepte un refresh token valide
- [ ] Retourne un nouveau access token
- [ ] Retourne 401 si le refresh token est invalide ou expiré

---

## CLIENT

### US-04 — Lister les séances
**En tant que** client, **je veux** consulter la liste des séances disponibles avec des filtres par date et coach, **afin de** trouver une séance qui me convient.

**Critères d'acceptation :**
- [ ] Pagination (page, limit) avec méta-données (total, page, limit)
- [ ] Filtre par date de début (from) et date de fin (to)
- [ ] Filtre par coach (coachId)
- [ ] N'affiche que les séances futures avec des places disponibles

### US-05 — Réserver une séance
**En tant que** client, **je veux** réserver une séance disponible, **afin de** m'inscrire à une activité sportive.

**Critères d'acceptation :**
- [ ] Vérifie que la capacité maximale n'est pas atteinte
- [ ] Refuse si le client a déjà une réservation en chevauchement horaire
- [ ] Refuse si le client a déjà réservé cette séance
- [ ] Retourne la réservation créée avec les informations de la séance

### US-06 — Consulter ses réservations
**En tant que** client, **je veux** voir la liste de mes réservations, **afin de** gérer mon planning sportif.

**Critères d'acceptation :**
- [ ] Liste toutes mes réservations (passées et futures)
- [ ] Inclut les informations de la séance (titre, date, lieu, coach)
- [ ] Pagination disponible

### US-07 — Annuler une réservation
**En tant que** client, **je veux** annuler une réservation, **afin de** libérer ma place si je ne peux pas y aller.

**Critères d'acceptation :**
- [ ] Uniquement pour mes propres réservations
- [ ] Uniquement avant le début de la séance
- [ ] Retourne 403 si la séance a déjà commencé
- [ ] Retourne 403 si ce n'est pas ma réservation

---

## COACH

### US-08 — Consulter son planning
**En tant que** coach, **je veux** voir toutes mes séances planifiées, **afin de** gérer mon emploi du temps.

**Critères d'acceptation :**
- [ ] Liste toutes mes séances (passées et futures)
- [ ] Affiche le nombre de participants par séance
- [ ] Filtres par date disponibles

### US-09 — Créer une séance
**En tant que** coach, **je veux** créer une nouvelle séance, **afin de** proposer une activité à mes clients.

**Critères d'acceptation :**
- [ ] Champs requis : titre, date/heure de début, durée, capacité, lieu
- [ ] La séance est automatiquement associée au coach connecté
- [ ] Retourne la séance créée

### US-10 — Modifier une séance
**En tant que** coach, **je veux** modifier les informations d'une de mes séances, **afin de** corriger ou mettre à jour les détails.

**Critères d'acceptation :**
- [ ] Uniquement pour mes propres séances (403 sinon)
- [ ] Tous les champs sont modifiables
- [ ] Retourne la séance mise à jour

### US-11 — Supprimer une séance
**En tant que** coach, **je veux** supprimer une de mes séances, **afin de** la retirer de la plateforme.

**Critères d'acceptation :**
- [ ] Uniquement pour mes propres séances (403 sinon)
- [ ] Supprime également toutes les réservations associées

### US-12 — Voir les participants
**En tant que** coach, **je veux** voir la liste des participants inscrits à mes séances, **afin de** préparer mes cours.

**Critères d'acceptation :**
- [ ] Visible uniquement pour le coach propriétaire (et admin)
- [ ] Affiche prénom, nom de chaque participant

---

## ADMIN

### US-13 — Gérer les utilisateurs
**En tant qu'** admin, **je veux** créer, modifier, supprimer des comptes utilisateurs, **afin de** maintenir la base d'utilisateurs.

**Critères d'acceptation :**
- [ ] Liste paginée de tous les utilisateurs
- [ ] Modification du rôle, prénom, nom, email
- [ ] Suppression d'un compte (et données associées)
- [ ] Le mot de passe n'est jamais retourné

### US-14 — Superviser les séances
**En tant qu'** admin, **je veux** voir toutes les séances et réservations, **afin de** surveiller l'activité de la plateforme.

**Critères d'acceptation :**
- [ ] Accès à toutes les séances (tous coachs)
- [ ] Peut supprimer n'importe quelle séance ou réservation

### US-15 — Voir les participants de n'importe quelle séance
**En tant qu'** admin, **je veux** consulter les participants de toute séance, **afin de** superviser les inscriptions.

**Critères d'acceptation :**
- [ ] Accès à l'endpoint GET /sessions/:id avec liste participants
