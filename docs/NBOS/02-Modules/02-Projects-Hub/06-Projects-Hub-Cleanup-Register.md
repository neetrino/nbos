# Projects Hub Cleanup Register

> NBOS Platform - реестр устаревшей логики, старых формулировок и обязательной зачистки после обновления канона Projects Hub

## Назначение

Этот файл нужен, чтобы после согласования нового канона `Projects Hub` команда не продолжила опираться на старые модели:

- где `Projects Hub` смешан с CRM;
- где `Creating` ещё считается отдельной основной стадией;
- где `On Hold` живёт как stage, а не как pause-status;
- где `Lost` ещё используется вместо `Cancelled`;
- где delivery board ещё не отделена от project shell.

Реестр делит находки на три типа:

1. уже совпадает с новым каноном и это нужно сохранить;
2. устарело только в документации / UI-описаниях;
3. устарело в runtime-коде и потом потребует реального рефакторинга.

Связанный канон:

- `01-Project-Hub-Overview.md`
- `02-Project-Card.md`
- `03-Products-and-Extensions.md`
- `04-Project-Lifecycle.md`
- `05-Product-Centric-Navigation.md`
- `../../01-Platform-Overview/03-Core-Entities-and-Data-Model.md`

---

## A. Уже совпадает с каноном и должно остаться

### A1. Product-centric direction уже есть в каноне

Подтверждение в docs:

- [docs/NBOS/02-Modules/02-Projects-Hub/05-Product-Centric-Navigation.md](/Users/user/{} Development/1. Production/nbos/docs/NBOS/02-Modules/02-Projects-Hub/05-Product-Centric-Navigation.md:1)

Вывод:

- идея, что основной рабочий контекст должен быть вокруг `Product`, уже давно заложена;
- новый канон не ломает направление модуля, а делает его более строгим и operational.

### A2. Projects Hub уже мыслится как вычисляемые views, а не набор отдельных хранилищ

Подтверждение в docs:

- [docs/NBOS/01-Platform-Overview/01-Vision-and-Goals.md](/Users/user/{} Development/1. Production/nbos/docs/NBOS/01-Platform-Overview/01-Vision-and-Goals.md:86)

Вывод:

- board/view подход уже соответствует общей архитектуре платформы;
- это хорошо сочетается с новым правилом, что `Delivery Board` — это view над `Product` и `Extension`, а не отдельная сущность.

### A3. Базовая stage-gate логика для product/extension уже существует в runtime

Подтверждение в коде:

- [apps/api/src/modules/projects/products/products.service.ts](/Users/user/{} Development/1. Production/nbos/apps/api/src/modules/projects/products/products.service.ts:11)
- [apps/api/src/modules/projects/extensions/extensions.service.ts](/Users/user/{} Development/1. Production/nbos/apps/api/src/modules/projects/extensions/extensions.service.ts:10)

Вывод:

- в runtime уже есть контроль допустимых переходов и базовая валидация;
- модуль не надо проектировать с нуля;
- дальше потребуется не создавать stage gates заново, а перестраивать их под новый канон.

---

## B. Устарело только в документации или описаниях

### B1. Старый Projects Hub ещё местами описан как продолжение CRM

Где осталось:

- [docs/NBOS/03-Business-Logic/02-Order-to-Delivery-Process.md](/Users/user/{} Development/1. Production/nbos/docs/NBOS/03-Business-Logic/02-Order-to-Delivery-Process.md:17)
- [docs/NBOS/03-Business-Logic/01-Lead-to-Cash-Process.md](/Users/user/{} Development/1. Production/nbos/docs/NBOS/03-Business-Logic/01-Lead-to-Cash-Process.md:213)
- [docs/NBOS/02-Modules/01-CRM/04-Offers-and-Handoff.md](/Users/user/{} Development/1. Production/nbos/docs/NBOS/02-Modules/01-CRM/04-Offers-and-Handoff.md:104)

Проблема:

- старые тексты всё ещё тянут `Creating` и delivery-движение как будто это продолжение CRM handoff flow;
- это конфликтует с новым правилом, что `Projects Hub` начинается уже после создания delivery-сущности.

Что надо сделать:

- дочистить cross-module формулировки;
- везде отделить `CRM handoff` от `Projects Hub operational lifecycle`.

### B2. Старые названия стадий `New / Creating / Lost` всё ещё живут в смежных docs

Где осталось:

- [docs/NBOS/archive/00-Technical-Architecture-Brief.md](/Users/user/{} Development/1. Production/nbos/docs/NBOS/archive/00-Technical-Architecture-Brief.md:58)
- [docs/NBOS/03-Business-Logic/02-Order-to-Delivery-Process.md](/Users/user/{} Development/1. Production/nbos/docs/NBOS/03-Business-Logic/02-Order-to-Delivery-Process.md:68)
- [docs/NBOS/03-Business-Logic/06-Entity-Relationships.md](/Users/user/{} Development/1. Production/nbos/docs/NBOS/03-Business-Logic/06-Entity-Relationships.md:250)
- [docs/NBOS/05-UI-Specifications/03-Project-Hub-Pages.md](/Users/user/{} Development/1. Production/nbos/docs/NBOS/05-UI-Specifications/03-Project-Hub-Pages.md:187)
- [docs/NBOS/05-UI-Specifications/05-Task-and-Support-Pages.md](/Users/user/{} Development/1. Production/nbos/docs/NBOS/05-UI-Specifications/05-Task-and-Support-Pages.md:164)

Проблема:

- старый lifecycle всё ещё размазан по нескольким документам;
- это будет снова путать реализацию, если не зачистить.

Что надо сделать:

- заменить старые линейки стадий на:
  - `Starting`
  - `Development`
  - `QA`
  - `Transfer`
- `On Hold` описывать как pause-status;
- `Done / Cancelled` описывать как terminal outcomes / closed view.

### B3. Отдельная Delivery Board ещё не прописана во всех UI docs

Где осталось:

- [docs/NBOS/05-UI-Specifications/03-Project-Hub-Pages.md](/Users/user/{} Development/1. Production/nbos/docs/NBOS/05-UI-Specifications/03-Project-Hub-Pages.md:21)
- [docs/NBOS/00-Delta-New-Description.md](/Users/user/{} Development/1. Production/nbos/docs/NBOS/00-Delta-New-Description.md:114)

Проблема:

- product-centric direction упомянута, но отдельная `Delivery Board` как operational board с карточками `Product` и `Extension` ещё не зафиксирована везде одинаково;
- без этого можно снова свалиться в "одну большую карточку проекта".

Что надо сделать:

- выровнять UI docs под модель:
  - `Projects List`
  - `Project Shell`
  - `Delivery Board`
  - `Product / Extension card details`

### B4. Старое описание extension как необязательной связи с product больше не подходит

Где осталось:

- [docs/NBOS/03-Business-Logic/06-Entity-Relationships.md](/Users/user/{} Development/1. Production/nbos/docs/NBOS/03-Business-Logic/06-Entity-Relationships.md:260)

Проблема:

- старые тексты допускают слишком мягкую модель extension;
- новый канон уже жёстче: `Extension` всегда внутри `Project` и всегда с одним основным `Product`.

Что надо сделать:

- дочистить оставшиеся тексты, где extension описан слишком абстрактно.

---

## C. Устарело в коде и потом потребует реального рефакторинга

### C1. Runtime product statuses всё ещё старые

Подтверждение в коде:

- [packages/shared/src/constants/index.ts](/Users/user/{} Development/1. Production/nbos/packages/shared/src/constants/index.ts:22)
- [apps/web/src/features/projects/constants/projects.ts](/Users/user/{} Development/1. Production/nbos/apps/web/src/features/projects/constants/projects.ts:54)
- [apps/api/src/modules/projects/products/products.service.ts](/Users/user/{} Development/1. Production/nbos/apps/api/src/modules/projects/products/products.service.ts:11)

Текущий runtime shape:

- `NEW`
- `CREATING`
- `DEVELOPMENT`
- `QA`
- `TRANSFER`
- `ON_HOLD`
- `DONE`
- `LOST`

Целевой канон:

- stage: `STARTING / DEVELOPMENT / QA / TRANSFER`
- work status: `ACTIVE / ON_HOLD`
- resolution: `DONE / CANCELLED / null`

Что потом нужно сделать:

- пересобрать shared enums;
- отделить stage от pause-status и terminal outcome;
- заменить `CREATING` на `STARTING`;
- заменить `LOST` на `CANCELLED`;
- обновить backend transitions, DTO, tests и frontend badges.

### C2. Runtime extension statuses тоже старые

Подтверждение в коде:

- [packages/shared/src/constants/index.ts](/Users/user/{} Development/1. Production/nbos/packages/shared/src/constants/index.ts:181)
- [apps/web/src/features/projects/constants/projects.ts](/Users/user/{} Development/1. Production/nbos/apps/web/src/features/projects/constants/projects.ts:80)
- [apps/api/src/modules/projects/extensions/extensions.service.ts](/Users/user/{} Development/1. Production/nbos/apps/api/src/modules/projects/extensions/extensions.service.ts:10)

Текущий runtime shape:

- `NEW`
- `DEVELOPMENT`
- `QA`
- `TRANSFER`
- `DONE`
- `LOST`

Целевой канон:

- stage: `STARTING / DEVELOPMENT / QA / TRANSFER`
- work status: `ACTIVE / ON_HOLD`
- resolution: `DONE / CANCELLED / null`

Что потом нужно сделать:

- синхронизировать extension lifecycle с product lifecycle;
- добавить pause workflow;
- заменить `NEW` на `STARTING`;
- заменить `LOST` на `CANCELLED`;
- обновить frontend list/board counters и backend validation.

### C3. Frontend transitions и board helpers всё ещё живут по старой схеме

Подтверждение в коде:

- [apps/web/src/features/projects/components/product-tabs/ProductOverviewTab.tsx](/Users/user/{} Development/1. Production/nbos/apps/web/src/features/projects/components/product-tabs/ProductOverviewTab.tsx:20)
- [apps/web/src/features/projects/components/tabs/ExtensionsTab.tsx](/Users/user/{} Development/1. Production/nbos/apps/web/src/features/projects/components/tabs/ExtensionsTab.tsx:54)

Проблема:

- UI сейчас опирается на старые allowed transitions и старые active statuses;
- `On Hold` пока рассматривается как stage-переход, а не как overlay status;
- `Closed` как separate terminal view ещё не реализован по новому канону.

Что потом нужно сделать:

- перестроить board logic под:
  - active stages;
  - pause-status;
  - terminal close area;
- добавить drag-to-close поведение;
- добавить `Done / Cancelled` terminal workflow;
- реализовать visual expired-hold state.

### C4. Product / Extension stage-gate validation пока уже нового канона не покрывает полностью

Подтверждение в коде:

- [apps/api/src/modules/projects/products/products.service.ts](/Users/user/{} Development/1. Production/nbos/apps/api/src/modules/projects/products/products.service.ts:33)
- [apps/api/src/modules/projects/extensions/extensions.service.ts](/Users/user/{} Development/1. Production/nbos/apps/api/src/modules/projects/extensions/extensions.service.ts:19)

Текущий known gap:

- валидации пока знают только часть старых переходов;
- cumulative popup validation для прыжка сразу в `Done` нет;
- hold metadata не описана;
- разделения между active stage, pause state и resolution нет.

Что потом нужно сделать:

- расширить stage-gate contracts;
- вернуть structured blocker responses;
- добавить cumulative validation;
- отдельно поддержать:
  - `Put On Hold`
  - `Resume`
  - `Extend Hold`
  - `Close as Done`
  - `Close as Cancelled`

### C5. Extension linkage в runtime надо проверить на жёсткую обязательность `project + product`

Подтверждение в коде:

- [apps/api/src/modules/projects/extensions/extensions.service.ts](/Users/user/{} Development/1. Production/nbos/apps/api/src/modules/projects/extensions/extensions.service.ts:19)
- [docs/NBOS/01-Platform-Overview/03-Core-Entities-and-Data-Model.md](/Users/user/{} Development/1. Production/nbos/docs/NBOS/01-Platform-Overview/03-Core-Entities-and-Data-Model.md:192)

Проблема:

- старый runtime и старые docs долго жили с более мягкой моделью extension;
- новый канон уже требует жёсткой связи с `Project` и `Product`.

Что потом нужно сделать:

- отдельно проверить create/update flows extension;
- если `productId` не обязателен в runtime, поднять это до обязательного правила;
- проверить CRM -> Projects handoff и support -> extension flows.

---

## Очерёдность зачистки

Когда перейдём от документации к реализации, приоритет лучше держать таким:

1. дочистить stale docs в UI / business logic / cross-module handoff;
2. привести shared/backend/frontend statuses к новому lifecycle;
3. реализовать новую board logic:
   - active stages
   - hold overlay
   - closed terminal view
4. перестроить product/extension stage gates и cumulative popup validation;
5. после этого уже полировать вторичные project views и visual details.

---

## Решение по старому `Creating`

Текущий вывод:

- `Creating` считать устаревшим названием основной delivery-стадии;
- его бизнес-смысл не выбрасывается, а переносится в `Starting` и в stage-gate правила стартового этапа;
- отдельная operational board должна называться не `Creating Board`, а `Delivery Board`.
