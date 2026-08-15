-- Additive: weekly cadence for ExpensePlan / Expense (Bitrix Periodicity = 7 Day).
-- Existing values ONE_TIME, MONTHLY, QUARTERLY, YEARLY, MULTI_YEAR unchanged.
ALTER TYPE "ExpenseFrequency" ADD VALUE IF NOT EXISTS 'WEEKLY' AFTER 'ONE_TIME';
