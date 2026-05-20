# NBOS Finance — план по фазам

`[ ]` открыто · `[x]` сделано · ~~зачёркнуто~~ = закрыто в этой итерации

Источник: `docs/NBOS/02-Modules/04-Finance/10-Finance-Cleanup-Register.md`, Phase 3 roadmap.

---

## Фаза 0 — Уже в runtime (база)

- [x] ~~Invoice Card: `moneyStatus`, без legacy pipeline~~
- [x] ~~Payments + coverage на инвойсе~~
- [x] ~~Orders list + reconciliation~~
- [x] ~~Subscriptions: статусы канона + Subscription Grid~~
- [x] ~~Expense Plan / Expense / ExpensePayment / backlog~~
- [x] ~~Payroll Run / Salary Line / Salary board~~
- [x] ~~Product Bonus Pool / Bonus Release~~
- [x] ~~Employee Wallet (read-only)~~
- [x] ~~Client Service Record CRUD + связи~~
- [x] ~~Reports v1 (6 определений)~~
- [x] ~~Operational Journal + posting periods (база)~~
- [x] ~~Partner accrual / payout batches~~

---

## Фаза 1 — Official Invoice + напоминания

- [x] ~~1.1 Prisma: `official_invoice_request_sent`, `official_invoice_sent_at`, `official_invoice_cancelled_at`, `notifications_enabled` на Invoice~~
- [x] ~~1.2 API: send / cancel / send-again + запись `govInvoiceId`~~
- [x] ~~1.3 Reminders: gate по `request_sent`, backfill из `gov_invoice_id`~~
- [x] ~~1.4 UI: блок Official Invoice в Invoice sheet + кнопки~~

---

## Фаза 2 — Subscription billing model

- [x] ~~2.1 Prisma: `base_monthly_amount`, `billing_frequency`, `billing_start_date`, `notifications_enabled`~~
- [x] ~~2.2 API: create/update (legacy `amount`/`startDate` aliases), UI read на detail + таблицы~~
- [x] ~~2.3 Billing: yearly → 12× base + coverage; MRR на `baseMonthlyAmount`~~
- [ ] 2.4 UI: форма create/edit subscription (frequency, notifications) на list/detail

---

## Фаза 3 — Expenses workflow (канон)

- [x] ~~3.1 Workflow-статусы: Planned / Due Soon / Due Now / Overdue / Backlog / …~~
- [x] ~~3.2 UI board/backlog под новые статусы (убрать `OLD`)~~
- [x] ~~3.3 Expense Plans: calendar grid (строки × месяцы)~~

---

## Фаза 4 — Operational Journal & периоды

- [ ] 4.1 Запрет правок в CLOSED period
- [ ] 4.2 Adjustment entries вместо silent edit
- [ ] 4.3 Полное покрытие journal sources (invoice/expense accrual)

---

## Фаза 5 — Compensation Profile

- [ ] 5.1 Сущность + история ставок
- [ ] 5.2 Payroll materialize из profile, не scalar employee

---

## Фаза 6 — Интеграции и хвосты

- [ ] 6.1 Domain → Client Service Record
- [ ] 6.2 Drive: вложения finance (proofs, restricted)
- [ ] 6.3 Client-paid automation (task/expense после оплаты)
- [ ] 6.4 Finance dashboard / summary доработки

---

## Сейчас в работе

**Фаза 2.4** — Subscription create/edit form (frequency, notifications)
