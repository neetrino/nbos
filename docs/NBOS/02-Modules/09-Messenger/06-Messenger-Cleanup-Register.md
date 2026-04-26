# Messenger Cleanup Register

Этот файл фиксирует, что нужно убрать или переписать в реализации и старых документах, чтобы Messenger соответствовал новому канону.

## A. Что принято как новый канон

- Messenger делится на `Internal` и `External`.
- CRM client conversations живут в `External -> CRM Inbox`.
- Internal Deal Chat и CRM Inbox - разные conversations.
- `1 Product = 1 main internal Product Chat`.
- Development, Maintenance и Extension не создают отдельные чаты по умолчанию.
- Task Chats визуально отдельные, чаще используются для ответа на сообщения из задач.
- WhatsApp Groups живут во External Messenger и связаны с Project/Product.
- WhatsApp primary integration: `WhatsAppWebAdapter -> WAHA -> QR-connected WhatsApp account`.
- `WhatsAppOfficialAdapter / Meta Cloud API` не является MVP и не является планом на ближайшие годы.
- WhatsApp/QR/provider logic должна быть adapter layer.
- WebSocket - только live transport, база данных - source of truth.
- Все attachments идут через Drive File Assets.

## B. Текущая реализация не соответствует канону

Текущий код:

- `apps/api/src/modules/messenger/messenger.service.ts`
- `apps/api/src/modules/messenger/messenger.controller.ts`
- `apps/web/src/app/(app)/messenger/page.tsx`
- `apps/web/src/app/(app)/messenger/_data.ts`
- `packages/database/prisma/schema.prisma`

Проблемы:

- backend использует in-memory `Map`, а не Prisma models;
- нет `Conversation`, `Message`, `Participant`, `Delivery`, `ReadState` моделей;
- нет WebSocket gateway;
- нет очереди для внешних каналов;
- нет External Channel Adapter;
- web page использует mock data;
- нет разделения Internal/External;
- нет CRM Inbox;
- нет Product Chat / Task Chat / WhatsApp Group модели;
- нет Drive attachments;
- нет permission model и audit log.

## C. Старый Messenger doc заменён

Старый `01-Messenger-Overview.md` описывал:

- один общий Messenger;
- project chats with topics;
- General/Sales/Development/Task Chats внутри project structure;
- клиентский omnichannel в том же общем описании;
- WhatsApp через агрегатор без ясной границы adapter layer;
- task chats как часть общей project chat логики.

Это заменено новым набором документов:

- `00-Messenger-Overview.md`
- `01-Internal-Messenger.md`
- `02-External-Messenger-and-CRM-Inbox.md`
- `03-Messenger-Architecture.md`
- `04-Messenger-Integrations.md`
- `05-Messenger-Permissions-and-UX.md`
- `06-Messenger-Cleanup-Register.md`

## D. Implementation backlog

### Phase 1 - Data foundation

- добавить Prisma models для conversations/messages/participants/read states;
- добавить `ConversationLink` для связи с Deal/Project/Product/Task/Ticket/Invoice/etc.;
- добавить seed только для нового канона;
- убрать in-memory source of truth.

### Phase 2 - Internal Messenger

- реализовать Internal zone;
- реализовать tabs: All, Project General, Deal Chats, Product Chats, Task Chats, Favorites;
- Product page должен открывать один Product Chat;
- Task card должен иметь task discussion panel;
- Messenger Task Chats tab должен показывать task unread/reply flow.

### Phase 3 - Real-time

- добавить WebSocket gateway;
- message.created / read.updated / typing / delivery.updated events;
- fallback REST history pagination;
- unread counters.

### Phase 4 - External Messenger

- реализовать External zone;
- CRM Inbox;
- Project WhatsApp Groups;
- Support/Finance Conversations;
- `External Channel Adapter` interface;
- `WhatsAppWebAdapter` на базе WAHA;
- QR session management;
- fallback strategy: Whapi/Wazzup/Wappi или Evolution API, если WAHA не подойдёт.

### Phase 5 - Drive, Search, Audit

- attachments through Drive File Asset;
- search;
- audit log;
- archive/lock/mute;
- export and cleanup support.

## E. Migration note

Так как текущий Messenger выглядит как MVP/mock и in-memory сервис, исторических production messages в этой реализации нет. Старые mock channels/messages можно удалить или заменить seed-данными нового канона.

Если к моменту реализации появятся реальные сообщения, нужна отдельная миграция:

- direct messages -> Internal conversations;
- project channels -> Project General или Product Chat после ручного mapping;
- task-related messages -> Task Chat;
- external messages -> External conversations после определения channel/source.
