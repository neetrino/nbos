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
- `Project Bonus Pool / Бонусный фонд проекта`;
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
- `Project Bonus Pool`;
- `Bonus Release`.

### A3. Bonus lifecycle already has a rich status model

Статус: `PARTIAL RUNTIME ALIGNMENT`

Runtime уже содержит расширенный `BonusStatusEnum`:

- `INCOMING`;
- `EARNED`;
- `PENDING_ELIGIBILITY`;
- `VESTED`;
- `HOLDBACK`;
- `ACTIVE`;
- `PAID`;
- `CLAWBACK`.

Это близко к новому канону. Основной будущий refactor здесь не в статусах, а в связке с `Project Bonus Pool`, `Bonus Release`, `Payroll Run`, `Salary Line`, `Expense Card` и `Employee Wallet`.

---

## B. Docs stale only / Устарело только в документации

### B1. Delta/backlog documents still mention old deal wording

Статус: `STALE SUPPORTING DOC`

[00-Delta-New-Description.md](../../00-Delta-New-Description.md) и старые supporting notes могут всё ещё упоминать `New / Upsell` как старую формулировку.

Решение:

- не считать эти файлы активным Finance-каноном;
- использовать их только как backlog / historical delta.

### B2. Notifications doc still contains old deal taxonomy

Статус: `STALE DOC`

[01-Notifications-System.md](../13-Notifications/01-Notifications-System.md) всё ещё содержит старое wording:

- `New / Extension / Upsell`.

Это не Finance runtime bug, но при проходе Notifications модуль нужно обновить под CRM/Finance канон.

---

## C. Runtime stale / Устарело в коде и требует refactor

### C1. Invoice runtime still uses old Bitrix-style status model

Статус: `STALE CODE`

Runtime сейчас использует старые статусы:

- `THIS_MONTH`;
- `CREATE_INVOICE`;
- `WAITING`;
- `DELAYED`;
- `ON_HOLD`;
- `FAIL`;
- `PAID`.

Примеры мест:

- [packages/shared/src/constants/index.ts](../../../../packages/shared/src/constants/index.ts)
- [packages/database/prisma/schema.prisma](../../../../packages/database/prisma/schema.prisma)
- [apps/api/src/modules/finance/finance-status.utils.ts](../../../../apps/api/src/modules/finance/finance-status.utils.ts)
- [apps/api/src/modules/scheduler/scheduler.service.ts](../../../../apps/api/src/modules/scheduler/scheduler.service.ts)
- [apps/web/src/features/finance/constants/finance.ts](../../../../apps/web/src/features/finance/constants/finance.ts)
- [apps/web/src/app/(app)/finance/invoices/page.tsx](<../../../../apps/web/src/app/(app)/finance/invoices/page.tsx>)

Новый канон:

- `Invoice Card` = карточка денег, которые клиент должен заплатить;
- money status: `New / Awaiting Payment / Overdue / On Hold / Paid / Cancelled`;
- official invoice request is an internal block: `tax_status`, `request_sent`, `sent_at`, `cancelled_at`;
- notifications are automation rules, not invoice stages.

Будущий refactor:

- заменить old invoice status enum;
- вынести official invoice request fields из stage workflow;
- обновить scheduler/reminder logic;
- обновить invoice board UI;
- обновить finance summary calculations.

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

Будущий refactor:

- split existing expense model or introduce new tables;
- add partial payments;
- add backlog reason;
- update expense board routes and UI;
- update P&L and cash flow sources.

### C4. Payroll runtime is not implemented as canonical entity set

Статус: `MISSING CODE`

Новый канон требует:

- `Compensation Profile`;
- `Payroll Run`;
- `Salary Line`;
- `Project Bonus Pool`;
- `Bonus Release`;
- `Expense Card` creation from approved payroll;
- partial salary payments via `Expense Payment`;
- `Employee Wallet` as read-only projection.

Runtime currently still has only basic employee salary fields and bonus entries. It does not have the full payroll entity flow, project bonus pool, automatic release after project done, or manual release overrides.

Будущий refactor:

- move compensation settings out of simple employee scalar fields into compensation profile history;
- add payroll run model;
- add salary line model;
- add project bonus pool and bonus release models;
- add automatic release after project done based on available project funding;
- add manual override flow for early release, extra bonus and over funding;
- connect payroll to expense cards and expense payments;
- update salary UI from monthly table to `employees x months` matrix;
- add payroll bonus release workspace.

### C5. Client Service Record is not a runtime entity yet

Статус: `MISSING CODE`

New canon unifies:

- Domain;
- Hosting;
- Service;
- Account;
- License.

Runtime currently has `Domain`, but not a general `Client Service Record`.

Будущий refactor:

- introduce `ClientServiceRecord`;
- migrate / wrap domain logic into the general service model;
- support billing model: `Client-paid / Company-paid`;
- support pricing model: `Fixed / Usage-based`;
- connect to `Invoice Card`, `Expense Card`, `Task`, `Credential`.

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

### C7. Finance UI still contains old board assumptions

Статус: `STALE CODE`

Frontend still references old finance statuses and pages:

- invoice page uses `THIS_MONTH / CREATE_INVOICE / WAITING / DELAYED`;
- expense page uses `THIS_MONTH / PAY_NOW / DELAYED / ON_HOLD / OLD`;
- subscription UI uses `PAUSED`;
- project finance tab still maps old status names in places.

Будущий refactor:

- rebuild Finance UI around:
  - Invoice Cards;
  - Subscription Grid with coverage;
  - Client Services;
  - Expense Plans / Expense Board / Expense Backlog;
  - Salary Board matrix;
  - P&L / Cash Flow / Journal View.

### C8. Finance summary and scheduler logic still use old status semantics

Статус: `STALE CODE`

Examples:

- [apps/api/src/modules/finance/summary/summary.service.ts](../../../../apps/api/src/modules/finance/summary/summary.service.ts)
- [apps/api/src/modules/scheduler/scheduler.service.ts](../../../../apps/api/src/modules/scheduler/scheduler.service.ts)
- [apps/api/src/modules/finance/finance-status.utils.ts](../../../../apps/api/src/modules/finance/finance-status.utils.ts)

They currently calculate status and summary around old invoice and expense stages.

Будущий refactor:

- replace status-driven summary with domain-driven metrics:
  - open invoice cards;
  - overdue invoice cards;
  - expected incoming;
  - expense cards due soon / due now / overdue;
  - expense backlog;
  - subscription coverage;
  - payroll payable / paid / remaining.

---

## D. Implementation backlog / Что потом реализовать

1. Replace `InvoiceStatusEnum` with new Invoice Card money-status model and official invoice request fields.
2. Add notification/reminder automation based on invoice card rules, not invoice board stages.
3. Replace subscription statuses and add billing coverage fields.
4. Add `Expense Plan`, `Expense Card`, `Expense Payment`, `Expense Backlog`.
5. Add partial outgoing payments for expenses and salary.
6. Add `Client Service Record` and connect it to invoice/expense/task/credential.
7. Add `Compensation Profile`, `Project Bonus Pool`, `Bonus Release`, `Payroll Run`, `Salary Line`.
8. Add automatic subscription delivery bonus release after project done, with manual override.
9. Add `Employee Wallet` read model.
10. Add `Operational Journal`, period close and adjustment flow.
11. Rebuild Finance UI routes and views around the new canon.
12. Update finance dashboard/summary/scheduler logic.
13. Add tests for all transition and generation rules.

---

## E. Recommended implementation order

1. `Invoice Card` status and official invoice request block.
2. `Subscriptions` status + coverage because recurring revenue depends on invoice cards.
3. `Client Service Record` because it feeds both invoice and expense.
4. `Expense Plan / Card / Payment / Backlog`.
5. `Compensation Profile / Bonus Policy / KPI Policy`.
6. `Project Bonus Pool / Bonus Release`.
7. `Payroll Run / Salary Line / Employee Wallet`.
8. `Operational Journal / P&L / Cash Flow`.
9. Finance dashboard and reporting refinements.

This order keeps income, recurring billing and client-service flow stable before rebuilding expenses and payroll on top of them.
