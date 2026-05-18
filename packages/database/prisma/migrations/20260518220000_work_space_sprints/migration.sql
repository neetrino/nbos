-- First-class Sprint entity for scrum-enabled Work Spaces.

CREATE TYPE "SprintStatusEnum" AS ENUM ('PLANNING', 'ACTIVE', 'CLOSED');

CREATE TABLE "sprints" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "goal" TEXT,
  "status" "SprintStatusEnum" NOT NULL DEFAULT 'PLANNING',
  "start_date" TIMESTAMP(3),
  "end_date" TIMESTAMP(3),
  "closed_at" TIMESTAMP(3),
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "sprints_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "sprints"
  ADD CONSTRAINT "sprints_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "work_spaces"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "sprints_workspace_id_status_idx" ON "sprints"("workspace_id", "status");
CREATE INDEX "sprints_workspace_id_sort_order_idx" ON "sprints"("workspace_id", "sort_order");

ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "sprint_id" TEXT;

ALTER TABLE "tasks"
  ADD CONSTRAINT "tasks_sprint_id_fkey"
  FOREIGN KEY ("sprint_id") REFERENCES "sprints"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "tasks_sprint_id_idx" ON "tasks"("sprint_id");

-- Backfill sprints for scrum-enabled workspaces from legacy planning_status buckets.
DO $$
DECLARE
  ws RECORD;
  active_sprint_id TEXT;
  planning_sprint_id TEXT;
BEGIN
  FOR ws IN
    SELECT id FROM work_spaces WHERE scrum_enabled = true
  LOOP
    IF EXISTS (
      SELECT 1 FROM tasks
      WHERE workspace_id = ws.id AND planning_status = 'ACTIVE_SPRINT'
    ) THEN
      active_sprint_id := gen_random_uuid()::text;
      INSERT INTO sprints (id, workspace_id, name, status, sort_order, updated_at)
      VALUES (active_sprint_id, ws.id, 'Active sprint (migrated)', 'ACTIVE', 0, CURRENT_TIMESTAMP);

      UPDATE tasks
      SET sprint_id = active_sprint_id
      WHERE workspace_id = ws.id AND planning_status = 'ACTIVE_SPRINT';
    END IF;

    IF EXISTS (
      SELECT 1 FROM tasks
      WHERE workspace_id = ws.id AND planning_status = 'FUTURE_SPRINT'
    ) THEN
      planning_sprint_id := gen_random_uuid()::text;
      INSERT INTO sprints (id, workspace_id, name, status, sort_order, updated_at)
      VALUES (
        planning_sprint_id,
        ws.id,
        'Planning sprint (migrated)',
        'PLANNING',
        1,
        CURRENT_TIMESTAMP
      );

      UPDATE tasks
      SET sprint_id = planning_sprint_id
      WHERE workspace_id = ws.id AND planning_status = 'FUTURE_SPRINT';
    END IF;

    UPDATE tasks
    SET sprint_id = NULL
    WHERE workspace_id = ws.id
      AND planning_status IN ('BACKLOG', 'UNPLANNED')
      AND sprint_id IS NOT NULL;
  END LOOP;
END $$;
