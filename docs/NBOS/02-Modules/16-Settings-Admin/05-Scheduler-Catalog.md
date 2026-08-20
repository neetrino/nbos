# Scheduler Catalog (Settings / Admin)

> Платформенные фоновые jobs без человека. Не Feature Flags и не Automation rules.

## Назначение

Экран **Settings → Scheduler** показывает полный каталог системных cron/time jobs: что существует, включено ли, когда последний/следующий запуск, риск.

```text
Calendar = даты для человека.
Scheduler = системные действия по времени.
Settings → Scheduler = видимость и (позже) политика этих jobs.
```

## Границы

| Слой                       | Ответственность                                                               |
| -------------------------- | ----------------------------------------------------------------------------- |
| Env                        | Процесс: `PROCESS_ROLE`, `SCHEDULER_ENABLED` (kill switch), Redis/DB/TZ/ключи |
| Code catalog               | Что существует: id, default cron, риск, модуль-владелец                       |
| Admin policy (этап 2+)     | Вкл/выкл конкретной джобы                                                     |
| BullMQ workers / IMAP IDLE | Не строки этого списка                                                        |

Не смешивать в одном списке:

- пользовательские расписания (`ReportSchedule`, recurring task templates) — данные; их тикает одна системная джоба;
- Feature Flags — видимость UI-фич;
- Automation rules catalog — бизнес-триггеры модулей.

## Правила

1. Каждый автопроцесс без человека = запись в **code catalog**.
2. Settings показывает весь **видимый** каталог, не только live Nest registry текущего процесса.
3. Новый cron: код + каталог + тест полноты. Иначе не мержится.
4. Ops-roster (`docs/architecture/scheduler-cron-roster.md`) — журнал решений до этапа 2; после миграции политики — ссылка на канон.
5. UI не создаёт новые джобы и не редактирует cron high-risk jobs.
6. High-risk (billing, trash purge, invoice WhatsApp reminders): на этапе 2 — confirm + audit.

## Статусы

| Status             | Смысл                                                            |
| ------------------ | ---------------------------------------------------------------- |
| `active`           | Master on, policy on, cron зарегистрирован, heartbeat свежий     |
| `paused`           | Джоба выключена в `SchedulerJobPolicy` (или не зарегистрирована) |
| `blocked`          | Policy on, но `SCHEDULER_ENABLED=false`                          |
| `running`          | Сейчас выполняется (run или живой lease)                         |
| `failed`           | Последний run `FAILED` / `TIMED_OUT`                             |
| `schedulerOffline` | Нет свежего heartbeat от `nbos-scheduler`                        |
| `manual`           | Только ручной HTTP / кнопка                                      |
| `disabledByCanon`  | Cron намеренно выключен каноном                                  |

## Политика (этап 2)

- Таблица `SchedulerJobPolicy`: `enabled`, `updatedById`, timestamps.
- Первый seed: из env `*_ENABLED` (если задан) иначе `rosterIntent=on`.
- После seed env `*_ENABLED` не источник правды для ticks.
- Nest регистрирует **все** `platform_cron` по роли; тик: `SCHEDULER_ENABLED` + policy.
- `PATCH /api/platform/scheduler/jobs/:jobName` + audit `scheduler.job_enabled` / `scheduler.job_disabled`.
- High-risk: confirm в UI перед PATCH.

## Этапы

| Этап       | Что                                                                       |
| ---------- | ------------------------------------------------------------------------- |
| 1          | Каталог + runtime snapshot + Settings list                                |
| 2 (сейчас) | Toggle из админки (`SchedulerJobPolicy`); env `*_ENABLED` только для seed |
| 3          | Run now, алерты падений, cron override только low/medium                  |

## Связанные документы

- Overview: `00-Settings-Admin-Overview.md`
- Calendar boundary: `../10-Calendar/04-Scheduler-and-Time-Jobs.md`
- Architecture: `../../../architecture/scheduler-architecture.md`
- Ops roster: `../../../architecture/scheduler-cron-roster.md`
