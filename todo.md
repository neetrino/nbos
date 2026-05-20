# NBOS — Stage Gate + Kanban UI

`[ ]` открыто · `[x]` сделано

План и канон: [`docs/NBOS/01-Platform-Overview/04-Stage-Gate-UX-Standard-Plan.md`](docs/NBOS/01-Platform-Overview/04-Stage-Gate-UX-Standard-Plan.md) · [`04-Stage-Gate-UX-and-Validation-Standard.md`](docs/NBOS/01-Platform-Overview/04-Stage-Gate-UX-and-Validation-Standard.md) · [`09-Kanban-Board-and-List-Standard.md`](docs/NBOS/05-UI-Specifications/09-Kanban-Board-and-List-Standard.md) · [`10-Entity-Detail-Sheet-Standard.md`](docs/NBOS/05-UI-Specifications/10-Entity-Detail-Sheet-Standard.md)

Rollout по модулям (CRM, Delivery, Product, Finance invoices/expenses/subscriptions sheet, Support, Tasks) — **в коде и docs сделан**. Ниже только то, что ещё имеет смысл делать.

---

## Сейчас

- [x] ~~Delivery Board parity: Closed `X of Y cards`, fixed 288px columns Active/Closed, terminal drop Done/Cancelled на Active drag~~
- [ ] **Финальный audit (ручной)** — пройти workflow surfaces по чеклисту kanban + stage-gate (можно без ожидания других задач):
  - CRM: leads, deals — Active/Closed, Board/List, blocked drag → sheet + field highlights
  - Delivery — Active/Closed Board/List, local gate
  - Finance — expenses active/closed, invoices scope + money-status gate, subscriptions **sheet** (grid scope не в scope audit)
  - Support — Active/Closed, ticket sheet
  - Tasks + Work Space — Active/Closed, `QuickCreateTaskDialog`, `TaskSheet`
  - Зафиксировать находки в issues или коротким списком под этим пунктом

---

## Отложено (решим отдельно)

- [ ] **Subscriptions: Active/Closed на coverage grid** — сейчас **не делаем** (grid-first, без kanban terminal board; нет канона terminal scope). Вернуться, когда появится продуктовое решение / canon.

---

## После появления правил в API + canon

Не блокирует audit. Паттерн уже есть (Deals, Delivery, Invoices); нужны **бизнес-правила** и structured `errors: [{ field, message }]`.

- [ ] **Support tickets** — stage-gate: kanban/list move → ticket sheet + подсветка полей (сейчас в API нет stage-gate с field errors; lifecycle + sheet уже есть)
- [ ] **Tasks** — completion/stage gate: kanban move → `TaskSheet` + rings на полях (сейчас local `TaskCompletionRulesPanel` / blockers без CRM-style field highlights; ждём API или общий completion contract)
- [ ] **Finance expenses** — sheet field highlights, когда появятся validation rules на board/detail (invoices money-status уже с local pre-check)

---

## Справка (сделано, не трогать в todo)

<details>
<summary>Закрытые фазы 0–8 (архив)</summary>

- Канон, shared gates, CRM, Delivery, Product, Finance (expenses closed, invoices scope, subscription/client-service sheets, invoice gate UX), Support/Tasks boards + detail sheets, regression tests, docs sync, удаление старых blocker modals.

</details>
