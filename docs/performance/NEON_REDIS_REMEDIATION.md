# Neon / Redis remediation tracker

Phased rollout. Do **not** merge all releases into one deploy.

| Release | Theme                                                  | Status   |
| ------- | ------------------------------------------------------ | -------- |
| 1       | SSE unread + Redis Pub/Sub + fallback                  | Done     |
| 1.1     | Reset SSE version on reconnect (connection generation) | Done     |
| 2A      | Cursor list without COUNT                              | Done     |
| 2B      | NotificationInboxState dual-write (READ off)           | **Done** |
| 2C      | READ unread from InboxState (after reconcile)          | Next     |
| 3       | BullMQ worker separation                               | **Done** |
| 4       | Scheduler lease                                        | Pending  |
| 5       | Notification create / N+1 batching                     | Pending  |
| 6       | Prisma/Neon pool                                       | Pending  |
| 7       | AuthSession v2 + denylist overlap                      | Pending  |
| 8       | Remove legacy polling/COUNT/denylist                   | Pending  |

Baseline: `docs/architecture/performance-baseline.md`  
Results: `docs/architecture/performance-results.md`
