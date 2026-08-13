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

`Delivery Board` в этом документе означает отдельную глобальную operational page `/delivery-board`, а не встроенную доску внутри Project page.

Extension создаётся внутри уже существующего:

- `Project`
- `Product`

### 1.3. Maintenance flow

Для `Deal Type = MAINTENANCE`:

- обычный product delivery-flow заново не создаётся;
- создаётся `Subscription` на существующий продукт (`MAINTENANCE_ONLY` или `DEV_AND_MAINTENANCE`, `PENDING` / `ACTIVE`);
- billing truth живёт в Finance.

---

## 2. Основной active lifecycle

Состояние `Product` и `Extension` — три оси, а не одно поле `status`:

- `deliveryStage`: `STARTING` → `DEVELOPMENT` → `QA` → `TRANSFER`;
- `deliveryWorkStatus`: `ACTIVE` | `ON_HOLD` (пауза поверх стадии);
- `deliveryResolution`: `null` | `DONE` | `CANCELLED`.

«Открыт» = `deliveryResolution IS NULL`. `ON_HOLD` — не закрытие. Поле `status` (`CREATING` и др.) — legacy-зеркало; канон читает `deliveryStage` (`CREATING` ≡ `STARTING`).

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

Closed view должен поддерживать:

- default `Table / List` для поиска, фильтров и анализа;
- optional `Board` view с двумя колонками `Done | Cancelled` для привычного визуального просмотра.

Внешние closed cards могут быть compact, но opened closed card должна сохранять тот же полный delivery-card structure, что и active card: stage history, requirements, blockers, tasks/workspace links, credentials, files, finance/technical context and audit.

---

## 7. Project-level views

Lifecycle board работает на уровне `Product` и `Extension`. У `Project` нет lifecycle-статуса (в схеме только `trashedAt`); проектные views считаются из детей. Статус проекта не хранить, не кэшировать и не денормализовать.

Признак «продукт на maintenance»: `Subscription` с `type` ∈ { `MAINTENANCE_ONLY`, `DEV_AND_MAINTENANCE` } и `status` ∈ { `PENDING`, `ACTIVE` }. Отдельного поля на `Product` нет. Maintenance — view, не сущность.

### Development view

Проект виден в `Development`, если есть ≥1 `Product` **или** `Extension` с `deliveryResolution IS NULL` (любая стадия, включая `STARTING` и `ON_HOLD`).

### Maintenance view

Проект виден в `Maintenance`, если есть ≥1 `Product` с maintenance-подпиской (`PENDING` / `ACTIVE`). Проект может одновременно попадать в `Development` и `Maintenance`.

### Closed view

Проект виден в `Closed`, если нет ни одного `Product` / `Extension` с `deliveryResolution IS NULL` **и нет** активной maintenance-подписки.

«Проект активен» = `Development` ∪ `Maintenance`.

---

## 8. Maintenance после delivery

После обычного product delivery возможен отдельный maintenance operating mode.

Правильный принцип:

- delivery lifecycle заканчивается на `Done` или `Cancelled`;
- maintenance не продолжает эту же board-stage цепочку;
- признак maintenance — `Subscription` (`PENDING` / `ACTIVE`, типы `MAINTENANCE_ONLY` или `DEV_AND_MAINTENANCE`); ручного флага на `Product` нет;
- исключения (внутренний продукт, спецпроект, бесплатное ведение) = та же подписка с `amount = 0`;
- финансовая активация и billing управляются Finance / Subscription Board.

---

## 9. Что система должна обеспечивать

1. Автосоздание delivery-сущности после корректного CRM handoff.
2. Корректное отображение `Product` и `Extension` на одной глобальной Delivery Board.
3. Разные наборы полей для карточек `Product` и `Extension`.
4. Автоподстановку данных в extension из `Deal + Project + Product`.
5. Stage gate проверки на переходах.
6. Cumulative validation при прыжке сразу в позднюю стадию или в `Done`.
7. Pause workflow через `On Hold`.
8. Terminal separation через `Closed`.
9. Compact current-stage readiness indicator на внешней card и полный Stage Gate Timeline внутри opened card.
