# NBOS Implementation Progress

> Compact tracker for actual implementation state. Detailed behavior belongs in module docs, tests and commits.

## Current Focus

| Field         | Value                                                 |
| ------------- | ----------------------------------------------------- |
| Current phase | **Phase 5 — Collaboration / knowledge**               |
| Current task  | Documents access, search and activity depth (Slice 6) |
| Status        | Phase 5 in progress                                   |
| Last updated  | 2026-04-29                                            |

## Phase Snapshot

| Phase                               | Status      | Progress | Notes                                                                                         |
| ----------------------------------- | ----------- | -------: | --------------------------------------------------------------------------------------------- |
| Phase 1 — Platform shell            | Done        |     100% | Navigation, RBAC shell, shared states, admin foundation                                       |
| Phase 2 — CRM / Marketing / Intake  | Done        |     100% | Intake, CRM handoff, marketing spend links, project entry points                              |
| Phase 3 — Finance core              | Done (full) |     100% | Client Services runtime + flows done; Finance report definitions v1 and all six aggregates    |
| Phase 4 — Delivery ops              | Done        |     100% | Delivery, Work Space, task blockers and Support runtime bridges closed as foundation          |
| Phase 5 — Collaboration / knowledge | In progress |     ~58% | Drive-backed attachments, `documentImage` TipTap node, preview URLs, DOCUMENT library context |
| Phase 6 — Control layer             | Early       |     ~35% | Home dashboard typed API groundwork exists; Reports/Calendar Control Center later             |
| Phase 7 — Integrations / migration  | Not started |       0% | WhatsApp, bank/gov, Bitrix migration                                                          |

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

| Date       | Milestone                         | Result                                                                                              |
| ---------- | --------------------------------- | --------------------------------------------------------------------------------------------------- |
| 2026-04-29 | Phase 3 Finance full closure      | Client Services runtime/flows and all six Finance report aggregates done.                           |
| 2026-04-29 | Delivery lifecycle runtime        | Product/Extension canonical lifecycle, actions, board, filters and gates.                           |
| 2026-04-29 | Product Done readiness            | Done blocks real blockers and surfaces handoff/Drive/client gaps.                                   |
| 2026-04-29 | Tasks / Work Space foundation     | Work Space runtime, product UI, completion rules and blocker UX exist.                              |
| 2026-04-29 | Support runtime bridges           | Ticket -> Task, Change Request -> Extension Deal, coverage and SLA state.                           |
| 2026-04-29 | Phase 4 Delivery closure          | Review/Scrum/automation depth moved later; Phase 5 can start.                                       |
| 2026-04-29 | Drive file metadata foundation    | DB-backed File Assets, versions, links and metadata API foundation.                                 |
| 2026-04-29 | Phase 5 Documents plan            | Documents defined as standalone module with Drive-backed attachments.                               |
| 2026-04-29 | Drive upload session + library    | `FileUploadSession`, presigned PUT, complete → FileAsset+link, `GET /drive/library`.                |
| 2026-04-29 | Documents data foundation         | Prisma Document\*, `/api/documents`, `DOCUMENTS` RBAC, default sections, `documentsApi`.            |
| 2026-04-29 | Documents UI shell                | `/documents`, sections, tables, create dialog, detail + archive, sidebar `Documents`.               |
| 2026-04-29 | Documents native editor slice     | TipTap edit + read tabs, DOMPurify viewer, debounced save, `recordActivity: false` on API.          |
| 2026-04-29 | Documents Drive attachments slice | `POST/DELETE …/attachments`, `GET …/drive/files/:id/preview-url`, TipTap `documentImage`, panel UI. |

## Next Action

1. Continue Phase 5 per `docs/PHASE_5_COLLABORATION_KNOWLEDGE_PLAN.md`.
2. Next normal slice: **Slice 6 — Documents access, activity and search depth** (section ACL, search_vector, activity polish).
3. Keep Google v2, AI, complex approval workflow and credentials secrets out of the first Documents release.

## Slice DoD

- Behavior matches `docs/NBOS` and the Phase 3 gate.
- No fake financial, audit, credential or report data.
- Tests/typecheck/lint run for touched API/web/database areas.
- Docs updated only at milestone level.
- One end-of-slice commit bundles related code, tests and docs.
