# Recurring, Automation, Blueprints and Completion Rules

> В модуле `Tasks` нужно явно разделять повторяющиеся задачи, системную автоматику, стартовые пакеты задач и правила закрытия. Это четыре разных механизма.

## 1. Четыре отдельные группы механик

В каноне `Tasks` нельзя использовать слово `Templates` как единый зонтик для всего подряд. Нужно различать:

1. `Recurring Tasks`
2. `Automation Rules`
3. `Task Blueprints`
4. `Completion Rules`

## 2. Recurring Tasks

`Recurring Tasks` — это повторяющиеся задачи по расписанию.

Они нужны для регулярной операционной работы:

- каждые 2 недели
- по понедельникам
- в определённое время
- ограниченное или бесконечное число повторов

Примеры:

- ежемесячно проверить домены
- каждую вторую неделю подготовить отчёт
- каждый понедельник проверить рекламные кабинеты
- раз в месяц сверить подписки и сервисы

### 2.1. Что хранит recurring template

- title
- description
- assignee
- priority
- frequency
- interval
- day-of-week / day-of-month / time
- start date
- optional end date
- due date offset
- optional default checklist
- optional default links/context

### 2.2. Что создаётся на выходе

Recurring template не является самой задачей. Он только порождает обычные `Task` instances по расписанию.

## 3. Automation Rules

`Automation Rules` — это системные правила, которые создают задачу при наступлении бизнес-события.

Это не recurring scheduling и не launch blueprint.

Примеры:

- product вошёл в `Starting` -> создать задачу PM
- до дедлайна осталось 10% -> создать задачу CEO
- завтра платёж по сервису -> создать задачу Finance
- invoice до сих пор unpaid -> создать напоминание

### 3.1. Канон для v1

Для первой версии automation rules должны описываться в коде, а не через сложный admin-builder.

Каждое правило должно иметь:

- trigger
- condition
- title
- description
- assignee logic
- due date logic
- priority
- optional completion policy

### 3.2. Почему не нужен BPM-builder сразу

Полноценный low-code builder слишком рано усложнит систему. Для NBOS на этом этапе правильнее:

- держать rules в коде
- описывать их прозрачно в документации
- постепенно расширять библиотеку правил

## 4. Task Blueprints

`Task Blueprint` — это стартовый пакет задач, который создаётся при запуске новой сущности.

Главный сценарий:

- создаётся новый `Product`
- создаётся новый `Extension`
- система предлагает или автоматически загружает стартовый набор задач

Это не recurring, потому что создаётся не по времени.  
Это не automation reminder, потому что это стартовый operational pack.

### 4.1. Что может хранить blueprint

- набор типовых задач
- suggested assignee role
- порядок/зависимости
- suggested checklist
- suggested sprint grouping
- recommended priority

### 4.2. Product type sensitivity

Blueprint может зависеть от:

- `workspaceType`
- `productType`
- `category`
- `deal type / delivery mode`, если это важно

## 5. Completion Rules

`Completion Rules` — это правила, которые проверяются при переводе задачи в `Completed`.

Если правило не выполнено, закрытие блокируется.

### 5.1. Примеры completion rules

- `requires_review`
- `requires_checklist_complete`
- `requires_attachment`
- `requires_creator_approval`
- `requires_specific_field`
- `requires_linked_entity_condition`

### 5.2. Что важно

Completion rules должны быть:

- optional
- явными
- читаемыми пользователю
- объясняющими причину блокировки

Система не должна просто молча запрещать закрытие. Она должна показывать, чего не хватает.

### 5.3. Сценарии, где это особенно полезно

- delivery acceptance tasks
- finance control tasks
- compliance tasks
- tasks with mandatory file/result
- tasks with mandatory review

## 6. Task Checklist vs Stage Gate Checklist

Эти понятия должны быть строго разведены.

### 6.1. Task Checklist

Живёт внутри конкретной задачи и помогает выполнить задачу.

### 6.2. Stage Gate Checklist

Живёт в delivery boundary продукта/расширения и контролирует переход сущности между стадиями.

Stage gate checklist — это уже не модуль `Tasks`, а правило `Projects Hub`.

## 7. Примеры канонического разделения

### 7.1. Recurring

`Каждый 2-й понедельник в 15:00 создать задачу "Проверить домены"`

### 7.2. Automation

`Если до срока проекта осталось 10%, создать задачу CEO`

### 7.3. Blueprint

`При создании Product типа WEB_APP загрузить стартовый набор delivery-задач`

### 7.4. Completion Rule

`Задачу нельзя завершить, пока не приложен итоговый файл`

## 8. Что закладывается на будущее

Архитектура должна позволить позже нарастить:

- richer automation library
- advanced recurring patterns
- workspace-specific blueprints
- richer completion rules
- rule presets by workspace type

Но даже при росте системы эти четыре механизма не должны снова сливаться в один размытый термин `templates`.
