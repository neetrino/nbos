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

The rebuild target is now defined by:

- `00-Messenger-Overview.md`;
- `01-Internal-Messenger.md`;
- `02-External-Messenger-and-CRM-Inbox.md`;
- `03-Messenger-Architecture.md`;
- `04-Messenger-Integrations.md`;
- `05-Messenger-Permissions-and-UX.md`;
- `08-Messenger-Decision-Register.md`.

## Next required step before code changes

Perform a fresh runtime reconciliation against the current branch and classify existing Messenger schema/code as:

```text
REUSE
EXTEND
MIGRATE
NEW
DELETE-LATER
```

At minimum verify:

- active channel/DM REST routes;
- current Socket.IO handlers;
- current Prisma legacy + preserved unified models;
- existing message/attachment/read-state data;
- current Messenger RBAC/access helpers;
- Product/Task/Work Space integration hooks;
- current WhatsApp Gateway/NBOS integration code;
- any production data that appeared after the 2026-08-11 reset.

Do not reintroduce the old L1/L2/Topics implementation merely because historical migration/schema artifacts remain in the repository.
