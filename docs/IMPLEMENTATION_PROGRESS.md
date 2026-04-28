# NBOS Implementation Progress

> Daily progress tracker for implementation. This file answers: what is done, what is in progress, and where to continue.

## How To Use This File

Update this file when a slice is **meaningfully complete** (user-visible behavior, schema/API change, or closure of a roadmap track). **Do not log** micro-steps (single-line fixes, copy tweaks, one-off ESLint unless it unblocks release).

**Active Work Log:** one row per **milestone** only—see table below. Finer detail belongs in commits and module docs.

Use it together with:

- `docs/AI-START-HERE.md`
- `docs/NBOS/00-Documentation-Hub.md`
- `docs/NBOS/00-Implementation-Roadmap.md`

Rules:

- Roadmap defines the planned sequence.
- This file records actual progress.
- Module docs define business behavior.
- Cleanup registers are checklists for what must be fixed in code.
- **Git (slices):** prefer **one commit at the end** of each implementation slice with **all** related files together (same rule for small and large slices); see `docs/AI-START-HERE.md` step 5.
- All UI work must use the existing Tailwind + shadcn/ui stack and be implemented with polished NBOS visual quality: clean spacing, clear hierarchy, responsive layout, consistent cards/forms/tables, and subtle interaction states.

## Current Focus

| Field                | Value                                                                                                                                                    |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Current phase        | Phase 3 - Finance core                                                                                                                                   |
| Current module/block | Finance + Partners (cross-linked; bounded slices per roadmap)                                                                                            |
| Current task         | **Payroll** depth (runs, journal); **Bonus board** is API-backed under Finance nav; expense plan auto callable via **Scheduler** POST for external cron. |
| Status               | Open                                                                                                                                                     |
| Last updated         | 2026-04-29                                                                                                                                               |

## Phase Progress

| Phase                                            | Status      | Progress | Current blocker                | Notes                                                                   |
| ------------------------------------------------ | ----------- | -------: | ------------------------------ | ----------------------------------------------------------------------- |
| Phase 1 - Platform shell and foundations         | Done        |     100% | None                           | Full quality gate completed                                             |
| Phase 2 - CRM, Marketing and Lead-to-Cash intake | Done        |     100% | None                           | Closed after CRM, Marketing, Projects and Finance intake foundations    |
| Phase 3 - Finance core                           | In progress |     ~61% | None                           | Plan→Card manual + **auto due batch** + Board + Closed; payroll remains |
| Phase 4 - Delivery operations                    | Not started |       0% | Waits Projects/Tasks alignment | Product/Extension lifecycle                                             |
| Phase 5 - Collaboration and knowledge            | Not started |       0% | Waits core modules             | Drive, Credentials, Messenger, Notifications                            |
| Phase 6 - Control layer                          | Not started |       0% | Waits reliable source data     | Dashboard, Reports, Calendar views                                      |
| Phase 7 - Integrations and migration             | Not started |       0% | Waits stable workflows         | WhatsApp, bank/gov, Bitrix migration                                    |

### Phase 3 completion estimate (approximate)

Roadmap Phase 3 spans invoices, payments, subscriptions, expenses, partners/payouts, salary/bonus surfaces, and trustworthy aggregates. Percentages are planning hints only (not financial figures).

| Track                                                                                                                                    | Approx. complete |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------: |
| Operational money flows (orders ↔ invoices ↔ payments, subscriptions, reconciliation lists/stats)                                        |             ~60% |
| Partner linking + Finance drill-downs (subscriptions, orders, filtered stats) + **Partners UI errors**                                   |             ~55% |
| Expenses (ledger, backlog, **closed**, CSV, guards; **ExpensePlan** + **auto due** + `/plans` + manual card + **board** + `activeBoard`) |             ~56% |
| Payroll / bonus pools / operational journal                                                                                              |             ~12% |

**Phase 3 overall:** ~**61%** — money-flow surfaces, drill-downs, and expense **payment ledger** are in active use; **Expense Plan** + manual **Plan→Card** + **`POST …/actions/auto-generate-due`** (plans with `autoGenerate` and `nextDueDate` ≤ end of UTC day); main expenses list + stats default to **active board** scope; **Closed** paid list; NBOS kanban lanes. **Remaining for Phase 3 “done”:** **payroll / bonus** depth (wire external cron to `POST /api/scheduler/expense-plan-auto-due` when ready).

### Phase 3 — quick snapshot (where we are)

- **Money flows:** orders, invoices, payments, subscriptions — CRUD-ish lists, stats, reconciliation gap filters, create-invoice from order/subscription, mutation recovery banners, document titles.
- **Expenses:** backlog + **Closed**; partial payments + delete; ledger sync/guards; CSV; **Expense Plan** + **manual card** + **auto due** (finance API + **scheduler** POST for cron); **Expense Board** (`activeBoard`). **Next:** payroll.
- **Partners:** CRUD, primary contact, links into Finance; list/detail fetch and create/edit (incl. contacts preload) use **`getApiErrorMessage`** like Finance screens.
- **Payroll / bonus:** **Bonus board** (`GET /api/bonus` + stats, Finance sidebar) replaces mock UI; payroll runs/journal remain the main gap with expense canon.

## Active Work Log

**Policy:** one row per **milestone** (schema/API + meaningful UI, production gate, or track closure). Omit micro-slices.

| Date          | Done                                       | Scope                                                                                                                                                                                              | Verification                                                                                              | Next                                          |
| ------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| 2026-04-27    | Documentation launch + Phase 1 shell gates | `AI-START-HERE`, docs hub cleanup; nav/skeleton/RBAC alignment; shared empty/loading/error states                                                                                                  | `pnpm` lint / typecheck / build / test on repo scripts                                                    | Phase 2 intake                                |
| 2026-04-28    | Phase 2 closed; Phase 3 opened             | CRM/Marketing/Projects gates; subscriptions; invoices/payments; handoff; PM + Finance dashboards                                                                                                   | Full quality gate on closing slice                                                                        | Finance core vertical                         |
| 2026-04-28–29 | Phase 3 Finance + Expenses baseline        | Reconciliation gaps + drill-downs; subscriptions/partners/invoices; expense ledger/backlog/CSV/guards; Finance + Partners `getApiErrorMessage`; Finance tab titles                                 | Targeted Vitest + `tsc` + ESLint on touched apps                                                          | Expense Plan·Card track                       |
| 2026-04-29    | Core rules: NBOS pace delegation           | `00-core.mdc` v3.1 + `AI-START-HERE` cohesive-slice guidance                                                                                                                                       | Maintainer review                                                                                         | Roadmap-sized slices                          |
| 2026-04-29    | Expense Plan foundation (NBOS)             | Prisma `expense_plans` + optional `expenses.expense_plan_id`; `GET/POST/PUT/DELETE /api/expense-plans`; `/finance/expenses/plans` + subnav + create dialog                                         | `prisma migrate deploy` + expense-plans Vitest + api/web `tsc`                                            | Card from plan                                |
| 2026-04-29    | Expense Plan → Card (manual)               | `POST /expense-plans/:id/cards`; create expense with `expensePlanId`; `planNextDueAfterOccurrence` for recurring; web generate dialog on plans table                                               | Vitest (`expense-plan-next-due`, `expense-plans.service`) + `tsc` + ESLint                                | Board canon; optional auto-generate; payroll  |
| 2026-04-29    | Expense Board NBOS alignment               | Five kanban lanes + `resolveExpenseBoardColumn` (due window); `activeBoard` on `GET /expenses` + stats excludes `PAID`/`DELAYED` unless status filter set; web list/stats/CSV parity               | Vitest expense-board + kanban columns + build-expense-list-api-params + `expenses.service`; api/web `tsc` | Auto-generate; payroll; optional Closed route |
| 2026-04-29    | Expense Closed list (NBOS)                 | `/finance/expenses/closed` + subnav; fixed `PAID` scope (list-only); main header Backlog + Closed links; `expenseClosedPageTitle`                                                                  | Vitest filter helpers + build-expense-list-api-params; web `tsc` + ESLint                                 | Auto-generate from plan; payroll              |
| 2026-04-29    | Expense plan auto-generate (due)           | `POST /expense-plans/actions/auto-generate-due` (`asOf` optional); UTC end-of-day scope; plans UI **Run auto-generate** + Auto column; per-plan failure isolation                                  | Vitest `expense-plan-auto-due-scope` + `expense-plans.service`; api/web `tsc` + ESLint                    | Payroll; optional Nest cron / external runner |
| 2026-04-29    | Scheduler hook for plan auto-due           | `POST /scheduler/expense-plan-auto-due` → `ExpensePlansService.autoGenerateDuePlans`; `SchedulerModule` imports `ExpensesModule`; cleaned scheduler JSDoc                                          | Vitest `scheduler.service`; api `tsc` + ESLint                                                            | Payroll                                       |
| 2026-04-29    | Bonus board wired to Finance API           | `lib/api/bonus` + paginated fetch; `/bonus` uses Prisma-aligned types/status lanes, loading/error, Finance sidebar **Bonus board**; sidebar parent highlights finance children off `/finance` path | Web `tsc` + ESLint on touched files                                                                       | Payroll runs / journal                        |

## Phase 1 Checklist

### Goal

Make NBOS navigable, permission-aware and safe to extend.

### Scope

| Item                                      | Status | Notes                                                                       |
| ----------------------------------------- | ------ | --------------------------------------------------------------------------- |
| UI Shell canon reviewed                   | Done   | Navigation, cleanup, My Company and Settings/Admin docs reviewed            |
| UI visual quality pass                    | Done   | Foundation screens use existing Tailwind + shared components                |
| Sidebar navigation aligned with canon     | Done   | Canonical top-level shell and permission-aware children completed           |
| Global header `Create` removed            | Done   | Creation stays contextual by module                                         |
| `Team` moved under My Company             | Done   | Sidebar now links to `My Company -> Team`                                   |
| `Departments` moved under My Company      | Done   | Sidebar now links to `My Company -> Departments`                            |
| `My Account` moved outside Settings       | Done   | Header user menu remains the entry point                                    |
| My Company skeleton implemented           | Done   | Foundation dashboard uses employees, departments and roles data             |
| Settings/Admin skeleton implemented       | Done   | System admin sections, RBAC UI and protected system list states added       |
| RBAC visibility checked                   | Done   | Parent and child sidebar items hide when module-level access is unavailable |
| Shared empty/loading/error states checked | Done   | Shared LoadingState/ErrorState adopted by key list screens                  |
| Audit foundation checked                  | Done   | System list, role and department admin mutations write audit records        |

### Key Docs

- `docs/NBOS/05-UI-Specifications/01-Navigation-Structure.md`
- `docs/NBOS/05-UI-Specifications/06-UI-Shell-Cleanup-Register.md`
- `docs/NBOS/02-Modules/07-My-Company/*`
- `docs/NBOS/02-Modules/16-Settings-Admin/*`

## Module Progress Matrix

| Module / Area               | Docs ready | Code checked | Implemented | Tested  | Status / Notes                                                                                                                                                                                                                                                                                                                                                               |
| --------------------------- | ---------- | ------------ | ----------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Platform Shell / Navigation | Yes        | Yes          | Done        | Yes     | Phase 1 shell foundation completed                                                                                                                                                                                                                                                                                                                                           |
| Shared UI States            | Yes        | Yes          | Done        | Yes     | Loading/error/empty state baseline completed                                                                                                                                                                                                                                                                                                                                 |
| My Company                  | Yes        | Yes          | Partial     | Yes     | Foundation dashboard completed; deep HR/payroll later                                                                                                                                                                                                                                                                                                                        |
| Settings / Admin            | Yes        | Yes          | Partial     | Yes     | Admin/audit foundation completed; deep settings later                                                                                                                                                                                                                                                                                                                        |
| CRM                         | Yes        | Yes          | Partial     | Partial | Offer/contract, Deal Won, handoff visibility and popup shortcuts done                                                                                                                                                                                                                                                                                                        |
| Marketing                   | Yes        | Yes          | Partial     | Partial | Launch gates, Finance spend links, performance and efficiency snapshots added                                                                                                                                                                                                                                                                                                |
| Finance                     | Yes        | Yes          | Partial     | Partial | Orders/invoices/payments/subscriptions/expenses + reconciliation; partner filters; expense backlog + **Closed** + ledger, CSV, guards; **Expense Plan** + **manual + auto due Plan→Card** + **NBOS board** (`activeBoard`); **Bonus board** (`/bonus` → `GET /api/bonus` + stats, no mock money); optional `expense_plan_id`; tab title helpers; legacy `/expenses` redirect |
| Partners                    | Yes        | Yes          | Partial     | Partial | List/detail/create/edit; contact link; Finance drill-downs; **list/detail + dialogs use `getApiErrorMessage`** (incl. contacts dropdown load failures)                                                                                                                                                                                                                       |
| Projects Hub                | Yes        | Yes          | Partial     | Partial | PM intake, Product/Extension readiness, Done gates and blocker shortcuts added                                                                                                                                                                                                                                                                                               |
| Tasks / Work Spaces         | Yes        | No           | No          | No      | Phase 4                                                                                                                                                                                                                                                                                                                                                                      |
| Support                     | Yes        | No           | No          | No      | Phase 4                                                                                                                                                                                                                                                                                                                                                                      |
| Drive                       | Yes        | No           | No          | No      | Phase 5                                                                                                                                                                                                                                                                                                                                                                      |
| Credentials                 | Yes        | No           | No          | No      | Phase 5                                                                                                                                                                                                                                                                                                                                                                      |
| Messenger                   | Yes        | No           | No          | No      | Phase 5                                                                                                                                                                                                                                                                                                                                                                      |
| Notifications               | Yes        | No           | No          | No      | Phase 5                                                                                                                                                                                                                                                                                                                                                                      |
| Calendar                    | Yes        | No           | No          | No      | Phase 6                                                                                                                                                                                                                                                                                                                                                                      |
| Dashboard Control Center    | Yes        | No           | No          | No      | Phase 6                                                                                                                                                                                                                                                                                                                                                                      |
| Reports / Analytics         | Yes        | No           | No          | No      | Phase 6                                                                                                                                                                                                                                                                                                                                                                      |
| Integrations / Migration    | Partial    | No           | No          | No      | Phase 7                                                                                                                                                                                                                                                                                                                                                                      |

## Definition Of Done For Each Slice

A slice is done only when:

- code behavior matches the relevant module docs;
- required tests/checks are run or explicitly skipped with reason;
- UI does not crash when linked modules/data are missing;
- no fake financial, credential, audit or report data is introduced;
- this progress file is updated **for milestones** (Active Work Log policy);
- an **end-of-slice** commit with a clear message bundles **all** related changes (avoid splitting one slice across many commits unless fixing the same slice’s CI).

## Next Action

Continue Phase 3 with **coherent slices** (one narrative per iteration, one commit when practical). **Polish** (titles, error text, banners) is largely caught up—**next gains** are mostly **product/schema-sized**.

**Suggested order (adjust with product):**

1. **Expense automation (ops)** — wire external cron to **`POST /api/scheduler/expense-plan-auto-due`** (or `…/expense-plans/actions/auto-generate-due` with `asOf`); optional Nest `@Cron` later.
2. **Payroll / bonus / operational journal** — smallest vertical per `docs/NBOS` once staffing canon is clear.
3. **Invoice / subscription lifecycle** — deeper edge cases only when roadmap prioritizes them; keep **no fabricated money state**.

**Already shipped (do not re-scope as “next” unless regression):** expense sort/URL/CSV, backlog route, **Closed** paid route, partial payments + sync guards, Finance `getApiErrorMessage` sweep, mutation banners, Finance tab title helpers, Partners `getApiErrorMessage` parity, **Expense Plan + manual card from plan**, **NBOS Expense Board (five lanes + activeBoard scope)**, **auto-generate due plans (finance API + plans UI + scheduler POST)**.

```text
Phase 3 slice ideas (pick one cohesive unit per iteration):
- Expenses: partial payments, backlog, **Closed list**, ledger, **Plan + manual card + auto due + scheduler POST + NBOS board + activeBoard**—shipped; **next = payroll** (by agreement).
- Subscriptions/invoices: lifecycle depth when roadmap calls for it (no fake money states).
- Partners: CRUD + drill-downs + error parity—baseline done; payouts/advanced tiers only when canon demands.
- Server-side reporting or bulk exports when product confirms priorities.
```
