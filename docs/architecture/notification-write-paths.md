# Notification write paths (Phase 5.0 audit)

**Date:** 2026-07-27  
**Branch:** `dev-Karo`

## Summary

| Metric                                         | Before (code estimate) |
| ---------------------------------------------- | ---------------------: |
| DB round-trips / createOne (WRITE on)          |                     ~8 |
| DB round-trips / createOne (WRITE off + COUNT) |                   ~8–9 |
| 100 recipients (sequential create)             |               ~800–900 |
| Redis PUBLISH / create                         |                      1 |
| Redis PUBLISH / 100 recipients                 |                    100 |
| Rule upsert / create                           |                      1 |
| Outbox                                         |               **none** |

## Hot path: `NotificationService.create`

File: `apps/api/src/modules/notifications/notification.service.ts`

1. Preference `findUnique` (`user_pref:{user}:{type}`)
2. TX: job `findUnique` by dedupeKey → optional inApp `findFirst`
3. TX: **rule upsert** every time
4. TX: event upsert
5. TX: job create + delivery create + inApp create
6. TX: InboxState increment (if WRITE)
7. After commit: SSE (COUNT if no inbox snapshot)

## Live producers (all via `NotificationService.create` unless noted)

| Flow                     | Trigger             |      Recipients | DB queries | Redis | Queue | External              | Idempotency            |
| ------------------------ | ------------------- | --------------: | ---------: | ----: | ----: | --------------------- | ---------------------- |
| Wallet / payroll / bonus | Finance ops         |     1 or N loop |     ~8 × N |     N |     — | —                     | Stable keys in ops     |
| Credentials high-risk    | Secrets / emergency | R (Promise.all) |     ~8 × R |     R |     — | —                     | Stable keys            |
| Task review              | Task submit         |               1 |         ~8 |     1 |     — | —                     | `task-review:{id}`     |
| Drive grant              | Grant CRUD          |               1 |        ~8+ |     1 |     — | —                     | grantId / UUID         |
| Support SLA              | Scheduler           |    R sequential |     ~8 × R |     R |     — | —                     | per ticket+recipient   |
| Support escalate         | API                 |               R |     ~8 × R |     R |     — | UUID (non-idempotent) |
| Offboarding finance      | Offboard            |             ≤25 |     ~8 × R |     R |     — | —                     | per employee+recipient |
| Mail stubs               | Mail mutations      |             1–2 |       ~8 × |   1–2 |     — | —                     | Fingerprint            |

### Job-only (no InApp)

| Flow                      | Trigger   | Notes                                                             |
| ------------------------- | --------- | ----------------------------------------------------------------- |
| Invoice card reminders    | Scheduler | `NotificationJob` PENDING; WhatsApp only for Tax official-request |
| Expense backlog reminders | Scheduler | Job PENDING; no consumer for in-app                               |

## Gaps

- No `InAppNotification` unique on dedupe — soft dedupe via `NotificationJob.dedupeKey`
- No transactional outbox
- Rule upsert on every create
- Multi-recipient = N×create (SLA, credentials, payroll)

## Phase 5 targets

| Metric                   |                                                  Target |
| ------------------------ | ------------------------------------------------------: |
| createOne (V2, WRITE on) | ≤5–6 SQL (no rule upsert, no COUNT when SSE-from-inbox) |
| createMany 100           |      O(1) prefs + set-based writes + 1 inbox + ≤100 SSE |
| Rule upsert in hot path  |                                                   **0** |
| Mutation COUNT for SSE   |                       **0** when SSE-from-inbox enabled |

## Phase 5 remaining producers (Stage F — not blocking Phase 6)

| Producer                            | Pattern                          | Est. SQL | Remediation                                                      |
| ----------------------------------- | -------------------------------- | -------: | ---------------------------------------------------------------- |
| Payroll run wallet notify           | sequential `create` per employee |   ~8 × N | `createMany` when titles identical                               |
| Bonus wallet hints                  | sequential `create` per hint     |   ~8 × N | batch by identical template or keep createOne (different bodies) |
| Other wallet/bonus single-recipient | createOne                        |       ~8 | OK on V2 path                                                    |

Do not block Phase 6 on full Stage F migration.
