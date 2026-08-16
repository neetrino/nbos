# ADR — NotificationInboxState dual-write

**Status:** Accepted for Release 2B (WRITE optional; READ off by default)  
**Date:** 2026-07-27

## Decision

Introduce `notification_inbox_state` with `unread_count` + monotonic `version`.  
Mutations dual-write when `NOTIFICATION_INBOX_STATE_WRITE_ENABLED=true`.  
Unread HTTP read remains `COUNT(*)` until `NOTIFICATION_INBOX_STATE_READ_ENABLED=true` after reconcile proves zero drift.

## Deploy order

1. `pnpm db:migrate` (or Coolify migrate job) — creates table + set-based backfill
2. Deploy API with flags **off**
3. Set `WRITE=true`
4. `POST /api/scheduler/notification-inbox-reconcile` with `RECONCILE=true`
5. Verify drift=0 on staging
6. Separate release: `READ=true`

## Rollback

```env
NOTIFICATION_INBOX_STATE_READ_ENABLED=false
# optional:
NOTIFICATION_INBOX_STATE_WRITE_ENABLED=false
```

Do not drop the table on routine rollback.
