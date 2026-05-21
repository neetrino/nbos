# Finance module UX — plan

> ~~Зачёркнуто = сделано.~~ Открытые пункты — дальше по плану.

**Коммиты:** `15d5ceac` (zone hub) · `43fe17f1` · `26f8ae4e` · _(следующий — Bonus board totals)_

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

- [ ] Filters/search kanban · invoice list parity · expense banners · stage-gate

## Phase 6 — Finance team custom UI (отложено)

- [ ] Вертикальные кнопки · видимость по роли · design review

---

## Что осталось

1. **Phase 5** — canon polish.
2. **Опционально:** RBAC Wallet; `/finance/expenses/pay`; подписи Expense Plan; сверка hub-метрик с API.
