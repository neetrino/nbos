# Mail Permissions and UX

Mail UI должен быть быстрым и простым, но permissions должны быть строгими. Ошибка отправки письма не туда или из неправильного mailbox может иметь бизнес-риски.

## Основной UX

Главный экран:

```text
Mail
  [All Inboxes] [Unread] [Mine] [Needs Link]

  Left: filters / accounts
  Center: thread list
  Right: thread detail
```

Для MVP важнее быстрый daily inbox, чем точное повторение всех папок Gmail/Outlook.

## Минимальные views

| View             | Назначение                                            |
| ---------------- | ----------------------------------------------------- |
| `All Inboxes`    | Все доступные входящие письма                         |
| `Unread`         | Непрочитанные пользователем                           |
| `Mine`           | Письма из личных mailbox или назначенные пользователю |
| `Needs Link`     | Письма без business context                           |
| `Sent`           | Исходящие из доступных mailbox                        |
| `Account Health` | Для admin/owner: состояние подключений                |

## Thread detail

Thread detail должен показывать:

- subject;
- participants;
- messages in chronological order;
- attachments;
- linked business entities;
- sender mailbox для reply;
- reply composer;
- delivery/error state для outbound;
- quick actions.

## Quick actions

MVP quick actions:

- reply;
- compose new;
- mark read/unread;
- link to Contact/Company;
- link to Lead/Deal;
- create Support Ticket;
- link to Project/Product;
- save attachment to Drive context;
- open related entity.

## Permissions model

Доступ проверяется на двух уровнях:

1. доступ к `MailAccount`;
2. доступ к linked business entity, если thread уже связан с CRM/Support/Finance/Project.

Пользователь не должен видеть письмо только потому, что он имеет доступ к Contact, если mailbox/thread ему не доступен.

## MailAccount roles

| Role     | Возможности                                 |
| -------- | ------------------------------------------- |
| `owner`  | Управлять mailbox, permissions, отключением |
| `admin`  | Настраивать mailbox и видеть health/audit   |
| `reader` | Читать письма                               |
| `sender` | Отправлять ответы/новые письма              |
| `linker` | Связывать thread с бизнес-сущностями        |

Роли могут быть назначены пользователю или команде.

## Send permission

Перед отправкой NBOS проверяет:

- пользователь имеет `sender` permission на mailbox;
- mailbox active и не требует reconnect;
- recipients валидны;
- attachments доступны пользователю;
- linked entity не запрещает external communication;
- rate limit не превышен.

## Shared mailbox behavior

Shared mailbox не должен вести себя как личный inbox одного пользователя.

Правила:

1. read/unread для UI хранится на уровне пользователя;
2. отправитель письма в audit всегда конкретный NBOS user;
3. from address может быть shared mailbox;
4. signature может быть personal или mailbox-level;
5. если несколько пользователей отвечают одновременно, MVP должен хотя бы обновлять thread после send.

## Sensitive content

Mail может содержать:

- personal data;
- invoices;
- contracts;
- access details from clients;
- screenshots with sensitive information.

Поэтому:

- HTML body sanitize обязателен;
- attachments respect Drive permissions;
- secrets не переносятся в Drive как обычные документы без проверки;
- audit нужен для outbound;
- admin может видеть health/logs, но не обязательно весь body личных mailbox без permission.

## UI principles

1. Inbox должен открываться быстро.
2. Основной список должен показывать sender, subject, preview, linked entity, mailbox, unread state, last date.
3. Пользователь должен сразу понимать, к какому клиенту/сделке/тикету относится письмо.
4. Unknown emails должны быть легко привязаны, иначе inbox станет мусором.
5. Mail не должен перегружать пользователя folders/labels в MVP.
6. Ошибки отправки должны быть заметны рядом с письмом.
7. Account reconnect должен быть понятным и actionable.

## Admin UX

Admin/owner view:

- список connected mailboxes;
- provider type;
- owner/team;
- status;
- last sync;
- last error;
- send permission summary;
- reconnect action;
- disable action;
- error log.

## MVP decisions

- `All Inboxes`, `Unread`, `Mine`, `Needs Link`, `Sent` достаточно для первого UI.
- Folder/label UX не является MVP.
- Shared mailbox read state хранится per user.
- Send permission отделён от read permission.
- Admin health view обязателен, потому что mail integrations ломаются чаще обычного CRUD.
