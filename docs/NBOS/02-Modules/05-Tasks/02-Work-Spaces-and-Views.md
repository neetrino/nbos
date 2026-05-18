# Work Spaces and Views

> `Work Space` — рабочая среда, в которой задачи организуются, планируются и показываются в нужной форме. Это центральная planning-сущность внутри модуля `Tasks`.

## 1. Что такое Work Space

`Work Space` — это не просто доска. Это контейнер для task execution model:

- backlog
- sprints
- kanban board
- list view
- timeline
- files / artifacts
- rules
- analytics
- type-specific settings

Задачи остаются отдельными сущностями. `Work Space` определяет, как они организованы и какие views доступны команде.

## 2. Типы Work Space

### 2.1. Connected Work Space

Привязан к другой сущности платформы.

Примеры:

- `Product Work Space`
- в будущем `Finance Work Space`
- в будущем `Marketing Work Space`

Для `Product` connected workspace обязателен и создаётся как часть продуктового рабочего контура.
`Extension` не имеет отдельного Work Space: доработка является дополнительным элементом продукта, поэтому её задачи попадают в `Product Work Space` родительского продукта.

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
- именно там видны Work Space files and artifacts через Drive
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

- задача в `Backlog` видна только в scrum planning area (`sprint_id = null`, planning layer = backlog)
- задача в planning sprint не должна попадать в ежедневный active board
- задача в active sprint появляется в daily execution board
- после закрытия спринта задача сохраняет историю принадлежности через `sprint_id` на closed sprint record

### 6.3. Sprint как first-class сущность

`Sprint` — отдельная запись внутри scrum-enabled `Work Space`, а не только enum на задаче.

| Поле / правило           | Смысл                                |
| ------------------------ | ------------------------------------ |
| `workspace_id`           | Спринт принадлежит одному Work Space |
| `name`, `goal`           | Название и цель спринта              |
| `status`                 | `Planning` → `Active` → `Closed`     |
| `start_date`, `end_date` | Плановые даты итерации               |
| `closed_at`              | Фактическое закрытие                 |

Инварианты:

1. В scrum-enabled workspace одновременно может быть **только один** `Active` sprint.
2. Backlog-задачи: `sprint_id = null`.
3. Задачи в planning sprint: `sprint_id` указывает на sprint со статусом `Planning`.
4. Задачи в active sprint: `sprint_id` указывает на sprint со статусом `Active`.
5. После `Close sprint` sprint переходит в `Closed`; задачи остаются привязанными к нему для истории.

`TaskPlanningStatusEnum` остаётся compatibility/derived слоем для фильтров и миграции, но source of truth для sprint membership — `Task.sprint_id` + `Sprint.status`.

### 6.4. Close sprint — незавершённые задачи

При закрытии active sprint пользователь выбирает политику для незавершённых задач (`status != Completed`):

| Действие                       | Поведение                                             |
| ------------------------------ | ----------------------------------------------------- |
| `Move to backlog`              | `sprint_id = null`, planning = backlog                |
| `Move to next planning sprint` | перенос в выбранный или автосозданный planning sprint |
| `Keep on closed sprint`        | задача остаётся на closed sprint record (история)     |

### 6.5. Scrum Planning surface (layout)

В scrum-enabled workspace отдельный режим **Planning** — не «ещё одна kanban-доска», а полноценный Scrum planner:

- **Слева (широкая колонка):** Backlog — создание задач, поиск, сортировка, drag source.
- **Справа:** блоки спринтов — planning sprints, active sprint (развёрнут), placeholder «начать новый спринт», accordion завершённых спринтов.

Execution views (`Kanban`, `List`) в Scrum mode показывают **только задачи active sprint** (по `sprint_id` активного спринта).

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

### 8.2. Scrum Planning

Отдельная вкладка **Planning** в scrum-enabled workspace (рядом с Deadline / My Plan / Board / List).

**Layout (Bitrix-like):**

| Зона       | Содержимое                                                                                                                        |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Left ~40%  | Backlog: счётчик задач, `+ Task`, список, DnD source                                                                              |
| Right ~60% | Sprint blocks: active sprint header (progress, dates, goal, Finish), planning sprints, create sprint, completed sprints accordion |

**Не входит в v1:** story points, burndown, velocity, epics, capacity — только структурно корректный sprint lifecycle.

### 8.3. List

Табличный вид всех задач текущего workspace с фильтрами, bulk actions и колонками planning/workflow.

### 8.4. Timeline

PM-oriented вид по срокам, зависимостям и critical path.

### 8.5. My Plan

Персональный view пользователя по всем его задачам. Это часть top-level task module, а не конкретного workspace.

## 9. Контексты отображения

| Контекст          | Что открывается                                                                         |
| ----------------- | --------------------------------------------------------------------------------------- |
| `Product`         | connected `Work Space` продукта                                                         |
| `Extension`       | `Product Work Space` родительского продукта                                             |
| `Project`         | compact task counters and links only; no full task execution block on main Project page |
| top-level `Tasks` | глобальные списки и personal views                                                      |

Project-level task aggregation может существовать только как отдельный lazy-loaded filtered view, если это понадобится позже. Основная Project page не должна дублировать Product Work Space.
| standalone workspace | самостоятельное operational пространство |

## 10. Базовые правила отображения

1. В scrum-enabled workspace active kanban не показывает backlog и future sprint noise.
2. В product workspace scrum и kanban могут сосуществовать как два режима одного пространства.
3. Разные workspace types могут иметь разный UI и набор доступных блоков.
4. Source of truth остаются `Task + Work Space + Sprint`, а не отдельные несвязанные доски.
5. Work Space files являются Drive File Assets. Backlog/task attachments не должны попадать в Product Library как финальные документы, пока их не отметили как final artifact / delivery file.

## 10.1. Work Space Library

Каждый Work Space имеет Drive-based library.

Секции:

- Backlog attachments;
- Sprint artifacts;
- Task outputs;
- QA evidence;
- Final delivery candidates;
- Archive.

Scrum planning files, meeting notes, screenshots and task results должны храниться в Drive и связываться с Work Space, Sprint, Task и Product/Extension по необходимости.

## 11. Что может развиваться дальше

Архитектура `Work Space` должна без ломки поддержать:

- epics
- sprint capacity
- story points
- workspace-level automations
- type-specific dashboards
- different UI for marketing / finance / delivery spaces

Именно поэтому `Work Space` закладывается как отдельная core-сущность уже сейчас, даже при том что модуль верхнего уровня по-прежнему называется `Tasks`.
