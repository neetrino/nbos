# Messenger Architecture

Messenger должен работать быстро, но не должен хранить истину в WebSocket.

Канон:

```text
Client UI
  -> REST command / GraphQL mutation
  -> DB transaction
  -> MessageCreated event
  -> WebSocket broadcast
  -> Queue jobs
       -> external provider send
       -> notification fanout
       -> search indexing
       -> file processing
```

## Source of truth

База данных является единственным source of truth.

WebSocket нужен только для:

- live delivery в открытые окна;
- unread counter updates;
- typing indicators;
- presence;
- optimistic UI confirmation.

Если WebSocket потерялся, пользователь должен открыть историю через REST pagination и увидеть корректную картину.

## REST API

REST/API слой нужен для:

- загрузки списка conversations;
- загрузки истории сообщений;
- отправки команды `send message`;
- редактирования/удаления сообщения, если разрешено;
- управления участниками;
- управления collections/favorites;
- поиска.

## WebSocket

WebSocket события:

| Event                  | Назначение                                  |
| ---------------------- | ------------------------------------------- |
| `message.created`      | Новое сообщение                             |
| `message.updated`      | Изменение/редактирование                    |
| `message.deleted`      | Soft delete / redaction                     |
| `conversation.updated` | Изменился title, link, participants, unread |
| `read.updated`         | Прочитано пользователем                     |
| `typing.started`       | Пользователь печатает                       |
| `delivery.updated`     | Внешний канал обновил delivery status       |

## Queue

Queue обязательна для внешних каналов.

Она нужна, потому что WhatsApp/Instagram/provider:

- может ответить с задержкой;
- может временно упасть;
- может иметь rate limits;
- может прислать delivery status позже;
- может требовать retry.

## Message statuses

### Internal

| Status      | Значение                                                       |
| ----------- | -------------------------------------------------------------- |
| `created`   | Сообщение записано в DB                                        |
| `delivered` | Доставлено активным участникам через WebSocket или push/in-app |
| `read`      | Конкретный участник прочитал                                   |

### External

| Status      | Значение                                                |
| ----------- | ------------------------------------------------------- |
| `draft`     | Подготовлено, ещё не отправлено                         |
| `queued`    | Поставлено в очередь отправки                           |
| `sent`      | Provider принял сообщение                               |
| `delivered` | Внешний канал подтвердил доставку                       |
| `read`      | Внешний канал подтвердил прочтение, если поддерживается |
| `failed`    | Provider/adapter вернул ошибку                          |
| `cancelled` | Отправка отменена до provider send                      |

## Files and attachments

Messenger не хранит файлы напрямую.

Процесс:

1. Пользователь прикрепляет файл.
2. Drive создаёт `File Asset`.
3. Messenger message получает ссылку на `File Asset`.
4. Drive решает права, versioning, preview, cleanup, export.

Файлы из внешних каналов также должны попадать в Drive как File Asset с source `external_message`.

## Search

Поиск должен поддерживать:

- message text;
- participant;
- linked entity;
- date range;
- file name;
- external channel;
- unread / mentions;
- internal/external zone.

Для MVP можно начать с DB search, но архитектурно заложить отдельный search index.

## Permissions

Перед выдачей conversation и перед отправкой message система проверяет:

- доступ пользователя к conversation;
- доступ к linked entity;
- роль в conversation;
- external send permission;
- restricted finance/support/project data.

## Audit

Audit нужен особенно для External Messenger.

Логируются:

- кто отправил сообщение;
- из какого channel account;
- в какой external conversation;
- какой provider обработал;
- delivery status;
- ошибки отправки;
- кто добавил/удалил участника;
- кто изменил link conversation к бизнес-сущности.
