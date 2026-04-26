# Delivery Deadline Projections

`Delivery Deadlines` - второй основной слой главного Calendar.

Он показывает только важные delivery-даты:

- `Product.deadline`;
- `Extension.deadline`.

Task due dates, Support SLA dates и Finance dates не входят в главный Calendar.

## Projection, not duplicate

Deadline редактируется в owning entity:

| Deadline           | Источник истины      | Где редактировать |
| ------------------ | -------------------- | ----------------- |
| Product deadline   | `Product.deadline`   | Product card      |
| Extension deadline | `Extension.deadline` | Extension card    |

Calendar показывает projection. Он не создаёт отдельный deadline record как вторую истину.

## Что показывать на карточке deadline

Минимум:

- Product/Extension name;
- Project name;
- deadline date;
- current delivery stage;
- PM / owner;
- status badge: On Track / Approaching / Overdue;
- linked Product/Extension card;
- On Hold badge, если работа на паузе.

## Status logic

| Status        | Meaning                                                         |
| ------------- | --------------------------------------------------------------- |
| `On Track`    | До deadline достаточно времени                                  |
| `Approaching` | Deadline скоро                                                  |
| `Overdue`     | Deadline прошёл, item не закрыт                                 |
| `On Hold`     | Работа на паузе, deadline logic может быть остановлена/помечена |

Точные пороги можно настроить позже. Для MVP:

- Approaching = 7 дней или меньше;
- Overdue = дата прошла и Product/Extension не закрыт.

## On Hold

Если Product/Extension на `On Hold`, Calendar должен:

- показывать серый/paused marker;
- не терять deadline из вида;
- отдельно показывать `hold_until`, если он есть;
- после окончания `hold_until` подсветить item жёлтым через Notifications/Projects logic.

`On Hold` не является Calendar status. Это status owning entity.

## Navigation

Клик по deadline:

- Product deadline -> Product card;
- Extension deadline -> Extension card.

Если пользователь не имеет доступа к source entity, item не показывается.

## Notifications and Scheduler

Calendar только показывает deadline.

```text
Product/Extension has deadline
  -> Calendar shows projection
  -> Scheduler checks approaching/missed deadline
  -> Notifications alerts PM/CEO if needed
```

Calendar не отправляет alert сам.
