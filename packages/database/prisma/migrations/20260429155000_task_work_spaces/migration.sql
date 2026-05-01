CREATE TYPE "WorkSpaceTypeEnum" AS ENUM (
  'PRODUCT_DELIVERY',
  'EXTENSION_DELIVERY',
  'STANDALONE_OPERATIONAL'
);

CREATE TYPE "TaskPlanningStatusEnum" AS ENUM (
  'UNPLANNED',
  'BACKLOG',
  'FUTURE_SPRINT',
  'ACTIVE_SPRINT'
);

CREATE TABLE "work_spaces" (
  "id" TEXT NOT NULL,
  "project_id" TEXT,
  "product_id" TEXT,
  "extension_id" TEXT,
  "name" TEXT NOT NULL,
  "type" "WorkSpaceTypeEnum" NOT NULL,
  "scrum_enabled" BOOLEAN NOT NULL DEFAULT false,
  "description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "work_spaces_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "tasks"
  ADD COLUMN "workspace_id" TEXT,
  ADD COLUMN "planning_status" "TaskPlanningStatusEnum" NOT NULL DEFAULT 'UNPLANNED',
  ADD COLUMN "workspace_sort_order" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX "work_spaces_product_id_key" ON "work_spaces"("product_id");
CREATE UNIQUE INDEX "work_spaces_extension_id_key" ON "work_spaces"("extension_id");
CREATE INDEX "work_spaces_project_id_idx" ON "work_spaces"("project_id");
CREATE INDEX "work_spaces_type_idx" ON "work_spaces"("type");
CREATE INDEX "tasks_workspace_id_idx" ON "tasks"("workspace_id");
CREATE INDEX "tasks_planning_status_idx" ON "tasks"("planning_status");

ALTER TABLE "work_spaces"
  ADD CONSTRAINT "work_spaces_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "projects"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "work_spaces"
  ADD CONSTRAINT "work_spaces_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "work_spaces"
  ADD CONSTRAINT "work_spaces_extension_id_fkey"
  FOREIGN KEY ("extension_id") REFERENCES "extensions"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "tasks"
  ADD CONSTRAINT "tasks_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "work_spaces"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
