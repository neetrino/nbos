-- Speed up GET /tasks?involvesEmployeeId=… (assignee / creator filters and workspace joins).
CREATE INDEX IF NOT EXISTS "tasks_assignee_id_idx" ON "tasks"("assignee_id");
CREATE INDEX IF NOT EXISTS "tasks_creator_id_idx" ON "tasks"("creator_id");
