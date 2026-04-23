# Projects Hub — Обзор центрального delivery-модуля

## 1. Назначение

**Projects Hub** в NBOS отвечает за delivery-часть бизнеса: исполнение, сопровождение и операционный контекст после коммерческого handoff из CRM.

Projects Hub **не** является продолжением CRM. Он начинается после того, как сделка уже коммерчески согласована и передана в исполнение.

Для stale-логики и плана зачистки см. `06-Projects-Hub-Cleanup-Register.md`.

Главная граница:

- `CRM` продаёт;
- `Finance` подтверждает деньги и биллинг;
- `Projects Hub` ведёт исполнение;
- `Support` и `Subscriptions` сопровождают существующие продукты.

---

## 2. Основной принцип модуля

Projects Hub нужно понимать не как "одну большую карточку проекта", а как связку из четырёх уровней:

1. `Project` — контейнер бизнеса или бренда;
2. `Product` — главная delivery-сущность;
3. `Extension` — отдельная доработка к конкретному продукту;
4. `Delivery Board` — рабочее board-представление, где `Product` и `Extension` проходят свой lifecycle.

Ключевой принцип:

- `Project` организует контекст;
- `Product` является центральным delivery-элементом;
- `Delivery Board` не создаёт сущности, а показывает lifecycle уже созданных `Product` и `Extension`.

---

## 3. Что такое Project, Product, Extension

### 3.1. Project

`Project` = один бизнес или бренд клиента.

Это не один человек и не одна сделка. Один контакт может иметь несколько разных проектов для разных бизнесов.

`Project` нужен как:

- контейнер навигации;
- точка входа в delivery-контекст;
- агрегатор orders, tasks, credentials, support, files и chat;
- общий business context для всех продуктов внутри бренда.

### 3.2. Product

`Product` = центральная delivery-сущность внутри `Project`.

Именно вокруг `Product` строится основная работа команды:

- lifecycle;
- deadlines;
- tasks;
- QA;
- transfer;
- credentials;
- support context;
- связанный order и delivery handoff из CRM.

Для `Deal Type = PRODUCT` после `Deal Won` создаётся:

- `Project`;
- `Order`;
- `Product`.

Именно этот `Product` затем появляется на `Delivery Board`.

### 3.3. Extension

`Extension` = отдельная доработка внутри существующего `Project`, привязанная к одному основному `Product`.

Канон:

- `Extension` всегда создаётся внутри `Project`;
- `Extension` всегда привязывается к одному основному `Product`;
- many-to-many связь с несколькими продуктами для v1 не нужна.

Поток:

- seller выбирает `Project`;
- внутри проекта выбирает конкретный `Product`;
- после `Deal Won` создаётся `Order` и `Extension`;
- затем `Extension` появляется на `Delivery Board`.

---

## 4. Delivery Board

`Delivery Board` — отдельная operational board внутри `Projects Hub`.

На ней живут карточки двух типов:

- `Product`
- `Extension`

Это delivery-аналог `Deals Board`, но уже не для продаж, а для исполнения.

### Визуальные правила карточек

- `Product` — default card color;
- `Extension` — orange card color.

### Источник данных карточек

`Product` получает данные из:

- `Deal`
- `Project`

`Extension` получает данные из:

- `Deal`
- `Project`
- `Product`

Часть полей у `Extension` должна подставляться автоматически из связанного продукта и сделки, поэтому карточка `Extension` по составу полей проще, чем карточка `Product`.

---

## 5. Экранная иерархия модуля

Projects Hub должен иметь три основных пользовательских слоя:

### 5.1. Projects List

`/projects`

Список проектов и фильтрованные views:

- `All`
- `Development`
- `Maintenance`
- `Closed`

Это views над проектами-контейнерами, а не место, где двигаются рабочие карточки по стадиям.

### 5.2. Project Shell

`/projects/:projectId`

Карточка проекта как оболочка:

- основная информация по бизнесу;
- список продуктов;
- список доработок;
- агрегаты по задачам и финансам;
- ссылки на рабочие зоны.

Project Shell не должен быть единственным местом, где происходит delivery-работа.

### 5.3. Delivery Board / Product Workspace

Рабочая зона исполнения:

- board с карточками `Product` и `Extension`;
- подробная карточка сущности при клике;
- product-centric view для повседневной работы команды.

---

## 6. Жизненный цикл delivery-сущностей

Основная активная цепочка и для `Product`, и для `Extension`:

- `Starting`
- `Development`
- `QA`
- `Transfer`

Терминальные исходы:

- `Done`
- `Cancelled`

### On Hold

`On Hold` не является отдельной стадией pipeline.

Это pause-status поверх текущего stage:

- карточка остаётся в своей колонке;
- при паузе обязательны причина и срок;
- пока пауза активна, карточка серая;
- когда срок закончился, карточка становится жёлтой;
- на карточке показывается, сколько дней осталось или что hold expired.

### Closed

`Closed` не является stage pipeline.

Это отдельное terminal view, внутри которого находятся:

- `Done`
- `Cancelled`

---

## 7. Drag-and-drop логика на Delivery Board

На активной delivery-доске постоянно видны только рабочие колонки:

- `Starting`
- `Development`
- `QA`
- `Transfer`

При drag снизу появляется зона закрытия:

- `Done`
- `Cancelled`

### Правила

- в `Cancelled` можно кидать из любой стадии;
- при `Cancelled` нужно зафиксировать причину для audit;
- в `Done` можно кидать из любой стадии;
- перед `Done` система делает cumulative validation по всем обязательным полям и действиям;
- если чего-то не хватает, открывается popup и просит заполнить только missing items.

Это позволяет не заставлять команду таскать карточку по всем этапам ради формальности, но сохраняет дисциплину по stage gates.

---

## 8. Вычисляемые project views

`Project` не должен иметь ручной lifecycle status.

Его отображение в hub views вычисляется из состояний `Product`, `Extension` и maintenance context.

### Development view

Проект попадает сюда, если хотя бы один `Product` или `Extension` находится в активной delivery-работе:

- `Starting`
- `Development`
- `QA`
- `Transfer`

Карточки с `On Hold` остаются в этом же рабочем контексте, но с отдельным visual state.

### Maintenance view

Проект попадает сюда, если у существующего продукта есть maintenance / subscription context.

Maintenance не является отдельной delivery-stage.

### Closed view

Проект попадает сюда, когда активной delivery-работы больше нет, а его delivery-сущности имеют terminal outcomes:

- `Done`
- `Cancelled`

---

## 9. Связь с CRM и Finance

### CRM -> Projects Hub

CRM передаёт в Projects Hub уже согласованную delivery-единицу:

- `PRODUCT deal` -> `Project + Product + Order`
- `EXTENSION deal` -> `Extension + Order` внутри существующего `Project/Product`
- `MAINTENANCE deal` -> maintenance/subscription context без запуска нового обычного delivery-flow

### Finance -> Projects Hub

Finance остаётся источником истины по:

- invoice status;
- payment confirmation;
- subscription billing;
- monthly billing state.

Projects Hub показывает operational context, но не подменяет финансовый source of truth.

---

## 10. Ключевые правила канона

1. `Project` — контейнер бизнеса, а не главная единица исполнения.
2. `Product` — центральный delivery-элемент.
3. `Extension` всегда связан и с `Project`, и с одним основным `Product`.
4. `Delivery Board` — это view над delivery-сущностями, а не отдельная сущность.
5. `On Hold` — status, а не stage.
6. `Done` и `Cancelled` уходят в `Closed`, а не смешиваются с active board.
7. `Maintenance` — отдельный operating mode, а не обычная стадия продуктовой разработки.
