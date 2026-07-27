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
