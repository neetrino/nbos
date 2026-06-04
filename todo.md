# Finance — fix ThrottlerException (429) on board search

**Root cause:** глобальный Throttler 100 req / 60s. Поиск без debounce умножает запросы на каждый keystroke. `client-services` boards дополнительно делают per-column fetch (months = 12 колонок × `getAll` + `getStats` = 13 запросов на одно изменение).

**Где какая проблема (по факту кода):**

| Место                                             | Запросов на доску     | N+1 (per-column) | debounce              |
| ------------------------------------------------- | --------------------- | ---------------- | --------------------- |
| `/finance/client-services` (months 12 / status 4) | 12–13                 | да               | **нет** ← главный баг |
| Product page → `financeSection=client-services`   | 12–13                 | да               | есть (400ms)          |
| `/finance/expenses`                               | 2 (getAll + getStats) | нет              | нет                   |
| Product page → `financeSection=expenses`          | 1 (getAll)            | нет              | есть (400ms)          |
| `/finance/orders`                                 | 2 (getAll + getStats) | нет              | нет                   |

Настоящий per-column N+1 — только у `client-services` (хук `useClientServiceList` живёт лишь в `ClientServiceBoardColumn` и `ClientServiceListView`). Expenses/Orders группируют доску на клиенте из одного списка.

---

## Phase 1 — debounce + общий хук (минимальный diff, без backend)

Цель: убить множитель «keystroke × N». Ожидаемо ~130 → ~13 запросов на ввод 10 символов.

- [x] Создать общий хук `apps/web/src/components/shared/hooks/use-debounced-value.ts`
  - `useDebouncedValue<T>(value, delayMs)` + экспорт из `components/shared/index.ts`
  - константа `SEARCH_DEBOUNCE_MS = 400` в общем constants-файле
  - TS strict, named export, без `any`
- [x] `client-services/ClientServicesPageContent.tsx` — завести `debouncedSearch`, использовать его в `baseParams` (не `search`)
- [x] `client-services/ClientServicesPageContent.tsx` — `getStats` звать только для board-видов (status/months), не в list view
- [x] `expenses/ExpensesPageContent.tsx` — debounce search перед `listApiParams`
- [x] `orders/useOrdersPageState.ts` — debounce search перед `orderListExportParams` / `fetchOrders`
- [x] Рефактор inline-дублей debounce на общий хук (без изменения поведения):
  - `projects/hooks/use-product-finance-section.ts`
  - `finance/components/expenses/expense-plans-page-content.tsx`
  - `documents/page.tsx`, `documents/sections/[sectionId]/page.tsx`
- [ ] Проверка: ручной прогон поиска (нет лишних запросов в Network)

## Phase 2 — batch board endpoint для client-services (архитектурно, отдельный PR)

Цель: 13 запросов → 1. Чинит сразу оба места (standalone + product panel), т.к. оба используют `ClientServiceStatusBoardView` / `ClientServiceMonthsBoardView`.

- [x] API: `GET /client-services/board?view=months|status&year=...` → колонки + count + sum + первая страница карточек одним ответом
- [x] Пагинацию внутри колонки оставить отдельной ручкой (`getAll` по колонке при scroll)
- [x] Web: board views читают batch-ответ; `useClientServiceList` + `seed` для дозагрузки колонки
- [x] Применить в обоих местах (Finance module + product panel)
- [ ] Ручная проверка: board load = 1 запрос `/api/client-services/board`, scroll колонки = `getAll` page 2+

## Отклонено

- Staggered/lazy загрузка колонок — не лечит корень, мигание UI.
- Поднятие лимита Throttler — маскирует N+1.
- React Query — большой рефактор не по текущему паттерну; отдельная инициатива.
- Batch для expenses/orders — там уже 2 запроса, не нужно.
