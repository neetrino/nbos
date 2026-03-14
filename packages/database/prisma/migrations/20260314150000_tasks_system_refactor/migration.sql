-- ============================================================
-- Migration: Tasks System Refactor
-- Idempotent: uses IF NOT EXISTS / IF EXISTS where possible
-- ============================================================

-- ─── 1. NEW TABLES ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "task_links" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "task_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "task_links_task_id_entity_type_entity_id_key" ON "task_links"("task_id", "entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "task_links_entity_type_entity_id_idx" ON "task_links"("entity_type", "entity_id");

CREATE TABLE IF NOT EXISTS "task_checklists" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Checklist',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "task_checklists_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "task_checklist_items" (
    "id" TEXT NOT NULL,
    "checklist_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "task_checklist_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "task_board_stages" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT,
    "board_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "task_board_stages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "task_board_stages_owner_id_board_type_title_key" ON "task_board_stages"("owner_id", "board_type", "title");
CREATE INDEX IF NOT EXISTS "task_board_stages_owner_id_board_type_idx" ON "task_board_stages"("owner_id", "board_type");

CREATE TABLE IF NOT EXISTS "recurring_task_templates" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assignee_id" TEXT,
    "creator_id" TEXT NOT NULL,
    "priority" "TaskPriorityEnum" NOT NULL DEFAULT 'NORMAL',
    "frequency" TEXT NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "days_of_week" TEXT[],
    "day_of_month" INTEGER,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "due_date_offset" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_created_at" TIMESTAMP(3),
    "next_create_at" TIMESTAMP(3),
    "checklist_data" JSONB,
    "links_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "recurring_task_templates_pkey" PRIMARY KEY ("id")
);

-- ─── 2. ALTER TASKS TABLE ────────────────────────────────────

ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "parent_id" TEXT;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "start_date" TIMESTAMP(3);
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "completed_at" TIMESTAMP(3);
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "kanban_stage_id" TEXT;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "my_plan_stage_id" TEXT;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "my_plan_sort_order" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "chat_id" TEXT;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "is_recurring" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "template_task_id" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "tasks_chat_id_key" ON "tasks"("chat_id");

-- Update task statuses: BACKLOG -> NEW, TODO -> NEW, REVIEW -> IN_PROGRESS
ALTER TYPE "TaskStatusEnum" ADD VALUE IF NOT EXISTS 'NEW';
ALTER TYPE "TaskStatusEnum" ADD VALUE IF NOT EXISTS 'DEFERRED';

UPDATE "tasks" SET "status" = 'NEW' WHERE "status" = 'BACKLOG';
UPDATE "tasks" SET "status" = 'NEW' WHERE "status" = 'TODO';
UPDATE "tasks" SET "status" = 'IN_PROGRESS' WHERE "status" = 'REVIEW';

-- Drop old FK constraints from tasks (may already be gone)
ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "tasks_project_id_fkey";
ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "tasks_product_id_fkey";
ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "tasks_extension_id_fkey";

-- Drop old columns from tasks
ALTER TABLE "tasks" DROP COLUMN IF EXISTS "project_id";
ALTER TABLE "tasks" DROP COLUMN IF EXISTS "product_id";
ALTER TABLE "tasks" DROP COLUMN IF EXISTS "extension_id";
ALTER TABLE "tasks" DROP COLUMN IF EXISTS "sprint_id";
ALTER TABLE "tasks" DROP COLUMN IF EXISTS "has_chat";

-- Self-referencing FK for subtasks
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_parent_id_fkey') THEN
    ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parent_id_fkey"
      FOREIGN KEY ("parent_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- ─── 3. ALTER DEALS (before dropping enums) ──────────────────

-- Convert product_type from ProductTypeEnum to TEXT
ALTER TABLE "deals" ALTER COLUMN "product_type" TYPE TEXT USING "product_type"::TEXT;

-- Add new columns
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "pm_id" TEXT;
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "deadline" TIMESTAMP(3);

-- ─── 4. DROP PRODUCTS & EXTENSIONS ───────────────────────────

ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_product_id_fkey";
ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_extension_id_fkey";
DROP INDEX IF EXISTS "orders_product_id_key";
DROP INDEX IF EXISTS "orders_extension_id_key";
ALTER TABLE "orders" DROP COLUMN IF EXISTS "product_id";
ALTER TABLE "orders" DROP COLUMN IF EXISTS "extension_id";

ALTER TABLE "support_tickets" DROP CONSTRAINT IF EXISTS "support_tickets_product_id_fkey";
ALTER TABLE "support_tickets" DROP COLUMN IF EXISTS "product_id";

DROP TABLE IF EXISTS "extensions";
DROP TABLE IF EXISTS "products";

DROP TYPE IF EXISTS "ExtensionStatus";
DROP TYPE IF EXISTS "ExtensionSize";
DROP TYPE IF EXISTS "ProductStatusEnum";
DROP TYPE IF EXISTS "ProductTypeEnum";

-- ─── 5. FOREIGN KEYS FOR NEW TABLES ─────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_links_task_id_fkey') THEN
    ALTER TABLE "task_links" ADD CONSTRAINT "task_links_task_id_fkey"
      FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_checklists_task_id_fkey') THEN
    ALTER TABLE "task_checklists" ADD CONSTRAINT "task_checklists_task_id_fkey"
      FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_checklist_items_checklist_id_fkey') THEN
    ALTER TABLE "task_checklist_items" ADD CONSTRAINT "task_checklist_items_checklist_id_fkey"
      FOREIGN KEY ("checklist_id") REFERENCES "task_checklists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recurring_task_templates_creator_id_fkey') THEN
    ALTER TABLE "recurring_task_templates" ADD CONSTRAINT "recurring_task_templates_creator_id_fkey"
      FOREIGN KEY ("creator_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recurring_task_templates_assignee_id_fkey') THEN
    ALTER TABLE "recurring_task_templates" ADD CONSTRAINT "recurring_task_templates_assignee_id_fkey"
      FOREIGN KEY ("assignee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deals_pm_id_fkey') THEN
    ALTER TABLE "deals" ADD CONSTRAINT "deals_pm_id_fkey"
      FOREIGN KEY ("pm_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- ─── 6. CLEANUP ──────────────────────────────────────────────

DROP TABLE IF EXISTS _db_check;
