# Scheduler architecture (Phase 4)

## Processes

| Service          | Role                     | Responsibility                                                            |
| ---------------- | ------------------------ | ------------------------------------------------------------------------- |
| `nbos-api`       | `PROCESS_ROLE=api`       | HTTP, SSE, Socket.IO, queue producers, manual `/api/scheduler/*` (leased) |
| `nbos-worker`    | `PROCESS_ROLE=worker`    | BullMQ consumers                                                          |
| `nbos-scheduler` | `PROCESS_ROLE=scheduler` | Nest CronJobs + lease + run history                                       |

## Lease algorithm

Atomic PostgreSQL upsert on `scheduler_leases`:

```sql
INSERT ... ON CONFLICT (job_name) DO UPDATE
SET owner_id, lease_until, heartbeat_at, fencing_token = fencing_token + 1
WHERE lease_until < NOW()
RETURNING ...
```

- New ownership always increments `fencing_token`.
- Heartbeat / release require matching `owner_id` + `fencing_token`.
- Lost heartbeat aborts the handler (`AbortController`) and marks run `TIMED_OUT`.

## Defaults

```env
SCHEDULER_ENABLED=false
SCHEDULER_LEASE_TTL_MS=120000
SCHEDULER_HEARTBEAT_INTERVAL_MS=30000
```

`heartbeat < leaseTTL / 2` validated at scheduler startup.

Automatic work runs as Nest CronJobs on `nbos-scheduler` (`SCHEDULER_ENABLED` + one per-job flag). HTTP `/api/scheduler/*` is leftover for rare manual/repair calls (`sales-kpi-backfill-all` has no cron). Do not add Coolify/external cron.

Living on/off roster (icons + decisions): [`scheduler-cron-roster.md`](./scheduler-cron-roster.md).

## Rollout

See `docs/deploy.md` §4.2c, `docs/architecture/scheduler-inventory.md`, and the roster.

## InboxState READ

`NOTIFICATION_INBOX_STATE_READ_ENABLED` remains **false** in this phase.
