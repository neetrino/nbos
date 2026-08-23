-- AI Platform Phase 1 Chat 10: Approval Request persistence.
-- Customer-facing modes/isolation stay contract-only (no Messenger auto-send).
--
-- Additive: new enum + empty table. No backfill, no existing-table rewrite.
-- Indexes are transactional CREATE INDEX: the table is empty.

CREATE TYPE "AiApprovalRequestStatusEnum" AS ENUM (
  'PENDING',
  'APPROVED',
  'REJECTED',
  'EXPIRED',
  'CANCELLED',
  'CONSUMED'
);

CREATE TABLE "ai_approval_requests" (
    "id" TEXT NOT NULL,
    "requester_actor_type" TEXT NOT NULL,
    "requester_actor_id" TEXT NOT NULL,
    "on_behalf_of_actor_type" TEXT,
    "on_behalf_of_actor_id" TEXT,
    "capability_key" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "scope_type" TEXT,
    "scope_id" TEXT,
    "payload_digest" TEXT NOT NULL,
    "safe_payload_summary" TEXT NOT NULL,
    "risk_class" TEXT NOT NULL,
    "status" "AiApprovalRequestStatusEnum" NOT NULL DEFAULT 'PENDING',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "decided_by_employee_id" TEXT,
    "decided_at" TIMESTAMP(3),
    "decision_reason" TEXT,
    "consumed_at" TIMESTAMP(3),
    "correlation_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_approval_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_approval_requests_status_requested_at_idx"
  ON "ai_approval_requests"("status", "requested_at");
CREATE INDEX "ai_approval_requests_requester_actor_type_requester_actor_id_idx"
  ON "ai_approval_requests"("requester_actor_type", "requester_actor_id");
CREATE INDEX "ai_approval_requests_capability_key_resource_id_idx"
  ON "ai_approval_requests"("capability_key", "resource_id");
CREATE INDEX "ai_approval_requests_expires_at_idx"
  ON "ai_approval_requests"("expires_at");
CREATE INDEX "ai_approval_requests_decided_by_employee_id_idx"
  ON "ai_approval_requests"("decided_by_employee_id");
CREATE INDEX "ai_approval_requests_correlation_id_idx"
  ON "ai_approval_requests"("correlation_id");

ALTER TABLE "ai_approval_requests"
  ADD CONSTRAINT "ai_approval_requests_decided_by_employee_id_fkey"
  FOREIGN KEY ("decided_by_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
