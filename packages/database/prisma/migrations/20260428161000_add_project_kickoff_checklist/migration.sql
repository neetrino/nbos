CREATE TABLE "project_kickoff_checklist_items" (
  "id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "is_required" BOOLEAN NOT NULL DEFAULT true,
  "is_checked" BOOLEAN NOT NULL DEFAULT false,
  "note" TEXT,
  "checked_at" TIMESTAMP(3),
  "checked_by_id" TEXT,
  "sort_order" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "project_kickoff_checklist_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "project_kickoff_checklist_items_project_id_key_key"
ON "project_kickoff_checklist_items"("project_id", "key");

CREATE INDEX "project_kickoff_checklist_items_project_id_idx"
ON "project_kickoff_checklist_items"("project_id");

ALTER TABLE "project_kickoff_checklist_items"
ADD CONSTRAINT "project_kickoff_checklist_items_project_id_fkey"
FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
