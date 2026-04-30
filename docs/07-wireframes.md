# Wireframes — Sportify Pro

## Fichier Figma

**[Ouvrir dans Figma →](https://www.figma.com/design/AEHgOdOYem2wuE0qpEnYjU)**

Fichier : `Sportify Pro — Wireframes`  
Fidélité : **mid-fi** · DA off-white éditoriale (`#F5F3EE` / `#1A1A1A` / `#E63946`)  
Responsive : desktop 1440px + mobile 375px pour les 6 écrans clés

---

## Organisation des pages

| Page Figma | Écrans |
|-----------|--------|
| **Public · Auth · Client** | Landing (D+M), Login (D+M), Register (D+M), Sessions Liste (D+M), Session Détail (D+M), Modale Réservation, Mes Réservations, Mon Profil |
| **Coach · Admin** | Coach Dashboard (D+M), Coach Création Séance, Coach Détail Séance (liste participants), Admin Dashboard, Admin Utilisateurs, Admin Supervision Séances |
| **Design System** | Palette couleurs, typographie, boutons, inputs, cartes séance, badges, DatePicker (react-day-picker v9), avatars |

---

## Inventaire des écrans (14 + Design System)

### Public & Auth

| # | Écran | URL | Variantes |
|---|-------|-----|-----------|
| 01 | Landing page | `/` | Desktop 1440 + Mobile 375 |
| 02 | Inscription | `/register` | Desktop + Mobile · toggle CLIENT/COACH |
| 03 | Connexion | `/login` | Desktop + Mobile |

### Client (authentifié)

| # | Écran | URL | Variantes |
|---|-------|-----|-----------|
| 04 | Liste des séances | `/sessions` | Desktop + Mobile · filtres DateRange/sport/ville/recherche |
| 05 | Détail séance | `/sessions/:id` | Desktop + Mobile · carte Leaflet · panel sticky |
| 06 | Modale réservation | (overlay sur détail) | Desktop · état initial + confirmation |
| 07 | Mes réservations | `/bookings` | Desktop · onglets À venir / Passées |
| 08 | Mon profil | `/profile` | Desktop · upload avatar crop |

### Coach

| # | Écran | URL | Variantes |
|---|-------|-----|-----------|
| 09 | Tableau de bord coach | `/coach` | Desktop + Mobile · KPIs + planning |
| 10 | Création / édition séance | `/sessions/new` | Desktop · DateTimePicker, geocoding auto |
| 11 | Détail séance côté coach | `/sessions/:id` | Desktop · liste participants visible |

### Admin

| # | Écran | URL | Variantes |
|---|-------|-----|-----------|
| 12 | Tableau de bord admin | `/admin` | Desktop · sidebar + KPIs globaux |
| 13 | Gestion utilisateurs | `/admin/users` | Desktop · tableau + actions rôle |
| 14 | Supervision des séances | `/admin/sessions` | Desktop · tableau + filtres DateRange |

---

## Conventions de la DA

| Élément | Valeur |
|---------|--------|
| Fond principal | `#F5F3EE` paper |
| Surface (cartes, modales) | `#FFFFFF` |
| Texte principal | `#1A1A1A` ink |
| Accent (erreurs, CTA critiques) | `#E63946` |
| Séparateurs | `#E8E6E1` border |
| Titres | Instrument Serif Italic |
| UI / corps | Inter Regular/Medium/Bold |
| Labels / numéraux | Inter Medium (JetBrains Mono en prod) |
| Coins | `rounded-none` — aucun arrondi |

---

## Export PDF

Dans Figma : **File → Export frames to PDF**  
Sélectionner toutes les frames, format A4 paysage (desktop) ou portrait (mobile).
