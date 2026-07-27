# Performance results (incremental)

Updated after each release. Production panel numbers marked when unavailable.

## Release 1 — SSE unread (2026-07-27)

| Scenario                   | Before HTTP |                 After HTTP | Before SQL |        After SQL |     Before Redis |                                    After Redis |
| -------------------------- | ----------: | -------------------------: | ---------: | ---------------: | ---------------: | ---------------------------------------------: |
| Idle 10 min, SSE connected |  ~20 unread |                 **0** poll |  ~20 COUNT |  **0** from poll | ~20 denylist GET |                                **0** from poll |
| Hidden 10 min              |  ~20 unread |                      **0** |  ~20 COUNT |            **0** |          ~20 GET |                                          **0** |
| SSE connected steady       |           — | 1 EventSource + heartbeats |          — |   0 unread COUNT |                — | Pub/Sub + heartbeat none on Redis for SSE body |
| Mutation (create/read)     |    poll lag |       1 publish path COUNT | 6–8 create | +1 COUNT publish |                — |                                      1 PUBLISH |

**VERIFIED LOCALLY:** unit tests for hub isolation + refetch dedupe.  
**READY FOR STAGING:** EventStream via BFF, multi-tab, hide/show.  
**REQUIRES PRODUCTION METRICS:** Neon query frequency for `in_app_notifications` COUNT; Upstash commands/day.

## Release 1.1 — SSE version reset on reconnect (2026-07-27)

| Scenario                                                | Before                 | After                                           |
| ------------------------------------------------------- | ---------------------- | ----------------------------------------------- |
| API restart, client lastVersion=42, new event version=1 | Ignored (stale badge)  | Accepted after generation reset + reconcile GET |
| Parallel open+focus+visibility                          | Multiple GETs possible | Registry dedupes to 1 in-flight                 |
| Hidden during reconnect                                 | Could poll             | Reconcile deferred until visible                |
| Unread GET error                                        | Could zero badge       | Keeps prior count                               |

**VERIFIED LOCALLY:** unit tests `notification-sse-version`, `notification-sse-reconnect.scenario`.

## Release 2A — Cursor pagination without COUNT (2026-07-27)

| Scenario                     | Before           | After                                  |
| ---------------------------- | ---------------- | -------------------------------------- |
| Dropdown list                | findMany + COUNT | 1× findMany take+1                     |
| Invalidate / open            | page API         | `GET /notifications/cursor` first page |
| Legacy `/notifications` page | meta.total       | Unchanged offset API                   |

**Index note:** Existing `@@index([recipientEmployeeId, createdAt])` covers primary filter+sort. Compound `(recipient, createdAt, id)` deferred pending staging `EXPLAIN ANALYZE`.

## Release 2B — InboxState dual-write (2026-07-27)

| Scenario                                                       | Status |
| -------------------------------------------------------------- | ------ |
| Migration `NotificationInboxState` + CHECK `unread_count >= 0` | ✅     |
| Flags WRITE / READ / RECONCILE (default off)                   | ✅     |
| Dual-write on create / mark / archive / markAll                | ✅     |
| Unread GET still `COUNT(*)` (READ=false)                       | ✅     |
| Reconcile scheduler endpoint (batch)                           | ✅     |
| Backfill in migration + reconcile repair                       | ✅     |

**VERIFIED LOCALLY:** `notification-inbox-state.flags`, `notification-inbox-dual-write`; API typecheck.  
**READY FOR STAGING:** migrate → WRITE=true → reconcile → drift check. **Do not** enable READ until drift=0.  
**REQUIRES PRODUCTION METRICS:** inbox drift rate; unread COUNT vs counter after WRITE.

## Release 3 — API / Worker process split (2026-07-27)

| Scenario                                   | Status |
| ------------------------------------------ | ------ |
| `PROCESS_ROLE` api\|worker\|scheduler\|all | ✅     |
| Production forbids `all`                   | ✅     |
| `worker.ts` + health/ready                 | ✅     |
| Producers only on API role                 | ✅     |
| Consumers on worker role                   | ✅     |
| Retention + concurrency env                | ✅     |
| InboxState READ remains off                | ✅     |

**READY FOR STAGING:** deploy worker service then cut API to `PROCESS_ROLE=api`.  
**REQUIRES PRODUCTION METRICS:** Redis connection count; queue waiting/active/failed; worker restart drain.

## Release 4 — Scheduler process + PostgreSQL lease (2026-07-27)

| Scenario                                    | Status |
| ------------------------------------------- | ------ |
| `SchedulerLease` + `SchedulerRun` migration | ✅     |
| Atomic acquire + fencingToken               | ✅     |
| Heartbeat + AbortController                 | ✅     |
| Cron only on `PROCESS_ROLE=scheduler\|all`  | ✅     |
| API/Worker assert empty cron registry       | ✅     |
| Manual HTTP also uses lease                 | ✅     |
| InboxState READ remains off                 | ✅     |

**READY FOR STAGING:** migrate → `SCHEDULER_ENABLED=false` smoke → canary `notification-inbox-reconcile`.  
**REQUIRES PRODUCTION METRICS:** SKIPPED_LOCKED rate; lease duration; dual-replica contention.

## Release 5 — Notification write-path optimization (2026-07-27)

| Scenario                  | Before                                  | After (flags on)                                                                                       |
| ------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| createOne SQL             | ~8 (incl. rule upsert) + optional COUNT | ≤6 (cached rule id, no rule upsert; SSE from InboxState when flag on → **0 COUNT**)                    |
| createMany 100 recipients | ~800–900 sequential                     | 1 prefs + 1 existing-jobs + set-based events/jobs/deliveries/notifications + 1 inbox upsert + ≤100 SSE |
| Preferences               | N × findUnique                          | 1 × findMany (`code IN (...)`)                                                                         |
| InboxState bulk           | N × upsert                              | 1 × `unnest` upsert                                                                                    |
| SSE per batch / recipient | N publishes                             | **1** publish / recipient                                                                              |
| Rule upsert in hot path   | Yes                                     | **No** (startup `NotificationRuleCacheService`)                                                        |
| Delivery idempotency      | Index only                              | Unique `(job_id, channel)`                                                                             |
| Outbox                    | None                                    | Deferred; PENDING enqueue reconcile scan                                                               |
| InboxState READ           | Off                                     | **Still off**                                                                                          |

| Metric (estimate)      | Legacy |          V2+bulk+SSE-from-inbox |
| ---------------------- | -----: | ------------------------------: |
| SQL / createOne        |    8–9 |                             5–6 |
| SQL / 100 recipients   |   800+ | ~10–15 fixed + O(1) set inserts |
| Redis PUBLISH / 100    |    100 |              ≤100 (1/recipient) |
| Mutation COUNT for SSE |      1 |                           **0** |

**Flags (default off):**

```env
NOTIFICATION_COMMAND_V2_ENABLED=false
NOTIFICATION_BULK_WRITE_ENABLED=false
NOTIFICATION_SSE_FROM_INBOX_STATE_ENABLED=false
NOTIFICATION_ENQUEUE_RECONCILE_ENABLED=false
NOTIFICATION_INBOX_STATE_READ_ENABLED=false
```

**VERIFIED LOCALLY:** unit tests command path, dual-write, concurrency helper; API typecheck.  
**READY FOR STAGING:** Stage A flags off → Stage B V2 → Stage C bulk on SLA → Stage D SSE-from-inbox.  
**OUTBOX:** deferred; use enqueue reconcile + keep IN_APP deliveries as `DELIVERED` in TX (current product behavior).
