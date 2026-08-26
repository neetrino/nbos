# Messenger Cleanup Register

> Purpose: reconcile current runtime/legacy docs with the approved Messenger canon.
>
> Source of product truth: `00-Messenger-Overview.md` + `08-Messenger-Decision-Register.md`.
>
> This file is **not** an implementation completion claim. Runtime state must be verified independently before items are marked complete.

## Status legend

- `KEEP` — existing behavior/concept is compatible with target canon.
- `CHANGE` — existing behavior exists but semantics/design must change.
- `REMOVE` — legacy concept must not survive as target product behavior.
- `ADD` — missing target capability.
- `VERIFY` — current runtime/docs conflict or implementation status must be checked first-hand.

---

## A. Approved target canon

### Product surfaces

- `KEEP/LOCK`: one Messaging Core.
- `CHANGE`: expose **separate Internal Messenger and Client Messenger product surfaces**, not one shared screen with a casual zone switch.
- `ADD`: separate surface-specific Collections; no mixed Internal/Client Collection.

### Internal Messenger

- `CHANGE`: primary navigation becomes `All / Products / Tasks / Deals / Work Spaces / Groups / Direct / Collections`.
- `CHANGE`: `All` becomes recent-activity attention inbox, not hierarchy tree.
- `CHANGE`: Project General becomes optional/lazy contextual discussion, not mandatory eager conversation.
- `CHANGE`: Product + Connected Work Space use the same internal Conversation.
- `ADD`: standalone Work Space conversation support.
- `CHANGE`: Task Discussion uses Messaging Core; remove separate canonical task comments/discussion storage as product model.
- `ADD`: Collections with built-in Favorites, PERSONAL/SHARED semantics.
- `ADD`: universal message actions/references and multi-message source selection.
- `ADD`: optional threads/replies without forcing thread creation.

### Client Messenger

- `REMOVE`: separate top-level `Support Conversations` and `Finance Conversations` message stores.
- `CHANGE`: primary navigation becomes `Inbox / Sales / Clients / Collections`.
- `ADD`: locked Client composer / explicit `Reply to client` activation.
- `ADD`: separate external READ vs SEND permission semantics.
- `ADD`: attention routing independent from access (`Delivery -> PM`, `Maintenance -> Support Intake`, `FINANCE -> Finance/authorized`).
- `ADD`: Client Collections separate from Internal Collections.

### WhatsApp/Product communication

- `REMOVE`: canonical rule `1 Product = exactly 1 physical WhatsApp group`.
- `ADD`: purpose-based Product communication binding (`WORK`, `FINANCE`).
- `ADD`: one external conversation may serve multiple Products.
- `ADD`: deterministic Product destination rules: one WORK, optional FINANCE, FINANCE fallback to WORK.
- `CHANGE`: Deal Won creates/binds Product WORK destination; separate FINANCE remains optional/configurable later.
- `CHANGE`: Finance/Subscription/Client Services use central destination resolver, not raw Product group id.
- `KEEP`: WhatsApp Gateway remains transport boundary around WAHA.
- `ADD`: full bidirectional Gateway/NBOS receive/ack/status path.

### Support

- `CHANGE`: Ticket is internal case management only.
- `REMOVE`: public/internal dual-mode Ticket composer as target product behavior.
- `ADD`: stable references from Ticket to canonical Client messages.

### Telegram

- `REMOVE`: permanent Telegram project-chat <-> NBOS Messenger synchronization as target architecture.
- `ADD`: controlled one-time historical import/migration path where needed.
- `KEEP`: Telegram employee notifications may remain under Notifications.

---

## B. Current runtime baseline to verify

The authoritative reset report is `docs/NBOS_MESSENGER_CLEAN_CORE_RESET.md` (2026-08-11).

Its recorded baseline says:

- active runtime = legacy Channels + DM shell;
- channel/DM PostgreSQL persistence exists;
- Socket.IO channel/DM realtime exists;
- ACL-hardened channel/DM API exists;
- unified Conversation schema/data was preserved but runtime/API/UI using it was removed;
- L1/L2 Topic UI/runtime was removed;
- Project General lifecycle coupling was removed;
- External Messenger provider runtime was not implemented.

Treat these as the starting claim for the rebuild, but the first implementation slice must re-check code/schema/tests rather than trusting this document alone.

---

## C. Legacy concepts that must not return accidentally

### C1. L1/L2 Topics architecture

`REMOVE` as product architecture:

- L1 entities navigation;
- L2 Topic hierarchy;
- mandatory `PROJECT_GENERAL` lifecycle;
- ensure-on-selection topic model;
- Product/Task mapped as Topics under a Project tree.

Reason: approved navigation is flat/contextual and entity conversations are canonical directly.

### C2. Separate Task comments engine

`REMOVE/RECONCILE` any documentation/runtime assumption that human Task Discussion is canonically stored outside Messaging Core.

System Task Activity remains separate.

### C3. One Product -> one WhatsApp group

`REMOVE/REPLACE` in Messenger, WhatsApp integration, Finance reminders and AI planning documents.

Target = Product communication bindings with shared External Conversation support.

### C4. Support/Finance as duplicate chat categories

`REMOVE/REPLACE` top-level external chat types that duplicate the Product/client conversation.

Support = Ticket workflow; Finance = message purpose/destination + Finance workflow.

### C5. Mixed Internal/Client UI

`REMOVE` any product design that renders both zones as one ordinary list/composer mode.

Shared backend/search primitives are allowed; product surface must remain explicit.

---

## D. Data/schema reconciliation questions for Slice 1

Before migrations, inspect current Prisma/runtime and classify each target concept as `REUSE / EXTEND / MIGRATE / NEW / DELETE-LATER`:

- Conversation;
- Message;
- participant/membership;
- read state;
- reply/reaction;
- ConversationLink;
- MessageReference;
- Collections/items/settings;
- ExternalChannelAccount;
- ExternalConversationMapping;
- MessageExternalRef / provider events;
- outbound delivery/outbox;
- ProductCommunicationBinding;
- attention assignment/routing state;
- legacy MessengerChannel / MessengerDirect models;
- preserved unused unified MessengerConversation models.

No destructive migration should be designed before this reconciliation is complete.

---

## E. Cross-module documentation cleanup

The Messenger canon changes require explicit updates in:

### Tasks

- `01-Task-System-Overview.md`: human Discussion no longer belongs to `task_discussion_entries`; Messaging Core owns it.
- `05-Task-Card-UX-Plan.md`: wire real Messaging Core discussion instead of placeholder/local notes.

### Work Spaces

- `02-Work-Spaces-and-Views.md`: Connected Product Work Space shares Product work Conversation; standalone Work Space may own one.

### Support

- Support overview/workflow: client communication stays in Client Messenger; Ticket public/internal composer split removed; external messages are references.

### Projects Hub

- Product/Extension docs: Product work conversation shared with Connected Work Space; client communication through bindings rather than one owned group.

### Finance

- Subscription/Client Services: WhatsApp reminders resolve Product `FINANCE` purpose with WORK fallback.

### WhatsApp integration

- `08-Product-WhatsApp-Groups.md`: replace one-Product ownership with flexible communication bindings and shared-group rules.
- Gateway boundary: extend receive/ack/status contract as needed without moving business ownership into Gateway.

### Roles/RBAC

- replace coarse `Messenger (project/client)` assumptions with surface permission + participation + explicit Client READ/SEND semantics.

### Telegram

- remove future permanent two-way project chat sync as canonical direction; document one-time migration separately from notifications.

### AI Platform

- Phase 2 Product WhatsApp draft assumptions must resolve exact External Conversation/Product binding instead of assuming one canonical group owned by exactly one Product.
- shared conversation may have multiple Products; AI execution must use explicit selected/authorized Product scope where Product-specific knowledge is required.

---

## F. Implementation planning cleanup

Do not reuse the old phased backlog in this file as an executable plan.

After Canon + runtime reconciliation, create dedicated documents:

- `10-Messenger-Rebuild-Implementation-Checklist.md`;
- `11-Messenger-Rebuild-Execution-Strategy.md`;
- per-slice implementation/review evidence files;
- final independent acceptance report.

Each implementation slice must reference decision ids from `08-Messenger-Decision-Register.md` and must include negative/security tests where relevant.

---

## G. Migration principles

- preserve real production message history;
- do not fabricate empty Task/Product conversations during bulk migration unless required by business behavior;
- map legacy channels/DM to canonical conversations explicitly;
- preserve provider ids and source provenance;
- avoid destructive deletion until parity/rollback evidence exists;
- use manual mapping for ambiguous legacy Project/Product/client groups rather than guessing;
- existing physical WhatsApp group may be bound to multiple Products in the new model;
- Collection migration must preserve surface zone and never create cross-zone items.
