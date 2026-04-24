# Жизненный цикл тикета

> NBOS Platform — путь клиентского кейса от intake до закрытия

## Назначение

Этот документ фиксирует **канонический lifecycle** support ticket и правила переходов.

Главная идея:

- `Ticket` ведёт клиентский кейс;
- `Tasks / Work Space` ведут фактическое исполнение;
- `Change Request` выходит в отдельный `change control` маршрут;
- `Reopen` считается действием, а не самостоятельной основной колонкой.

---

## Основной lifecycle

```text
New -> Triaged -> Assigned -> In Progress -> Resolved -> Closed
```

### Смысл стадий

| Стадия        | Смысл                                                          | Кто обычно действует    |
| ------------- | -------------------------------------------------------------- | ----------------------- |
| `New`         | обращение зафиксировано, но ещё не классифицировано            | PM / Support            |
| `Triaged`     | категория, приоритет и маршрут обработки определены            | PM / Support            |
| `Assigned`    | ticket получил владельца/исполнителя                           | PM / Support            |
| `In Progress` | внутренняя работа по кейсу уже идёт                            | Assignee / linked tasks |
| `Resolved`    | решение применено, ждём подтверждение клиента                  | PM / Support            |
| `Closed`      | кейс завершён и больше не находится в активной support-очереди | PM / System             |

---

## Overlay states

Поверх основного lifecycle ticket может иметь служебные состояния:

- `Waiting for Client`
- `Waiting for Third Party`
- `Escalated`

Это **не отдельные основные колонки**, а overlay-state поверх тикета.

Зачем так лучше:

- не теряется основная стадия кейса;
- видно, что происходит пауза;
- можно корректно управлять SLA pause logic;
- меньше хаоса на основной support board.

---

## Reopen

`Reopen` — это действие:

- ticket был в `Resolved`;
- клиент сообщил, что проблема не решена;
- система или PM возвращает ticket обратно в рабочий статус, обычно `In Progress`;
- событие записывается в историю и аналитику.

Канонически `Reopened` не является отдельной основной stage-колонкой.

---

## Переходы

| Переход                   | Правило                                                                  |
| ------------------------- | ------------------------------------------------------------------------ |
| `New -> Triaged`          | назначены категория и приоритет                                          |
| `Triaged -> Assigned`     | назначен исполнитель или владелец кейса                                  |
| `Assigned -> In Progress` | работа реально начата или созданы linked tasks                           |
| `In Progress -> Resolved` | решение применено и записана резолюция                                   |
| `Resolved -> Closed`      | клиент подтвердил или ticket автозакрыт по правилу                       |
| `Resolved -> In Progress` | reopen после обратной связи клиента                                      |
| `Any active -> Closed`    | только для дубликата, ошибки создания или явного управленческого решения |

---

## Triage

На этапе triage Support должен определить:

- к какому `Project` относится кейс;
- относится ли он к конкретному `Product`;
- кто контакт клиента;
- какая категория у тикета;
- какой приоритет;
- бесплатный ли это кейс;
- какой маршрут дальше: support flow, change control или problem flow.

### Результат triage по категориям

| Категория         | Дальнейший путь                                     |
| ----------------- | --------------------------------------------------- |
| `Incident`        | обычный support flow + linked execution tasks       |
| `Service Request` | обычный support flow + linked execution tasks       |
| `Change Request`  | выход в `change control` и связь с `Extension Deal` |
| `Problem`         | RCA, linked incidents, action plan                  |

---

## Change Request как отдельный маршрут

Если тикет классифицирован как `Change Request`, он больше не должен висеть в обычной support-очереди как обычный баг.

Правильный flow:

```text
Ticket classified as Change Request
        ->
Extension Deal created and linked
        ->
Ticket moved to Change Control view
        ->
CRM pipeline
        ->
Extension created in Projects Hub
        ->
Extension Done
        ->
Support ticket closed automatically
```

Так Support сохраняет историю клиентского запроса, но не превращается в доску продаж.

---

## SLA

SLA считается от момента создания ticket и зависит от `priority`.

Минимальные SLA-метрики:

- `first response time`
- `time to assignment`
- `resolution time`
- `work time`

### SLA-сигналы

| Сигнал   | Смысл                        |
| -------- | ---------------------------- |
| `green`  | запас по SLA большой         |
| `yellow` | ticket приближается к порогу |
| `orange` | риск срыва высокий           |
| `red`    | SLA breached                 |

### Пауза SLA

SLA может быть поставлен на паузу только по прозрачным причинам:

- `Waiting for Client`
- `Waiting for Third Party`
- `Resolved and awaiting confirmation`

Пауза должна быть явной, а не скрытой.

---

## Resolved и Closed

Это два разных состояния и их нельзя смешивать.

### `Resolved`

- решение уже применено;
- у тикета есть `resolution summary`;
- клиент уведомлён;
- ожидается подтверждение или истечение автозакрытия.

### `Closed`

- клиент подтвердил решение;
- или система закрыла ticket по правилу автозакрытия;
- кейс ушёл из активной очереди.

---

## Автозакрытие

Каноническое правило:

- ticket находится в `Resolved`;
- клиенту отправлено напоминание;
- если за установленный период нет ответа, ticket уходит в `Closed`;
- в истории фиксируется причина `auto-closed`.

Точная длительность может настраиваться бизнесом, но сама модель обязательна.

---

## Problem lifecycle

`Problem` — это расширенный режим для системной причины, а не просто ещё один баг.

```text
Recurring incidents detected
        ->
Problem ticket created
        ->
Related incidents linked
        ->
Root Cause Analysis
        ->
Action Plan
        ->
Execution tasks
        ->
Verification period
        ->
Closed
```

Для `Problem`-тикета полезны дополнительные поля:

- `related incidents`
- `root cause`
- `action plan`
- `verification period`
- `recurrence count after fix`

---

## Минимальные stage requirements

| Стадия        | Что обязательно                          |
| ------------- | ---------------------------------------- |
| `Triaged`     | category, priority                       |
| `Assigned`    | assignee / owner                         |
| `In Progress` | исполнитель или linked execution context |
| `Resolved`    | resolution summary                       |
| `Closed`      | confirmation or auto-close reason        |
