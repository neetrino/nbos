# Database transactions audit (Phase 6.5)

**Date:** 2026-07-27

## Critical rules (enforced by review)

| Forbidden inside `$transaction` | Status                                                                                    |
| ------------------------------- | ----------------------------------------------------------------------------------------- |
| Email send (Resend / SMTP)      | Review: mail workers enqueue post-commit via BullMQ                                       |
| WhatsApp Gateway HTTP           | Invoice reminders: job PENDING then worker — not inside TX                                |
| BullMQ `queue.add`              | Must be post-commit (Phase 5 notification path: IN_APP delivered in TX without Redis job) |
| Redis Pub/Sub / SSE publish     | Notification realtime **after** commit                                                    |
| R2 upload/download              | Drive upload sessions finalize outside long TX where possible                             |
| External bank APIs              | N/A in current core paths                                                                 |

## Notification flows (Phase 5)

| Path                                        | External in TX? | Notes                                                            |
| ------------------------------------------- | --------------- | ---------------------------------------------------------------- |
| `NotificationCommandService.createOne/Many` | No              | SSE after commit; IN_APP delivery row written in TX as DELIVERED |
| Legacy `createLegacy`                       | No              | Same                                                             |
| Enqueue reconcile                           | N/A             | Scan only                                                        |

## High-risk / long TX candidates (remediation list — not rewritten in Phase 6)

| Area             | File / pattern                                | Risk               | Action                   |
| ---------------- | --------------------------------------------- | ------------------ | ------------------------ |
| Drive folder ops | `drive-folder.service.ts`, `drive.service.ts` | Multi-statement TX | Monitor duration metrics |
| Credentials bulk | `credentials-bulk.operations.ts`              | Large batches      | Keep batch size bounded  |
| Partner payout   | `partner-payout-batch.ops.ts`                 | Multi-step finance | Keep external calls out  |
| Payroll close    | `payroll-runs.service.ts`                     | Heavy              | Observe p95              |
| Mail sync upsert | `mail-sync-upsert.ops.ts`                     | Message batches    | Already chunked — verify |

## Isolation / retry

Prisma default interactive transactions (Read Committed). Classification:

- serialize conflict → `DB_TRANSACTION_CONFLICT` (409)
- pool wait → `DB_POOL_TIMEOUT` (503)
- statement timeout → `DB_STATEMENT_TIMEOUT` (504)

No automatic HTTP retry loops — clients / BullMQ handle retries.
