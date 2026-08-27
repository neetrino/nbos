# Messenger — Overview

> Canon status: **approved product architecture**.
>
> Decision rationale: `08-Messenger-Decision-Register.md`.

`Messaging Core` is the shared communication engine of NBOS. It stores conversations, messages, participants, references, read state, realtime state and external-channel mappings.

The product UI is intentionally split into **two separate messenger surfaces**:

```text
Messaging Core
  ├── Internal Messenger
  └── Client Messenger
```

This is not a cosmetic tab split. Internal Messenger and Client Messenger have separate entry points, navigation, visual identity, collections, composer behavior, permissions and product actions.

**Why:** internal team discussion and client-visible communication carry different business risk. A shared backend avoids duplicated infrastructure, while separate product surfaces reduce accidental external sends and allow stronger client-facing guardrails. See `M-BOUNDARY-01`.

---

## 1. Product boundaries

| Surface              | Purpose                                         | Example conversations                                                                             |
| -------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `Internal Messenger` | Neetrino team communication only                | Product/Work Space discussion, Task discussion, Deal discussion, internal groups, direct messages |
| `Client Messenger`   | Real communication with clients/external people | WhatsApp product groups, WhatsApp/Meta sales conversations, existing-client conversations         |

Rules:

- an Internal conversation can never send through an external provider;
- a Client conversation is always visually client-facing and protected by external-send permission;
- Internal and Client conversation lists are never merged into one daily working list;
- Collections are separate per surface and cannot mix Internal and Client conversations;
- both surfaces may reuse shared UI primitives, but the user must always know which surface is open.

---

## 2. What Messenger does not replace

| Module          | Boundary                                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------- |
| `Tasks`         | Message(s) may create or reference a Task; Task remains the work entity. Human Task Discussion uses Messaging Core. |
| `Notifications` | Notifications decides when/how to notify; Messenger stores conversation history.                                    |
| `Drive`         | Messenger attachments are Drive File Assets.                                                                        |
| `CRM`           | CRM owns Lead/Deal lifecycle; Client Messenger owns client chat history.                                            |
| `Support`       | Support owns Ticket/SLA/case workflow; client communication remains in Client Messenger.                            |
| `Finance`       | Finance owns Invoice/Subscription/Payment/Client Service state; Messenger is only a communication destination.      |
| `Mail`          | `EmailThread/EmailMessage` stay in NBOS Mail and are not merged into chat persistence.                              |

---

## 3. Internal Messenger canon

Primary navigation:

```text
Internal Messenger
  All
  Products
  Tasks
  Deals
  Work Spaces
  Groups
  Direct
  Collections
```

Key rules:

- `All` is a recent-activity inbox, not a Project hierarchy tree;
- Product and its mandatory Connected Work Space resolve to the **same internal Conversation**;
- standalone Work Spaces may have their own conversation;
- Task Discussion uses the same Messaging Core and is embedded in Task Card;
- Project is primarily aggregate/context navigation; Project General is optional/lazy rather than mandatory for every Project;
- `Favorites` is a built-in personal Collection;
- user-created Collections may be personal or shared, but never grant conversation access.

Detailed behavior: `01-Internal-Messenger.md`.

---

## 4. Client Messenger canon

Primary navigation:

```text
Client Messenger
  Inbox
  Sales
  Clients
  Collections
```

`Support` and `Finance` are not separate message universes. They are workflows/purposes around canonical client conversations.

Key rules:

- Product client WORK conversation may live from Development through Maintenance;
- a physical WhatsApp group is an External Conversation, not a field owned directly by one Product;
- Product communication is resolved through purpose-based bindings, initially `WORK` and `FINANCE`;
- one physical WhatsApp group may serve multiple Products;
- each Product has one canonical WORK destination and optionally one explicit FINANCE destination;
- if no FINANCE destination is configured, finance messages fall back to WORK;
- opening a Client conversation does not immediately enable sending: the composer is locked until an authorized Employee explicitly activates `Reply to client` for that conversation session;
- external read and external send are separate permissions.

Detailed behavior: `02-External-Messenger-and-CRM-Inbox.md`.

---

## 5. Message-to-work behavior

Messages are first-class sources of work context.

Where permissions allow, one or multiple selected messages may be used to:

- reply;
- share/forward as references into an Internal conversation;
- create a Task;
- create/link a Support Ticket from Client Messenger;
- create/link a Deal from Client Messenger;
- open/copy source context.

The system references canonical source messages instead of copying the same message into multiple independent stores.

Threads/replies may exist, but forwarding or `Discuss internally` does **not** automatically create a new thread or Conversation.

---

## 6. Canonical communication graph

```text
Project
  ├── Product A
  │    ├── Connected Work Space
  │    │    └── ONE Internal Work Conversation
  │    ├── Tasks
  │    │    └── lazy Task Discussions
  │    └── Client Communication Bindings
  │         ├── WORK    -> External Conversation X
  │         └── FINANCE -> External Conversation Y (optional)
  │
  └── Product B
       └── WORK -> External Conversation X   # shared group is allowed
```

A standalone Work Space can have its own Internal conversation.

A Support Ticket links to the relevant Client messages and Tasks; it does not create a duplicate public client chat.

---

## 7. Core runtime architecture

```text
UI command
  -> authorization
  -> DB transaction
  -> durable Message / reference / participant state
  -> domain event / outbox
  -> realtime broadcast
  -> queue jobs
       -> external provider send
       -> notifications
       -> indexing
       -> file processing
```

Rules:

- database is the only source of truth;
- WebSocket/Socket.IO is live transport only;
- external sends use durable outbox/queue behavior;
- provider-specific logic stays behind adapters;
- attachments are Drive File Assets;
- audit is stronger for Client Messenger and external sends.

Detailed runtime: `03-Messenger-Architecture.md`.

---

## 8. WhatsApp boundary

Canonical transport:

```text
NBOS Messaging Core
  -> WhatsApp adapter
    -> WhatsApp Gateway
      -> WAHA
        -> WhatsApp
```

Inbound:

```text
WhatsApp -> WAHA -> Gateway -> authenticated NBOS webhook -> Messaging Core
```

Outbound:

```text
Employee/System -> Messaging Core -> durable queue -> Gateway -> WAHA -> WhatsApp
```

NBOS owns business context, permissions, CRM/Support/Finance links, routing, AI and message history. Gateway owns WhatsApp transport/session/provider concerns.

---

## 9. Attention routing

Conversation access and response ownership are separate concepts.

Default Client WORK attention policy:

```text
Delivery     -> Product PM
Maintenance  -> Support Intake queue
FINANCE      -> Finance/authorized queue
```

The canonical conversation remains the same when lifecycle or assignee changes.

---

## 10. Telegram target state

Telegram may remain a notification delivery option, but Internal Messenger does not target a permanent Telegram ↔ NBOS chat bridge.

If historical internal chats are migrated, migration is a controlled one-time import into NBOS. The target state is NBOS Web + Mobile as the primary internal messenger.

---

## 11. Canonical entities

The exact Prisma model names may be finalized during runtime reconciliation, but the domain requires the following concepts:

| Concept                                     | Purpose                                                                             |
| ------------------------------------------- | ----------------------------------------------------------------------------------- |
| `Conversation`                              | Canonical internal or client conversation                                           |
| `ConversationParticipant`                   | User/participant membership and conversation role                                   |
| `Message`                                   | Canonical message                                                                   |
| `MessageReadState`                          | Read cursor/state                                                                   |
| `ConversationLink`                          | Links conversation to Product, Work Space, Task, Deal, Project, Ticket, Client etc. |
| `MessageReference`                          | Stable reference from Task/Ticket/forwarded context to source message(s)            |
| `ExternalChannelAccount`                    | Connected WhatsApp/Meta/etc account                                                 |
| `ExternalConversationMapping`               | Maps NBOS conversation to provider chat/group/thread                                |
| `ProductCommunicationBinding` or equivalent | Resolves Product + purpose (`WORK`/`FINANCE`) to an External Conversation           |
| `ConversationCollection`                    | Internal- or Client-surface collection                                              |
| `UserConversationSetting`                   | Pin/mute/archive/default/personal preferences                                       |
| `ProviderEvent` / delivery state            | Idempotent provider webhook and external delivery tracking                          |

The implementation may reuse existing models if they satisfy these contracts; documentation does not require unnecessary renames.

---

## 12. Documentation map

### Product canon

- `01-Internal-Messenger.md`
- `02-External-Messenger-and-CRM-Inbox.md`
- `03-Messenger-Architecture.md`
- `04-Messenger-Integrations.md`
- `05-Messenger-Permissions-and-UX.md`
- `08-Messenger-Decision-Register.md` — decisions + Why
- `09-Messenger-Cross-Module-Canon.md`

### Runtime/migration and implementation process

- `06-Messenger-Cleanup-Register.md` — legacy/cleanup register
- `07-Internal-Messenger-Implementation-Progress.md` — runtime/status only
- `10-Messenger-Runtime-Reconciliation.md` — migration-safe current-runtime reconciliation
- `11-Messenger-Rebuild-Implementation-Checklist.md` — executable Slices 0–11
- `12-Messenger-Rebuild-Execution-Strategy.md` — Implementer → independent Reviewer rules
- `90-Messenger-Final-Acceptance.md` — fresh final release gate

Product code must not start from the checklist alone: Canon + Runtime Reconciliation + Execution Strategy are mandatory inputs.
