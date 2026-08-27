# Messenger Runtime Status / Implementation Progress

> Status document only. **Not product canon.**
>
> Primary human-readable canon: `00-Messenger-Master-Canon.md`.
>
> Granular decision ledger: `08-Messenger-Decision-Register.md`.
>
> Runtime/migration truth: `10-Messenger-Runtime-Reconciliation.md`.

## Current verified static baseline

The previous historical status text was stale and must not be used as runtime proof.

The active normal Internal Messenger service path currently uses the legacy Channel/Direct models:

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

The active API service uses Prisma paths such as:

```text
prisma.messengerChannel
prisma.messengerChannelMessage
prisma.messengerDirectThread
prisma.messengerDirectMessage
```

This active history/runtime cannot be deleted before deliberate migration/cutover.

## Additive Unified generation also present

`packages/database/prisma/schema/messenger.prisma` also contains an additive Unified generation:

```text
MessengerConversation
MessengerConversationParticipant
MessengerConversationLink
MessengerMessage
MessengerMessageAttachment
MessengerConversationReadState
MessengerUserConversationSetting
```

The current normal `MessengerService` does not use that generation as its primary message read/write path.

Important corrections to old status assumptions:

- there is no current `MessengerTopic` / Topic hierarchy model family in this schema snapshot;
- there is no current user-created Collection model family in this schema snapshot;
- `MessengerConversation` does not have the previously claimed mandatory `projectId`;
- existing `favorite` state is only a reusable primitive, not proof that the target PERSONAL/SHARED Collections already exist.

Slice 0 must inventory actual database rows and dependencies before deciding what to reuse, migrate or delete.

## Task Discussion runtime

Human Task discussion currently has a real separate persistence model:

```text
TaskDiscussionEntry
```

Direct schema fields include:

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

The schema does not directly expose the previously claimed reply/attachment/edit fields. Slice 0 must inspect whether any related data exists elsewhere before defining the exact backfill contract.

`Task.chatId` remains an explicit investigation item.

Target remains unchanged: human Task Discussion migrates safely to Messaging Core; Task Activity remains separate.

## Product WhatsApp runtime

Current `ProductWhatsAppGroupBinding` still represents the legacy one-Product/one-physical-group model and hard-enforces uniqueness around Product/group identity.

Existing useful Product WhatsApp behavior must be reused/adapted where compatible, including current settings/runtime capabilities such as:

- visible binding/status/error state;
- create group;
- search/select existing group;
- paste/bind group id where operationally required;
- explicit replace flow without deleting the old physical group;
- participant synchronization;
- client invitation/retry behavior;
- operation/status history and reconciliation/error visibility.

These are useful runtime/UX capabilities, not reasons to preserve the old ownership model.

Target remains:

```text
Product + WORK/FINANCE purpose
  -> Client/External Conversation
  -> provider mapping
```

Existing Product/group relations migrate as `WORK`. FINANCE is not auto-created and falls back to WORK when no explicit FINANCE binding exists.

## Client Messenger runtime

The final separate provider-backed Client Messenger surface is not yet the completed target runtime.

Do not preserve or rebuild a mixed `Internal | External` switch merely because historical UI/runtime existed.

Target surface remains the separate Client Messenger defined by Master Canon and Decision Register.

## WhatsApp Gateway

The existing `neetrino/whatsapp-gateway` remains reusable transport/session infrastructure and already contains account-scoped sending, idempotency, group operations and inbound webhook foundations.

NBOS must reuse/extend it rather than build a second WhatsApp gateway.

## Finance / Support integration status

Finance and Support business modules remain owners of their own state.

End-to-end canonical Client Messenger delivery is implementation work:

- Finance decides WHAT/WHEN to remind;
- Messenger resolves WHERE through `FINANCE` with WORK fallback;
- Support Ticket remains internal case management;
- client-visible communication remains in Client Messenger.

Do not treat partial/legacy direct provider paths as target architecture.

## Latest-main rule before implementation

Do **not** hard-code a commit-behind count in documentation. `main` can move while documentation is being reviewed.

Before Slice 0 begins:

1. implementation branch must be based on or synchronized with the latest `main`;
2. Slice 0 must re-check any Messenger/Task/WhatsApp/Support/Finance/AI changes added since this static audit;
3. any materially changed runtime fact must update `10-Messenger-Runtime-Reconciliation.md` and Slice 0 evidence.

Recent `main` changes in the Product WhatsApp area are primarily useful UI/settings work and do not change the approved flexible-binding architecture. They must still be inspected fresh after synchronization.

## Canon precedence

This status file never defines target product behavior.

Target product/architecture truth is:

1. `00-Messenger-Master-Canon.md`;
2. `08-Messenger-Decision-Register.md`;
3. `09-Messenger-Cross-Module-Canon.md` for affected module boundaries.

Migration/runtime implementation uses additionally:

- `10-Messenger-Runtime-Reconciliation.md`;
- `11-Messenger-Rebuild-Implementation-Checklist.md`;
- `12-Messenger-Rebuild-Execution-Strategy.md`;
- `90-Messenger-Final-Acceptance.md`.

## Next step before product code changes

1. synchronize implementation branch with latest `main`;
2. start **Slice 0 — Baseline, inventory and migration safety** in a fresh implementation context;
3. inspect actual schema/code/data/environment state;
4. produce Slice 0 evidence;
5. run independent review;
6. begin Slice 1 only after Slice 0 is `VERIFIED`.

No production Messenger rebuild implementation is claimed by this documentation stage.
