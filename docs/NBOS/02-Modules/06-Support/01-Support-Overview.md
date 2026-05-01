# Модуль Support — Обзор

> NBOS Platform — клиентские обращения, SLA-контроль и change control после продажи

## Назначение

`Support` в NBOS отвечает не за саму разработку, а за **клиентский кейс после продажи**:

- принять обращение;
- классифицировать его;
- удержать SLA;
- провести коммуникацию с клиентом;
- передать фактическое исполнение в `Tasks / Work Space`, `CRM` или `Projects Hub`.

**Ключевой принцип:** `Ticket` — это не задача.  
`Ticket` хранит клиентский контекст, SLA, историю общения и итог решения.  
Фактическая работа команды выполняется через связанные задачи и work spaces.

---

## Граница модуля

Правильное разделение ответственности:

- `Support` — клиентский кейс, triage, SLA, change control
- `Tasks / Work Space` — внутренняя работа команды
- `CRM` — платные change requests через `Extension Deal`
- `Projects Hub` — delivery результата, если change request превратился в extension
- `Messenger` — канал входящего обращения и клиентской коммуникации
- `Technical / Infrastructure` — технический контекст инцидента: environment, asset, deploy, monitoring
- `Finance / Subscriptions` — проверка, покрыт ли кейс активной maintenance-подпиской

---

## 4 категории обращений

NBOS использует упрощённую ITIL-lite модель.

### 1. Incident

Что-то сломалось или перестало работать.

- примеры: сайт не открывается, ошибка 500, форма не отправляет данные;
- обычно бесплатно;
- идёт в обычный support flow;
- при повторяемости может породить `Problem`.

### 2. Service Request

Стандартная эксплуатационная просьба по уже существующему функционалу.

- примеры: обновить контент, сменить номер телефона, настроить почту;
- обычно входит в maintenance / subscription;
- если объём выходит за рамки обслуживания, переклассифицируется.

### 3. Change Request

Новый функционал, заметная доработка или расширение существующего продукта.

- не должен исполняться как обычный support ticket;
- выводится в `change control path`;
- создаёт `Extension Deal` в CRM;
- после `Deal Won` и оплаты превращается в `Extension` в `Projects Hub`.

### 4. Problem

Повторяющаяся или системная причина инцидентов.

- привязывает несколько incidents;
- используется для root cause analysis;
- может закончиться исправлением, архитектурным улучшением или change request.

---

## Правильный поток Support

```text
Client message / PM observation
        ->
Support Ticket created
        ->
Triage: category + priority + billable + ownership
        ->
1) Incident / Service Request -> linked Tasks / Work Space -> Resolved -> Closed
2) Change Request -> linked Extension Deal -> CRM / Projects Hub -> auto-close
3) Problem -> RCA + linked incidents + action plan
```

---

## Базовая модель Ticket

`Ticket` должен содержать:

- `Project` — обязательно;
- `Product` — желательно или обязательно, если обращение относится к конкретному продукту;
- `Contact`;
- категорию и приоритет;
- SLA-дедлайны;
- assignee / owner;
- billable flag;
- linked tasks;
- linked extension deal, если это change request;
- public/internal discussion;
- resolution summary.

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

`Reopened` лучше считать действием и событием в истории, а не отдельным каноническим stage board.

---

## Change Control

`Change Request` не должен висеть в обычной support-очереди как будто это обычный баг.

Правильный путь:

1. тикет классифицирован как `Change Request`;
2. создаётся и связывается `Extension Deal`;
3. тикет уходит в отдельный `change control` view;
4. коммерческий цикл живёт в CRM;
5. после `Deal Won` создаётся `Extension` в `Projects Hub`;
6. после `Extension Done` support ticket закрывается автоматически.

Так `Support` не засоряется коммерческими кейсами, а связь с клиентским запросом сохраняется.

---

## Support и Tasks

`Support` не должен пытаться заменить `Tasks`.

Правильная модель:

- ticket фиксирует обращение клиента и SLA;
- linked task / work space фиксирует внутреннее исполнение;
- completion linked tasks может предлагать перевести ticket в `Resolved`;
- ticket может иметь одну или несколько задач;
- задачи могут жить в product work space или в support-oriented work context.

---

## Support и Messenger

`Messenger` — это канал intake и общения, но не замена тикету.

Правильная модель:

- клиент пишет в WhatsApp / другом канале;
- PM или система создаёт ticket;
- вся значимая коммуникация логируется в ticket;
- часть сообщений остаётся `Public`, часть — `Internal`;
- в будущем поверх этого могут появиться `Discussion` и `Activity Feed`.

---

## SLA-модель

На текущем этапе SLA — это внутренний операционный стандарт, а не обязательно жёсткое договорное обязательство.

Базовые уровни:

- `P1` — critical
- `P2` — high
- `P3` — normal

SLA управляет:

- сроком первой реакции;
- сроком решения;
- предупреждениями;
- эскалациями;
- метриками качества поддержки.

Если ticket находится в допустимом waiting-state, SLA может быть поставлен на паузу по прозрачному правилу.

---

## Итоговая роль модуля

`Support` в NBOS — это:

- customer case management;
- SLA control;
- bridge в `Tasks`, `CRM` и `Projects Hub`;
- bridge в `Technical / Infrastructure`, если кейс связан с production, deployment, DNS, SSL, hosting, database или monitoring;
- история клиентских проблем и решений;
- аналитика качества продукта и обслуживания.

Это делает модуль операционно сильнее, чем просто доска с тикетами.

---

## Support Coverage Decision

На triage нужно определить не только категорию и priority, но и coverage:

- `Covered by Maintenance` - входит в активную support/maintenance subscription;
- `Free Goodwill` - компания делает бесплатно как исключение или заботу о клиенте;
- `Billable Small Work` - оплачиваемая небольшая работа без полноценного Extension flow;
- `Extension Required` - нужна новая Extension Deal в CRM;
- `Not Covered / Rejected` - не входит в обслуживание и не берётся в работу.

Это решение важно, чтобы Support не превращался в бесплатную разработку и чтобы Finance/CRM вовремя подключались к платным кейсам.
