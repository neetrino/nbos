# NBOS Implementation Progress

> Compact tracker for actual implementation state. Detailed behavior belongs in module docs, tests and commits.

## Current Focus

| Field         | Value                                                                               |
| ------------- | ----------------------------------------------------------------------------------- |
| Current phase | **Phase 3 — Finance full closure**                                                  |
| Current task  | Company P&L v1 aggregate and `/finance/reports` snapshot                            |
| Status        | Phase 3 pragmatic scope is closed; full closure is continuing from the product gate |
| Last updated  | 2026-04-29                                                                          |

## Phase Snapshot

| Phase                               | Status                   | Progress | Notes                                                                                           |
| ----------------------------------- | ------------------------ | -------: | ----------------------------------------------------------------------------------------------- |
| Phase 1 — Platform shell            | Done                     |     100% | Navigation, RBAC shell, shared states, admin foundation                                         |
| Phase 2 — CRM / Marketing / Intake  | Done                     |     100% | Intake, CRM handoff, marketing spend links, project entry points                                |
| Phase 3 — Finance core              | Full closure in progress |     ~88% | Client Services runtime + flows done; report definitions shell done; Company P&L v1 in progress |
| Phase 4 — Delivery ops              | Early                    |     ~10% | Tasks/support list foundations exist; full delivery lifecycle waits Phase 3 pause/close         |
| Phase 5 — Collaboration / knowledge | Not started              |       0% | Drive, credentials, messenger, notifications                                                    |
| Phase 6 — Control layer             | Early                    |     ~35% | Home dashboard typed API groundwork exists; Reports/Calendar Control Center later               |
| Phase 7 — Integrations / migration  | Not started              |       0% | WhatsApp, bank/gov, Bitrix migration                                                            |

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
- Finance report definitions shell: `GET /api/finance/reports/definitions`, `GET /api/finance/reports/definitions/:id`, `/finance/reports`.

In progress:

- `GET /api/finance/reports/company-pnl`: cash-basis incoming payments minus actual expense payments.
- `/finance/reports` Company P&L live snapshot.

Remaining Phase 3 Finance work:

- Finish and verify Company P&L v1.
- Continue report aggregates: Cash Flow, Expense Plan vs Actual, Project P&L, MRR / Subscription Revenue, Payroll Report.
- Optional Client Services depth only after report aggregates: detail page, CSV, stronger payment-driven automation.

## Recent Milestones

| Date       | Milestone                          | Result                                                               | Verification                                                          |
| ---------- | ---------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 2026-04-29 | Client Services runtime foundation | `client_service_records`, CRUD/stats API, `/finance/client-services` | db generate/format, api/web/database typecheck, lint, targeted Vitest |
| 2026-04-29 | Client Services flow actions       | Linked invoice, expense plan, expense and task actions               | api/web typecheck, lint, targeted Vitest                              |
| 2026-04-29 | Finance report definitions shell   | Six Phase 3 report definitions exposed in API and UI                 | api/web typecheck, lint, targeted Vitest                              |
| 2026-04-29 | Company P&L v1 aggregate           | In progress, verification pending                                    | Pending                                                               |

## Next Action

1. Finish Company P&L v1 verification and commit the slice.
2. Pick the next clean report aggregate: **Cash Flow** or **Expense Plan vs Actual**.
3. Return to Phase 4 delivery ops only after Phase 3 Finance is closed or explicitly paused.

## Slice DoD

- Behavior matches `docs/NBOS` and the Phase 3 gate.
- No fake financial, audit, credential or report data.
- Tests/typecheck/lint run for touched API/web/database areas.
- Docs updated only at milestone level.
- One end-of-slice commit bundles related code, tests and docs.
