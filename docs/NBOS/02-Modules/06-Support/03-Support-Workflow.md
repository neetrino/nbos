# Рабочий процесс Support

> NBOS Platform — intake, исполнение, change control и эскалации

## Назначение

Этот документ описывает **операционный workflow** модуля `Support`.

Важно:

- Support не является доской разработки;
- Support принимает и ведёт клиентский кейс;
- фактическая работа исполняется через linked tasks / work spaces;
- change requests уходят в CRM и Projects Hub.

---

## Канонический workflow

```text
Client contact / PM observation
        ->
Ticket created
        ->
Triage
        ->
Routing
        ->
Execution
        ->
Resolved
        ->
Closed
```

Где `Routing` после triage может пойти в три разных направления:

- обычный support flow;
- `change control`;
- `problem management`.

---

## 1. Intake

Ticket может появиться:

- вручную PM / Support;
- из клиентского сообщения в `Messenger`;
- из project/product context;
- в будущем — автоматически из AI intake или monitoring.

Минимум для создания:

- title;
- project;
- description;
- contact, если известен.

На этом этапе ticket ещё не обязан иметь assignee и финальную категорию.

---

## 2. Triage

На этапе triage PM / Support должен ответить на четыре вопроса:

1. Это `Incident`, `Service Request`, `Change Request` или `Problem`?
2. Какой приоритет у кейса?
3. Это support-covered кейс или платная работа?
4. Кто должен дальше владеть исполнением?

Результат triage:

- заполнены category и priority;
- ticket связан с `Project` и, если применимо, с `Product`;
- определён дальнейший маршрут.

---

## 3. Routing

### 3.1. Incident / Service Request

Остаётся в обычном support flow:

- назначается assignee;
- создаются linked tasks;
- ticket идёт по SLA до `Resolved`.

### 3.2. Change Request

Выходит из обычной очереди и идёт в `change control`.

Правильный flow:

```text
Support Ticket
    ->
Create / link Extension Deal
    ->
CRM pipeline
    ->
Deal Won
    ->
Extension in Projects Hub
    ->
Extension Done
    ->
Support Ticket Closed
```

Такой ticket должен быть виден в отдельном `Change Control` представлении, а не смешиваться с багами и сервисными запросами.

### 3.3. Problem

Идёт в problem-management flow:

- связываются incidents;
- делается RCA;
- создаётся action plan;
- исполнение идёт через linked tasks;
- после verification period кейс закрывается.

---

## 4. Execution

Исполнение по тикету должно идти через `Tasks / Work Space`.

### Правильная модель

- `Ticket` хранит customer case и SLA;
- `Task` хранит конкретную работу;
- несколько задач могут относиться к одному ticket;
- задачи могут жить в product work space или в отдельном support work context.

Ticket не должен быть местом, где команда пытается заменить нормальный task engine.

### 4.1. Files / Evidence

Файлы тикета хранятся через Drive:

- screenshots;
- logs;
- screen recordings;
- customer proof;
- incident reports;
- resolution documents.

Support Ticket хранит links на Drive File Assets. Если ticket связан с Product, важные evidence files должны быть видны в Product Library в секции `Support History`. Temporary screenshots могут позже попасть в cleanup по правилам Drive, но incident/post-mortem материалы должны храниться дольше.

---

## 5. Communication

Клиентская коммуникация остаётся частью support flow.

Нужно разделять:

- `Public updates` — что можно сообщить клиенту;
- `Internal notes` — обсуждение команды;
- `System activity` — смена статусов, SLA warnings, auto-close, reassignment.

В будущем это естественно вырастает в:

- `Discussion`
- `Activity Feed`

---

## 6. Waiting и SLA pause

Если команда ждёт внешнее действие, ticket не должен хаотично висеть как будто никто не работает.

Правильный механизм:

- установить overlay-state:
  - `Waiting for Client`
  - `Waiting for Third Party`
  - `Escalated`
- при допустимом waiting-state SLA ставится на паузу;
- причина ожидания должна быть явно видна на карточке и в деталях тикета.

---

## 7. Resolved -> Closed

Когда linked work выполнена:

1. ticket получает `resolution summary`;
2. клиент уведомляется;
3. ticket переходит в `Resolved`;
4. после подтверждения или автозакрытия уходит в `Closed`.

Если клиент пишет, что проблема осталась:

- ticket возвращается в `In Progress`;
- это фиксируется как `reopen event`.

---

## 8. Эскалации

Support должен поддерживать два типа эскалации.

### SLA escalation

Автоматическая эскалация при риске или нарушении SLA:

- приближение к breach;
- breach по first response;
- breach по resolution.

### Managerial escalation

Ручная эскалация PM / Support, если:

- нужен другой специалист;
- есть бизнес-риск;
- клиент угрожает уходом;
- проблема за пределами обычной компетенции.

---

## 9. Change Control как мост между модулями

`Support` должен быть точкой входа запроса, а не местом продажи доработки.

Канонический мост:

```text
Support
    ->
Extension Deal in CRM
    ->
Order / Delivery handoff
    ->
Extension in Projects Hub
    ->
Tasks / Work Space execution
    ->
Support ticket closes
```

---

## 10. Операционный обзор

Support Lead / PM должен регулярно смотреть:

- новые tickets без triage;
- breached / risk SLA;
- unresolved P1/P2;
- change requests waiting in CRM;
- projects with abnormal ticket volume;
- repeated incidents that deserve `Problem`.

Это важнее, чем жёсткое описание “что делать в 09:00 и 17:30”.

---

## 11. Будущие расширения

Канон оставляет место для:

- AI-assisted intake and triage;
- self-service client portal;
- monitoring-generated incidents;
- CSAT after close;
- knowledge base;
- richer messenger-driven support flows.
