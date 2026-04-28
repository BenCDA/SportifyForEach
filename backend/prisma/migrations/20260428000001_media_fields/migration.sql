-- AlterTable: add avatarUrl to User
ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;

-- AlterTable: add sport and coverImageUrl to Session
ALTER TABLE "Session" ADD COLUMN "sport" TEXT;
ALTER TABLE "Session" ADD COLUMN "coverImageUrl" TEXT;
