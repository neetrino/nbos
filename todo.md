# NBOS — Stage Gate

`[ ]` открыто · `[x]` сделано

План: [`docs/NBOS/01-Platform-Overview/04-Stage-Gate-UX-Standard-Plan.md`](docs/NBOS/01-Platform-Overview/04-Stage-Gate-UX-Standard-Plan.md)

---

## Сейчас в работе

**Stage Gate + Kanban UI Standard** — привести все workflow/kanban доски к одному стандарту: от CRM Lead/Deal до Delivery, Product, Finance, Support и Tasks.

---

## Фаза 0 — Уже сделано

- [x] ~~CRM Deals: заменить stage-gate modal на sheet + подсветку полей~~
- [x] ~~CRM Deals: убрать yellow banner/toasts для stage-gate blockers~~
- [x] ~~Delivery Board: sheet + подсветка полей вместо modal~~
- [x] ~~Документ-план: `04-Stage-Gate-UX-Standard-Plan.md`~~
- [x] ~~UI standard draft: `05-UI-Specifications/09-Kanban-Board-and-List-Standard.md`~~

---

## Фаза 1 — Канон и стандарты

- [x] ~~Создать канон: `docs/NBOS/01-Platform-Overview/04-Stage-Gate-UX-and-Validation-Standard.md`~~
- [x] ~~Обновить `docs/NBOS/00-Technical-Decisions-By-Module.md`~~
- [x] ~~Обновить `docs/NBOS/00-Implementation-Roadmap.md`~~
- [x] ~~Финализировать `05-UI-Specifications/09-Kanban-Board-and-List-Standard.md`~~
- [x] ~~Создать detail UI canon: `05-UI-Specifications/10-Entity-Detail-Sheet-Standard.md`~~
- [x] ~~Обновить CRM UI spec: `05-UI-Specifications/02-CRM-Pages.md`~~
- [x] ~~Обновить Delivery UI/canon links: `03-Project-Hub-Pages.md`, `07-Professional-Delivery-Card.md`, `07-Delivery-Board.md`~~

---

## Фаза 2 — Shared foundation

- [x] ~~Вынести product stage gates в `@nbos/shared`~~
- [x] ~~Вынести extension stage gates в `@nbos/shared`~~
- [x] ~~Сделать единый `StageGateError` / blocker contract~~
- [x] ~~Сделать shared web helper для `stageGateHighlight`, field highlights и action blockers~~
- [x] ~~API оставить final authority: Nest wrappers только превращают shared errors в `BadRequestException`~~
- [x] ~~Добавить tests для shared product/extension gates~~

---

## Фаза 3 — CRM к эталону

- [x] ~~Deals: проверить terminal model `WON/FAILED` и зафиксировать `FAILED` как closed outcome или явно reopenable~~
- [x] ~~Deals: привести `Active/Closed + Board/List` к UI standard, если найдены расхождения~~
- [x] ~~Leads: добавить local/shared pre-check parity с Deals~~
- [x] ~~Leads: привести terminal outcomes (`SQL/SPAM/Frozen`) к тому же board/list visual standard~~
- [x] ~~Leads/Deals: убрать остатки старого `TransitionBlockerDialog`, если больше нигде не нужен~~

---

## Фаза 4 — Delivery Board к одному стандарту

- [x] ~~Delivery Board: добавить local pre-check как в Deals~~
- [x] ~~Delivery Board: добавить Active List view~~
- [x] ~~Delivery Board: заменить custom Closed Board на общий board/card renderer~~
- [x] ~~Delivery Board: заменить custom Closed List на общий list/table renderer~~
- [x] ~~Delivery Board: сделать `Active/Closed + Board/List` одним visual standard~~
- [x] ~~Delivery Board: terminal outcomes (`Done/Cancelled`) показывать как closed scope, не как отдельный custom archive UI~~
- [x] ~~Delivery Board: проверить blocked drag/terminal action — карточка не остаётся в неправильной колонке~~

---

## Фаза 5 — Product / Project surfaces

- [x] ~~Product `ProductStageGateCard`: заменить inline blocker panel на общий sheet-highlight UX~~
- [x] ~~Product Overview: terminal actions и blockers привести к stage-gate standard~~
- [x] ~~Project Hub links/cards: не дублировать delivery board логику, использовать standard links/views~~
- [x] ~~Professional Delivery Card: closed state сделать read-only, но визуально той же family~~

---

## Фаза 6 — Finance workflow boards

- [x] ~~Найти все finance workflow/kanban/list surfaces~~
- [x] ~~Для existing gates: описать module rules в finance canon (`11-Finance-Stage-Gate-and-Board-UX-Standard.md`)~~
- [x] ~~Expense closed: `closedBoard` API + Board/List + Paid/Cancelled columns~~
- [x] ~~Invoices: Active/Closed board scope на одной странице (Paid/Cancelled = closed)~~
- [ ] Subscription: board/list parity (grid-first)
- [x] ~~Invoice detail sheet: compact detail canon (summary row, DetailSheetSection, без hero amount panel)~~
- [ ] Subscription detail: открывать через sheet, separate page оставить только для workspace-сценария
- [ ] Client Services: заменить большой edit/detail dialog на sheet; quick dialog оставить только для короткого create/action
- [ ] Finance blockers: sheet-highlight UX при добавлении validation rules (сейчас API/detail guards)
- [x] ~~Finance list/board cards: ExpenseKanbanCard + ExpensesTableSection на active и closed~~

---

## Фаза 7 — Support / Tasks / Work Spaces

- [x] ~~Roadmap stub: `06-Support-and-Tasks/00-Support-Tasks-Board-UX-Roadmap.md`~~
- [x] ~~Support tickets: описать active stages и terminal outcomes в canon (`01-Support-Ticket-Board-Lifecycle.md`)~~
- [x] ~~Support board/list: Active/Closed scope + board/list toggle~~
- [x] ~~Support ticket detail: title-first header, badges, sheet layout по detail standard~~
- [x] ~~Tasks / Work Spaces: terminal outcomes (COMPLETED/DONE) + board scope canon~~
- [x] ~~Tasks board/list: Active/Closed scope на `/tasks` и Work Space runtime~~
- [ ] Tasks quick create/detail: использовать чистый task-style layout как визуальный эталон

---

## Фаза 8 — Cleanup и контроль качества

- [ ] Удалить устаревшие blocker/modal компоненты после миграции всех surfaces
- [x] ~~Regression: `delivery-stage-gate-client.test.ts` (local pre-check)~~
- [x] ~~Regression: lead + task board lifecycle + delivery local gate~~
- [x] ~~Regression: invoice board lifecycle scope test~~
- [ ] Regression: product board scope helpers
- [ ] Проверить mobile/responsive для Active/Closed Board/List
- [ ] Проверить docs links и cleanup registers
- [ ] Финальный audit: все kanban/workflow доски используют один стандарт
