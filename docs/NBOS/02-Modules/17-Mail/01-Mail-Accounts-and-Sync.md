# Mail Accounts and Sync

`MailAccount` описывает почтовый ящик, доступный в NBOS. Это может быть личный рабочий mailbox сотрудника, общий sales/support mailbox или технический mailbox компании.

## Типы аккаунтов MVP

| Type                  | Пример                                | Подключение  |
| --------------------- | ------------------------------------- | ------------ |
| `gmail`               | `sales@company.com`, Gmail user inbox | Google OAuth |
| `corporate_imap_smtp` | mailbox от hosting provider           | IMAP + SMTP  |

## MailAccount

Минимальные поля:

| Field             | Назначение                                        |
| ----------------- | ------------------------------------------------- |
| `id`              | Внутренний ID                                     |
| `ownerUserId`     | Владелец, если mailbox личный                     |
| `teamScope`       | Команда/модуль, если mailbox общий                |
| `emailAddress`    | Основной email                                    |
| `displayName`     | Имя отправителя                                   |
| `providerType`    | `gmail` или `corporate_imap_smtp`                 |
| `status`          | `active`, `needs_reconnect`, `paused`, `disabled` |
| `lastSyncAt`      | Последняя успешная синхронизация                  |
| `lastErrorAt`     | Последняя ошибка                                  |
| `createdByUserId` | Кто подключил mailbox                             |

## Provider connection

`MailProviderConnection` хранит техническое состояние подключения.

Для Gmail:

- Google account subject / provider account id;
- granted scopes;
- token reference в secure storage;
- Gmail history cursor;
- reconnect state.

Для corporate IMAP/SMTP:

- host и port для IMAP;
- host и port для SMTP;
- secure mode;
- username;
- credential reference в secure storage;
- IMAP UID validity / last UID cursor;
- SMTP health state.

Secrets, refresh tokens, app passwords и SMTP passwords не должны храниться как plain fields в Mail. Mail хранит только ссылку на безопасное хранилище.

## Sync model

```text
MailAccount active
  -> scheduled Mail Sync Job
  -> provider adapter fetches delta
  -> normalize email message
  -> upsert EmailThread / EmailMessage
  -> download attachments if needed
  -> emit MailMessageReceived event
```

## Sync rules

1. Sync должен быть incremental, а не full scan каждый раз.
2. Full import допускается только при первом подключении или admin repair.
3. Для MVP достаточно ограниченного historical import, например последние N дней или N писем, но конкретное значение должно быть утверждено owner перед реализацией.
4. Если provider недоступен, job фиксирует ошибку и переводит аккаунт в degraded state после повторов.
5. Один provider failure не должен ломать весь Mail module.
6. Sync не должен удалять данные из NBOS физически только потому, что письмо исчезло у provider.
7. Deleted/archived/moved states в MVP можно хранить как provider state, но не строить вокруг них сложный UX.

## Account health

Статусы:

| Status            | Значение                                      |
| ----------------- | --------------------------------------------- |
| `active`          | Подключение работает                          |
| `syncing`         | Идёт фоновая синхронизация                    |
| `degraded`        | Есть ошибки, но mailbox ещё частично работает |
| `needs_reconnect` | Нужно переподключить OAuth или credentials    |
| `paused`          | Sync остановлен вручную                       |
| `disabled`        | Аккаунт отключён                              |

## Error handling

Ошибки должны попадать в `MailDeliveryLog` или `MailSyncLog`:

- authentication failed;
- token expired / revoked;
- IMAP connection failed;
- SMTP send failed;
- provider rate limit;
- attachment download failed;
- invalid MIME payload;
- duplicate message conflict.

Admin/owner должен видеть проблемные аккаунты в settings/admin view.

## Подключение mailbox

Канонический процесс:

```text
User/Admin opens Mail Settings
  -> chooses provider type
  -> completes OAuth or enters server settings
  -> NBOS validates connection
  -> MailAccount created
  -> initial limited import starts
  -> account appears in Inbox
```

## Отключение mailbox

Отключение не должно сразу удалять историю.

Правильная модель:

1. остановить sync;
2. запретить отправку из mailbox;
3. сохранить историю и business links;
4. дать owner/admin возможность архивировать или удалить данные по отдельной policy.

## MVP decisions

- Gmail и corporate IMAP/SMTP являются единственными mailbox types в MVP.
- Shared mailbox поддерживается через permissions на `MailAccount`, а не через отдельный тип сущности.
- Folder/label sync не является главным UX MVP.
- Secrets всегда идут через secure storage / Credentials boundary.
