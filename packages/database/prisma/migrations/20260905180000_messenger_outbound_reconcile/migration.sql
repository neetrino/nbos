-- Phase 4B additive MessengerCommand scheduling/claim columns (LOW risk).
-- Expand-only: nullable columns + one composite index. No backfill, no DROP.
-- Rolling deploy: old writers ignore the new columns (NULL). New writers set
-- next_reconcile_at for UNKNOWN/PENDING claim clocks and first_attempt_at
-- once, immediately before the first Gateway HTTP call.
-- completed_at remains the terminal COMPLETED/FAILED timestamp and is not
-- used as a reconcile bump or window start.
-- Application rollback may leave unused NULL columns (forward-fix; do not DROP).

ALTER TABLE "messenger_commands"
  ADD COLUMN IF NOT EXISTS "next_reconcile_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "first_attempt_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "invalid_reason" TEXT;

CREATE INDEX IF NOT EXISTS "messenger_commands_kind_status_reconcile_idx"
  ON "messenger_commands" ("kind", "status", "next_reconcile_at");
