-- Legacy HOLDBACK → align with NBOS bonus lifecycle (no separate holdback status).
UPDATE "bonus_entries" SET "status" = 'PENDING_ELIGIBILITY' WHERE "status" = 'HOLDBACK';

ALTER TABLE "bonus_entries" DROP COLUMN IF EXISTS "holdback_percent";
ALTER TABLE "bonus_entries" DROP COLUMN IF EXISTS "holdback_release_date";

CREATE TYPE "BonusStatusEnum_new" AS ENUM (
  'INCOMING',
  'EARNED',
  'PENDING_ELIGIBILITY',
  'VESTED',
  'ACTIVE',
  'PAID',
  'CLAWBACK'
);

ALTER TABLE "bonus_entries" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "bonus_entries"
  ALTER COLUMN "status" TYPE "BonusStatusEnum_new"
  USING ("status"::text::"BonusStatusEnum_new");

DROP TYPE "BonusStatusEnum";
ALTER TYPE "BonusStatusEnum_new" RENAME TO "BonusStatusEnum";

ALTER TABLE "bonus_entries"
  ALTER COLUMN "status" SET DEFAULT 'INCOMING'::"BonusStatusEnum";
