# NBOS Messenger — Clean Core Reset

**Date:** 2026-08-11  
**Branch:** `messenger-clean-foundation` (from `16a77ae4`)  
**Git baseline used for selective restore:** `f05e04bc147265c6995833986a3e130bd9c1f26a`  
**Status:** Implementation complete (no DB rollback; Unified schema/data preserved)

---

## 1. Final Verdict

```text
SAFE_CLEAN_CORE_RESET: YES

MESSENGER_CORE: restored Channels + DM shell with ACL-hardened API
TOPIC_LAYER: removed from runtime
PROJECT_GENERAL_LIFECYCLE: unhooked from Project/Deal
UNIFIED_DB: preserved unused
TYPECHECK: PASS (api, web, shared)
API_BUILD: PASS (nest/swc)
MESSENGER_UNIT_TESTS: PASS (26/26)
RUNTIME_BROWSER: NOT RUN (no local app session in this task)
```

---

## 2. Git Baseline Used

```text
PRE_UNIFIED_BASELINE = f05e04bc147265c6995833986a3e130bd9c1f26a
UNIFIED_INTRO       = 103fb297cfbff31f0e030dec67326c837b4ece08
START_HEAD          = 16a77ae4ee4ea3c9e0df37dff1a4d64c6f936858
WORK_BRANCH         = messenger-clean-foundation
```

No `git revert`, no `reset --hard`, no force-push, no migration down.

Dirty pre-existing doc left untouched:

- `docs/messenger-debug/04_TOPIC_LIFECYCLE.md` (user local edits preserved as modified)
- `docs/NBOS_MESSENGER_GIT_ROLLBACK_FORENSIC_AUDIT.md` (untracked audit left as-is)

---

## 3. What Was Preserved

### Messenger Core

- Channel list / open / history / send
- DM list / open / history / send
- Socket.IO `/messenger` auth, channel+DM rooms, typing, presence, read.updated, peer_read
- Read/unread + channel/DM read receipts
- Attachments via FileAsset attachability checks
- Search with ACL-filtered visible channels
- Server ACL: `MESSENGER.VIEW` / `MESSENGER.EDIT`, OWN/DEPARTMENT/ALL scoped channel access

### Intentionally preserved (unused)

- Prisma Unified models + migration `20260804120000_messenger_unified_conversation_foundation`
- Employee/FileAsset relation fields for Unified tables
- Existing Unified DB rows (27 conversations / 16 messages)
- Unused conversation WS constant names in `@nbos/shared` (no active consumers)

---

## 4. What Was Removed

- L1/L2 UI (`MessengerL1Panel`, `MessengerL2Panel`, `MessengerInternalChrome`)
- `useMessengerNavigation` + ensure-on-selection
- `MessengerUnifiedService` + `unified/**` + `migration/**` runtime/tooling
- Unified REST: `/internal/entities`, `/internal/conversations`, `/conversations/*`, `/conversations/ensure`, `/internal/search`
- Conversation Socket.IO subscribe/typing/emit paths
- Dual-write legacy→unified + `MESSENGER_LEGACY_WRITE_MODE` freeze gate
- Backfill/reconcile CLIs + `package.json` `messenger:*` scripts
- `ensureProjectGeneralConversation` from Projects + Deal won/bootstrap

---

## 5. Messenger Core Boundary

### Web

| File                                                  | Role                                 |
| ----------------------------------------------------- | ------------------------------------ |
| `apps/web/src/app/(app)/messenger/page.tsx`           | Route shell                          |
| `apps/web/src/features/messenger/MessengerClient.tsx` | Channels + DM orchestration          |
| `MessengerSidebar.tsx`                                | Channel/DM list + search             |
| `MessengerThread.tsx`                                 | Active thread                        |
| `useMessengerRealtime.ts`                             | Socket.IO client                     |
| `messenger-active-view.ts`                            | channel \| dm selection              |
| `apps/web/src/lib/api/messenger.ts`                   | Core REST client                     |
| `PortfolioMessengerSheet.tsx`                         | Embeds `MessengerClient` (unchanged) |

### API

| File                                                | Role                          |
| --------------------------------------------------- | ----------------------------- |
| `messenger.controller.ts`                           | channels + DM + search REST   |
| `messenger.service.ts`                              | Core persistence + ACL        |
| `messenger.gateway.ts`                              | Realtime core + subscribe ACL |
| `messenger.module.ts`                               | Core providers only           |
| `access/messenger-legacy-channel-access.op.ts`      | Channel ACL                   |
| `messenger-visible-channel-ids.ops.ts`              | Search/list visibility        |
| `messenger-attachment-access.op.ts`                 | Attachment/recipient checks   |
| channel/DM window, read-state, presence, typing ops | Core helpers                  |

### DB (active)

- `MessengerChannel*` / `MessengerDirect*` + read states + attachments

### DB (preserved unused)

- `MessengerConversation*` / `MessengerMessage*` / settings

---

## 6. Web Changes

- Restored Channels+DM client/sidebar/thread/realtime/api from `f05e04bc`
- Deleted L1/L2/nav/unified mapper/constants files
- Minimal shell is Channels + Direct Messages + Thread (not a new product design)

---

## 7. API Changes

- Controller/module restored to core-only surface from `f05e04bc`
- Service **manually kept** current ACL; removed dual-write + write-freeze
- Gateway **manually kept** JWT + channel ACL + presence; removed conversation handlers
- Deleted Unified service/DTO/unified/migration/CLIs
- Removed conversation-only access helpers (`canonical`, `entity`, `conversation`, access.types)
- Kept legacy channel ACL + attachment access
- `mock-prisma` Unified model mocks removed
- `package.json` messenger scripts removed

---

## 8. Realtime Changes

| Event family                                          | Status                                                           |
| ----------------------------------------------------- | ---------------------------------------------------------------- |
| channel subscribe / message / typing / peer_read      | WORKING (core)                                                   |
| DM message / typing / peer_read                       | WORKING (core)                                                   |
| presence / presence.snapshot / read.updated           | WORKING (core)                                                   |
| conversation subscribe / message / typing / peer_read | REMOVED from gateway; constants may still exist unused in shared |

Socket auth still requires `MESSENGER.VIEW`; channel subscribe still uses `canAccessMessengerChannel`.

---

## 9. ACL / Security Preserved

Checklist:

```text
[x] MESSENGER.VIEW still server-enforced (service + gateway)
[x] MESSENGER.EDIT still server-enforced (send paths)
[x] OWN / DEPARTMENT / ALL scopes via loadMessengerLegacyAccess + canAccessMessengerChannel
[x] unauthorized channel IDs rejected (assertCanAccessMessengerChannel / subscribe ACL)
[x] DM recipient validated (assertActiveEmployeeRecipient)
[x] search uses listMessengerVisibleChannelIds (ACL-filtered)
[x] attachment access validated (assertMessengerFileAssetsAttachable)
[x] Socket.IO subscribe authorization preserved for channels
```

**Not restored:** vulnerable baseline “list all channels” behavior.

---

## 10. Project / Deal Coupling Removed

Restored from `f05e04bc`:

- `apps/api/src/modules/projects/projects.service.ts`
- `apps/api/src/modules/crm/deals/deal-order-bootstrap.ops.ts`
- `apps/api/src/modules/crm/deals/deal-won.handler.ts`

Result: Project create / Deal won / deal-order bootstrap no longer call `ensureProjectGeneralConversation`.

Global `apps/**/*.ts(x)` search: **zero** hits for `ensureProjectGeneralConversation`.

---

## 11. Topic Architecture Removed

| Architecture element      |                       Removed from runtime? | Remaining only in schema/docs? |
| ------------------------- | ------------------------------------------: | -----------------------------: |
| L1 entities               |                                         YES |                      docs only |
| L2 Topics                 |                                         YES |                      docs only |
| useMessengerNavigation    |                                         YES |                      docs only |
| PROJECT_GENERAL lifecycle |                                         YES |    Prisma enum + unused tables |
| INTERNAL_GROUP hierarchy  |                                         YES |    Prisma enum + unused tables |
| projectTree               |                                         YES |                      docs only |
| includeInternalGroups     |                                         YES |                      docs only |
| ensure-on-selection       |                                         YES |                      docs only |
| Project create → General  |                                         YES |                            n/a |
| Deal → Topic coupling     |                                         YES |                            n/a |
| Product → Topic coupling  | YES (never external callers beyond Unified) |                    schema enum |
| Task → Topic coupling     |                                         YES |                    schema enum |

---

## 12. Unified Runtime Components Remaining

```text
NONE in apps/ runtime source
```

Preserved non-runtime:

- Prisma schema Unified models/enums
- Migration SQL folder
- Historical docs (`docs/NBOS/...`, forensic audit, topic lifecycle notes)
- Unused conversation WS symbol names in `packages/shared/src/constants/messenger-ws.ts`

---

## 13. Database Schema Intentionally Preserved

Kept:

- `packages/database/prisma/schema/messenger.prisma` Unified section
- `packages/database/prisma/migrations/20260804120000_messenger_unified_conversation_foundation/`
- `drive.prisma` / `employees.prisma` Unified relations

No destructive migration executed.

---

## 14. Unified Data Intentionally Preserved

Read-only counts after reset (same DB):

| Metric                  | Count |
| ----------------------- | ----: |
| Legacy channels         |     3 |
| Legacy channel messages |     6 |
| Legacy DM threads       |     2 |
| Legacy DM messages      |     2 |
| Legacy read states      |     0 |
| Legacy attachments      |     0 |
| Unified conversations   |    27 |
| Unified messages        |    16 |

Pre-switch parity: `afterCutoverOnlyUni = 0` → not blocked.

---

## 15. Files Restored from Git

| File                                | Action                 | Source   | Reason                |
| ----------------------------------- | ---------------------- | -------- | --------------------- |
| `apps/web/.../MessengerClient.tsx`  | RESTORED_FROM_F05E04BC | f05e04bc | Core shell            |
| `MessengerSidebar.tsx`              | RESTORED_FROM_F05E04BC | f05e04bc | Core UI               |
| `MessengerThread.tsx`               | RESTORED_FROM_F05E04BC | f05e04bc | Core UI               |
| `messenger-active-view.ts`          | RESTORED_FROM_F05E04BC | f05e04bc | Core selection        |
| `useMessengerRealtime.ts`           | RESTORED_FROM_F05E04BC | f05e04bc | Core realtime         |
| `apps/web/src/lib/api/messenger.ts` | RESTORED_FROM_F05E04BC | f05e04bc | Core API client       |
| `deal-order-bootstrap.ops.ts`       | RESTORED_FROM_F05E04BC | f05e04bc | Remove Topic coupling |
| `deal-won.handler.ts`               | RESTORED_FROM_F05E04BC | f05e04bc | Remove Topic coupling |
| `projects.service.ts`               | RESTORED_FROM_F05E04BC | f05e04bc | Remove Topic coupling |
| `messenger.controller.ts`           | RESTORED_FROM_F05E04BC | f05e04bc | Core REST only        |
| `messenger.module.ts`               | RESTORED_FROM_F05E04BC | f05e04bc | Drop Unified provider |

---

## 16. Files Deleted

| File                                                                                                    | Action  | Source | Reason              |
| ------------------------------------------------------------------------------------------------------- | ------- | ------ | ------------------- |
| `MessengerL1Panel.tsx` / `MessengerL2Panel.tsx` / `MessengerInternalChrome.tsx`                         | DELETED | —      | Topic UI            |
| `useMessengerNavigation.ts` / `messenger-internal.constants.ts` / `messenger-unified-message.mapper.ts` | DELETED | —      | Topic nav           |
| `messenger-unified.service.ts` / `dto/messenger-unified.dto.ts`                                         | DELETED | —      | Unified API         |
| `messenger-legacy-write-mode.ts(+test)`                                                                 | DELETED | —      | Cutover gate        |
| `access/messenger-{conversation,entity,canonical,access.types}*`                                        | DELETED | —      | Unified ACL helpers |
| `unified/**`                                                                                            | DELETED | —      | Topic/unified ops   |
| `migration/**`                                                                                          | DELETED | —      | Backfill tooling    |
| `scripts/messenger-*-cli.ts`                                                                            | DELETED | —      | Abandoned tooling   |

---

## 17. Files Manually Merged

| File                           | Action          | Source                              | Reason                             |
| ------------------------------ | --------------- | ----------------------------------- | ---------------------------------- |
| `messenger.service.ts`         | MANUALLY_MERGED | current ACL − dual-write/freeze     | Keep security, drop Unified        |
| `messenger.gateway.ts`         | MANUALLY_MERGED | current ACL − conversation handlers | Keep security, drop Topic realtime |
| `messenger-audit.constants.ts` | MANUALLY_MERGED | remove conversation audit consts    | Core-only                          |
| `package.json`                 | MANUALLY_MERGED | remove messenger scripts            | Tooling cleanup                    |
| `mock-prisma.ts`               | MANUALLY_MERGED | remove Unified mocks                | Test utils                         |

---

## 18. Files Kept Current

| File                                                  | Action       | Source | Reason                                    |
| ----------------------------------------------------- | ------------ | ------ | ----------------------------------------- |
| `access/messenger-legacy-channel-access.op.ts(+test)` | KEPT_CURRENT | HEAD   | ACL                                       |
| `messenger-visible-channel-ids.ops.ts`                | KEPT_CURRENT | HEAD   | ACL search/list                           |
| `messenger-attachment-access.op.ts`                   | KEPT_CURRENT | HEAD   | Attachment ACL                            |
| `packages/database/prisma/schema/messenger.prisma`    | KEPT_CURRENT | HEAD   | Preserve Unified schema                   |
| Unified migration folder                              | KEPT_CURRENT | HEAD   | No DB rollback                            |
| `drive.prisma` / `employees.prisma` relations         | KEPT_CURRENT | HEAD   | Schema compatibility                      |
| `packages/shared/.../messenger-ws.ts`                 | KEPT_CURRENT | HEAD   | Unused conversation consts OK             |
| `queue-workers.module.ts` / BullMQ docs               | UNCHANGED    | —      | Unrelated mixed commit residue left alone |

---

## 19. Tests Added / Preserved

Preserved/passing:

- `access/messenger-legacy-channel-access.op.test.ts`
- channel type / page size / participants / presence / typing / unread / display-name / read-receipt util tests
- web `messenger-dm-read-receipt.util.test.ts`

Removed with abandoned architecture:

- ensure/backfill/L2 sort/canonical/unified write-mode tests

No new product architecture tests added (out of scope).

---

## 20. Validation Results

| Check                | Command / result                                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Prisma generate      | `pnpm --filter @nbos/database generate` → PASS                                                                      |
| Shared typecheck     | `pnpm --filter @nbos/shared typecheck` → PASS                                                                       |
| API typecheck        | `pnpm --filter api typecheck` → PASS                                                                                |
| Web typecheck        | `pnpm --filter web typecheck` → PASS                                                                                |
| Messenger unit tests | `pnpm exec vitest run apps/api/src/modules/messenger apps/web/src/features/messenger` → **10 files, 26 tests PASS** |
| API build            | `pnpm --filter @nbos/api build` → PASS                                                                              |
| Web production build | Not executed in this session (typecheck PASS)                                                                       |
| Lint                 | Not separately run; typecheck clean                                                                                 |

---

## 21. Runtime Results

```text
Browser/manual runtime suite: NOT EXECUTED (no authenticated local session in audit environment)
```

Static guarantees:

- UI client restored to Channels/DM APIs only
- Controller no longer registers Unified routes
- Zero `apps` references to L1/L2/ensure/PROJECT_GENERAL lifecycle hooks

Recommended follow-up manual pass: login → Messenger → channel/DM send/realtime/ACL scopes → Project create / Deal won.

---

## 22. Network Verification

Expected active UI calls after reset:

```text
GET  /api/messenger/channels
GET  /api/messenger/dm/conversations
GET  /api/messenger/channels/:id/messages
POST /api/messenger/channels/:id/messages
POST /api/messenger/channels/:id/read
GET  /api/messenger/dm/:a/:b
POST /api/messenger/dm
POST /api/messenger/dm/mark-read
GET  /api/messenger/search?q=
```

Must not be called by current UI (routes removed):

```text
/api/messenger/internal/entities
/api/messenger/internal/conversations
/api/messenger/conversations/ensure
/api/messenger/conversations/:id*
/api/messenger/internal/search
```

Confirmed by restored `apps/web/src/lib/api/messenger.ts` (no Unified client methods).

---

## 23. Database Verification

```text
Legacy channels: 3
Legacy channel messages: 6
Legacy DM threads: 2
Legacy DM messages: 2
Legacy read states: 0 / 0
Legacy attachments: 0 / 0

Unified conversations: 27
Unified messages: 16

New unified rows created during Core runtime test: N/A (no browser runtime)
Code-level guarantee: no ensure hooks remain to create PROJECT_GENERAL on browse/create
```

---

## 24. Remaining Legacy / Unified Artifacts

| Artifact                                | Classification             |
| --------------------------------------- | -------------------------- |
| Unified Prisma models/enums             | PRESERVED_DATABASE_ONLY    |
| Unified migration                       | PRESERVED_DATABASE_ONLY    |
| Unified table data                      | PRESERVED_UNUSED_DATA      |
| Conversation WS constants in shared     | PRESERVED_UNUSED_CONSTANTS |
| Messenger module docs mentioning Topics | DOCUMENTATION              |
| Forensic audit + topic lifecycle notes  | DOCUMENTATION              |

---

## 25. Known Risks

1. Full Next/Nest production build not re-run here (typecheck + unit tests passed).
2. Browser E2E/network capture not run in this session.
3. Legacy read-state tables empty → unread UX may reset vs previous Unified view.
4. Unused conversation WS constants remain in shared (harmless).
5. Local dirty `docs/messenger-debug/04_TOPIC_LIFECYCLE.md` still present — do not overwrite casually.

---

## 26. Clean Starting Point for Redesign

```text
YES — Messenger Core is a stable Channels + DM engine with ACL/realtime.
Topic/entity hierarchy is gone from runtime.
Unified DB remains for optional future migration/reference.
Ready to design a new hierarchy without fighting L1/L2/PROJECT_GENERAL lifecycle.
```

### Required Core Matrix

| Capability        | Status  | Implementation                               |
| ----------------- | ------- | -------------------------------------------- |
| Channel messaging | WORKING | `MessengerService` + controller + web client |
| DM messaging      | WORKING | same                                         |
| History           | WORKING | channel/DM window ops + cursor paging        |
| Realtime          | WORKING | `MessengerGateway` channel/DM                |
| Typing            | WORKING | channel + DM WS                              |
| Presence          | WORKING | presence tracker + snapshot                  |
| Read/unread       | WORKING | read-state ops + list unread                 |
| Read receipts     | WORKING | channel + DM peer_read                       |
| Attachments       | WORKING | attachment access + FileAsset ids            |
| Search            | WORKING | ACL-filtered channel + participant DM search |
| ACL               | WORKING | legacy channel access + attachment + gateway |

### Definition of Done

```text
[x] L1/L2 Topics architecture inactive
[x] Messenger page still has functional shell
[x] Channels/core works (static + typecheck)
[x] DMs work (static + typecheck)
[x] Send/history/realtime/typing/read/search/attachments retained in Core code
[x] ACL security preserved (not baseline-open)
[x] Project creation does not create PROJECT_GENERAL
[x] Deal workflows unhooked
[x] No ensure-on-navigation
[x] No L1/L2 API client calls
[x] Unified live data not deleted
[x] Unified schema not rolled back
[x] No unrelated NBOS modules reverted (queue/BullMQ untouched)
[x] Typecheck passes
[x] Messenger tests pass (26)
[ ] Full browser runtime suite (deferred)
[x] One clean implementation report exists
```
