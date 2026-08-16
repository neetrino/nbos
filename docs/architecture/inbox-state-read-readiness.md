# InboxState READ readiness (Phase 7)

**Status:** Code ready for staged rollout. **Do not** set `NOTIFICATION_INBOX_STATE_READ_ENABLED=true` until dry-run reports zero drift.

## Preflight checklist (Phase 7.0)

| Проверка                            | Результат                                                 |
| ----------------------------------- | --------------------------------------------------------- |
| InboxState rows                     | UNKNOWN (run `pnpm notifications:inbox:check` on staging) |
| Employees with unread notifications | UNKNOWN                                                   |
| Missing InboxState rows             | UNKNOWN → must be 0 before READ                           |
| Drifted rows                        | UNKNOWN → must be 0 before READ                           |
| Maximum absolute drift              | UNKNOWN → must be 0                                       |
| Negative counters                   | UNKNOWN → must be 0                                       |
| Last successful reconciliation      | Ops / SchedulerRun history                                |
| Legacy unread COUNT p95             | UNKNOWN                                                   |
| InboxState SELECT p95               | UNKNOWN                                                   |

## Read path inventory

| Consumer                          | Path                                                                                |
| --------------------------------- | ----------------------------------------------------------------------------------- |
| HTTP unread                       | `GET /api/notifications/unread-count` → `NotificationService.getUnreadCount`        |
| Frontend badge                    | `notificationsApi.getUnreadCount` + SSE reconcile                                   |
| SSE publish                       | `NotificationRealtimePublisher` snapshot / COUNT                                    |
| Writes                            | create / createMany / mark read / mark all / archive (+ dual-write when WRITE=true) |
| Reconcile                         | `NotificationInboxReconcileService` dry-run \| repair                               |
| Direct Prisma notification writes | Prefer `NotificationService` / CommandService; audit any bypasses before READ       |

## Gate

```text
evaluateInboxStateReadiness(report)
→ READY only if drifted=missing=negative=0 AND WRITE+RECONCILE on AND last run succeeded
```

Thresholds (first prod rollout = 0):

```env
NOTIFICATION_INBOX_READ_MAX_DRIFTED_ROWS=0
NOTIFICATION_INBOX_READ_MAX_MISSING_ROWS=0
NOTIFICATION_INBOX_READ_MAX_ABSOLUTE_DRIFT=0
```

## CLI

```bash
pnpm notifications:inbox:check
pnpm notifications:inbox:repair
pnpm notifications:inbox:check -- --employee-id=<id> --limit=100
```

## Flags (defaults)

```env
NOTIFICATION_INBOX_STATE_WRITE_ENABLED=false
NOTIFICATION_INBOX_STATE_RECONCILE_ENABLED=false
NOTIFICATION_INBOX_STATE_SHADOW_READ_ENABLED=false
NOTIFICATION_INBOX_STATE_SHADOW_READ_SAMPLE_RATE=0.05
NOTIFICATION_INBOX_STATE_READ_ENABLED=false   # keep false until gate READY
```

## Missing state (READ=true)

Never return `0` for missing row. Fallback: COUNT → advisory lock → sync InboxState → return `{ count, version, source: "inbox_state" }`.

## Rollback

```env
NOTIFICATION_INBOX_STATE_READ_ENABLED=false
```

Prefer leaving WRITE + RECONCILE on.
