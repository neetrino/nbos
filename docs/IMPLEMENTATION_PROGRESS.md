# NBOS Implementation Progress

> Compact tracker for actual implementation state. Detailed behavior belongs in module docs, tests and commits.

## Current Focus

| Field         | Value                                   |
| ------------- | --------------------------------------- |
| Current phase | **Phase 5 — Collaboration / knowledge** |
| Current task  | Phase 5 — Messenger (WS / audit next)   |
| Status        | Phase 5 in progress                     |
| Last updated  | 2026-04-30                              |

## Phase Snapshot

| Phase                               | Status      | Progress | Notes                                                                                      |
| ----------------------------------- | ----------- | -------- | ------------------------------------------------------------------------------------------ |
| Phase 1 — Platform shell            | Done        | 100%     | Navigation, RBAC shell, shared states, admin foundation                                    |
| Phase 2 — CRM / Marketing / Intake  | Done        | 100%     | Intake, CRM handoff, marketing spend links, project entry points                           |
| Phase 3 — Finance core              | Done        | 100%     | Client Services runtime + flows done; Finance report definitions v1 and all six aggregates |
| Phase 4 — Delivery ops              | Done        | 100%     | Delivery, Work Space, task blockers and Support runtime bridges closed as foundation       |
| Phase 5 — Collaboration / knowledge | In progress | ~92%     | Messenger DB-backed; Documents archive/restore shipped                                     |
| Phase 6 — Control layer             | Early       | ~35%     | Home dashboard typed API groundwork exists; Reports/Calendar Control Center later          |
| Phase 7 — Integrations / migration  | Not started | 0%       | WhatsApp, bank/gov, Bitrix migration                                                       |

## Phase 3 Full Closure Gate

Confirmed in scope:

- `Client Service Record` as first-class runtime entity.
- Client-paid and company-paid service flows to invoice, expense plan/card and task.
- Finance report definitions v1: Company P&L, Project P&L, Cash Flow, MRR / Subscription Revenue, Expense Plan vs Actual, Payroll Report.
- Read-only report aggregates where Phase 3 already has reliable source data.

Explicitly out of Phase 3 v1:

- Separate `NBOS pool` entity. Use canonical Project Bonus Pool only.
- Global Reports / Analytics catalog, scheduling, BI presentation, accrual depth and period close. These remain Phase 6/control work.

## Current Finance State

Shipped Finance foundations:

- Orders, invoices, payments, subscriptions, reconciliation and finance dashboard foundations.
- Expense ledger, partial payments, backlog/closed views, Expense Plan, Plan -> Card, due auto-generation and scheduler hook.
- Payroll runs, salary lines, payroll expense materialization, salary payment sync, payroll journal/audit and employee wallet.
- Bonus board and read-only Project Bonus Pool rollups.
- Partner commission preview and validation.
- Client Services runtime: Prisma model, API, UI, stats and linked flow actions.
- Finance reports: definitions shell, Company P&L v1, Project P&L v1, Cash Flow v1, Expense Plan vs Actual v1, MRR v1 and Payroll Report v1 snapshots.

Closed by the full-closure gate:

- `Client Service Record` runtime, UI, stats and linked flow actions.
- Finance report definitions v1 and read-only aggregates for all six approved reports.
- Separate `NBOS pool` intentionally not created; canonical Project Bonus Pool remains the v1 scope.

Future Finance depth:

- Global Reports / Analytics catalog, scheduled reports, advanced dashboards, accrual depth, period close and Operational Journal-backed reporting stay Phase 6/control work.
- Optional Client Services depth can be handled later: detail page, CSV, stronger payment-driven automation.

## Recent Milestones

| Date       | Milestone                             | Result                                                                                                                                                                                                     |
| ---------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-04-29 | Phase 3 Finance full closure          | Client Services runtime/flows and all six Finance report aggregates done.                                                                                                                                  |
| 2026-04-29 | Delivery lifecycle runtime            | Product/Extension canonical lifecycle, actions, board, filters and gates.                                                                                                                                  |
| 2026-04-29 | Product Done readiness                | Done blocks real blockers and surfaces handoff/Drive/client gaps.                                                                                                                                          |
| 2026-04-29 | Tasks / Work Space foundation         | Work Space runtime, product UI, completion rules and blocker UX exist.                                                                                                                                     |
| 2026-04-29 | Support runtime bridges               | Ticket -> Task, Change Request -> Extension Deal, coverage and SLA state.                                                                                                                                  |
| 2026-04-29 | Phase 4 Delivery closure              | Review/Scrum/automation depth moved later; Phase 5 can start.                                                                                                                                              |
| 2026-04-29 | Drive file metadata foundation        | DB-backed File Assets, versions, links and metadata API foundation.                                                                                                                                        |
| 2026-04-29 | Phase 5 Documents plan                | Documents defined as standalone module with Drive-backed attachments.                                                                                                                                      |
| 2026-04-29 | Drive upload session + library        | `FileUploadSession`, presigned PUT, complete → FileAsset+link, `GET /drive/library`.                                                                                                                       |
| 2026-04-29 | Documents data foundation             | Prisma Document, `/api/documents`, `DOCUMENTS` RBAC, default sections, `documentsApi`.                                                                                                                     |
| 2026-04-29 | Documents UI shell                    | `/documents`, sections, tables, create dialog, detail + archive, sidebar `Documents`.                                                                                                                      |
| 2026-04-29 | Documents native editor slice         | TipTap edit + read tabs, DOMPurify viewer, debounced save, `recordActivity: false` on API.                                                                                                                 |
| 2026-04-29 | Documents Drive attachments slice     | `POST/DELETE …/attachments`, `GET …/drive/files/:id/preview-url`, TipTap `documentImage`, panel UI.                                                                                                        |
| 2026-04-29 | Documents search + activity UX slice  | List `OR` search (title, description, plainText, section, tags), `searchSnippet`, home/section UI, owner/updated hints.                                                                                    |
| 2026-04-29 | Documents list FTS                    | Migration `search_vector` (GIN); `listDocuments` ranked `$queryRaw` + same ILIKE/tag/section OR paths.                                                                                                     |
| 2026-04-29 | Documents list-scope ACL              | Section `default_list_scope`, document `list_scope_override`, read/search enforcement, PATCH + `access_changed`.                                                                                           |
| 2026-04-29 | Documents view_activity + audit log   | `DOCUMENTS_VIEW_ACTIVITY` in seed; `activityRevealed` on detail; `AuditService` on `access_changed`.                                                                                                       |
| 2026-04-29 | Section default list scope admin      | `perm-documents-manage-sections` / `MANAGE_SECTIONS`; `PATCH /api/documents/sections/:id`; section page visibility card; audit `document_section_list_scope_changed`.                                      |
| 2026-04-29 | Document activity pagination          | `GET /api/documents/:id/activity` (cursor + limit); detail over-fetch + `activityNextCursor`; document detail “Load older activity”.                                                                       |
| 2026-04-29 | Document-scoped Drive preview         | `GET …/drive/files/:id/preview-url?forDocumentId=` enforces Documents read + attachment or DOCUMENT `FileLink`; web passes `documentId` in viewer, editor, attachments.                                    |
| 2026-04-29 | Document list search + attachments    | List `search` OR-path on linked `file_assets` names; `searchSnippet` fallback from attachment display/original names (not in `search_vector` yet).                                                         |
| 2026-04-29 | Document attachment FTS column        | `documents.attachment_search_vector` + GIN; triggers on `document_attachments` and `file_assets` updates; list FTS rank blends attachment matches (weight constant).                                       |
| 2026-04-29 | Document restore from archive         | `POST /api/documents/:id/restore` (DELETE perm); PUBLISHED if `published_at` set else DRAFT; web Restore on archived detail; activity `restored` + snippet hint.                                           |
| 2026-04-29 | Credentials row-level access          | `GET/PUT/DELETE /credentials/:id` use list-equivalent visibility (`findFirst` + OR); view audit only after row found; no secret leak by id alone.                                                          |
| 2026-04-29 | Credentials reveal/copy + redaction   | List/detail/create/update omit secret blobs; `secretsPresent`; `POST …/secrets/reveal` and `…/secrets/copy` + audit; web vault dialog; project credentials select strips secrets.                          |
| 2026-04-29 | Credentials URL open audit            | `POST /api/credentials/:id/open-url` validates http(s), audit `credential.url_opened`, returns URL; web vault dialog, credentials list, project Credentials tab use it.                                    |
| 2026-04-29 | Credentials web edit dialog           | `/credentials` table Edit (CREDENTIALS EDIT): load detail, save via `PUT /api/credentials/:id`; optional new password; phone + SECRET allow-list like create.                                              |
| 2026-04-29 | Credentials web delete confirm        | Actions column: archive confirm dialog; `DELETE /api/credentials/:id` archives (soft); `CREDENTIALS` DELETE gate.                                                                                          |
| 2026-04-29 | Credentials apiKey + envData in forms | New credential dialog and edit dialog: optional API key and environment textarea; edit only sends new values when non-empty (existing values not shown).                                                   |
| 2026-04-29 | Credentials archive + restore         | Prisma `archived_at`; list `includeArchived`; DELETE sets archive + audit `credential.archived`; `POST …/restore` + `credential.restored`; web Active/Archived + Restore; project counts exclude archived. |
| 2026-04-29 | Credentials permanent purge           | `DELETE …/permanent` for archived rows + `credential.permanently_deleted`; web Erase + name-confirm dialog.                                                                                                |
| 2026-04-29 | Messenger API RBAC + sender binding   | `RequirePermission` on MVP routes; JWT sender for channel/DM; `GET dm/conversations` without path userId.                                                                                                  |
| 2026-04-29 | Messenger web wired to API            | `messengerApi`, `/messenger` loads channels + DM threads, send with `MESSENGER` EDIT; DM peer labels via employees list when allowed.                                                                      |
| 2026-04-30 | Messenger Prisma persistence          | `MessengerChannel`, channel messages, `MessengerDirectThread` + messages; seed replaces in-memory demo; API service uses `PRISMA_TOKEN`.                                                                   |

## Next Action

1. Continue Phase 5 per `docs/PHASE_5_COLLABORATION_KNOWLEDGE_PLAN.md`.
2. Next normal slice: **Phase 5** — next module slice (Credentials, Messenger, Mail, …) or Documents UI polish per roadmap.
3. Keep Google v2, AI, complex approval workflow and credentials secrets out of the first Documents release.

## Slice DoD

- Behavior matches `docs/NBOS` and the Phase 3 gate.
- No fake financial, audit, credential or report data.
- Tests/typecheck/lint run for touched API/web/database areas.
- Docs updated only at milestone level.
- One end-of-slice commit bundles related code, tests and docs.
