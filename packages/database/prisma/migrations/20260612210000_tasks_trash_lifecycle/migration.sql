-- Tasks Profile O1: recoverable trash via trashed_at (hybrid DELETE: draft hard-delete, else soft-trash)

ALTER TABLE "tasks" ADD COLUMN "trashed_at" TIMESTAMP(3);

CREATE INDEX "tasks_trashed_at_idx" ON "tasks"("trashed_at");
