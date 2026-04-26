# Messenger - overview

`Messenger` - это коммуникационный слой NBOS. Его задача не просто хранить переписку, а дать сотруднику быстрый доступ к правильному разговору в правильном бизнес-контексте: Deal, Project, Product, Task, Support, Finance или клиентская коммуникация.

Главное решение: в NBOS должны быть две строго разные зоны коммуникации.

| Зона                 | Русское название      | Для чего нужна                                                                            |
| -------------------- | --------------------- | ----------------------------------------------------------------------------------------- |
| `Internal Messenger` | Внутренний мессенджер | Переписка команды Neetrino по Deal, Project, Product, Task и внутренним вопросам          |
| `External Messenger` | Внешний мессенджер    | Реальные клиентские чаты: CRM omnichannel, WhatsApp groups, support/finance conversations |

Эти зоны нельзя смешивать визуально и технически. Внутреннее сообщение никогда не должно случайно уйти клиенту.

## Что Messenger не заменяет

| Не заменяет     | Почему                                                                              |
| --------------- | ----------------------------------------------------------------------------------- |
| `Tasks`         | Сообщение может создать Task, но не является задачей                                |
| `Notifications` | Messenger хранит диалог, Notifications доставляет системные напоминания             |
| `Drive`         | Файлы в чате хранятся как `File Asset`, Messenger только показывает их в контексте  |
| `CRM`           | CRM управляет Lead/Deal, Messenger показывает коммуникацию                          |
| `Support`       | Support Ticket остаётся рабочей сущностью обращения, Messenger только канал общения |

## Каноническая структура

```text
Messenger
  Internal
    All
    Project General
    Deal Chats
    Product Chats
    Task Chats
    Favorites / Collections

  External
    CRM Inbox
    Project WhatsApp Groups
    Support Conversations
    Finance Conversations
    All External
    Favorites / Collections
```

`All` может показывать иерархию для понимания контекста, но ежедневная работа должна идти через плоские вкладки. Пользователь не должен каждый раз открывать Project -> Product -> Chat, если он пишет туда десятки раз в день.

## Основные принципы

1. `Internal` и `External` разделяются жёстко.
2. Рабочие вкладки должны быть плоскими и быстрыми.
3. `1 Product = 1 main internal Product Chat`.
4. Development, Maintenance и Extension не создают отдельные чаты по умолчанию, чтобы не дробить обсуждение.
5. Task chat чаще открывается из Task card, а Messenger нужен в основном для ответа на непрочитанные task messages.
6. CRM client chat и internal Deal chat - разные сущности.
7. WhatsApp group после Deal Won - отдельная внешняя коммуникация, не CRM Inbox и не internal Product Chat.
8. Все вложения идут через `Drive File Asset`.
9. WebSocket нужен для live-обновления, но source of truth всегда база данных.
10. Провайдер WhatsApp/QR должен быть адаптером, а не частью ядра Messenger.

## Ключевые сущности

| Entity                        | Назначение                                                        |
| ----------------------------- | ----------------------------------------------------------------- |
| `Conversation`                | Чат или thread                                                    |
| `ConversationParticipant`     | Участник и его роль в конкретном чате                             |
| `Message`                     | Сообщение                                                         |
| `MessageDelivery`             | Статусы отправки во внешние каналы                                |
| `MessageReadState`            | Кто и когда прочитал                                              |
| `ConversationLink`            | Связь чата с Deal, Project, Product, Task, Ticket, Invoice и т.д. |
| `ExternalChannelAccount`      | Подключённый WhatsApp/Instagram/Facebook/Telegram/email account   |
| `ExternalConversationMapping` | Связь NBOS conversation с реальным внешним thread/group/chat      |
| `UserConversationSetting`     | Последняя вкладка, pin/mute, notification preference              |
| `ConversationCollection`      | Пользовательская коллекция быстрых чатов                          |

## Почему не делать всё одним списком

Один общий список выглядит проще технически, но опасен для бизнеса:

- можно случайно написать внутренний комментарий клиенту;
- Seller, Developer и PM работают в разных типах чатов;
- task messages имеют другую логику поведения;
- WhatsApp group может жить годами после разработки, а Deal chat нужен в продажах;
- слишком глубокая структура заставит людей вернуться в Telegram/WhatsApp.

Поэтому правильная модель: единое ядро сообщений, но разные рабочие поверхности.

## Связанные документы

- `01-Internal-Messenger.md`
- `02-External-Messenger-and-CRM-Inbox.md`
- `03-Messenger-Architecture.md`
- `04-Messenger-Integrations.md`
- `05-Messenger-Permissions-and-UX.md`
- `06-Messenger-Cleanup-Register.md`
