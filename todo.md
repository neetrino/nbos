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
- [ ] Обновить `docs/NBOS/00-Technical-Decisions-By-Module.md`
- [ ] Обновить `docs/NBOS/00-Implementation-Roadmap.md`
- [ ] Финализировать `05-UI-Specifications/09-Kanban-Board-and-List-Standard.md`
- [ ] Обновить CRM UI spec: `05-UI-Specifications/02-CRM-Pages.md`
- [ ] Обновить Delivery UI/canon links: `03-Project-Hub-Pages.md`, `07-Professional-Delivery-Card.md`, `07-Delivery-Board.md`

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

- [ ] Deals: проверить terminal model `WON/FAILED` и зафиксировать `FAILED` как closed outcome или явно reopenable
- [ ] Deals: привести `Active/Closed + Board/List` к UI standard, если найдены расхождения
- [x] ~~Leads: добавить local/shared pre-check parity с Deals~~
- [ ] Leads: привести terminal outcomes (`SQL/SPAM/Frozen`) к тому же board/list visual standard
- [x] ~~Leads/Deals: убрать остатки старого `TransitionBlockerDialog`, если больше нигде не нужен~~

---

## Фаза 4 — Delivery Board к одному стандарту

- [x] ~~Delivery Board: добавить local pre-check как в Deals~~
- [x] ~~Delivery Board: добавить Active List view~~
- [x] ~~Delivery Board: заменить custom Closed Board на общий board/card renderer~~
- [x] ~~Delivery Board: заменить custom Closed List на общий list/table renderer~~
- [x] ~~Delivery Board: сделать `Active/Closed + Board/List` одним visual standard~~
- [x] ~~Delivery Board: terminal outcomes (`Done/Cancelled`) показывать как closed scope, не как отдельный custom archive UI~~
- [ ] Delivery Board: проверить blocked drag/terminal action — карточка не остаётся в неправильной колонке

---

## Фаза 5 — Product / Project surfaces

- [ ] Product `ProductStageGateCard`: заменить inline blocker panel на общий sheet-highlight UX
- [ ] Product Overview: terminal actions и blockers привести к stage-gate standard
- [ ] Project Hub links/cards: не дублировать delivery board логику, использовать standard links/views
- [ ] Professional Delivery Card: closed state сделать read-only, но визуально той же family

---

## Фаза 6 — Finance workflow boards

- [ ] Найти все finance workflow/kanban/list surfaces
- [ ] Для existing gates: описать module rules в finance canon
- [ ] Invoice/Expense/Subscription boards: применить `Active/Closed + Board/List` standard, где есть lifecycle
- [ ] Finance blockers: использовать sheet-highlight UX, не отдельные modal forms
- [ ] Finance list/board cards: привести к единой card/row family

---

## Фаза 7 — Support / Tasks / Work Spaces

- [ ] Support tickets: описать active stages и terminal outcomes в canon
- [ ] Support board/list: привести к `Active/Closed + Board/List` standard
- [ ] Tasks / Work Spaces: проверить completion blockers и terminal outcomes
- [ ] Tasks board/list: привести card density, terminal states и list parity к standard

---

## Фаза 8 — Cleanup и контроль качества

- [ ] Удалить устаревшие blocker/modal компоненты после миграции всех surfaces
- [ ] Добавить regression tests для stage-gate blockers на основных boards
- [ ] Проверить mobile/responsive для Active/Closed Board/List
- [ ] Проверить docs links и cleanup registers
- [ ] Финальный audit: все kanban/workflow доски используют один стандарт
