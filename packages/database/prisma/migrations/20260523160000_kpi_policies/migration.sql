-- KPI Policy (My Company parameters; template logic stays in application code).
CREATE TYPE "KpiPolicyStatusEnum" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

CREATE TABLE "kpi_policies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "template_code" TEXT NOT NULL,
    "gate_rules" JSONB NOT NULL,
    "status" "KpiPolicyStatusEnum" NOT NULL DEFAULT 'ACTIVE',
    "scope" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kpi_policies_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "kpi_policies_status_idx" ON "kpi_policies"("status");

INSERT INTO "kpi_policies" (
    "id",
    "name",
    "template_code",
    "gate_rules",
    "status",
    "scope",
    "notes",
    "updated_at"
) VALUES (
    'a0000000-0000-4000-8000-000000000001',
    'Default sales KPI gate',
    'KPI_GATE_PAYOUT_MULTIPLIER',
    '{"bands":[{"minAttainmentPct":70,"payoutFactor":1},{"minAttainmentPct":50,"payoutFactor":0.5},{"minAttainmentPct":0,"payoutFactor":0}]}'::jsonb,
    'ACTIVE',
    'COMPANY',
    'NBOS default: 70% full, 50-69% half, below 50% zero',
    CURRENT_TIMESTAMP
);

ALTER TABLE "compensation_profiles" DROP CONSTRAINT IF EXISTS "compensation_profiles_kpi_policy_id_fkey";

ALTER TABLE "compensation_profiles"
ADD CONSTRAINT "compensation_profiles_kpi_policy_id_fkey"
FOREIGN KEY ("kpi_policy_id") REFERENCES "kpi_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE "compensation_profiles"
SET "kpi_policy_id" = 'a0000000-0000-4000-8000-000000000001'
WHERE "kpi_policy_id" IS NULL
  AND "status" = 'ACTIVE';
