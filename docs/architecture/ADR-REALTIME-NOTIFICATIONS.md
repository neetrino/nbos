# Release 1 — SSE unread notifications

**Status:** implemented in codebase (2026-07-27)  
**Baseline:** [`performance-baseline.md`](./performance-baseline.md)

## Goal

Replace continuous 30s unread HTTP polling with authenticated SSE + Redis Pub/Sub fan-out. Keep fallback polling only when SSE is down.

## What changed

### API

- `RealtimeModule` (global): SSE hub, event bus, publisher
- `GET /api/realtime/notifications` — authenticated `text/event-stream`
- Events: `notifications.unread.changed`, `notifications.list.invalidate`
- Heartbeat `: ping` every 25s; cleanup on `close`/`error`
- Redis channel `nbos:realtime:notifications` via `REDIS_EVENTS_URL` (fallback `REDIS_URL`)
- Separate publisher + subscriber ioredis connections (not BullMQ)
- `NotificationService` publishes **after** successful create / mark-read / mark-all / archive (unread→read)
- `@SkipTransform()` so global response wrapper does not break SSE

### Web

- Dedicated BFF: `GET /api/realtime/notifications` streams Nest body (session → Bearer)
- `next.config` excludes `realtime` from generic BFF rewrite
- `useNotificationFeed`: initial unread GET + SSE; no interval while connected
- Fallback: 60s grace → 60/120/300s with jitter; **stopped when `document.hidden`**
- Debounced refetch registry + AbortController + version ignore for stale SSE

## Environment

```env
# API
REDIS_URL=rediss://...          # existing
REDIS_EVENTS_URL=rediss://...   # optional; defaults to REDIS_URL

# Web (unchanged)
BACKEND_URL=http://nbos-api:4000
AUTH_SECRET=...
```

## Local run

1. Start API + web as usual (`pnpm dev` / `dev:api` + `dev:web`).
2. Optional Redis: set `REDIS_URL` (and optionally `REDIS_EVENTS_URL`). Without Redis, in-process bus still delivers SSE on a single API instance.
3. Log in → open DevTools Network → `realtime/notifications` EventStream.
4. Create a notification (or mark read) → badge updates without 30s wait.
5. Hide tab → no fallback polls; show tab → one debounced reconcile.

## Coolify deploy order (Release 1)

1. Deploy **API** with new realtime module (no schema migration required).
2. Deploy **Web** (SSE BFF route + feed hook).
3. Verify EventStream 200 and heartbeat comments.
4. Confirm unread-count request rate drops for idle tabs (browser Network / API logs).

No worker/process-role change in this release.

## Rollback

1. Revert web to previous `use-notification-feed` (30s interval) **or** redeploy prior web image.
2. Revert/redeploy prior API image (SSE unused if web rolled back).
3. `REDIS_EVENTS_URL` can remain; unused without subscribers.

## Tests

- `apps/api/src/modules/realtime/notification-sse.hub.test.ts`
- `apps/web/src/lib/realtime/notification-refetch-registry.test.ts`
- Existing `notification.service.test.ts` (publisher optional)

## Before / after (code-level targets)

| Scenario            | Before            | After (SSE up) |
| ------------------- | ----------------- | -------------- |
| Idle 10 min         | ~20 unread HTTP   | **0** polling  |
| Hidden 10 min       | polling continues | **0**          |
| Create notification | badge ≤30s        | SSE push       |
| Multi API replica   | N/A local Map     | Redis Pub/Sub  |

Production metrics: fill [`../architecture/performance-results.md`](./performance-results.md) after staging soak.

## Risks / limitations

- Version counter is **process-local** until `NotificationInboxState` (Release 2); cross-replica versions may not be globally monotonic — clients treat version as per-connection soft filter and reconcile on reconnect.
- **Reconnect fix:** frontend bumps a connection generation and sets `lastVersion = null` on every SSE `open`, then runs one deduped unread GET. A post-restart `version = 1` is accepted; stale events from a previous generation are ignored.
- Publish path still runs one `COUNT` after mutations (acceptable vs continuous polling).
- Nest/proxy idle timeouts: ensure Coolify/nginx allow long-lived SSE (`X-Accel-Buffering: no` set).
- Full Redis Pub/Sub cross-instance integration test requires Redis in CI (unit tests cover local bus + isolation).

## Next safe phase

**Release 2:** cursor list without `COUNT(*)` + `NotificationInboxState` dual-write.
