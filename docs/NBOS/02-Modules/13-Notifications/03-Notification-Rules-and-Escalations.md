# Notification Rules and Escalations

Notification rule отвечает на вопрос: что делать, когда произошло событие.

## Rule structure

| Поле                | Значение                                |
| ------------------- | --------------------------------------- |
| `event_type`        | Какое событие слушаем                   |
| `conditions`        | Когда правило применимо                 |
| `recipients`        | Кто получает                            |
| `channels`          | Куда отправляем                         |
| `priority`          | Важность                                |
| `template`          | Текст/рендер сообщения                  |
| `schedule_policy`   | Сразу, позже, recurring, business hours |
| `dedupe_policy`     | Как не создать дубль                    |
| `escalation_policy` | Что делать без реакции                  |

## Где хранить правила

Для MVP правила должны быть описаны в коде/config, а не полностью в UI.

Причина:

- бизнес-логика сложная;
- правила связаны с Finance/CRM/Projects;
- ошибки в admin UI могут отправить неверные сообщения клиентам;
- сначала нужен стабильный domain model.

В UI можно дать безопасные настройки:

- включить/выключить notifications для объекта;
- изменить recipients в допустимых рамках;
- изменить schedule для конкретного клиента/подписки;
- snooze/on hold;
- retry failed delivery.

## Категории правил

### Finance

| Event                                                                       | Условия                                                                                                                                                             | Действие                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `invoice.created`                                                           | `tax_status = Tax`                                                                                                                                                  | WhatsApp message в бухгалтерскую группу с request на official invoice                                                                                                                                                                                                                                                                                                                                                                                |
| `invoice.awaiting_payment` / `finance.invoice.payment_reminder_d10` / `_d2` | Subscription or Client Service invoice unpaid; `notifications_enabled`; Tax official request ready when Tax; Yerevan calendar day = `dueDate − 10` or `dueDate − 2` | WhatsApp client payment reminder to **Product WhatsApp Group** (`subscription.productId` or `clientServiceRecord.productId`); language = `Subscription.reminderLanguage` or `ClientServiceRecord.reminderLanguage` (HY/RU/EN). Copy: amount + purpose; Tax-Free includes personal pay-to block. Idempotency: one job per `(invoiceId, offsetDays, collectionCycle)`. `On Hold` does not start a new cycle; `Cancelled` then `Awaiting Payment` does. |
| `finance.invoice.official_request_due`                                      | Tax invoice due; official request not sent                                                                                                                          | Internal / accountant WhatsApp request automation (separate from client payment reminders)                                                                                                                                                                                                                                                                                                                                                           |
| `invoice.overdue` / `finance.invoice.overdue_reminder_w1` / `_w2`           | `moneyStatus = OVERDUE`; Subscription or Client Service; `notifications_enabled`; Tax official request ready when Tax; Product WhatsApp group present               | **No auto client send.** Finance presses **Send overdue reminders** after bank reconcile (`GET/POST /finance/invoices/overdue-reminders/*`). One letter per invoice per run: wave 1 if none sent, wave 2 if wave 1 was sent on a previous Yerevan day. After wave 2 stop. Idempotency: `NotificationJob` key `invoice_overdue_reminder:w{n}:{invoiceId}`. Ops In-App/Telegram unchanged. |
| `payment.received`                                                          | Invoice paid                                                                                                                                                        | In-App Seller/Finance, optional WhatsApp confirmation                                                                                                                                                                                                                                                                                                                                                                                                |
| `expense.due_soon`                                                          | Expense Card due soon                                                                                                                                               | In-App Finance                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `expense.overdue`                                                           | Expense unpaid after due date                                                                                                                                       | In-App/Telegram Finance + CEO escalation                                                                                                                                                                                                                                                                                                                                                                                                             |

Scheduler: `POST /api/scheduler/invoice-card-reminders` (Yerevan `asOf`) — official request + D-10/D-2 only. Overdue client waves are **manual**, not cron.

Outbound WhatsApp text (accountant official request, client payment reminders, overdue waves, client invites) goes through one paced queue (`whatsapp.outbound-messages`, concurrency 1, 2s gap).

### Subscriptions

| Event                           | Условия                         | Действие                                                 |
| ------------------------------- | ------------------------------- | -------------------------------------------------------- |
| `subscription.invoice_created`  | Subscription active             | Follow invoice rules (Product WhatsApp Group)            |
| `subscription.payment_reminder` | D-10 / D-2 vs `Invoice.dueDate` | Client WhatsApp to Product group; see Finance rows above |
| `subscription.payment_missing`  | Invoice overdue                 | Ops Finance alert; client WhatsApp only via manual overdue waves (w1/w2) |
| `subscription.on_hold`          | Payment/process pause           | Internal alert only                                      |

### CRM

| Event                     | Условия                                                      | Действие                    |
| ------------------------- | ------------------------------------------------------------ | --------------------------- |
| `lead.created`            | Seller assigned                                              | In-App/Telegram Seller      |
| `lead.unprocessed_24h`    | No action                                                    | Seller + Head of Sales      |
| `deal.won`                | Deal Type canonical: Product/Extension/Maintenance/Outsource | Seller/PM/CEO handoff alert |
| `deal.stage_gate_blocked` | Required fields/actions missing                              | In-App with missing list    |

`Upsell` не является Deal Type. Если нужен смысл upsell, это sales scenario, а не enum.

### Projects / Delivery

| Event                     | Условия                        | Действие                 |
| ------------------------- | ------------------------------ | ------------------------ |
| `product.deadline_soon`   | Deadline approaching           | PM alert                 |
| `product.deadline_missed` | Deadline passed and not closed | PM + CEO escalation      |
| `product.on_hold_expired` | Hold until date passed         | Highlight + PM/CEO alert |
| `stage_gate_blocked`      | Required conditions missing    | In-App with checklist    |

### Tasks

| Event                   | Условия                         | Действие                           |
| ----------------------- | ------------------------------- | ---------------------------------- |
| `task.assigned`         | Assignee changed                | In-App/Telegram assignee           |
| `task.due_soon`         | Due soon                        | Assignee reminder                  |
| `task.overdue`          | Not completed                   | Assignee + PM escalation           |
| `task.review_requested` | Close condition requires review | Reviewer alert                     |
| `task.mentioned`        | @mention                        | In-App/Telegram depending priority |

Task chat messages are Messenger events. Notifications only alerts unread/mentions/replies.

### Ops / runtime

| Event                      | Условия                                      | Действие                                                     |
| -------------------------- | -------------------------------------------- | ------------------------------------------------------------ |
| `ops.scheduler_run_failed` | Scheduler run `FAILED` or `TIMED_OUT`        | In-app Owner and CEO (distinct roles); hourly dedupe per job |
| `ops.bullmq_job_failed`    | BullMQ job exhausted retries (final attempt) | In-app Owner and CEO; hourly dedupe per queue+job            |

Link: Settings → Scheduler for cron runs; Mail / Reports / Drive / Settings for known queues.

### Support

| Event                   | Условия            | Действие          |
| ----------------------- | ------------------ | ----------------- |
| `ticket.created`        | New support ticket | Owner/PM alert    |
| `ticket.sla_warning`    | SLA approaching    | Assignee + PM     |
| `ticket.sla_breach`     | SLA missed         | Critical PM + CEO |
| `ticket.client_replied` | External reply     | Assignee alert    |

## Escalation model

Escalation is not spam. It is a controlled expansion of responsibility.

```text
L1 -> direct responsible
L2 -> manager/head
L3 -> CEO/Owner
```

Examples:

| Scenario        | L1            | L2            | L3                          |
| --------------- | ------------- | ------------- | --------------------------- |
| Invoice overdue | Finance       | Finance + CEO | CEO + optional process task |
| Lead ignored    | Seller        | Head of Sales | CEO                         |
| Task overdue    | Assignee      | PM            | PM + CEO                    |
| SLA breach      | Assignee + PM | CEO           | Critical process review     |

## Action required

If notification requires actual work, prefer explicit action:

- open entity;
- approve/reject;
- snooze;
- create task;
- mark as handled;
- retry delivery;
- assign owner.

Если действие должно контролироваться по сроку, создаётся Task. Notification itself не должен быть единственным местом контроля работы.

## Quiet hours

Internal notifications:

- `low/normal` respect user quiet hours;
- `high` may bypass for configured roles;
- `critical` can bypass DND.

External WhatsApp group messages:

- respect client/project notification schedule;
- не отправлять ночью без отдельного разрешения;
- Finance reminders should follow configured billing communication windows.
