-- A newly self-registered user is expected to create and own an
-- organization, so the default role changes from REP to ORG_ADMIN.
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'ORG_ADMIN';
