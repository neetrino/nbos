# Notification Integrations

Notifications - кросс-модульный engine. Он получает события от owning modules и доставляет alerts/messages через каналы.

## Messenger

Граница:

| Notifications                    | Messenger                            |
| -------------------------------- | ------------------------------------ |
| решает кому/когда/куда отправить | хранит conversation history          |
| создаёт delivery job             | показывает outbound/inbound messages |
| хранит delivery status           | хранит thread context                |
| эскалирует                       | даёт reply workflow                  |

Если Notification отправила WhatsApp-сообщение, Messenger должен получить outbound copy.

## WhatsApp

Канон:

```text
Notifications
  -> External Channel Adapter
    -> WhatsAppWebAdapter
      -> WAHA
        -> QR-connected WhatsApp account
          -> WhatsApp Group / 1:1 chat
```

Главный сценарий - WhatsApp Groups:

- Project group;
- Maintenance group;
- Support discussion;
- Finance reminders;
- Accounting WhatsApp group.

1:1 WhatsApp is secondary.

`WhatsAppOfficialAdapter / Meta Cloud API` не является обязательным и не планируется на ближайшие годы.

## Telegram

Telegram используется для внутренних срочных уведомлений.

Правила:

- только сотрудники;
- не клиентская коммуникация;
- short message + deep link;
- можно использовать для critical/high internal alerts;
- Telegram response не должен заменять task workflow.

## Email

Email используется для:

- invitations;
- formal reports;
- partner/client documents;
- digests;
- fallback для некоторых external communications.

Для MVP предпочтителен простой transactional provider, например Postmark. Масштабный дешёвый вариант вроде SES можно рассмотреть позже.

## Finance

Finance генерирует события, Notifications доставляет reminders.

Пример Invoice:

```text
Invoice Card status / due date
  -> Notification Rule checks tax_status + notifications_enabled
  -> WhatsApp group message via WAHA
  -> Messenger copy in Finance/Project external conversation
  -> Delivery status saved
```

Notifications не меняет invoice status. Finance остаётся владельцем Invoice.

## Tasks

Task events create notifications.

Task work should remain in Tasks:

- task assigned;
- task overdue;
- review requested;
- mention;
- close condition blocked.

If a notification needs tracked execution, create or link Task.

## Support

Support uses notifications for:

- new ticket;
- SLA warning;
- SLA breach;
- client replied;
- ticket reopened.

Client replies come through Messenger, then Support owns the ticket process.

## CRM

CRM uses notifications for:

- new Lead;
- unprocessed Lead;
- follow-up overdue;
- Deal Won handoff;
- stage gate blocked.

Deal type must use canonical values:

- `PRODUCT`;
- `EXTENSION`;
- `MAINTENANCE`;
- `OUTSOURCE`.

## Projects Hub

Projects/Products use notifications for:

- deadline soon;
- deadline missed;
- on-hold expired;
- stage gate blocked;
- transfer/closing checklist reminders.

On Hold expiration should notify and visually highlight the card.

## Drive

Drive uses notifications for:

- export ready;
- cleanup candidates;
- restricted file shared;
- file processing failed.

Files attached to notification-driven external messages still belong to Drive File Assets.

## Credentials

Credentials notifications are security-sensitive:

- secret viewed;
- secret changed;
- access denied;
- rotation due;
- suspicious access.

These notifications should be audited and may bypass normal quiet hours for admins/owners.

## My Company

My Company provides:

- employees;
- seats;
- departments;
- managers;
- permission roles;
- notification preferences.

Recipient resolution should use seats/departments/roles, not hard-coded employee names.
