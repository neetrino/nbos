# Finance module UX — plan

> ~~Зачёркнуто = сделано.~~ Открытые пункты — дальше по плану.

**Коммиты:** `031230b6` · `ed1dae70` · `553763b2` · `742c6bdf` _(следующий — phase 3)_

---

## Phase 1 — Navigation IA ~~(готово)~~

- ~~Document plan · sidebar groups · Salary board · убрать 13 tabs · zone hero · nav groups · UI spec~~

## Phase 2 — Page hero standard ~~(готово)~~

- ~~Invoices · Orders · Payments · Subscriptions · Expense board/backlog/closed~~
- ~~Expense plans~~
- ~~Payroll · Salary board · Bonus pools~~
- ~~Client services (без summary cards)~~
- ~~Reports · Journal~~
- ~~`/bonus` — `bonus/layout.tsx` + Finance payroll tabs~~
- ~~Fix infinite loop `useModuleHeroSlots`~~

## Finance sidebar + payroll hero (2026-05) ~~(готово)~~

- ~~Убраны group labels Revenue / Expenses / Payroll & bonus / Services в сайдбаре~~
- ~~Payroll · Salary board · Bonus board · Bonus pools · Client services — IntegratedSearchFilters + Settings~~

## Expense board / plans UX (2026-05 follow-up) ~~(готово)~~

- ~~Period Month/Quarter/Year/All → в панель фильтров поиска~~
- ~~Active / Backlog / Closed → фильтр Board (как CRM scope), убраны secondary tabs~~
- ~~Sort by + Order → в фильтрах (list column sort — позже)~~
- ~~Settings sheet (exports) как Tasks~~
- ~~Expense plans: `IntegratedSearchFilters` вместо кастомного toolbar~~
- ~~Убран `ExpensePlansVsBoardBanner` на board и plans~~

## Revenue list hero (2026-05) ~~(готово)~~

- ~~Orders · Invoices · Payments · Subscriptions: период в фильтрах поиска (не pill-кнопки в hero)~~
- ~~Экспорт scope stats + CSV → `FinanceListPageSettingsSheet`~~
- ~~Общий `finance-period-filter.ts` + reuse в Expenses~~

**Не в scope этого среза:** `/finance/dashboard` — период по-прежнему pill-кнопки на самой странице hub.

## Phase 3 — Column analytics (не блоки на странице)

- ~~Invoices kanban: column totals~~
- [ ] Expenses kanban: column totals (как CRM Deals)
- [ ] Другие finance-доски: roll-up по колонкам
- [ ] KPI модуля: только Dashboard или нигде

## Phase 4 — Finance Dashboard hub

- [ ] Overview: карточки 5 зон + ссылки
- [ ] Сверка с `01-Finance-Overview.md`
- [ ] _(опционально)_ период dashboard в фильтры / Settings, как list pages

## Phase 5 — Canon polish

- [ ] Filters/search по kanban standard
- [ ] Invoice list view parity
- [ ] Expense scope banners в hero flow
- [ ] Stage-gate highlights

## Phase 6 — Finance team custom UI (отложено)

- [ ] Вертикальные кнопки слева (вертикальный текст)
- [ ] Видимость по роли
- [ ] Design review

---

## Что дальше

1. **Phase 3** — суммы в колонках Expense kanban (+ при необходимости другие доски).
2. **Phase 4** — Dashboard hub по зонам.
3. **Phase 5** — канон досок / list / stage-gate.
4. **Phase 6** — кастомный UI для finance-команды.

**Опционально:** URL alias `/finance/expenses/pay`; выровнять sidebar «Expense Plan» vs hero «Expenses Plan».
