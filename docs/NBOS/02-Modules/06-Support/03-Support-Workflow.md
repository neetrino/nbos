# Рабочий процесс Support

> NBOS Platform — intake, исполнение, change control и эскалации
>
> Client communication boundary: `../09-Messenger/02-External-Messenger-and-CRM-Inbox.md` and `../09-Messenger/08-Messenger-Decision-Register.md` (`M-SUPPORT-01`).

## Назначение

Этот документ описывает **операционный workflow** модуля `Support`.

Важно:

- Support не является доской разработки;
- Support принимает и ведёт внутренний клиентский case;
- фактическая работа исполняется через linked Tasks / Work Spaces;
- Change Requests уходят в CRM и Projects Hub;
- реальная client-visible переписка остаётся в Client Messenger.

---

## Канонический workflow

```text
Client message / PM observation
        ->
Ticket created/linked when case tracking is needed
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
- из Client Messenger message;
- из Project/Product context;
- в будущем — автоматически из approved AI intake или monitoring.

Минимум для создания:

- title;
- Project;
- description;
- Contact, если известен.

Если Ticket создаётся из Client Messenger, сохраняются stable references на выбранные source message(s), conversation/channel context и доступные attachments. Message body не становится отдельной копией-источником истины внутри Support.

На intake Ticket ещё не обязан иметь assignee и финальную категорию.

---

## 2. Triage

На triage PM / Support должен определить:

1. Это `Incident`, `Service Request`, `Change Request` или `Problem`?
2. Какой priority у кейса?
3. Это support-covered кейс или платная работа?
4. Кто должен дальше владеть исполнением?
5. Нужен ли link на Technical Asset / Environment / Deployment?

Результат triage:

- заполнены category и priority;
- Ticket связан с Project и, если применимо, Product;
- заполнено coverage decision: maintenance / free / billable / extension required / rejected;
- technical incident связан с Technical / Infrastructure context;
- определён дальнейший маршрут;
- attention/assignee обновлены без переноса Client conversation в другой message store.

---

## 3. Routing

### 3.1. Incident / Service Request

Остаётся в обычном support flow:

- назначается assignee;
- создаются linked Tasks;
- Ticket идёт по SLA до `Resolved`.

### 3.2. Change Request

Выходит из обычной очереди и идёт в `change control`.

```text
Support Ticket
  -> Create / link Extension Deal
  -> CRM pipeline
  -> Deal Won
  -> Extension in Projects Hub
  -> execution in Product Connected Work Space
  -> Extension Done
  -> Support Ticket Closed
```

Такой Ticket виден в отдельном `Change Control` представлении, а не смешивается с обычными Incidents/Service Requests.

Клиентская коммуникация по исходному запросу остаётся в Client Messenger; новый Product/Deal communication path применяется по CRM/Messenger правилам, а не через публичный Support composer.

### 3.3. Problem

Идёт в problem-management flow:

- связываются incidents;
- делается RCA;
- создаётся action plan;
- исполнение идёт через linked Tasks;
- после verification period кейс закрывается.

---

## 4. Execution

Исполнение по Ticket идёт через `Tasks / Work Space`.

Правильная модель:

- `Ticket` хранит customer case и SLA;
- `Task` хранит конкретную работу;
- несколько Tasks могут относиться к одному Ticket;
- Tasks могут жить в Product Work Space или другом разрешённом support work context;
- Task human Discussion использует Messaging Core.

Ticket не должен быть местом, где команда пытается заменить нормальный Task engine.

### 4.1. Files / Evidence

Файлы Ticket хранятся через Drive:

- screenshots;
- logs;
- screen recordings;
- customer proof;
- incident reports;
- resolution documents.

Если evidence уже пришёл как attachment Client Message, Ticket хранит ссылку/reference на соответствующий Drive File Asset, а не создаёт дубликат файла.

Если Ticket связан с Product, важные evidence files должны быть доступны в Product Library / Support History по правилам Drive. Temporary screenshots могут попадать в cleanup; incident/post-mortem материалы хранятся дольше согласно policy.

---

## 5. Communication

Клиентская коммуникация и внутренняя работа разделены жёстко.

### Client-visible communication

Всегда идёт через **Client Messenger** — например Product WORK/FINANCE WhatsApp conversation или Sales channel.

### Internal Support work

Живёт в:

- Ticket fields/status/activity;
- linked Tasks and their Discussions;
- Product/Work Space Internal conversation;
- optional internal Ticket discussion/notes, если действительно нужен отдельный case-level internal context.

Ticket internal discussion никогда не отправляет сообщение клиенту напрямую.

### Source-message model

1. клиент пишет в Client Messenger;
2. PM/Support создаёт Ticket или связывает message с существующим Ticket;
3. Ticket показывает значимые message references/previews;
4. команда выполняет работу во внутренних инструментах;
5. итоговый ответ отправляется из Client Messenger.

**No `Public | Internal` composer toggle inside Ticket.**

### Why

Client Messenger уже является канонической внешней перепиской. Второй публичный composer внутри Ticket увеличивает риск accidental disclosure и дробит историю между двумя surfaces.

---

## 6. Attention routing

Messenger attention и Support assignee — связанные, но разные понятия.

Default Client WORK attention:

```text
Delivery     -> Product PM
Maintenance  -> Support Intake queue
```

После triage конкретный Ticket получает assignee. Conversation остаётся тем же.

`Support Intake` — team/role queue, а не hard-coded конкретный Employee. Это позволяет расширять Support team без миграции Product model.

Manual routing/reassignment допускается.

---

## 7. Waiting и SLA pause

Если команда ждёт внешнее действие, Ticket не должен хаотично висеть как будто никто не работает.

Overlay states:

- `Waiting for Client`;
- `Waiting for Third Party`;
- `Escalated`.

При допустимом waiting-state SLA может ставиться на паузу. Причина ожидания должна быть явно видна.

При `Waiting for Client` фактический вопрос/ответ клиенту всё равно идёт через Client Messenger; Ticket фиксирует state и reference на релевантную коммуникацию при необходимости.

---

## 8. Resolved -> Closed

Когда linked work выполнена:

1. Ticket получает `resolution summary`;
2. linked Tasks/technical action имеют понятный результат;
3. клиент уведомляется через Client Messenger;
4. Ticket переходит в `Resolved`;
5. после подтверждения/правила закрытия уходит в `Closed`.

Если клиент пишет, что проблема осталась:

- исходный Client conversation остаётся тем же;
- Ticket возвращается в `In Progress`;
- фиксируется `reopen event`.

---

## 9. Эскалации

### SLA escalation

Автоматическая эскалация при риске/нарушении SLA:

- приближение к breach;
- breach first response;
- breach resolution.

### Managerial escalation

Ручная эскалация PM / Support, если:

- нужен другой специалист;
- есть бизнес-риск;
- клиент угрожает уходом;
- проблема за пределами обычной компетенции.

Эскалация может менять attention/assignee/observers, но не создаёт новый Client conversation автоматически.

---

## 10. Change Control как мост между модулями

```text
Support
  -> Extension Deal in CRM
  -> Order / Delivery handoff
  -> Extension in Projects Hub
  -> Tasks / Product Work Space execution
  -> Support Ticket closes
```

Support — точка case-management, CRM — коммерческий цикл, Projects/Tasks — delivery, Client Messenger — внешняя коммуникация.

---

## 11. Операционный обзор

Support Lead / PM должен регулярно видеть:

- новые Tickets без triage;
- breached / risk SLA;
- unresolved P1/P2;
- Change Requests waiting in CRM;
- Projects with abnormal Ticket volume;
- repeated Incidents that deserve `Problem`;
- Client WORK conversations in Maintenance with unresolved attention.

---

## 12. Будущие расширения

Канон оставляет место для:

- AI-assisted intake and triage;
- self-service client portal;
- monitoring-generated Incidents;
- CSAT after close;
- knowledge base;
- richer Messenger-driven support flows.

Future AI must preserve the same boundary: AI may help classify/draft/route, but Client Messenger remains the external conversation source of truth and Support remains internal case management.
