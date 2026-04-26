# Notifications System - overview

`Notifications` - это event-driven engine, который превращает бизнес-события NBOS в понятные уведомления, напоминания, эскалации и внешние сообщения.

Notifications не является Messenger и не является Automation module. Его задача: решить кому, когда, через какой канал и с каким контекстом нужно доставить событие.

## Главный канон

```text
Business Event
  -> Notification Rule
  -> Notification Job
  -> Delivery Channel
  -> Delivery Log
  -> optional Messenger copy
  -> optional Task / Action if work is required
```

## Что Notifications делает

| Задача                  | Описание                                                           |
| ----------------------- | ------------------------------------------------------------------ |
| In-App alerts           | Уведомления в NBOS для сотрудников                                 |
| Telegram alerts         | Срочные внутренние уведомления через Telegram Bot                  |
| WhatsApp group messages | Клиентские/финансовые сообщения через `WhatsAppWebAdapter -> WAHA` |
| Email messages          | Формальные письма, invites, reports, documents                     |
| Reminders               | Повторные напоминания по правилам                                  |
| Escalations             | Расширение получателей, если реакции нет                           |
| Delivery audit          | Лог кому, когда, что и с каким статусом отправлено                 |

## Что Notifications не делает

| Не делает                                     | Почему                                                |
| --------------------------------------------- | ----------------------------------------------------- |
| Не хранит переписку                           | Conversation history хранит `Messenger`               |
| Не заменяет Task                              | Если нужна работа, создаётся `Task` или linked action |
| Не меняет Finance/CRM/Project status напрямую | Status меняет owning module                           |
| Не является scheduler UI                      | Время запуска хранится в jobs/scheduler layer         |
| Не хранит файлы                               | Вложения идут через `Drive File Asset`                |

## Каналы доставки

| Channel              | Русское название       | Для кого                                        | Канон                               |
| -------------------- | ---------------------- | ----------------------------------------------- | ----------------------------------- |
| `In-App`             | Внутри NBOS            | Сотрудники                                      | Основной обязательный канал         |
| `Telegram Bot`       | Telegram bot           | Сотрудники                                      | Срочные внутренние уведомления      |
| `WhatsAppWebAdapter` | WhatsApp через WAHA/QR | Клиенты, проектные группы, бухгалтерская группа | Основной WhatsApp путь              |
| `Email`              | Email                  | Сотрудники, клиенты, партнёры                   | Формальные письма, invites, reports |
| `Messenger Copy`     | Копия в Messenger      | External Messenger                              | Не канал доставки, а запись истории |

`WhatsAppOfficialAdapter / Meta Cloud API` не является MVP и не является планом на ближайшие годы.

## Главное разделение с Messenger

`Notifications` создаёт и доставляет системное сообщение.
`Messenger` хранит историю внешней или внутренней коммуникации.

Пример:

```text
Invoice reminder due
  -> Notifications creates WhatsApp delivery job
  -> WhatsAppWebAdapter sends message to Project WhatsApp Group
  -> Messenger stores outbound message copy in External conversation
```

Если клиент ответил, это уже `Messenger inbound message`, а не notification.

## Типы уведомлений

| Type               | Назначение                                 |
| ------------------ | ------------------------------------------ |
| `informational`    | Просто сообщить                            |
| `action_required`  | Нужно действие пользователя                |
| `reminder`         | Напоминание перед датой или после задержки |
| `escalation`       | Подключение руководителя/CEO               |
| `external_message` | Системное сообщение клиенту/группе         |
| `audit_security`   | Безопасность, доступы, credentials         |
| `system_health`    | Ошибки интеграций, queue, WAHA session     |

## Приоритеты

| Priority   | Поведение                                               |
| ---------- | ------------------------------------------------------- |
| `low`      | Можно объединять в digest                               |
| `normal`   | Обычная доставка                                        |
| `high`     | Быстрая доставка, может идти в Telegram                 |
| `critical` | Игнорирует quiet hours/DND для внутренних ответственных |

Внешние WhatsApp-сообщения клиентам не должны автоматически игнорировать business hours без отдельного правила.

## Ключевые сущности

| Entity                   | Назначение                                                  |
| ------------------------ | ----------------------------------------------------------- |
| `NotificationEvent`      | Бизнес-событие, которое может породить уведомления          |
| `NotificationRule`       | Условия, получатели, каналы, priority, schedule             |
| `NotificationJob`        | Запланированная или текущая отправка                        |
| `Notification`           | In-App запись для пользователя                              |
| `NotificationDelivery`   | Попытка доставки в конкретный канал                         |
| `NotificationPreference` | Персональные настройки сотрудника                           |
| `EscalationRule`         | Правило эскалации                                           |
| `NotificationTemplate`   | Текст/шаблон сообщения с переменными                        |
| `NotificationAction`     | Действие из уведомления: open, approve, snooze, create task |

## Основные источники событий

| Module        | Примеры событий                                                    |
| ------------- | ------------------------------------------------------------------ |
| CRM           | Новый Lead, follow-up overdue, Deal Won, stage gate blocked        |
| Finance       | Invoice due, overdue, payment received, expense due, payroll ready |
| Subscriptions | Upcoming billing, failed payment, pending activation               |
| Projects Hub  | Deadline approaching, stage gate blocked, on-hold expired          |
| Tasks         | Assigned, overdue, review requested, mention                       |
| Support       | New ticket, SLA warning, SLA breach, client replied                |
| Partners      | Payout due, agreement expiring, new referral                       |
| Drive         | Cleanup candidate, restricted file shared, export ready            |
| Credentials   | Secret viewed/changed, access denied, rotation due                 |
| Integrations  | WAHA disconnected, queue failed, webhook error                     |

## UI expectations

Минимальный UI:

- topbar bell;
- unread count;
- Notification Center;
- filters by category;
- mark as read;
- action buttons;
- link to related entity;
- delivery/audit view для admins.

Для пользователя уведомление должно отвечать на три вопроса:

1. Что произошло?
2. Что от меня нужно?
3. Куда нажать, чтобы решить?

## Связанные документы

- `02-Notification-Engine-Architecture.md`
- `03-Notification-Rules-and-Escalations.md`
- `04-Notification-Integrations.md`
- `05-Notifications-Cleanup-Register.md`
- `../09-Messenger/03-Messenger-Architecture.md`
- `../../06-Integrations/01-WhatsApp-Integration.md`
