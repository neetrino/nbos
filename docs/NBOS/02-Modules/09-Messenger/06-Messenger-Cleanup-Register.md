# Messenger Cleanup Register

> Purpose: reconcile current runtime/legacy docs with the approved Messenger canon.
>
> Source of product truth: `00-Messenger-Overview.md` + `08-Messenger-Decision-Register.md`.
>
> Migration truth/process: `10-Messenger-Runtime-Reconciliation.md` + `11-Messenger-Rebuild-Implementation-Checklist.md`.
>
> This file is **not** an implementation completion claim. Runtime state must be verified independently before items are marked complete.

## Status legend

- `KEEP` — existing behavior/concept is compatible with target canon.
- `CHANGE` — existing behavior exists but semantics/design must change.
- `MIGRATE` — existing working data/runtime must move safely to the canonical model.
- `REMOVE` — legacy concept must not survive as target product behavior.
- `DELETE-LATER` — legacy code/data remains temporarily for migration safety and is deleted only after cutover verification.
- `ADD` — missing target capability.
- `VERIFY/MISSING` — runtime/docs conflict or current implementation was not confirmed first-hand.

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
- `MIGRATE`: Task human Discussion uses Messaging Core; existing separate Task discussion data must be backfilled safely before old storage is retired.
- `ADD`: Collections with built-in Favorites, PERSONAL/SHARED semantics.
- `ADD`: universal message actions/references and multi-message source selection.
- `ADD`: optional threads/replies without forcing thread creation.

### Client Messenger

- `REMOVE`: separate top-level `Support Conversations` and `Finance Conversations` message stores.
- `CHANGE`: primary navigation becomes `Inbox / Sales / Clients / Collections`.
- `MIGRATE`: existing `MetaConversation` / `MetaMessage` Instagram/Facebook inbound history into Messaging Core Client Sales (Slice 7); do not classify that store `NEW` because a snapshot is empty; Mail exemption (`M-MAIL-01`) does not apply.
- `ADD`: locked Client composer / explicit `Reply to client` activation.
- `ADD`: separate external READ vs SEND permission semantics.
- `ADD`: attention routing independent from access (`Delivery -> PM`, `Maintenance -> Support Intake`, `FINANCE -> Finance/authorized`).
- `ADD`: Client Collections separate from Internal Collections.

### WhatsApp/Product communication

- `MIGRATE`: current hard Product ↔ physical group ownership/unique relationship to flexible Product purpose bindings.
- `REMOVE`: canonical rule `1 Product = exactly 1 physical WhatsApp group`.
- `ADD`: purpose-based Product communication binding (`WORK`, `FINANCE`).
- `ADD`: one external conversation may serve multiple Products.
- `ADD`: deterministic Product destination rules: one WORK, optional FINANCE, FINANCE fallback to WORK.
- `CHANGE`: Deal Won creates/binds Product WORK destination; separate FINANCE remains optional/configurable later.
- `CHANGE`: Finance/Subscription/Client Services use central destination resolver, not raw Product group id.
- `KEEP/EXTEND`: existing WhatsApp Gateway remains transport boundary around WAHA; reuse current account/send/inbound webhook capabilities.

### Support

- `CHANGE`: Ticket is internal case management only.
- `REMOVE`: public/internal dual-mode Ticket composer as target product behavior.
- `ADD`: stable references from Ticket to canonical Client messages.

### Telegram

- `REMOVE`: permanent Telegram project-chat <-> NBOS Messenger synchronization as target architecture.
- `ADD`: controlled one-time historical import/migration path where needed.
- `KEEP`: Telegram employee notifications may remain under Notifications.

---

## B. Current runtime baseline

The historical reset report is `docs/NBOS_MESSENGER_CLEAN_CORE_RESET.md` (2026-08-11).

Its recorded baseline says:

- active runtime = legacy Channels + DM shell;
- channel/DM PostgreSQL persistence exists;
- Socket.IO channel/DM realtime exists;
- ACL-hardened channel/DM API exists;
- unified Conversation schema/data was preserved but runtime/API/UI using it was removed;
- L1/L2 Topic UI/runtime was removed;
- Project General lifecycle coupling was removed;
- External Messenger provider runtime was not implemented by that reset.

Additional rebuild reconciliation already identified important migration areas:

- existing human Task Discussion is not treated as disposable; it requires data migration into Messaging Core;
- existing Product WhatsApp relation was designed around one-to-one ownership and cannot represent shared WORK/FINANCE groups;
- Deal Won has useful create/bind/failure semantics to preserve while storage ownership changes;
- Client external **UI** is largely a new/separate surface rather than an extension of the old casual zone switch;
- Client Sales **history** already exists as `MetaConversation` / `MetaMessage` (inbound webhook persist + CRM Lead UI) and must `MIGRATE` into Core (Slice 7), then `DELETE-LATER` (Slice 11);
- `neetrino/whatsapp-gateway` has reusable account-scoped send and inbound Project webhook infrastructure;
- Finance client reminders use Product `groupChatId` + outbound worker; official invoices use `accountingGroupChatId` (Slice 0: `20-Slice-00-Baseline.md`).

`10-Messenger-Runtime-Reconciliation.md` is the authoritative migration-safety document. Slice 0 must still inspect actual current code/schema/data before any product code change.

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

`MIGRATE -> DELETE-LATER` any runtime assumption that human Task Discussion is canonically stored outside Messaging Core.

System Task Activity remains separate.

Migration must preserve authorship, timestamps/order, attachments/File Assets, AI/system provenance and audit/activity relationships before legacy writes/storage are retired.

### C2b. Meta Instagram/Facebook conversation store

`MIGRATE -> DELETE-LATER` `MetaConversation` / `MetaMessage` into Messaging Core Client Sales (Slice 7 map, Slice 11 drop).

Do not classify this store `NEW` because a database snapshot is empty. Live inbound writers exist. Do not apply Mail’s `M-MAIL-01` exemption. Do not drop Meta because Core does not exist yet. Do not create a fourth permanent Messenger store.

Meta connected accounts / sender identities / provider events are `REUSE/EXTEND`. Meta outbound send is `NEW` and must persist in Core when Client SEND exists.

### C3. One Product -> one WhatsApp group

`MIGRATE -> DELETE-LATER` old one-to-one fields/tables/unique constraints.

Target = Product communication bindings with shared External Conversation support.

Existing Product group relationships backfill as `WORK`. Do not create FINANCE bindings automatically. Existing physical groups/provider ids must be preserved rather than recreated.

### C4. Raw Product `groupChatId` business sends

`REMOVE` after binding/resolver cutover.

Finance/Subscriptions/Client Services and other business modules must resolve `Product + purpose` and send through Messaging Core/provider mapping.

### C5. Support/Finance as duplicate chat categories

`REMOVE/REPLACE` top-level external chat types that duplicate the Product/client conversation.

Support = Ticket workflow; Finance = message purpose/destination + Finance workflow.

### C6. Mixed Internal/Client UI

`REMOVE` any product design that renders both zones as one ordinary list/composer mode.

Shared backend/search primitives are allowed; product surfaces and Collections remain separate.

### C7. Legacy Gateway wording: group id stored directly on Product

`CHANGE` integration documentation/adapter assumptions.

Target mapping:

```text
WhatsApp chat/group id
  -> ExternalConversationMapping
  -> Client Conversation
  -> ProductCommunicationBinding(s)
```

Gateway transport/session data stays in Gateway; NBOS business ownership stays in NBOS.

---

## D. Schema/runtime reconciliation checklist for Slice 0

Before migrations, inspect current Prisma/runtime and classify each target concept as `REUSE / EXTEND / MIGRATE / NEW / DELETE-LATER / VERIFY-MISSING`:

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
- preserved unused unified MessengerConversation models;
- TaskDiscussionEntry/equivalent legacy human discussion store;
- MetaConversation / MetaMessage (Client Sales inbound store; not Mail);
- ProductWhatsAppGroupBinding/equivalent legacy Product/group relationship;
- Deal Won communication DTO/service paths;
- Finance reminder send path;
- Gateway v1/inbound webhook integration.

No destructive migration should be designed before this reconciliation is complete.

---

## E. Cross-module documentation cleanup

The Messenger canon changes require explicit updates or precedence in:

### Tasks

- human Discussion no longer belongs to a permanent separate `task_discussion_entries` source of truth;
- Task Card wires Messaging Core Discussion while system Activity remains Task-owned;
- migration must preserve real legacy discussion data before cleanup.

### Work Spaces

- Connected Product Work Space shares Product work Conversation;
- standalone Work Space may own one.

### Support

- client communication stays in Client Messenger;
- Ticket public/internal composer split is removed from target behavior;
- external messages are references.

### Projects Hub

- Product work conversation is shared with Connected Work Space;
- client communication uses Product purpose bindings rather than one owned group.

### Finance

- all automatic payment/money reminders use Product `FINANCE` purpose with WORK fallback;
- Finance decides WHAT/WHEN; Messenger resolves WHERE and owns chat history;
- manual FINANCE group conversation is ordinary Client Messenger behavior, not the same mechanism as reminder scheduling.

### WhatsApp integration

- `08-Product-WhatsApp-Groups.md` is the NBOS binding canon;
- Gateway is reused/extended, not replaced;
- old instruction to store returned group id directly on Product is legacy wording and must be removed from integration docs when that repo is synchronized.

### Roles/RBAC

- replace coarse Messenger access assumptions with surface permission + participation + explicit Client READ/SEND semantics.

### Telegram

- permanent two-way project chat sync is not canonical; one-time migration is separate from notifications.

### AI Platform

- Product WhatsApp draft/operator assumptions resolve exact External Conversation/Product binding instead of assuming one group owned by exactly one Product;
- shared conversation may have multiple Products; Product-specific AI context must be explicit/authorized;
- future Create Task with AI proposes structured Task content, human confirms.

---

## F. Executable rebuild documents

The old phased backlog in historical Messenger docs is not the executable plan.

Use:

- `10-Messenger-Runtime-Reconciliation.md` — current-runtime migration rules;
- `11-Messenger-Rebuild-Implementation-Checklist.md` — Slices 0–11;
- `12-Messenger-Rebuild-Execution-Strategy.md` — Implementer → independent Reviewer process;
- per-slice evidence files `20-...` through `31-...` created during implementation;
- `90-Messenger-Final-Acceptance.md` — fresh final independent acceptance.

Each implementation slice references decision ids from `08-Messenger-Decision-Register.md` and includes negative/security tests where relevant.

---

## G. Migration principles

- preserve real production message history;
- additive schema before destructive cleanup;
- backfill/map before switching reads/writes;
- make backfills idempotent/rerunnable or equivalently safe;
- do not fabricate empty Task/Product conversations during bulk migration unless business behavior requires them;
- map legacy channels/DM explicitly;
- preserve provider ids and source provenance;
- preserve Task authorship/order/files/provenance/audit;
- existing Product WhatsApp bindings backfill as WORK;
- do not auto-create FINANCE during migration;
- existing physical WhatsApp group may be bound to multiple Products in the new model;
- do not recreate physical WhatsApp groups merely to fit a new schema;
- keep legacy Task/WhatsApp stores as `DELETE-LATER` until parity/rollback evidence exists;
- use manual mapping for materially ambiguous legacy Project/Product/client histories rather than guessing;
- Collection migration preserves surface zone and never creates cross-zone items;
- binding a Product never grants conversation ACL;
- after cutover, business sends use destination resolver, never raw Product provider ids.

---

## H. Cleanup release gate

Before deleting any migrated legacy storage/field/constraint, verify:

- responsible slice is `VERIFIED`;
- migration parity evidence exists;
- new writes no longer hit legacy path;
- static/runtime checks find no uncontrolled bypass;
- backup/rollback strategy is recorded;
- provider identity/history cannot be lost;
- final acceptance or a dedicated final cleanup review authorizes removal.
