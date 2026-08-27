# Messenger Documentation Consistency Review

> Status: **PASSED — READY FOR IMPLEMENTATION, starting with Slice 0 after synchronizing latest `main`**.
>
> Scope: final independent documentation review of the Master Canon, Decision Register, cross-module canon, runtime reconciliation, implementation checklist and execution strategy. This is not implementation evidence and does not replace Slice 0.

## 1. Review scope

Reviewed as one architecture set:

- `00-Messenger-Master-Canon.md` — primary human-readable product + architecture truth;
- `00-Messenger-Overview.md`;
- `01-Internal-Messenger.md`;
- `02-External-Messenger-and-CRM-Inbox.md`;
- `03-Messenger-Architecture.md`;
- `04-Messenger-Integrations.md`;
- `05-Messenger-Permissions-and-UX.md`;
- `06-Messenger-Cleanup-Register.md`;
- `07-Internal-Messenger-Implementation-Progress.md`;
- `08-Messenger-Decision-Register.md`;
- `09-Messenger-Cross-Module-Canon.md`;
- `10-Messenger-Runtime-Reconciliation.md`;
- `11-Messenger-Rebuild-Implementation-Checklist.md`;
- `12-Messenger-Rebuild-Execution-Strategy.md`;
- `90-Messenger-Final-Acceptance.md`.

Cross-module Messenger-sensitive documentation was also rechecked, especially Tasks/Task Card, Support and Product WhatsApp communication.

The highest-risk runtime facts were rechecked against current repository schema/service and the current `neetrino/whatsapp-gateway` architecture.

---

## 2. Master Canon result

`00-Messenger-Master-Canon.md` was created as the single document a human can read to verify the intended system without reading every implementation/migration document.

It contains:

- product goal and scope discipline;
- one Messaging Core / two separate product surfaces;
- Internal navigation, All inbox, Products, Tasks, Deals, Work Spaces, Groups and Direct;
- Collections/Favorites;
- message actions/references/Create Task;
- Client Inbox/Sales/Clients navigation;
- visual separation and locked composer;
- READ/SEND separation;
- Product client lifecycle;
- WORK/FINANCE purpose bindings and shared external conversations;
- Deal Won behavior;
- Finance reminders/fallback/access defaults;
- Support boundary;
- attention routing;
- Employee authorization vs physical WhatsApp participants;
- WhatsApp Gateway boundary;
- durable delivery/outcome-unknown handling;
- realtime/search/files/Mail/Notifications/Telegram/AI/mobile boundaries;
- modular-monolith architecture direction;
- migration safety and legacy-runtime reconciliation;
- required-vs-optional UX scope;
- explicit forbidden shortcuts;
- end-to-end business examples;
- coverage index for every approved Decision ID in `08-Messenger-Decision-Register.md`.

No approved Decision ID is missing from the Master coverage index.

---

## 3. Corrections preserved from runtime reconciliation

### Active Messenger runtime

The active normal Internal Messenger service path is Channel + Direct Message runtime:

```text
MessengerChannel / MessengerChannelMessage
MessengerDirectThread / MessengerDirectMessage
```

not a generic `Conversation / ConversationMember / Message / ChatFile` store.

### Additive Unified schema

Current `messenger.prisma` contains the additive Unified models:

```text
MessengerConversation
MessengerConversationParticipant
MessengerConversationLink
MessengerMessage
MessengerMessageAttachment
MessengerConversationReadState
MessengerUserConversationSetting
```

The current schema snapshot does not contain the previously claimed Topic/Collection model family, and `MessengerConversation` does not have the previously claimed mandatory `projectId`.

### Task Discussion

Current `TaskDiscussionEntry` directly stores:

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

The schema itself does not expose reply/attachment/edit fields. Slice 0 must inspect whether any related runtime data exists elsewhere before expanding the migration contract.

`Task.chatId` remains a required investigation item.

### Collections

Current Unified schema has reusable per-user `favorite` state but no target PERSONAL/SHARED Collection model family. Therefore user-created Collections remain new runtime work.

### Product WhatsApp

Current Product WhatsApp runtime still uses the old single Product binding/group domain shape, but recent UI/settings work adds useful behavior that must be reused/adapted:

- status/error visibility;
- create group;
- search/select existing group;
- paste/bind where required;
- explicit replace without deleting the old physical group;
- participant sync;
- client invitation/retry;
- operation/status history.

These features do not change the target `Product + purpose -> Client/External Conversation` architecture.

---

## 4. Latest-main drift rule

Do **not** record a fixed `N commits behind main` number as architectural truth. It becomes stale while development continues.

Current review confirmed that `main` continued moving during this documentation pass. The newer changes inspected in the Messenger-sensitive area were primarily Product WhatsApp UI/settings changes rather than a conflicting product architecture.

Mandatory rule:

```text
before Slice 0
  -> synchronize implementation branch with latest main
  -> re-run runtime inventory against that exact codebase
```

The Canon defines the target. Latest `main` defines the runtime that must be reconciled.

---

## 5. Product/UX consistency result

No unresolved contradiction was found among the approved product decisions.

### Messaging boundary

```text
ONE Messaging Core
TWO separate product surfaces
  - Internal Messenger
  - Client Messenger
```

Not tabs/modes of one unsafe mixed screen.

### Internal UX

```text
All / Products / Tasks / Deals / Work Spaces / Groups / Direct / Collections
```

`All` is flat recent activity, not a mandatory Project tree.

Product + mandatory Connected Work Space resolve one Internal Conversation.

Task Card remains the primary execution surface; human Discussion uses Messaging Core while Activity remains system history.

### Client UX

```text
Inbox / Sales / Clients / Collections
```

Client surface has explicit external visual context and a locked-by-default composer.

`Reply to client` unlock is session/conversation scoped; switching conversations relocks. READ and SEND are separate and server authorization remains mandatory.

Support and Finance are not separate Messenger universes.

### Collections

- Favorites built-in personal behavior;
- PERSONAL/SHARED user Collections;
- no cross-surface Collections;
- Shared Collection never grants access.

### Message-to-work

Canonical messages are referenced rather than copied into independent truth stores. Create Task remains a full Task creation flow. Threads are optional, not forced workflow.

---

## 6. Product external communication consistency result

Target remains:

```text
Product + purpose -> Client/External Conversation
purpose v1 = WORK | FINANCE
```

For configured Product client communication:

- one active WORK destination;
- zero/one explicit FINANCE destination;
- FINANCE fallback to WORK;
- one physical external conversation may serve multiple Products;
- Product binding does not grant Employee access.

A Product row does not silently auto-create a WhatsApp group. Pending/failed/unconfigured setup is an operational state, not permission for competing WORK destinations.

Deal Won resolves WORK through create or bind/select-existing. FINANCE remains optional configuration.

Finance business logic decides WHAT/WHEN; Messenger resolves WHERE. Finance/Subscription code must not depend on raw Product `groupChatId` after cutover.

Dedicated FINANCE conversations remain full Client conversations with restricted business participation defaults, not hidden notification sinks.

---

## 7. Support/CRM/Task boundary consistency

Support Ticket remains internal case management:

```text
Client Message
-> Ticket case/SLA/coverage
-> Task/Work Space/CRM execution
-> client response through original Client Messenger conversation
```

No Ticket-level Public/Internal composer toggle.

Internal Deal discussion and Client Sales conversation remain separate conversations.

Extension normally continues parent Product work/client communication rather than auto-creating duplicate conversations.

---

## 8. Architecture consistency result

The target remains appropriately strong without premature distribution:

- NBOS modular monolith;
- one shared Messaging Core;
- strict INTERNAL/CLIENT surface boundary;
- Postgres/database as durable source of truth;
- realtime as transport, never history source;
- durable outbox/queue for external sends;
- provider adapters;
- existing WhatsApp Gateway reused/extended;
- Drive owns physical files;
- Mail remains a separate persistence model;
- Notifications remain notification delivery;
- no permanent Telegram chat bridge;
- Client AI remains governed by AI Platform policy and exact conversation scope.

No new Messenger microservice is required by the current product.

---

## 9. Runtime migration consistency result

The migration plan consistently follows:

```text
expand
-> inventory
-> idempotent backfill/map
-> verify parity
-> cut over writes
-> cut over reads
-> observe
-> freeze old writes
-> delete later
```

Critical protected migrations:

1. active Channel/DM history -> chosen canonical Messaging Core path;
2. `TaskDiscussionEntry` -> Messaging Core Task Conversation;
3. `ProductWhatsAppGroupBinding` 1:1 -> flexible WORK/FINANCE bindings.

The documentation does not authorize drop-first migration, provider-group recreation for schema convenience, permanent dual writes or a third permanent Messenger persistence generation.

---

## 10. Implementation checklist/execution strategy result

`11-Messenger-Rebuild-Implementation-Checklist.md` remains executable and consistent with Canon + corrected runtime reconciliation.

`12-Messenger-Rebuild-Execution-Strategy.md` remains technically coherent:

```text
0 Baseline / reconciliation
  -> 1 Messaging Core
      -> 2 Permissions / surface boundary
          -> 3 Internal base
          -> 4 Entity conversations
               -> 5 Task migration
               -> 6 Message references/actions
          -> 7 Client surface
               -> 8 WhatsApp Gateway integration
                    -> 9 Flexible Product bindings
                         -> 10 Finance / Support / routing
                              -> 11 Hardening / cleanup readiness
                                   -> Final Acceptance
```

Review workflow remains mandatory:

```text
Fresh Implementation Chat
-> READY_FOR_REVIEW
-> Independent Review Chat
-> VERIFIED or CHANGES_REQUIRED
-> next dependent Slice only after VERIFIED
```

---

## 11. No remaining product decision needed before Slice 0

No architecture/product question was found that requires a new Owner decision before implementation can begin.

Remaining unknowns are runtime facts and belong in Slice 0, including:

- real database row counts;
- real usage of additive Unified tables;
- exact `Task.chatId` meaning;
- any Task-discussion related data outside `TaskDiscussionEntry`;
- latest Messenger read/write paths;
- latest Product WhatsApp settings/runtime paths;
- Finance/Support client-send paths;
- NBOS consumption of Gateway inbound events;
- staging/production migration constraints.

If a fresh runtime fact makes a confirmed Canon rule unsafe or impossible, Slice 0 becomes `BLOCKED` and raises a concrete decision-needed item. It must not silently alter the architecture.

---

## 12. Final documentation verdict

```text
MASTER CANON: COMPLETE
DECISION COVERAGE: COMPLETE
PRODUCT/UX CONSISTENCY: PASSED
CROSS-MODULE CONSISTENCY: PASSED
RUNTIME RECONCILIATION: CORRECTED AND SUFFICIENT FOR SLICE 0
MIGRATION SAFETY: PASSED
IMPLEMENTATION CHECKLIST: READY
EXECUTION STRATEGY: READY
OPEN PRODUCT DECISIONS: NONE
PRODUCTION CODE IMPLEMENTED BY THIS DOCUMENTATION PASS: NO
```

# READY FOR IMPLEMENTATION

First implementation stage:

```text
synchronize with latest main
-> Slice 0 — Baseline, inventory and migration safety
-> independent review
-> Slice 1 only after Slice 0 VERIFIED
```
