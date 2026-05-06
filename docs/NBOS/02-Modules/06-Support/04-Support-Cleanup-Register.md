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

| Область                                                            | Статус    | Что устарело                                                                                                                                                |
| ------------------------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Дублирование документов внутри `06-Support`                        | `FIXED`   | Старый `02-Ticket-Workflow.md` удалён как конфликтующий дубль                                                                                               |
| `Reopened` как будто отдельная постоянная колонка                  | `PARTIAL` | **2026-05-06:** runtime получил explicit `reopen` action (`RESOLVED/CLOSED -> IN_PROGRESS`) и UI action; отдельной канонической колонки `REOPENED` в UI нет |
| Смешение support flow и change control в одной очереди             | `PARTIAL` | **2026-05-06:** добавлен отдельный route `/support/change-control` для `CHANGE_REQUEST`; часть углублений (метрики/автоматизация) остаётся в backlog        |
| Слишком жёсткое hourly-описание daily routine                      | `STALE`   | Новый канон опирается на operational control, а не на расписание по минутам                                                                                 |
| UI-описания support board как только Kanban с одной линией колонок | `STALE`   | Новый канон требует учитывать overlay states и отдельный change-control взгляд                                                                              |

---

## 3. Code/runtime stale

Эти части уже расходятся с каноном и потом потребуют рефакторинга.

| Область                                            | Статус       | Что не совпадает                                                                                                                                                      |
| -------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `REOPENED` в `TicketStatusEnum`                    | `PARTIAL`    | **2026-05-06:** `PATCH status` больше не принимает `REOPENED`, reopen вынесен в action endpoint + audit event; enum cleanup на уровне Prisma остаётся отдельным шагом |
| Нет explicit waiting overlay model                 | `STALE CODE` | Нет `waiting for client / third party / escalated` как отдельного overlay-state                                                                                       |
| API create/update ticket не работает с `productId` | `PARTIAL`    | Product context is accepted by API, deeper UI creation/filtering still needed                                                                                         |
| Ticket detail and task bridge                      | `PARTIAL`    | Ticket can create linked execution tasks; richer detail/timeline still missing                                                                                        |
| Change control bridge                              | `PARTIAL`    | Ticket can create/link Extension Deal; auto-close after Extension Done is still missing                                                                               |
| SLA pause / breach / escalation logic              | `STALE CODE` | Есть только дедлайны, но нет зрелого pause/escalation orchestration                                                                                                   |
| Support UI                                         | `PARTIAL`    | Есть base list/kanban + отдельный `change-control` view; waiting overlays и deeper product-context ещё не закрыты                                                     |
| Support -> Technical Infrastructure link           | `MISSING`    | Нет связи ticket с Technical Asset / Environment / Deployment Record                                                                                                  |
| Coverage decision                                  | `PARTIAL`    | Runtime field exists; maintenance/finance bridge remains manual                                                                                                       |
| External Messenger message link                    | `MISSING`    | Нет связи ticket с external WhatsApp/CRM conversation/message                                                                                                         |
| Resolution close requirements                      | `PARTIAL`    | Нет обязательных resolution summary, client confirmation / auto-close reason                                                                                          |

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

1. Phase 4 done: `productId` context foundation;
2. Phase 4 done: linked task / work space bridge;
3. Phase 4 done: `Change Request` -> Extension Deal bridge;
4. Phase 4 done: coverage decision runtime field and read-only SLA state;
5. later: очистить enum/status model и ввести overlay-state для waiting/escalation;
6. later: добавить Support -> Technical Infrastructure links для incidents;
7. later: добавить bridge к Maintenance / Finance / CRM;
8. later: добавить SLA pause / escalation / auto-close orchestration;
9. only then: messenger automation and AI triage.
