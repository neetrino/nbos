# Products and Extensions

## Обзор

Внутри `Project` ведётся реальная delivery-работа. Основные рабочие сущности здесь:

- `Product`
- `Extension`

Обе сущности проходят lifecycle на `Delivery Board`, имеют связанный `Order`, получают данные из CRM handoff и участвуют в задачах, QA, transfer и closed outcomes.

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
- product type;
- scope / description;
- seller;
- PM;
- linked order;
- company / contact context через project.

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

`Delivery Board` — отдельная рабочая доска внутри `Projects Hub`, где живут карточки `Product` и `Extension`.

Это delivery-аналог board-представления CRM, но уже на этапе исполнения.

### 3.1. Что board показывает

Board показывает lifecycle уже созданных delivery-сущностей. Она не создаёт новые бизнес-объекты сама по себе.

То есть:

- сначала появляется `Product` или `Extension` как сущность в данных;
- потом этот же объект становится карточкой на `Delivery Board`.

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
3. `Delivery Board` показывает lifecycle сущностей, а не заменяет сами сущности.
4. `Product` получает данные из `Deal + Project`.
5. `Extension` получает данные из `Deal + Project + Product`.
6. `On Hold` — pause-status, а не отдельная stage.
7. `Done` и `Cancelled` живут в terminal `Closed` view.
