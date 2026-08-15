-- Additive P&L / ops expense categories for Bitrix→NBOS finance migration.
-- Existing values (incl. SALARY, BONUS) unchanged — payroll-generated expenses still use them.
ALTER TYPE "ExpenseCategoryEnum" ADD VALUE IF NOT EXISTS 'OFFICE' AFTER 'TOOLS';
ALTER TYPE "ExpenseCategoryEnum" ADD VALUE IF NOT EXISTS 'TAXES' AFTER 'OFFICE';
ALTER TYPE "ExpenseCategoryEnum" ADD VALUE IF NOT EXISTS 'BANK_FEES' AFTER 'TAXES';
ALTER TYPE "ExpenseCategoryEnum" ADD VALUE IF NOT EXISTS 'TRAINING' AFTER 'BANK_FEES';
ALTER TYPE "ExpenseCategoryEnum" ADD VALUE IF NOT EXISTS 'INTERNAL_INFRA' AFTER 'TRAINING';
