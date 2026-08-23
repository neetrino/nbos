-- AI Platform Phase 1 Chat 9: Prompt Policy / Prompt Version foundation.
-- Context, session, memory and knowledge stay contract-only (no tables).
--
-- Additive tables plus a nullable FK on internal_ai_agents.prompt_policy_id.
-- Invalid Chat 8 free-form prompt_policy_id values are cleared before the FK
-- so existing Internal Agent rows remain loadable.
--
-- Indexes are transactional CREATE INDEX: the new tables are empty.

-- CreateEnum
CREATE TYPE "AiPromptPolicyStatusEnum" AS ENUM ('DRAFT', 'ACTIVE', 'DISABLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AiPromptVersionStatusEnum" AS ENUM ('DRAFT', 'TESTING', 'PUBLISHED', 'RETIRED');

-- CreateTable
CREATE TABLE "ai_prompt_policies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purpose" TEXT,
    "status" "AiPromptPolicyStatusEnum" NOT NULL DEFAULT 'DRAFT',
    "owner_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_prompt_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_prompt_versions" (
    "id" TEXT NOT NULL,
    "policy_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "AiPromptVersionStatusEnum" NOT NULL DEFAULT 'DRAFT',
    "platform_safety" TEXT NOT NULL,
    "agent_role" TEXT NOT NULL,
    "domain_rules" TEXT,
    "channel_behavior" TEXT,
    "content_digest" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "published_at" TIMESTAMP(3),
    "published_by_id" TEXT,
    "retired_at" TIMESTAMP(3),
    "predecessor_version_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_prompt_versions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_prompt_policies_status_idx" ON "ai_prompt_policies"("status");
CREATE INDEX "ai_prompt_policies_owner_id_idx" ON "ai_prompt_policies"("owner_id");
CREATE INDEX "ai_prompt_policies_created_by_id_idx" ON "ai_prompt_policies"("created_by_id");
CREATE UNIQUE INDEX "ai_prompt_versions_policy_id_version_key" ON "ai_prompt_versions"("policy_id", "version");
CREATE INDEX "ai_prompt_versions_policy_id_status_idx" ON "ai_prompt_versions"("policy_id", "status");
CREATE INDEX "ai_prompt_versions_created_by_id_idx" ON "ai_prompt_versions"("created_by_id");
CREATE INDEX "ai_prompt_versions_published_by_id_idx" ON "ai_prompt_versions"("published_by_id");
CREATE INDEX "ai_prompt_versions_predecessor_version_id_idx" ON "ai_prompt_versions"("predecessor_version_id");
CREATE UNIQUE INDEX "ai_prompt_versions_one_published_per_policy"
  ON "ai_prompt_versions"("policy_id")
  WHERE "status" = 'PUBLISHED';

ALTER TABLE "ai_prompt_policies"
  ADD CONSTRAINT "ai_prompt_policies_owner_id_fkey"
  FOREIGN KEY ("owner_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ai_prompt_policies"
  ADD CONSTRAINT "ai_prompt_policies_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ai_prompt_versions"
  ADD CONSTRAINT "ai_prompt_versions_policy_id_fkey"
  FOREIGN KEY ("policy_id") REFERENCES "ai_prompt_policies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ai_prompt_versions"
  ADD CONSTRAINT "ai_prompt_versions_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ai_prompt_versions"
  ADD CONSTRAINT "ai_prompt_versions_published_by_id_fkey"
  FOREIGN KEY ("published_by_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_prompt_versions"
  ADD CONSTRAINT "ai_prompt_versions_predecessor_version_id_fkey"
  FOREIGN KEY ("predecessor_version_id") REFERENCES "ai_prompt_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Chat 8 stored opaque free-form ids. None can match the new empty table.
UPDATE "internal_ai_agents"
SET "prompt_policy_id" = NULL
WHERE "prompt_policy_id" IS NOT NULL
  AND "prompt_policy_id" NOT IN (SELECT "id" FROM "ai_prompt_policies");

CREATE INDEX "internal_ai_agents_prompt_policy_id_idx" ON "internal_ai_agents"("prompt_policy_id");

ALTER TABLE "internal_ai_agents"
  ADD CONSTRAINT "internal_ai_agents_prompt_policy_id_fkey"
  FOREIGN KEY ("prompt_policy_id") REFERENCES "ai_prompt_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
