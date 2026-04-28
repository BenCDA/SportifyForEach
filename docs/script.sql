-- ============================================================
-- Sportify Pro — Script SQL de création (schéma courant)
-- Reflète l'état réel de la base après 3 migrations Prisma.
-- ============================================================

-- Enum
CREATE TYPE "Role" AS ENUM ('CLIENT', 'COACH', 'ADMIN');

-- ──────────────────────────────────────────────
-- Table : User
-- ──────────────────────────────────────────────
CREATE TABLE "User" (
    "id"           TEXT         NOT NULL,
    "email"        TEXT         NOT NULL,
    "passwordHash" TEXT         NOT NULL,
    "firstName"    TEXT         NOT NULL,
    "lastName"     TEXT         NOT NULL,
    "role"         "Role"       NOT NULL DEFAULT 'CLIENT',
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- ──────────────────────────────────────────────
-- Table : CoachProfile
-- ──────────────────────────────────────────────
CREATE TABLE "CoachProfile" (
    "id"          TEXT    NOT NULL,
    "userId"      TEXT    NOT NULL,
    "bio"         TEXT,
    "specialties" TEXT[]  NOT NULL DEFAULT '{}',

    CONSTRAINT "CoachProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CoachProfile_userId_key" ON "CoachProfile"("userId");

ALTER TABLE "CoachProfile"
    ADD CONSTRAINT "CoachProfile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ──────────────────────────────────────────────
-- Table : Session
-- ──────────────────────────────────────────────
CREATE TABLE "Session" (
    "id"           TEXT         NOT NULL,
    "coachId"      TEXT         NOT NULL,
    "title"        TEXT         NOT NULL,
    "description"  TEXT,
    "requirements" TEXT,
    "startAt"      TIMESTAMP(3) NOT NULL,
    "durationMin"  INTEGER      NOT NULL,
    "capacity"     INTEGER      NOT NULL,
    "locationName" TEXT         NOT NULL DEFAULT '',
    "address"      TEXT         NOT NULL DEFAULT '',
    "city"         TEXT         NOT NULL DEFAULT '',
    "postalCode"   TEXT         NOT NULL DEFAULT '',
    "latitude"     DOUBLE PRECISION,
    "longitude"    DOUBLE PRECISION,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Session_startAt_idx" ON "Session"("startAt");
CREATE INDEX "Session_city_idx"    ON "Session"("city");

ALTER TABLE "Session"
    ADD CONSTRAINT "Session_coachId_fkey"
    FOREIGN KEY ("coachId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ──────────────────────────────────────────────
-- Table : Booking
-- ──────────────────────────────────────────────
CREATE TABLE "Booking" (
    "id"        TEXT         NOT NULL,
    "sessionId" TEXT         NOT NULL,
    "clientId"  TEXT         NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

CREATE INDEX        "Booking_clientId_sessionId_idx" ON "Booking"("clientId", "sessionId");
CREATE UNIQUE INDEX "Booking_sessionId_clientId_key" ON "Booking"("sessionId", "clientId");

ALTER TABLE "Booking"
    ADD CONSTRAINT "Booking_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "Session"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Booking"
    ADD CONSTRAINT "Booking_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ──────────────────────────────────────────────
-- Table : RefreshToken
-- ──────────────────────────────────────────────
CREATE TABLE "RefreshToken" (
    "id"        TEXT         NOT NULL,
    "userId"    TEXT         NOT NULL,
    "tokenHash" TEXT         NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");
CREATE INDEX        "RefreshToken_userId_idx"     ON "RefreshToken"("userId");

ALTER TABLE "RefreshToken"
    ADD CONSTRAINT "RefreshToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
