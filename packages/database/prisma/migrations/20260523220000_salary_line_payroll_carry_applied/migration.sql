-- Tracks prior-month cap carry applied to this month's salary line (reversed on full detach).
ALTER TABLE "salary_lines"
ADD COLUMN "payroll_carry_applied_amount" DECIMAL(12, 2);
