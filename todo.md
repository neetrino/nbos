# Finance module UX — plan

> ~~Зачёркнуто = сделано.~~ Открытые пункты — дальше по плану.

**Коммиты:** `79726b56` (убрали hints + subscriptions copy) · `d6886f7b` · `1c44a4e5` · `15d5ceac`

---

## Finance IA + hero ~~(готово)~~

- ~~Сайдбар 4 зоны + wallet + Overview hero~~

## Phase 3 — Column analytics ~~(готово)~~

| Доска                                           | Статус               |
| ----------------------------------------------- | -------------------- |
| Invoices · Expenses · Expense plans · CRM Deals | ~~готово~~           |
| **Bonus board**                                 | ~~готово~~           |
| Orders / Payments / …                           | **N/A** (нет kanban) |

- ~~KPI только на Dashboard~~

## Phase 4 — Finance Dashboard hub ~~(готово)~~

- ~~`FinanceZoneHubCards` на `/finance/dashboard` (Overview · Revenue · Expenses · Payroll)~~
- ~~Метрики из `getDashboard` + ссылки `useFinanceZoneHref` (last visited)~~
- ~~Overview: подссылки Reports · Journal~~
- [ ] Углублённая сверка метрик с `01-Finance-Overview.md` (при расширении API)

## Phase 5 — Canon polish

- ~~Expense/invoice scope hints в hero~~ (удалены — мешали UX)
- [x] Invoice list: overdue days parity с kanban
- [x] Alias `/finance/expenses/pay` → active board
- [x] Удалены legacy `*PageHeader` (hero через `useModuleHeroSlots`)
- [x] Expense stage-gate: kanban → detail + highlights (payments · status)
- [ ] Filters/search audit — только bonus-pools (таблица без search, ок)

## Phase 6 — Finance team custom UI (отложено)

- [ ] Вертикальные кнопки · видимость по роли · design review

---

## Что осталось

1. **Phase 5** — в основном закрыта; опционально bonus-pools search.
2. **Опционально:** RBAC Wallet (API `/me/wallet` уже без FINANCE\_\*); сверка hub-метрик с API.
