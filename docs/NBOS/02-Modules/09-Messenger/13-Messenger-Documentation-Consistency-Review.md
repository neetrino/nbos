# Messenger Documentation Consistency Review

> Status: **PASSED — READY FOR IMPLEMENTATION, starting with Slice 0 after synchronizing latest `main`**.
>
> Scope: final independent documentation review of Messenger Canon + runtime reconciliation + implementation strategy. This is not implementation evidence and does not replace Slice 0.

## 1. Review scope

Reviewed as one architecture set:

- `00-Messenger-Overview.md`
- `01-Internal-Messenger.md`
- `02-External-Messenger-and-CRM-Inbox.md`
- `03-Messenger-Architecture.md`
- `04-Messenger-Integrations.md`
- `05-Messenger-Permissions-and-UX.md`
- `06-Messenger-Cleanup-Register.md`
- `07-Internal-Messenger-Implementation-Progress.md`
- `08-Messenger-Decision-Register.md`
- `09-Messenger-Cross-Module-Canon.md`
- `10-Messenger-Runtime-Reconciliation.md`
- `11-Messenger-Rebuild-Implementation-Checklist.md`
- `12-Messenger-Rebuild-Execution-Strategy.md`
- `90-Messenger-Final-Acceptance.md`

Runtime was rechecked against current repository schema/service for the highest-risk areas and against the current `neetrino/whatsapp-gateway` architecture.

---

## 2. Corrections made during final review

The previous version of `10-Messenger-Runtime-Reconciliation.md` contained several stale runtime claims. They were corrected before this review was marked passed.

### Corrected active Messenger runtime

The active normal service path is legacy Internal Messenger Channels + Direct Messages:

```text
MessengerChannel / MessengerChannelMessage
MessengerDirectThread / MessengerDirectMessage
```

not a generic `Conversation / ConversationMember / Message / ChatFile` store.

### Corrected Unified schema inventory

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

It does not currently contain the previously claimed Topic/Collection model family, and `MessengerConversation` does not have a mandatory `projectId`.

### Corrected Task Discussion facts

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

The schema itself does not expose reply/attachment/edit fields. Slice 0 must inspect whether related runtime data exists elsewhere before expanding the migration contract.

`Task.chatId` remains a required runtime investigation item rather than an assumed canonical mapping.

### Corrected Collections baseline

Current Unified schema has a per-user `favorite` setting but no user-created Collection models. Therefore Favorites has a reusable primitive; PERSONAL/SHARED Collections remain new runtime work.

### Latest-main drift recorded

The documentation branch is currently behind latest `main` by 4 commits. Those commits include useful Product WhatsApp Settings search/select/paste/replace behavior. The target flexible binding architecture is unchanged; the implementation must reuse/adapt that UX after synchronizing latest `main`.

---

## 3. Canon consistency result

No unresolved contradiction was found among the approved product decisions.

The following boundaries are consistent across Canon, cross-module rules, checklist and execution strategy:

### Messaging boundary

```text
ONE Messaging Core
TWO separate product surfaces
  - Internal Messenger
  - Client Messenger
```

They are not tabs/modes of one unsafe mixed screen.

### Client safety

- Client composer locked by default.
- Explicit `Reply to client` unlock for current conversation session.
- Conversation switch relocks.
- READ and SEND remain separate permissions.
- No Internal/Public composer toggle.

### Internal navigation

```text
All / Products / Tasks / Deals / Work Spaces / Groups / Direct / Collections
```

`All` is recent activity, not a mandatory Project tree.

### Collections

- Favorites built-in personal behavior.
- PERSONAL and SHARED user Collections.
- no cross-surface Collections.
- Shared Collection never grants access.

### Product + Work Space

Product and its mandatory Connected Work Space resolve the same Internal Conversation.

### Tasks

Human Task Discussion migrates to Messaging Core. Task Activity remains separate system history.

### Message actions

Canonical source messages are referenced, not copied into independent stores. Create Task remains a full Task creation flow.

### Client Messenger

```text
Inbox / Sales / Clients / Collections
```

Support and Finance remain workflows/purposes around canonical Client conversations, not separate message universes.

### Product external communication

```text
Product + purpose -> External Conversation
purpose v1 = WORK | FINANCE
```

- one active WORK destination per Product;
- zero/one explicit FINANCE destination;
- FINANCE fallback to WORK;
- one physical external conversation may serve multiple Products.

### Attention routing

Access and current responsibility are independent. Lifecycle/assignee changes do not create another Conversation.

### WhatsApp boundary

Existing `neetrino/whatsapp-gateway` remains transport/session/provider boundary. NBOS owns business context, history, permissions, routing and bindings.

### Telegram

No permanent Telegram ↔ NBOS internal chat bridge in target architecture.

---

## 4. Runtime migration consistency result

The migration plan now consistently follows:

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

Three critical migrations are explicitly protected:

1. active Channel/DM history -> chosen canonical Messaging Core path;
2. `TaskDiscussionEntry` -> Messaging Core Task Conversation;
3. `ProductWhatsAppGroupBinding` 1:1 -> flexible WORK/FINANCE bindings.

The documentation does not authorize drop-first migration or destructive schema cleanup during first cutover.

---

## 5. `11` checklist review

`11-Messenger-Rebuild-Implementation-Checklist.md` is consistent with the Canon and corrected reconciliation.

It covers:

- schema;
- migrations/backfill;
- API/services;
- permissions;
- realtime;
- Internal UI;
- Client UI;
- WhatsApp/Gateway;
- Product bindings;
- Task migration;
- message references/actions;
- Support/Finance/routing;
- Collections/search/notifications;
- AI boundary;
- tests and negative/adversarial tests;
- audit/cleanup.

No checklist item requires changing an approved product decision.

Task attachment/reply/edit migration language must be interpreted as **preserve where runtime actually has such data**, as clarified by corrected `10`; do not fabricate fields that do not exist.

---

## 6. `12` execution-strategy review

The 12-slice strategy is technically coherent and avoids splitting every product decision into an artificial separate phase.

Default chain remains:

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

This is consistent with migration risk and product boundaries.

---

## 7. No remaining product decision needed before Slice 0

No new architecture question was found that requires the Owner to redesign/approve a product rule before implementation can begin.

The remaining unknowns are runtime facts, not product decisions. They belong in Slice 0, especially:

- real DB row counts;
- whether Unified tables contain production/test/history data;
- exact `Task.chatId` meaning;
- any Task-discussion-related data stored outside `TaskDiscussionEntry`;
- all current Messenger read/write paths;
- latest-main Product WhatsApp settings behavior;
- current Finance/Support send paths;
- exact NBOS webhook consumption of Gateway inbound events;
- production/staging migration constraints.

If one of those facts makes a confirmed Canon rule unsafe or impossible, Slice 0 becomes `BLOCKED` and raises a concrete decision-needed item. It must not silently alter the architecture.

---

## 8. Mandatory precondition before Slice 0

Do not implement from the stale documentation branch snapshot.

First:

```text
synchronize implementation branch with latest main
```

Then perform Slice 0 against that merged/current codebase.

The Canon docs remain the target product truth; latest `main` supplies the freshest runtime to reconcile.

---

## 9. Final documentation verdict

```text
CANON: CONSISTENT
RUNTIME RECONCILIATION: CORRECTED AND SUFFICIENT FOR SLICE 0
IMPLEMENTATION CHECKLIST: READY
EXECUTION STRATEGY: READY
OPEN PRODUCT DECISIONS: NONE
PRODUCTION CODE IMPLEMENTED BY THIS DOCUMENTATION PASS: NO
```

# READY FOR IMPLEMENTATION

The first implementation slice is:

```text
Slice 0 — Baseline, inventory and migration safety
```

Slice 0 must begin only after synchronizing latest `main`, and it must produce independent, runtime-first evidence before Slice 1 is allowed to begin.
