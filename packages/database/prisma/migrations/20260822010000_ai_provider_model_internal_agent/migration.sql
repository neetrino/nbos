-- AI Platform Phase 1 Chat 5: provider connections, encrypted secrets,
-- model catalog, Model Policy and Internal Agent foundation.
--
-- Additive only. No existing table is modified and no data is deleted.
-- Provider API keys live in ai_provider_secrets and are never written into
-- audit changes or agent-reachable capability payloads.
--
-- Indexes are transactional CREATE INDEX: the new tables are empty, so
-- CONCURRENTLY would only give up atomicity.

-- CreateEnum
CREATE TYPE "AiProviderTypeEnum" AS ENUM ('OPENAI', 'ANTHROPIC');

-- CreateEnum
CREATE TYPE "AiProviderConnectionStatusEnum" AS ENUM ('ACTIVE', 'DISABLED', 'REVOKED');

-- CreateEnum
CREATE TYPE "AiModelStatusEnum" AS ENUM ('DISCOVERED', 'ACTIVE', 'DISABLED', 'DEPRECATED', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "AiModelPolicyModeEnum" AS ENUM ('FIXED', 'PRIMARY_FALLBACK', 'TIERED', 'ADAPTIVE');

-- CreateEnum
CREATE TYPE "AiModelPolicyStatusEnum" AS ENUM ('DRAFT', 'ACTIVE', 'DISABLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AiModelPolicyCandidateRoleEnum" AS ENUM ('PRIMARY', 'FALLBACK', 'TIER_FAST', 'TIER_STANDARD', 'TIER_DEEP');

-- CreateEnum
CREATE TYPE "InternalAiAgentStatusEnum" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'DISABLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "InternalAiAgentSurfaceEnum" AS ENUM ('EMPLOYEE_CHAT', 'MESSENGER', 'TASK', 'DOCUMENT', 'SCHEDULED', 'SYSTEM_EVENT', 'ADMIN_TEST');

-- CreateTable
CREATE TABLE "ai_provider_connections" (
    "id" TEXT NOT NULL,
    "provider" "AiProviderTypeEnum" NOT NULL,
    "name" TEXT NOT NULL,
    "status" "AiProviderConnectionStatusEnum" NOT NULL DEFAULT 'ACTIVE',
    "key_prefix" TEXT NOT NULL,
    "provider_organization_id" TEXT,
    "provider_project_id" TEXT,
    "base_url" TEXT,
    "last_validated_at" TIMESTAMP(3),
    "last_model_sync_at" TIMESTAMP(3),
    "created_by_id" TEXT NOT NULL,
    "disabled_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_provider_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_provider_secrets" (
    "id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "encrypted_api_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_provider_secrets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_models" (
    "id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "provider" "AiProviderTypeEnum" NOT NULL,
    "provider_model_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "status" "AiModelStatusEnum" NOT NULL DEFAULT 'DISCOVERED',
    "discovered_at" TIMESTAMP(3) NOT NULL,
    "last_seen_at" TIMESTAMP(3) NOT NULL,
    "provider_metadata" JSONB NOT NULL,
    "suitability_tags" TEXT[],
    "notes" TEXT,
    "alias_of" TEXT,
    "snapshot_id" TEXT,
    "activated_at" TIMESTAMP(3),
    "activated_by_id" TEXT,
    "disabled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_model_policies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purpose" TEXT,
    "mode" "AiModelPolicyModeEnum" NOT NULL,
    "status" "AiModelPolicyStatusEnum" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_model_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_model_policy_candidates" (
    "id" TEXT NOT NULL,
    "policy_id" TEXT NOT NULL,
    "model_id" TEXT NOT NULL,
    "role" "AiModelPolicyCandidateRoleEnum" NOT NULL,
    "priority" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "constraints" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_model_policy_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal_ai_agents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "InternalAiAgentStatusEnum" NOT NULL DEFAULT 'DRAFT',
    "owner_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "model_policy_id" TEXT,
    "prompt_policy_id" TEXT,
    "approval_policy_id" TEXT,
    "environment" TEXT,
    "activated_at" TIMESTAMP(3),
    "paused_at" TIMESTAMP(3),
    "disabled_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "internal_ai_agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal_ai_agent_surfaces" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "surface" "InternalAiAgentSurfaceEnum" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "internal_ai_agent_surfaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal_ai_agent_capability_grants" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "capability_key" TEXT NOT NULL,
    "granted_by_id" TEXT NOT NULL,
    "reason" TEXT,
    "expires_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "revoked_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "internal_ai_agent_capability_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal_ai_agent_resource_scopes" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "scope_type" "AgentScopeTypeEnum" NOT NULL,
    "scope_id" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL DEFAULT '',
    "granted_by_id" TEXT NOT NULL,
    "reason" TEXT,
    "expires_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "revoked_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "internal_ai_agent_resource_scopes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_provider_connections_provider_idx" ON "ai_provider_connections"("provider");
CREATE INDEX "ai_provider_connections_status_idx" ON "ai_provider_connections"("status");
CREATE INDEX "ai_provider_connections_created_by_id_idx" ON "ai_provider_connections"("created_by_id");
CREATE UNIQUE INDEX "ai_provider_secrets_connection_id_key" ON "ai_provider_secrets"("connection_id");
CREATE INDEX "ai_models_provider_status_idx" ON "ai_models"("provider", "status");
CREATE INDEX "ai_models_status_idx" ON "ai_models"("status");
CREATE INDEX "ai_models_activated_by_id_idx" ON "ai_models"("activated_by_id");
CREATE UNIQUE INDEX "ai_models_connection_id_provider_model_id_key" ON "ai_models"("connection_id", "provider_model_id");
CREATE INDEX "ai_model_policies_status_idx" ON "ai_model_policies"("status");
CREATE INDEX "ai_model_policies_created_by_id_idx" ON "ai_model_policies"("created_by_id");
CREATE INDEX "ai_model_policy_candidates_model_id_idx" ON "ai_model_policy_candidates"("model_id");
CREATE UNIQUE INDEX "ai_model_policy_candidates_policy_id_model_id_key" ON "ai_model_policy_candidates"("policy_id", "model_id");
CREATE UNIQUE INDEX "ai_model_policy_candidates_policy_id_priority_key" ON "ai_model_policy_candidates"("policy_id", "priority");
CREATE INDEX "internal_ai_agents_status_idx" ON "internal_ai_agents"("status");
CREATE INDEX "internal_ai_agents_owner_id_idx" ON "internal_ai_agents"("owner_id");
CREATE INDEX "internal_ai_agents_created_by_id_idx" ON "internal_ai_agents"("created_by_id");
CREATE INDEX "internal_ai_agents_model_policy_id_idx" ON "internal_ai_agents"("model_policy_id");
CREATE UNIQUE INDEX "internal_ai_agent_surfaces_agent_id_surface_key" ON "internal_ai_agent_surfaces"("agent_id", "surface");
CREATE INDEX "internal_ai_agent_capability_grants_granted_by_id_idx" ON "internal_ai_agent_capability_grants"("granted_by_id");
CREATE INDEX "internal_ai_agent_capability_grants_revoked_by_id_idx" ON "internal_ai_agent_capability_grants"("revoked_by_id");
CREATE UNIQUE INDEX "internal_ai_agent_capability_grants_agent_id_capability_key_key" ON "internal_ai_agent_capability_grants"("agent_id", "capability_key");
CREATE INDEX "internal_ai_agent_resource_scopes_granted_by_id_idx" ON "internal_ai_agent_resource_scopes"("granted_by_id");
CREATE INDEX "internal_ai_agent_resource_scopes_revoked_by_id_idx" ON "internal_ai_agent_resource_scopes"("revoked_by_id");
CREATE UNIQUE INDEX "internal_ai_agent_resource_scopes_agent_scope_resource_key" ON "internal_ai_agent_resource_scopes"("agent_id", "scope_type", "scope_id", "resource_type");

ALTER TABLE "ai_provider_connections" ADD CONSTRAINT "ai_provider_connections_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ai_provider_secrets" ADD CONSTRAINT "ai_provider_secrets_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "ai_provider_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_models" ADD CONSTRAINT "ai_models_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "ai_provider_connections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ai_models" ADD CONSTRAINT "ai_models_activated_by_id_fkey" FOREIGN KEY ("activated_by_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_model_policies" ADD CONSTRAINT "ai_model_policies_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ai_model_policy_candidates" ADD CONSTRAINT "ai_model_policy_candidates_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "ai_model_policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_model_policy_candidates" ADD CONSTRAINT "ai_model_policy_candidates_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "ai_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "internal_ai_agents" ADD CONSTRAINT "internal_ai_agents_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "internal_ai_agents" ADD CONSTRAINT "internal_ai_agents_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "internal_ai_agents" ADD CONSTRAINT "internal_ai_agents_model_policy_id_fkey" FOREIGN KEY ("model_policy_id") REFERENCES "ai_model_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "internal_ai_agent_surfaces" ADD CONSTRAINT "internal_ai_agent_surfaces_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "internal_ai_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "internal_ai_agent_capability_grants" ADD CONSTRAINT "internal_ai_agent_capability_grants_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "internal_ai_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "internal_ai_agent_capability_grants" ADD CONSTRAINT "internal_ai_agent_capability_grants_granted_by_id_fkey" FOREIGN KEY ("granted_by_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "internal_ai_agent_capability_grants" ADD CONSTRAINT "internal_ai_agent_capability_grants_revoked_by_id_fkey" FOREIGN KEY ("revoked_by_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "internal_ai_agent_resource_scopes" ADD CONSTRAINT "internal_ai_agent_resource_scopes_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "internal_ai_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "internal_ai_agent_resource_scopes" ADD CONSTRAINT "internal_ai_agent_resource_scopes_granted_by_id_fkey" FOREIGN KEY ("granted_by_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "internal_ai_agent_resource_scopes" ADD CONSTRAINT "internal_ai_agent_resource_scopes_revoked_by_id_fkey" FOREIGN KEY ("revoked_by_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
