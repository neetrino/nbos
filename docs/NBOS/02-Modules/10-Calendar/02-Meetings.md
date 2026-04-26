# Meetings

`Meetings` - основной пользовательский слой главного Calendar.

В MVP Meetings означает только клиентские встречи. Внутренние встречи команды пока не включаются, чтобы не засорять главный Calendar.

## Какие встречи входят

| Type                            | Примеры                                         |
| ------------------------------- | ----------------------------------------------- |
| `Sales Call`                    | первичная встреча, discovery, qualification     |
| `Offer Presentation`            | презентация предложения / цены / scope          |
| `Demo`                          | демонстрация продукта клиенту                   |
| `Kickoff / Handoff with Client` | старт проекта с клиентом                        |
| `Support / Maintenance Call`    | звонок с клиентом по поддержке или обслуживанию |

## Что не входит

- daily standup;
- internal sprint planning;
- internal retrospective;
- 1-on-1;
- internal CEO/PM meetings.

Если позже понадобится internal meetings, можно добавить отдельный layer или module-specific view.

## Meeting entity

Встреча является собственной сущностью, потому что она создаётся, переносится, отменяется и имеет участников.

Минимальные поля:

| Field                          | Required | Description                                 |
| ------------------------------ | -------- | ------------------------------------------- |
| `title`                        | Yes      | Название встречи                            |
| `starts_at`                    | Yes      | Дата и время начала                         |
| `ends_at` / `duration_minutes` | Yes      | Длительность                                |
| `meeting_type`                 | Yes      | Sales, Demo, Kickoff, Support, Maintenance  |
| `internal_participants`        | Yes      | Сотрудники Neetrino                         |
| `external_participants`        | Optional | Contacts/clients                            |
| `project_id`                   | Optional | Связанный Project                           |
| `product_id`                   | Optional | Связанный Product                           |
| `deal_id`                      | Optional | Связанный Deal                              |
| `contact_id`                   | Optional | Главный Contact                             |
| `location_type`                | Yes      | Online / Offline                            |
| `location_or_link`             | Optional | Адрес или ссылка                            |
| `agenda`                       | Optional | Повестка                                    |
| `outcome_notes`                | Optional | Итоги после встречи                         |
| `status`                       | Yes      | Scheduled / Completed / Cancelled / No Show |

## Где можно создать встречу

- Calendar -> Create Meeting;
- Deal card -> Schedule Meeting;
- Project/Product card -> Schedule Client Meeting;
- Contact/Client profile -> Schedule Meeting.

## Navigation

Клик по meeting в Calendar открывает meeting card.

Meeting card должна показывать быстрые ссылки:

- linked Deal;
- linked Project/Product;
- Client/Contact;
- related files in Drive;
- related external Messenger conversation, если есть.

## Reminders

Meeting reminder не отправляется самим Calendar.

Процесс:

```text
Meeting starts_at
  -> Scheduler creates reminder event before meeting
  -> Notifications alerts participants
```

Reminder options:

- 15 minutes before;
- 30 minutes before;
- 1 hour before;
- 1 day before.

## Conflict warning

Для MVP достаточно предупреждения, не жёсткой блокировки.

Проверяется:

- internal participant already has another meeting at same time;
- meeting time outside user's configured working hours, если working hours уже есть;
- linked client/project already has another active meeting at same time.

Пользователь может override conflict с reason.
