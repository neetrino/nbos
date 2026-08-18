# Performance baseline — Neon / Redis / Notifications

**Date:** 2026-07-27  
**Scope:** Static code inventory before Release 1 (SSE unread).  
**Limitation:** Production Neon/Upstash metrics were not available at baseline time.

## Stack (confirmed)

| Layer          | Tech                                                           |
| -------------- | -------------------------------------------------------------- |
| Web            | Next.js App Router, BFF `/api/bff/*`, Auth.js httpOnly session |
| API            | NestJS 11, Prisma 7 + `@prisma/adapter-pg` → Neon              |
| Queues         | BullMQ + ioredis (`REDIS_URL`)                                 |
| Realtime today | Socket.IO messenger only; **no SSE** for notifications         |

## Notification unread polling (before)

| Item           | Value                                                                     |
| -------------- | ------------------------------------------------------------------------- |
| Hook           | `apps/web/src/lib/notifications/use-notification-feed.ts`                 |
| Interval       | `NOTIFICATION_UNREAD_POLL_MS = 30_000`                                    |
| Mount          | `NotificationDropdown` in `Topbar` (always on while logged in)            |
| Hidden tab     | Interval **continues** (no pause)                                         |
| Extra triggers | `window` `focus` + `document` `visibilitychange` (can duplicate)          |
| Endpoint       | `GET /api/notifications/unread-count` → Prisma `count`                    |
| SQL per poll   | 1× `COUNT` + AuthGuard Redis denylist `GET` + EmployeeGuard enrich ~1/min |

**Estimate (idle open tab, interval only):** 2 HTTP + 2 COUNT / user / minute.

## Notification list

| Item     | Value                                                                        |
| -------- | ---------------------------------------------------------------------------- |
| Endpoint | `GET /api/notifications`                                                     |
| SQL      | `findMany` **+** `count` (`notification.service.ts` `findByUser`)            |
| Frontend | Uses **`items` only** (dropdown + `/notifications` page ignore `meta.total`) |

## Notification mutations

| Op                       | Approx SQL | Notes                                                    |
| ------------------------ | ---------- | -------------------------------------------------------- |
| `create`                 | ~6–8       | pref lookup + rule/event upsert + job + delivery + inApp |
| `markAsRead` / `archive` | 2          | findFirst + update                                       |
| `markAllAsRead`          | 1          | updateMany                                               |
| Bulk (SLA)               | N × create | sequential `for` + `await create`                        |

## Redis / BullMQ (per process when Redis set) — Phase 3.0 audit

| Queue                     | Producer                            | Worker                        |                       Current concurrency |       Retry | Retention                       | Redis connection                                           |
| ------------------------- | ----------------------------------- | ----------------------------- | ----------------------------------------: | ----------: | ------------------------------- | ---------------------------------------------------------- |
| `mail`                    | `MailQueueService`                  | `MailWorker` (OnModuleInit)   | env `BULLMQ_MAIL_CONCURRENCY` (default 5) |  5 / exp 5s | complete 1d/1000; fail 14d/5000 | `REDIS_QUEUE_URL`→`REDIS_URL` producer vs worker factories |
| `whatsapp.product-groups` | `WhatsAppProductGroupsQueueService` | `WhatsAppProductGroupsWorker` |                             env default 3 |  5 / exp 5s | same critical options           | same                                                       |
| `reports.export-jobs`     | `ReportsQueueService`               | `ReportsExportWorker`         |                             env default 1 | 3 / exp 10s | complete 6h/200; fail 7d/1000   | same                                                       |
| `drive.zip-export-jobs`   | `DriveExportZipQueueService`        | `DriveExportZipWorker`        |                             env default 1 | 3 / exp 10s | export options                  | same                                                       |

**Lifecycle (before Phase 3):** each Nest API process `OnModuleInit` created Queue **and** Worker when `REDIS_URL` set → N API replicas = N competing consumers + ~8 BullMQ Redis clients + denylist + vault + events.

**Lifecycle (after Phase 3):** `PROCESS_ROLE=api` registers producers only; `PROCESS_ROLE=worker` (`apps/api/src/worker.ts` + `WorkerAppModule`) registers consumers; `PROCESS_ROLE=all` local/dev only (forbidden in production).

**Est. Redis connections:**

| Process                        |                                               Approx clients |
| ------------------------------ | -----------------------------------------------------------: |
| API (`PROCESS_ROLE=api`)       |    denylist + vault + 4 queue producers + events pub/sub ≈ 8 |
| Worker (`PROCESS_ROLE=worker`) | 4 worker blocking + WhatsApp/other producers as needed ≈ 5–8 |
| Legacy `all` in one process    |                                            ~14–18 (baseline) |

**QueueEvents / QueueScheduler:** not used.  
**No import-time `new Worker`:** workers only in Nest `OnModuleInit` inside worker role.

**Idle Redis cost (2026-08-18):** four empty-queue workers with BullMQ `drainDelay=5s` produced a steady ~7 cmds/s on Upstash (`BZPOPMIN` + `EVALSHA` + Lua internals). Workers now share `drainDelay=20s` and `stalledInterval=120s` (`BULLMQ_DRAIN_DELAY_SEC` / `BULLMQ_STALLED_INTERVAL_MS`). ioredis `enableReadyCheck` is off to avoid billed `INFO` on connect.

## Auth hot path

| Guard           | Cost                                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| `AuthGuard`     | JWT verify + denylist `isRevoked` → Redis **GET** on L1 miss; Redis result cached 5s (miss) / 60s (hit) |
| `EmployeeGuard` | In-process cache 60s; miss → heavy `employee` + role + permissions include                              |

## Scheduler

Opt-in in-process crons (`*_ENABLED=true`) + external `POST /api/scheduler/*` with `SCHEDULER_API_KEY`.  
No distributed lease. Deploy doc prefers external cron only in production.

## Prisma pool

`DatabaseModule`: `new PrismaPg({ connectionString })` — **no explicit `max` / timeouts**.  
`.env.example` uses Neon **pooler** hostname for `DATABASE_URL`.

## Next.js BFF

`next.config` rewrites `/api/*` (except `auth`, `bff`) → `/api/bff/*` → `proxyToBackend` injects Bearer from session.  
Already streams `backendResponse.body` — dedicated SSE route still preferred to avoid rewrite buffering edge cases and to exclude hop-by-hop header stripping issues.

## Socket.IO

Messenger namespace only (`/messenger`). Not used for notification unread.

## Cron / N+1 candidates (background)

- Support SLA `notifyAll` sequential creates
- Invoice card reminders sequential jobs
- Expense backlog due loop
- Expense plan `autoGenerateDuePlans` sequential `generateCard`
- Billing monthly loop per subscription

## Metrics to capture after Release 1

| Scenario                 | Before (code estimate) | After target                                |
| ------------------------ | ---------------------- | ------------------------------------------- |
| Idle 10 min, SSE up      | ~20 unread HTTP        | **0** unread polling                        |
| Hidden 10 min            | polling continues      | **0**                                       |
| Unread request           | COUNT each poll        | SSE event / optional reconcile GET          |
| API Redis (Phase 1 only) | same workers           | +2 events pub/sub (Phase 3 removes workers) |
