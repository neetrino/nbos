# Finance module UX — plan

> ~~Зачёркнуто = сделано.~~ Открытые пункты — дальше по плану.

**Коммиты:** `1c44a4e5` (bonus totals) · `15d5ceac` (zone hub) · `43fe17f1` · `26f8ae4e`

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

- [x] Expense scope hints в hero (`secondaryTabs`: active · backlog · closed)
- [x] Invoice closed scope hint в hero
- [x] Invoice list: overdue days parity с kanban
- [x] Alias `/finance/expenses/pay` → active board
- [ ] Filters/search kanban audit (остальные finance list pages)
- [ ] Stage-gate highlights на expense sheet (invoice — частично)

## Phase 6 — Finance team custom UI (отложено)

- [ ] Вертикальные кнопки · видимость по роли · design review

---

## Что осталось

1. **Phase 5** — остаток: filters audit · expense stage-gate.
2. **Опционально:** RBAC Wallet (API `/me/wallet` уже без FINANCE\_\*); сверка hub-метрик с API.
