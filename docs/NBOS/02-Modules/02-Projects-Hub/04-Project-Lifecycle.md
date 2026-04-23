# Projects Hub Operational Lifecycle

## Обзор

Этот документ описывает не весь путь клиента от лида до денег, а именно **операционный lifecycle внутри Projects Hub** после handoff из CRM.

Важная граница:

- `Lead` и `Deal` не являются частью Projects Hub lifecycle;
- `Projects Hub` начинается после того, как delivery-единица уже создана;
- дальше модуль ведёт исполнение, паузы, передачу и закрытие.

---

## 1. Точка входа в Projects Hub

Projects Hub получает delivery-сущности из CRM и Finance handoff.

### 1.1. Product flow

Для `Deal Type = PRODUCT`:

`Deal -> Deal Won -> Order + Project + Product -> Delivery Board / Starting`

### 1.2. Extension flow

Для `Deal Type = EXTENSION`:

`Deal -> Deal Won -> Order + Extension -> Delivery Board / Starting`

Extension создаётся внутри уже существующего:

- `Project`
- `Product`

### 1.3. Maintenance flow

Для `Deal Type = MAINTENANCE`:

- обычный product delivery-flow заново не создаётся;
- создаётся maintenance / subscription context для существующего продукта;
- billing truth живёт в Finance.

---

## 2. Основной active lifecycle

Для `Product` и `Extension` действует одна базовая рабочая цепочка:

`Starting -> Development -> QA -> Transfer`

Terminal outcomes:

- `Done`
- `Cancelled`

### Почему это канон

- `Creating` убирается как название стадии;
- `On Hold` не входит в основную линейку;
- `Closed` не является stage и существует как terminal view.

---

## 3. Стадии active lifecycle

### 3.1. Starting

Начальная рабочая стадия delivery после handoff.

На этом этапе:

- подтверждается стартовый delivery context;
- проверяются обязательные поля;
- уточняются deadline, owner и базовая структура работы;
- карточка становится готовой к активному исполнению.

### 3.2. Development

Основная стадия production-работы.

Здесь живут:

- sprint / kanban execution;
- рабочие задачи;
- промежуточные внутренние проверки;
- текущая реализация scope.

### 3.3. QA

Стадия обязательной проверки:

- quality checks;
- security checks, если применимо;
- release readiness;
- исправление найденных проблем до передачи.

### 3.4. Transfer

Стадия передачи результата:

- демонстрация;
- acceptance;
- финальная коммуникация;
- handoff клиенту.

---

## 4. On Hold

`On Hold` — отдельный status поверх текущей стадии, а не stage pipeline.

### 4.1. Что происходит при hold

- карточка остаётся в текущей колонке;
- визуально становится серой;
- сохраняется причина;
- сохраняется срок паузы.

### 4.2. Обязательные поля hold

- `reason`
- `onHoldUntil`

UI может позволять ввод:

- "на N дней"
- или "до даты"

Но канонически хранить лучше именно дату окончания hold.

### 4.3. Когда срок истёк

- карточка становится жёлтой;
- команда видит, что hold expired;
- далее нужен осознанный action:
  - resume;
  - extend hold;
  - cancel.

---

## 5. Drag-to-close логика

На active board показываются только рабочие колонки:

- `Starting`
- `Development`
- `QA`
- `Transfer`

Во время drag появляется нижняя terminal zone:

- `Done`
- `Cancelled`

### 5.1. Cancelled

`Cancelled` доступен из любой active-stage.

При cancel:

- не требуется cumulative stage completion;
- но требуется зафиксировать причину закрытия.

### 5.2. Done

`Done` тоже может быть доступен из любой active-stage, если работа фактически завершена.

Но при этом:

- система проверяет cumulative requirements по всем пропущенным этапам;
- если чего-то не хватает, открывает popup;
- popup показывает только missing items;
- после заполнения позволяет завершить карточку как `Done`.

---

## 6. Closed view

`Closed` — отдельное terminal представление, а не активная колонка board.

Внутри него находятся:

- `Done`
- `Cancelled`

Это нужно, чтобы:

- не засорять активную доску завершёнными карточками;
- отдельно видеть успешные и неуспешные результаты;
- сохранять полноценную историю delivery.

---

## 7. Project-level views

Lifecycle board работает на уровне `Product` и `Extension`, но проектные views считаются на уровне `Project`.

### Development view

Проект виден в `Development`, если у него есть хотя бы одна delivery-карточка в:

- `Starting`
- `Development`
- `QA`
- `Transfer`

Карточки на `On Hold` остаются частью этого рабочего контекста.

### Maintenance view

Проект виден в `Maintenance`, если у существующего продукта есть maintenance / subscription context.

### Closed view

Проект виден в `Closed`, если active delivery work больше нет и рабочие сущности завершены как:

- `Done`
- `Cancelled`

---

## 8. Maintenance после delivery

После обычного product delivery возможен отдельный maintenance operating mode.

Правильный принцип:

- delivery lifecycle заканчивается на `Done` или `Cancelled`;
- maintenance не продолжает эту же board-stage цепочку;
- maintenance живёт как отдельный контекст существующего продукта;
- финансовая активация и billing управляются Finance / Subscription Board.

---

## 9. Что система должна обеспечивать

1. Автосоздание delivery-сущности после корректного CRM handoff.
2. Корректное отображение `Product` и `Extension` на одной board.
3. Разные наборы полей для карточек `Product` и `Extension`.
4. Автоподстановку данных в extension из `Deal + Project + Product`.
5. Stage gate проверки на переходах.
6. Cumulative validation при прыжке сразу в позднюю стадию или в `Done`.
7. Pause workflow через `On Hold`.
8. Terminal separation через `Closed`.
