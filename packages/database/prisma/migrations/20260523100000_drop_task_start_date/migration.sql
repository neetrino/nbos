-- Task uses created_at (automatic) and due_date (deadline) only; start_date is unused.
ALTER TABLE "tasks" DROP COLUMN IF EXISTS "start_date";
