-- Deferred bonus at payroll attach when monthly cap limits included amount (NBOS cap MVP).
ALTER TABLE "bonus_releases"
ADD COLUMN "payroll_carry_over_amount" DECIMAL(12, 2);
