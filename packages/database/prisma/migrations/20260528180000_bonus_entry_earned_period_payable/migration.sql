-- Sales bonus: earned month + running/frozen payable snapshot (KPI gate per month).

ALTER TABLE "bonus_entries"
  ADD COLUMN "earned_period" VARCHAR(7),
  ADD COLUMN "kpi_payout_factor" DECIMAL(7, 4),
  ADD COLUMN "payable_amount" DECIMAL(12, 2);

UPDATE "bonus_entries"
SET "earned_period" = to_char("created_at" AT TIME ZONE 'UTC', 'YYYY-MM')
WHERE "type" = 'SALES' AND "earned_period" IS NULL;

CREATE INDEX "bonus_entries_employee_earned_period_idx"
  ON "bonus_entries" ("employee_id", "earned_period")
  WHERE "type" = 'SALES';
