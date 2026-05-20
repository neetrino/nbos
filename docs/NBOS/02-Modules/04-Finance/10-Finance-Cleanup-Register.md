# Finance Cleanup Register

> NBOS Finance - что уже совпадает с новым каноном, что устарело только в документации, а что требует будущего runtime refactor.

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

### C4. Payroll runtime is not implemented as canonical entity set

Статус: `MISSING CODE`

Новый канон требует:

- `Compensation Profile`;
- `Payroll Run`;
- `Salary Line`;
- `Product Bonus Pool`;
- `Bonus Release`;
- `Expense Card` creation from approved payroll;
- partial salary payments via `Expense Payment`;
- `Employee Wallet` as read-only projection.

Runtime currently still has only basic employee salary fields and bonus entries. It does not have the full payroll entity flow, product bonus pool, automatic release after Product / Extension done, or manual release overrides.

Будущий refactor:

- move compensation settings out of simple employee scalar fields into compensation profile history;
- add payroll run model;
- add salary line model;
- add product bonus pool and bonus release models;
- add automatic release after Product / Extension done based on available product funding;
- add manual override flow for early release, extra bonus and over funding;
- connect payroll to expense cards and expense payments;
- update salary UI from monthly table to `employees x months` matrix;
- add payroll bonus release workspace.

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

Будущий refactor:

- rebuild Finance UI around:
  - Invoice Cards (money layer — база есть; official invoice block в UI — по полям runtime);
  - Subscription Grid with coverage;
  - Client Services;
  - Expense Plans / Expense Board / Expense Backlog;
  - Salary Board matrix;
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
5. ~~Add partial outgoing payments for expenses and salary.~~ Partial/full outgoing is implemented via
   `ExpensePayment`; salary lines linked to an expense card sync partial pay state. Remaining work is
   the full canon entity split and payroll UI depth (see items 4, 7, 12).
6. Add `Client Service Record` and connect it to invoice/expense/task/credential.
7. Add `Compensation Profile`, `Product Bonus Pool`, `Bonus Release`, `Payroll Run`, `Salary Line`.
8. Add automatic subscription delivery bonus release after Product / Extension done, with manual override.
9. Add `Employee Wallet` read model.
10. Add Finance report aggregate endpoints behind the v1 definitions shell.
11. Add `Operational Journal`, period close and adjustment flow.
12. Rebuild Finance UI routes and views around the new canon.
13. Update finance dashboard/summary/scheduler logic.
14. Add tests for all transition and generation rules.

---

## E. Recommended implementation order

1. `Invoice Card` money status (**shipped**) and official invoice request block (**осталось**).
2. `Subscriptions` status + coverage because recurring revenue depends on invoice cards.
3. `Client Service Record` because it feeds both invoice and expense.
4. `Expense Plan / Card / Payment / Backlog`.
5. `Compensation Profile / Bonus Policy / KPI Policy`.
6. `Product Bonus Pool / Bonus Release`.
7. `Payroll Run / Salary Line / Employee Wallet`.
8. `Operational Journal / P&L / Cash Flow`.
9. Finance dashboard and reporting refinements.

This order keeps income, recurring billing and client-service flow stable before rebuilding expenses and payroll on top of them.
