# Mail - overview

`Mail` - это встроенный почтовый модуль NBOS для работы с клиентскими и рабочими email-переписками прямо внутри платформы.

Главная задача модуля - дать сотруднику единый быстрый inbox для подключённых Gmail и корпоративных почтовых ящиков, не превращая NBOS в полноценную замену Gmail, Outlook или Thunderbird.

## Главный канон

```text
External mailbox
  -> Mail Account
  -> Mail Sync Job
  -> Email Thread
  -> Email Message
  -> optional business link
  -> optional Drive File Asset
  -> optional Notification
```

Mail хранит email-переписку и её техническое состояние. Бизнес-смысл письма принадлежит связанному модулю: CRM, Support, Finance, Projects Hub или Clients.

## Что Mail делает

| Задача             | Описание                                                              |
| ------------------ | --------------------------------------------------------------------- |
| Подключение ящиков | Gmail и корпоративная почта через утверждённый способ подключения     |
| Unified inbox      | Единый список входящих писем по доступным ящикам                      |
| Email reading      | Просмотр темы, отправителя, получателей, тела письма и вложений       |
| Reply / compose    | Ответ на письмо и отправка нового письма из NBOS                      |
| Basic threading    | Группировка писем в переписку по email headers                        |
| Read state         | Прочитано / не прочитано для пользователя и/или mailbox state         |
| Attachments        | Сохранение и отображение вложений через `Drive File Asset`            |
| Business links     | Связь письма с Contact, Company, Lead, Deal, Project, Ticket, Invoice |
| Delivery audit     | Базовый лог отправки, ошибок и sync-состояния                         |

## Что Mail не делает

| Не делает                                        | Почему                                                                                     |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Не является полноценным email-provider           | NBOS не выдаёт собственные mailbox-аккаунты и не заменяет почтовый хостинг                 |
| Не заменяет Messenger                            | Messenger хранит chat/conversation experience; Mail хранит email-specific переписку        |
| Не заменяет Notifications                        | Notifications создаёт системные email-сообщения; Mail нужен для ручной переписки и истории |
| Не хранит secrets                                | OAuth tokens, app passwords и SMTP/IMAP credentials относятся к `Credentials`              |
| Не хранит файлы напрямую                         | Вложения идут через `Drive File Asset`                                                     |
| Не меняет CRM/Support/Finance status напрямую    | Письмо может предложить действие, но owning module меняет свой статус сам                  |
| Не реализует сложные правила автоматизации в MVP | Assignment, routing, auto-labels и advanced workflows идут после стабильного базового ядра |

## Поддерживаемые mailbox-типы MVP

| Type                  | Назначение                         | Канон                                                                  |
| --------------------- | ---------------------------------- | ---------------------------------------------------------------------- |
| `Gmail`               | Google Workspace или обычный Gmail | OAuth, минимальные scopes, refresh через secure storage                |
| `Corporate IMAP/SMTP` | Почта хостинг-провайдеров          | IMAP для входящих, SMTP для отправки, credentials через secure storage |

Другие провайдеры добавляются позже через adapter layer, а не через переписывание ядра Mail.

## Каноническая структура

```text
Mail
  Inbox
    All Inboxes
    Assigned / Mine
    Unread
    Needs Link

  Mail Accounts
    Gmail Accounts
    Corporate Accounts
    Connection Health

  Thread Detail
    Messages
    Attachments
    Business Links
    Reply / Forward

  Admin / Settings
    Connected Mailboxes
    Sync Status
    Send Permissions
    Error Logs
```

`All Inboxes` - основной daily view. Глубокая структура папок почтового сервера не является главным UX NBOS MVP.

## Ключевые сущности

| Entity                   | Назначение                                                                   |
| ------------------------ | ---------------------------------------------------------------------------- |
| `MailAccount`            | Подключённый почтовый ящик или shared mailbox                                |
| `MailProviderConnection` | Техническое подключение к Gmail или IMAP/SMTP                                |
| `MailFolderMapping`      | Связь внешних folders/labels с NBOS inbox state                              |
| `EmailThread`            | Переписка, собранная по headers и mailbox context                            |
| `EmailMessage`           | Конкретное входящее или исходящее письмо                                     |
| `EmailRecipient`         | From, To, Cc, Bcc, Reply-To                                                  |
| `EmailAttachment`        | Связь письма с `Drive File Asset`                                            |
| `EmailBusinessLink`      | Связь письма/thread с Contact, Company, Lead, Deal, Project, Ticket, Invoice |
| `MailSyncCursor`         | Cursor/UID/history state для incremental sync                                |
| `MailDeliveryLog`        | Попытка отправки и результат provider/SMTP                                   |
| `UserMailSetting`        | Персональные настройки inbox, signature, default account                     |

## Основные принципы

1. Mail - отдельный модуль, но он обязан интегрироваться с `Clients`, `CRM`, `Support`, `Drive`, `Credentials`, `Notifications` и `Messenger`.
2. Source of truth для email history в NBOS - база данных после sync, а не открытое соединение IMAP/Gmail.
3. Любой provider подключается через adapter contract.
4. Вложения не хранятся в Mail напрямую.
5. Secrets и tokens не хранятся в обычных таблицах Mail.
6. В MVP не нужно копировать весь функционал Gmail: labels, filters, rules, snooze, delegation и complex search идут позже.
7. Письмо может быть связано с бизнес-сущностью, но не должно автоматически менять её lifecycle без явного правила.
8. Внешняя отправка всегда должна иметь audit: кто, из какого mailbox, кому и с каким результатом отправил.
9. Ошибки sync/send должны быть видны owner/admin, а не теряться в фоне.
10. Если email используется как клиентская коммуникация, он должен быть доступен из соответствующего business context.

## MVP scope

В MVP входит:

- подключение Gmail;
- подключение corporate IMAP/SMTP;
- список писем по доступным ящикам;
- просмотр письма и thread;
- ответ и новое письмо;
- read/unread;
- базовые вложения;
- простая связь с Contact/Company/Lead/Deal/Ticket/Project;
- базовый sync status и error log.

В MVP не входит:

- полноценный folder/label management;
- complex search index;
- auto-routing и assignment rules;
- email campaigns;
- mass mailing;
- shared draft collaboration;
- full offline mailbox mirror;
- calendar invite processing;
- advanced spam/security filtering.

## Связанные документы

- `01-Mail-Accounts-and-Sync.md`
- `02-Email-Threads-and-Messages.md`
- `03-Mail-Architecture.md`
- `04-Mail-Integrations.md`
- `05-Mail-Permissions-and-UX.md`
- `99-Mail-Cleanup-Register.md`
