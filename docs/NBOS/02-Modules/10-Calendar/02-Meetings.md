# Meetings

`Meetings` - основной пользовательский слой главного Calendar.

В MVP Meetings означает только клиентские встречи. Внутренние встречи команды пока не включаются, чтобы не засорять главный Calendar.

## Какие встречи входят

| Type          | Примеры                                                 |
| ------------- | ------------------------------------------------------- |
| `Sales`       | продажи, discovery, презентация предложения, demo       |
| `HR`          | клиентские встречи по HR / people-направлениям          |
| `Development` | kickoff, handoff, инженерные / delivery sync с клиентом |
| `Other`       | всё остальное                                           |

Legacy detailed kinds (`Sales Call`, `Demo`, `Kickoff`, …) may still exist on older rows; the create form uses direction-style types above.

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

| Field                        | Required | Description                                                                 |
| ---------------------------- | -------- | --------------------------------------------------------------------------- |
| `title`                      | Yes      | Название встречи                                                            |
| `starts_at`                  | Yes      | Дата и время начала                                                         |
| `ends_at` / `duration_hours` | Yes      | Длительность; в create UI — часы (1 = 1 час), `ends_at` считается от начала |
| `meeting_type`               | Yes      | Direction: Sales, HR, Development, Other                                    |
| `internal_participants`      | Yes      | Сотрудники Neetrino                                                         |
| `external_participants`      | Optional | Contacts/clients                                                            |
| `project_id`                 | Optional | Связанный Project                                                           |
| `product_id`                 | Optional | Связанный Product                                                           |
| `deal_id`                    | Optional | Связанный Deal                                                              |
| `contact_id`                 | Optional | Главный Contact                                                             |
| `location_type`              | Yes      | Online / Offline                                                            |
| `location_or_link`           | Optional | Адрес или ссылка                                                            |
| `agenda`                     | Optional | Повестка                                                                    |
| `outcome_notes`              | Optional | Итоги после встречи                                                         |
| `status`                     | Yes      | Scheduled / Completed / Cancelled / No Show                                 |

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
