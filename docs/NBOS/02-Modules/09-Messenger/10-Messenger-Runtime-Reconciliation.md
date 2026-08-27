# Messenger Runtime Reconciliation and Migration Safety

> Status: **required implementation precondition**.
>
> Product truth: `00-Messenger-Overview.md` + `08-Messenger-Decision-Register.md`.
>
> This document describes how the approved Messenger canon must be reconciled with already existing runtime/data. It is not permission to redesign the canon to match legacy code.

## 1. Core rule

When current runtime conflicts with approved product architecture:

```text
Canon wins for target behavior.
Existing production data/runtime wins for migration safety.
```

Therefore implementation follows:

```text
EXPAND / ADD COMPATIBLE PATH
  -> INVENTORY
  -> BACKFILL / MAP
  -> VERIFY PARITY
  -> COMPATIBILITY WINDOW
  -> CUT OVER WRITES/READS
  -> OBSERVE
  -> REMOVE LEGACY ONLY LAST
```

**Why:** the Messenger rebuild changes several already-used relationships. A drop-first rewrite could lose discussion history, break Deal Won/WhatsApp behavior, duplicate provider groups, or make existing Products unable to resolve their client communication.

Destructive migration is forbidden until the relevant slice has independent review evidence and the cleanup gate allows it.

---

## 2. Reconciliation classifications

Use only these labels when inspecting current code/schema:

- `REUSE` — existing runtime already satisfies the target contract.
- `EXTEND` — keep existing behavior and add target capability around it.
- `MIGRATE` — existing working data/runtime must move to a new canonical model.
- `NEW` — target capability does not materially exist yet.
- `DELETE-LATER` — legacy data/code remains temporarily for safe cutover, then is removed only after verification.
- `VERIFY/MISSING` — documentation or previous inspection suggests something, but current runtime was not confirmed strongly enough to treat as implemented.

A reviewer must reject any slice that silently treats `VERIFY/MISSING` as `REUSE`.

---

## 3. Fresh verified runtime baseline

This section records facts verified directly against current repository runtime before implementation planning.

### 3.1 Active Messenger runtime uses the legacy/simple models

Current API module:

```text
apps/api/src/modules/messenger/messenger.module.ts
apps/api/src/modules/messenger/messenger.service.ts
```

The active service reads/writes the existing simple models such as:

```text
Conversation
ConversationMember
Message
ChatFile
ChatMessageRead
ChatMessageReaction
...
```

It uses Prisma paths such as `prisma.conversation`, `prisma.conversationMember`, `prisma.message` and related legacy/simple tables.

**Verified conclusion:** these models are the current active Messenger runtime and cannot be deleted or ignored during the rebuild.

Classification: `REUSE + EXTEND`, with targeted migration only where the target contract cannot safely be expressed by the current model.

### 3.2 A second, older Unified Messenger schema also exists but is not the active service runtime

`packages/database/prisma/schema/messenger.prisma` also contains the previous additive Unified generation:

```text
MessengerConversation
MessengerConversationLink
MessengerConversationMember
MessengerDirectKey
MessengerTopic
MessengerTopicMember
MessengerMessage
MessengerAsset
MessengerMessageAttachment
MessengerReadState
MessengerThreadReadState
MessengerFavorite
MessengerCollection
MessengerCollectionItem
...
```

This generation was designed around the earlier L1/L2/Project/Topic architecture. For example, the previous model includes a mandatory `projectId` on `MessengerConversation` and explicit Topic concepts.

Current `MessengerService` is not using that generation as its normal active message path.

**Verified conclusion:** do **not** reactivate these tables wholesale merely because they already exist.

Classification: `MIGRATE / SELECTIVE REUSE / DELETE-LATER` after Slice 0 data inventory.

Before deleting them, Slice 0 must still verify real database row counts and any external foreign-key/reference use. “Not used by current service code” does not prove “contains no valuable rows”.

### 3.3 There must not be a third Messenger generation

The target implementation must deliberately evolve/select one canonical runtime path. It must not leave:

```text
legacy Conversation/Message runtime
+ old Unified Messenger tables
+ new third Messenger store
```

all as parallel writable message systems.

**Why:** three message stores would make migration, search, read state, mobile sync and future maintenance substantially more dangerous than the current problem.

### 3.4 Task Discussion is a real separate runtime

Current Tasks schema contains `TaskDiscussionEntry` and related discussion attachments/reply/provenance fields. Its schema documentation explicitly states that the human Task Discussion is Tasks-owned and Messenger is not involved.

This means Task Discussion migration is **not UI wiring**. It is a real persistence migration.

Classification: `MIGRATE`, then old write/storage path `DELETE-LATER`.

### 3.5 Current WhatsApp Product binding hard-enforces the old 1:1 model

Current WhatsApp schema contains `ProductWhatsAppGroupBinding` with, among other fields:

```text
productId   @unique
groupChatId @unique
```

This encodes the old relationship:

```text
1 Product <-> 1 physical WhatsApp group
```

It cannot represent the approved flexible model where Website + SEO may share WORK and several Products may share FINANCE.

Classification: `MIGRATE`, then legacy binding/constraints `DELETE-LATER`.

### 3.6 Deal Won has useful existing behavior

Existing Product/Deal Won communication flow already has useful create/bind and provisioning/failure concepts. The target should preserve those business semantics while changing the destination model from Product-owned group to Product `WORK` binding.

Classification: `REUSE + EXTEND`.

### 3.7 Client Messenger target surface is mostly new

The completed separate Client Messenger surface described by canon does not currently exist as the final runtime. The old mixed/placeholder External route/switch must not dictate final product architecture.

Classification: target Client surface `NEW`; conflicting old mixed UI `DELETE-LATER` after cutover.

### 3.8 Finance -> Messenger/WhatsApp automatic delivery is not treated as completed runtime

Messenger/notifications/WhatsApp are still being completed. Existing Finance business logic must therefore be integrated into the new destination resolver rather than assumed to already have the canonical send path.

Classification: `NEW integration`, while preserving existing Finance business rules that determine WHAT/WHEN should be reminded.

### 3.9 Existing WhatsApp Gateway is reusable

The separate `neetrino/whatsapp-gateway` already owns WhatsApp transport/session boundaries and has outbound plus inbound webhook/idempotency/routing foundations.

Classification: `REUSE + EXTEND`.

NBOS must not create a second gateway or move Product/Finance/Support/ACL business ownership into the transport service.

---

## 4. Current reconciliation map

| Area | Classification | Required treatment |
| --- | --- | --- |
| Active `Conversation` / `Message` Messenger runtime | `REUSE/EXTEND` | Preserve working history/runtime. Evolve or migrate deliberately; never delete before canonical cutover. |
| Old `MessengerConversation` / `MessengerTopic` Unified generation | `MIGRATE / SELECTIVE REUSE / DELETE-LATER` | Current service does not use it as active runtime. Inventory DB rows first; do not resurrect L1/L2 architecture. |
| Mandatory Project/Topic assumptions from old Unified design | `DO NOT RETURN` | Target core must support Groups, Direct, standalone Work Spaces and Client conversations without fake mandatory Project root. |
| Human Task Discussion (`TaskDiscussionEntry`) | `MIGRATE` | Preserve full history/provenance/files/replies while moving human discussion to Messaging Core. |
| Task system Activity Feed | `REUSE` | Remains Task/system activity, not converted into human chat messages. |
| Product + Connected Work Space separate conversation assumptions | `MIGRATE/RECONCILE` | Resolve both surfaces to one canonical internal Conversation. |
| `ProductWhatsAppGroupBinding` hard 1:1 relation | `MIGRATE` | Replace with flexible purpose-based bindings; existing bindings backfill as `WORK`. |
| Deal Won WhatsApp create/bind lifecycle | `REUSE/EXTEND` | Keep proven create/bind/failure/outcome semantics; target becomes Product `WORK` binding. |
| Product Client Communication settings | `EXTEND/REPLACE` | Replace one raw group concept with WORK/FINANCE destinations and existing-group selection. |
| Client Messenger external UI | `NEW/REPLACE` | Build separate Client surface; old mixed Internal/External experience is not target UX. |
| Platform RBAC/entity access foundation | `REUSE/EXTEND` | Add conversation participation and external READ/SEND; do not invent a separate global ACL system. |
| Support Ticket case workflow | `REUSE/EXTEND` | Keep SLA/case state; remove public client-composer semantics and link to canonical Client messages. |
| Finance reminder -> Messenger/WhatsApp send path | `NEW integration` | Use FINANCE purpose resolver; do not implement raw Product group sends. |
| WhatsApp Gateway transport/webhook infrastructure | `REUSE/EXTEND` | Keep Gateway as provider transport boundary; NBOS consumes it. |
| Gateway/old docs saying “store returned group id on Product” | `LEGACY DOC / CHANGE` | Provider mapping belongs to External Conversation; Product links by purpose binding. |
| Permanent Telegram ↔ NBOS chat bridge | `DO NOT BUILD` | One-time import only where needed; Telegram notifications remain separate. |
| Old `NBOS-Messanger-App` schema/UI | `OPTIONAL REUSE` | Reuse visual components only if useful; do not constrain domain model to its old schema. |

---

## 5. Canonical Messaging Core migration direction

The exact Prisma model names may be chosen during implementation, but the final runtime must provide the concepts defined by the Canon:

- canonical `Conversation` with strict `INTERNAL` or `CLIENT` zone/surface;
- participants/membership;
- canonical `Message`;
- read state;
- `ConversationLink`/equivalent entity linking;
- `MessageReference`/equivalent source-message linking;
- Drive File Asset attachments;
- external provider account/mapping/event/delivery concepts;
- Product communication bindings;
- Collections/settings.

### Preferred direction

Prefer evolving the currently active message path where it can safely satisfy the new contract instead of copying all active messages into a third store only to obtain cleaner table names.

If new canonical tables are necessary, migration must include stable legacy -> canonical identity mapping and a clear end-state where only one durable message store remains writable.

### Temporary dual-write rule

Dual-write is allowed only when a migration genuinely requires it.

If used:

- one side must be declared authoritative;
- operations must be idempotent;
- divergence must be measurable;
- compatibility duration must be finite;
- removal gate must be recorded before enabling dual-write.

Permanent dual-write is forbidden.

---

## 6. Task Discussion migration — mandatory safe sequence

### Target

Human Task discussion becomes a Messaging Core Conversation embedded in Task Card (`M-TASK-01`). Task Activity remains separate (`M-TASK-02`).

### Existing risk

`TaskDiscussionEntry` is a real separate discussion system with more than visible text.

Preserve at minimum:

- Task association;
- author / actor identity;
- body/content;
- created/edited timestamps and ordering;
- reply relationships;
- attachments/File Asset references;
- AI/system provenance where present;
- audit/activity relationships where present;
- stable migration/source identity.

### Migration sequence

1. **EXPAND** — add/confirm canonical Task Conversation support and legacy-source mapping.
2. **INVENTORY** — count Tasks with discussions, entries, replies, attachments and AI provenance.
3. **BACKFILL** — for Tasks that actually have discussion, create/reuse exactly one Task Conversation and map each legacy entry to a canonical Message.
4. Preserve original authorship/timestamps/replies/attachments/provenance.
5. Make backfill idempotent and safely rerunnable.
6. **VERIFY** — compare per-Task source/migrated counts and representative content topology.
7. Verify permissions and Task Card rendering against the new path.
8. **CUTOVER WRITES** — new human Task messages go only through Messaging Core.
9. **CUTOVER READS** — Task Card reads the canonical conversation.
10. **OBSERVE** — verify Activity, notifications, files, AI context and search.
11. Disable old Task discussion writes.
12. Mark old table/service `DELETE-LATER`.
13. Remove legacy storage only after independent migration evidence/final cleanup gate.

### Hard prohibitions

- no drop/recreate migration;
- no permanent second Task comments source of truth;
- no copying only visible `body` while losing replies/files/provenance;
- no eager creation of empty conversations for every Task;
- no conversion of human discussion into system Activity Feed.

**Why:** Task discussions contain real execution decisions. Losing authorship, order, files or provenance is business-data loss even if text appears to have migrated.

---

## 7. Product WhatsApp binding migration — hard 1:1 -> flexible bindings

### Existing model

Current `ProductWhatsAppGroupBinding` combines Product ownership and provider group identity and enforces uniqueness on both Product and physical group.

Do **not** solve the new requirement by merely deleting one `@unique` constraint and continuing to use the same conceptual model.

### Target

```text
External Conversation
  -> ExternalConversationMapping(provider account + physical chat id)

ProductCommunicationBinding
  -> productId
  -> purpose = WORK | FINANCE
  -> externalConversationId
```

Rules:

- one active WORK destination per Product;
- zero or one explicit FINANCE destination per Product;
- FINANCE absent -> resolver falls back to WORK;
- one External Conversation may serve many Products;
- provider identity remains unique at provider mapping level;
- Product binding is context, not Employee permission.

### Safe migration sequence

1. **EXPAND** — add canonical External Conversation/provider mapping and Product purpose binding while legacy binding remains intact.
2. **INVENTORY** — count legacy bindings, invalid/orphan rows and physical provider identities.
3. For each physical provider group, create/reuse exactly one canonical External Conversation/provider mapping.
4. For every legacy Product binding, create one canonical `WORK` binding to that same physical conversation.
5. Preserve provider/account/group identity and relevant provisioning/status/title/invite/error history.
6. Record legacy binding -> canonical mapping.
7. Do **not** auto-create FINANCE rows for existing Products. Their FINANCE behavior is fallback to WORK.
8. **VERIFY** — every valid legacy Product resolves WORK to the same physical WhatsApp group as before.
9. Verify no physical group is accidentally represented by multiple canonical External Conversations.
10. Introduce one resolver such as `resolveClientDestination(productId, purpose)`.
11. Adapt Product settings and Deal Won reads/writes to canonical WORK/FINANCE binding model.
12. Enable selecting an existing allowed External Conversation for another Product.
13. Verify shared WORK and shared FINANCE scenarios.
14. Move Finance/Subscription/Client Service business sends to purpose resolver.
15. Search/observe for remaining raw Product `groupChatId` business sends.
16. Disable legacy binding writes.
17. Mark legacy table/constraints `DELETE-LATER`.
18. Destructive cleanup only after parity, cutover and independent acceptance.

### Constraint rule

Target uniqueness belongs at the correct layers:

```text
(providerAccount, providerConversationId) -> one provider mapping
(productId, purpose, active)              -> one active destination
externalConversationId                   -> NOT unique across Products
```

### Rollback rule

Before destructive cleanup, rollback must be possible without re-creating any physical WhatsApp group. Leave legacy relationship readable during the compatibility window and switch application paths if rollback is needed.

### Idempotency rule

New create/bind operation identity must include purpose and intended operation/target. `OUTCOME_UNKNOWN` must never trigger blind creation of another physical group.

**Why:** physical WhatsApp groups are external resources. Duplicating or losing their identity during schema migration is substantially harder to repair than a local relational row.

---

## 8. Deal Won migration rule

Keep the useful existing business semantics:

- explicit create or bind/select;
- visible provisioning/failure/outcome state;
- provider/Gateway failure does not incorrectly roll back successful Deal/Product business state once communication provisioning has been attempted/recorded according to the existing flow;
- Extension does not automatically create a new physical client group.

Change ownership target only:

```text
OLD: Product owns one WhatsApp group
NEW: Deal Won resolves Product WORK communication binding
```

Normal Deal Won should not force a FINANCE group. Separate FINANCE configuration is optional and can be done later.

**Migration guardrail:** do not delete the old binding path in the same deployment that first backfills existing Product WORK destinations.

---

## 9. FINANCE communication and automatic reminders

All automatic payment-related reminders use business purpose `FINANCE`, including approved:

- invoice/payment reminders;
- subscriptions;
- hosting/domain payments;
- maintenance/client-service payments;
- other automatic money/payment reminders.

Target call semantics:

```text
Finance/Subscription business logic decides WHAT + WHEN
  -> resolveClientDestination(productId, FINANCE)
  -> explicit FINANCE conversation when configured
  -> otherwise Product WORK conversation
  -> Messaging Core durable outbound
  -> provider adapter / Gateway
```

Finance/Subscription/Client Services must not know a raw Product WhatsApp `groupChatId` after cutover.

### Automatic vs manual communication

These are separate concepts:

```text
Automatic reminder
= system business rule creates outbound FINANCE message

Manual FINANCE chat
= authorized Employee communicates in a normal Client Conversation
```

Client reply remains in the physical conversation that received the reminder.

If FINANCE is absent, reminder/reply live in WORK; the system must not fabricate a second Finance history.

If FINANCE exists, reminder/reply live in that FINANCE conversation.

### Dedicated FINANCE default access template

Default Neetrino-side business participants/access recommendation:

- Owner;
- CEO;
- Finance Director;
- relevant Seller;
- relevant Product PM.

Seller and PM are resolved from context, not hard-coded globally. Developers and other Product employees are not automatically added.

Effective Client READ/SEND authorization still wins over templates.

**Why:** dedicated FINANCE groups exist specifically for clients who want financial discussion separated from operational employees; the Neetrino-side access model should preserve the same separation.

---

## 10. WhatsApp Gateway reconciliation

The existing `neetrino/whatsapp-gateway` remains the provider transport boundary.

Reuse existing account/session/send/inbound webhook/idempotency/routing foundations rather than creating another WhatsApp service.

NBOS target responsibilities:

- canonical conversation/history;
- Product bindings;
- Employee permissions;
- attention routing;
- CRM/Support/Finance links;
- AI policy/context;
- durable outbound orchestration.

Gateway responsibilities:

- WhatsApp session/provider transport;
- normalized inbound event delivery;
- provider send API;
- provider-side identifiers/statuses/health.

Any old instruction to “store returned WhatsApp group id directly on Product” is legacy and must become:

```text
provider chat id
  -> ExternalConversationMapping
  -> Client Conversation
  -> ProductCommunicationBinding(s)
```

Changing NBOS storage must not require recreating existing Gateway sessions or physical WhatsApp groups.

---

## 11. Internal vs Client surface migration

The shared core does not permit a shared unsafe product surface.

Migration rules:

- preserve reusable Internal channel/DM history/primitives;
- build Client Messenger as separate route/entry/navigation;
- do not evolve the old mixed `Internal | External` switch into final architecture;
- Client composer remains locked until explicit authorized `Reply to client` activation;
- server SEND authorization is mandatory;
- Internal route cannot dispatch external provider send;
- Collections are surface-scoped in API/domain validation, not only hidden in UI.

Old mixed UI is `DELETE-LATER` after new routes/navigation are verified.

---

## 12. Product + Connected Work Space reconciliation

Product and its Connected Work Space must converge on one canonical internal Conversation.

Safe sequence:

1. identify existing Product/Workspace chat identities and links;
2. detect duplicates before changing links;
3. when only one side contains real history, make/reuse it as canonical and link both entities;
4. when both sides contain real history, preserve both histories with source provenance or require explicit/manual mapping if automated merge is ambiguous;
5. update Product `Chat` and Work Space `Discussion` to resolve the same `conversationId`;
6. make ensure/creation race-safe so two independent entry points cannot create duplicate conversations.

Never discard one side merely to satisfy the one-conversation invariant.

---

## 13. Permissions and access reconciliation

Reuse NBOS platform/project/product access foundation. Add Messenger-specific effective access:

- direct conversation membership/invite;
- entity-derived defaults where appropriate;
- surface/zone enforcement;
- external `READ` and `SEND` separately;
- management/manual overrides according to platform policy.

### Critical distinction

```text
ConversationLink / ProductCommunicationBinding
= business context
!= Employee authorization
```

Adding SEO Product to Website client group must not silently give all SEO developers permission to read/send in that client conversation.

### Required negative tests

- Client READ without SEND cannot send via API.
- Employee without Client READ cannot open external history.
- adding Product binding does not expand participant access implicitly;
- Shared Collection does not grant conversation access;
- Internal conversation cannot acquire external provider send path through malformed request.

---

## 14. Support reconciliation

Support Ticket remains an internal case-management entity.

Target:

```text
Client Message(s)
  -> stable reference to Ticket
  -> Ticket SLA/category/coverage/assignee/resolution
  -> linked Task(s) for execution
  -> client communication through Client Messenger
```

Remove/disable any final UI/runtime assumption where one Ticket composer toggles between Public and Internal send modes.

Historical Support data is preserved; the communication boundary changes, not the existence of Ticket business state.

---

## 15. Message reference migration rule

Canonical source message is not copied into several independent stores.

Target:

```text
Message(s)
  -> reference from internal forwarded context
  -> Task source reference
  -> Ticket source reference
  -> Deal source reference
```

`Create Task` remains a full human Task creation workflow. Selected messages provide context; Task title/description/assignee/entity links remain real Task fields. Future AI may propose those fields with human confirmation.

---

## 16. Collections reconciliation

Old Unified schema contains Favorite/Collection concepts, but those tables belong to the previous Messenger generation and are not automatically canonical merely because their names are useful.

Slice 0 must inspect row counts/real use.

Target rules remain:

- separate Internal and Client Collections;
- Favorites is built-in personal Collection;
- PERSONAL/SHARED collections;
- one conversation may belong to several Collections;
- shared collection never grants chat access;
- no cross-surface collection mixing.

If old collection tables are empty/test-only, prefer implementing against the chosen canonical runtime without reviving old L1/L2 dependencies.

---

## 17. Data migration standards

Every data-bearing slice must follow these rules.

### Additive first

Deploy new structures before deleting old ones.

### Inventory real data

Code inspection is not enough. Before destructive work, measure relevant database rows and dependencies.

### Backfill must be operationally safe

Backfills must be:

- idempotent;
- resumable/rerunnable;
- observable;
- safe after partial failure;
- able to report migrated/skipped/failed counts.

### Preserve identity

When rows move stores, keep stable source mapping such as `legacySourceType` + `legacySourceId` or an equivalent migration mapping.

### Verify before cutover

As applicable, verify:

- source vs target counts;
- orphan records;
- duplicate records;
- reply/thread topology;
- attachment integrity;
- authors/timestamps;
- AI/audit provenance;
- participant/access integrity;
- provider identity uniqueness;
- Product WORK/FINANCE resolution.

### Avoid long-lived dual-write

Dual-write is temporary only. Define authority, divergence checks and removal gate before enabling it.

### Contract later

Drop old table/field/constraint only after new reads/writes are live, migration parity passes and rollback/observation requirements are satisfied.

---

## 18. Deployment and rollback discipline

For risky migrations prefer separate deploys:

```text
Deploy A — expand schema + compatibility code
Deploy B — backfill + verify
Deploy C — switch writes/reads
Deploy D — cleanup after observation/review
```

Do not bundle first cutover and destructive cleanup.

Before switching writes, document:

- application rollback path;
- whether old data remains readable;
- how data written during compatibility window is reconciled;
- provider-side consequences;
- backup/restore point where required.

External WhatsApp groups must never be recreated merely to make rollback/schema migration simpler.

---

## 19. Cleanup gates

No legacy production-relevant table/field/constraint may be deleted until:

- replacement schema/path exists;
- backfill/mapping is verified;
- new writes use target path;
- representative reads/UI work;
- negative/security tests pass;
- search/static checks find no uncontrolled legacy writes;
- rollback/backup procedure is recorded;
- independent reviewer marks responsible slice `VERIFIED`;
- deletion does not remove an active rollback dependency.

Where risk is material, perform final acceptance before irreversible cleanup and make cleanup a separate reviewed change.

---

## 20. Explicitly prohibited shortcuts

Implementation/review must reject:

- drop-first migration;
- deleting active legacy Conversation/Message history before canonical parity;
- resurrecting old L1/L2 Unified architecture because its tables exist;
- creating a third permanent message store;
- deleting `TaskDiscussionEntry` before proven migration;
- permanent dual Task discussion stores;
- merely removing WhatsApp uniqueness while keeping the wrong ownership model;
- direct Finance/Product raw `groupChatId` sends after binding cutover;
- global External Conversation uniqueness that prevents legitimate Product sharing;
- Product binding silently granting Employee Client access;
- recreating provider groups for schema convenience;
- mixed Internal/Client UI as implementation shortcut;
- public/internal Support composer toggle;
- copying messages into Task/Ticket instead of stable references;
- permanent Telegram chat bridge;
- treating old status/docs as proof of runtime;
- silently modifying an approved decision to fit unexpected code.

If a real runtime conflict makes a canonical decision unsafe/impossible, mark the slice `BLOCKED`, document the evidence and review the architecture explicitly before continuing.

---

## 21. Slice 0 database/runtime inventory still required

This static reconciliation verifies code/schema facts, but implementation Slice 0 must still record actual environment data needed for safe migration:

- row counts for active legacy Messenger tables;
- row counts for old Unified Messenger tables;
- foreign-key/reference dependencies on Unified IDs;
- Tasks with discussion, discussion entries, replies, attachments, AI provenance counts;
- `ProductWhatsAppGroupBinding` row count, orphan/invalid state and provider identity consistency;
- Products with/without bindings;
- current Deal Won/Product Settings call sites;
- current external UI routes/components;
- current realtime/unread paths;
- current Gateway endpoint/webhook/auth contracts;
- any partial Finance/Notification -> WhatsApp code discovered at implementation time.

No message bodies/secrets need to be copied into evidence documents merely to prove counts/shape.

---

## 22. Reconciliation conclusion

The rebuild does not require a big-bang rewrite.

The target strategy is:

```text
keep current runtime operational
  -> choose/evolve one canonical Messaging Core
  -> expand schemas safely
  -> migrate real data deliberately
  -> cut modules over slice-by-slice
  -> verify every transition independently
  -> remove abandoned structures only at the end
```

Highest-risk migrations:

1. `TaskDiscussionEntry` -> canonical Messaging Core;
2. `ProductWhatsAppGroupBinding` hard 1:1 -> flexible WORK/FINANCE Product Communication Bindings;
3. reconciling active legacy Messenger runtime with the unused previous Unified generation **without creating a third permanent store**.

`11-Messenger-Rebuild-Implementation-Checklist.md` is executable only together with this document.
