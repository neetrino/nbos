-- AI Platform Phase 1: External Agent identity, credentials, capability grants, resource scopes.
--
-- Additive only. No existing table is modified and no data is deleted. Machine
-- principals live in these tables and are never written into employee-only
-- access tables such as "resource_access_grants".
--
-- Indexes are created here, transactionally, with plain CREATE INDEX. An
-- earlier revision split them into a CREATE INDEX CONCURRENTLY migration; that
-- buys nothing on tables that are created empty in the same deployment, and it
-- gave up atomicity — a mid-batch failure would leave a failed migration and
-- possibly an INVALID index with no automatic recovery. Revisit only if these
-- tables ever need new indexes while populated.

-- CreateEnum
CREATE TYPE "ExternalAgentStatusEnum" AS ENUM ('ACTIVE', 'DISABLED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AgentScopeTypeEnum" AS ENUM ('ORGANIZATION', 'PROJECT', 'PRODUCT', 'WORKSPACE', 'RESOURCE');

-- CreateTable
CREATE TABLE "external_agents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ExternalAgentStatusEnum" NOT NULL DEFAULT 'ACTIVE',
    "owner_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3),
    "disabled_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),
    "last_used_ip" TEXT,
    "last_used_channel" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_agent_credentials" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "key_id" TEXT NOT NULL,
    "token_prefix" TEXT NOT NULL,
    "secret_hash" TEXT NOT NULL,
    "label" TEXT,
    "created_by_id" TEXT NOT NULL,
    "rotated_from_id" TEXT,
    "expires_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "revoked_by_id" TEXT,
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_agent_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_agent_capability_grants" (
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

    CONSTRAINT "external_agent_capability_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
-- "resource_type" is NOT NULL DEFAULT '' rather than nullable: RESOURCE scopes
-- are identified by (scope_id, resource_type), and a NULL would let FILE:123
-- upsert over an existing TASK:123 scope through the uniqueness key below.
CREATE TABLE "external_agent_resource_scopes" (
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

    CONSTRAINT "external_agent_resource_scopes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "external_agent_credentials_key_id_key" ON "external_agent_credentials"("key_id");

-- CreateIndex
CREATE UNIQUE INDEX "external_agent_credentials_rotated_from_id_key" ON "external_agent_credentials"("rotated_from_id");

-- CreateIndex
CREATE UNIQUE INDEX "external_agent_capability_grants_agent_id_capability_key_key" ON "external_agent_capability_grants"("agent_id", "capability_key");

-- CreateIndex
CREATE UNIQUE INDEX "external_agent_resource_scopes_agent_scope_resource_key" ON "external_agent_resource_scopes"("agent_id", "scope_type", "scope_id", "resource_type");

-- CreateIndex
CREATE INDEX "external_agents_status_idx" ON "external_agents"("status");

-- CreateIndex
CREATE INDEX "external_agents_owner_id_idx" ON "external_agents"("owner_id");

-- CreateIndex
CREATE INDEX "external_agent_credentials_agent_id_idx" ON "external_agent_credentials"("agent_id");

-- CreateIndex
CREATE INDEX "external_agent_credentials_expires_at_idx" ON "external_agent_credentials"("expires_at");

-- CreateIndex
-- Employee foreign-key columns are indexed so offboarding an employee does not
-- scan the agent tables. agent_id needs no separate index on the grant and
-- scope tables: it leads their uniqueness keys.
CREATE INDEX "external_agents_created_by_id_idx" ON "external_agents"("created_by_id");

-- CreateIndex
CREATE INDEX "external_agent_credentials_created_by_id_idx" ON "external_agent_credentials"("created_by_id");

-- CreateIndex
CREATE INDEX "external_agent_credentials_revoked_by_id_idx" ON "external_agent_credentials"("revoked_by_id");

-- CreateIndex
CREATE INDEX "external_agent_capability_grants_granted_by_id_idx" ON "external_agent_capability_grants"("granted_by_id");

-- CreateIndex
CREATE INDEX "external_agent_capability_grants_revoked_by_id_idx" ON "external_agent_capability_grants"("revoked_by_id");

-- CreateIndex
CREATE INDEX "external_agent_resource_scopes_granted_by_id_idx" ON "external_agent_resource_scopes"("granted_by_id");

-- CreateIndex
CREATE INDEX "external_agent_resource_scopes_revoked_by_id_idx" ON "external_agent_resource_scopes"("revoked_by_id");

-- AddForeignKey
ALTER TABLE "external_agents" ADD CONSTRAINT "external_agents_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_agents" ADD CONSTRAINT "external_agents_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_agent_credentials" ADD CONSTRAINT "external_agent_credentials_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "external_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_agent_credentials" ADD CONSTRAINT "external_agent_credentials_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_agent_credentials" ADD CONSTRAINT "external_agent_credentials_revoked_by_id_fkey" FOREIGN KEY ("revoked_by_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_agent_credentials" ADD CONSTRAINT "external_agent_credentials_rotated_from_id_fkey" FOREIGN KEY ("rotated_from_id") REFERENCES "external_agent_credentials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_agent_capability_grants" ADD CONSTRAINT "external_agent_capability_grants_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "external_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_agent_capability_grants" ADD CONSTRAINT "external_agent_capability_grants_granted_by_id_fkey" FOREIGN KEY ("granted_by_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_agent_capability_grants" ADD CONSTRAINT "external_agent_capability_grants_revoked_by_id_fkey" FOREIGN KEY ("revoked_by_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_agent_resource_scopes" ADD CONSTRAINT "external_agent_resource_scopes_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "external_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_agent_resource_scopes" ADD CONSTRAINT "external_agent_resource_scopes_granted_by_id_fkey" FOREIGN KEY ("granted_by_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_agent_resource_scopes" ADD CONSTRAINT "external_agent_resource_scopes_revoked_by_id_fkey" FOREIGN KEY ("revoked_by_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
