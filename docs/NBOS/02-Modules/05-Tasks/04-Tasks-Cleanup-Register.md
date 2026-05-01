# Tasks Cleanup Register

> NBOS Platform - реестр устаревшей task-логики, старых формулировок и обязательной зачистки после обновления канона `Task + Work Space`

## Назначение

Этот файл нужен, чтобы после согласования нового канона `Tasks` команда не продолжила опираться на старые модели:

- где `Backlog` считается task-status;
- где `Scrum` описан как просто ещё один вид task board без отдельной planning-сущности;
- где `Work Space` ещё отсутствует как core-entity;
- где `Completion Rules` не учитываются;
- где старые UI и runtime constants продолжают жить отдельно от нового канона.

Реестр делит находки на три типа:

1. уже совпадает с новым каноном и это нужно сохранить;
2. устарело только в документации / описаниях;
3. устарело в runtime-коде и потом потребует реального рефакторинга.

Связанный канон:

- `01-Task-System-Overview.md`
- `02-Work-Spaces-and-Views.md`
- `03-Recurring-Automation-and-Completion-Rules.md`
- `../../01-Platform-Overview/03-Core-Entities-and-Data-Model.md`
- `../../05-UI-Specifications/05-Task-and-Support-Pages.md`

---

## A. Уже совпадает с каноном и должно остаться

### A1. Задача уже существует как отдельная сущность и может жить не только внутри Product

Подтверждение в коде:

- [apps/api/src/modules/tasks/tasks.service.ts](/Users/user/{} Development/1. Production/nbos/apps/api/src/modules/tasks/tasks.service.ts:142)

Что уже хорошо:

- задача создаётся как самостоятельная сущность;
- связи добавляются через `links`;
- нет жёсткого требования, что задача обязана всегда принадлежать только `Product` или `Extension`.

Вывод:

- направление “Task как отдельная сущность” уже есть в runtime;
- это не надо ломать, а надо расширять до `primary context + Work Space`.

### A2. Recurring templates уже существуют как отдельный слой

Подтверждение в коде:

- [apps/api/src/modules/tasks/recurring-tasks.service.ts](/Users/user/{} Development/1. Production/nbos/apps/api/src/modules/tasks/recurring-tasks.service.ts:1)

Что уже хорошо:

- recurring templates уже вынесены в отдельный сервис;
- хранят частоту, интервал, start/end date, due date offset;
- не смешаны напрямую с обычными task instances.

Вывод:

- направление `Recurring Tasks` уже правильно отделено от обычных задач;
- позже его надо не придумывать с нуля, а расширять.

### A3. Auto-generated tasks уже существуют как отдельное направление

Подтверждение в коде:

- [apps/api/src/modules/automation/auto-tasks.service.ts](/Users/user/{} Development/1. Production/nbos/apps/api/src/modules/automation/auto-tasks.service.ts:150)

Что уже хорошо:

- есть отдельный automation service;
- задачи создаются по productType;
- генерация для `Deal` и `Product` уже разделена.

Вывод:

- базовая идея `Task Blueprints / Automation` уже есть;
- дальше нужно только чётче разделить blueprints и rules по новому канону.

### A4. Checklists и Subtasks уже есть в runtime-модели задач

Подтверждение в коде:

- [apps/api/src/modules/tasks/tasks.service.ts](/Users/user/{} Development/1. Production/nbos/apps/api/src/modules/tasks/tasks.service.ts:52)
- [apps/web/src/features/tasks/components/TaskSheet.tsx](/Users/user/{} Development/1. Production/nbos/apps/web/src/features/tasks/components/TaskSheet.tsx:63)

Вывод:

- task-level checklists уже реально живут в системе;
- это хорошо совпадает с каноном `Task Checklist`;
- позже нужно только не смешать их со stage gates `Projects Hub`.

### A5. Personal planning views уже частично выделены отдельно от общей доски

Подтверждение в коде:

- [apps/api/src/modules/tasks/task-boards.service.ts](/Users/user/{} Development/1. Production/nbos/apps/api/src/modules/tasks/task-boards.service.ts:17)
- [apps/api/src/modules/tasks/tasks.service.ts](/Users/user/{} Development/1. Production/nbos/apps/api/src/modules/tasks/tasks.service.ts:190)

Что уже хорошо:

- есть отдельные board stages для `KANBAN` и `MY_PLAN`;
- у задачи есть `kanbanStageId` и `myPlanStageId`.

Вывод:

- архитектура уже понимает, что views могут быть разными;
- это хороший промежуточный фундамент для будущего `Work Space`.

---

## B. Устарело только в документации или описаниях

### B1. В части cross-module docs всё ещё живут старые task-status и старый language flow

Где осталось:

- [docs/NBOS/04-Roles-and-Access/02-Access-Matrix.md](/Users/user/{} Development/1. Production/nbos/docs/NBOS/04-Roles-and-Access/02-Access-Matrix.md:142)
- [docs/NBOS/03-Business-Logic/02-Order-to-Delivery-Process.md](/Users/user/{} Development/1. Production/nbos/docs/NBOS/03-Business-Logic/02-Order-to-Delivery-Process.md:72)
- [docs/NBOS/03-Business-Logic/06-Entity-Relationships.md](/Users/user/{} Development/1. Production/nbos/docs/NBOS/03-Business-Logic/06-Entity-Relationships.md:97)

Проблема:

- там ещё встречаются старые описания в духе `Backlog / To Do / Done`;
- или старая прямая цепочка `Product -> Sprint -> Task`, без `Work Space`;
- это уже конфликтует с новым task-каноном.

Что надо сделать:

- выровнять статусы под `Open / In Progress / Review / Completed / Deferred / Cancelled`;
- вставить `Work Space` между delivery-сущностью и sprint planning.

### B2. Messenger docs выровнены под новый Task Chat lifecycle

Где осталось:

- [docs/NBOS/02-Modules/09-Messenger/01-Internal-Messenger.md](/Users/user/{} Development/1. Production/nbos/docs/NBOS/02-Modules/09-Messenger/01-Internal-Messenger.md)
- [docs/NBOS/02-Modules/09-Messenger/06-Messenger-Cleanup-Register.md](/Users/user/{} Development/1. Production/nbos/docs/NBOS/02-Modules/09-Messenger/06-Messenger-Cleanup-Register.md)

Решение:

- Task Chat теперь описан как discussion stream внутри Task card;
- Messenger вкладка `Task Chats` используется в основном для ответа на unread task messages;
- закрытие задачи не удаляет chat history;
- task attachments идут через Drive File Assets.

Что осталось сделать:

- при реализации связать Task card, Messenger unread и Drive attachments единой моделью.

### B3. В части role/docs всё ещё говорится только “Scrum/Kanban board”, но не `Work Space`

Где осталось:

- [docs/NBOS/01-Platform-Overview/01-Vision-and-Goals.md](/Users/user/{} Development/1. Production/nbos/docs/NBOS/01-Platform-Overview/01-Vision-and-Goals.md:67)
- [docs/NBOS/01-Platform-Overview/02-Platform-Architecture-Layers.md](/Users/user/{} Development/1. Production/nbos/docs/NBOS/01-Platform-Overview/02-Platform-Architecture-Layers.md:77)
- [docs/NBOS/04-Roles-and-Access/01-Role-Definitions.md](/Users/user/{} Development/1. Production/nbos/docs/NBOS/04-Roles-and-Access/01-Role-Definitions.md:55)

Проблема:

- общий смысл не сломан, но терминология уже устарела;
- новый канон требует говорить не только про boards, а про `Work Space` как planning-shell.

Что надо сделать:

- позже дочистить RBAC / role docs под новый vocabulary.

---

## C. Устарело в коде и потом потребует реального рефакторинга

### C1. Shared и frontend task statuses пока старые

Подтверждение в коде:

- [packages/shared/src/constants/index.ts](/Users/user/{} Development/1. Production/nbos/packages/shared/src/constants/index.ts:47)
- [apps/web/src/features/tasks/constants/tasks.ts](/Users/user/{} Development/1. Production/nbos/apps/web/src/features/tasks/constants/tasks.ts:3)

Текущий runtime shape:

- `NEW`
- `IN_PROGRESS`
- `DONE`
- `DEFERRED`
- `CANCELLED`

Целевой канон:

- `OPEN`
- `IN_PROGRESS`
- `REVIEW`
- `COMPLETED`
- `DEFERRED`
- `CANCELLED`

Что потом нужно сделать:

- обновить shared enums и frontend badges;
- добавить `REVIEW`;
- заменить `NEW` на `OPEN`;
- заменить `DONE` на `COMPLETED`.

### C2. В базе и миграциях виден старый и уже конфликтный task-status legacy

Подтверждение в коде:

- [packages/database/prisma/migrations/20260311090945_init/migration.sql](/Users/user/{} Development/1. Production/nbos/packages/database/prisma/migrations/20260311090945_init/migration.sql:77)
- [packages/database/prisma/migrations/20260314150000_tasks_system_refactor/migration.sql](/Users/user/{} Development/1. Production/nbos/packages/database/prisma/migrations/20260314150000_tasks_system_refactor/migration.sql:91)

Что видно:

- изначально enum был `BACKLOG / TODO / IN_PROGRESS / REVIEW / DONE / CANCELLED`;
- потом в рефакторе добавили `NEW` и `DEFERRED`, а старые значения частично мигрировали;
- это уже отдельный технический долг даже до нового канона.

Что потом нужно сделать:

- привести DB enum к финальной целевой модели;
- аккуратно спланировать data migration;
- синхронизировать БД, API и frontend в одном refactor step.

### C3. TasksService has first completion rules runtime

Подтверждение в коде:

- [apps/api/src/modules/tasks/tasks.service.ts](/Users/user/{} Development/1. Production/nbos/apps/api/src/modules/tasks/tasks.service.ts:202)

Статус: `PHASE 4 COMPLETION RULES FOUNDATION`

Что уже сделано:

- Task stores explicit `completionRules`;
- `complete()` validates enabled rules before moving to `DONE`;
- unmet rules return human-readable blockers;
- checklist completion and open subtask rules are enforced from real runtime data;
- future rules such as review, attachment and creator approval block with clear `RUNTIME_NOT_AVAILABLE` instead of silently passing.

Проблема:

- full `Review` / approval runtime is intentionally deferred beyond Phase 4;
- final task status enum cleanup is still pending.

Что потом нужно сделать:

- пересобрать task state machine;
- добавить review/approval runtime;
- extend completion rules beyond the first checklist/subtask/runtime-pending foundation.

### C4. Work Space runtime foundation exists

Статус: `PHASE 4 RUNTIME + UI FOUNDATION`

Runtime now has the first Work Space foundation:

- `WorkSpace` schema entity exists;
- Product has one connected Work Space; Extension tasks use the parent Product Work Space;
- task records can link to a Work Space through `workspace_id`;
- task planning state is separate from workflow status through `planning_status`;
- API exposes Work Space list/detail/create/update and ensure endpoints for Product/Extension;
- web API types can call those endpoints;
- Product detail now exposes Work Space context in the former Tasks tab;
- Delivery Board context links can ensure the connected Product Work Space before opening it from Product or Extension cards.

Remaining depth:

- Sprint runtime model is deferred beyond Phase 4;
- workspace-level Kanban/Scrum views are deferred beyond Phase 4;
- migration from legacy board-only task views remains a later refactor.

### C5. Project task tab and deeper Work Space views still use legacy UI shape

Подтверждение в коде:

- [apps/web/src/features/projects/components/product-tabs/ProductTasksTab.tsx](/Users/user/{} Development/1. Production/nbos/apps/web/src/features/projects/components/product-tabs/ProductTasksTab.tsx:10)
- [apps/web/src/features/projects/components/tabs/TasksTab.tsx](/Users/user/{} Development/1. Production/nbos/apps/web/src/features/projects/components/tabs/TasksTab.tsx:10)
- [apps/web/src/app/(app)/projects/[id]/products/[productId]/page.tsx](/Users/user/{} Development/1. Production/nbos/apps/web/src/app/(app)/projects/[id]/products/[productId]/page.tsx:26)

Проблема:

- Product page now ensures and displays the connected Work Space, but still uses the old workflow columns;
- Project-level task tab still uses project-linked tasks only;
- kanban columns там ещё `NEW / IN_PROGRESS / DONE / DEFERRED`;
- full scrum planning layer in runtime UI ещё отсутствует.

Что потом нужно сделать:

- добавить workspace-level mode switching;
- убрать backlog/future sprint noise из daily board.

### C6. TaskSheet exposes completion rules, but review flow is still missing

Статус: `PHASE 4 UI FOUNDATION`

Подтверждение в коде:

- [apps/web/src/features/tasks/components/TaskSheet.tsx](/Users/user/{} Development/1. Production/nbos/apps/web/src/features/tasks/components/TaskSheet.tsx:128)
- [apps/web/src/features/tasks/components/TaskCompletionRulesPanel.tsx](/Users/user/{} Development/1. Production/nbos/apps/web/src/features/tasks/components/TaskCompletionRulesPanel.tsx:1)
- [apps/web/src/features/tasks/utils/task-completion-readiness.ts](/Users/user/{} Development/1. Production/nbos/apps/web/src/features/tasks/utils/task-completion-readiness.ts:1)

Проблема:

- нет review request / reviewer approve flow;
- attachment / creator approval / linked entity rules still require deeper runtime sources.

Что потом нужно сделать:

- добавить review/approval runtime;
- connect attachment and linked-entity rules to Drive/runtime sources.

### C7. Recurring существует, но ещё в упрощённой форме

Подтверждение в коде:

- [apps/api/src/modules/tasks/recurring-tasks.service.ts](/Users/user/{} Development/1. Production/nbos/apps/api/src/modules/tasks/recurring-tasks.service.ts:129)

Проблема:

- логика `computeNextCreateAt` пока упрощённая;
- нет богатой scheduling semantics уровня “каждый второй понедельник в 15:00” в полной форме;
- нет runtime differentiation по workspace types.

Что потом нужно сделать:

- расширить scheduling engine;
- связать recurring templates с workspace/context model;
- проверить таймзоны и due-date offsets.

### C8. Automation и blueprints пока смешаны в runtime

Подтверждение в коде:

- [apps/api/src/modules/automation/auto-tasks.service.ts](/Users/user/{} Development/1. Production/nbos/apps/api/src/modules/automation/auto-tasks.service.ts:162)

Проблема:

- сервис уже создаёт стартовые задачи;
- но по новому канону надо чётче разделять:
  - `Automation Rules`
  - `Task Blueprints`
- сейчас это ещё не разведено терминологически и архитектурно.

Что потом нужно сделать:

- разделить event-triggered tasks и launch task packs;
- сохранить совместимость с уже существующей генерацией задач по `productType`.

---

## Очерёдность зачистки

Когда перейдём от документации к реализации, приоритет лучше держать таким:

1. Phase 4 done: runtime-сущность `Work Space`;
2. Phase 4 done: connected Work Space in Product/Extension delivery UI;
3. Phase 4 done: completion rules runtime foundation and blocker UI;
4. later: привести task statuses к новому канону в DB/shared/backend/frontend;
5. later: реализовать `Review`;
6. later: перестроить project task UI и full workspace views;
7. later: расширять recurring / automation / blueprints.

---

## Вывод

Текущий runtime по задачам не пустой и не хаотичный. Он уже содержит:

- отдельную сущность `Task`;
- links;
- subtasks/checklists;
- recurring templates;
- auto-generated tasks;
- my plan / kanban board stages.

После Phase 4 foundation новый канон всё ещё требует следующих крупных шагов:

- status enum cleanup;
- review/approval runtime;
- full `Task + Work Space + Sprint + Completion Rules` depth.
