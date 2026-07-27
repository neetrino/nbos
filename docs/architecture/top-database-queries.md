# Top database queries (Phase 6.11)

**Date:** 2026-07-27  
**Metrics source:** code inventory + staged metrics when available. Staging numbers currently **UNKNOWN**.

| Query                                       |                    Frequency |     p50 |     p95 | Rows scanned | Index used                        | Action                                                  |
| ------------------------------------------- | ---------------------------: | ------: | ------: | -----------: | --------------------------------- | ------------------------------------------------------- |
| Unread legacy `COUNT(*)` (`getUnreadCount`) | High (badge + SSE reconcile) | UNKNOWN | UNKNOWN |      UNKNOWN | `(recipient, is_read)` / archived | Keep until InboxState READ rollout; measure before flip |
| Notification cursor list                    |                       Medium | UNKNOWN | UNKNOWN |       take+1 | `(recipient, created_at)`         | Already no COUNT                                        |
| InboxState reconcile                        |                   Low (cron) | UNKNOWN | UNKNOWN |        batch | PK employee_id                    | Keep WRITE + reconcile                                  |
| Scheduler lease acquire                     |                      Low–med | UNKNOWN | UNKNOWN |            1 | PK job_name                       | SKIP LOCKED pattern OK                                  |
| SchedulerRun listing / insert               |                          Low | UNKNOWN | UNKNOWN |      UNKNOWN | job_name / time                   | Monitor growth                                          |
| Task lists                                  |                         High | UNKNOWN | UNKNOWN |      UNKNOWN | personal scope indexes exist      | EXPLAIN on staging                                      |
| Deals / leads / contacts lists              |                         High | UNKNOWN | UNKNOWN |      UNKNOWN | CRM indexes                       | EXPLAIN on staging                                      |
| Reports schedule / export                   |                          Low | UNKNOWN | UNKNOWN |      UNKNOWN | UNKNOWN                           | Worker-bound                                            |
| Drive listing                               |                       Medium | UNKNOWN | UNKNOWN |      UNKNOWN | folder / grant indexes            | EXPLAIN                                                 |
| Messenger queries                           |                       Medium | UNKNOWN | UNKNOWN |      UNKNOWN | read_states                       | Monitor                                                 |
| Auth employee + permissions                 |            High (cache miss) | UNKNOWN | UNKNOWN |      UNKNOWN | employee PK                       | EmployeeGuard 60s cache                                 |
| Invoice / expense reminder due scans        |                         Cron | UNKNOWN | UNKNOWN |      UNKNOWN | due dates                         | Set-based preferred                                     |
| Notification delivery PENDING scan          |                  Cron (flag) | UNKNOWN | UNKNOWN |      UNKNOWN | status index + unique job+channel | Phase 5                                                 |

Use `scripts/db/explain-top-queries.sql` on staging only.
