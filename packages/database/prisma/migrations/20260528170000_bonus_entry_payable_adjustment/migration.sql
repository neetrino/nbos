-- Finance manual delta on top of KPI auto payable: payableAmount = amount × factor + payableAdjustment
ALTER TABLE "bonus_entries"
ADD COLUMN "payable_adjustment" DECIMAL(12, 2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN "bonus_entries"."payable_adjustment" IS 'Manual +/- delta added to auto payable (amount × kpiPayoutFactor).';

-- Backfill non-Sales entries: factor 1, no adjustment, payable = amount
UPDATE "bonus_entries"
SET
  "kpi_payout_factor" = 1,
  "payable_amount" = "amount"
WHERE "type" <> 'SALES';

-- Sales without snapshot: factor 1, payable = amount
UPDATE "bonus_entries"
SET
  "kpi_payout_factor" = COALESCE("kpi_payout_factor", 1),
  "payable_amount" = COALESCE("payable_amount", "amount")
WHERE "type" = 'SALES';
