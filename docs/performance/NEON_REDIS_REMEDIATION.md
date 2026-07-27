# Neon / Redis remediation tracker

Phased rollout. Do **not** merge all releases into one deploy.

| Release | Theme                                                  | Status   |
| ------- | ------------------------------------------------------ | -------- |
| 1       | SSE unread + Redis Pub/Sub + fallback                  | Done     |
| 1.1     | Reset SSE version on reconnect (connection generation) | **Done** |
| 2       | Cursor list + NotificationInboxState                   | Next     |
| 3       | BullMQ worker separation                               | Pending  |
| 4       | Scheduler lease                                        | Pending  |
| 5       | Notification create / N+1 batching                     | Pending  |
| 6       | Prisma/Neon pool                                       | Pending  |
| 7       | AuthSession v2 + denylist overlap                      | Pending  |
| 8       | Remove legacy polling/COUNT/denylist                   | Pending  |

Baseline: `docs/architecture/performance-baseline.md`  
Results: `docs/architecture/performance-results.md`
