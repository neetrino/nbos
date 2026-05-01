-- Expense backlog reason (NBOS Expenses module canon; optional until set per expense)

CREATE TYPE "ExpenseBacklogReasonEnum" AS ENUM (
  'DEBT_PAY_LATER',
  'WAITING_DECISION',
  'WAITING_CLIENT',
  'WAITING_PROVIDER',
  'OTHER'
);

ALTER TABLE "expenses" ADD COLUMN "backlog_reason" "ExpenseBacklogReasonEnum";
