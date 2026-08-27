# Messenger Runtime Reconciliation and Migration Safety

> Status: **required implementation precondition — static reconciliation completed; Slice 0 must refresh against latest `main` + real DB counts before product code changes**.
>
> Product truth: `00-Messenger-Overview.md` + `08-Messenger-Decision-Register.md`.
>
> This document reconciles the approved Messenger canon with the runtime that already exists. It does not redesign the canon to match legacy implementation.

## 1. Core rule

When current runtime conflicts with approved product architecture:

```text
Canon wins for target behavior.
Existing production data/runtime wins for migration safety.
```

Implementation therefore follows:

```text
EXPAND
  -> INVENTORY
  -> BACKFILL / MAP
  -> VERIFY
  -> COMPATIBILITY WINDOW
  -> CUT OVER WRITES
  -> CUT OVER READS
  -> OBSERVE
  -> FREEZE LEGACY
  -> DELETE LEGACY LAST
```

Destructive migration is forbidden until the responsible slice has independent review evidence and its cleanup gate is satisfied.

---

## 2. Reconciliation classifications

Use these labels:

- `REUSE` — existing runtime already satisfies the target contract.
- `EXTEND` — preserve working behavior and add canonical capability.
- `MIGRATE` — working data/runtime must move to another canonical shape.
- `NEW` — target capability materially does not exist yet.
- `DELETE-LATER` — legacy code/data remains during compatibility and is removed only after verified cutover.
- `VERIFY/MISSING` — a claim was not proven strongly enough against current runtime/data.

A reviewer must reject any slice that silently treats `VERIFY/MISSING` as `REUSE`.

---

## 3. Fresh verified runtime baseline

### 3.1 Active Internal Messenger runtime is still legacy Channels + Direct Messages

Current active API path includes:

```text
apps/api/src/modules/messenger/messenger.service.ts
apps/api/src/modules/messenger/messenger.gateway.ts
```

The active service currently reads/writes these Prisma models:

```text
MessengerChannel
MessengerChannelMessage
MessengerChannelMessageAttachment
MessengerChannelReadState

MessengerDirectThread
MessengerDirectMessage
MessengerDirectMessageAttachment
MessengerDirectThreadReadState
```

Observed Prisma calls include:

```text
prisma.messengerChannel
prisma.messengerChannelMessage
prisma.messengerDirectThread
prisma.messengerDirectMessage
prisma.messengerDirectThreadReadState
```

Messages are persisted before Socket.IO emission. Existing ACL helpers, unread/read state, search and Drive-backed attachments are working primitives worth preserving.

Classification: `REUSE + EXTEND`, with migration where the canonical shared Core cannot safely be expressed by the current split Channel/DM stores.

**Important correction:** the active runtime is **not** a generic `Conversation / ConversationMember / Message / ChatFile` store. Any older reconciliation text describing those models as the current service path is stale.

### 3.2 A second additive Unified schema exists, but it is not the active normal service path

Current `packages/database/prisma/schema/messenger.prisma` also contains:

```text
MessengerConversation
MessengerConversationParticipant
MessengerConversationLink
MessengerMessage
MessengerMessageAttachment
MessengerConversationReadState
MessengerUserConversationSetting
```

Current schema does **not** contain the old `MessengerTopic`, `MessengerTopicMember`, `MessengerCollection`, `MessengerCollectionItem`, `MessengerFavorite`, `MessengerDirectKey` model set, and `MessengerConversation` does **not** have a mandatory `projectId` field.

The current Unified model already has useful concepts such as:

- canonical key;
- direct participant pair;
- participants;
- entity links;
- message replies;
- Drive-backed attachments;
- read state;
- per-user pinned/muted/favorite settings.

However, the normal active `MessengerService` still uses Channels/DM tables. Therefore the mere existence of Unified tables does not prove they are production source of truth or that they contain no valuable historical rows.

Classification: `SELECTIVE REUSE / MIGRATE / DELETE-LATER`, subject to Slice 0 DB row inventory and runtime-reference search.

### 3.3 Do not create a third permanent message store

The rebuild must end with one canonical durable Messaging Core, not:

```text
legacy Channel/DM stores
+ additive Unified store
+ new third store
```

If the Unified schema can be safely evolved to satisfy the new canon, prefer that over inventing another generation. If the active Channel/DM data must be moved into it, preserve stable legacy -> canonical identity mapping and prove parity before freezing legacy writes.

### 3.4 Task Discussion is a real separate persistence path

Current `tasks.prisma` contains:

```text
Task.chatId String? @unique
TaskDiscussionEntry
```

`TaskDiscussionEntry` currently stores:

```text
taskId
body
actorType
actorId
actorDisplayName
channelSource?
correlationId?
visibility
createdAt
```

Its schema comment explicitly says Tasks owns the discussion and Messenger is not involved. This conflicts with `M-TASK-01`.

Classification: `MIGRATE`, then legacy discussion write/storage path `DELETE-LATER`.

**Important correction:** the current `TaskDiscussionEntry` schema itself does not expose reply fields, attachment fields or an edited timestamp. Slice 0 must still inspect service/UI/other linked tables before concluding those concepts are absent from real Task discussion behavior, but migration requirements must not claim unsupported schema fields as already present.

`Task.chatId` also requires explicit runtime investigation before reuse. Do not assume it already points to the desired canonical `MessengerConversation`.

### 3.5 Current Product WhatsApp binding hard-enforces 1:1

Current `whatsapp.prisma` has:

```text
ProductWhatsAppGroupBinding.productId   @unique
ProductWhatsAppGroupBinding.groupChatId @unique
```

It also has useful operational state that must not be discarded:

- binding status including `OUTCOME_UNKNOWN` / `NEEDS_RECONCILIATION`;
- `WhatsAppGroupOperation` with a unique dedupe key;
- participant synchronization state;
- client invitation state;
- provider request/error/result metadata.

Classification: binding ownership model `MIGRATE`; operational semantics `REUSE + EXTEND`; old constraints/table `DELETE-LATER` after cutover.

### 3.6 Latest `main` contains useful Product WhatsApp Settings UX

At the end of this documentation pass, `docs/messenger-rebuild-canon` is 4 commits behind current `main`. Those commits include Product WhatsApp Settings improvements:

- search/select an existing group;
- paste a group id;
- explicit replace confirmation;
- replacement does not delete the old physical WhatsApp group;
- supporting tests/helpers.

This runtime remains based on one current Product binding / `groupChatId`, so it does not change the target architecture. It is reusable UX/behavior that Slice 9 should adapt to purpose-based WORK/FINANCE bindings instead of discarding.

Before Slice 0 begins, the implementation branch must be synchronized with latest `main`.

### 3.7 Deal Won flow contains reusable semantics

Existing Product/Deal Won flow already has create/bind and failure/reconciliation concepts. Preserve those business semantics while changing destination ownership from one Product-owned group to Product `WORK` communication binding.

Classification: `REUSE + EXTEND`.

### 3.8 Client Messenger target surface is mostly new

The final separate Client Messenger defined by Canon is not the current completed runtime. Do not preserve an old Internal/External switch merely because placeholder/existing UI exists.

Classification: Client surface `NEW`; conflicting mixed UI `DELETE-LATER` after verified cutover.

### 3.9 Finance -> canonical Client Messenger delivery is new integration

Existing Finance/Subscription/Client Service logic still owns WHAT/WHEN to remind. Canonical Product-purpose destination resolution and durable Client Messenger delivery are not treated as completed runtime.

Classification: `NEW integration` around existing finance business rules.

### 3.10 Existing WhatsApp Gateway is strongly reusable

Fresh review of `neetrino/whatsapp-gateway` confirms:

- Gateway is a standalone transport/session service, not a Messenger UI;
- Project-scoped tokens and multiple WhatsApp accounts exist;
- account-scoped v1 send exists with `Idempotency-Key`;
- MESSENGER accounts expose chat/history reads;
- inbound WAHA events are designed for durable normalized Project webhook delivery;
- webhook delivery is project-scoped and signed;
- outbound idempotency has `PROCESSING / SUCCEEDED / FAILED / OUTCOME_UNKNOWN` semantics;
- Gateway intentionally does not own NBOS Product/Finance/Support/ACL business context.

Classification: `REUSE + EXTEND`.

Do not build a second gateway and do not move NBOS authorization or Product binding ownership into Gateway.

---

## 4. Reconciliation map

| Area                                                         | Classification                         | Required treatment                                                                             |
| ------------------------------------------------------------ | -------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Active `MessengerChannel` / Channel messages                 | `REUSE/EXTEND/MIGRATE`                 | Preserve history, ACL/read/search/file behavior; move deliberately into chosen Core if needed. |
| Active `MessengerDirectThread` / Direct messages             | `REUSE/EXTEND/MIGRATE`                 | Preserve DM identity/history/read state; map safely into canonical Direct conversation.        |
| Existing `MessengerConversation` generation                  | `SELECTIVE REUSE/MIGRATE/DELETE-LATER` | Evaluate as likely canonical foundation; inventory real rows/references first.                 |
| Old L1/L2/Topic architecture                                 | `DO NOT RETURN`                        | No mandatory Topic hierarchy.                                                                  |
| Current `favorite` user setting                              | `REUSE/EXTEND`                         | May seed built-in Favorites behavior; it is not a full Collection system.                      |
| User-created Collections                                     | `NEW`                                  | Implement PERSONAL/SHARED, surface-scoped, ACL-neutral.                                        |
| Human `TaskDiscussionEntry`                                  | `MIGRATE`                              | Move human discussion to Messaging Core; preserve actual existing provenance fields.           |
| `Task.chatId`                                                | `VERIFY/MISSING`                       | Determine real meaning/references before reuse/removal.                                        |
| Task Activity Feed                                           | `REUSE`                                | Remains system activity, not human Message rows.                                               |
| Product + Connected Work Space chat identity                 | `MIGRATE/RECONCILE`                    | Both surfaces must resolve one internal conversation.                                          |
| `ProductWhatsAppGroupBinding` 1:1 ownership                  | `MIGRATE`                              | Replace with Product + purpose -> External Conversation binding.                               |
| WhatsApp operations/participant/invite/reconciliation states | `REUSE/EXTEND`                         | Preserve semantics across binding migration.                                                   |
| Product settings select/paste/replace UX                     | `REUSE/EXTEND`                         | Adapt to WORK/FINANCE destinations.                                                            |
| Deal Won group lifecycle                                     | `REUSE/EXTEND`                         | Resolve/create Product WORK destination.                                                       |
| Client Messenger UI                                          | `NEW/REPLACE`                          | Separate Client product surface.                                                               |
| Platform RBAC/entity access                                  | `REUSE/EXTEND`                         | Add conversation membership and Client READ/SEND separation.                                   |
| Support case workflow                                        | `REUSE/EXTEND`                         | Keep internal case state; link to canonical Client messages.                                   |
| Finance reminder destination/delivery                        | `NEW integration`                      | Resolve FINANCE, fallback WORK; no raw group id dependency.                                    |
| WhatsApp Gateway                                             | `REUSE/EXTEND`                         | Keep transport/session/provider boundary.                                                      |
| Permanent Telegram bridge                                    | `DO NOT BUILD`                         | One-time migration only; notifications may remain.                                             |

---

## 5. Canonical Messaging Core migration direction

The final Core must provide:

- strict `INTERNAL` vs `CLIENT` conversation zone/surface;
- canonical durable Conversation + Message;
- participants/membership;
- read state;
- entity links;
- source message references;
- Drive File Asset attachments;
- provider account/conversation mapping + delivery/event state;
- Product communication bindings;
- Collections/settings;
- database-first persistence with realtime as transport.

### Preferred technical direction

Evaluate the existing `MessengerConversation` generation first as the likely foundation because it already provides participants, links, message replies, read state and settings. Extend it only where Canon requires capabilities it lacks.

Do not decide this from schema names alone. Slice 0 must prove:

- actual row counts;
- whether any production code still writes/reads it;
- whether previous migrations/backfills populated it;
- whether Channel/DM -> Unified identity mapping already exists;
- whether it can be evolved without destructive conflict.

If another approach is chosen, the reviewer must explicitly prove why it does not create a third durable store.

### Dual-write rule

Dual-write is temporary only. If required:

- declare the authoritative side;
- make writes idempotent;
- measure divergence;
- define a finite compatibility window;
- define the removal gate before enabling it.

Permanent dual-write is forbidden.

---

## 6. Task Discussion migration

Target: human Task Discussion uses Messaging Core (`M-TASK-01`); Task Activity remains separate (`M-TASK-02`).

### Preserve what actually exists

At minimum, map:

- Task association;
- body;
- `actorType`;
- `actorId`;
- `actorDisplayName`;
- `channelSource`;
- `correlationId`;
- visibility;
- original `createdAt`;
- stable legacy source identity.

If Slice 0 finds replies, files, edit history, AI/audit links or other discussion-related records elsewhere in runtime, include them in the migration contract before backfill.

### Safe sequence

1. Inventory `Task.chatId`, Tasks with discussion and `TaskDiscussionEntry` rows.
2. Add/confirm canonical lazy Task Conversation support + legacy source mapping.
3. Backfill only Tasks that actually have human discussion.
4. Map each legacy entry idempotently.
5. Preserve original actor/provenance/timestamp/visibility fields.
6. Verify per-Task counts/order/content/provenance.
7. Verify Task access controls against direct Messenger conversation access.
8. Switch new human writes to Messaging Core.
9. Switch Task Card reads to Messaging Core.
10. Observe search/notifications/AI context/file behavior as applicable.
11. Freeze legacy discussion writes.
12. Keep table `DELETE-LATER` until final cleanup gate.

Hard prohibitions:

- drop-first migration;
- eager empty Task conversations;
- converting Activity records into human messages;
- fabricating migration fields that do not exist;
- deleting `TaskDiscussionEntry` before parity is proven.

---

## 7. Product WhatsApp binding migration

### Target

```text
External Conversation
  -> provider mapping (account + provider chat id)

ProductCommunicationBinding
  -> productId
  -> purpose = WORK | FINANCE
  -> externalConversationId
```

Rules:

- exactly one active WORK destination per Product;
- zero/one explicit FINANCE destination;
- FINANCE absent -> WORK fallback;
- one External Conversation may serve multiple Products;
- provider chat identity is unique at provider mapping layer;
- Product binding does not grant Employee access.

### Safe sequence

1. Add External Conversation/provider mapping + Product purpose binding while legacy binding remains.
2. Inventory bindings, statuses, group ids, operations, participants, invitations and invalid/orphan states.
3. Create/reuse exactly one provider mapping per physical group/account identity.
4. Backfill every valid legacy Product binding as WORK.
5. Do not auto-create FINANCE bindings.
6. Preserve/relink operation, participant, invite and reconciliation history required for audit/runtime continuity.
7. Verify every existing Product resolves WORK to the same physical WhatsApp group as before.
8. Introduce one central resolver such as `resolveClientDestination(productId, purpose)`.
9. Adapt Product Settings select/paste/create/replace UX to WORK/FINANCE.
10. Adapt Deal Won to WORK.
11. Move Finance/Subscription/Client Service sends to purpose resolver.
12. Verify shared WORK and shared FINANCE groups.
13. Freeze legacy binding writes.
14. Keep old table/constraints `DELETE-LATER` until final acceptance.

Correct target uniqueness:

```text
(providerAccountId, providerConversationId) -> unique provider mapping
(productId, purpose)                        -> one active canonical destination
externalConversationId                     -> reusable across Products
```

Never retry `OUTCOME_UNKNOWN` by blindly creating another physical group or sending a duplicate message.

---

## 8. Deal Won rule

Keep:

- create group / bind existing group;
- visible provisioning/failure/reconciliation state;
- safe treatment of provider `OUTCOME_UNKNOWN`;
- Product/Deal business success independent from blindly rolling back an uncertain external side effect;
- Extension not automatically creating a new physical client group.

Change target ownership:

```text
OLD: Product owns one physical group binding
NEW: Deal Won resolves/creates Product WORK destination
```

FINANCE remains optional and configurable later.

---

## 9. Finance communication

Finance/Subscriptions/Client Services decide WHAT and WHEN.

Messaging decides WHERE and records delivery/history:

```text
business rule
  -> resolveClientDestination(productId, FINANCE)
  -> explicit FINANCE if configured
  -> otherwise WORK
  -> canonical Client Message
  -> durable outbound operation
  -> Gateway account/provider mapping
```

After cutover, business modules must not depend on raw Product `groupChatId`.

Automatic reminders and normal human Finance chat are separate mechanisms but remain in the same resolved Client conversation history.

---

## 10. Gateway boundary

Gateway owns:

- WhatsApp account/session;
- WAHA boundary;
- provider send;
- provider-side idempotency/outcome state;
- normalized inbound delivery to Project webhook;
- provider chat/history transport capability.

NBOS owns:

- canonical message history;
- Product bindings;
- Employee access/SEND permissions;
- attention routing;
- CRM/Support/Finance links;
- AI policy/context;
- durable business-side outbound orchestration.

NBOS must consume the existing Gateway contract rather than recreate WAHA/session logic.

---

## 11. Internal vs Client surface migration

- preserve reusable Internal history/primitives;
- build Client Messenger as a separate route/entry/navigation surface;
- Client composer starts locked;
- explicit authorized `Reply to client` unlocks only the current conversation working session;
- changing conversation relocks it;
- server SEND authorization remains mandatory;
- no Internal/Public toggle;
- Internal APIs cannot dispatch external provider sends;
- Collections are zone-scoped server-side.

---

## 12. Product + Connected Work Space reconciliation

Product and its mandatory Connected Work Space must resolve the same internal conversation.

Before relinking:

1. inventory current Product/Workspace chat identifiers;
2. inspect `Task.chatId` and any other reused chat-id conventions separately;
3. detect duplicate conversations/history;
4. preserve both histories if both contain real data;
5. link Product and Work Space to one chosen canonical conversation;
6. make ensure/create race-safe.

Never discard a history-bearing conversation solely to satisfy the one-conversation invariant.

---

## 13. Permissions

Effective access is not the same thing as business binding:

```text
ConversationLink / ProductCommunicationBinding
!= Employee authorization
```

Required controls:

- Internal access through platform/entity/conversation policy;
- Client READ separated from SEND;
- explicit invite can be read-only;
- Shared Collection never grants access;
- Product binding never grants access;
- attention ownership never grants access;
- management override remains explicit/auditable.

Negative tests must include forged API/UI attempts, not only hidden buttons.

---

## 14. Support

Support Ticket remains internal case management:

- category/priority/SLA/coverage;
- assignee;
- resolution;
- links to canonical Client messages;
- linked Tasks.

Client continues communicating in Client Messenger. Do not build a Ticket-level Public/Internal composer toggle.

---

## 15. Message references

Source message remains canonical.

Task/Ticket/Deal/forward workflows use stable references to one or more source messages. `Create Task` opens the real Task creation flow; selected messages are context, not an automatic final Task body.

References must preserve authorization when opening/previewing source context.

---

## 16. Collections

Current schema has a per-user `favorite` flag in `MessengerUserConversationSetting`, but no current user-created Collection models.

Therefore:

- Favorites primitive may be reused/migrated;
- PERSONAL/SHARED Collections are `NEW` domain/runtime work;
- one conversation may belong to multiple Collections;
- Collections are strictly Internal or Client;
- Shared Collection membership never changes ACL.

Do not revive removed Topic/L1/L2 architecture to obtain grouping.

---

## 17. Data migration standards

Every data-bearing slice must:

- inventory real rows/dependencies;
- add schema before destructive change;
- use idempotent/rerunnable backfill;
- preserve legacy identity mapping;
- verify source/target counts and orphans;
- verify authors/timestamps/provenance where applicable;
- verify attachment/reference/provider identity integrity where applicable;
- define rollback before cutover;
- freeze old writes before deleting old storage.

Code inspection alone is not enough for destructive migration approval.

---

## 18. Deployment / rollback discipline

Prefer:

```text
Deploy A — additive schema + compatibility path
Deploy B — backfill + verification
Deploy C — write/read cutover
Deploy D — cleanup after observation/review
```

Do not combine first cutover and irreversible cleanup.

External WhatsApp groups must never be recreated just to simplify migration or rollback.

---

## 19. Cleanup gates

No production-relevant legacy table/field/constraint may be deleted until:

- replacement runtime exists;
- backfill/mapping parity is proven;
- new writes use canonical path;
- reads/UI use canonical path;
- negative/security tests pass;
- static/runtime search finds no uncontrolled old writes;
- rollback/backup evidence exists;
- independent reviewer marks the responsible slice `VERIFIED`;
- removal no longer destroys an active rollback dependency.

---

## 20. Prohibited shortcuts

Reject:

- drop-first migration;
- deleting Channel/DM history before parity;
- creating a third permanent message store;
- reintroducing Topics/L1/L2;
- assuming Unified tables are active or empty without evidence;
- deleting `TaskDiscussionEntry` before migration proof;
- inventing Task reply/file fields that current schema does not contain;
- merely removing WhatsApp `@unique` constraints while keeping wrong ownership semantics;
- direct Finance raw `groupChatId` sends after cutover;
- Product binding granting Client access;
- duplicate provider sends/groups after `OUTCOME_UNKNOWN`;
- mixed Internal/Client UI shortcut;
- Support Public/Internal toggle;
- copying messages instead of referencing them;
- permanent Telegram chat bridge;
- changing a Canon decision silently to fit legacy code.

---

## 21. Slice 0 runtime/data inventory still required

Static reconciliation is complete enough to plan work, but Slice 0 must verify the current implementation branch after synchronizing latest `main` and record:

### Messenger

- counts for legacy Channel/DM tables;
- counts for existing Unified tables;
- existing migration/backfill mapping if any;
- all current read/write call sites;
- realtime/unread/search/attachment paths;
- whether any external system references Unified ids.

### Tasks

- meaning/usage of `Task.chatId`;
- Tasks with `TaskDiscussionEntry` rows;
- entry counts and actual runtime fields;
- any discussion-related files/replies/edit/audit records stored outside `TaskDiscussionEntry`.

### WhatsApp/Product

- current bindings and invalid/orphan states;
- physical group/account identity consistency;
- operation/participant/invitation counts;
- Deal Won call sites;
- latest Product Settings select/paste/replace call sites;
- any remaining direct `groupChatId` business sends.

### Client/Finance/Support/Gateway

- actual current Client UI routes/components;
- Finance/Subscription/Client Service send paths;
- Support communication paths;
- NBOS -> Gateway account/token/send contracts;
- Gateway -> NBOS webhook endpoint/HMAC/replay/idempotency handling;
- delivery/status reconciliation behavior.

Do not copy message bodies/secrets into evidence merely to prove counts or shape.

---

## 22. Migration risk register

| Risk                                                             | Severity | Primary mitigation                                                                     |
| ---------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------- |
| Losing Channel/DM history while selecting canonical Core         | Critical | additive mapping + parity + old store retained until cutover                           |
| Creating a third Messenger store                                 | Critical | choose/evolve one canonical path in Slice 1; reviewer rejects parallel permanent store |
| Assuming Unified schema is active/empty                          | High     | Slice 0 row counts + read/write/reference inventory                                    |
| Losing Task discussion provenance                                | Critical | field-accurate idempotent backfill + per-Task verification                             |
| Misusing `Task.chatId`                                           | High     | determine actual meaning before reuse/removal                                          |
| Breaking existing Product group relationships                    | Critical | legacy -> WORK backfill preserving provider identity                                   |
| Duplicate WhatsApp groups/messages on uncertain provider outcome | Critical | preserve dedupe/idempotency + `OUTCOME_UNKNOWN` reconciliation                         |
| Breaking latest Product WhatsApp Settings UX                     | Medium   | reuse/adapt select/paste/replace behavior to purpose bindings                          |
| Client READ accidentally implying SEND                           | Critical | server permission split + adversarial tests                                            |
| Product binding granting employee visibility                     | Critical | binding/context separated from ACL                                                     |
| Finance bypassing canonical history                              | High     | central purpose resolver + durable Client Message before provider dispatch             |
| Shared Collection becoming ACL bypass                            | High     | server/database zone checks + effective ACL filtering                                  |
| Stale docs branch used for implementation                        | High     | sync latest `main` before Slice 0                                                      |

---

## 23. Reconciliation conclusion

The target does not require a big-bang rewrite.

```text
sync latest main
  -> Slice 0 inventory
  -> select/evolve one canonical Messaging Core
  -> migrate Channel/DM data safely where required
  -> enforce Internal/Client security boundary
  -> migrate entity/Task discussions
  -> connect Gateway + Client surface
  -> migrate Product communication bindings
  -> cut Finance/Support/routing over
  -> harden
  -> final acceptance
  -> destructive cleanup last
```

Highest-risk migrations are:

1. reconciling active Channel/DM stores with the existing Unified generation without creating a third store;
2. `TaskDiscussionEntry` -> canonical Messaging Core while preserving real provenance;
3. hard 1:1 `ProductWhatsAppGroupBinding` -> flexible WORK/FINANCE bindings without changing physical WhatsApp identity or duplicating side effects.

`11-Messenger-Rebuild-Implementation-Checklist.md` and `12-Messenger-Rebuild-Execution-Strategy.md` are executable only together with this reconciliation document.
