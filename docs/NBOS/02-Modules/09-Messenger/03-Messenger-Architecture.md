# Messenger Architecture

> Canon status: **approved target architecture**.
>
> Product rationale: `08-Messenger-Decision-Register.md`.

Messenger is implemented as one shared Messaging Core inside NBOS, exposed through two separate product surfaces: Internal Messenger and Client Messenger.

The target remains a modular monolith inside NBOS. Messenger does **not** need a new microservice merely because it integrates with external providers.

```text
modules/
  messaging/
    core/
    internal/
    client/
    connectors/
      whatsapp/
      meta/
```

---

## 1. Runtime flow

Canonical command flow:

```text
Client UI
  -> REST command
  -> authorization / domain validation
  -> DB transaction
  -> durable Message / state / reference
  -> event/outbox
  -> WebSocket broadcast
  -> Queue jobs
       -> external provider send
       -> notifications
       -> indexing
       -> file processing
```

Database is the only source of truth.

WebSocket/Socket.IO is used only for:

- live message delivery;
- unread counter updates;
- read updates;
- typing;
- presence;
- delivery-status refresh;
- optimistic UI confirmation.

If realtime is unavailable, REST history/pagination must reconstruct the correct state.

---

## 2. Shared core vs product surfaces

Shared core may provide:

- Conversation persistence;
- Message persistence;
- participants;
- references/replies/reactions;
- read state;
- attachments links;
- search;
- realtime;
- collections infrastructure;
- audit primitives;
- external provider mapping.

Surface-specific modules own behavior such as:

### Internal Messenger

- Internal navigation;
- Product/Work Space/Task/Deal/Group/Direct views;
- Internal Collections;
- internal composer/actions.

### Client Messenger

- Inbox/Sales/Clients navigation;
- external channel context;
- locked composer;
- external read/send permissions;
- delivery status;
- Product communication bindings;
- attention routing;
- client AI controls;
- Client Collections.

A shared React component library is encouraged, but the UI must not collapse the two surfaces into one zone switch.

---

## 3. Domain model direction

Exact Prisma names may be adjusted during runtime reconciliation, but the target concepts are:

```text
Conversation
  id
  zone                 INTERNAL | CLIENT
  kind                 DIRECT | GROUP | ENTITY | EXTERNAL
  title
  status
  createdAt

ConversationParticipant
  conversationId
  employeeId? / participant identity
  role
  read/send capabilities where applicable
  lastReadMessageId / cursor
  mutedUntil

ConversationLink
  conversationId
  entityType           PROJECT | PRODUCT | WORKSPACE | DEAL | TASK | TICKET | CLIENT | ...
  entityId

Message
  id
  conversationId
  sender identity
  direction            INTERNAL | INBOUND | OUTBOUND
  body
  state
  replyToMessageId?
  createdAt

MessageReference
  sourceConversationId
  sourceMessageId
  targetMessageId? / target entity relation
  purpose               FORWARD | TASK_SOURCE | TICKET_SOURCE | DEAL_SOURCE | ...

ExternalChannelAccount
  id
  provider              WHATSAPP | INSTAGRAM | FACEBOOK | ...
  externalAccountId
  status

ExternalConversationMapping
  conversationId
  channelAccountId
  externalConversationId

MessageExternalRef
  messageId
  provider
  externalMessageId

ProductCommunicationBinding
  productId
  purpose               WORK | FINANCE
  conversationId
  status

ConversationCollection
ConversationCollectionItem
UserConversationSetting
Attachment / Drive references
Reaction
ProviderEvent
AuditEvent / audit references
```

The implementation may reuse existing schema if it satisfies these contracts. The canon does not require renaming working tables purely for naming consistency.

---

## 4. Core invariants

### Zone invariant

A `Conversation.zone` never changes between INTERNAL and CLIENT after creation.

Internal send APIs cannot target an External provider mapping.

### Collection invariant

A collection belongs to one Messenger surface/zone and may contain only conversations from that zone.

### Product/Work Space invariant

Product and its mandatory Connected Work Space point to the same internal work Conversation.

### Task invariant

Task Discussion uses a Messaging Core Conversation. There is no second canonical human comments store.

### Product communication invariant

For v1:

- one Product has exactly one active canonical `WORK` external destination;
- zero or one explicit `FINANCE` destination;
- one External Conversation may serve multiple Products;
- missing FINANCE binding resolves to WORK.

### Support invariant

Support Ticket never becomes the canonical client conversation. It links to source Client messages and may have internal work/discussion only.

---

## 5. REST command boundary

REST/API commands handle durable mutations, including:

- list/open conversations;
- load history;
- send message;
- mark read;
- react/reply;
- manage participants;
- manage collections;
- forward/reference message(s);
- create/link business actions from message context;
- Client composer unlock/session authorization where implemented;
- manage Product communication bindings;
- manage attention assignment/routing override;
- search.

External send must re-check authorization at command execution time even if the UI is currently unlocked.

---

## 6. Realtime events

Expected event families:

| Event                    | Purpose                                   |
| ------------------------ | ----------------------------------------- |
| `message.created`        | New durable message                       |
| `message.updated`        | Edit/redaction update                     |
| `message.deleted`        | Soft delete/redaction                     |
| `conversation.updated`   | Title/state/link/participant changes      |
| `read.updated`           | Read cursor/state                         |
| `typing.started/stopped` | Typing indicator                          |
| `presence.updated`       | Employee presence                         |
| `delivery.updated`       | External delivery/read result             |
| `attention.updated`      | Client routing/assignment changed         |
| `binding.updated`        | Product communication destination changed |

Event names are implementation details; semantics are canonical.

---

## 7. Durable external send

External channels must not use fire-and-forget HTTP send directly from the UI/API request.

Target flow:

```text
send command
  -> validate Client conversation + external SEND permission
  -> persist outbound Message + delivery operation/outbox atomically
  -> enqueue/reconcile durable operation
  -> worker revalidates target/channel state where required
  -> adapter/Gateway submission
  -> provider result/event reconciliation
```

Required external states include at least:

```text
queued
sending
sent
delivered
read
failed
outcome_unknown
cancelled
```

`outcome_unknown` prevents unsafe blind retry after provider submission when the outcome cannot be proven.

---

## 8. External Channel Adapter

Business modules do not call WAHA/Meta/provider SDKs directly.

Logical adapter capabilities may include:

- send message/media;
- receive/normalize webhook events;
- map/sync conversation and participants;
- process delivery/ack/read events;
- fetch/download attachment;
- session/health operations where appropriate.

Provider-specific behavior remains behind connector/Gateway boundaries.

---

## 9. WhatsApp boundary

Canonical WhatsApp path:

```text
Messaging Core
  -> WhatsApp connector/adapter
    -> WhatsApp Gateway
      -> WAHA
        -> WhatsApp
```

Gateway remains a standalone transport service.

### Inbound

```text
WhatsApp
  -> WAHA
  -> Gateway normalizes/authenticates provider event
  -> authenticated NBOS webhook
  -> idempotent ProviderEvent
  -> resolve ExternalConversationMapping
  -> persist inbound Message
  -> update routing/unread
  -> realtime broadcast
```

### Outbound

```text
Employee/System
  -> Messaging Core permission/purpose resolution
  -> durable outbound Message/outbox
  -> queue worker
  -> Gateway
  -> WAHA
  -> WhatsApp
```

NBOS owns business context and message truth. Gateway owns WhatsApp session/provider transport.

---

## 10. Product Communication Binding resolver

Business modules request a purpose, not a provider group id.

```text
resolveClientDestination(productId, purpose)
```

Example FINANCE resolution:

```text
explicit active FINANCE binding
  -> use it
else
  -> canonical WORK binding
```

The resolved External Conversation is then mapped to its provider channel/account.

This resolver is the only normal path for Subscription/Invoice/Client Service automatic client messages.

---

## 11. Message references

When a Client message is shared internally or used to create Task/Ticket/Deal context, preserve a stable reference to the canonical source message.

Do not make copied text the authoritative source.

Reference metadata may include:

- source conversation/message;
- source channel;
- client/Product context;
- selected message bundle;
- attachment references;
- reason/purpose;
- actor/time.

Permissions are checked when opening the source. A reference does not grant source-conversation access.

---

## 12. Files

Messenger does not own physical files.

```text
upload/external media
  -> Drive File Asset
  -> Message attachment reference
```

Drive owns storage, access, preview, versioning, retention, cleanup and export.

External attachment processing must preserve provider/source metadata and fail safely if download/storage is unavailable.

---

## 13. Search

Search must respect the Internal/Client surface boundary and effective permissions.

Useful filters:

- text;
- participant;
- linked entity;
- Product/Project;
- date;
- file name;
- channel/provider;
- unread/mentions;
- Collection;
- Internal or Client surface.

A unified backend search service may exist, but results are rendered in the correct surface and never create an unsafe mixed composer context.

---

## 14. Draft and AI boundary

Customer reply Draft is separate from an outbound Message.

Generating/editing a draft does not enqueue delivery. An authorized send command converts the chosen draft revision into one durable outbound Message operation.

AI Platform may create drafts or operate under future approved policies, but AI permission does not imply external SEND permission.

Internal Messenger has no customer-facing operator mode.

---

## 15. Audit

At minimum audit high-risk Client Messenger events:

- external send actor and target;
- channel/account/provider;
- delivery failures/outcome unknown;
- Product communication binding create/change/replace;
- participant/access changes;
- external SEND grants/revokes;
- locked-composer activation if product/security policy chooses to audit it;
- routing/attention reassignment;
- AI enable/disable/takeover and AI-origin external actions where applicable.

Message bodies should not be duplicated into broad audit logs unless a specific legal/security requirement requires it; audit should reference canonical records.
