-- Phase 6.12 — controlled EXPLAIN for top queries
-- Run ONLY on local/staging (or production manually with care).
-- Do NOT automate against production.

-- 1) Legacy unread COUNT
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT COUNT(*)::int
FROM in_app_notifications
WHERE recipient_employee_id = '00000000-0000-0000-0000-000000000001'
  AND is_read = false
  AND archived_at IS NULL;

-- 2) Notification cursor page (newest first)
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT id, created_at
FROM in_app_notifications
WHERE recipient_employee_id = '00000000-0000-0000-0000-000000000001'
  AND archived_at IS NULL
ORDER BY created_at DESC, id DESC
LIMIT 21;

-- 3) InboxState lookup
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT unread_count, version
FROM notification_inbox_state
WHERE employee_id = '00000000-0000-0000-0000-000000000001';

-- 4) Scheduler lease row
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT job_name, owner_id, lease_until, fencing_token
FROM scheduler_leases
WHERE job_name = 'notification-inbox-reconcile';

-- 5) PENDING notification deliveries
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT id, job_id, channel, recipient
FROM notification_deliveries
WHERE status = 'PENDING'
ORDER BY created_at ASC
LIMIT 100;

-- Replace sample UUIDs with real staging IDs before running.
