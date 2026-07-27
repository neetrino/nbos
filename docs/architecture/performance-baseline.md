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

## Redis / BullMQ (per API process when `REDIS_URL` set)

| Component                | File                                  | Connection                      |
| ------------------------ | ------------------------------------- | ------------------------------- |
| JWT denylist             | `token-denylist.service.ts`           | 1 ioredis                       |
| Credential vault         | `credential-vault-session.service.ts` | 1                               |
| Reports Queue + Worker   | `reports-*`                           | 2 (+ Worker blocking duplicate) |
| Mail Queue + Worker      | `mail-*`                              | 2                               |
| Drive ZIP Queue + Worker | `drive-export-zip-*`                  | 2                               |
| WhatsApp Queue + Worker  | `whatsapp-product-groups-*`           | 2                               |

**Est. Redis connections / API process:** ~14–18 (including BullMQ duplicates).  
**PROCESS_ROLE:** not present — workers start inside API when Redis is set.  
**Retention:** WhatsApp has `removeOnComplete/Fail`; mail/reports/drive lack age/count retention.

## Auth hot path

| Guard           | Cost                                                                                    |
| --------------- | --------------------------------------------------------------------------------------- |
| `AuthGuard`     | JWT verify + denylist `isRevoked` → Redis **GET** when jti not in positive memory cache |
| `EmployeeGuard` | In-process cache 60s; miss → heavy `employee` + role + permissions include              |

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
