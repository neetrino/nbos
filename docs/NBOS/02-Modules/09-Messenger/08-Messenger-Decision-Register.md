# Messenger Decision Register

> Status: **CANON — approved product decisions**.
>
> This file records not only what the Messenger architecture is, but **why** each significant decision was made. Future implementation or documentation work must not silently replace these decisions with a different model without explicitly revisiting the relevant decision and its rationale.

## How to use this register

- `Decision` is the canonical product rule.
- `Why` is the short reason the rule exists.
- `Avoided alternative` records the most important model we deliberately did not choose.
- Implementation documents should reference the decision id instead of redesigning the behavior independently.

---

## M-BOUNDARY-01 — One Messaging Core, two separate product surfaces

**Decision**

NBOS uses one shared Messaging Core, but exposes two separate product surfaces:

```text
Messaging Core
  ├── Internal Messenger
  └── Client Messenger
```

Internal and Client Messenger have different entry points, navigation, visual identity, permissions, composer behavior, collections and product actions. They do not show each other's conversations.

**Why**

Internal team communication and client-visible communication have different business risk. A shared backend reduces duplication, while separate surfaces materially reduce accidental external sends and allow different UX/security rules.

**Avoided alternative**

One Messenger screen with a simple `Internal | External` switch.

---

## M-BOUNDARY-02 — Collections never cross the Internal/Client boundary

**Decision**

Internal Collections may contain only Internal conversations. Client Collections may contain only Client conversations.

**Why**

Collections are navigation helpers. Allowing a collection to mix internal and client chats would visually weaken the safety boundary even if the underlying permissions remained correct.

**Avoided alternative**

A global collection containing both internal and client conversations.

---

## M-INTERNAL-01 — Internal Messenger navigation

**Decision**

Primary Internal Messenger navigation is:

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

`Projects` is primarily contextual navigation rather than a mandatory permanent top-level chat category.

**Why**

Daily work happens around Product, Task, Deal, Work Space, group and direct conversations. A permanent Project layer would add navigation depth without matching how the team communicates most of the time.

---

## M-INTERNAL-02 — `All` is a recent-activity inbox, not a hierarchy tree

**Decision**

`All` shows all accessible active Internal conversations sorted by recent activity, with filters such as `Unread`, `Mentions` and search.

**Why**

The user needs one place to see what currently requires attention. A Project → Product → Task tree is useful for context but too slow as the primary inbox.

**Avoided alternative**

A giant hierarchical `All` tree.

---

## M-COLLECTIONS-01 — Collections are the single custom grouping mechanism

**Decision**

Messenger has Collections instead of separate folder and label systems. `Favorites` is a built-in personal Collection. User-created Collections can be `PERSONAL` or `SHARED`.

A conversation may belong to multiple Collections. Adding a conversation to a shared Collection never grants access to that conversation.

**Why**

The main business need is to manually gather selected conversations into useful sets. Collections solve that directly without introducing a second taxonomy/filter system.

**Avoided alternative**

Separate Favorites + folders + labels as three parallel organization mechanisms.

---

## M-PROJECT-01 — Project is an aggregate communication context

**Decision**

A Project page may expose a contextual communication view such as General, Products, Deals and active Tasks, but Project is not the main mandatory chat unit for daily work. A Project General conversation is optional/lazy where the business actually needs one.

**Why**

A Project can contain several Products and Deals. Forcing a Project General chat for every Project creates empty or duplicate rooms; Project is more valuable as the aggregate navigator.

---

## M-WORK-01 — Product and its Connected Work Space share one conversation

**Decision**

A Product and its mandatory Connected Work Space use the **same underlying internal Conversation**.

```text
Product
  ↕
Connected Work Space
  ↕
ONE work conversation
```

Product UI may call it `Chat`; Work Space UI may call it `Discussion`; Messenger shows it as the Product/work conversation. All surfaces resolve to the same `conversationId`.

**Why**

Product and its default Work Space represent the same delivery work context. Two chats would split decisions and history between parallel conversations.

**Avoided alternative**

Separate Product Chat and Connected Work Space Chat.

---

## M-WORK-02 — Standalone Work Space gets its own conversation

**Decision**

A standalone operational Work Space may have its own Work Space conversation.

**Why**

Standalone Work Spaces such as Marketing, Finance operations or CEO planning have no Product conversation to reuse and can be long-lived working contexts themselves.

---

## M-TASK-01 — Task Discussion uses Messaging Core, not a second comments engine

**Decision**

Task human discussion is a normal Messaging Core `Conversation/Message` stream embedded into the Task card. It is not stored in a separate `task_discussion_entries` comments system.

Task conversation is lazy-created when discussion actually begins. Closed inactive task conversations disappear from daily active lists but remain reachable from the Task and search/history.

**Why**

Users should not have one discussion implementation for Tasks and another for Product/Work Space/Deal. One message engine gives consistent attachments, mentions, read state, search, references and future mobile behavior.

**Avoided alternative**

Task-owned comment storage plus a separate Messenger Task Chat.

---

## M-TASK-02 — Task Discussion and Task Activity are different layers

**Decision**

Task Card may show both:

- human `Discussion` from Messaging Core;
- system `Activity Feed` for status/assignment/deadline/checklist/automation events.

They may be presented together in UI, but they are different domain records.

**Why**

Human conversation and immutable system history have different semantics and retention/audit requirements.

---

## M-MESSAGE-01 — Core message actions are universal

**Decision**

Where permissions allow, a user can act on one or multiple messages from Internal or Client Messenger, including:

- reply;
- share/forward as a reference into an allowed internal conversation;
- create Task;
- copy/open source link.

Client messages additionally may expose business actions such as create Support Ticket, create/link Deal and invite an Employee to the Client conversation.

**Why**

A message is often the origin of real work. The workflow should begin from the message instead of forcing users to manually recreate its context elsewhere.

---

## M-MESSAGE-02 — Business actions reference canonical messages instead of copying them

**Decision**

Task/Ticket/Deal/Internal discussion references source messages through stable message references. The system should not duplicate the same message body into multiple independent stores as the source of truth.

**Why**

References preserve provenance, attachments and the ability to open the original message without creating divergent copies.

---

## M-MESSAGE-03 — Threads are supported but never mandatory workflow

**Decision**

The message model may support replies/thread roots, but `Discuss internally` or forwarding a client message does not automatically create a separate thread or Conversation.

**Why**

Most internal discussions around a client message are only a few messages. Mandatory threads would add structure and UI overhead where normal conversation is sufficient.

---

## M-CLIENT-01 — Client Messenger is organized as Inbox / Sales / Clients

**Decision**

Primary Client Messenger navigation is:

```text
Inbox
Sales
Clients
Collections
```

Client/Product conversations may be filtered by delivery/maintenance lifecycle where useful. `Support` and `Finance` are not separate top-level message stores.

**Why**

The business has three practical external communication modes: incoming attention, pre-sale/sales communication and communication with existing clients. Support and Finance are workflows/purposes around those canonical conversations, not separate universes of duplicated chats.

**Avoided alternative**

`CRM Inbox / Product WhatsApp Groups / Support Conversations / Finance Conversations / All External` as independent chat categories.

---

## M-CLIENT-02 — Product client communication may live through the whole lifecycle

**Decision**

A Product client work conversation can continue through Development → QA → Transfer → Maintenance. Lifecycle changes routing and filters, not the conversation identity.

**Why**

In real company use the same WhatsApp product group commonly begins during development and remains active for maintenance for years.

---

## M-WA-01 — Product communication uses flexible purpose-based bindings

**Decision**

A physical external conversation/WhatsApp group is a standalone External Conversation. A Product links to it through a purpose-based communication binding.

Initial purposes:

```text
WORK
FINANCE
```

**Why**

This supports both the common simple case and enterprise cases where multiple Products share one client group or one finance group, without hard-coding provider ids onto Product.

**Avoided alternative**

`Product.workGroupId` / `Product.financeGroupId` fixed fields or `1 Product = exactly 1 physical WhatsApp group`.

---

## M-WA-02 — One external conversation may serve multiple Products

**Decision**

A single physical WhatsApp group may be linked to multiple Products. Example: Website and SEO may share one WORK group; one FINANCE group may serve all Products of a client Project.

**Why**

Some Products are operationally discussed together, and large clients may intentionally centralize financial communication. The architecture should permit this without creating fake duplicate WhatsApp groups.

---

## M-WA-03 — Product destinations remain deterministic

**Decision**

For v1:

- each Product has exactly one active canonical `WORK` destination;
- each Product has zero or one explicit `FINANCE` destination;
- if explicit `FINANCE` is absent, finance communication resolves to the Product `WORK` destination.

**Why**

The backend remains flexible while outbound automations still have one deterministic target for each purpose.

---

## M-WA-04 — Deal Won handles WORK communication without forcing Finance complexity

**Decision**

For Product/Outsource Deal Won, Product client WORK communication can be created or bound to an existing allowed group. A separate FINANCE destination is optional and may be configured later in Product Client Communication settings.

**Why**

WORK communication is part of the normal delivery handoff. Separate finance groups are an enterprise exception and should not make the normal Deal Won flow heavier.

---

## M-WA-05 — Automation resolves destination by Product + purpose

**Decision**

Finance/Subscription/Client Service code does not directly know a WhatsApp `groupChatId`. It asks a central communication resolver for a Product destination by purpose.

```text
Product + FINANCE
  -> communication binding resolver
  -> External Conversation
  -> provider mapping
  -> WhatsApp Gateway
```

**Why**

Business modules should not depend on one provider or on physical group ownership details. This also keeps future provider replacement possible.

---

## M-WA-06 — Deal may own a client WhatsApp group before Product exists

**Decision**

For `PRODUCT` / `OUTSOURCE`, Sales may create or bind a client WhatsApp group on the Deal at any stage. Product is not required. Primary Contact is required to create. Invoice, deposit, Order, and Project are not required.

The physical group is a Deal-linked Client Sales conversation. On Deal Won the default handoff is:

```text
Product WORK binding -> the same External Conversation / WhatsApp group
```

Creating a second delivery group is an explicit advanced choice, not the default. EXTENSION / MAINTENANCE do not create a second group. Failed Deal does not delete the group. Create failure does not roll back the Deal.

**Why**

About half of commercial discussions need the client group before deposit is paid. The group is for the future Product, but it must exist early so the team can discuss scope with the client. Product is created at Won; the conversation must not wait for that.

**Avoided alternative**

Creating a Product/Project shell only to unlock the WhatsApp button, or treating Product as the only legal owner of a physical group.

---

## M-SECURITY-01 — Client composer is locked by default

**Decision**

Opening a Client conversation does not immediately enable external sending. The conversation is initially read-only/locked; an authorized Employee explicitly unlocks `Reply to client` for the current conversation working session. Leaving the conversation locks it again; an inactivity re-lock may be added.

The Client composer permanently shows client-visible/channel context when unlocked.

**Why**

The main safety risk is accidental external send. A lightweight explicit unlock creates a conscious mode switch without requiring confirmation before every single message.

**Avoided alternative**

An `Internal | Public` toggle inside the same client composer.

---

## M-SECURITY-02 — External read and send permissions are separate

**Decision**

An Employee may be invited to read a Client conversation without receiving permission to send externally. Conversation binding and participant/product membership do not silently grant external send.

**Why**

Developers and specialists often need to inspect client history to solve a problem but should not automatically be allowed to speak on behalf of the company.

---

## M-ROUTING-01 — Visibility and attention ownership are separate

**Decision**

Conversation access controls who may see/read/send. Attention routing controls who currently owns the response/work queue.

Default attention policy:

```text
Delivery client WORK conversation -> Product PM
Maintenance client WORK conversation -> Support Intake queue
FINANCE conversation -> Finance/authorized queue
```

Manual reassignment and exceptional Product overrides may exist without changing the canonical conversation.

**Why**

The same conversation can live for years while the responsible team changes. Hard-coding one permanent person as the client owner would not scale.

---

## M-SUPPORT-01 — Support Ticket is internal case management, not a second client chat

**Decision**

A Support Ticket stores category, priority, SLA, coverage, assignee, resolution and links to relevant external messages/tasks. Client-visible communication remains in Client Messenger. Ticket discussion, if needed, is internal only.

**Why**

Keeping public and internal composers inside the same Ticket increases accidental disclosure risk and duplicates the canonical client conversation.

**Avoided alternative**

Ticket-level `Public updates` and `Internal notes` as two send modes of one Ticket conversation.

---

## M-WHATSAPP-01 — Existing WhatsApp Gateway remains the transport boundary

**Decision**

NBOS extends the existing WhatsApp Gateway into bidirectional transport rather than building another WhatsApp service.

```text
Inbound:  WhatsApp -> WAHA -> Gateway -> authenticated NBOS webhook -> Messaging Core
Outbound: Messaging Core -> durable outbox/queue -> Gateway -> WAHA -> WhatsApp
```

Gateway owns transport/session/provider concerns. NBOS owns business context, permissions, routing, CRM/Support/Finance links, AI and message history.

**Why**

The gateway already isolates WAHA. Extending that boundary avoids duplicated session/provider logic and keeps WAHA replaceable.

---

## M-TELEGRAM-01 — Telegram chat migration is one-time, not permanent bridge

**Decision**

If internal Telegram history is imported, migration is a one-time controlled import of selected work groups into NBOS Internal Messenger. The target state is NBOS Web + Mobile as the primary internal messenger. Permanent Telegram ↔ NBOS project-chat synchronization is not the target architecture.

Telegram notifications may remain a separate Notifications feature.

**Why**

A permanent bridge creates two competing sources of conversation truth, duplicate permission management and long-term synchronization complexity.

---

## M-AI-01 — Client AI features belong to Client Messenger surface

**Decision**

Client Messenger may have AI draft/operator controls under AI Platform policy. Internal Messenger does not get a customer-reply operator. Generic AI assistance such as future `Create Task with AI` is a separate business action and may use authorized message context in either surface.

**Why**

Customer-facing AI has different safety, approval and context requirements from ordinary internal team chat.

---

## M-CORE-01 — Database is source of truth; realtime is transport

**Decision**

Message commands persist through the database first. WebSocket/Socket.IO handles live updates, typing, presence and unread refresh but never becomes message history source of truth.

External sends use durable outbox/queue semantics.

**Why**

Realtime connections are transient. Durable message history and external delivery must survive disconnects, retries and worker restarts.

---

## M-FILES-01 — Attachments are Drive File Assets

**Decision**

Messenger stores references to Drive File Assets rather than owning an independent file store.

**Why**

Drive already owns storage, access, preview, retention, versioning and cleanup. A second attachment storage system would duplicate policy and lifecycle logic.

---

## M-MAIL-01 — Mail stays a separate communication module

**Decision**

`EmailThread/EmailMessage` remain in NBOS Mail. Messenger may link to email context but does not merge email threads into the Messenger `Conversation/Message` store.

**Why**

Email has protocol/threading/sync semantics that differ from chat messaging. Sharing contextual links is useful; sharing the persistence model is not.
