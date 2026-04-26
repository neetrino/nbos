# Calendar - overview

`Calendar` в главном левом меню NBOS - это лёгкий пользовательский экран для самых важных дат бизнеса.

Он не должен показывать все даты платформы. Главный Calendar показывает только то, что реально нужно видеть в общем календарном контексте:

1. `Meetings`
2. `Delivery Deadlines`
3. `Personal`

`All` может быть общим view, где включены все три слоя, но это не отдельный бизнес-слой.

## Главное решение

```text
Business Entity has date
  -> Calendar Event Projection shows it, if this date belongs to main Calendar scope
  -> Scheduler Job runs when time comes, if automation is needed
  -> Notification Engine sends/reminds/escalates, if message/escalation is needed
```

## Что входит в главный Calendar

| Layer                | Что показывает                          | Источник                |
| -------------------- | --------------------------------------- | ----------------------- |
| `Meetings`           | Встречи с клиентами                     | Meeting entity          |
| `Delivery Deadlines` | Дедлайны сдачи Product и Extension      | Projects Hub            |
| `Personal`           | Личные события/напоминания пользователя | Personal Calendar Event |

## Что не входит в главный Calendar

| Не входит                                 | Где должно жить                       |
| ----------------------------------------- | ------------------------------------- |
| Finance dates, billing, expenses, payroll | Finance module, finance calendar/grid |
| Task due dates                            | Tasks module views                    |
| Support SLA/due dates                     | Support module views                  |
| Internal team meetings                    | Не MVP для главного Calendar          |
| Team schedule/vacations                   | My Company / Team, если понадобится   |
| Scheduler jobs                            | Backend/system layer                  |
| Notification reminders                    | Notifications                         |

Главный Calendar не должен превращаться в склад всех дат. Если нужно увидеть Finance dates, пользователь идёт в Finance. Если нужно видеть task deadlines, пользователь идёт в Tasks.

## UI модель

Один экран `Calendar`:

```text
[All] [Meetings] [Delivery Deadlines] [Personal]

Month / Week / Day view
Filters: Project, Product, Seller, PM, Client, Event Type
```

Рекомендуемый default:

| Роль        | Default view                           |
| ----------- | -------------------------------------- |
| Seller      | `Meetings`                             |
| PM          | `Delivery Deadlines`                   |
| CEO / Owner | `All`                                  |
| Developer   | `Personal` или `All`, если есть доступ |

Пользователь может выбрать свой default layer.

## Source and projection

Каждая календарная запись должна показывать `source`.

Примеры:

| Calendar item      | Source                  | Где редактировать              |
| ------------------ | ----------------------- | ------------------------------ |
| Client meeting     | `Meeting`               | Calendar / linked Deal/Project |
| Product deadline   | `Product.deadline`      | Product card                   |
| Extension deadline | `Extension.deadline`    | Extension card                 |
| Personal reminder  | `PersonalCalendarEvent` | Calendar                       |

Calendar не должен дублировать Product/Extension deadline в отдельной таблице как новую истину. Он показывает projection.

## Visibility

Пользователь видит только то, к чему у него есть доступ.

Примеры:

- Seller видит свои client meetings.
- PM видит delivery deadlines своих Products/Extensions.
- CEO/Owner видит всё.
- Developer видит только доступные ему проекты/события.

## Связанные документы

- `02-Meetings.md`
- `03-Delivery-Deadline-Projections.md`
- `04-Scheduler-and-Time-Jobs.md`
- `05-Calendar-Integrations.md`
- `06-Calendar-Cleanup-Register.md`
