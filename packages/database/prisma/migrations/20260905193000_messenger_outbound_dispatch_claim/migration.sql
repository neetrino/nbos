-- Phase 4B additive MessengerCommand dispatch-lease columns (LOW risk).
-- Expand-only: nullable columns. No defaults, no backfill, no DROP, no rewrite.
-- Rolling deploy: old writers ignore the new columns (NULL = unclaimed).
-- New writers set dispatch_token + dispatch_claimed_at immediately before
-- Gateway HTTP and treat next_reconcile_at as the 60s claim-lease expiry
-- (same interval as UNKNOWN reconcile; Gateway HTTP timeout is 30s).
-- Application rollback may leave unused NULL columns (forward-fix; do not DROP).
-- Scheduler remains default-off and must not terminalize an active lease.

ALTER TABLE "messenger_commands"
  ADD COLUMN IF NOT EXISTS "dispatch_token" TEXT,
  ADD COLUMN IF NOT EXISTS "dispatch_claimed_at" TIMESTAMP(3);
