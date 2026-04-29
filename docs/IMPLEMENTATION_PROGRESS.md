# NBOS Implementation Progress

> Compact tracker for actual implementation state. Detailed behavior belongs in module docs, tests and commits.

## Current Focus

| Field         | Value                                         |
| ------------- | --------------------------------------------- |
| Current phase | **Phase 4 — Delivery ops**                    |
| Current task  | Delivery lifecycle canonical projection       |
| Status        | Phase 4 started after Phase 3 Finance closure |
| Last updated  | 2026-04-29                                    |

## Phase Snapshot

| Phase                               | Status      | Progress | Notes                                                                                      |
| ----------------------------------- | ----------- | -------: | ------------------------------------------------------------------------------------------ |
| Phase 1 — Platform shell            | Done        |     100% | Navigation, RBAC shell, shared states, admin foundation                                    |
| Phase 2 — CRM / Marketing / Intake  | Done        |     100% | Intake, CRM handoff, marketing spend links, project entry points                           |
| Phase 3 — Finance core              | Done (full) |     100% | Client Services runtime + flows done; Finance report definitions v1 and all six aggregates |
| Phase 4 — Delivery ops              | In progress |     ~15% | Tasks/support list foundations exist; canonical delivery lifecycle projection started      |
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

## Next Action

1. Continue Projects Hub lifecycle refactor: real pause fields and terminal `Cancelled` naming.
2. Keep Phase 6 control/reporting work out of Phase 4 unless explicitly reprioritized.

## Slice DoD

- Behavior matches `docs/NBOS` and the Phase 3 gate.
- No fake financial, audit, credential or report data.
- Tests/typecheck/lint run for touched API/web/database areas.
- Docs updated only at milestone level.
- One end-of-slice commit bundles related code, tests and docs.
