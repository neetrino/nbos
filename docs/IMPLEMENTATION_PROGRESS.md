# NBOS Implementation Progress

> Compact tracker for actual implementation state. Detailed behavior belongs in module docs, tests and commits.

## Current Focus

| Field         | Value                          |
| ------------- | ------------------------------ |
| Current phase | **Phase 4 — Delivery ops**     |
| Current task  | Expired On Hold visibility     |
| Status        | Phase 4 Projects Hub lifecycle |
| Last updated  | 2026-04-29                     |

## Phase Snapshot

| Phase                               | Status      | Progress | Notes                                                                                      |
| ----------------------------------- | ----------- | -------: | ------------------------------------------------------------------------------------------ |
| Phase 1 — Platform shell            | Done        |     100% | Navigation, RBAC shell, shared states, admin foundation                                    |
| Phase 2 — CRM / Marketing / Intake  | Done        |     100% | Intake, CRM handoff, marketing spend links, project entry points                           |
| Phase 3 — Finance core              | Done (full) |     100% | Client Services runtime + flows done; Finance report definitions v1 and all six aggregates |
| Phase 4 — Delivery ops              | In progress |     ~84% | Delivery UI highlights expired On Hold states from existing lifecycle data                 |
| Phase 5 — Collaboration / knowledge | Not started |       0% | Drive, credentials, messenger, notifications                                               |
| Phase 6 — Control layer             | Early       |     ~35% | Home dashboard typed API groundwork exists; Reports/Calendar Control Center later          |
| Phase 7 — Integrations / migration  | Not started |       0% | WhatsApp, bank/gov, Bitrix migration                                                       |

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

| Date       | Milestone                          | Result                                                                   | Verification                                                          |
| ---------- | ---------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| 2026-04-29 | Client Services runtime foundation | `client_service_records`, CRUD/stats API, `/finance/client-services`     | db generate/format, api/web/database typecheck, lint, targeted Vitest |
| 2026-04-29 | Client Services flow actions       | Linked invoice, expense plan, expense and task actions                   | api/web typecheck, lint, targeted Vitest                              |
| 2026-04-29 | Finance report definitions shell   | Six Phase 3 report definitions exposed in API and UI                     | api/web typecheck, lint, targeted Vitest                              |
| 2026-04-29 | Company P&L v1 aggregate           | `GET /api/finance/reports/company-pnl` and live UI snapshot              | api/web typecheck, lint, targeted Vitest                              |
| 2026-04-29 | Cash Flow v1 aggregate             | `GET /api/finance/reports/cash-flow` and live UI snapshot                | api/web typecheck, lint, targeted Vitest                              |
| 2026-04-29 | Expense Plan vs Actual v1          | `GET /api/finance/reports/expense-plan-vs-actual` and live UI snapshot   | api/web typecheck, lint, targeted Vitest                              |
| 2026-04-29 | MRR / Subscription Revenue v1      | `GET /api/finance/reports/mrr-subscription-revenue` and live UI snapshot | api/web typecheck, lint, targeted Vitest                              |
| 2026-04-29 | Payroll Report v1                  | `GET /api/finance/reports/payroll` and live UI snapshot                  | api/web typecheck, lint, targeted Vitest                              |
| 2026-04-29 | Project P&L v1                     | `GET /api/finance/reports/project-pnl` and live UI snapshot              | api/web typecheck, lint, targeted Vitest                              |
| 2026-04-29 | Phase 3 Finance full closure       | Gate scope completed; Phase 4 can start                                  | Final docs closure                                                    |
| 2026-04-29 | Delivery lifecycle projection      | Product/Extension API exposes canonical lifecycle over legacy statuses   | api/web typecheck, targeted Vitest                                    |
| 2026-04-29 | Delivery lifecycle schema fields   | Added `stage`, `workStatus`, `resolution` and pause fields for delivery  | database/api typecheck, targeted Vitest                               |
| 2026-04-29 | Delivery lifecycle actions         | Product/Extension pause, resume and cancel endpoints                     | api/web typecheck, targeted Vitest                                    |
| 2026-04-29 | Delivery lifecycle stage actions   | Product/Extension canonical stage endpoint and UI stage controls         | api/web typecheck, lint, targeted Vitest                              |
| 2026-04-29 | Delivery lifecycle complete action | Product/Extension canonical completion endpoint and UI terminal controls | api/web typecheck, lint, targeted Vitest                              |
| 2026-04-29 | Delivery lifecycle action UI       | Product/Extension pause, resume and cancel controls in delivery UI       | web typecheck, lint                                                   |
| 2026-04-29 | Delivery Board v1                  | Project shell board over active Product and Extension delivery cards     | web typecheck, lint                                                   |
| 2026-04-29 | Delivery Board controls            | Board filters, quick stage/resume/done actions and closed depth          | web typecheck, lint                                                   |
| 2026-04-29 | Delivery Board cancel flow         | Board-level cancel dialog with required reason and canonical endpoints   | web typecheck, lint                                                   |
| 2026-04-29 | Delivery Board task/support depth  | Card context links into Product tasks, support tickets and extensions    | web typecheck, lint                                                   |
| 2026-04-29 | Product task/support summaries     | Product tabs expose execution and support health from runtime data       | web typecheck, lint                                                   |
| 2026-04-29 | Delivery lifecycle docs cleanup    | CRM/handoff and UI docs now separate handoff from Projects Hub lifecycle | docs review                                                           |
| 2026-04-29 | Extension product ownership        | Extension create/update requires same-project primary Product link       | api/web typecheck, lint, targeted Vitest                              |
| 2026-04-29 | Extension product schema hardening | `extensions.product_id` migration guarded against legacy null rows       | db generate/format, api/web/database typecheck, lint, targeted Vitest |
| 2026-04-29 | Product detail delivery polish     | Product detail header/overview shows canonical delivery lifecycle        | web typecheck, lint                                                   |
| 2026-04-29 | Stage-gate UX depth                | Product/Extension gates show clearer next moves and blocker labels       | web typecheck, lint                                                   |
| 2026-04-29 | Stage-gate runtime depth           | Product QA/Transfer gates block while Product tasks are still open       | api typecheck, lint, targeted Vitest                                  |
| 2026-04-29 | Product Done finance gate          | Product Done blocks when linked order invoices are not paid              | api typecheck, lint, targeted Vitest                                  |
| 2026-04-29 | Product Done order gate            | Product Done blocks while linked order is not fully paid or closed       | api typecheck, lint, targeted Vitest                                  |
| 2026-04-29 | Legacy status compatibility        | Project shell/UI prefers canonical lifecycle; old status remains mirror  | api/web typecheck, lint, targeted Vitest                              |
| 2026-04-29 | Generic status UI retirement       | Product/Extension lifecycle controls use canonical endpoints only        | web typecheck, lint                                                   |
| 2026-04-29 | Backend status deprecation         | Generic status endpoints now expose deprecation signal                   | api typecheck, lint                                                   |
| 2026-04-29 | Lifecycle query filters            | Product/Extension lists accept canonical lifecycle query params          | api typecheck, targeted Vitest                                        |
| 2026-04-29 | Expired On Hold visibility         | Delivery UI highlights overdue paused Product/Extension work             | web typecheck, lint                                                   |

## Next Action

1. Continue Projects Hub lifecycle refactor: Done acceptance/credentials runtime depth.
2. Keep Phase 6 control/reporting work out of Phase 4 unless explicitly reprioritized.

## Slice DoD

- Behavior matches `docs/NBOS` and the Phase 3 gate.
- No fake financial, audit, credential or report data.
- Tests/typecheck/lint run for touched API/web/database areas.
- Docs updated only at milestone level.
- One end-of-slice commit bundles related code, tests and docs.
