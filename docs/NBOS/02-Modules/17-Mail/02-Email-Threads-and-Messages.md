# Email Threads and Messages

`EmailThread` и `EmailMessage` - центральные сущности Mail module.

Email thread в NBOS нужен не для идеального копирования Gmail UI, а для удобной рабочей истории вокруг клиента, сделки, тикета или проекта.

## EmailThread

`EmailThread` группирует письма одной переписки.

Минимальные поля:

| Field               | Назначение                                    |
| ------------------- | --------------------------------------------- |
| `id`                | Внутренний ID                                 |
| `mailAccountId`     | Основной mailbox context                      |
| `subjectNormalized` | Нормализованная тема без `Re:` / `Fwd:`       |
| `lastMessageAt`     | Время последнего письма                       |
| `lastInboundAt`     | Последнее входящее письмо                     |
| `lastOutboundAt`    | Последнее исходящее письмо                    |
| `status`            | `open`, `archived`, `closed` если понадобится |
| `hasUnread`         | Быстрый unread flag                           |
| `needsBusinessLink` | Требует ручной привязки к бизнес-контексту    |

## Threading rules

Порядок определения thread:

1. provider thread id, если он есть и надёжен;
2. `Message-ID`, `In-Reply-To`, `References`;
3. fallback по normalized subject + participants + time window.

Fallback не должен агрессивно склеивать разные переписки только по похожей теме.

## EmailMessage

Минимальные поля:

| Field               | Назначение                                        |
| ------------------- | ------------------------------------------------- |
| `id`                | Внутренний ID                                     |
| `threadId`          | Связанный thread                                  |
| `mailAccountId`     | Mailbox, через который письмо получено/отправлено |
| `providerMessageId` | ID письма у provider                              |
| `messageIdHeader`   | RFC `Message-ID`                                  |
| `direction`         | `inbound` или `outbound`                          |
| `subject`           | Исходная тема                                     |
| `bodyText`          | Plain text body                                   |
| `bodyHtmlSanitized` | Sanitized HTML body                               |
| `sentAt`            | Время отправки по email headers                   |
| `receivedAt`        | Время получения NBOS/provider                     |
| `readState`         | Read/unread state                                 |
| `deliveryStatus`    | Для outbound                                      |

## Recipients

`EmailRecipient` хранит:

- `from`;
- `to`;
- `cc`;
- `bcc` для outbound и доступных provider cases;
- `replyTo`.

Для inbound Bcc часто недоступен и не должен считаться обязательным.

## Message body

Правила:

1. HTML body перед показом должен быть sanitized.
2. Plain text должен сохраняться, если provider/MIME его даёт.
3. Если есть только HTML, NBOS может построить text preview.
4. Inline images считаются attachments или embedded assets по provider metadata.
5. Tracking scripts и опасные HTML элементы не должны исполняться в UI.

## Attachments

```text
Email attachment
  -> download from provider
  -> create Drive File Asset
  -> link EmailAttachment to File Asset
```

Mail не хранит бинарные файлы напрямую.

Attachment metadata:

| Field                  | Назначение                   |
| ---------------------- | ---------------------------- |
| `fileName`             | Имя файла                    |
| `mimeType`             | MIME type                    |
| `sizeBytes`            | Размер                       |
| `providerAttachmentId` | ID у provider                |
| `fileAssetId`          | Ссылка на Drive              |
| `isInline`             | Inline image/content         |
| `downloadStatus`       | `pending`, `ready`, `failed` |

## Read / unread

MVP допускает два слоя:

| Layer          | Назначение                               |
| -------------- | ---------------------------------------- |
| Provider state | Что прочитано в mailbox provider         |
| User state     | Что конкретный пользователь видел в NBOS |

Для shared mailbox важнее `User state`, чтобы один сотрудник не ломал unread-картину другого. Синхронизация read state обратно в provider - отдельное решение, не обязательное для MVP.

## Reply flow

```text
User opens thread
  -> writes reply
  -> chooses sender mailbox
  -> NBOS validates send permission
  -> creates outbound EmailMessage draft/queued
  -> Mail Send Job sends via provider
  -> delivery status updates
```

## Compose flow

```text
User creates new email
  -> selects from mailbox
  -> adds recipients / subject / body / attachments
  -> NBOS validates permission and attachment access
  -> sends via provider adapter
  -> creates EmailThread and outbound EmailMessage
```

## Delivery statuses

| Status      | Значение                    |
| ----------- | --------------------------- |
| `draft`     | Подготовлено, не отправлено |
| `queued`    | Поставлено в очередь        |
| `sent`      | Provider/SMTP принял письмо |
| `failed`    | Отправка не удалась         |
| `cancelled` | Отменено до отправки        |

SMTP не всегда даёт реальное `delivered/read`, поэтому MVP не должен обещать delivery/read receipts как базовую функцию.

## Business links

Thread или message может быть связан с:

- `Contact`;
- `Company`;
- `Lead`;
- `Deal`;
- `Project`;
- `Product`;
- `Support Ticket`;
- `Invoice`;
- `Client Service Record`.

Если письмо не удалось автоматически связать, оно попадает в `Needs Link`.

## MVP decisions

- Threading должен быть практичным, но не обязан идеально повторять Gmail.
- Вложения идут только через Drive.
- HTML body обязательно sanitize перед показом.
- Shared mailbox unread должен учитывать user-level read state.
- Email body не должен автоматически создавать бизнес-статусы без явного действия пользователя или отдельного правила.
