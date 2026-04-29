# Support Cleanup Register

> Назначение: зафиксировать, что в `Support` уже совпадает с новым каноном, что устарело только в документации, а что потом потребует runtime-рефакторинга.

---

## 1. Already aligned

Эти части уже близки к новому канону и не требуют архитектурного разворота.

| Область                                                                             | Статус    | Комментарий                                                                 |
| ----------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------- |
| `SupportTicket` как отдельная сущность                                              | `OK`      | В БД и API ticket уже отдельный объект, не смешан с задачей                 |
| Категории `INCIDENT / SERVICE_REQUEST / CHANGE_REQUEST / PROBLEM`                   | `OK`      | Хорошо совпадают с каноном                                                  |
| Базовый lifecycle `NEW -> TRIAGED -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> CLOSED` | `OK`      | Основа правильная, нужна только логическая доочистка вокруг reopen/waiting  |
| Связь `Ticket -> Project`                                                           | `OK`      | Уже обязательна в runtime                                                   |
| Связь `Ticket -> Product`                                                           | `PARTIAL` | Поле есть и участвует в API/UI bridge, но product-context ещё неполный      |
| Support -> execution task bridge                                                    | `PARTIAL` | Ticket can create linked Task without becoming a task itself                |
| Change Request -> Extension Deal bridge                                             | `PARTIAL` | Change Request ticket can create/link an Extension Deal                     |
| Coverage decision                                                                   | `PARTIAL` | Runtime field exists; Finance/Maintenance automation is not implemented     |
| Базовые SLA deadlines                                                               | `PARTIAL` | Deadlines and read-only SLA state exist; pause/escalation orchestration нет |

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
| API create/update ticket не работает с `productId` | `PARTIAL`    | Product context is accepted by API, deeper UI creation/filtering still needed                   |
| Ticket detail and task bridge                      | `PARTIAL`    | Ticket can create linked execution tasks; richer detail/timeline still missing                  |
| Change control bridge                              | `PARTIAL`    | Ticket can create/link Extension Deal; auto-close after Extension Done is still missing         |
| SLA pause / breach / escalation logic              | `STALE CODE` | Есть только дедлайны, но нет зрелого pause/escalation orchestration                             |
| Support UI                                         | `STALE CODE` | Сейчас это базовая list/kanban page без product-context, change-control view и waiting overlays |
| Support -> Technical Infrastructure link           | `MISSING`    | Нет связи ticket с Technical Asset / Environment / Deployment Record                            |
| Coverage decision                                  | `PARTIAL`    | Runtime field exists; maintenance/finance bridge remains manual                                 |
| External Messenger message link                    | `MISSING`    | Нет связи ticket с external WhatsApp/CRM conversation/message                                   |
| Resolution close requirements                      | `PARTIAL`    | Нет обязательных resolution summary, client confirmation / auto-close reason                    |

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
5. добавить Support -> Technical Infrastructure links для incidents;
6. добавить coverage decision и bridge к Maintenance / Finance / CRM;
7. добавить SLA pause / escalation / auto-close orchestration;
8. только потом усложнять messenger-automation и AI triage.
