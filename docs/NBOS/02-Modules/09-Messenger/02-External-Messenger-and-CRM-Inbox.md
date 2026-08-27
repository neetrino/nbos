# Client Messenger

> Canon status: **approved product architecture**.
>
> Decision rationale: `08-Messenger-Decision-Register.md` (`M-BOUNDARY-*`, `M-CLIENT-*`, `M-WA-*`, `M-SECURITY-*`, `M-ROUTING-01`, `M-SUPPORT-01`, `M-WHATSAPP-01`, `M-AI-01`).

`Client Messenger` is the external communication surface for real conversations with clients and other external participants.

It uses the shared Messaging Core, but it is a **separate product surface** from Internal Messenger. Its navigation, visual identity, collections, permissions, composer and actions are client-facing by design.

Anything sent from Client Messenger may become externally visible.

---

## 1. Primary navigation

```text
Inbox
Sales
Clients
Collections
```

### Inbox

Attention-oriented list of incoming Client conversations requiring review/response.

Possible filters include:

- Unread;
- Needs response;
- Assigned to me/team;
- channel/provider;
- lifecycle/routing state;
- communication purpose where useful, for example FINANCE.

Inbox is a view over canonical Client conversations. It is not a second message store.

### Sales

External pre-sale communication around Leads/Deals, for example WhatsApp 1:1, Instagram or Facebook conversations.

Client Sales conversation is never the same object as an Internal Deal discussion.

### Clients

Existing-client conversations, primarily Product client conversations/groups.

Useful grouping/filtering may include:

```text
Client / Project
  Product A
  Product B
```

and lifecycle filters such as `Delivery` or `Maintenance`, but lifecycle does not replace the canonical conversation.

### Collections

Client-only personal/shared collections. Client Collections can never contain Internal conversations.

---

## 2. Why Support and Finance are not separate messenger universes

`Support` and `Finance` are business workflows/purposes, not independent duplicate chat stores.

Example:

```text
Product Client WORK conversation
  ├── client asks about a bug
  │    └── may create Support Ticket / Task
  ├── client asks about a new feature
  │    └── may create Deal / Extension Deal
  └── ordinary product communication
```

Finance communication may use the Product WORK conversation or an explicit Product FINANCE conversation through communication bindings.

This avoids having the same client/Product represented simultaneously as `Product Chat`, `Support Conversation` and `Finance Conversation` with fragmented history.

---

## 3. Product client communication lifecycle

A Product WORK client conversation may begin as delivery starts and continue through:

```text
Development
  -> QA
  -> Transfer
  -> Maintenance
```

The same conversation can live for years.

Lifecycle changes:

- attention routing;
- filters;
- participant recommendations;
- actions/automation context.

Lifecycle does **not** automatically create a new conversation.

---

## 4. Flexible Product Communication Bindings

A physical WhatsApp group is modeled as an External Conversation/provider mapping. It does not belong rigidly to exactly one Product.

Products connect to external conversations through purpose-based bindings.

Initial purposes:

```text
WORK
FINANCE
```

Example:

```text
Project: Enterprise Client

Website
  WORK    -> WhatsApp Group A
  FINANCE -> WhatsApp Finance Group F

SEO
  WORK    -> WhatsApp Group A       # shared WORK group
  FINANCE -> WhatsApp Finance Group F

CRM
  WORK    -> WhatsApp Group C
  FINANCE -> WhatsApp Finance Group F
```

Rules for v1:

- Product has exactly one active canonical `WORK` destination;
- Product has zero or one explicit `FINANCE` destination;
- one External Conversation may serve multiple Products;
- if explicit FINANCE destination is absent, `FINANCE` resolves to the Product WORK destination;
- bindings and access permissions are separate: linking a Product to a conversation does not silently give every Product participant external send access.

### Why

This preserves a simple default for most clients while supporting enterprise cases where Website+SEO share a working group or one finance group serves several Products.

---

## 5. Deal Won and Product WORK destination

For Product/Outsource Deal Won, normal communication handoff should resolve the Product WORK destination.

Allowed paths:

```text
Create new WORK WhatsApp group
or
Bind/select an existing allowed External Conversation
```

A separate FINANCE destination is optional. It can be configured later in Product Client Communication settings instead of making every Deal Won flow handle an enterprise-only finance-group case.

For an Extension of an existing Product, the existing Product communication remains the default; an Extension does not create a new client group merely because a new Deal exists.

For a genuinely new Product, a new Product binding is created. It may point to a new group or, when business context requires, an existing shared group.

---

## 6. Finance destination resolver and finance communication

Finance, Subscription and Client Services must not send to a raw WhatsApp `groupChatId` stored on Product.

They request a business destination:

```text
resolveClientDestination(productId, FINANCE)
```

Resolution:

```text
explicit FINANCE binding exists?
  YES -> FINANCE External Conversation
  NO  -> Product WORK External Conversation
```

Then Messaging Core/provider mapping decides how that conversation is delivered.

Typical purpose mapping:

| Event | Purpose |
| --- | --- |
| Subscription payment reminder | `FINANCE` |
| Invoice/payment reminder | `FINANCE` |
| Hosting/domain payment reminder | `FINANCE` |
| Maintenance/client-service payment reminder | `FINANCE` |
| Other approved automatic payment reminder | `FINANCE` |
| Development/QA/maintenance operational message | `WORK` |
| Manual normal Product communication | `WORK` |

Advanced per-service overrides are not required for v1 unless a real business case appears.

### Automatic reminder vs manual FINANCE conversation

These are two different operations:

```text
Automatic FINANCE reminder
  = Finance/Subscription business rule triggers a system outbound message

Manual FINANCE conversation
  = authorized Employees communicate normally in a Client conversation
```

The automatic reminder does not require a human participant to press Send. Manual communication always follows Client Messenger READ/SEND permissions and locked-composer rules.

A dedicated FINANCE group is a full Client conversation, not merely a notification sink.

If there is no dedicated FINANCE group, automatic FINANCE messages go to WORK through the fallback rule. The client reply then remains in that same WORK conversation; the system does not fabricate a second Finance history.

If there is a dedicated FINANCE group, reminders and replies remain in that FINANCE conversation.

### Why

Most clients use one working group for both operational and financial communication, while a smaller group of enterprise clients explicitly separates finance. The resolver supports both without forcing every Product to own two physical WhatsApp groups.

---

## 7. Client conversation safety and locked composer

Opening a Client conversation does not immediately enable message sending.

Default state:

```text
🔒 Client conversation
WhatsApp · Client · Product

[ Reply to client ]
```

An authorized Employee explicitly activates `Reply to client` for the current conversation working session.

Unlocked state must show unmistakable external context, for example:

```text
CLIENT VISIBLE
Sending via WhatsApp
Client / Product
```

Rules:

- leaving/switching the conversation re-locks the composer;
- inactivity re-lock may be added;
- no `Internal | Public` toggle exists inside the Client composer;
- external `READ` and `SEND` permissions are separate;
- a user may be invited to inspect history without permission to reply externally;
- permission is checked again at send command, not only in UI;
- external send and participant changes are audited.

### Why

The main operational risk is an Employee accidentally sending an internal thought to a client. One explicit unlock per conversation session creates a conscious mode switch without making every individual message require a confirmation dialog.

---

## 8. Message actions and internal handoff

Where permissions allow, one or multiple Client messages may be selected and used to:

- Reply;
- Create Task;
- Share/Forward reference to an Internal conversation;
- Create/link Support Ticket;
- Create/link Deal / Extension Deal;
- invite an Employee to this Client conversation;
- Copy/Open source link.

### `Share/Forward internally`

The target receives reference cards, not disconnected copies:

```text
From Client Messenger
Client: Degusto
Product: Website
WhatsApp

"After update the payment stopped working"
[Open original]
```

The team may simply discuss it in the Product/Work Space conversation. A separate Task/Ticket is created only when actual tracked work/case management is needed.

Threads may be used manually when useful, but forwarding does not automatically create a thread.

---

## 9. Create Task from Client Messenger

Creating a Task is a full Task creation workflow.

Selected source messages provide context, attachments and references, but the Employee still defines the real Task title, description, assignee and links.

A Task may have one primary context and additional entity links, so a shared Website+SEO conversation does not require the messaging system to automatically guess one exclusive Product before a Task can be created.

Future `Create Task with AI` may propose structured Task content from selected/recent authorized context, with human confirmation.

---

## 10. Support boundary

Support Ticket is an internal case-management object.

Flow:

```text
Client message in Client Messenger
  -> Create/link Support Ticket when needed
  -> Ticket stores SLA/category/coverage/assignee/resolution
  -> execution through linked Task(s)/Work Space
  -> final communication returns through Client Messenger
```

Ticket may show references/previews of relevant external messages, but it does not create a second public client composer.

Ticket internal discussion, if needed, is internal only.

---

## 11. Attention routing

Access and attention ownership are separate.

Default routing:

```text
Product WORK during Delivery     -> Product PM
Product WORK during Maintenance  -> Support Intake queue
FINANCE conversation             -> Finance/authorized queue
```

The same conversation remains canonical when routing changes.

Manual reassignment is allowed. Exceptional per-Product routing override may be added without hard-coding one permanent person such as a specific Support employee into Product ownership.

---

## 12. External participants and Employee access

Two separate concepts must be maintained:

1. provider/WhatsApp participant membership;
2. NBOS Employee conversation access.

They are not required to be identical.

Example: an Employee may read/respond through NBOS according to company policy without becoming a newly inferred Product owner; conversely, adding a Product binding does not silently invite every Product developer into the client conversation.

Suggested defaults can be derived from Product team, PM, Sales, Finance or Support role/routing, but effective access is always resolved through Messenger permissions.

### Dedicated FINANCE conversation default

When a separate FINANCE client group/conversation is configured, the default Neetrino-side participant/access template is:

- Owner;
- CEO;
- Finance Director;
- relevant Seller;
- relevant Product PM.

Seller and PM are resolved from the relevant Product/business context; they are not one globally hard-coded person.

Developers and other Product employees are **not** automatically added to a dedicated FINANCE conversation. Additional participants can be invited explicitly when required.

Physical WhatsApp participant membership and NBOS READ/SEND permissions still remain separate. A person appearing in the default business template does not bypass effective authorization rules.

### Why

A separate FINANCE group exists primarily for clients who want payment/financial discussion isolated from their operational employees and, correspondingly, from unnecessary operational/development participants on the Neetrino side.

---

## 13. WhatsApp transport boundary

Canonical path:

```text
Client Messenger
  -> Messaging Core
    -> WhatsApp adapter
      -> WhatsApp Gateway
        -> WAHA
          -> WhatsApp
```

Inbound:

```text
WhatsApp -> WAHA -> Gateway -> authenticated NBOS webhook -> Messaging Core -> realtime staff
```

Outbound:

```text
Employee/System -> permission -> durable message/outbox -> queue -> Gateway -> WAHA -> WhatsApp
```

Gateway is transport-only. NBOS owns:

- conversation/business context;
- Product bindings;
- permissions;
- routing;
- CRM/Support/Finance links;
- AI policy/context;
- audit/history.

---

## 14. AI operator/draft boundary

Client Messenger may expose AI operator/draft controls according to AI Platform policy and exact conversation authorization.

AI state/action must be explicit in the UI, for example enabled/disabled/paused/manual takeover where the final AI product design requires it.

Customer-facing AI belongs to Client Messenger, not Internal Messenger.

AI generation/draft permission never implies external send permission unless a separately approved future policy explicitly allows it.

---

## 15. Client Collections

Client Messenger has its own Collections:

```text
Favorites
Premium Clients
Finance Control
High Attention
```

Rules:

- `Favorites` is a built-in personal Client Collection;
- Collections may be PERSONAL or SHARED;
- adding a conversation to a shared Collection never grants conversation access;
- Client Collections can contain only Client conversations;
- there is no cross-surface Collection mixing Internal and Client chats.
