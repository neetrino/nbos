# Scheduler and Time Jobs

`Scheduler` - это backend/system layer. Он не является вкладкой Calendar UI.

Calendar показывает человеку даты. Scheduler запускает системные действия, когда наступает время.

## Boundary

| Layer         | Responsibility                                 |
| ------------- | ---------------------------------------------- |
| Calendar      | Показывает даты человеку                       |
| Scheduler     | Запускает jobs по времени                      |
| Notifications | Доставляет уведомления, reminders, escalations |
| Owning Module | Меняет статус и хранит бизнес-истину           |

## Canonical flow

```text
Business Entity has date
  -> Calendar Event Projection shows it, if this date belongs to main Calendar scope
  -> Scheduler Job runs when time comes, if automation is needed
  -> Notification Engine sends/reminds/escalates, if message/escalation is needed
```

## Scheduler examples

| Job                                | Owning module          | Visible in main Calendar?  |
| ---------------------------------- | ---------------------- | -------------------------- |
| Meeting reminder before start      | Calendar/Meetings      | Yes, meeting is visible    |
| Product deadline approaching check | Projects Hub           | Yes, deadline is visible   |
| Extension deadline missed check    | Projects Hub           | Yes, deadline is visible   |
| Invoice creation                   | Finance                | No, visible inside Finance |
| Invoice overdue check              | Finance                | No, visible inside Finance |
| Expense due check                  | Finance                | No, visible inside Finance |
| Support SLA check                  | Support                | No, visible inside Support |
| Notification retry                 | Notifications          | No                         |
| WAHA session health check          | Integrations/Messenger | No                         |

## What Scheduler must not do

- It must not be a user Calendar view.
- It must not send messages directly.
- It must not own business statuses without owning module logic.
- It must not create duplicate calendar events for every date.

Scheduler should emit events or call owning services.

## Catalog and admin visibility

Job definitions live in a **code catalog** (`scheduler-job-catalog`). Settings → Scheduler shows the full visible catalog with last/next run and derived status. Calendar remains a human date surface — not the scheduler UI.

Canonical admin rules: `../16-Settings-Admin/05-Scheduler-Catalog.md`.

Runtime already has:

- job definitions (code catalog);
- idempotency + lease;
- run history (`SchedulerRun`);
- last run / next run (Settings list);
- manual HTTP repair triggers (`/api/scheduler/*`).

Still ahead:

- admin enable/disable policy (Settings, stage 2);
- manual run by admin from UI (stage 3);
- failure notification (ops monitoring).
