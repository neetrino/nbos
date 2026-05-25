-- Unapplied cap carry-over balance (FIFO apply on later payroll attach).
ALTER TABLE "bonus_releases"
ADD COLUMN "payroll_carry_over_remaining" DECIMAL(12, 2);

UPDATE "bonus_releases"
SET "payroll_carry_over_remaining" = "payroll_carry_over_amount"
WHERE "payroll_carry_over_amount" IS NOT NULL
  AND "payroll_carry_over_amount" > 0;
