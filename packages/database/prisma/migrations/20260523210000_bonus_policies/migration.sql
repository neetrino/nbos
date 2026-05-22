-- Bonus Policy (My Company bundle; SALES rate grid stays in sales_bonus_policies).
CREATE TYPE "BonusPolicyStatusEnum" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

CREATE TABLE "bonus_policies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "template_code" TEXT NOT NULL,
    "status" "BonusPolicyStatusEnum" NOT NULL DEFAULT 'ACTIVE',
    "scope" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bonus_policies_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bonus_policies_status_idx" ON "bonus_policies"("status");

INSERT INTO "bonus_policies" (
    "id",
    "name",
    "template_code",
    "status",
    "scope",
    "notes",
    "updated_at"
) VALUES (
    'b0000000-0000-4000-8000-000000000001',
    'Company sales bonus rates',
    'SALES_COMPANY_RATES',
    'ACTIVE',
    'COMPANY',
    'Uses active rows in sales_bonus_policies (From × payment model). Edit rates under Sales bonus policies.',
    CURRENT_TIMESTAMP
);

-- Drop orphan text ids before FK (column existed without referential integrity).
UPDATE "compensation_profiles"
SET "bonus_policy_id" = NULL
WHERE "bonus_policy_id" IS NOT NULL
  AND "bonus_policy_id" NOT IN (SELECT "id" FROM "bonus_policies");

ALTER TABLE "compensation_profiles"
ADD CONSTRAINT "compensation_profiles_bonus_policy_id_fkey"
FOREIGN KEY ("bonus_policy_id") REFERENCES "bonus_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE "compensation_profiles"
SET "bonus_policy_id" = 'b0000000-0000-4000-8000-000000000001'
WHERE "bonus_policy_id" IS NULL
  AND "status" = 'ACTIVE';
