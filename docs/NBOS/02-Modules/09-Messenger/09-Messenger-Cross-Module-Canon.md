# Messenger Cross-Module Canon

> Status: **canonical compatibility contract**.
>
> This document exists because Messenger changes touch small sections of large Tasks, Finance, RBAC, Navigation, Telegram and AI documents. Until every local section is mechanically reconciled, the rules below take precedence **only for Messenger-related behavior**.
>
> Product rationale: `08-Messenger-Decision-Register.md`.

## Precedence rule

If an older cross-module document conflicts with this file on Messenger communication ownership, conversation identity, WhatsApp destination ownership, Task human discussion, Client/Support separation or Internal/Client UX boundary, this file + `00..08` Messenger canon wins.

This does **not** override unrelated business rules in the owning module.

---

## 1. Tasks

### Superseded statement

Any Tasks documentation saying:

```text
Task human Discussion belongs to Tasks/task_discussion_entries and not Messenger
```

is superseded.

### Canon

- Task remains owned by Tasks module.
- Human Task Discussion is a Messaging Core Conversation embedded in Task Card.
- Task Activity Feed remains Task-owned system history.
- Task conversation is lazy-created when discussion begins.
- Message(s) from Internal or Client Messenger may become stable source references for a new Task.
- Task creation remains a full human/AI-assisted Task form, not blind conversion of message text.

Directly synchronized document: `../05-Tasks/05-Task-Card-UX-Plan.md`.

---

## 2. Work Spaces

### Canon

- Product and mandatory Connected Work Space share one internal work Conversation.
- Standalone Work Space may have its own internal Conversation.
- Extension uses parent Product Work Space and Product work Conversation by default.

Directly synchronized document: `../05-Tasks/02-Work-Spaces-and-Views.md`.

---

## 3. Projects Hub / Product / Extension

### Superseded assumptions

- Product internal chat and Connected Work Space chat are separate.
- Product has one raw owned WhatsApp group field as the long-term communication model.

### Canon

- Product internal work conversation = Connected Work Space Discussion.
- Client communication uses purpose-based Product communication bindings.
- One physical external conversation may serve multiple Products.
- Extension does not automatically create another internal or client conversation.

---

## 4. Finance / Subscriptions / Client Services

### Superseded statement

Any Finance document saying automatic client reminder target is simply:

```text
subscription.productId -> Product WhatsApp Group / groupChatId
```

is superseded at the destination-resolution layer.

### Canon

Finance still owns:

- reminder schedule;
- amount/tax/business conditions;
- Invoice/Subscription/Client Service state;
- `notifications_enabled` and reminder language.

Messenger owns destination resolution/delivery history.

Automatic client financial message target:

```text
resolveClientDestination(productId, FINANCE)
  -> explicit Product FINANCE binding if present
  -> otherwise Product WORK binding
```

Finance must not call WAHA/Gateway directly and must not rely on a raw Product group id.

All successful/attempted client sends must appear in the canonical Client Messenger conversation history according to delivery-state rules.

---

## 5. Support

### Superseded assumptions

- Ticket has one public/internal dual-mode conversation/composer.
- Support Conversations are a separate top-level Client Messenger universe.

### Canon

- Client-visible communication remains in Client Messenger.
- Support Ticket is internal case management: category, priority, SLA, coverage, assignee, resolution, links.
- Ticket links canonical external source messages and Tasks.
- Ticket internal discussion, if present, is internal-only.
- `No Public | Internal composer toggle` inside Ticket.

Directly synchronized documents:

- `../06-Support/01-Support-Overview.md`;
- `../06-Support/03-Support-Workflow.md`.

---

## 6. WhatsApp integration

### Superseded statement

```text
One Product -> exactly one physical WhatsApp group
```

### Canon

```text
Product + purpose -> External Conversation
purposes v1: WORK | FINANCE
```

Rules:

- one canonical WORK destination per Product;
- optional explicit FINANCE destination;
- FINANCE fallback to WORK;
- one external/WhatsApp group may serve multiple Products;
- Deal Won resolves WORK through create or select-existing;
- Finance group is optional and can be configured later;
- binding does not grant Client SEND permissions.

Directly synchronized document: `../../../06-Integrations/08-Product-WhatsApp-Groups.md`.

---

## 7. RBAC / Platform Access

Existing Platform Access Foundation remains reusable and authoritative for Project/Product participation, role/personal access and manual grants.

Messenger adds/clarifies a conversation layer on top:

```text
module permission
+ linked-entity participation
+ conversation membership / explicit invite
+ role/personal policy
+ management/owner policy
+ Client READ/SEND separation
```

Canonical requirements:

- Client conversation READ != SEND;
- Product binding does not automatically grant SEND;
- adding conversation to shared Collection never grants access;
- invited specialist may be read-only;
- attention assignment does not itself grant access.

Any coarse RBAC table row such as `Messenger (client) = role yes/no` should be treated as a default ceiling/base policy, not the whole object-level authorization model.

---

## 8. Navigation / UI Shell

### Superseded weak option

A single Messenger page with ordinary `Internal | External` zone switch is no longer the preferred product model.

### Canon

NBOS exposes two explicit working surfaces/entry points:

```text
Internal Messenger
Client Messenger
```

They may reuse app-shell and components, but they have different navigation, visual identity, Collections and composer/security state.

Entity deep-links open the correct surface directly.

Mobile preserves the same separation.

---

## 9. Telegram integration

### Superseded target

Permanent Telegram project-group <-> NBOS Internal Messenger synchronization is not the target architecture.

### Canon

- Telegram employee notifications may remain under Notifications.
- Historical internal chat migration, if performed, is a controlled one-time import of selected work groups.
- Target state is NBOS Internal Messenger on Web + Mobile as primary team chat.
- No permanent dual source of truth.

If older Telegram integration docs describe two-way group sync as recommended Phase 2, that section is legacy planning.

---

## 10. AI Platform

Existing AI authorization/risk/provider architecture remains authoritative.

Messenger-specific corrections:

- customer-facing AI draft/operator belongs to Client Messenger surface;
- Internal Messenger has no customer-reply operator;
- AI draft/generation never implies Client SEND permission;
- Product WhatsApp draft logic must not assume exactly one group owned by one Product;
- target execution must bind an exact Client Conversation/channel account;
- if a shared Client Conversation links multiple Products, Product-specific AI knowledge requires an explicit authorized Product scope/context instead of silently guessing one Product;
- future `Create Task with AI` may use selected/recent authorized messages in either surface with Employee confirmation.

Older AI Phase 2 text referring to “the canonical Product WhatsApp group” should be interpreted through Product Communication Binding resolution.

---

## 11. Notifications

Notifications and Messenger remain separate responsibilities.

If Notifications sends a client-visible WhatsApp message on behalf of Finance/Support/business automation:

- destination is resolved through Messaging Core/Product communication purpose;
- canonical outbound Message/delivery operation is persisted in Client Messenger;
- Notifications does not create a hidden parallel WhatsApp history.

Employee push/in-app/Telegram notifications do not become Messenger conversations unless they are actual chat messages.

---

## 12. Drive

No change to ownership:

- physical Messenger attachments are Drive File Assets;
- message references do not duplicate files;
- source-message reference does not bypass Drive/file access;
- Client attachment imported from provider retains source metadata.

---

## 13. Mail

No change to ownership:

- `EmailThread/EmailMessage` remain Mail module records;
- Messenger may link to Mail/Deal/Ticket context;
- no merge of email persistence into chat `Conversation/Message`.

---

## 14. Required cleanup during implementation planning

Before coding each affected module, the implementation agent must search for stale phrases/assumptions, especially:

```text
1 Product = 1 WhatsApp group
Product WhatsApp Group as direct finance target
Support Conversation / Finance Conversation as separate canonical chat type
public/internal Ticket discussion
Task Discussion belongs to task_discussion_entries
External -> Finance Conversations
External -> Support Conversations
one Messenger with Internal | External switch
Telegram two-way project chat sync
canonical Product WhatsApp group (AI assumption)
```

Each hit must be classified:

```text
KEEP
UPDATE
LEGACY/HISTORICAL
REMOVE
```

Do not mechanically replace historical acceptance/audit documents; mark their status clearly if they are retained as evidence.
