-- Board (global + workspace Kanban) uses Task.status only; remove legacy KANBAN stage rows.
DELETE FROM "task_board_stages" WHERE "board_type" = 'KANBAN';

-- Drop Task.kanban_stage_id (no FK to task_board_stages in schema).
ALTER TABLE "tasks" DROP COLUMN IF EXISTS "kanban_stage_id";
