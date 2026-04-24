# Support Cleanup Register

> Назначение: зафиксировать, что в `Support` уже совпадает с новым каноном, что устарело только в документации, а что потом потребует runtime-рефакторинга.

---

## 1. Already aligned

Эти части уже близки к новому канону и не требуют архитектурного разворота.

| Область                                                                             | Статус    | Комментарий                                                                |
| ----------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------- |
| `SupportTicket` как отдельная сущность                                              | `OK`      | В БД и API ticket уже отдельный объект, не смешан с задачей                |
| Категории `INCIDENT / SERVICE_REQUEST / CHANGE_REQUEST / PROBLEM`                   | `OK`      | Хорошо совпадают с каноном                                                 |
| Базовый lifecycle `NEW -> TRIAGED -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> CLOSED` | `OK`      | Основа правильная, нужна только логическая доочистка вокруг reopen/waiting |
| Связь `Ticket -> Project`                                                           | `OK`      | Уже обязательна в runtime                                                  |
| Связь `Ticket -> Product`                                                           | `PARTIAL` | Поле есть в схеме БД, но почти не используется в текущем API/UI            |
| Базовые SLA deadlines                                                               | `PARTIAL` | Есть вычисление дедлайнов по priority, но процесс вокруг них ещё упрощён   |

---

## 2. Docs stale only

Эти места устарели только как текст или формулировка.

| Область                                                            | Статус  | Что устарело                                                                   |
| ------------------------------------------------------------------ | ------- | ------------------------------------------------------------------------------ |
| Дублирование документов внутри `06-Support`                        | `FIXED` | Старый `02-Ticket-Workflow.md` удалён как конфликтующий дубль                  |
| `Reopened` как будто отдельная постоянная колонка                  | `STALE` | Новый канон трактует reopen как событие/действие, а не основную колонку        |
| Смешение support flow и change control в одной очереди             | `STALE` | Новый канон отделяет `Change Request` в отдельный route/view                   |
| Слишком жёсткое hourly-описание daily routine                      | `STALE` | Новый канон опирается на operational control, а не на расписание по минутам    |
| UI-описания support board как только Kanban с одной линией колонок | `STALE` | Новый канон требует учитывать overlay states и отдельный change-control взгляд |

---

## 3. Code/runtime stale

Эти части уже расходятся с каноном и потом потребуют рефакторинга.

| Область                                            | Статус       | Что не совпадает                                                                                |
| -------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------- |
| `REOPENED` в `TicketStatusEnum`                    | `STALE CODE` | В runtime reopen живёт как отдельный enum status, а канон переводит его в событие/transition    |
| Нет explicit waiting overlay model                 | `STALE CODE` | Нет `waiting for client / third party / escalated` как отдельного overlay-state                 |
| API create/update ticket не работает с `productId` | `STALE CODE` | Поле есть в БД, но не участвует в текущем DTO/service flow                                      |
| Ticket detail and task bridge                      | `STALE CODE` | Нет реального linked execution flow с `Task / Work Space`                                       |
| Change control bridge                              | `STALE CODE` | Нет runtime-механизма `Ticket -> Extension Deal -> auto-close after Extension Done`             |
| SLA pause / breach / escalation logic              | `STALE CODE` | Есть только дедлайны, но нет зрелого pause/escalation orchestration                             |
| Support UI                                         | `STALE CODE` | Сейчас это базовая list/kanban page без product-context, change-control view и waiting overlays |

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

Когда дойдём до реализации, Support лучше приводить к канону в таком порядке:

1. очистить enum/status model и ввести overlay-state для waiting/escalation;
2. полноценно использовать `productId` и project/product context;
3. добавить linked task / work space bridge;
4. вынести `Change Request` в отдельный change-control flow;
5. добавить SLA pause / escalation / auto-close orchestration;
6. только потом усложнять messenger-automation и AI triage.
