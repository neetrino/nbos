# Support Cleanup Register

> Назначение: зафиксировать, что в `Support` уже совпадает с новым каноном, что устарело только в документации, а что потом потребует runtime-рефакторинга.

---

## 1. Already aligned

Эти части уже близки к новому канону и не требуют архитектурного разворота.

| Область                                                                             | Статус    | Комментарий                                                                                            |
| ----------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------ |
| `SupportTicket` как отдельная сущность                                              | `OK`      | В БД и API ticket уже отдельный объект, не смешан с задачей                                            |
| Категории `INCIDENT / SERVICE_REQUEST / CHANGE_REQUEST / PROBLEM`                   | `OK`      | Хорошо совпадают с каноном                                                                             |
| Базовый lifecycle `NEW -> TRIAGED -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> CLOSED` | `OK`      | Основа правильная, нужна только логическая доочистка вокруг reopen/waiting                             |
| Связь `Ticket -> Project`                                                           | `OK`      | Уже обязательна в runtime                                                                              |
| Связь `Ticket -> Product`                                                           | `OK`      | **2026-05:** API + create/filter UI на `/support` (project → products, New Ticket)                     |
| Support -> execution task bridge                                                    | `PARTIAL` | Ticket can create linked Task; richer timeline/detail — backlog                                        |
| Change Request -> Extension Deal bridge                                             | `OK`      | **2026-05:** conversion + отдельный `/support/change-control`                                          |
| Coverage decision                                                                   | `PARTIAL` | Runtime field exists; Finance/Maintenance automation — backlog                                         |
| SLA deadlines + pause / breach / escalation                                         | `OK`      | **2026-05:** waiting overlay, `SupportSlaOrchestrationService`, scheduler escalation, pause accounting |

---

## 2. Docs stale only

Эти места устарели только как текст или формулировка.

| Область                                                            | Статус    | Что устарело                                                                                                                                                |
| ------------------------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Дублирование документов внутри `06-Support`                        | `FIXED`   | Старый `02-Ticket-Workflow.md` удалён как конфликтующий дубль                                                                                               |
| `Reopened` как будто отдельная постоянная колонка                  | `PARTIAL` | **2026-05-06:** runtime получил explicit `reopen` action (`RESOLVED/CLOSED -> IN_PROGRESS`) и UI action; отдельной канонической колонки `REOPENED` в UI нет |
| Смешение support flow и change control в одной очереди             | `PARTIAL` | **2026-05-06:** добавлен отдельный route `/support/change-control` для `CHANGE_REQUEST`; часть углублений (метрики/автоматизация) остаётся в backlog        |
| Слишком жёсткое hourly-описание daily routine                      | `STALE`   | Новый канон опирается на operational control, а не на расписание по минутам                                                                                 |
| UI-описания support board как только Kanban с одной линией колонок | `STALE`   | Новый канон требует учитывать overlay states и отдельный change-control взгляд                                                                              |

---

## 3. Code/runtime gaps

Здесь и **остаточный долг**, и строки со статусом `OK` для прозрачности (закрытые срезы 2026-05 не выносятся в отдельный файл).

| Область                                  | Статус    | Что не совпадает                                                                                                                                                      |
| ---------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `REOPENED` в `TicketStatusEnum`          | `PARTIAL` | **2026-05-06:** `PATCH status` больше не принимает `REOPENED`, reopen вынесен в action endpoint + audit event; enum cleanup на уровне Prisma остаётся отдельным шагом |
| Waiting overlay model                    | `OK`      | **2026-05:** `TicketWaitingStateEnum`, `PATCH …/waiting`, SLA pause projection                                                                                        |
| API + UI `productId`                     | `OK`      | **2026-05:** create/list filters + New Ticket dialog (project → product)                                                                                              |
| Ticket detail and task bridge            | `PARTIAL` | Ticket can create linked execution tasks; richer detail/timeline still missing                                                                                        |
| Change control + Extension Done          | `OK`      | **2026-05:** Extension complete → `closeLinkedTicketsAfterExtensionDelivered`                                                                                         |
| SLA pause / breach / escalation logic    | `OK`      | **2026-05:** orchestration + scheduler; см. канон SLA                                                                                                                 |
| Support UI                               | `PARTIAL` | List/kanban, change-control, waiting select, escalate, reopen, filters; polish/метрики — backlog                                                                      |
| Support -> Technical asset / environment | `OK`      | **2026-05:** `technical_asset_id` / `technical_environment_id`, Context dialog + profile bridge                                                                       |
| Coverage decision                        | `PARTIAL` | Runtime field exists; maintenance/finance bridge remains manual                                                                                                       |
| External Messenger message link          | `MISSING` | Нет связи ticket с external WhatsApp/CRM conversation/message                                                                                                         |
| Resolution close requirements            | `OK`      | **2026-05:** `resolution_summary`, `close_reason`; Closed только из Resolved; auto-close linked tickets после Extension Done + audit                                  |

---

## 4. Important runtime references

Ключевые места в коде, которые потом придётся сверять с каноном:

- `packages/database/prisma/schema.prisma`
- `apps/api/src/modules/support/support.service.ts`
- `apps/api/src/modules/support/support.controller.ts`
- `apps/web/src/features/support/constants/support.ts`
- `apps/web/src/app/(app)/support/page.tsx`
- `apps/web/src/lib/api/support.ts`

---

## 5. Recommended implementation sequence

**Срезы 2026-05 уже закрыли пункты 1, 3, 5–6, 8 по сути** (`productId`, change-control, waiting/SLA orchestration, technical links, resolution + extension auto-close). Дальше по приоритету:

1. Углубление **task / timeline** и execution bridge (без смешения с Task-сущностью).
2. **Coverage → Finance/Maintenance** автоматизация (сейчас поле есть, мосты ручные/частичные).
3. Очистка **enum/status** (например legacy `REOPENED` в Prisma) — отдельная миграция по согласованию.
4. **External messenger** link к тикету (блок 2C).
5. Messenger automation / AI triage — только после стабильного core.
