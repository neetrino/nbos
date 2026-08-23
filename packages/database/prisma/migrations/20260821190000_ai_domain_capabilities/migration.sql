-- AI Platform Phase 1 Chat 3: Tasks discussion, actor provenance on Task,
-- External Agent idempotency records.
--
-- Additive only. No existing column is dropped or renamed. Historical Task
-- rows keep created_by_actor_* NULL (human Employee creatorId remains the
-- accountable FK). Discussion is Tasks-owned; Messenger is not involved.
--
-- Indexes are transactional CREATE INDEX: the new tables are empty, so
-- CONCURRENTLY would only give up atomicity.

-- CreateEnum
CREATE TYPE "TaskDiscussionVisibilityEnum" AS ENUM ('STANDARD', 'HIDDEN');

-- CreateEnum
CREATE TYPE "AgentIdempotencyStatusEnum" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- AlterTable
ALTER TABLE "tasks"
  ADD COLUMN "created_by_actor_type" TEXT,
  ADD COLUMN "created_by_actor_id" TEXT;

-- CreateTable
CREATE TABLE "task_discussion_entries" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "actor_type" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "actor_display_name" TEXT NOT NULL,
    "channel_source" TEXT,
    "correlation_id" TEXT,
    "visibility" "TaskDiscussionVisibilityEnum" NOT NULL DEFAULT 'STANDARD',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_discussion_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_agent_idempotency_records" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "capability_key" TEXT NOT NULL,
    "operation_key" TEXT NOT NULL,
    "request_fingerprint" TEXT NOT NULL,
    "status" "AgentIdempotencyStatusEnum" NOT NULL,
    "response_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_agent_idempotency_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "task_discussion_entries_task_id_created_at_idx" ON "task_discussion_entries"("task_id", "created_at");

-- CreateIndex
CREATE INDEX "task_discussion_entries_actor_type_actor_id_idx" ON "task_discussion_entries"("actor_type", "actor_id");

-- CreateIndex
CREATE UNIQUE INDEX "external_agent_idempotency_agent_cap_op_key" ON "external_agent_idempotency_records"("agent_id", "capability_key", "operation_key");

-- CreateIndex
CREATE INDEX "external_agent_idempotency_records_expires_at_idx" ON "external_agent_idempotency_records"("expires_at");

-- AddForeignKey
ALTER TABLE "task_discussion_entries" ADD CONSTRAINT "task_discussion_entries_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_agent_idempotency_records" ADD CONSTRAINT "external_agent_idempotency_records_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "external_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
