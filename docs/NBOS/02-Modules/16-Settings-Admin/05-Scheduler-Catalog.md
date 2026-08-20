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

## Статусы (этап 1)

| Status             | Смысл                                                     |
| ------------------ | --------------------------------------------------------- |
| `active`           | Master on, env on, cron зарегистрирован, heartbeat свежий |
| `paused`           | Джоба выключена флагом env                                |
| `blocked`          | Джоба on, но `SCHEDULER_ENABLED=false`                    |
| `running`          | Сейчас выполняется (run или живой lease)                  |
| `failed`           | Последний run `FAILED` / `TIMED_OUT`                      |
| `schedulerOffline` | Нет свежего heartbeat от `nbos-scheduler`                 |
| `manual`           | Только ручной HTTP / кнопка                               |
| `disabledByCanon`  | Cron намеренно выключен каноном (например reports)        |

## Этапы

| Этап       | Что                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------ |
| 1 (сейчас) | Каталог + runtime snapshot + read-only Settings                                            |
| 2          | Toggle из админки (`SchedulerJobPolicy`); env `*_ENABLED` перестаёт быть источником правды |
| 3          | Run now, алерты падений, cron override только low/medium                                   |

## Связанные документы

- Overview: `00-Settings-Admin-Overview.md`
- Calendar boundary: `../10-Calendar/04-Scheduler-and-Time-Jobs.md`
- Architecture: `../../../architecture/scheduler-architecture.md`
- Ops roster: `../../../architecture/scheduler-cron-roster.md`
