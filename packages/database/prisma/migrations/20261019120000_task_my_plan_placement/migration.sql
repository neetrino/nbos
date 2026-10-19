-- Personal My Plan slot per employee. Task workflow status stays on tasks.
-- Expand-only: tasks.my_plan_stage_id and my_plan_sort_order remain until a later contract.

CREATE TABLE "task_my_plan_placements" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "stage_id" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_my_plan_placements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "task_my_plan_placements_task_id_employee_id_key"
  ON "task_my_plan_placements"("task_id", "employee_id");

CREATE INDEX "task_my_plan_placements_employee_id_stage_id_idx"
  ON "task_my_plan_placements"("employee_id", "stage_id");

ALTER TABLE "task_my_plan_placements"
  ADD CONSTRAINT "task_my_plan_placements_task_id_fkey"
  FOREIGN KEY ("task_id") REFERENCES "tasks"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "task_my_plan_placements"
  ADD CONSTRAINT "task_my_plan_placements_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "employees"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "task_my_plan_placements"
  ADD CONSTRAINT "task_my_plan_placements_stage_id_fkey"
  FOREIGN KEY ("stage_id") REFERENCES "task_board_stages"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "task_my_plan_placements" ("id", "task_id", "employee_id", "stage_id", "sort_order")
SELECT
    gen_random_uuid()::text,
    t.id,
    s.owner_id,
    t.my_plan_stage_id,
    t.my_plan_sort_order
FROM "tasks" t
INNER JOIN "task_board_stages" s ON s.id = t.my_plan_stage_id
WHERE t.my_plan_stage_id IS NOT NULL
  AND s.board_type = 'MY_PLAN'
  AND s.owner_id IS NOT NULL
  AND s.owner_id <> '';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "task_my_plan_placements" TO app_user;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'readonly_user') THEN
    GRANT SELECT ON "task_my_plan_placements" TO readonly_user;
  END IF;
END $$;
