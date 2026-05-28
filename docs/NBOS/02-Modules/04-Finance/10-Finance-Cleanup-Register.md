# Finance Cleanup Register

> NBOS Finance - что уже совпадает с новым каноном, что устарело только в документации, а что требует будущего runtime refactor.

**Compensation / Payroll / Wallet MVP (2026-05):** shipped in runtime. **Что осталось** — только в корневом [`todo.md`](../../../../todo.md) и [`12-Compensation-Roadmap-Implementation-Audit.md`](./12-Compensation-Roadmap-Implementation-Audit.md) (policy engine, product decisions, мелкие UX gaps, QA).

## Назначение

Этот файл фиксирует хвосты после пересборки Finance-канона.

Новый Finance canon теперь включает:

- `Invoice Card / Карточка ожидаемой оплаты`;
- `Payment / Факт входящей оплаты`;
- `Subscription / Подписка` с monthly coverage;
- `Client Service Record / Карточка сервиса клиента`;
- `Expense Plan / План расхода`;
- `Expense Card / Карточка расхода`;
- `Expense Payment / Оплата расхода`;
- `Expense Backlog / Долги и отложенные расходы`;
- `Compensation Profile / Профиль оплаты сотрудника`;
- `Payroll Run / Зарплатный расчёт`;
- `Salary Line / Строка сотрудника в payroll`;
- `Product Bonus Pool / Бонусный фонд продукта`;
- `Bonus Release / Выпуск бонуса к выплате`;
- `Employee Wallet / read-only кошелёк сотрудника`;
- `Operational Journal / Операционный журнал`;
- `Company / Project / Product / Order P&L`.

---

## A. Already aligned / Уже совпадает с каноном

### A1. Finance docs are now centered on the right domain objects

Статус: `OK DOCS`

Новые документы уже описывают Finance не как набор старых досок, а как систему денежных сущностей и процессов:

- [02-Invoices-and-Payments.md](./02-Invoices-and-Payments.md)
- [03-Subscriptions.md](./03-Subscriptions.md)
- [04-Expenses.md](./04-Expenses.md)
- [05-Bonus-and-Payroll.md](./05-Bonus-and-Payroll.md)
- [06-PnL-Reports.md](./06-PnL-Reports.md)
- [07-Domains-Hosting-Licenses.md](./07-Domains-Hosting-Licenses.md)
- [08-Employee-Wallet.md](./08-Employee-Wallet.md)
- [09-Finance-Core-Architecture.md](./09-Finance-Core-Architecture.md)

### A2. Core entities document reflects new Finance model

Статус: `OK DOCS`

[03-Core-Entities-and-Data-Model.md](../../01-Platform-Overview/03-Core-Entities-and-Data-Model.md) уже описывает:

- `Invoice Card`;
- `Subscription` coverage fields;
- `Expense Plan / Expense Card / Expense Payment`;
- `Compensation Profile`;
- `Payroll Run`;
- `Salary Line`.
- `Product Bonus Pool`;
- `Bonus Release`.

### A3. Bonus lifecycle needs cleanup after removing legacy holdback

Статус: `PARTIAL RUNTIME ALIGNMENT`

Runtime ещё содержит расширенный `BonusStatusEnum`:

- `INCOMING`;
- `EARNED`;
- `PENDING_ELIGIBILITY`;
- `VESTED`;
- `ACTIVE`;
- `PAID`;
- `CLAWBACK`.

`HOLDBACK` уже удалён из активного канона. Будущий refactor должен убрать legacy `HOLDBACK` / holdback fields из runtime и выровнять выпуск бонусов через `Product Bonus Pool`, `Bonus Release`, `Payroll Run`, `Salary Line`, `Expense Card` и `Employee Wallet`.

### A4. Payroll Run Workspace v2 + Unit Economics Board (2026-05)

Статус: `SHIPPED` (`e73b88f4` … `84d40c50` on `development`) — **per-unit invoice/payment drill-down и bonus policy engine — не закрыты**

**Сделано в runtime + UI:**

- `GET/PATCH` payroll allocation matrix (employees × delivery payable units), layout persistence, cell release edit;
- matrix: column/row DnD, pin, reset layout, planned bonus edit, recipient reassign, manual gray-cell bonus, validation banner, cell audit read;
- pre-review/approve matrix validation; carry/KPI notify on matrix attach;
- `GET /api/unit-economics` + `/finance/unit-economics` tabs: Overview, Funding/cash, Expenses, Profitability, Bonus pools;
- Bonus Board manual create: `title`, `reason`, `originalAmount`, audit log; audit panel on entry sheet + matrix cell dialog;
- docs: `05-Bonus-and-Payroll`, `04-Finance-Pages`, `03-Core-Entities`, `06-PnL-Reports` (matrix + UE sections).

**Остаётся:**

- Unit Economics: dedicated Invoices & Payments drill-down per delivery unit (beyond aggregate columns);
- bonus recipient full history UI (beyond last N audit rows);
- layout-change audit (optional);
- full matrix E2E / manual QA checklist in `todo.md` Phase 8.

### A5. Compensation MVP UX aligned with Bitrix-style flow

Статус: `MVP SHIPPED` (2026-05) — **policy engine и My Company policies — не закрыты**

**Сделано в runtime + UI:**

- `PayrollRun`, `SalaryLine`, `BonusRelease`, product bonus pool roll-ups;
- approve → expense card → `Expense Payment` → `syncSalaryLinePaidFromExpenseLedger`;
- `/finance/salary` (grid/cards/list/board + month sheet), `/finance/payroll/[id]` workspace;
- `/finance/bonuses` (+ legacy `/bonus` redirect), `/finance/bonus-pools`, `/finance/unit-economics`;
- Pay Now payroll filters + expense sheet links to month sheet / payroll run;
- `/my-account/wallet` read-only month cards + month-detail;
- `GET …/salary-lines/:id/month-detail` (Finance + wallet scope);
- CSV exports (salary board, bonus board, pools, wallet, payroll lines);
- Sales KPI gate on payroll run + read-only hint in month sheet.

**Остаётся (см. `todo.md`):**

- автоматический **cap / carry-over / burned KPI** (policy engine);
- employee breakdown inside bonus pool rows;
- department filter on salary board (если нужен);
- product decisions (wallet sheet variant, Pay Now default, …).

---

## B. Docs stale only / Устарело только в документации

### B1. Delta/backlog documents still mention old deal wording

Статус: `STALE SUPPORTING DOC`

[00-Delta-New-Description.md](../../00-Delta-New-Description.md) и старые supporting notes могут всё ещё упоминать `New / Upsell` как старую формулировку.

Решение:

- не считать эти файлы активным Finance-каноном;
- использовать их только как backlog / historical delta.

### B2. Notifications doc old deal taxonomy resolved

Статус: `RESOLVED IN NOTIFICATIONS PASS`

[01-Notifications-System.md](../13-Notifications/01-Notifications-System.md) теперь использует canonical Deal Types:

- `PRODUCT`;
- `EXTENSION`;
- `MAINTENANCE`;
- `OUTSOURCE`.

`Upsell` больше не описывается как runtime Deal Type.

---

## C. Runtime stale / Устарело в коде и требует refactor

### C1. Invoice Card money layer vs legacy pipeline

Статус: `PARTIAL RUNTIME ALIGNMENT` (legacy invoice pipeline enum **removed**)

**Сделано (срез 2026-05):**

- Колонка `Invoice.status` и enum `InvoiceStatusEnum` удалены из Prisma; миграция
  `20260506210000_drop_invoice_legacy_status` (backfill legacy `FAIL` → `money_status` `CANCELLED`).
- Единый слой статуса инвойса в API/UI: `moneyStatus` / `InvoiceMoneyStatusEnum`
  (`NEW`, `AWAITING_PAYMENT`, `OVERDUE`, `ON_HOLD`, `PAID`, `CANCELLED`).
- Список/фильтр/канбан/статистика/CSV и потребители (CRM, projects, client-services, payments и т.д.)
  опираются на `moneyStatus`; нет `PATCH …/status` и нет companion-синка legacy↔money.

**Канон (без изменений по смыслу):**

- `Invoice Card` = карточка денег, которые клиент должен заплатить;
- official invoice request — отдельный блок: `tax_status`, маркеры запроса/отправки, даты;
- уведомления — правила автоматизации, не «стадии доски».

**Уже было ранее:**

- `InvoiceCardRemindersService` — idempotent `NotificationEvent` / `NotificationJob` для правил Invoice Card;
  пропуск `ON_HOLD`, `notificationsEnabled = false`, Tax без маркера official invoice.

**Остаётся:**

- углубить поля official invoice request и шаблоны каналов;
- добить scheduler/reminder логику после полноты official-invoice блока в runtime;
- summary/order rollup — по мере появления полей (см. C8).

### C2. Subscription runtime still uses old status model

Статус: `STALE CODE`

Runtime сейчас использует:

- `ACTIVE`;
- `PAUSED`;
- `CANCELLED`.

Примеры мест:

- [packages/shared/src/constants/index.ts](../../../../packages/shared/src/constants/index.ts)
- [packages/database/prisma/schema.prisma](../../../../packages/database/prisma/schema.prisma)
- [apps/web/src/features/finance/constants/finance.ts](../../../../apps/web/src/features/finance/constants/finance.ts)
- [apps/web/src/features/projects/components/tabs/FinanceTab.tsx](../../../../apps/web/src/features/projects/components/tabs/FinanceTab.tsx)

Новый канон:

- `Pending`;
- `Active`;
- `On Hold`;
- `Cancelled`;
- `Completed`.

Также missing runtime:

- `billing_frequency = Monthly / Yearly / Custom`;
- `base_monthly_amount`;
- `billing_start_date` as activation date;
- invoice coverage fields: `coverage_start_month`, `coverage_month_count`;
- monthly coverage view in subscription grid.

### C3. Expense runtime still uses old status model and single Expense entity

Статус: `STALE CODE`

Runtime сейчас использует старые statuses:

- `THIS_MONTH`;
- `PAY_NOW`;
- `DELAYED`;
- `ON_HOLD`;
- `PAID`;
- `UNPAID`;
- frontend also still has `OLD`.

Примеры мест:

- [packages/shared/src/constants/index.ts](../../../../packages/shared/src/constants/index.ts)
- [packages/database/prisma/schema.prisma](../../../../packages/database/prisma/schema.prisma)
- [apps/api/src/modules/expenses/expenses.service.ts](../../../../apps/api/src/modules/expenses/expenses.service.ts)
- [apps/web/src/features/finance/constants/finance.ts](../../../../apps/web/src/features/finance/constants/finance.ts)
- [apps/web/src/app/(app)/finance/expenses/page.tsx](<../../../../apps/web/src/app/(app)/finance/expenses/page.tsx>)

Новый канон:

- `Expense Plan`;
- `Expense Card`;
- `Expense Payment`;
- `Expense Backlog`;
- partial payments through `Expense Payment`;
- status split:
  - workflow: `Planned / Due Soon / Due Now / Overdue / On Hold / Backlog / Paid / Cancelled`;
  - payment: `Unpaid / Partially Paid / Paid`.

Done slice:

- Partial and full outgoing payments are implemented via `ExpensePayment` (`expense-payment-create.ts`),
  with ledger `paymentStatus` `UNPAID` / `PARTIAL` / `PAID` and guards when editing expense amount.
- Payroll-linked salary expenses sync `SalaryLine.paidAmount` / `remainingAmount` / `PARTIALLY_PAID`
  through `payroll-salary-line-ledger-sync.ts`.

Будущий refactor:

- split existing expense model or introduce new tables;
- add backlog reason;
- update expense board routes and UI;
- update P&L and cash flow sources.

### C4. Payroll / compensation runtime

Статус: `MVP SHIPPED` — **Compensation Profile + universal policy engine still `MISSING`**

**Уже в runtime (не «только employee salary fields»):**

- `PayrollRun`, `SalaryLine`, `BonusEntry`, `BonusRelease`, pool sync;
- expense materialization on approval; partial/full pay via `ExpensePayment` + salary line sync;
- sales KPI scale at bonus attach (`sales-kpi-payroll-payout`);
- Finance + wallet projections (`salary-line-month-detail`, wallet snapshot).

**Остаётся:**

- versioned **`Compensation Profile`** as source of truth (My Company — см. [06-My-Company-Cleanup-Register](../07-My-Company/06-My-Company-Cleanup-Register.md) C1–C3);
- universal **Bonus / KPI Policy** templates (not only sales policy rows);
- **policy engine:** cap, carry-over, burned KPI ledger lines;
- deeper automatic release rules + manual override audit beyond current release types;
- optional: payroll runs list **board/calendar** views.

### C5. Client Service Record runtime foundation

Статус: `PARTIAL RUNTIME ALIGNMENT`

New canon unifies:

- Domain;
- Hosting;
- Service;
- Account;
- License.

Runtime now has first-class `ClientServiceRecord` foundation:

- Prisma `client_service_records`;
- optional links from `Invoice`, `ExpensePlan`, and `Expense`;
- `GET/POST/PUT/DELETE /api/client-services` + stats;
- Finance `/finance/client-services` list/create/edit/delete UI;
- service actions for linked Invoice Card, Expense Plan, Expense Card and Task (`TaskLink`).

`Domain` still exists as the older inventory entity and has not yet been migrated/wrapped into the general service model.

Remaining runtime refactor:

- migrate / wrap domain logic into the general service model;
- ~~client-paid automation after full invoice payment: purchase task + provider expense card (idempotent; triggered from payment create when `moneyStatus` becomes PAID)~~ — done in runtime;
- connect to `Credential` and Drive File Assets for receipts/proofs/provider documents.

Finance runtime also needs Drive alignment:

- invoice/payment/expense attachments should become Drive File Assets;
- proofs should use finance-restricted visibility;
- provider receipts for Client Service Records should link to Drive;
- payroll and partner payout exports should be generated as Drive files with audit.

### C6. Operational Journal and period close are not implemented

Статус: `MISSING CODE`

New canon requires:

- append-only operational journal;
- cash/accrual basis;
- dimensions: company, project, product, order, employee;
- period close;
- adjustment entries instead of silent edits in closed periods;
- future path to double-entry.

Runtime does not yet implement this layer.

### C6a. Finance report definitions v1 shell + aggregates

Статус: `PHASE 3 V1 RUNTIME ALIGNMENT`

Runtime now exposes the Phase 3 report catalog boundary and all approved v1 aggregates:

- `GET /api/finance/reports/definitions`;
- `GET /api/finance/reports/definitions/:id`;
- `GET /api/finance/reports/company-pnl`;
- `GET /api/finance/reports/project-pnl`;
- `GET /api/finance/reports/cash-flow`;
- `GET /api/finance/reports/expense-plan-vs-actual`;
- `GET /api/finance/reports/mrr-subscription-revenue`;
- `GET /api/finance/reports/payroll`;
- Finance `/finance/reports` UI;
- Company P&L cash-basis snapshot on `/finance/reports`;
- Project P&L cash-basis project profitability snapshot on `/finance/reports`;
- Cash Flow real movement + 30/60/90 forecast snapshot on `/finance/reports`;
- Expense Plan vs Actual plan/card/payment category snapshot on `/finance/reports`;
- MRR / Subscription Revenue active MRR + paid revenue snapshot on `/finance/reports`;
- Payroll Report payable/paid/remaining + revenue ratio snapshot on `/finance/reports`;
- six approved definitions: Company P&L, Project P&L, Cash Flow, MRR / Subscription Revenue, Expense Plan vs Actual, Payroll Report.

Remaining future refactor:

- keep global report scheduling, BI catalog and advanced analytics in Phase 6;
- connect aggregates to Operational Journal once period close exists.

### C7. Finance UI still contains old board assumptions

Статус: `PARTIAL` (инвойсы выровнены по money layer; расходы/подписки — старые допущения)

Frontend:

- **Invoices:** доска и фильтры используют **money stages** (`INVOICE_MONEY_STAGES` / `moneyStatus`), не legacy pipeline enum.
- expense pages still use `THIS_MONTH / PAY_NOW / DELAYED / ON_HOLD / OLD` (workflow канона Expense Card — в C3);
- subscription UI still uses `PAUSED` и т.д. (C2);
- project finance tab: проверять оставшиеся места на старые имена там, где ещё не переведено на money/expense канон.
- ~~Salary Board matrix~~ — **done** (`/finance/salary`, views + month sheet); ~~Bonus Board~~ — **done** (`/finance/bonuses`).

Будущий refactor:

- rebuild remaining Finance UI around:
  - Invoice Cards (money layer — база есть; official invoice block в UI — по полям runtime);
  - Subscription Grid with coverage;
  - Client Services (foundation done);
  - Expense Plans / Expense Board / **Expense Backlog** separation;
  - P&L / Cash Flow / Journal View.

### C8. Finance summary and scheduler logic still use old status semantics

Статус: `PARTIAL`

Examples:

- [apps/api/src/modules/finance/summary/summary.service.ts](../../../../apps/api/src/modules/finance/summary/summary.service.ts)
- [apps/api/src/modules/scheduler/scheduler.service.ts](../../../../apps/api/src/modules/scheduler/scheduler.service.ts)
- [apps/api/src/modules/finance/finance-status.utils.ts](../../../../apps/api/src/modules/finance/finance-status.utils.ts)

`summary.service.ts` exposes domain-driven `invoiceCards` and `expenseCards`; агрегат по инвойсам для
дашборда группирует **`moneyStatus`** (ключ `status` в JSON — значение money enum). `scheduler.service.ts`
не переводит `ON_HOLD` invoice cards в `DELAYED`. Legacy **`InvoiceStatusEnum` / колонка `status` удалены**;
`finance-status.utils.ts` и order rollup используют money layer для оплаты заказа.

Remaining refactor:

- finish expected incoming from official invoice/payment request fields;
- ~~expose expense `due now` separately (`DUE_NOW` workflow status bucket on dashboard summary)~~ — done in runtime;
- replace subscription statuses and coverage fields.

---

## D. Implementation backlog / Что потом реализовать

1. ~~Replace `InvoiceStatusEnum` with Invoice Card money-status model~~ — **done:** `moneyStatus` only;
   **осталось:** official invoice request fields + channel templates depth (см. C1).
2. Add notification/reminder automation based on invoice card rules, not invoice board stages.
3. Replace subscription statuses and add billing coverage fields.
4. Add `Expense Plan`, `Expense Card`, `Expense Payment`, `Expense Backlog`.
5. ~~Add partial outgoing payments for expenses and salary.~~ Done (`ExpensePayment` + salary line sync).
6. Add `Client Service Record` and connect it to invoice/expense/task/credential (foundation done; domain migration — C5).
7. ~~`Payroll Run` / `Salary Line` / `Bonus Release` / pool roll-ups / compensation month UI / wallet read model.~~ **MVP done.** Remaining: **`Compensation Profile`**, **policy engine** (cap/carry-over/burned) — `todo.md`.
8. Add automatic subscription delivery bonus release after Product / Extension done, with manual override (partial: release types + attach/detach; full policy automation pending).
9. ~~`Employee Wallet` read model.~~ Done (`/my-account/wallet`).
10. Add Finance report aggregate endpoints behind the v1 definitions shell.
11. Add `Operational Journal`, period close and adjustment flow.
12. Rebuild **remaining** Finance UI (expense backlog split, subscription coverage, journal) — compensation routes **shipped**.
13. Update finance dashboard/summary/scheduler logic.
14. Add tests for all transition and generation rules.

---

## E. Recommended implementation order

1. `Invoice Card` money status (**shipped**) and official invoice request block (**осталось**).
2. `Subscriptions` status + coverage because recurring revenue depends on invoice cards.
3. `Client Service Record` because it feeds both invoice and expense.
4. `Expense Plan / Card / Payment / Backlog`.
5. `Compensation Profile / Bonus Policy / KPI Policy` (My Company — **blocks policy engine**).
6. ~~`Product Bonus Pool / Bonus Release` (MVP).~~ Policy automation — `todo.md` §2.
7. ~~`Payroll Run / Salary Line / Employee Wallet` (MVP UX).~~ Policy engine + pool employee breakdown — `todo.md`.
8. `Operational Journal / P&L / Cash Flow`.
9. Finance dashboard and reporting refinements.

This order keeps income, recurring billing and client-service flow stable before rebuilding expenses and payroll on top of them.
