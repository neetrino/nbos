# Mail Architecture

Mail должен быть устойчивым к provider errors, rate limits и нестабильным IMAP/SMTP серверам.

Канон:

```text
Client UI
  -> REST command/query
  -> DB transaction
  -> Mail event
  -> Queue job
       -> Provider adapter
       -> Drive attachment processing
       -> Notification fanout
```

## Source of truth

База данных NBOS является source of truth для того, что пользователь видит в Mail UI.

Provider остаётся внешним источником email-фактов, но UI не должен зависеть от live IMAP/Gmail request при каждом открытии inbox.

## REST API

REST/API слой нужен для:

- списка доступных mail accounts;
- inbox queries;
- thread/message history;
- connect/disconnect mailbox commands;
- reply / compose commands;
- mark read/unread;
- link/unlink email to business entity;
- attachment metadata and download links;
- admin health/error views.

## Queue

Queue обязательна для:

- initial import;
- incremental sync;
- sending outbound email;
- downloading attachments;
- retry after provider failure;
- parsing large MIME messages;
- emitting notifications for new inbound messages.

## Provider adapter contract

Все provider-типы подключаются через единый adapter contract.

| Method               | Назначение                                   |
| -------------------- | -------------------------------------------- |
| `validateConnection` | Проверить OAuth/IMAP/SMTP настройки          |
| `fetchDelta`         | Получить изменения после cursor              |
| `fetchMessage`       | Получить конкретное письмо                   |
| `sendMessage`        | Отправить письмо                             |
| `downloadAttachment` | Скачать вложение                             |
| `markReadState`      | Опционально обновить read state у provider   |
| `getHealth`          | Проверить состояние подключения              |
| `reconnect`          | Переподключить или обновить connection state |

Core Mail не должен знать детали Gmail API, IMAP commands или SMTP provider behavior.

## Gmail adapter

Gmail adapter должен использовать OAuth и минимально нужные scopes.

MVP scope:

- читать письма;
- отправлять письма;
- получать delta/history;
- скачивать attachments.

Точные OAuth scopes должны быть утверждены перед реализацией, потому что это security decision.

## Corporate IMAP/SMTP adapter

IMAP используется для входящих писем, SMTP - для отправки.

Особенности:

- разные hosting providers ведут себя по-разному;
- UID validity может измениться;
- folders могут называться нестандартно;
- SMTP может принять письмо, но не дать дальнейший delivery status;
- app passwords / mailbox passwords относятся к secure storage.

## Data normalization

Provider payload должен нормализоваться в общий формат:

```text
ProviderEmailPayload
  -> NormalizedEmailMessage
  -> EmailThread / EmailMessage / EmailRecipient
  -> EmailAttachment metadata
```

Нормализация нужна, чтобы Gmail и corporate mail выглядели одинаково в UI и business links.

## Events

Mail может создавать события:

| Event                          | Назначение                        |
| ------------------------------ | --------------------------------- |
| `mail.message.received`        | Новое входящее письмо             |
| `mail.message.sent`            | Исходящее письмо отправлено       |
| `mail.message.failed`          | Отправка или обработка не удалась |
| `mail.account.needs_reconnect` | Mailbox требует переподключения   |
| `mail.thread.linked`           | Thread связан с бизнес-сущностью  |

Notifications, Support или CRM могут реагировать на эти события, но Mail не должен напрямую выполнять чужую бизнес-логику.

## Attachments pipeline

```text
EmailMessage created
  -> attachment metadata detected
  -> attachment download job
  -> Drive File Asset created
  -> EmailAttachment linked
  -> UI shows ready/failed state
```

Если download failed, письмо всё равно должно быть доступно.

## Search

MVP:

- subject;
- sender/recipient;
- date range;
- unread;
- linked entity;
- mailbox.

Полнотекстовый поиск по body можно начать с PostgreSQL FTS, но advanced search index не является обязательным MVP.

## Security architecture

Mail должен соблюдать:

- strict mailbox permissions;
- send permission before every outbound email;
- sanitized HTML rendering;
- no secrets in email logs;
- audit for sending;
- secure token/credential reference;
- rate limit на send endpoints.

## Failure model

Mail должен корректно переживать:

- provider downtime;
- OAuth revoke;
- expired credentials;
- IMAP timeout;
- SMTP send error;
- malformed MIME;
- duplicate provider messages;
- attachment download failure;
- queue retry exhaustion.

## MVP decisions

- Mail работает через background sync, а не через live provider reads в UI.
- Queue обязательна даже для MVP.
- Provider adapter boundary обязателен с первого дня.
- Gmail и IMAP/SMTP должны давать один normalized data model.
- Delivery/read receipts не являются обязательным promise MVP.
