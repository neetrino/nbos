# WhatsApp Integration

## Каноническое решение

WhatsApp в NBOS подключается через `WhatsAppWebAdapter`, а первым техническим кандидатом является `WAHA`.

```text
NBOS Messenger / CRM / Notifications
  -> External Channel Adapter
    -> WhatsAppWebAdapter
      -> WAHA
        -> QR-connected WhatsApp account
          -> WhatsApp Groups / 1:1 chats
```

Это означает:

- NBOS работает с нашим обычным WhatsApp-аккаунтом;
- подключение происходит через QR, как WhatsApp Web;
- сотрудники пишут и отвечают из интерфейса NBOS Messenger/CRM;
- 99% коммуникации идёт в WhatsApp Groups;
- 1:1 WhatsApp chats поддерживаются тем же adapter, но являются вторичным сценарием.

`WhatsAppOfficialAdapter / Meta Cloud API` не является MVP и не является планом на ближайшие годы. Его можно рассматривать только как distant future option, если бизнес-модель радикально изменится.

## Почему не Official API

В текущем бизнес-процессе Neetrino WhatsApp используется не как marketing broadcast system и не как массовая 1:1 рассылка.

Реальная модель:

- основная коммуникация идёт в проектных WhatsApp-группах;
- invoice reminders и service updates уходят в группы;
- accounting requests уходят в бухгалтерскую WhatsApp-группу;
- Seller иногда ведёт 1:1 переписку, но это редкий сценарий;
- чаще команда отвечает клиенту, а не пишет первой.

Поэтому официальный WhatsApp Cloud API сейчас усложняет систему и не закрывает главный сценарий так хорошо, как WhatsApp Web / QR adapter.

## Что покрывает WhatsAppWebAdapter

| Сценарий                       | Покрывается                                 |
| ------------------------------ | ------------------------------------------- |
| Project WhatsApp Groups        | Да                                          |
| Maintenance communication      | Да                                          |
| Support communication в группе | Да                                          |
| Invoice reminders в группу     | Да                                          |
| Accounting WhatsApp group      | Да                                          |
| CRM WhatsApp 1:1               | Да, вторичный сценарий                      |
| Входящие сообщения             | Да, через webhook/events WAHA               |
| Исходящие сообщения            | Да                                          |
| Вложения                       | Да, с передачей в Drive                     |
| Participants / group events    | Да, если поддерживается adapter/WAHA engine |

## Роль WAHA

`WAHA` - первый self-hosted инструмент для реализации `WhatsAppWebAdapter`.

Почему WAHA выбран первым:

- сфокусирован на WhatsApp HTTP API;
- поддерживает groups;
- поддерживает sessions;
- поддерживает webhooks;
- проще и легче, чем большая automation-платформа;
- позволяет держать критичный слой под контролем NBOS.

## Fallback варианты

Если WAHA окажется нестабильным или дорогим в эксплуатации по времени команды, NBOS должен позволить заменить adapter без переписывания бизнес-логики.

| Вариант         | Когда использовать                                                               |
| --------------- | -------------------------------------------------------------------------------- |
| `Whapi`         | Managed provider fallback, если нужен быстрый production-ready group-capable API |
| `Wazzup`        | Managed provider fallback с webhooks и CRM-oriented подходом                     |
| `Wappi`         | Managed provider fallback, если подходит по цене/региону/стабильности            |
| `Evolution API` | Second self-hosted candidate, если WAHA не подойдёт                              |

Выбор fallback делается только после теста WAHA.

## External Channel Adapter contract

NBOS не должен зависеть напрямую от WAHA, Whapi, Wazzup, Wappi или Evolution.

Внутренний контракт:

| Method               | Назначение                                       |
| -------------------- | ------------------------------------------------ |
| `sendMessage`        | Отправить сообщение                              |
| `receiveWebhook`     | Принять входящее событие                         |
| `syncConversation`   | Синхронизировать чат/группу/participants/history |
| `getDeliveryStatus`  | Получить или обработать статус доставки          |
| `downloadAttachment` | Скачать вложение и передать его в Drive          |
| `reconnectChannel`   | Переподключить QR session                        |
| `healthCheck`        | Проверить состояние канала                       |

## Связь с Messenger

WhatsApp messages отображаются во `External Messenger`.

Зоны:

| Messenger zone                        | WhatsApp scenario                           |
| ------------------------------------- | ------------------------------------------- |
| `External -> CRM Inbox`               | 1:1 WhatsApp chats по Lead/Deal             |
| `External -> Project WhatsApp Groups` | Проектные группы после Deal Won             |
| `External -> Support Conversations`   | Support discussion с клиентом               |
| `External -> Finance Conversations`   | Оплаты, reminders, finance/client questions |

Internal Messenger никогда не отправляет сообщения в WhatsApp.

## Связь с Notifications

`Notifications` создаёт системное событие:

- invoice reminder;
- maintenance reminder;
- support update;
- accounting request;
- service update.

Затем оно отправляется через `WhatsAppWebAdapter`.

После отправки копия должна сохраняться в Messenger как outbound external message, чтобы история общения была полной.

## Связь с Drive

Все WhatsApp-вложения должны сохраняться через Drive:

1. Adapter получает файл или media URL.
2. NBOS скачивает вложение через `downloadAttachment`.
3. Drive создаёт `File Asset`.
4. Messenger message получает ссылку на File Asset.
5. File Asset связывается с Project/Product/Deal/Task/Ticket/Invoice, если контекст известен.

## Статусы

Минимальные статусы channel/message:

| Status         | Значение                                  |
| -------------- | ----------------------------------------- |
| `connected`    | QR session активна                        |
| `disconnected` | Session потеряна                          |
| `qr_required`  | Нужно заново сканировать QR               |
| `queued`       | Сообщение поставлено в очередь            |
| `sent`         | Adapter отправил сообщение                |
| `delivered`    | Канал подтвердил доставку, если доступно  |
| `read`         | Канал подтвердил прочтение, если доступно |
| `failed`       | Ошибка отправки                           |

## Правила безопасности

- WhatsApp zone всегда считается external/client-visible.
- Composer должен явно показывать, что сообщение уйдёт во внешний канал.
- У пользователя должно быть право писать во внешний канал.
- Все исходящие сообщения логируются.
- Пароли и секреты нельзя отправлять через WhatsApp.
- Если session потеряна, система должна показать alert ответственным пользователям.

## Тест перед production

Перед утверждением WAHA нужно проверить:

- подключение через QR;
- reconnect после logout/restart;
- отправку в Project WhatsApp Group;
- входящие сообщения из группы;
- отправку и получение файлов;
- участников группы;
- стабильность 2-3 недели;
- поведение при недоступности WAHA;
- восстановление после перезапуска сервера;
- корректную передачу сообщений в Messenger;
- корректное создание Drive File Assets для вложений.
