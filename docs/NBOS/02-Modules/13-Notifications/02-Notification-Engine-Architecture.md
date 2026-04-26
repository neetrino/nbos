# Notification Engine Architecture

Notifications должен быть надёжным engine поверх business events, scheduler, queue и delivery adapters.

## Event flow

```text
Owning Module
  -> emits Business Event
  -> Notification Engine evaluates rules
  -> creates Notification Job(s)
  -> queue processes delivery
  -> channel adapter sends
  -> delivery status saved
  -> optional Messenger copy
  -> optional escalation scheduler
```

## Source of truth

База данных является source of truth для:

- rules;
- jobs;
- in-app notifications;
- delivery attempts;
- read state;
- escalation state;
- user preferences.

Queue и WebSocket не являются source of truth.

## Core data model

### NotificationEvent

Фиксирует бизнес-событие.

Ключевые поля:

- `id`;
- `event_type`;
- `source_module`;
- `source_entity_type`;
- `source_entity_id`;
- `payload`;
- `occurred_at`;
- `idempotency_key`.

### NotificationRule

Описывает, что делать с событием.

Ключевые поля:

- `id`;
- `event_type`;
- `conditions`;
- `recipient_resolver`;
- `channels`;
- `priority`;
- `template_id`;
- `schedule_policy`;
- `quiet_hours_policy`;
- `dedupe_policy`;
- `escalation_policy_id`;
- `enabled`.

### NotificationJob

Фактическая единица работы.

Ключевые поля:

- `id`;
- `event_id`;
- `rule_id`;
- `status`;
- `scheduled_for`;
- `attempt_count`;
- `next_retry_at`;
- `dedupe_key`;
- `created_at`;
- `processed_at`.

### Notification

In-App запись для конкретного сотрудника.

Ключевые поля:

- `id`;
- `recipient_user_id`;
- `category`;
- `title`;
- `body`;
- `priority`;
- `action_url`;
- `entity_type`;
- `entity_id`;
- `read_at`;
- `archived_at`.

### NotificationDelivery

Попытка доставки в канал.

Ключевые поля:

- `id`;
- `job_id`;
- `channel`;
- `recipient`;
- `status`;
- `provider`;
- `provider_message_id`;
- `error_code`;
- `error_message`;
- `sent_at`;
- `delivered_at`;
- `read_at`.

## Delivery channels

| Channel    | Adapter                                |
| ---------- | -------------------------------------- |
| `IN_APP`   | NBOS database + WebSocket update       |
| `TELEGRAM` | Telegram Bot Adapter                   |
| `WHATSAPP` | `WhatsAppWebAdapter -> WAHA`           |
| `EMAIL`    | Email Adapter, likely Postmark for MVP |

## Messenger copy

External delivery через WhatsApp не должна теряться в отдельном логе.

Если Notification отправила внешнее сообщение:

1. `NotificationDelivery` сохраняет delivery status.
2. `Messenger` создаёт outbound message copy.
3. Copy связывается с External conversation.
4. Пользователь видит это как часть истории общения.

`Messenger Copy` не считается отдельным каналом отправки.

## Idempotency and dedupe

Notifications must be idempotent.

Примеры:

- один Invoice reminder за конкретный invoice/day;
- одна SLA breach escalation за конкретный ticket/SLA level;
- одно уведомление о назначении задачи на конкретного assignee/change.

Для этого нужен `idempotency_key` и `dedupe_key`.

## Retry policy

Retry нужен для внешних каналов и Telegram.

Минимальная политика:

- retry with backoff;
- max attempts;
- final failed status;
- alert responsible admin/owner if channel broken;
- no duplicate Messenger copies on retry.

## Scheduling

Scheduler отвечает только за запуск job в нужное время.

Notifications отвечает за:

- что запустить;
- для кого;
- через какие каналы;
- как эскалировать;
- как логировать результат.

## WebSocket

WebSocket нужен для:

- обновления topbar unread count;
- live notification center;
- delivery status updates for admin pages.

Но история уведомлений всегда грузится из DB.

## Admin/debug views

Для поддержки системы нужны:

- rules list;
- delivery log;
- failed jobs;
- channel health;
- WAHA session status;
- retry/requeue action;
- mute/snooze audit.
