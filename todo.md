# Finance module UX — plan

> ~~Зачёркнуто = сделано.~~ Открытые пункты — дальше по плану.

**Коммиты:** `742c6bdf` · `97fb059d` · _(следующий — Finance IA sidebar + wallet)_

---

## Finance IA — sidebar zones + wallet ~~(готово)~~

- ~~**Сайдбар 4 зоны:** Overview · Revenue · Expenses · Payroll~~
- ~~**Overview hero:** Dashboard · Reports · Journal~~
- ~~**Expenses hero:** Pay Now · Expenses Plan · Client services~~
- ~~**Запоминание зоны** (`finance-zone-storage.ts`, как Board/List)~~
- ~~**Wallet:** `/my-account/wallet`, account menu, убран `/finance/wallet`~~
- ~~`04-Finance-Pages.md` §1.1~~
- ~~`/finance` → `/finance/dashboard`~~

## Phase 1–2 — hero / revenue ~~(готово)~~

- ~~Navigation IA · zone hero · Revenue period/settings в фильтрах~~

## Phase 3 — Column analytics

- ~~Invoices · Expenses · CRM Deals · Expense plans kanban column totals~~
- [ ] Другие finance-доски (Orders, Bonus board, …)
- [ ] KPI только на Dashboard

## Phase 4 — Finance Dashboard hub

- [ ] Карточки зон + ссылки
- [ ] Сверка с `01-Finance-Overview.md`

## Phase 5 — Canon polish

- [ ] Filters/search kanban · invoice list parity · expense banners · stage-gate

## Phase 6 — Finance team custom UI (отложено)

- [ ] Вертикальные кнопки · видимость по роли · design review

---

## Что дальше

1. **Phase 3** — column totals на остальных finance-досках.
2. **Phase 4** — Dashboard hub (карточки зон).
3. **Phase 5–6** — polish / custom UI.

**Опционально:** RBAC — Wallet без `FINANCE_INVOICES`; alias `/finance/expenses/pay`.
