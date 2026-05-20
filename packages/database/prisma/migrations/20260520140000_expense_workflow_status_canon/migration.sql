-- Expense workflow statuses (NBOS canon): Planned / Due Soon / Due Now / Overdue / On Hold / Backlog / Paid / Cancelled.

CREATE TYPE "ExpenseStatusEnum_new" AS ENUM (
  'PLANNED',
  'DUE_SOON',
  'DUE_NOW',
  'OVERDUE',
  'ON_HOLD',
  'BACKLOG',
  'PAID',
  'CANCELLED'
);

ALTER TABLE "expenses" ADD COLUMN "status_new" "ExpenseStatusEnum_new";

UPDATE "expenses"
SET "status_new" = CASE "status"::text
  WHEN 'PAY_NOW' THEN 'DUE_NOW'::"ExpenseStatusEnum_new"
  WHEN 'DELAYED' THEN 'BACKLOG'::"ExpenseStatusEnum_new"
  WHEN 'ON_HOLD' THEN 'ON_HOLD'::"ExpenseStatusEnum_new"
  WHEN 'PAID' THEN 'PAID'::"ExpenseStatusEnum_new"
  WHEN 'UNPAID' THEN 'DUE_NOW'::"ExpenseStatusEnum_new"
  ELSE 'PLANNED'::"ExpenseStatusEnum_new"
END;

UPDATE "expenses"
SET "status_new" = 'OVERDUE'::"ExpenseStatusEnum_new"
WHERE "status"::text IN ('THIS_MONTH', 'UNPAID')
  AND "due_date" IS NOT NULL
  AND ("due_date" AT TIME ZONE 'UTC')::date < (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date;

UPDATE "expenses"
SET "status_new" = 'DUE_SOON'::"ExpenseStatusEnum_new"
WHERE "status"::text IN ('THIS_MONTH', 'UNPAID')
  AND "due_date" IS NOT NULL
  AND ("due_date" AT TIME ZONE 'UTC')::date >= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date
  AND ("due_date" AT TIME ZONE 'UTC')::date <= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date + 7;

UPDATE "expenses"
SET "status_new" = 'DUE_NOW'::"ExpenseStatusEnum_new"
WHERE "status"::text IN ('THIS_MONTH', 'UNPAID')
  AND "due_date" IS NOT NULL
  AND ("due_date" AT TIME ZONE 'UTC')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date;

ALTER TABLE "expenses" DROP COLUMN "status";
ALTER TABLE "expenses" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "expenses" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "expenses" ALTER COLUMN "status" SET DEFAULT 'PLANNED';

DROP TYPE "ExpenseStatusEnum";
ALTER TYPE "ExpenseStatusEnum_new" RENAME TO "ExpenseStatusEnum";
