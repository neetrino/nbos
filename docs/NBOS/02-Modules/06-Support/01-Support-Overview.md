# Модуль Support — Обзор

> NBOS Platform — клиентские обращения, SLA-контроль и change control после продажи
>
> Messenger boundary canon: `../09-Messenger/08-Messenger-Decision-Register.md` (`M-SUPPORT-01`, `M-CLIENT-01`, `M-ROUTING-01`).

## Назначение

`Support` в NBOS отвечает не за саму разработку и не за клиентский чат, а за **внутреннее ведение клиентского кейса после продажи**:

- принять/зафиксировать обращение;
- классифицировать его;
- удержать SLA;
- определить coverage и дальнейший маршрут;
- назначить ответственного;
- передать фактическое исполнение в `Tasks / Work Space`, `CRM` или `Projects Hub`;
- сохранить результат и историю решения.

**Ключевой принцип:** `Ticket` — это не задача и не второй клиентский conversation.

`Ticket` хранит case-management данные: category, priority, SLA, coverage, assignee, linked work, resolution и ссылки на исходные клиентские сообщения. Фактическая работа команды выполняется через связанные Tasks/Work Spaces. Реальная клиентская переписка остаётся в **Client Messenger**.

### Почему

Если Ticket одновременно становится ещё и публичным клиентским чатом с переключателем `Public/Internal`, появляется риск случайно отправить внутренний комментарий клиенту и дублируется уже существующий Client Messenger conversation. Поэтому public/internal dual-composer не является целевой моделью.

---

## Граница модуля

Правильное разделение ответственности:

- `Support` — клиентский кейс, triage, SLA, coverage, change control, resolution;
- `Client Messenger` — реальная коммуникация с клиентом;
- `Internal Messenger` — внутренние обсуждения команды, включая Product/Work Space и Task discussion;
- `Tasks / Work Space` — внутренняя работа команды;
- `CRM` — платные change requests через `Extension Deal`;
- `Projects Hub` — delivery результата, если change request превратился в Extension;
- `Technical / Infrastructure` — технический контекст инцидента;
- `Finance / Subscriptions` — проверка, покрыт ли кейс активной maintenance-подпиской.

---

## 4 категории обращений

NBOS использует упрощённую ITIL-lite модель.

### 1. Incident

Что-то сломалось или перестало работать.

- примеры: сайт не открывается, ошибка 500, форма не отправляет данные;
- обычно бесплатно/covered;
- идёт в обычный support flow;
- при повторяемости может породить `Problem`.

### 2. Service Request

Стандартная эксплуатационная просьба по уже существующему функционалу.

- примеры: обновить контент, сменить номер телефона, настроить почту;
- обычно входит в maintenance / subscription;
- если объём выходит за рамки обслуживания, переклассифицируется.

### 3. Change Request

Новый функционал, заметная доработка или расширение существующего Product.

- не должен исполняться как обычный support ticket;
- выводится в `change control path`;
- создаёт `Extension Deal` в CRM;
- после Deal Won превращается в `Extension` в Projects Hub.

### 4. Problem

Повторяющаяся или системная причина инцидентов.

- привязывает несколько Incidents;
- используется для root cause analysis;
- может закончиться исправлением, архитектурным улучшением или Change Request.

---

## Правильный поток Support

```text
Client message in Client Messenger / PM observation
        ->
Support Ticket created or linked (when case tracking is needed)
        ->
Triage: category + priority + coverage + ownership
        ->
1) Incident / Service Request -> linked Tasks / Work Space -> Resolved -> Closed
2) Change Request -> linked Extension Deal -> CRM / Projects Hub -> close after delivery
3) Problem -> RCA + linked incidents + action plan
        ->
Client update/reply remains in original Client Messenger conversation
```

---

## Базовая модель Ticket

`Ticket` должен содержать:

- `Project` — обязательно;
- `Product` — если обращение относится к конкретному Product;
- `Contact`, если известен;
- category и priority;
- SLA-дедлайны;
- assignee / owner;
- coverage decision;
- linked Tasks;
- linked Extension Deal, если это Change Request;
- references на исходные/значимые Client Messenger messages;
- internal case notes/discussion, если нужны;
- Activity/System history;
- resolution summary.

**Не хранит как отдельный канон:** публичный клиентский composer или копию всей WhatsApp переписки как второй message store.

---

## Lifecycle и overlay states

Основной lifecycle тикета:

- `New`
- `Triaged`
- `Assigned`
- `In Progress`
- `Resolved`
- `Closed`

Поверх основного lifecycle допускаются overlay states:

- `Waiting for Client`
- `Waiting for Third Party`
- `Escalated`

Это не отдельные колонки основного pipeline, а состояния поверх тикета, чтобы:

- не ломать основной flow;
- видеть причину паузы;
- осознанно ставить SLA на паузу там, где это допустимо.

`Reopened` лучше считать действием/событием в истории, а не отдельным каноническим stage board.

---

## Change Control

`Change Request` не должен висеть в обычной support-очереди как будто это обычный баг.

Правильный путь:

1. Ticket классифицирован как `Change Request`;
2. создаётся и связывается `Extension Deal`;
3. Ticket уходит в отдельный `change control` view;
4. коммерческий цикл живёт в CRM;
5. после Deal Won создаётся Extension в Projects Hub;
6. работа выполняется в Product/Connected Work Space;
7. после завершения/подтверждения Ticket закрывается.

Связь с исходным клиентским сообщением сохраняется через Messenger references.

---

## Support и Tasks

`Support` не заменяет `Tasks`.

Правильная модель:

- Ticket фиксирует клиентский case и SLA;
- linked Task / Work Space фиксирует конкретное исполнение;
- Ticket может иметь одну или несколько Tasks;
- Tasks могут жить в Product Connected Work Space или другом разрешённом work context;
- завершение linked work может предложить перевод Ticket в `Resolved`, но Ticket closure остаётся отдельным case decision.

Task human Discussion использует Messaging Core согласно Tasks/Messenger canon.

---

## Support и Client Messenger

Client Messenger — единственное место обычной client-visible chat communication.

Правильная модель:

1. клиент пишет в Product WhatsApp group / Sales channel / другом Client Messenger conversation;
2. PM/Support при необходимости нажимает `Create Support Ticket` или связывает сообщение с существующим Ticket;
3. Ticket получает stable message references и case metadata;
4. внутренняя работа идёт через Ticket + Tasks/Work Space/Internal Messenger;
5. итоговый ответ клиенту отправляется через исходный Client Messenger conversation.

Ticket может показывать preview/reference значимых client messages с `Open original`, но reference не выдаёт дополнительные права к Client conversation.

---

## Support Intake и attention routing

`Support Intake` — роль/очередь, а не навсегда зашитый конкретный Employee.

Default Messenger attention behavior:

```text
Delivery Product client WORK conversation     -> Product PM
Maintenance Product client WORK conversation  -> Support Intake queue
```

После triage конкретный Ticket/Task получает своего assignee. Product PM при этом не перестаёт быть PM продукта.

Это позволяет сегодня иметь одного Head of Support, а позже расширить команду без миграции Product ownership модели.

---

## SLA-модель

На текущем этапе SLA — внутренний операционный стандарт, а не обязательно жёсткое договорное обязательство.

Базовые уровни:

- `P1` — critical;
- `P2` — high;
- `P3` — normal.

SLA управляет:

- сроком первой реакции;
- сроком решения;
- предупреждениями;
- эскалациями;
- метриками качества поддержки.

Если Ticket находится в допустимом waiting-state, SLA может быть поставлен на паузу по прозрачному правилу.

---

## Support Coverage Decision

На triage нужно определить не только category и priority, но и coverage:

- `Covered by Maintenance` — входит в активную support/maintenance subscription;
- `Free Goodwill` — компания делает бесплатно как исключение;
- `Billable Small Work` — оплачиваемая небольшая работа без полноценного Extension flow;
- `Extension Required` — нужна новая Extension Deal в CRM;
- `Not Covered / Rejected` — не входит в обслуживание и не берётся в работу.

Это решение не должно автоматически создавать второй client chat. Коммерческая/операционная коммуникация остаётся в Client Messenger, а бизнес-state живёт в Support/CRM/Finance.

---

## Итоговая роль модуля

`Support` в NBOS — это:

- internal customer case management;
- SLA control;
- intake/triage/routing;
- bridge в Tasks, CRM и Projects Hub;
- bridge в Technical / Infrastructure;
- история проблем и решений через Ticket + linked Client messages;
- аналитика качества продукта и обслуживания.

Это делает Support сильным операционным модулем без превращения его в дублирующий мессенджер.
