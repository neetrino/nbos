# Finance module UX — plan

> ~~Зачёркнуто = сделано.~~ Открытые пункты — дальше по плану.

**Коммиты:** `26f8ae4e` (IA + wallet) · `43fe17f1` (Overview hero) · `742c6bdf` (Revenue hero) · `2afe2057` (kanban column totals)

---

## Finance IA + hero ~~(готово)~~

- ~~Сайдбар 4 зоны + `finance-zone-storage` + hydration-safe links~~
- ~~Overview / Revenue / Expenses / Payroll hero (поиск, Period в фильтрах, Settings)~~
- ~~Expenses: Pay Now · Plan · Client services~~
- ~~Wallet → `/my-account/wallet` (без `/finance/wallet`)~~
- ~~`04-Finance-Pages.md` §1.1~~

## Phase 3 — Column analytics

### Kanban column totals (`KanbanColumnMoneyTotal`) — проверено в коде

| Доска                                       | Статус                                                              |
| ------------------------------------------- | ------------------------------------------------------------------- |
| Invoices kanban                             | ~~готово~~                                                          |
| Expenses kanban (active)                    | ~~готово~~                                                          |
| Expenses closed kanban                      | ~~готово~~                                                          |
| Expense plans board                         | ~~готово~~                                                          |
| CRM Deals (вне Finance)                     | ~~готово~~                                                          |
| **Bonus board**                             | **[ ]** — колонки есть, в заголовке только **count**, без суммы AMD |
| Orders                                      | **N/A** — только table, kanban нет                                  |
| Payments / Subscriptions / Payroll / Salary | **N/A** — list/table, не `KanbanBoard`                              |

- [ ] **Bonus board** — добавить сумму по колонке (как Invoices/Expenses)
- ~~KPI только на Dashboard~~ — проверено: `KpiCards` только на `/finance/dashboard`; list-страницы без отдельной KPI-полосы над доской

## Phase 4 — Finance Dashboard hub

- [ ] Карточки 4 зон (Overview · Revenue · Expenses · Payroll) + быстрые ссылки
- [ ] Сверка с `01-Finance-Overview.md`

## Phase 5 — Canon polish

- [ ] Filters/search kanban — единый стандарт на всех board-страницах (аудит)
- [ ] Invoice list view parity (board vs list UX)
- [ ] Expense scope banners — только closed сейчас; active/backlog в hero flow при необходимости
- [ ] Stage-gate highlights — частично в Invoice sheet; расширить по канону

## Phase 6 — Finance team custom UI (отложено)

- [ ] Вертикальные кнопки · видимость по роли · design review

---

## Что осталось (приоритет)

1. **Phase 4** — Dashboard hub (карточки зон) — самый заметный UX-шаг «домой».
2. **Phase 3** — только **Bonus board** column money totals (остальное по kanban уже сделано или N/A).
3. **Phase 5** — polish по канону.
4. **Опционально:** RBAC Wallet без `FINANCE_INVOICES`; `/finance/expenses/pay`; выровнять «Expense Plan» / «Expenses Plan».
