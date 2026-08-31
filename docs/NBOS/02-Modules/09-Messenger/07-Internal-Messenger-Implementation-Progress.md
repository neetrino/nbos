# Messenger Runtime Status / Implementation Progress

> Status document only. **Not product canon.**
>
> Primary human-readable canon: `00-Messenger-Master-Canon.md`.
>
> Granular decision ledger: `08-Messenger-Decision-Register.md`.
>
> Runtime/migration truth: `10-Messenger-Runtime-Reconciliation.md`.

## Slice 0 status (not product canon)

Implementer evidence: `20-Slice-00-Baseline.md`. Status `VERIFIED`. Inventoried SHA `302f57f7`. FINDING-01 closed: MetaConversation/MetaMessage classified `MIGRATE` (Client Sales UI remains `NEW`).

## Slice 1 status (not product canon)

Implementer evidence: `21-Slice-01-Messaging-Core.md`. Status `VERIFIED`. Core path = evolved Unified. Dual-write none. Mapping scheduled. FINDING-S1-01/02 closed (HTTP `canonicalKey` removed; Client persist unconditional). Slice 2 may begin.

## Slice 2 status (not product canon)

Implementer evidence: `22-Slice-02-Permissions-Boundary.md`. Status `VERIFIED`. Conversation ACL on Core HTTP. `CLIENT_READ` is a read ceiling; Client write needs a writeable participant or grant `EDIT`. `addReference` requires source/holder conversation READ. Slice 3 may begin.

## Slice 3 status (not product canon)

Implementer evidence: `23-Slice-03-Internal-Base.md`. Status `VERIFIED`. Daily Internal (`/messenger`, Portfolio) writes Core. Mapper is ops-only (`POST .../legacy-map`). Channel/DM remains labeled rollback at `/messenger/legacy`. FINDING-S3-01…S3-06 closed. Slice 4 may begin.

## Slice 4 status (not product canon)

Implementer evidence: `24-Slice-04-Entity-Conversations.md`. Status `VERIFIED`. FINDING-S4-01/02/03/04 closed. Product/Work Space/Deal/Project General ensure on Core with access before create. Slice 5 may begin.

## Current verified static baseline

The previous historical status text was stale and must not be used as runtime proof. Slice 0 re-checked this against `302f57f7` + DB counts (see evidence file).

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

**Slice 3 VERIFIED runtime:** daily Internal Messenger (`/messenger` and Portfolio sheet) reads/writes Messaging Core (`persistAndBroadcast`). Channel/DM tables and `MessengerService` remain as labeled rollback (`/messenger/legacy` only). Mapper is ops-only; not hooked into Channel/DM send. Do not DROP Channel/DM.

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

`Task.chatId` is unused by the Tasks API (leftover unique column; inventoried DB 0 non-null).

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

`/messenger` is Channel+DM. A placeholder Internal | External toggle exists; External is not a working Client product.

Do not preserve or rebuild that mixed switch as the target.

Target surface remains the separate Client Messenger defined by Master Canon and Decision Register.

## WhatsApp Gateway

The existing `neetrino/whatsapp-gateway` remains reusable transport/session infrastructure and already contains account-scoped sending, idempotency, group operations and inbound webhook foundations.

NBOS must reuse/extend it rather than build a second WhatsApp gateway.

## Finance / Support integration status

Finance and Support business modules remain owners of their own state.

Current (non-canonical) send path: Product `groupChatId` for client invoice/subscription/CSR reminders; company `accountingGroupChatId` for official invoices. Support Ticket has no public/internal composer.

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

1. begin Slice 5 (Task Discussion migration) from a fresh implementer chat;
2. independent review of Slice 5 before Slice 6.

No production Messenger rebuild completion is claimed by this documentation stage.
