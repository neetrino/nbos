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

Business cron timezone is `Asia/Yerevan` (`SCHEDULER_BUSINESS_TIMEZONE`), passed into `CronJob`. The occurrence slot is the latest cron instant at or before the tick. Lookback follows the expression: about a day for daily jobs, 8 days for day-of-week jobs, 62 days for day-of-month jobs such as `0 8 1 * *`. It is not a fixed 48-hour window. The stored instant is absolute UTC, so the host `TZ` does not change the key.

Production runs **one** `nbos-scheduler` replica (`docs/deploy.md` §4.2c). `SCHEDULER_MAX_CONCURRENT_RUNS` is the worker concurrency of that process and is the global cap only while the replica count stays 1. Do not scale the scheduler service above one replica without a separate global capacity lock.

Settings → Run now enqueues a manual occurrence. `POST /api/scheduler/*` remains a synchronous repair path under the lease.

## WhatsApp account

`resolveWhatsAppGatewayAccountId` returns `WhatsAppGatewayConnection.gatewayAccountId`. In production a missing value, or the literal `default`, throws `WhatsAppGatewayAccountNotConfiguredError`. Outside production the legacy `default` account remains for local and tests. `WHATSAPP_ALLOW_LEGACY_DEFAULT_ACCOUNT` does not enable `default` in production.

Legacy mappings (`messenger_external_conversation_mappings.external_account_id = default`) are not rewritten on startup. Audit them with:

```text
pnpm --filter @nbos/api exec tsx src/modules/messenger/core/legacy-whatsapp-default-account.cli.ts
pnpm --filter @nbos/api exec tsx src/modules/messenger/core/legacy-whatsapp-default-account.cli.ts --apply
pnpm --filter @nbos/api exec tsx src/modules/messenger/core/legacy-whatsapp-default-account.cli.ts --repair-message=<messageId>
```

The command is a dry-run unless `--apply` is passed. `--apply` updates a mapping only when the target chat is free in the database and the Gateway proves two things: `GET /api/v1/accounts` shows exactly one active `CONNECTED` account and that id equals the configured target, and legacy `GET /api/groups/:id` (the single-active-account session) returns that group. There is no account-scoped group route. A timeout, 5xx, missing group, account mismatch, or an account list that is empty, ambiguous, or disconnected stays `manual_review` and is not written. Comparing the database id alone is not enough. The audit does not enqueue sends.

Normal outbound reconciliation still rejects a command whose `accountId`/`chatId` differ from the current mapping (`FORGED_ROUTING`). That check is unchanged. The only exception is an explicit one-message repair:

```text
--repair-message=<messageId>
```

Same-key recovery and this repair are different. A normal send uses one Gateway `Idempotency-Key`, `core-wa-send:<messageId>`, for the first attempt and any later `OUTCOME_UNKNOWN` retry. Inside 24 hours of `firstAttemptAt` the reconciler may enqueue that same key. After the window, an unknown outcome (`OUTCOME_UNKNOWN`, timeout, HTTP 502/503/504, `WAHA_UNAVAILABLE`, `MESSAGE_OUTCOME_UNKNOWN`) is manual review. The expired key must not be treated as proof the provider never accepted the message, and it must not be replaced with a new transport key.

An explicit repair is allowed only when the command is `FAILED`, the payload account is still `default`, the message is not `SENT`/`DELIVERED`/`READ`, there is no WhatsApp external ref, and `errorCode` is on the proven pre-provider allowlist (`WHATSAPP_NOT_CONNECTED`, `WHATSAPP_GATEWAY_NOT_CONFIGURED`, `FORGED_ROUTING`). The current mapping account must be the same verified Gateway account, and that account must see the group. The same `MessengerMessage`, `MessengerCommand`, and logical key stay. BullMQ keeps `core-wa-send:<messageId>`. `firstAttemptAt` is not cleared and is not moved to now. The payload adds `repairGeneration: 1`. Every Gateway call for that generation uses `core-wa-send:<messageId>:repair:1`, including an in-window `OUTCOME_UNKNOWN` retry. The generation is not incremented on retry and is not removed when the outcome is unknown. The first QUEUED repair may send once even when `firstAttemptAt` is already older than 24 hours, because a stored `FAILED` replay would not send. If that attempt becomes `OUTCOME_UNKNOWN`, the original window still applies: inside it the retry reuses `:repair:1`; after it, reconciliation is manual review and does not call the Gateway. The repair suffix is not a new 24-hour window. A second concurrent repair loses the conditional update. Do not pass `--apply` together with `--repair-message`. Do not rerun the invoice reminder batch.

Stale `SENDING` becomes `OUTCOME_UNKNOWN` before any same-key retry. It is not resent only because time passed. Already `SENT` messages are not enqueued again.

## Rollout

See `docs/deploy.md` §4.2c, `docs/architecture/scheduler-inventory.md`, and the roster.

## InboxState READ

`NOTIFICATION_INBOX_STATE_READ_ENABLED` remains **false** in this phase.
