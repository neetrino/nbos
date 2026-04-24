# Work Spaces and Views

> `Work Space` — рабочая среда, в которой задачи организуются, планируются и показываются в нужной форме. Это центральная planning-сущность внутри модуля `Tasks`.

## 1. Что такое Work Space

`Work Space` — это не просто доска. Это контейнер для task execution model:

- backlog
- sprints
- kanban board
- list view
- timeline
- rules
- analytics
- type-specific settings

Задачи остаются отдельными сущностями. `Work Space` определяет, как они организованы и какие views доступны команде.

## 2. Типы Work Space

### 2.1. Connected Work Space

Привязан к другой сущности платформы.

Примеры:

- `Product Work Space`
- `Extension Work Space`
- в будущем `Finance Work Space`
- в будущем `Marketing Work Space`

Для `Product` connected workspace обязателен и создаётся как часть продуктового рабочего контура.

### 2.2. Standalone Work Space

Не привязан к продукту и нужен для долгих процессов вне delivery.

Примеры:

- Marketing strategy
- Finance operations
- Internal improvement program
- CEO planning

## 3. Work Space и типизация

У Work Space должен быть `type`, который определяет:

- какие views доступны
- есть ли scrum-functional
- какие поля видны на карточках
- какие automation rules доступны
- какие аналитические блоки отображаются

Базовые workspace types:

- `PRODUCT_DELIVERY`
- `EXTENSION_DELIVERY`
- `STANDALONE_OPERATIONAL`

В будущем:

- `MARKETING`
- `FINANCE`
- `INTERNAL`

Это позволяет в будущем делать разный UI и разную глубину функционала для разных work spaces, не ломая общую архитектуру задач.

## 4. Work Space внутри Product

На странице продукта вкладка `Tasks` переименовывается в `Work Space`.

Это означает:

- страница продукта открывает connected workspace этого продукта
- именно там живут scrum/kanban/list/timeline представления
- задачи продукта собираются и выполняются через это пространство

Путь логически должен быть:

`/projects/:projectId/products/:productId/work-space`

## 5. Workflow Status vs Planning

### 5.1. Workflow Status

Показывает жизненный цикл задачи:

- `Open`
- `In Progress`
- `Review`
- `Completed`
- `Deferred`
- `Cancelled`

### 5.2. Planning Layer

Показывает место задачи в плане работы workspace:

- вне планирования
- backlog
- future sprint
- active sprint
- closed sprint history

### 5.3. Почему это важно

Если в backlog лежат 100 задач, они не должны засорять ежедневную канбан-доску активной работы.

Канон:

- backlog и future sprints живут в planning-слое
- active execution board показывает только рабочую часть
- backlog не является task-status

## 6. Scrum-enabled Work Space

Полный Scrum-функционал должен реализовываться именно внутри `Work Space`.

Что включает scrum-enabled workspace:

- backlog
- sprint planning
- active sprint
- future sprints
- closed sprints
- sprint goal
- burndown / velocity later
- epics later

### 6.1. Sprint lifecycle

- `Planning`
- `Active`
- `Closed`

### 6.2. Поведение задач

- задача в `Backlog` видна только в scrum planning area
- задача в `Future Sprint` не должна попадать в ежедневный active board
- задача в `Active Sprint` появляется в daily execution board
- после закрытия спринта задача сохраняет историю принадлежности

## 7. Kanban-enabled Work Space

Не все пространства обязаны использовать sprint planning.

Kanban-enabled workspace подходит для:

- extension work
- support-like flows
- finance operations
- lighter operational work

В таком режиме нет backlog/sprint-слоя как обязательной части. Команда работает по обычным workflow statuses.

## 8. Views внутри Work Space

### 8.1. Kanban

Показывает задачи по workflow status.

Колонки:

- `Open`
- `In Progress`
- `Review`
- `Completed`

Дополнительно:

- `Deferred`
- `Cancelled`

лучше держать как отдельные фильтры/секции, а не как основной daily flow.

Если workspace scrum-enabled, kanban по умолчанию показывает только задачи `Active Sprint`, а backlog/future sprint не мусорят рабочую доску.

### 8.2. Scrum

Показывает:

- backlog
- future sprints
- active sprint
- closed sprints

Это planning/work execution view для продуктовой команды.

### 8.3. List

Табличный вид всех задач текущего workspace с фильтрами, bulk actions и колонками planning/workflow.

### 8.4. Timeline

PM-oriented вид по срокам, зависимостям и critical path.

### 8.5. My Plan

Персональный view пользователя по всем его задачам. Это часть top-level task module, а не конкретного workspace.

## 9. Контексты отображения

| Контекст             | Что открывается                                     |
| -------------------- | --------------------------------------------------- |
| `Product`            | connected `Work Space` продукта                     |
| `Extension`          | connected `Work Space` доработки                    |
| `Project`            | агрегированный просмотр задач и work spaces проекта |
| top-level `Tasks`    | глобальные списки и personal views                  |
| standalone workspace | самостоятельное operational пространство            |

## 10. Базовые правила отображения

1. В scrum-enabled workspace active kanban не показывает backlog и future sprint noise.
2. В product workspace scrum и kanban могут сосуществовать как два режима одного пространства.
3. Разные workspace types могут иметь разный UI и набор доступных блоков.
4. Source of truth остаются `Task + Work Space + Sprint`, а не отдельные несвязанные доски.

## 11. Что может развиваться дальше

Архитектура `Work Space` должна без ломки поддержать:

- epics
- sprint capacity
- story points
- workspace-level automations
- type-specific dashboards
- different UI for marketing / finance / delivery spaces

Именно поэтому `Work Space` закладывается как отдельная core-сущность уже сейчас, даже при том что модуль верхнего уровня по-прежнему называется `Tasks`.
