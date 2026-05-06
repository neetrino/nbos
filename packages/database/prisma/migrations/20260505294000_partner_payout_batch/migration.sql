CREATE TYPE "PartnerPayoutBatchStatusEnum" AS ENUM (
  'DRAFT',
  'APPROVED',
  'EXPENSE_CREATED',
  'PAID',
  'CANCELLED'
);

CREATE TABLE "partner_payout_batches" (
  "id" TEXT NOT NULL,
  "partner_id" TEXT NOT NULL,
  "total_amount" DECIMAL(14, 2) NOT NULL,
  "status" "PartnerPayoutBatchStatusEnum" NOT NULL DEFAULT 'DRAFT',
  "payout_date" TIMESTAMP(3),
  "expense_id" TEXT,
  "approved_by" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "partner_payout_batches_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "partner_accruals"
ADD COLUMN "payout_batch_id" TEXT;

CREATE UNIQUE INDEX "partner_payout_batches_expense_id_key"
ON "partner_payout_batches"("expense_id");

CREATE INDEX "partner_payout_batches_partner_id_idx"
ON "partner_payout_batches"("partner_id");

CREATE INDEX "partner_payout_batches_status_idx"
ON "partner_payout_batches"("status");

CREATE INDEX "partner_accruals_payout_batch_id_idx"
ON "partner_accruals"("payout_batch_id");

ALTER TABLE "partner_payout_batches"
ADD CONSTRAINT "partner_payout_batches_partner_id_fkey"
FOREIGN KEY ("partner_id") REFERENCES "partners"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "partner_payout_batches"
ADD CONSTRAINT "partner_payout_batches_expense_id_fkey"
FOREIGN KEY ("expense_id") REFERENCES "expenses"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "partner_accruals"
ADD CONSTRAINT "partner_accruals_payout_batch_id_fkey"
FOREIGN KEY ("payout_batch_id") REFERENCES "partner_payout_batches"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
