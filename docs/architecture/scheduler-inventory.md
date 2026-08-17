# Scheduler inventory (Phase 4.0)

**Date:** 2026-07-27  
**Branch:** `dev-Karo`

## Classification keys

- **READ-ONLY** — no mutations
- **SET-BASED UPDATE** — DB updates without external I/O
- **EXTERNAL SIDE EFFECT** — email / WhatsApp / gateway / notifications fan-out
- **QUEUE PRODUCER** — enqueues BullMQ jobs
- **LONG-RUNNING** — may exceed short lease TTL; needs heartbeat

## In-process Nest crons (`CronJob` + `SchedulerRegistry`)

Registered only when feature env is truthy. Historically lived inside `SchedulerModule` imported by API (`PROCESS_ROLE=all` / legacy).

| Job                      | Current trigger                                      | Frequency             | Current process | Max duration | Idempotency                           | External effects                 | Risk   | Class                     |
| ------------------------ | ---------------------------------------------------- | --------------------- | --------------- | -----------: | ------------------------------------- | -------------------------------- | ------ | ------------------------- |
| `expense-plan-auto-due`  | `SCHEDULER_EXPENSE_PLAN_AUTO_DUE_ENABLED` + CronJob  | default `0 2 * * *`   | API (legacy)    |      minutes | plan `nextDueDate` advance            | creates expense cards            | medium | SET-BASED + domain writes |
| `report-schedules-due`   | `REPORT_SCHEDULES_DUE_CRON_ENABLED` + CronJob        | env cron              | API (legacy)    |      minutes | schedule `nextRunAt` + export `jobId` | **QUEUE PRODUCER** report export | medium | QUEUE PRODUCER            |
| `recurring-tasks-due`    | `SCHEDULER_RECURRING_TASKS_DUE_ENABLED` + CronJob    | default `*/5 * * * *` | API / scheduler |      minutes | `nextCreateAt` advance after spawn    | creates Task instances           | medium | SET-BASED + domain writes |
| `credential-trash-purge` | `SCHEDULER_CREDENTIAL_TRASH_PURGE_ENABLED` + CronJob | env cron              | API (legacy)    |      minutes | retention TTL filter                  | hard-delete secrets              | high   | SET-BASED UPDATE          |
| `platform-trash-purge`   | `SCHEDULER_PLATFORM_TRASH_PURGE_ENABLED` + CronJob   | env cron              | API (legacy)    |      minutes | retention TTL + audit                 | Credentials + Drive purge        | high   | SET-BASED UPDATE          |

## HTTP external cron (`POST /api/scheduler/*` + `SCHEDULER_API_KEY`)

Preferred production path before Phase 4. Runs inside **API** process when Coolify/cron hits the endpoint.

| Job                                 | Current trigger                                     | Frequency          | Current process |    Max duration | Idempotency                | External effects            | Risk     | Class                |
| ----------------------------------- | --------------------------------------------------- | ------------------ | --------------- | --------------: | -------------------------- | --------------------------- | -------- | -------------------- |
| `billing`                           | POST `/scheduler/billing`                           | monthly (external) | API             |    minutes–tens | billing period guards      | invoices                    | high     | SET-BASED + domain   |
| `expenses`                          | POST `/scheduler/expenses`                          | monthly            | API             |         minutes | legacy billing expenses    | expense rows                | medium   | SET-BASED            |
| `overdue-invoices`                  | POST `/scheduler/overdue-invoices`                  | daily              | API             | seconds–minutes | status not already OVERDUE | moneyStatus update          | medium   | SET-BASED UPDATE     |
| `invoice-card-reminders`            | POST `/scheduler/invoice-card-reminders`            | daily              | API             |         minutes | per invoice+offset         | WhatsApp / notifications    | **high** | EXTERNAL SIDE EFFECT |
| `expense-backlog-reminders`         | POST `/scheduler/expense-backlog-reminders`         | daily/weekly       | API             |         minutes | NotificationJob keys       | in-app notification jobs    | medium   | QUEUE/notif producer |
| `expense-plan-auto-due`             | POST `/scheduler/expense-plan-auto-due`             | daily              | API             |         minutes | same as cron               | cards                       | medium   | SET-BASED            |
| `report-schedules-due`              | POST `/scheduler/report-schedules-due`              | schedule           | API             |         minutes | jobId                      | **QUEUE PRODUCER**          | medium   | QUEUE PRODUCER       |
| `recurring-tasks-due`               | POST `/scheduler/recurring-tasks-due`               | every 5 min        | API             |         minutes | `nextCreateAt` advance     | creates Task instances      | medium   | SET-BASED + domain   |
| `sales-kpi-month-close`             | POST `/scheduler/sales-kpi-month-close`             | monthly            | API             |         minutes | period snapshots           | KPI rows                    | medium   | SET-BASED            |
| `sales-kpi-backfill-all`            | POST `/scheduler/sales-kpi-backfill-all`            | manual             | API             |            long | per period                 | KPI + payables              | high     | LONG-RUNNING         |
| `credential-trash-purge`            | POST `/scheduler/credential-trash-purge`            | daily              | API             |         minutes | TTL                        | hard delete                 | high     | SET-BASED            |
| `platform-trash-purge`              | POST `/scheduler/platform-trash-purge`              | daily              | API             |         minutes | TTL                        | hard delete + audit         | high     | SET-BASED            |
| `support-sla-escalation`            | POST `/scheduler/support-sla-escalation`            | frequent           | API             |         minutes | per ticket+recipient       | in-app notifications        | medium   | EXTERNAL (in-app)    |
| `whatsapp-product-groups-reconcile` | POST `/scheduler/whatsapp-product-groups-reconcile` | frequent           | API             |         minutes | op status + jobId          | **QUEUE PRODUCER** WhatsApp | medium   | QUEUE PRODUCER       |
| `notification-inbox-reconcile`      | POST `/scheduler/notification-inbox-reconcile`      | on demand / cron   | API             |         minutes | counter upsert             | SSE publish                 | medium   | SET-BASED + events   |

## Other background (not Nest cron)

| Job            | Current trigger                    | Frequency      | Current process               | Notes                             |
| -------------- | ---------------------------------- | -------------- | ----------------------------- | --------------------------------- |
| Mail IMAP IDLE | `MailImapIdleService` OnModuleInit | continuous     | API (`PROCESS_ROLE=api\|all`) | Not a scheduler job; stays on API |
| BullMQ workers | Worker OnModuleInit                | continuous     | `nbos-worker`                 | Phase 3                           |
| SSE heartbeat  | `NotificationSseHub` setInterval   | per connection | API                           | Not a business cron               |

## Phase 4 transfer plan

| Priority | Job                            | Action                                                                         |
| -------- | ------------------------------ | ------------------------------------------------------------------------------ |
| P0       | All four in-process CronJobs   | Move registration to `PROCESS_ROLE=scheduler` only; wrap `runWithLease`        |
| P0       | `notification-inbox-reconcile` | Add scheduler cron + flag; Stage C canary                                      |
| P1       | HTTP endpoints                 | Keep on API temporarily; wrap handlers with same lease (`trigger=manual_http`) |
| P1       | Jobs with EXTERNAL SIDE EFFECT | Prefer enqueue BullMQ where queue exists; do not rewrite all mail inline       |
| P2       | Remaining HTTP-only jobs       | Add optional scheduler crons behind per-job flags (default off)                |

## No `@Cron` / `@Interval` / `@Timeout` decorators found

All Nest schedule usage is manual `CronJob` + `SchedulerRegistry` under `apps/api/src/modules/scheduler/*`.
