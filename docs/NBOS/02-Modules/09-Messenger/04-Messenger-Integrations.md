# Messenger Integrations

Messenger становится полезным только если он связан с бизнес-сущностями NBOS. При этом он не должен забирать на себя ответственность других модулей.

## CRM

| Связь                    | Правило                                                      |
| ------------------------ | ------------------------------------------------------------ |
| Lead/Deal -> `CRM Inbox` | Реальная внешняя переписка с клиентом                        |
| Deal -> `Deal Chat`      | Внутреннее обсуждение сделки                                 |
| Offer proof -> Drive     | Скриншот/файл/сообщение сохраняется как offer material       |
| Message -> Lead/Deal     | Входящее сообщение может создать Lead или привязаться к Deal |

Важно: `CRM Inbox` и `Deal Chat` всегда разные conversations.

## Projects Hub

| Entity      | Messenger behavior                                                                     |
| ----------- | -------------------------------------------------------------------------------------- |
| Project     | Один `Project General` internal chat                                                   |
| Product     | Один основной `Product Chat`                                                           |
| Extension   | Обычно обсуждается в Product Chat связанного Product                                   |
| Maintenance | Продолжает использовать Product Chat, а клиентская сторона может жить в WhatsApp group |

Project/Product pages должны показывать related conversations, но не превращать Messenger в сложное дерево.

## Tasks and Work Spaces

| Entity       | Messenger behavior                                                   |
| ------------ | -------------------------------------------------------------------- |
| Task         | Task Chat внутри Task card, плюс отображение во вкладке `Task Chats` |
| Work Space   | Может иметь общий internal conversation, если нужен                  |
| Scrum/Sprint | Не создаёт chat автоматически, если нет явной бизнес-потребности     |

Task Chat не должен засорять Product Chat. Если из task discussion появляется решение, его можно закрепить/link back в Product context.

## Support

Support intake может прийти из External Messenger.

Процесс:

1. Клиент пишет во внешний канал.
2. Conversation связывается с Contact/Company/Project/Product.
3. Если это обращение, создаётся Ticket.
4. Внутренняя работа идёт через Ticket/Task.
5. Ответ клиенту уходит через External Messenger.

## Finance

Finance использует Messenger только как communication channel.

Примеры:

- reminder клиенту по Invoice;
- сообщение в бухгалтерскую WhatsApp-группу по Official Invoice request;
- вопрос клиента по оплате;
- уведомление о подписке.

Finance statuses меняются в Finance module. Message не является payment record.

## Clients

Client profile показывает коммуникацию из Messenger:

- последние external conversations;
- связанные WhatsApp groups;
- support conversations;
- finance conversations;
- offer proofs;
- linked files.

Contact/Company остаются источником клиентских данных.

## Drive

Все файлы Messenger идут через Drive:

- внешние вложения клиента;
- скриншоты offers;
- voice/video/call recordings, если появятся;
- finance PDFs;
- support evidence;
- task attachments.

Drive управляет хранением, версиями, cleanup, export и правами.

## Notifications

Notifications отвечает за напоминания и push/in-app/Telegram/WhatsApp delivery.

Messenger отвечает за:

- conversation history;
- message timeline;
- unread counters;
- replies from external channels.

Если Notification отправила WhatsApp-сообщение клиенту, копия должна попасть в Messenger как outbound external message, чтобы история была полной.

## My Company and RBAC

Доступ к Messenger зависит от:

- business seat;
- permission role;
- участия в conversation;
- доступа к linked entity;
- external send permission.

Например Developer может видеть Product Chat, но не видеть CRM Inbox по этому Deal, если ему это не нужно.

## Credentials

Пароли, токены и секреты нельзя хранить в Messenger.

Если сообщение содержит секрет:

- его нужно удалить/redact;
- секрет должен быть перенесён в Credentials Vault;
- в Messenger можно оставить безопасную ссылку на credential record, если права позволяют.
