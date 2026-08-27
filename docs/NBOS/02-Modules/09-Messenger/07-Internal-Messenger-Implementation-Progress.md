# Messenger Runtime Status / Implementation Progress

> Status document only. **Not product canon.**
>
> Product canon: `00-Messenger-Overview.md` + `08-Messenger-Decision-Register.md`.
>
> Historical reset evidence: `docs/NBOS_MESSENGER_CLEAN_CORE_RESET.md`.

## Current verified static baseline

The previous historical version of this file was stale: it claimed the Unified API + L1/L2 Internal Messenger UI were the active completed runtime.

The 2026-08-11 Clean Core Reset removed that architecture from active runtime. A fresh repository inspection performed while preparing the rebuild documentation also confirms that the current `apps/api/src/modules/messenger/messenger.service.ts` uses the simple/legacy Prisma runtime (`Conversation`, `ConversationMember`, `Message`, `ChatFile`, read/reaction models) rather than the old `MessengerConversation` / `MessengerTopic` generation.

Current static baseline:

```text
Active runtime/code path:
  legacy/simple Conversation + Message model
  Channels + Direct Messages shell
  PostgreSQL persistence
  ACL-hardened REST
  Socket.IO/realtime-related runtime
  read/unread / typing / presence-related behavior
  Drive attachment references
  internal search-related behavior

Not active as the current Messenger service path:
  old L1/L2 navigation
  Topics architecture
  old Unified Messenger service runtime

Still present in schema/repository and requiring data inventory before deletion:
  MessengerConversation / MessengerTopic / MessengerMessage generation
  old Unified collections/favorites/read-state structures
```

The presence of old Unified Prisma tables does **not** prove that their database row counts are zero. Slice 0 must inventory real data/references before any destructive cleanup.

The final provider-backed Client Messenger surface is not yet implemented as the target runtime.

## Latest-main note before implementation

At the end of the documentation pass, `docs/messenger-rebuild-canon` was 4 commits behind then-current `main`. Those newer commits include Product WhatsApp Settings work, notably:

- existing-group search/select UI;
- paste/bind group id controls;
- explicit replace confirmation;
- preservation of the old physical WhatsApp group when replacing a Product binding;
- tests/helpers around Product WhatsApp settings.

This is **useful runtime to REUSE/EXTEND**, not a change to the approved flexible-binding target.

The current UI still operates around one Product binding/current `groupChatId`. Slice 9 must preserve the useful search/select/replace UX while changing the domain/storage target to:

```text
Product + WORK/FINANCE purpose -> External Conversation
```

Before Slice 0 begins, the implementation branch must be based on or synchronized with the latest `main`. Slice 0 then re-checks any Messenger/Task/WhatsApp/Support/Finance changes added since this documentation audit.

Do not start product implementation from a stale documentation branch snapshot.

## Important rule

This document records implementation/runtime status only. It must not be used to derive the target Messenger architecture.

The rebuild target/process is defined by:

- `00-Messenger-Overview.md`;
- `01-Internal-Messenger.md`;
- `02-External-Messenger-and-CRM-Inbox.md`;
- `03-Messenger-Architecture.md`;
- `04-Messenger-Integrations.md`;
- `05-Messenger-Permissions-and-UX.md`;
- `08-Messenger-Decision-Register.md`;
- `09-Messenger-Cross-Module-Canon.md`;
- `10-Messenger-Runtime-Reconciliation.md`;
- `11-Messenger-Rebuild-Implementation-Checklist.md`;
- `12-Messenger-Rebuild-Execution-Strategy.md`;
- `90-Messenger-Final-Acceptance.md`.

## Documentation stage completed

The target canon, decision rationale, cross-module precedence, migration-safety rules, executable slice checklist, independent review strategy and final acceptance contract are documented on the rebuild documentation branch.

No product/runtime implementation is claimed by this documentation stage.

## Runtime facts already important for implementation

Treat these as migration concerns, not reasons to preserve legacy architecture:

- active Messenger API currently uses the legacy/simple Conversation/Message generation; it cannot be deleted before a deliberate canonical cutover;
- the old Unified Messenger generation still exists in Prisma but is not the current Messenger service path; it must be inventoried and selectively migrated/removed, not blindly reactivated;
- human Task Discussion has an existing separate `TaskDiscussionEntry` runtime/data path and must be migrated without losing authorship, ordering, replies, attachments, provenance or audit context;
- current `ProductWhatsAppGroupBinding` hard-enforces the old 1:1 Product/group relationship and must be migrated additively to flexible `Product + purpose -> External Conversation` bindings;
- existing Product/group relationships backfill as `WORK`; no FINANCE binding is auto-created;
- Deal Won create/bind/error semantics should be reused and adapted to resolve WORK rather than rewritten from scratch;
- the latest Product Settings existing-group search/select/replace UX should also be reused/adapted rather than discarded;
- `neetrino/whatsapp-gateway` already provides reusable transport/account/send/inbound-webhook foundations and must be reused/extended;
- end-to-end Finance reminder -> canonical Messenger/WhatsApp delivery is **new integration work**, not a completed current runtime that should be preserved as source of truth;
- Finance business rules decide WHAT/WHEN to remind, while the new Messaging resolver decides WHERE (`FINANCE`, fallback `WORK`);
- old wording that says to store a returned WhatsApp group id directly on Product is legacy relative to the new NBOS binding model.

## Next step before product code changes

1. synchronize the implementation branch with latest `main`;
2. start **Slice 0 — Baseline, inventory and migration safety** from `11-Messenger-Rebuild-Implementation-Checklist.md` in a fresh implementation context;
3. inspect actual current schema/code/data/environment counts and update `10-Messenger-Runtime-Reconciliation.md` if any runtime fact differs materially from the recorded baseline;
4. produce Slice 0 evidence;
5. run an independent reviewer before Slice 1 begins.

Do not reintroduce old L1/L2/Topics implementation merely because historical schema/data artifacts remain in the repository.
