-- CoachProfile : specialty String? → specialties String[]
ALTER TABLE "CoachProfile" ADD COLUMN "specialties" TEXT[] NOT NULL DEFAULT '{}';
UPDATE "CoachProfile"
  SET "specialties" = ARRAY["specialty"]
  WHERE "specialty" IS NOT NULL AND "specialty" <> '';
ALTER TABLE "CoachProfile" DROP COLUMN "specialty";

-- Session : location String → structured fields + requirements
ALTER TABLE "Session" ADD COLUMN "locationName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Session" ADD COLUMN "address"      TEXT NOT NULL DEFAULT '';
ALTER TABLE "Session" ADD COLUMN "city"         TEXT NOT NULL DEFAULT '';
ALTER TABLE "Session" ADD COLUMN "postalCode"   TEXT NOT NULL DEFAULT '';
ALTER TABLE "Session" ADD COLUMN "latitude"     DOUBLE PRECISION;
ALTER TABLE "Session" ADD COLUMN "longitude"    DOUBLE PRECISION;
ALTER TABLE "Session" ADD COLUMN "requirements" TEXT;

UPDATE "Session" SET "locationName" = "location", "city" = 'Lille', "postalCode" = '59000';
ALTER TABLE "Session" DROP COLUMN "location";

-- Index on city for filtering
CREATE INDEX "Session_city_idx" ON "Session"("city");
