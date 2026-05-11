# Delivery Board

> NBOS Delivery Board - главный рабочий экран процесса разработки и передачи Product / Extension.

## 1. Назначение

`Delivery Board` - отдельная operational page в левом меню NBOS.

Она нужна, чтобы вся команда видела и вела delivery lifecycle в одном месте:

- все активные `Product`;
- все активные `Extension`;
- текущие стадии;
- readiness текущего stage;
- blockers;
- deadline risks;
- pause / resume / cancel / done actions;
- переходы между этапами разработки.

`Delivery Board` не является новым хранилищем данных и не создаёт отдельную database-сущность `DeliveryBoard`.

Источник истины остаётся в:

- `Product`;
- `Extension`;
- stage gate requirements;
- tasks;
- credentials;
- files;
- finance/payment state;
- technical readiness;
- activity/audit.

Board только собирает эти данные в один рабочий экран.

---

## 2. Главное решение канона

Раньше `Delivery Board v1` была встроена в Project page как board внутри конкретного проекта.

Новый канон:

```text
Left Menu
  Delivery Board
```

`Delivery Board` становится отдельной страницей и главным экраном lifecycle.

`Project page` очищается и остаётся оболочкой проекта:

- короткая информация о проекте;
- клиент / компания как контекст;
- список продуктов карточками;
- короткие агрегаты;
- ссылки в рабочие зоны.

Project page не должен быть тяжёлым операционным экраном, где команда ведёт всю разработку.

Важно:

```text
Project-level delivery classification is deprecated.
```

Delivery Board не использует старую project-level классификацию.

Рабочая классификация lives on:

- `Product.productCategory`;
- `Product.productType`;
- `Extension.size`;
- stage requirements;
- checklist template assignment.

---

## 3. Route and navigation

Целевой route:

```text
/delivery-board
```

Левое меню:

```text
Delivery Board
Projects
Tasks
Work Spaces
...
```

Почему top-level:

- это ежедневный рабочий экран PM / Delivery / Developer / QA;
- lifecycle разработки не должен быть спрятан внутри одного проекта;
- на board должны быть все `Product` и `Extension` компании;
- Dashboard pinned action должен вести прямо сюда.

Внутри `Project Hub` остаются project/product pages, но не как основной board lifecycle.

### 3.1. Детальный шит карточки (drill-down)

По клику на карточку открывается **боковая панель** с вкладками. На вкладке **General** правки планирования ведутся в **черновике** и сохраняются одним действием через **Save / Cancel** в нижней части шита (аналогично по UX паттерну CRM Lead/Deal; см. `../../05-UI-Specifications/02-CRM-Pages.md` §8).

После успешного сохранения: перезагрузка полной сущности `Product` / `Extension` внутри шита и колбэк обновления данных доски у родительской страницы. Иконка **Settings** в шапке даёт быстрый переход в рабочую зону продукта (**Open workspace**).

---

## 4. Что попадает на Delivery Board

На board попадают только delivery-сущности:

| Entity      | Когда появляется                                        | Где source of truth                        |
| ----------- | ------------------------------------------------------- | ------------------------------------------ |
| `Product`   | После `Deal Won` и создания `Order + Project + Product` | Product record                             |
| `Extension` | После `Deal Won` и создания `Order + Extension`         | Extension record linked to Project/Product |

Maintenance не является обычной карточкой Delivery Board.

Maintenance живёт как отдельный operating mode существующего продукта и связан с Finance / Subscription logic.

---

## 5. Lifecycle

Общая active цепочка для `Product` и `Extension`:

```text
Starting -> Development -> QA -> Transfer
```

Terminal outcomes:

```text
Done
Cancelled
```

Pause status:

```text
On Hold
```

Правила:

- `On Hold` не является колонкой;
- `On Hold` накладывается поверх текущего stage;
- `Done` и `Cancelled` не являются active columns;
- закрытые карточки живут в `Closed` view;
- stage movement всегда проходит через stage gates.

---

## 6. Board views and filters

Top-level modes:

```text
Active
Closed
```

### 6.1. Active view

Default active view:

```text
Active Board
  Starting | Development | QA | Transfer
```

Обязательные фильтры:

- `All`;
- `My items`;
- `Products`;
- `Extensions`;
- `On Hold`;
- `Blocked`;
- `Deadline risk`;
- `Closed`.

Операционные сортировки:

- deadline soon;
- overdue first;
- blocker first;
- owner / PM;
- client / project;
- product type;
- stage readiness.

### 6.2. Closed view

`Closed` показывает delivery items, которые завершились terminal outcome:

- `Done`;
- `Cancelled`.

Closed view должен иметь два режима отображения:

| View           | Назначение                                                             |
| -------------- | ---------------------------------------------------------------------- |
| `Table / List` | Default. Быстрый поиск, фильтры, анализ закрытых работ, причины и даты |
| `Board`        | Привычный визуальный режим с двумя колонками: `Done` и `Cancelled`     |

Closed Board layout:

```text
Done | Cancelled
```

В Closed Board нельзя свободно drag/drop между `Done` и `Cancelled`. Это archive mode. Изменение результата, если когда-нибудь понадобится, должно быть отдельным permissioned action с audit.

Closed filters:

- result: `Done` / `Cancelled` / `All`;
- project;
- client;
- PM / owner;
- entity kind: Product / Extension;
- closed date range;
- product type;
- deadline result: on time / late.

Closed view не удаляет и не урезает данные. Он меняет только способ отображения закрытых delivery items.

---

## 7. Delivery card outside view

Внешняя карточка на active board должна быть компактной.

Она не показывает длинные списки обязательных пунктов. Все детали открываются внутри карточки.

Минимальный состав:

- entity badge: `Product` / `Extension`;
- name;
- project / client;
- current stage;
- PM / assignee;
- deadline + risk marker;
- pause/blocker badge если есть;
- compact readiness indicator текущего stage.

### 7.1. Stage Readiness Indicator

На внешней карточке показывается только один indicator - readiness текущего stage.

Не показывать четыре индикатора по всем stages на board card. Это перегрузит доску.

Целевой вид:

```text
segmented ring
center: 7/10 or 70%
```

Рекомендация для MVP:

- в центре показывать `7/10`;
- tooltip или opened card может показывать процент;
- сегменты показывают required items текущего stage;
- completed сегменты зелёные;
- missing required сегменты серые или amber;
- blocker/critical segment красный;
- если всё готово, ring зелёный.

Пример:

```text
Starting
[ segmented ring: 7/10 ]
```

Смысл:

- внешний board отвечает на вопрос "можно ли двигать текущий stage дальше?";
- детали отвечает opened card.

### 7.2. Closed outside card

В Closed Board внешняя карточка может быть compact или normal density.

Минимальный compact состав:

- entity badge: `Product` / `Extension`;
- name;
- project / client;
- result: `Done` / `Cancelled`;
- PM / owner;
- closed date;
- deadline result: on time / late;
- acceptance marker для `Done`;
- cancellation reason marker для `Cancelled`.

Closed outside card может быть визуально проще active card, потому что закрытые items уже не двигаются по lifecycle.

Но это правило относится только к внешней карточке. Открытая карточка должна быть полной.

---

## 8. Opened Delivery Card

При клике открывается detail drawer / full card.

Она должна быть полноценной рабочей карточкой delivery-сущности.

Это правило одинаково для active и closed items.

Если карточка закрыта как `Done` или `Cancelled`, opened card всё равно показывает полный delivery context и историю. Закрытие не удаляет данные и не превращает карточку в урезанный архив.

Основные зоны:

- Working cockpit;
- Stage Gate Timeline;
- Blockers;
- Tasks / Work Space;
- Credentials / Accesses;
- Technical readiness;
- Finance dependencies;
- Files / handoff documents;
- Support links;
- Activity / Audit.

### 8.1. Layout principle

Детализированная **UI-спецификация** shell, колонок, табов и breakpoints: [`../../05-UI-Specifications/07-Professional-Delivery-Card.md`](../../05-UI-Specifications/07-Professional-Delivery-Card.md).

Opened card должна быть широкой, как Deal detail card / drawer, но содержательно оптимизированной под delivery.

Правильный визуальный подход:

- использовать знакомый Deal-style shell: wide drawer, sticky header, tabs, activity-friendly layout;
- не копировать Deal card один-в-один;
- сделать отдельный delivery-focused design внутри того же визуального языка платформы;
- на desktop использовать 2-3 колонки, чтобы не превращать карточку в длинную простыню;
- на mobile превращать колонки в последовательные sections.

Header всегда sticky.

Header показывает:

- entity kind: `Product` / `Extension`;
- name;
- current stage;
- work status: `Active` / `On Hold`;
- resolution for closed items: `Done` / `Cancelled`;
- segmented current-stage readiness;
- deadline / risk;
- main actions.

Primary actions:

- move to next stage;
- pause / resume;
- Done;
- Cancel;
- open Work Space;
- open source Product / Extension page.

### 8.2. First screen priority

Первый экран opened card должен показывать не "всё, что мы знаем", а только то, что нужно каждый день для ведения работы.

Daily core:

- current stage;
- readiness текущего stage;
- blockers;
- deadline;
- PM / delivery owner;
- active specialists: developer, designer, tech specialist, QA where relevant;
- requirements / stage timeline visible on the first screen;
- active checklist requirement;
- key work links;
- languages selector;
- files summary / quick attach;
- credentials readiness summary;
- payment setup status only when applicable.

Secondary context:

- order link;
- seller;
- client / company details;
- comments;
- full finance details;
- full activity history.

Secondary context не удаляется, но уходит в tabs / expandable blocks.

### 8.3. Conditional fields

Поля должны появляться только там, где они реально применимы.

| Field                                                 | Когда показывать                                                  |
| ----------------------------------------------------- | ----------------------------------------------------------------- |
| Payment setup                                         | ecommerce, SaaS, paid portal, checkout, subscription/payment flow |
| Platform design URL / ID                              | только `Product.productCategory = WORDPRESS`                      |
| Languages                                             | всегда; первый выбранный язык считается primary product language  |
| Domain                                                | website/web app/app delivery with domain dependency               |
| Hosting                                               | delivery with infrastructure dependency                           |
| Admin / Client Admin / Mail / API Key / Service / ENV | when credentials/accesses are required                            |
| App iOS / App Android                                 | mobile app delivery                                               |

Credentials не должны превращать first screen в список паролей.

Правильный UX:

- first screen показывает status/count/readiness и быстрые действия;
- полный доступ к значениям идёт через access block/modal/drawer с RBAC;
- credentials выбираются из existing vault или создаются через controlled add flow;
- raw secret visibility obeys Credentials RBAC.

### 8.4. Tabs

Opened Delivery Card имеет tabs только для отдельных рабочих миров, которые не должны перегружать первый экран.

Recommended tabs:

| Tab          | Назначение                                                            |
| ------------ | --------------------------------------------------------------------- |
| `Work Space` | Product Work Space / tasks; MVP может показать кнопку перехода        |
| `Calls`      | calls with client since this card was created; MVP placeholder/button |
| `Bonus`      | product/extension bonus visibility by RBAC                            |
| `History`    | audit, stage movement, activity, important changes                    |

First screen is the main working cockpit, not a tab named `Overview`.

First-screen blocks:

- `Stage Summary`;
- `Requirements / Stage Timeline`;
- `Team`;
- `Accesses`;
- `Files`;
- `Key Work Links`;
- `Blockers / Risks`;
- `Languages`;
- `Conditional Setup`;
- `Comments / Notes`.

`Requirements / Stage Timeline` UX is intentionally not final yet. It must be visible from the first screen, but the final design may be:

- a slim side rail;
- a horizontal colorful timeline;
- a dedicated expanded panel;
- or, if the design becomes too heavy, a separate `Requirements` tab.

Requirement items must be visually clear and colored by state, so a PM/developer can immediately see what is done, what remains, and what blocks the next stage.

`Calls` tab не обязан физически хранить звонки на Product.

Канон:

- calls остаются привязаны к client/contact/communication source;
- Delivery Card показывает filtered projection: calls after card creation and relevant to this client/product context.

`Finance / Bonus` tab:

- employee видит свои bonuses по Product/Extension;
- CEO / Founder / allowed finance roles видят all bonus entries;
- finance-sensitive amounts obey Finance permissions.

Для closed items дополнительно показывать:

- final result: `Done` / `Cancelled`;
- closed date;
- closed by;
- client acceptance / final note for `Done`;
- cancellation reason for `Cancelled`;
- deadline result: on time / late;
- immutable audit/history of stage movement and requirement completion.

По умолчанию closed opened card read-only. Reopen или change resolution, если будут нужны, должны быть отдельными permissioned actions с audit.

### 8.5. Stage Gate Timeline

Главная секция opened card - `Stage Gate Timeline`.

Она показывает все stages:

```text
Starting
Development
QA
Transfer
```

Текущий stage раскрыт по умолчанию.

Future stages видны, но компактные и серые. Они нужны, чтобы команда понимала всю дорогу заранее, но не перегружалась будущими деталями.

Для каждого stage показывать:

- completed / total required count;
- required checklist items;
- optional checklist items отдельно;
- owner role/person;
- status;
- due/overdue если есть;
- evidence/value/file/link если требуется;
- action для заполнения.

Пример:

```text
Starting      7/10 Active
Development   0/8 Future
QA            0/12 Future
Transfer      0/6 Future
```

### 8.6. Required items by stage

У каждого stage свои обязательные пункты.

Они могут заполняться разными сотрудниками:

- PM;
- Seller;
- Developer;
- Tech specialist;
- QA;
- Finance;
- Head of Delivery;
- CEO if approval is required.

Принцип:

```text
Card cannot move to the next stage until all required items for current stage are done.
```

Если пользователь пытается прыгнуть через stage или сразу закрыть `Done`, система выполняет cumulative validation по всем пропущенным stages.

---

## 9. Stage requirements configuration

Stage gate requirements должны быть configuration-driven.

Они зависят от:

- entity kind: `Product` / `Extension`;
- product type: Website / Mobile App / CRM / Logo / Other;
- extension size/scope;
- payment model: Classic / Subscription;
- current stage;
- role ownership;
- module dependencies.

Не делать один общий checklist для всех.

Важно:

```text
Stage readiness is calculated from Stage Requirements.
Checklist is only one possible Stage Requirement type.
```

Пример:

```text
Starting requirements
  - Developer selected
  - Designer selected
  - Tech specialist selected
  - PM reviewed technical task
  - Client data received
  - Kickoff Checklist completed
```

`Kickoff Checklist completed` считается одним requirement на уровне stage. Внутри него есть собственные checklist items.

Requirement shape:

```text
StageRequirement
  id
  entityKind
  stage
  productType / extensionSize
  title
  description
  required
  ownerRole
  evidenceType
  sourceModule
  blockerSeverity
  sortOrder
```

Evidence examples:

- boolean confirmation;
- text value;
- date;
- file;
- linked credential;
- linked task;
- linked technical asset;
- finance/payment condition;
- client acceptance note.

### 9.1. Checklist requirement type

Если requirement имеет `type = CHECKLIST`, он создаёт checklist instance из reusable Checklist Template.

Checklist template не хранится внутри Delivery Board. Он создаётся и версионируется в My Company / SOP & Templates.

См. `../07-My-Company/08-Checklist-Template-Builder.md`.

Checklist requirement считается completed, когда checklist instance completed.

Checklist completion не означает, что все пункты внутри checklist отмечены `Done`.

Внутри checklist есть лёгкие item marks:

- `Pending`;
- `Done`;
- `Not Done`.

Checklist можно завершить, если все `decisionRequired` items имеют решение `Done` или `Not Done`, а каждый `Not Done` имеет reason/comment.

Это нужно, чтобы specialist обязательно прошёл важные пункты и принял решение по каждому, но не был вынужден искусственно отмечать `Done` для того, что не сделано.

### 9.2. Stage template assignment

Для каждого stage/entity kind/product taxonomy можно назначать разные checklist templates.

Не использовать project-level delivery classification.

Старый вариант на уровне project deprecated. Если нужна разная логика поставки, она должна выражаться через product taxonomy и configuration:

- `Product.productCategory`;
- `Product.productType`;
- `Extension.size`;
- payment model;
- technical profile;
- selected stage requirement set.

Пример:

```text
Product Category = WordPress
Product Type = Company Website
Stage = Development
Requirement type = CHECKLIST
Checklist Template = WordPress Development Checklist
```

Для 80% случаев может использоваться default template, а для сложных случаев - alternative template:

```text
Website / Starting / Default
Website / Starting / Complex
WordPress / Development / Default
WordPress / Development / Ecommerce
Website / QA / Default
Website / Transfer / Default
```

Это assignment живёт в Delivery Board stage requirement configuration, а сам checklist template живёт в Checklist Template Builder.

---

## 10. PM Intake / Kickoff Readiness

Old `PM Intake` panel на Project page считается переходным UI.

Канон:

```text
PM Intake as a large Project page panel is deprecated.
Kickoff readiness remains canonical as Starting stage gate.
```

То есть логику не удаляем:

- handoff summary;
- kickoff checklist;
- paid invoice condition;
- PM assigned;
- deadline;
- credentials/access readiness.

Но место меняется:

- на Delivery Board card - только compact readiness indicator;
- в opened Delivery Card - Starting stage requirements;
- на Product page - Product Overview / Stage Gate section;
- на Project page - максимум маленький readiness badge на Product card.

Правильное имя для новой логики:

```text
Kickoff Readiness
```

или шире:

```text
Delivery Readiness
```

`PM Intake` можно оставить как legacy/internal name в коде до refactor, но в новом UX лучше не использовать как главный label.

---

## 11. Project page relationship

Project page не должна рендерить текущую тяжёлую Delivery Board v1.

Целевой Project page:

```text
Project header
Short project info
Product cards
Optional compact extension summary
Links to Delivery Board filtered by project
```

На product cards допустим compact readiness badge:

- stage;
- current-stage readiness ring;
- blocker marker;
- deadline risk.

Большой Project-level `Tasks` block не должен рендериться на основной Project page.

Правило:

- delivery tasks живут в Product Work Space;
- extension tasks живут в Work Space родительского Product;
- Project page может показывать только compact task counters и ссылки;
- полный execution UI открывается из Product, Work Space, Delivery Board card или global Tasks filter.

Но full checklist editing и stage movement должны происходить в:

- Delivery Board;
- opened Delivery Card;
- Product detail.

### Future filtered reuse

В будущем можно вернуть delivery block на Project page, но только как переиспользование того же core component:

```text
DeliveryBoardCore
  -> DeliveryBoardPage, all items
  -> ProjectDeliverySection, projectId filter
```

Это будущий optional slice, а не обязательная часть MVP.

Если он появится, он должен:

- lazy-load данные;
- использовать те же cards/drawer/actions/stage gates;
- не дублировать логику;
- не превращать Project page обратно в тяжёлый board.

---

## 12. Actions

Основные actions:

- move to next stage;
- pause with reason and `onHoldUntil`;
- resume;
- cancel with reason;
- complete / Done;
- open product;
- open extension context;
- open tasks;
- open credentials;
- open technical readiness;
- open finance dependency;
- open support links.

Stage movement:

- проверяет current stage requirements;
- при прыжке вперёд проверяет cumulative requirements;
- при fail показывает missing items;
- missing items должны вести в точное место заполнения.

Cancel:

- доступен из любой active stage;
- требует reason;
- уходит в `Closed / Cancelled`;
- пишет audit.

Done:

- может быть доступен из любой stage;
- требует cumulative validation;
- уходит в `Closed / Done`;
- запускает downstream bonus/finance readiness там, где это описано в Finance/Bonus canon.

---

## 13. Data projection and API

MVP может собрать board из существующих endpoints:

- `GET /api/projects/products`;
- `GET /api/projects/extensions`.

Целевой вариант:

```text
GET /api/delivery-board
```

или:

```text
GET /api/projects/delivery-board
```

Endpoint должен отдавать unified projection:

```text
DeliveryBoardItem
  id
  entityKind
  project
  client
  name
  currentStage
  workStatus
  resolution
  owner
  deadline
  deadlineRisk
  readiness
  blockers
  counts
  links
```

`readiness`:

```text
currentStage
completedRequired
totalRequired
percentage
hasBlocker
hasOverdue
segments
```

Board API не должен отдавать тяжёлые детали всех checklist items для всех карточек сразу.

Полные stage requirements грузятся при открытии карточки:

```text
GET /api/delivery-board/items/:kind/:id
```

или через существующие product/extension detail endpoints.

---

## 14. RBAC

Видимость:

- CEO / Owner / Head of Delivery - все cards;
- PM - свои cards и cards своей команды;
- Developer / QA / Designer - cards, где они участвуют;
- Seller - read-only delivery visibility по своим deals/projects;
- Finance - read-only delivery status + finance-dependent actions where allowed.

Actions:

- stage movement - PM / Head of Delivery / allowed delivery roles;
- technical requirements - technical owner / developer / tech specialist;
- QA requirements - QA / PM;
- finance requirements - Finance;
- cancel - Head of Delivery / CEO or configured permission;
- Done - PM / Head of Delivery after validation.

Board не должен показывать пользователю больше данных, чем он может видеть в source modules.

---

## 15. Dashboard integration

Dashboard pinned action должен называться:

```text
Delivery Board
```

а не:

```text
Product Board
```

Причина:

- board ведёт не только `Product`;
- на ней есть `Extension`;
- главный смысл - delivery lifecycle, blockers и stage gates.

Dashboard action target:

```text
/delivery-board
```

Dashboard widgets могут вести в filtered board:

- `2 products at risk` -> `/delivery-board?filter=deadline-risk`;
- `3 blocked delivery items` -> `/delivery-board?filter=blocked`;
- `5 QA waiting items` -> `/delivery-board?stage=QA`.

---

## 16. Implementation phases

### Phase 1 - Canon and cleanup

- Add this canon document.
- Update old docs that describe Delivery Board inside Project detail as the main board.
- Mark embedded Project Delivery Board v1 as transitional.
- Rename Dashboard action from `Product Board` to `Delivery Board` in docs.

### Phase 2 - Global Delivery Board MVP

- Add left menu item `Delivery Board`.
- Add route `/delivery-board`.
- Reuse existing lifecycle actions.
- Show Product + Extension cards in active columns.
- Add current-stage segmented readiness ring.
- Open card drawer with Stage Gate Timeline.
- Keep Project page clean.

### Phase 3 - Stage requirements depth

- Make stage requirements configurable by entity kind/type/stage.
- Add role ownership per requirement.
- Add exact missing-item actions.
- Add blocker severity.
- Add richer technical/finance/credential evidence.

### Phase 4 - Optional project filtered reuse

- Add Project page compact delivery section only if needed.
- Use `DeliveryBoardCore` filtered by `projectId`.
- Lazy-load it.
- Do not duplicate board logic.

---

## 17. Decisions

| Decision                                              | Status   |
| ----------------------------------------------------- | -------- |
| Delivery Board is a separate left-menu page           | Accepted |
| Delivery Board is not a separate database entity      | Accepted |
| Project page should be cleaned from heavy delivery UI | Accepted |
| Embedded Project Delivery Board v1 is transitional    | Accepted |
| Outside card shows one current-stage readiness ring   | Accepted |
| Opened card shows full Stage Gate Timeline            | Accepted |
| PM Intake panel moves into Kickoff/Delivery Readiness | Accepted |
| Future Project page delivery block must reuse core    | Accepted |
