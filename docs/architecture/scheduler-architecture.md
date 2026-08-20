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

**Code catalog** is the source of “which jobs exist” and default cron (`apps/api/.../scheduler-job-catalog.ts`). Settings → Scheduler lists them with runtime snapshot (`SchedulerJobRuntime`) and admin policy (`SchedulerJobPolicy`: enable/disable, Run now). Cron schedule changes only in code/deploy. Product canon: [`docs/NBOS/02-Modules/16-Settings-Admin/05-Scheduler-Catalog.md`](../NBOS/02-Modules/16-Settings-Admin/05-Scheduler-Catalog.md).

Nest registers all `platform_cron` jobs on `nbos-scheduler`. Each tick requires `SCHEDULER_ENABLED` (kill switch) **and** `SchedulerJobPolicy.enabled`. Per-job env `*_ENABLED` seeds policy once, then is not the source of truth.

## Rollout

See `docs/deploy.md` §4.2c, `docs/architecture/scheduler-inventory.md`, and the roster.

## InboxState READ

`NOTIFICATION_INBOX_STATE_READ_ENABLED` remains **false** in this phase.
