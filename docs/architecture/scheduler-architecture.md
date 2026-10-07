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

## Queue and lease

Cron ticks do not execute the job inline. They persist a `SchedulerOccurrence` (`job_name`, `scheduled_for`) and enqueue `scheduler-executions` in Redis. The scheduler process consumes that queue with concurrency `SCHEDULER_MAX_CONCURRENT_RUNS` (default 2). A full lane leaves the firing `QUEUED`. It is not marked `SKIPPED_LOCKED`.

`SchedulerLease` still stops the same job from running on two processes. A lease collision returns `SKIPPED_LOCKED` for that attempt and delays the BullMQ job. The occurrence stays `QUEUED`.

If Redis is down, the occurrence stays `PENDING`. `SchedulerOccurrenceReconcileService` (scheduler process, every 60s, lease `scheduler-occurrence-reconcile`) enqueues it when Redis is back. A crash after the row is written is recovered the same way. A duplicate tick from another replica hits the unique `(job_name, scheduled_for)` key and the same BullMQ job id `scheduler:{jobName}:{scheduledFor}`.

Business cron timezone is `Asia/Yerevan` (`SCHEDULER_BUSINESS_TIMEZONE`), passed into `CronJob`. Occurrence slots are absolute instants, so the host `TZ` does not change the key.

Settings → Run now enqueues a manual occurrence. `POST /api/scheduler/*` remains a synchronous repair path under the lease.

## WhatsApp account

`resolveWhatsAppGatewayAccountId` returns `WhatsAppGatewayConnection.gatewayAccountId`. In production a missing value, or the literal `default`, throws `WhatsAppGatewayAccountNotConfiguredError`. Outside production the legacy `default` account remains for local and tests. `WHATSAPP_ALLOW_LEGACY_DEFAULT_ACCOUNT` does not enable `default` in production.

Legacy mappings (`messenger_external_conversation_mappings.external_account_id = default`) are not rewritten on startup. Audit them with:

```text
pnpm --filter @nbos/api exec tsx src/modules/messenger/core/legacy-whatsapp-default-account.cli.ts
pnpm --filter @nbos/api exec tsx src/modules/messenger/core/legacy-whatsapp-default-account.cli.ts --apply
```

The command is a dry-run unless `--apply` is passed. It moves only mappings whose target chat is not already owned by another conversation. It does not enqueue sends and does not touch `SENT` messages. A failed delivery is retried by the existing outbound reconciler with the same idempotency key after the mapping account matches the command. Stale `SENDING` becomes `OUTCOME_UNKNOWN` before any same-key retry. It is not resent only because time passed.

## Rollout

See `docs/deploy.md` §4.2c, `docs/architecture/scheduler-inventory.md`, and the roster.

## InboxState READ

`NOTIFICATION_INBOX_STATE_READ_ENABLED` remains **false** in this phase.
