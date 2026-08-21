-- Expand AuditLog for actor-aware identity.
-- Preserve all historical rows. user_id stays populated for existing human writes;
-- machine actors may omit user_id after the application cutover.

CREATE TYPE "AuditActorTypeEnum" AS ENUM (
  'USER',
  'EXTERNAL_AGENT',
  'INTERNAL_AI',
  'SYSTEM',
  'AUTOMATION'
);

ALTER TABLE "audit_logs"
ADD COLUMN "actor_type" "AuditActorTypeEnum",
ADD COLUMN "actor_id" TEXT,
ADD COLUMN "on_behalf_of_type" "AuditActorTypeEnum",
ADD COLUMN "on_behalf_of_id" TEXT,
ADD COLUMN "channel" TEXT,
ADD COLUMN "protocol" TEXT,
ADD COLUMN "correlation_id" TEXT,
ADD COLUMN "client_metadata" JSONB;

ALTER TABLE "audit_logs"
ALTER COLUMN "user_id" DROP NOT NULL;

UPDATE "audit_logs"
SET
  "actor_type" = 'USER',
  "actor_id" = "user_id"
WHERE "user_id" IS NOT NULL
  AND "actor_type" IS NULL;

CREATE INDEX "audit_logs_actor_type_actor_id_idx"
ON "audit_logs" ("actor_type", "actor_id");

CREATE INDEX "audit_logs_correlation_id_idx"
ON "audit_logs" ("correlation_id");
