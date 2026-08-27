# Messenger Master Canon

> Status: **CANON — primary human-readable product + architecture truth**.
>
> Purpose: one document that a Product Owner, architect, developer or AI can read from top to bottom and understand **what NBOS Messenger must become, how it must behave, why its boundaries exist, and which shortcuts are forbidden**.
>
> This file consolidates the approved Messenger decisions without replacing their audit trail. `08-Messenger-Decision-Register.md` remains the granular Decision/Why ledger. If this Master Canon and the Decision Register ever conflict, that is a documentation defect: implementation must stop and the two documents must be reconciled explicitly rather than choosing whichever version is easier to code.

---

# 1. Product goal

NBOS Messenger is the communication layer that connects daily internal work and real client communication to the rest of NBOS without creating separate disconnected comment/chat systems in every module.

The target is deliberately balanced:

- **one reusable Messaging Core**, so messages, attachments, read state, references, search and realtime are not rebuilt repeatedly;
- **two clearly separate product surfaces**, because internal team communication and client-visible communication have different risk and UX;
- **strong links to Tasks, Products, Work Spaces, Deals, Support, Finance and CRM**, while those modules keep ownership of their own business data;
- **safe migration from existing runtime/data**, not a big-bang rewrite;
- **no premature microservice architecture** inside NBOS merely because Messenger has external providers.

The system should feel fast and simple in daily use, but the underlying architecture must remain strong enough to avoid duplicate message stores, accidental client sends, raw provider coupling and future migration traps.

---

# 2. The central architecture decision

There is **one Messaging Core** and **two separate Messenger products**:

```text
Messaging Core
  ├── Internal Messenger
  └── Client Messenger
```

This is not one Messenger with an `Internal | External` switch.

The two surfaces have:

- separate entry points;
- separate navigation;
- separate visual identity;
- separate Collections;
- different composer behavior;
- different permission/safety rules;
- different contextual actions;
- different AI/customer-facing controls.

They may share backend models and React primitives, but they must never feel like one mixed send context.

## Why

The biggest product risk is not technical duplication; it is a user believing they are writing internally while actually sending to a client. One backend with two explicit surfaces gives both architectural reuse and operational safety.

**Decision IDs:** `M-BOUNDARY-01`, `M-BOUNDARY-02`.

---

# 3. What belongs to Messaging Core

Messaging Core owns shared communication primitives:

- canonical conversations;
- canonical messages;
- participants/membership;
- read state;
- replies/reactions/thread primitives;
- message references;
- attachments as Drive references;
- realtime delivery;
- search/indexing hooks;
- Collections infrastructure;
- external provider mappings;
- external delivery state/outbox;
- provider event idempotency;
- audit references for high-risk operations.

It does **not** become CRM, Tasks, Support, Finance, Drive, Mail or Notifications.

Exact Prisma model names are implementation details. The domain contracts are canonical; unnecessary renaming is not a goal.

**Decision IDs:** `M-CORE-01`, `M-FILES-01`, `M-MAIL-01`.

---

# 4. Internal Messenger — purpose

Internal Messenger is for Neetrino-only communication.

Nothing sent from Internal Messenger may be delivered to WhatsApp, Instagram, Facebook or another external client provider.

It replaces fragmented internal chats/comments with one daily work surface while keeping entity context close to the conversation.

Primary navigation:

```text
All
Products
Tasks
Deals
Work Spaces
Groups
Direct
Collections
```

There is intentionally no mandatory `Projects` top-level chat hierarchy.

**Decision IDs:** `M-INTERNAL-01`, `M-INTERNAL-02`, `M-PROJECT-01`.

---

# 5. Internal `All` — the daily inbox

`All` is a flat recent-activity inbox over every Internal conversation the Employee may access.

It is optimized for the question:

> What communication currently needs my attention?

It should support:

- recent-activity ordering;
- unread state;
- mentions;
- search;
- pin/mute/archive preferences;
- compact entity/context badges.

Example list:

```text
Website · Degusto                 Product
Fix payment callback              Task
Marketing                         Group
Extension #14                     Deal
CEO planning                      Work Space
Ruben                             Direct
```

`All` must **not** become:

```text
Project
  -> Product
      -> Work Space
          -> Task
              -> Chat
```

That hierarchy is useful as context, but too slow for a daily communication inbox.

---

# 6. Product, Connected Work Space and Project communication

## Product + Connected Work Space

A Product and its mandatory Connected Work Space use **one and the same Internal Conversation**.

```text
Product
  ↕
Connected Work Space
  ↕
ONE Internal Work Conversation
```

Different UI surfaces may call it differently:

- Product page: `Chat`;
- Work Space: `Discussion`;
- Messenger: Product/work conversation.

All resolve to the same `conversationId`.

The conversation normally survives Development -> QA -> Transfer -> Maintenance and Extensions around that Product.

Creating a second Product Chat plus Work Space Chat is forbidden because it splits one delivery history into two sources of truth.

## Standalone Work Space

A standalone operational Work Space may have its own Internal Conversation, for example:

- Marketing strategy;
- Finance operations;
- Management/CEO planning;
- another long-running non-Product work context.

It does not require fake Product ownership.

## Project

Project is primarily an aggregate/navigation context.

A Project page may show:

```text
Project
  General        # optional/lazy
  Products
  Deals
  Active Tasks
```

`Project General` is allowed when people actually need a cross-Product conversation, but it is not auto-created for every Project.

**Decision IDs:** `M-PROJECT-01`, `M-WORK-01`, `M-WORK-02`.

---

# 7. Internal Deal discussion

An Internal Deal conversation is Neetrino-only commercial discussion:

- offer preparation;
- negotiation strategy;
- sales questions;
- handoff notes;
- internal commercial context.

It is not the same object as the real client Sales conversation in Client Messenger.

After Deal Won, the internal Deal conversation remains historical commercial context. Delivery communication moves through the Product/Connected Work Space conversation.

A Deal and a Client Sales conversation may link to the same business entities without sharing one composer or one message stream.

---

# 8. Task Discussion — one message engine, two information layers

Task Card remains the main execution surface for a Task.

Recommended desktop shape:

```text
Task execution / properties        Discussion / Activity
--------------------------------   --------------------------------
status / priority                  human messages
assignee / dates                   replies / mentions
checklists                         attachments
links / subtasks                   source references
completion rules                   system activity
```

## Human Discussion

Human Task Discussion uses Messaging Core.

- no permanent independent Task comments engine;
- lazy-create the Task Conversation only when discussion actually begins;
- Task Card and Messenger `Tasks` view open the same messages;
- closing a Task does not delete discussion history;
- inactive closed Task conversations may disappear from active inboxes while remaining reachable through Task/search/history.

## Activity Feed

Task Activity remains Task-owned system history:

- status changes;
- assignment changes;
- deadlines;
- checklist events;
- automation events;
- completion/reopen actions.

Human messages are not converted to fake Activity rows, and Activity rows are not converted to fake human messages.

This gives one consistent message engine without destroying the important semantic difference between conversation and audit/activity.

**Decision IDs:** `M-TASK-01`, `M-TASK-02`.

---

# 9. Internal Groups and Direct Messages

## Groups

Groups are ordinary internal team conversations not owned by one business entity.

Examples:

- Development;
- Marketing;
- Management;
- Office;
- Photos;
- temporary working groups.

Group membership/access is explicit. Entity links may provide context, but linking a Group to a Product does not turn it into the canonical Product conversation.

## Direct

Direct conversations are private Employee-to-Employee chats according to platform policy.

They use the common capabilities where applicable:

- attachments;
- replies/reactions;
- read state;
- search;
- Create Task;
- pin/mute/archive.

---

# 10. Collections and Favorites

Collections are the **single custom grouping mechanism** for conversations.

Each surface has its own Collections.

```text
Internal Collections
  Favorites
  My Active Products
  CEO Watch
  Development Priority

Client Collections
  Favorites
  Premium Clients
  Finance Control
  High Attention
```

Rules:

- `Favorites` is a built-in PERSONAL Collection behavior in each surface;
- custom Collections may be `PERSONAL` or `SHARED`;
- one conversation may belong to several Collections;
- Collection membership never moves or duplicates the canonical conversation;
- adding a conversation to a SHARED Collection does **not** grant access;
- users see only Collection items they are already authorized to open;
- Internal Collections contain only Internal conversations;
- Client Collections contain only Client conversations.

Do not create separate competing folder + label + favorite systems unless a future proven requirement needs another taxonomy.

**Decision ID:** `M-COLLECTIONS-01`.

---

# 11. Message actions and references

Where permissions allow, one or multiple messages can be selected.

Common actions:

- Reply;
- Create Task;
- Share/Forward reference internally;
- Copy/Open source context.

Client Messenger additionally may expose:

- Create/link Support Ticket;
- Create/link Deal / Extension Deal;
- Invite Employee;
- Open Product/Client/CRM context.

## References, not copied truth

When a message becomes work context, the source Message remains canonical.

```text
Canonical Message
  -> Task source reference
  -> Ticket source reference
  -> Deal source reference
  -> Internal forwarded reference
```

A reference card may show a preview and `Open original`, but it does not create an independent second copy of the source message as truth.

Opening the original still requires permission to the source conversation. A reference does not grant that permission.

## Threads

Replies/threads are supported primitives, but threads are optional.

`Discuss internally`, forwarding or creating work from a message must not automatically create a new thread or new Conversation.

**Decision IDs:** `M-MESSAGE-01`, `M-MESSAGE-02`, `M-MESSAGE-03`.

---

# 12. Create Task from a message

Create Task is a real Task creation flow.

Selected messages provide source context/references; the Employee still defines:

- title;
- description;
- assignee;
- priority/dates when relevant;
- primary context;
- additional entity links.

Do not blindly turn message text into the final Task title/body.

This is particularly important when one Client conversation is shared by multiple Products: the system must not guess one Product without explicit context.

Future `Create Task with AI` may propose structured Task fields from selected/recent authorized context, but a human confirms the result.

---

# 13. Client Messenger — purpose and navigation

Client Messenger is the external communication product surface.

Anything sent here may become visible to a client.

Primary navigation:

```text
Inbox
Sales
Clients
Collections
```

## Inbox

Attention-oriented view over Client conversations.

Useful filters include:

- Unread;
- Needs response;
- Assigned to me/team;
- provider/channel;
- lifecycle/routing;
- FINANCE context where useful.

Inbox is a view over canonical conversations, not another store.

## Sales

Pre-sale external conversations around Leads/Deals, including WhatsApp/Instagram/Facebook where connected.

## Clients

Existing-client conversations, primarily Product client communication.

`Sales` and `Clients` are **views/lifecycle classifications**, not reasons to copy message history. If the same external conversation continues after a Lead/Deal becomes a Client, the canonical conversation may remain the same and appear in the appropriate new view/context. A Product WORK group created for delivery can still be a separate conversation when the business intentionally creates/uses a separate group.

**Decision IDs:** `M-CLIENT-01`, `M-CLIENT-02`.

---

# 14. Client Messenger visual design and safety

Internal and Client Messenger may share UI primitives, but a user must recognize the current surface instantly.

## Recommended desktop layout

Internal:

```text
Internal navigation
Left: conversation list
Center: timeline
Right: optional entity/context panel
```

Client:

```text
Client navigation
Left: attention conversation list
Center: client timeline
Right: client/product/channel/context panel
```

## Client visual identity

Client Messenger should use a clear combination of:

- distinct accent/background treatment;
- external/client/provider iconography;
- visible Client/company/contact context;
- Product/Project context where known;
- channel/provider label;
- delivery state;
- attention owner/team;
- WORK/FINANCE contextual badges when relevant;
- AI/operator state where enabled;
- a visibly different composer safety state.

Internal Messenger should remain visually lighter and should not constantly show external-send warnings.

The goal is **clear mode recognition**, not decorative complexity.

---

# 15. Locked Client composer

A Client conversation opens read-only from a sending perspective.

Example locked state:

```text
CLIENT CONVERSATION
WhatsApp · Client / Product context

[ Reply to client ]
```

An Employee with Client SEND permission explicitly activates `Reply to client` for the current conversation working session.

Unlocked state must remain unmistakable:

```text
CLIENT VISIBLE
Sending via WhatsApp
Client / Product context

Type a message...
```

Rules:

- switching/leaving the conversation re-locks the composer;
- optional inactivity re-lock may be added later;
- READ and SEND are separate permissions;
- read-only users never receive a usable send composer;
- server-side SEND authorization is checked again when the message is actually sent;
- there is no `Internal | Public` toggle in the composer;
- actions such as Create Task/Forward internally do not require unlocking external send.

This is intentionally lighter than a confirmation dialog before every message, but much safer than an always-active external composer.

**Decision IDs:** `M-SECURITY-01`, `M-SECURITY-02`.

---

# 16. Product client communication lifecycle

A Product WORK client conversation may begin around delivery and continue through:

```text
Development
  -> QA
  -> Transfer
  -> Maintenance
```

The same conversation can remain active for years.

Lifecycle changes may change:

- list filters;
- attention routing;
- participant recommendations;
- automation context.

Lifecycle does **not** automatically create a new conversation.

An Extension normally continues to use the parent Product's existing WORK client communication rather than creating a new physical group just because a new Deal/Extension exists.

**Decision ID:** `M-CLIENT-02`.

---

# 17. External Conversation and Product Communication Bindings

A physical WhatsApp group is an External/Client Conversation with provider mapping.

It is not a raw field owned rigidly by one Product.

Products connect to it through purpose-based bindings.

Initial purposes:

```text
WORK
FINANCE
```

Conceptual model:

```text
Product
  -> ProductCommunicationBinding(product, purpose)
      -> Client Conversation
          -> ExternalConversationMapping
              -> WhatsApp account + group/chat id
```

## V1 rules

For a Product whose client communication has been configured:

- exactly one active canonical `WORK` destination;
- zero or one explicit `FINANCE` destination;
- if FINANCE is not explicit, `FINANCE -> WORK`;
- one External Conversation may serve several Products;
- adding a Product binding does not grant Employee access;
- physical provider identity remains unique at the provider mapping layer.

A Product row does **not** automatically create a WhatsApp group. During initial setup, failed provisioning or migration there may temporarily be no active WORK binding; that is an operational state to resolve, not permission for multiple competing WORK destinations.

## Shared conversations

Valid example:

```text
Website
  WORK    -> Client Group A
  FINANCE -> Finance Group F

SEO
  WORK    -> Client Group A
  FINANCE -> Finance Group F

CRM
  WORK    -> Client Group C
  FINANCE -> Finance Group F
```

A conversation linked to several Products must display context accordingly. The UI must not falsely pretend one shared conversation belongs exclusively to a single Product.

Purpose is a Product-binding context, not necessarily a permanent global property of the physical conversation. UI badges should therefore be derived from the current Product/business context and may show multiple linked Products where relevant.

**Decision IDs:** `M-WA-01`, `M-WA-02`, `M-WA-03`, `M-WA-05`.

---

# 18. Product Client Communication Settings

Product Settings should show business destinations, not one raw WhatsApp id.

Recommended simple UI:

```text
Client Communication

WORK
  current destination / status
  [Create new group]
  [Select existing]

FINANCE
  [Use WORK destination]       # default
  explicit destination/status if configured
  [Create new group]
  [Select existing]
```

Existing useful runtime UX should be reused/adapted:

- search existing groups;
- select an existing group;
- paste/bind group id where operationally required;
- explicit replace confirmation;
- replacing a Product binding does not delete the old physical WhatsApp group.

The common one-group case must stay simple. Enterprise flexibility belongs underneath it rather than forcing every user through complex WORK/FINANCE setup.

---

# 19. Deal Won and communication handoff

For Product/Outsource Deal Won, Product WORK communication should be resolved consciously.

Allowed paths:

```text
Create new WORK WhatsApp group
or
Select/bind an existing allowed External Conversation
```

FINANCE does not need to complicate the normal Deal Won flow. It can be configured later.

Important behavior:

- WhatsApp/Gateway failure does not roll back a successfully completed Deal/Product business transition;
- failure/pending/outcome-unknown state is recorded and visible;
- retry/reconciliation is explicit and idempotent;
- Extension does not automatically create another client group;
- binding existing group must not duplicate invitations or physical groups.

**Decision ID:** `M-WA-04`.

---

# 20. Finance communication

Finance owns financial business truth:

- Invoice;
- Payment;
- Subscription;
- Client Service;
- reminder schedule/business rules;
- amounts/taxes/dates/language/notification enablement.

Messenger owns destination resolution and communication history.

Finance/Subscription/Client Service code asks:

```text
resolveClientDestination(productId, FINANCE)
```

Resolver:

```text
explicit FINANCE binding?
  YES -> FINANCE Client Conversation
  NO  -> Product WORK Client Conversation
```

All approved automatic payment-related reminders use `FINANCE` purpose:

- subscription reminders;
- invoice/payment reminders;
- hosting/domain reminders;
- maintenance/client-service payment reminders;
- other approved money/payment reminders.

Finance code must not call WAHA directly and must not depend on raw Product `groupChatId` after cutover.

## Automatic reminder vs manual Finance chat

They are different operations.

```text
Automatic reminder
  = Finance business rule -> system outbound FINANCE message

Manual Finance conversation
  = Employee opens Client conversation -> SEND permission -> Reply to client -> message
```

If FINANCE falls back to WORK, the reminder and client reply remain in WORK. The system does not create a fake second Finance history.

If an explicit FINANCE conversation exists, reminders and replies remain there.

A dedicated FINANCE conversation is a full Client conversation, not just a notification sink.

---

# 21. Dedicated FINANCE access defaults

A dedicated FINANCE conversation exists specifically to separate financial discussion from unnecessary operational participants.

Default Neetrino-side business template:

- Owner;
- CEO;
- Finance Director;
- relevant Seller;
- relevant Product PM.

Seller and PM are resolved from business context, not hard-coded globally.

Developers and other Product employees are not automatically added.

This template still does not bypass the actual permissions model.

Physical WhatsApp participants and NBOS Employee READ/SEND authorization are separate security layers.

---

# 22. Support — case management, not another client chat

Support Ticket is an internal case-management entity.

It owns:

- category;
- priority;
- SLA;
- coverage;
- assignee/owner;
- linked Tasks/work;
- linked Extension Deal when relevant;
- resolution;
- Activity/history;
- references to important Client messages.

Canonical flow:

```text
Client message
  -> Create/link Support Ticket if case tracking is needed
  -> triage / SLA / coverage / ownership
  -> execution through Tasks / Work Space / CRM / Projects Hub
  -> client response through the original Client Messenger conversation
```

Ticket may have internal notes/discussion if useful, but that discussion is internal-only.

There is no Ticket composer with `Public | Internal` modes.

Support is also not a separate top-level Client Messenger universe.

**Decision ID:** `M-SUPPORT-01`.

---

# 23. Attention routing is not access control

These are two separate concepts.

Access answers:

> Who may read or send?

Attention routing answers:

> Who currently owns the need to respond/triage?

Default routing:

```text
Delivery WORK       -> Product PM
Maintenance WORK    -> Support Intake queue
FINANCE             -> Finance/authorized queue
```

Routing can be manually reassigned or overridden for a Product without changing the conversation identity.

Do not hard-code one permanent employee as client owner. Roles/queues/business assignments evolve; the conversation should survive them.

UI should expose attention ownership in Client Inbox and conversation context.

**Decision ID:** `M-ROUTING-01`.

---

# 24. Employee access vs physical provider participants

Do not equate:

```text
WhatsApp group participant
```

with:

```text
NBOS Employee allowed to READ/SEND in Client Messenger
```

They may overlap, but they are not the same authorization system.

Effective Messenger access may combine:

- module RBAC;
- Project/Product/Task/Work Space/Deal participation where appropriate;
- conversation membership/invite;
- manual grant;
- role/personal policy;
- management/owner rules from platform canon;
- separate Client READ and SEND permission.

Critical invariants:

- Product binding does not grant access;
- Shared Collection does not grant access;
- attention assignment does not automatically grant access;
- Client READ does not imply Client SEND;
- UI state never replaces server authorization.

---

# 25. WhatsApp Gateway boundary

The existing `neetrino/whatsapp-gateway` remains the WhatsApp transport/session boundary.

Do not build a second gateway inside NBOS.

Canonical path:

```text
NBOS Messaging Core
  -> WhatsApp connector/adapter
    -> WhatsApp Gateway
      -> WAHA
        -> WhatsApp
```

Inbound:

```text
WhatsApp
  -> WAHA
  -> Gateway normalized/authenticated event
  -> NBOS webhook
  -> idempotent provider event
  -> resolve Client Conversation
  -> persist inbound Message
  -> unread/routing/realtime
```

Outbound:

```text
Employee/System
  -> Messaging Core authorization/purpose resolution
  -> durable outbound Message/outbox
  -> queue/worker
  -> Gateway
  -> WAHA
  -> WhatsApp
```

## Gateway owns

- WhatsApp accounts/sessions;
- WAHA-specific transport details;
- QR/session lifecycle;
- provider-facing group operations;
- provider ids/status/health;
- normalized inbound delivery foundation;
- transport idempotency.

## NBOS owns

- canonical message history;
- Product bindings;
- Employee permissions;
- business context;
- CRM/Support/Finance links;
- attention routing;
- Client UI;
- AI policy/context;
- business audit.

**Decision ID:** `M-WHATSAPP-01`.

---

# 26. Durable external send and provider uncertainty

External send must never be a fire-and-forget browser/API call directly to WAHA.

Target flow:

```text
send command
  -> validate Client Conversation
  -> validate SEND
  -> persist outbound Message + delivery operation/outbox
  -> durable queue/reconciliation
  -> Gateway submission
  -> provider result/event reconciliation
```

Expected delivery states include conceptually:

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

`OUTCOME_UNKNOWN` is essential. If the provider may have accepted a message/group creation but NBOS cannot prove the outcome, the system must not blindly retry and create/send a duplicate.

Database remains message truth; realtime is transport only.

**Decision ID:** `M-CORE-01`.

---

# 27. Realtime and offline correctness

REST/domain commands perform durable mutations.

WebSocket/Socket.IO handles live UX:

- new message delivery;
- unread/read updates;
- typing;
- presence;
- delivery updates;
- attention/binding refresh;
- optimistic confirmation.

If realtime is unavailable, loading history again must reconstruct correct durable state.

A WebSocket event is never the only copy of a message.

---

# 28. Files and attachments

Messenger does not create a second file-storage domain.

All attachments are Drive File Assets or equivalent Drive-owned assets.

```text
Message
  -> attachment reference
      -> Drive File Asset
```

Drive owns:

- physical storage;
- authorization;
- preview;
- retention;
- versioning;
- cleanup/export.

Message references do not duplicate files and do not bypass Drive authorization.

External provider attachments should preserve source/provider metadata and fail safely if download/storage is unavailable.

**Decision ID:** `M-FILES-01`.

---

# 29. Search

Search may use one backend/indexing implementation, but authorization and product surfaces remain strict.

Useful filters can include:

- text;
- participant;
- Product/Project/entity;
- date;
- files;
- provider/channel;
- unread/mentions;
- Collection;
- Internal vs Client surface.

A result always opens in the correct Messenger surface. Search must never create an ambiguous shared composer context.

---

# 30. Mail and Notifications boundaries

## Mail

Mail remains its own communication module:

```text
Messenger: Conversation / Message
Mail:      EmailThread / EmailMessage
```

Email protocol/threading/sync semantics are different enough that merging Mail persistence into chat would be harmful.

Messenger and Mail may link to the same Deal/Ticket/Project without becoming one store.

**Decision ID:** `M-MAIL-01`.

## Notifications

Notifications decides how/when Employees are alerted.

Employee push/in-app/Telegram notification delivery is not automatically a Messenger conversation.

If a business automation sends a client-visible WhatsApp message, that message must still be persisted as canonical Client Messenger history; Notifications/Finance must not create a hidden parallel external-send history.

---

# 31. Telegram target

Permanent Telegram <-> NBOS Internal Messenger chat synchronization is **not** the target.

If historical Telegram work groups are migrated:

```text
selected Telegram groups
  -> controlled one-time import
  -> NBOS Internal Messenger
  -> NBOS Web + Mobile becomes primary internal messenger
```

Telegram may remain separately for Employee notifications.

This avoids two permanent sources of chat truth and two permission systems.

**Decision ID:** `M-TELEGRAM-01`.

---

# 32. AI boundary

## Client Messenger

Client Messenger may support controlled AI functionality under AI Platform policy, for example:

- draft reply;
- context analysis;
- future operator/automation mode;
- enable/disable/pause/manual takeover state;
- Create Task with AI proposal.

Important safety rules:

- generating a Draft is not the same as sending a Message;
- AI draft/generation permission does not imply Client SEND;
- exact Client Conversation/channel/Product scope must be known;
- a shared conversation linked to multiple Products must not make AI silently guess Product-specific context;
- when a human takes over an enabled operator flow, the AI operator must yield/pause according to the approved AI control policy rather than competing with the Employee.

Autonomous customer-facing AI sending requires its own approved AI Platform execution/approval policy. Messenger architecture does not silently grant it merely because the conversation exists.

## Internal Messenger

Internal Messenger does not contain a customer-facing AI reply operator.

Explicit generic AI helpers may exist later, but they do not silently impersonate Employees in team chat.

**Decision ID:** `M-AI-01`.

---

# 33. Mobile product rule

Mobile preserves the same two-surface separation.

- Internal Messenger is a first-class internal work surface;
- Client Messenger is a separate external communication surface;
- Client composer remains locked/safe;
- notification deep links open the correct surface;
- no notification should land the user in an ambiguous mixed composer.

Mobile may use a different compact layout, but not a weaker security/product boundary.

---

# 34. Architecture shape — keep it strong, not overbuilt

Messenger stays inside the NBOS modular monolith.

A reasonable module direction is conceptually:

```text
messaging/
  core/
  internal/
  client/
  connectors/
    whatsapp/
    meta/
```

This gives domain separation without inventing a new distributed system.

Use Postgres/database durability, queue/outbox for external side effects, and adapters for providers.

A separate microservice is justified only if a future operational requirement proves it necessary; it is not required by the current product architecture.

---

# 35. Canonical domain concepts

Exact names may differ, but the final runtime needs concepts equivalent to:

```text
Conversation
ConversationParticipant / membership
Message
MessageReadState
ConversationLink
MessageReference
UserConversationSetting
ConversationCollection + items
ExternalChannelAccount
ExternalConversationMapping
MessageExternalRef / provider identity
ProviderEvent
External delivery/outbox operation
ProductCommunicationBinding
Drive attachment references
Audit references
```

Key semantic rules matter more than table naming.

---

# 36. Migration philosophy

Existing production/runtime data is valuable even when the current model is no longer the target architecture.

Rule:

```text
Canon wins for target behavior.
Existing runtime/data wins for migration safety.
```

Default migration pattern:

```text
EXPAND
-> INVENTORY
-> IDEMPOTENT BACKFILL/MAP
-> VERIFY PARITY
-> COMPATIBILITY WINDOW
-> CUT OVER WRITES
-> CUT OVER READS
-> OBSERVE
-> FREEZE OLD WRITES
-> DELETE LATER
```

No drop-first migrations for production-relevant communication data.

---

# 37. Existing runtime that must be reconciled safely

The current repository contains multiple Messenger-era structures and working integrations.

High-risk areas include:

## Active legacy Internal Messenger

Current active normal path uses existing Channel/DM runtime such as:

```text
MessengerChannel / MessengerChannelMessage
MessengerDirectThread / MessengerDirectMessage
```

This working history cannot simply be deleted.

## Additive Unified Messenger generation

The schema also contains a newer additive Unified family such as:

```text
MessengerConversation
MessengerConversationParticipant
MessengerConversationLink
MessengerMessage
MessengerMessageAttachment
MessengerConversationReadState
MessengerUserConversationSetting
```

It is not automatically the chosen target merely because it exists. Real database row counts/usage must be inventoried first.

Do not create a third permanent writable Messenger store alongside both generations.

## TaskDiscussionEntry

Current Task human discussion has real legacy persistence and must be migrated to Messaging Core without losing source identity/provenance.

Current schema fields must be inventoried from actual runtime; do not invent legacy reply/attachment/edit data that does not exist, but do preserve such related information if Slice 0 discovers it elsewhere.

`Task.chatId` must be investigated before reuse/removal.

## ProductWhatsAppGroupBinding

Current schema hard-enforces the old 1 Product <-> 1 physical group relationship with uniqueness constraints.

It must migrate additively to purpose bindings; existing relationships backfill as WORK.

Do not auto-create FINANCE rows for existing Products; FINANCE fallback to WORK preserves behavior.

---

# 38. Critical migration protections

## Task migration

Never delete `TaskDiscussionEntry` first.

Required outcome:

- human discussion moves to one canonical Task Conversation;
- authorship/body/timestamps/visibility/provenance are preserved;
- related files/replies/edit state are preserved **where actual runtime contains them**;
- backfill is idempotent;
- Task Card reads/writes the new path before legacy storage is retired;
- Activity remains separate.

## WhatsApp binding migration

Never recreate physical WhatsApp groups to simplify database migration.

Required outcome:

- each existing provider group maps to one External Conversation/provider mapping;
- every existing Product binding becomes WORK;
- provider/group identity is preserved;
- shared groups become allowed;
- Finance fallback remains deterministic;
- Deal Won/Product Settings move to the new resolver;
- old unique constraints are removed only after parity/cutover.

## Existing Channel/DM history

Choose/evolve one final canonical Messaging Core path deliberately.

Do not leave three writable stores and call that migration compatibility.

---

# 39. UX scope discipline — required vs optional

The product should not be overcomplicated simply because the architecture can support more.

## Required target behavior

- two separate Messenger surfaces;
- Internal navigation and flat All inbox;
- Product/Work Space shared conversation;
- Task Discussion on Messaging Core;
- Groups/Direct;
- Internal and Client Collections;
- Client Inbox/Sales/Clients;
- locked Client composer;
- READ/SEND separation;
- references/Create Task;
- Client Support/Deal actions;
- WhatsApp inbound/outbound through Gateway;
- WORK/FINANCE binding resolver;
- Finance fallback;
- safe attention routing;
- durable external delivery;
- search/read/unread/realtime basics;
- Drive attachment integration;
- migration and negative/security tests.

## Useful but not required to complicate first release

- mandatory threads everywhere;
- auto-created Project General rooms;
- advanced per-service communication purposes beyond WORK/FINANCE;
- confirmation before every single Client message;
- separate Finance or Support Messenger products;
- automatic FINANCE group for every Product;
- permanent Telegram bridge;
- unnecessary Messenger microservice;
- autonomous Client AI sending without separately approved policy;
- elaborate new label/folder taxonomies beyond Collections.

This is the intended balance: **complete core workflows, strong safety and architecture, minimal unnecessary product layers**.

---

# 40. Explicit forbidden shortcuts

The following are not acceptable implementations of this Canon:

1. One Messenger screen with a casual `Internal | External` switch.
2. `Internal/Public` toggle inside Client composer.
3. External SEND inferred automatically from READ.
4. Product binding granting Employee Client access.
5. Shared Collection granting access.
6. Separate Product Chat and Connected Work Space Chat.
7. Permanent Task comments engine plus separate Messenger Task chat.
8. Copying source messages into Task/Ticket as independent truth instead of references.
9. Forcing a thread/new Conversation for every internal forward.
10. Project tree as the main `All` inbox.
11. Auto-creating Project General for every Project.
12. `1 Product = exactly 1 physical WhatsApp group` as final model.
13. Direct Finance/Subscription calls to raw `groupChatId`/WAHA after cutover.
14. Automatic creation of missing WhatsApp groups by scanning Products.
15. Separate canonical Support client chat/public composer.
16. Separate Finance Messenger universe.
17. Hard-coded permanent employee as client/support/finance owner.
18. Building another WhatsApp gateway inside NBOS.
19. Fire-and-forget external sends without durable Message/outbox state.
20. Blind retry after `OUTCOME_UNKNOWN`.
21. WebSocket as message source of truth.
22. Messenger-owned duplicate file storage.
23. Permanent Telegram <-> NBOS internal chat synchronization.
24. Reintroducing obsolete hierarchy merely because old tables exist.
25. Creating a third permanent Messenger persistence generation.
26. Drop-first migration of Task/Messenger/WhatsApp business data.
27. Recreating physical WhatsApp groups for schema convenience.
28. Letting Client AI infer a Product silently in a multi-Product shared conversation.
29. Treating UI composer unlock as authorization instead of checking SEND server-side.
30. Changing an approved product decision silently to fit legacy code.

---

# 41. End-to-end examples

## Example A — normal Product delivery

```text
Deal Won
  -> Product created/confirmed
  -> create/bind Product WORK Client Conversation
  -> Product Connected Work Space uses one Internal work Conversation
  -> Client uses WhatsApp WORK conversation
  -> team uses Internal Product/Work Space conversation
  -> Tasks use their own lazy Messaging Core discussions
```

Internal and client communication stay separate while linking to the same Product context.

## Example B — Website + SEO share one client group

```text
Website WORK -> Client Group A
SEO WORK     -> Client Group A
```

NBOS still has two Products.

The shared Client conversation may show both Product contexts.

This binding does not automatically grant all Website/SEO developers Client READ/SEND.

## Example C — enterprise finance separation

```text
Website WORK    -> Group A
SEO WORK        -> Group A
Website FINANCE -> Finance Group F
SEO FINANCE     -> Finance Group F
```

Automatic billing reminder for SEO resolves FINANCE -> Group F.

Operational developers are not automatically included in dedicated Finance access.

## Example D — common client without finance group

```text
Website WORK -> Group A
Website FINANCE -> no explicit binding
```

Payment reminder resolves FINANCE -> WORK -> Group A.

Client replies in Group A; no fake Finance conversation is created.

## Example E — support incident from WhatsApp

```text
Client writes in WORK conversation
  -> Support/PM creates Ticket from selected message(s)
  -> Ticket stores source references + SLA/case state
  -> Task created for technical work
  -> Task Discussion occurs internally
  -> final client reply sent through original WORK conversation
```

No duplicate public Support chat exists.

## Example F — client asks for new feature

```text
Client message
  -> Create Extension Deal
  -> internal Deal discussion remains internal
  -> Deal Won creates Extension
  -> delivery uses parent Product Work Space/internal conversation
  -> client normally stays in existing Product WORK conversation
```

A new Deal does not automatically mean a new physical WhatsApp group.

---

# 42. Decision coverage index

This Master Canon includes the approved Decision Register areas:

| Decision           | Covered here                                       |
| ------------------ | -------------------------------------------------- |
| `M-BOUNDARY-01`    | one Core, two product surfaces                     |
| `M-BOUNDARY-02`    | no cross-surface Collections                       |
| `M-INTERNAL-01`    | Internal navigation                                |
| `M-INTERNAL-02`    | flat `All` inbox                                   |
| `M-COLLECTIONS-01` | Favorites/PERSONAL/SHARED Collections              |
| `M-PROJECT-01`     | Project aggregate + optional General               |
| `M-WORK-01`        | Product + Connected Work Space one conversation    |
| `M-WORK-02`        | standalone Work Space conversation                 |
| `M-TASK-01`        | Task Discussion via Messaging Core                 |
| `M-TASK-02`        | Discussion vs Activity                             |
| `M-MESSAGE-01`     | message actions                                    |
| `M-MESSAGE-02`     | canonical references, not copied truth             |
| `M-MESSAGE-03`     | threads optional, not mandatory workflow           |
| `M-CLIENT-01`      | Inbox / Sales / Clients / Collections              |
| `M-CLIENT-02`      | long-lived Product client conversation             |
| `M-WA-01`          | purpose-based Product communication binding        |
| `M-WA-02`          | one external conversation may serve many Products  |
| `M-WA-03`          | deterministic WORK/FINANCE destinations            |
| `M-WA-04`          | Deal Won resolves WORK without mandatory FINANCE   |
| `M-WA-05`          | business resolver by Product + purpose             |
| `M-SECURITY-01`    | locked Client composer                             |
| `M-SECURITY-02`    | Client READ != SEND                                |
| `M-ROUTING-01`     | access != attention ownership                      |
| `M-SUPPORT-01`     | Support Ticket is case management, not client chat |
| `M-WHATSAPP-01`    | existing Gateway remains transport boundary        |
| `M-TELEGRAM-01`    | one-time migration, no permanent bridge            |
| `M-AI-01`          | Client AI boundary                                 |
| `M-CORE-01`        | DB truth + durable external send                   |
| `M-FILES-01`       | Drive owns attachments                             |
| `M-MAIL-01`        | Mail remains separate                              |

If a future approved Decision is added to `08-Messenger-Decision-Register.md`, this table and the relevant Master section must be updated in the same documentation change.

---

# 43. Implementation reading rule

For a human product/architecture review, **this file is the one document to read first and can be used to validate whether the intended Messenger is still intact**.

For implementation, the minimum canonical set remains:

1. this `00-Messenger-Master-Canon.md`;
2. `08-Messenger-Decision-Register.md` for exact Decision/Why history;
3. `10-Messenger-Runtime-Reconciliation.md` for current migration reality;
4. the current Slice in `11-Messenger-Rebuild-Implementation-Checklist.md`;
5. `12-Messenger-Rebuild-Execution-Strategy.md` for implementer/reviewer process.

Implementation status documents never override this product architecture.

---

# 44. Final product statement

The intended NBOS Messenger is **not** a generic Slack clone and **not** a WhatsApp wrapper.

It is an operational communication layer tightly integrated with NBOS work:

- Internal Messenger is where the team communicates around Products, Work Spaces, Tasks, Deals, Groups and Direct messages;
- Client Messenger is where the company communicates with clients safely across WhatsApp and later other providers;
- Tasks, Support, CRM and Finance turn messages into structured work without duplicating message truth;
- Product communication bindings make external destinations flexible without making normal use complicated;
- permissions, locked composer, durable delivery and explicit routing protect client communication;
- one Messaging Core prevents each module from inventing its own chat engine;
- migration preserves existing business history and physical WhatsApp resources.

That combination — simple daily UX, explicit client safety, strong shared core, purpose-based external communication and strict module boundaries — is the canonical target.
