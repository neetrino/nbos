# Products and Extensions

## Обзор

Внутри `Project` ведётся реальная delivery-работа. Основные рабочие сущности здесь:

- `Product`
- `Extension`

Обе сущности проходят lifecycle на отдельной `Delivery Board` page, имеют связанный `Order`, получают данные из CRM handoff и участвуют в задачах, QA, transfer и closed outcomes.

---

## 1. Product

### 1.1. Что такое Product

`Product` — центральная delivery-сущность внутри `Project`.

Это не board и не просто поле в сделке. Это самостоятельный объект, вокруг которого затем строятся:

- delivery lifecycle;
- board-карточка;
- detailed card;
- tasks;
- QA;
- transfer;
- support context;
- credentials;
- linked order.

### 1.2. Как создаётся Product

Для `Deal Type = PRODUCT` поток такой:

`Deal -> Deal Won -> Order + Project + Product`

После создания в данных именно этот `Product` появляется на `Delivery Board` в `Starting`.

### 1.3. Откуда Product получает данные

`Product` получает данные из:

- `Deal`
- `Project`

Типичные поля handoff:

- name;
- deadline;
- product category;
- product type;
- scope / description;
- seller;
- PM;
- linked order;
- company / contact context через project.

Project-level delivery classification не передаётся в Product, потому что отдельной delivery-классификации проекта больше нет. Если нужна логика "WordPress / custom / ecommerce / platform", она должна выражаться через `productCategory`, `productType`, stage requirements и checklist template assignment.

---

## 2. Extension

### 2.1. Что такое Extension

`Extension` — отдельная delivery-сущность для доработки существующего продукта.

Это не "маленький product", а отдельный рабочий объект со своей коммерцией, своими задачами и своим lifecycle.

### 2.2. Канонические связи Extension

Канон:

- `Extension` всегда принадлежит `Project`;
- `Extension` всегда связан с одним основным `Product`;
- many-to-many между extension и несколькими продуктами в v1 не нужен.

Правильный путь в CRM:

1. seller выбирает `Project`;
2. затем выбирает конкретный `Product`;
3. создаёт `Extension Deal`;
4. после `Deal Won` создаётся `Extension`.

### 2.3. Откуда Extension получает данные

`Extension` получает данные из:

- `Deal`
- `Project`
- `Product`

Поэтому у него:

- часть полей вводится вручную;
- часть копируется из deal;
- часть подтягивается из project;
- часть наследуется из связанного product.

Из-за этого карточка `Extension` по полям проще, чем карточка `Product`.

### 2.4. Визуальный принцип

На `Delivery Board`:

- `Product` — default color;
- `Extension` — orange.

Это нужно, чтобы команда сразу визуально понимала тип delivery-работы.

---

## 3. Delivery Board

`Delivery Board` — отдельная рабочая страница в левом меню, где живут карточки `Product` и `Extension`.

Это delivery-аналог board-представления CRM, но уже на этапе исполнения.

Целевой route:

```text
/delivery-board
```

Подробный канон: `07-Delivery-Board.md`.

### 3.1. Что board показывает

Board показывает lifecycle уже созданных delivery-сущностей. Она не создаёт новые бизнес-объекты сама по себе.

То есть:

- сначала появляется `Product` или `Extension` как сущность в данных;
- потом этот же объект становится карточкой на `Delivery Board`.

Project page может показывать только compact product cards/readiness badges. Полная работа со stage gates, blockers и stage movement происходит на `Delivery Board`, в opened Delivery Card или на Product detail.

### 3.2. Активные колонки board

- `Starting`
- `Development`
- `QA`
- `Transfer`

### 3.3. Закрытие карточек

При drag появляется terminal area:

- `Done`
- `Cancelled`

Правила:

- в `Cancelled` можно переводить из любой стадии;
- в `Done` тоже можно переводить из любой стадии;
- для `Done` система делает cumulative validation;
- для `Cancelled` система запрашивает причину закрытия.

---

## 4. Lifecycle Product / Extension

И `Product`, и `Extension` работают по одной общей delivery-цепочке:

- `Starting`
- `Development`
- `QA`
- `Transfer`

Terminal outcomes:

- `Done`
- `Cancelled`

---

## 4.8. Opened Product / Extension Card

UI-композиция wide drawer, header, табы и breakpoints: [`../../05-UI-Specifications/07-Professional-Delivery-Card.md`](../../05-UI-Specifications/07-Professional-Delivery-Card.md).

Открытая карточка `Product` / `Extension` должна быть главным рабочим cockpit для delivery-сущности.

Визуальный принцип:

- широкий drawer или full card в стиле Deal card;
- не копия Deal один-в-один, а delivery-focused версия того же паттерна;
- sticky header;
- 2-3 рабочие колонки на desktop;
- tabs для вторичных, но важных данных.

### Header

В header всегда видны:

- name;
- entity badge: `Product` / `Extension`;
- current stage;
- work status: `Active` / `On Hold`;
- terminal resolution, если closed;
- current-stage readiness indicator;
- deadline / risk marker;
- main actions: move stage, pause/resume, done/cancel, open workspace.

### Daily core fields

В первом экране показывать только то, что нужно каждый день для ведения работы:

- current stage;
- stage readiness;
- current blockers;
- deadline;
- PM / owner;
- active assignees: developer, designer, tech specialist, QA where relevant;
- requirements / stage timeline visible on the first screen;
- active checklist;
- key work links: staging, production, repository, design, technical task where relevant;
- languages selector;
- files summary / quick attach;
- credentials readiness summary;
- payment integration status only when product scope needs payments.

### Secondary fields

Эти данные важны, но не должны перегружать первый экран:

- order link;
- seller;
- client / company details;
- comments;
- finance details;
- full credentials list;
- full activity history.

Они должны быть доступны через tabs, side sections или expandable blocks.

### Conditional fields

Поля показываются только если они применимы:

| Field                    | Когда показывать                                         |
| ------------------------ | -------------------------------------------------------- |
| Payment setup            | ecommerce, SaaS, paid portal, subscription/payment flow  |
| Platform design URL / ID | только для `Product.productCategory = WORDPRESS`         |
| Languages                | всегда; первый выбранный язык = primary product language |
| Domain / Hosting         | website/web app/app delivery where infra is needed       |
| App iOS / App Android    | mobile app delivery                                      |
| API keys / ENV           | custom/code/integration-heavy delivery                   |

### Tabs

Tabs нужны только для отдельных рабочих миров.

Recommended tabs:

| Tab          | Назначение                                                                             |
| ------------ | -------------------------------------------------------------------------------------- |
| `Work Space` | product tasks/workspace; MVP может иметь только кнопку перехода                        |
| `Calls`      | all client calls since this Product/Extension card was created; MVP placeholder/button |
| `Bonus`      | product bonuses with RBAC                                                              |
| `History`    | audit, activity, stage movement, important changes                                     |

Главный экран opened card не должен быть отдельным tab `Overview`; он открывается сразу как working cockpit.

Blocks on the first screen:

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

`Requirements / Stage Timeline` пока не имеет финального UX-решения. Он должен быть красивым, цветным и видимым на первом экране, но финальная форма может быть slim side rail, horizontal timeline, expanded panel или отдельный tab, если первый экран станет слишком тяжёлым.

`Bonus` visibility:

- employee видит только свой bonus по продукту;
- CEO / Founder / allowed finance roles видят все bonuses по продукту;
- bonus tab не должен раскрывать чужие выплаты без permission.

### 4.1. Starting

Начальная рабочая стадия после CRM handoff.

Здесь обычно подтверждаются:

- базовые поля delivery;
- deadline;
- owner / PM;
- обязательные стартовые данные;
- готовность войти в активную работу.

### 4.2. Development

Основная стадия исполнения:

- задачи;
- sprint / kanban flow;
- реализация;
- промежуточные внутренние проверки.

### 4.3. QA

Стадия проверки качества:

- тестирование;
- обязательные чеклисты;
- устранение найденных проблем;
- проверка readiness к передаче.

### 4.4. Transfer

Стадия передачи и acceptance:

- демонстрация;
- финальная обратная связь;
- подтверждение приёмки;
- handoff клиенту.

### 4.5. Done

Успешное завершение delivery.

Карточка уходит в `Closed` как успешно закрытая.

### 4.6. Cancelled

Неуспешное закрытие delivery.

Карточка также уходит в `Closed`, но как cancelled outcome.

### 4.7. Closed display

Closed items должны быть доступны в `Delivery Board -> Closed`.

Closed имеет два режима:

- `Table / List` как default для поиска и анализа;
- `Board` с колонками `Done | Cancelled` для привычного визуального просмотра.

Внешняя карточка в Closed Board может быть compact, но opened card должна оставаться полной и показывать всю историю Product/Extension: stage gates, blockers, tasks/workspace links, credentials, files, finance/technical context, final result and audit.

---

## 5. On Hold

`On Hold` не является отдельной колонкой lifecycle.

Это отдельный pause-status поверх текущего stage.

### 5.1. Правила

- карточка остаётся в своём текущем stage;
- при постановке на паузу обязательны причина и срок;
- лучше хранить `onHoldUntil`, даже если в UI ввод делается как "pause for N days";
- в данных нужно видеть, с какого этапа карточка была поставлена на паузу.

### 5.2. Визуальное поведение

- пока hold активен, карточка серая;
- на карточке видно причину и сколько дней осталось;
- когда срок hold закончился, карточка становится жёлтой;
- это сигнал, что по карточке нужно принять решение:
  - resume;
  - extend hold;
  - cancel.

---

## 6. Stage Gates и cumulative checks

Для перехода между рабочими стадиями действуют stage gates:

- обязательные поля;
- обязательные checklist items;
- обязательные связанные сущности;
- обязательные внешние действия, если они нужны по сценарию.

У каждого stage свой набор required items. Эти пункты могут заполнять разные роли: PM, Seller, Developer, Tech specialist, QA, Finance или Head of Delivery.

На внешней Delivery Board card показывается только compact segmented readiness ring текущего stage, например `7/10`. Полный список текущих и будущих requirements показывается внутри opened Delivery Card в `Stage Gate Timeline`.

Stage gate requirements и checklist items не являются одним и тем же.

Правило:

```text
Stage readiness = Stage Requirements.
Checklist = one possible Stage Requirement type.
```

Например `Development Checklist completed` может быть одним requirement внутри stage. Внутри checklist есть свои пункты, которые помогают developer пройти работу без забытых шагов. Эти checklist templates создаются и версионируются в `07-My-Company/08-Checklist-Template-Builder.md`.

Если карточку переносят сразу в более поздний этап или сразу в `Done`, система должна проверять cumulative requirements по всем пропущенным этапам.

Если чего-то не хватает:

- открывается popup;
- показываются только missing items;
- после заполнения переход завершается.

---

## 7. Maintenance boundary

`Maintenance` не является обычной стадией product/extension lifecycle.

Это отдельный operating mode существующего продукта.

Поэтому:

- обычный delivery board ведёт `Product` и `Extension` до `Done` или `Cancelled`;
- maintenance visibility и billing живут уже на стыке `Projects Hub` и `Finance`.

---

## 8. Итоговый канон

1. `Product` — главный delivery-объект.
2. `Extension` — отдельная доработка, но всегда в контексте `Project + Product`.
3. `Delivery Board` — отдельная operational page, которая показывает lifecycle сущностей, а не заменяет сами сущности.
4. `Product` получает данные из `Deal + Project`.
5. `Extension` получает данные из `Deal + Project + Product`.
6. `On Hold` — pause-status, а не отдельная stage.
7. `Done` и `Cancelled` живут в terminal `Closed` view.
