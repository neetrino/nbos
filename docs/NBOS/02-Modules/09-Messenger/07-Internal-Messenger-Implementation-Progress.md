# Messenger Runtime Status / Implementation Progress

> Status document only. **Not product canon.**
>
> Product canon: `00-Messenger-Overview.md` + `08-Messenger-Decision-Register.md`.
>
> Runtime reset evidence: `docs/NBOS_MESSENGER_CLEAN_CORE_RESET.md`.

## Current recorded baseline

The previous contents of this file were stale: they claimed the Unified API + L1/L2 Internal Messenger UI were the active completed runtime.

That architecture was intentionally removed by the 2026-08-11 Clean Core Reset.

Recorded post-reset state:

```text
Active runtime:
  legacy Channels + Direct Messages shell
  PostgreSQL persistence
  ACL-hardened REST
  Socket.IO realtime
  read/unread / typing / presence
  Drive attachment references
  basic internal search

Removed from active runtime:
  L1/L2 navigation
  Topics architecture
  Unified Conversation REST/service runtime
  Project General lifecycle hooks
  ensure-on-selection
  legacy -> unified dual-write/backfill tooling

Preserved but unused:
  Unified Messenger Prisma schema/data
```

External provider-backed Client Messenger was not implemented by that reset.

## Important rule

This document records historical/current implementation claims only. It must not be used to derive the target Messenger architecture.

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

The target canon, migration-safety rules, executable slice checklist, independent review strategy and final acceptance contract are now documented on the rebuild documentation branch.

No product/runtime implementation is claimed by this documentation stage.

## Runtime facts already important for implementation

Treat these as migration concerns, not reasons to preserve legacy architecture:

- human Task Discussion has an existing separate runtime/data path and must be migrated without losing authorship, ordering, attachments, provenance or audit context;
- the existing Product ↔ WhatsApp group relationship was designed around hard one-to-one ownership and must be migrated additively to flexible `Product + purpose -> External Conversation` bindings;
- existing Product/group relationships backfill as `WORK`; no FINANCE binding is auto-created;
- Deal Won create/bind/error semantics should be reused and adapted to resolve WORK rather than rewritten from scratch;
- `neetrino/whatsapp-gateway` already provides reusable transport/account/send/inbound-webhook capabilities and must be reused/extended;
- the current end-to-end Finance reminder -> Messenger/WhatsApp send path remains `VERIFY/MISSING` until Slice 0 confirms it first-hand;
- old Gateway wording that says to store a returned WhatsApp group id directly on Product is legacy relative to the new NBOS binding model.

## Next step before product code changes

Start **Slice 0 — Baseline, inventory and migration safety** from `11-Messenger-Rebuild-Implementation-Checklist.md` in a fresh implementation context.

Slice 0 must inspect actual current schema/code/data and update `10-Messenger-Runtime-Reconciliation.md` if any runtime fact differs materially from the recorded baseline.

After Slice 0 implementation evidence is complete, an independent reviewer must verify it before Slice 1 begins.

Do not reintroduce old L1/L2/Topics implementation merely because historical migration/schema artifacts remain in the repository.
