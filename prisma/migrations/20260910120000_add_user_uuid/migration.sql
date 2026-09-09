-- Add a public-facing "uuid" identifier column, separate from the internal "id" PK.
-- The internal "id" stays as the DB primary key used for joins/relations only.
-- The "uuid" column is what the API/JWT/routes should expose and accept going forward.

ALTER TABLE "users" ADD COLUMN "uuid" TEXT;

-- Backfill existing rows with a random uuid (Postgres pgcrypto extension provides gen_random_uuid()).
CREATE EXTENSION IF NOT EXISTS pgcrypto;
UPDATE "users" SET "uuid" = gen_random_uuid()::text WHERE "uuid" IS NULL;

ALTER TABLE "users" ALTER COLUMN "uuid" SET NOT NULL;
CREATE UNIQUE INDEX "users_uuid_key" ON "users"("uuid");
