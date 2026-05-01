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

| Event                      | Условия                                                         | Действие                                                              |
| -------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------- |
| `invoice.created`          | `tax_status = Tax`                                              | WhatsApp message в бухгалтерскую группу с request на official invoice |
| `invoice.awaiting_payment` | `notifications_enabled = On` и official invoice ready/requested | WhatsApp reminder в Project WhatsApp Group                            |
| `invoice.overdue`          | Payment не получен после due date                               | In-App/Telegram Finance + WhatsApp group reminder                     |
| `payment.received`         | Invoice paid                                                    | In-App Seller/Finance, optional WhatsApp confirmation                 |
| `expense.due_soon`         | Expense Card due soon                                           | In-App Finance                                                        |
| `expense.overdue`          | Expense unpaid after due date                                   | In-App/Telegram Finance + CEO escalation                              |

### Subscriptions

| Event                          | Условия               | Действие                              |
| ------------------------------ | --------------------- | ------------------------------------- |
| `subscription.invoice_created` | Subscription active   | Follow invoice rules                  |
| `subscription.payment_missing` | Invoice overdue       | Finance alert + client group reminder |
| `subscription.on_hold`         | Payment/process pause | Internal alert only                   |

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
