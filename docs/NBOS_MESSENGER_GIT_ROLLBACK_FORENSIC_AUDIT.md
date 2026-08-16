# NBOS Messenger — Git Rollback Forensic Audit

**Audit date:** 2026-08-11  
**Auditor role:** Principal Engineer (read-only Git + read-only DB)  
**Scope:** Determine clean pre–Unified/Internal Messenger baseline and safest rollback strategy  
**Status:** Investigation only — **no rollback executed**

---

## 1. Executive Verdict

```text
SAFE TO ROLLBACK:
YES WITH CONDITIONS

RECOMMENDED BASELINE:
f05e04bc147265c6995833986a3e130bd9c1f26a

LAST KNOWN GOOD LEGACY MESSENGER:
f05e04bc147265c6995833986a3e130bd9c1f26a
(Messenger UI polish last touched at 6e3ca86e; full app tip before Unified is f05e04bc)

UNIFIED INTRO COMMIT:
103fb297cfbff31f0e030dec67326c837b4ece08

RECOMMENDED STRATEGY:
HYBRID (new rollback branch + selective path restore + preserve ACL + leave unified DB)

DATABASE ROLLBACK REQUIRED:
NO

DATA MIGRATION REQUIRED BEFORE CODE ROLLBACK:
NO (for current connected DB)
UNKNOWN (for any other environment until the same parity queries are run)

SECURITY FIXES TO PRESERVE:
3 (legacy channel visibility ACL, MESSENGER.VIEW/EDIT enforcement on legacy paths, attachment attachability checks)
```

### DATA GO/NO-GO (current connected DB)

```text
MESSAGES SAFE AFTER ROLLBACK: YES
READ STATES SAFE: YES (with expected unread reset — legacy read tables empty)
ATTACHMENTS SAFE: YES
DM DATA SAFE: YES
```

### Conditions

1. Rollback on a **new branch** from current `dev-Karo` HEAD (do not rewind `main`).
2. **Do not** `git revert` blindly without preserving Phase-4 ACL introduced inside the Unified commit.
3. **Do not** drop unified tables during code rollback.
4. Revert CRM/Project `ensureProjectGeneralConversation` call sites (or restore those files from baseline).
5. Preserve / re-apply legacy ACL hardening that did not exist at baseline.
6. Re-run live parity queries on every target environment before merge.
7. Commit or stash the dirty doc `docs/messenger-debug/04_TOPIC_LIFECYCLE.md` before rollback work.

---

## 2. Current Git State

```text
Current branch:            dev-Karo
Current HEAD:              16a77ae4ee4ea3c9e0df37dff1a4d64c6f936858
Remote:                    origin https://github.com/neetrino/nbos
Tracking:                  origin/dev-Karo (up to date)
Working tree:              dirty
Untracked files:           none
Modified files:            docs/messenger-debug/04_TOPIC_LIFECYCLE.md
Staged files:              none
```

HEAD subject:

`feat(messenger): integrate project general conversation handling in deal and project creation`

---

## 3. Current Branch History

Linear tip on `dev-Karo`:

```text
* 16a77ae4 (HEAD -> dev-Karo, origin/dev-Karo) feat(messenger): integrate project general...
* 103fb297 feat(messenger): enhance unified messaging features and access controls
* f05e04bc fix(database): avoid statement_timeout in Neon pooler URL options
* … (auth/notifications/scheduler/finance/etc — unrelated to Unified Messenger)
```

`origin/main` tip (`9f31d18d`) does **not** contain Unified Messenger:

- `git merge-base --is-ancestor 103fb297 origin/main` → false
- `origin/main` messenger schema still legacy-only (Channels + DM models)
- `origin/main...HEAD` ≈ **5 behind / 2 ahead** (the two Messenger commits are the tip ahead of main)

**Implication:** Unified Messenger currently lives on `dev-Karo` only (pushed), not on `main`.

---

## 4. Messenger Commit Timeline

### Pre-Unified legacy Messenger (selected)

| Commit                | Date       | Subject                                                                       |
| --------------------- | ---------- | ----------------------------------------------------------------------------- |
| `1f90ea63`            | earlier    | Phase 4 Messenger initial                                                     |
| `60c9fc51`            | earlier    | RBAC + JWT-bound senders                                                      |
| `e4350d7e`            | earlier    | Wire messenger page to API                                                    |
| `059bfbfe`            | earlier    | Prisma persistence channels/DMs                                               |
| `e28610ec`…`4146f7af` | earlier    | Socket.IO, typing, presence, read receipts                                    |
| `2361f0d1`            | 2026-05-06 | Tail-first history, cursor paging, search indexes                             |
| `06e10587`            | earlier    | Internal P0 polish                                                            |
| `9f6ac258`            | earlier    | Share messenger thread UI with task sheet                                     |
| `6e3ca86e`            | 2026-07-14 | Messenger layout/styling polish (last Messenger-only UI touch before Unified) |

### Unified era (exactly 2 commits after baseline)

| #   | Commit     | Date       | Subject                                                                                       | Messenger impact                                             | Other impact                                                                                                 | Revert whole commit?                                                                                                   |
| --- | ---------- | ---------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| 1   | `103fb297` | 2026-08-10 | feat(messenger): enhance unified messaging features and access controls                       | Introduces Unified schema, APIs, UI L1/L2, backfill CLI, ACL | Adds bullmq audit doc; touches `queue-workers.module.ts`, `package.json`, `drive.prisma`, `employees.prisma` | **UNSAFE_TO_REVERT_WHOLE_COMMIT** (loses ACL; mixed docs/runtime)                                                      |
| 2   | `16a77ae4` | 2026-08-10 | feat(messenger): integrate project general conversation handling in deal and project creation | Project-general ensure/reconcile, nav/L2 polish              | **CRM deals + Projects create paths**                                                                        | **UNSAFE_TO_REVERT_WHOLE_COMMIT** if used alone without path strategy; safer to restore deal/project files selectively |

---

## 5. Unified Messenger Introduction

```text
UNIFIED_INTRO_COMMIT = 103fb297cfbff31f0e030dec67326c837b4ece08
Date:   2026-08-10 18:40:15 +0400
Author: Karo Gabrielyan
Subject: feat(messenger): enhance unified messaging features and access controls
```

Pickaxe first appearance (all symbols enter at `103fb297`, except later follow-ups):

| Symbol                               | First commit                               |
| ------------------------------------ | ------------------------------------------ |
| `MessengerConversation`              | `103fb297`                                 |
| `MessengerUnifiedService`            | `103fb297`                                 |
| `useMessengerNavigation`             | `103fb297` (extended in `16a77ae4`)        |
| `internal/conversations`             | `103fb297`                                 |
| `MessengerL1Panel`                   | `103fb297`                                 |
| `PROJECT_GENERAL` / `INTERNAL_GROUP` | `103fb297`                                 |
| `ensureProjectGeneralConversation`   | `16a77ae4` (wiring into CRM/Projects)      |
| `ConversationLink` (code)            | `103fb297` (docs mention earlier in canon) |

Stat: **57 files, +5251 / −828** in `103fb297` alone.

---

## 6. Last Pre-Unified Messenger State

```text
PRE_UNIFIED_BASELINE = f05e04bc147265c6995833986a3e130bd9c1f26a
Date:   2026-07-27 19:24:48 +0400
Author: Karo Gabrielyan
Subject: fix(database): avoid statement_timeout in Neon pooler URL options
```

This is the **parent of `103fb297`**.

### Candidate comparison

| Candidate                       | Commit     | Messenger state                                                  | Known problems                                                      | Recommended                                           |
| ------------------------------- | ---------- | ---------------------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------- |
| Parent of Unified intro         | `f05e04bc` | Full legacy Channels+DM stack + all NBOS work through 2026-07-27 | No Phase-4 channel ACL yet (all channels listed)                    | **YES — code restore baseline**                       |
| Last Messenger UI polish        | `6e3ca86e` | Same Messenger feature set; older non-Messenger NBOS tip         | Rewinding whole repo to this loses weeks of auth/notifications/etc. | Messenger file content only if needed; not branch tip |
| History/search feature complete | `2361f0d1` | Feature-complete legacy MVP                                      | Older than polish; missing later UX                                 | Not preferred                                         |

`6e3ca86e` and `2361f0d1` are ancestors of `f05e04bc`. Restoring Messenger **paths** from `f05e04bc` already includes that polish.

---

## 7. Recommended Baseline Commit

```text
RECOMMENDED_MESSENGER_BASELINE

commit:  f05e04bc147265c6995833986a3e130bd9c1f26a
date:    2026-07-27 19:24:48 +0400
author:  Karo Gabrielyan
subject: fix(database): avoid statement_timeout in Neon pooler URL options

why this commit:
- Immediate parent of UNIFIED_INTRO_COMMIT
- Contains complete legacy Channels + DM Messenger (API, web, WS, Prisma legacy models)
- Preserves all non-Messenger NBOS work present before Unified landed
- Avoids rewriting months of unrelated history
```

Also:

```text
UNIFIED_INTRO_COMMIT = 103fb297cfbff31f0e030dec67326c837b4ece08
LAST_KNOWN_GOOD_LEGACY_MESSENGER_COMMIT = f05e04bc147265c6995833986a3e130bd9c1f26a
```

---

## 8. Old Messenger Architecture

At `f05e04bc`:

### Old frontend

- Page: `apps/web/src/app/(app)/messenger/page.tsx` → `MessengerClient`
- Layout: `MessengerSidebar` + `MessengerThread`
- Navigation: Channels list + DM peers (not L1/L2 entity/topic)
- Zones: internal/external toggle in client state
- APIs: `/api/messenger/channels`, `/channels/:id/messages`, `/dm/*`, `/search`
- State: React local state + `useMessengerRealtime`
- Embedded: `PortfolioMessengerSheet` wraps `MessengerClient embedded`

### Old backend

- Module: `apps/api/src/modules/messenger/*`
- Service: `MessengerService` (channels + DMs)
- Controller routes: channels CRUD/messages/read, DM conversations/send/mark-read, search
- Realtime: Socket.IO namespace `/messenger` — channel/DM subscribe, typing, presence, read.updated, peer_read
- ACL: permission gates `MESSENGER.VIEW` / `MESSENGER.EDIT` at UI; **server channel listing was open to all channels** for any viewer with access (`listMessengerVisibleChannelIds` returned all ids)

### Old DB

Legacy tables only:

- `MessengerChannel` / `MessengerChannelMessage` / `MessengerChannelMessageAttachment` / `MessengerChannelReadState`
- `MessengerDirectThread` / `MessengerDirectMessage` / `MessengerDirectMessageAttachment` / `MessengerDirectThreadReadState`
- Enum: `MessengerChannelType` = `PROJECT | GENERAL | ANNOUNCEMENT`

Migrations already present before Unified:

- `20260430120000_messenger_internal_tables`
- `20260430143000_messenger_read_states`
- `20260430233500_messenger_p0`
- `20260506220000_messenger_message_content_trgm`

---

## 9. Current Messenger Architecture

At `HEAD` (`16a77ae4`):

### Frontend

- L1 entities (`MessengerL1Panel`) + L2 conversations (`MessengerL2Panel`) + chrome
- `useMessengerNavigation` drives selection
- Primary APIs: `/api/messenger/internal/entities`, `/internal/conversations`, `/conversations/*`, `/conversations/ensure`
- Legacy channel/DM client helpers still exist in `messengerApi` but UI path is unified

### Backend

- `MessengerUnifiedService` + `unified/*` ops
- `access/*` ACL (legacy channel + conversation + entity)
- Dual-write: **legacy → unified only** (`dualWriteLegacyMessageToUnified`)
- Write mode gate: `MESSENGER_LEGACY_WRITE_MODE` (default `enabled`)
- Backfill/reconcile CLIs
- CRM/Projects call `ensureProjectGeneralConversation` on project create / deal won / deal order bootstrap

### DB

Additive Unified models:

- `MessengerConversation`, `MessengerConversationParticipant`, `MessengerConversationLink`
- `MessengerMessage`, `MessengerMessageAttachment`
- `MessengerConversationReadState`, `MessengerUserConversationSetting`
- Enums: `PROJECT_GENERAL`, `PRODUCT`, `DEAL`, `TASK`, `DIRECT`, `INTERNAL_GROUP`, …

Legacy tables **untouched** by migration SQL (additive only).

---

## 10. Architecture Delta

| Area               | Baseline                  | Current                                           |
| ------------------ | ------------------------- | ------------------------------------------------- |
| Nav model          | Channels + DMs            | L1 entities + L2 conversations + topics           |
| Message SoT (UI)   | Legacy tables             | Unified tables                                    |
| Dual-write         | none                      | legacy→unified best-effort                        |
| Reverse dual-write | n/a                       | **none** (unified send does not write legacy)     |
| ACL                | coarse; list-all channels | Phase-4 scoped channel/conversation ACL           |
| External hooks     | none                      | Deal/Project ensure PROJECT_GENERAL               |
| WS events          | channel/dm                | + conversation subscribe/message/typing/peer_read |

---

## 11. Messenger Commits After Baseline

```text
git log f05e04bc..HEAD --oneline --reverse
103fb297 feat(messenger): enhance unified messaging features and access controls
16a77ae4 feat(messenger): integrate project general conversation handling in deal and project creation
```

| Commit     | Date       | Subject                             | Classification                | Messenger changes                     | Other changes                                                                            |
| ---------- | ---------- | ----------------------------------- | ----------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------- |
| `103fb297` | 2026-08-10 | unified messaging + access controls | **MIXED_MESSENGER_AND_OTHER** | Unified foundation + ACL + UI rewrite | bullmq doc; queue-workers AuditModule import; prisma relation fields; package scripts    |
| `16a77ae4` | 2026-08-10 | project general in deal/project     | **MIXED_MESSENGER_AND_OTHER** | ensure/reconcile/nav                  | `deal-order-bootstrap.ops.ts`, `deal-won.handler.ts`, `projects.service.ts`, mock-prisma |

**Count after baseline:** 2 commits.

---

## 12. Mixed Commits

### `103fb297` — UNSAFE_TO_REVERT_WHOLE_COMMIT

Non-Messenger / mixed paths:

- `docs/architecture/bullmq-git-history-audit.md` (unrelated audit doc bundled)
- `apps/api/src/runtime/queue-workers.module.ts` (adds `AuditModule` import)
- `packages/database/prisma/schema/drive.prisma` / `employees.prisma` (relation fields for unified models)
- `package.json` (messenger CLI scripts)

Also embeds **security ACL** that must not be discarded with a naive revert.

### `16a77ae4` — UNSAFE_TO_REVERT_WHOLE_COMMIT (for blind revert of range)

If reverted whole:

- removes Project/Deal conversation ensure (desired for clean restart)
- also reverts messenger ensure/reconcile internals (OK if deleting Unified)
- must be coordinated with path deletes so Projects/CRM still compile

**Conclusion:** do **not** recommend `git revert 103fb297^..HEAD`.

---

## 13. File-Level Change Map

`git diff --name-status f05e04bc..HEAD` (Messenger boundary + externals):

| File                                                                                                                                                                     | Baseline             | Current                |  Messenger-only? | Safe restore from baseline?                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- | ---------------------- | ---------------: | ---------------------------------------------------------- |
| `apps/web/src/features/messenger/MessengerClient.tsx`                                                                                                                    | Channels+DM client   | Unified L1/L2 client   |           mostly | **RESTORE**                                                |
| `MessengerSidebar.tsx` / `MessengerThread.tsx` / `useMessengerRealtime.ts` / `messenger-active-view.ts`                                                                  | legacy               | modified               |              yes | **RESTORE**                                                |
| `apps/web/src/lib/api/messenger.ts`                                                                                                                                      | legacy API           | unified+legacy         |              yes | **RESTORE**                                                |
| New web: `MessengerL1Panel`, `MessengerL2Panel`, `MessengerInternalChrome`, `useMessengerNavigation`, `messenger-internal.constants`, `messenger-unified-message.mapper` | absent               | present                |              yes | **DELETE_NEW_FILE**                                        |
| `apps/api/.../messenger.controller/gateway/module/service/types`                                                                                                         | legacy               | hybrid                 |           mostly | **MANUAL_MERGE** (keep ACL)                                |
| `messenger-visible-channel-ids.ops.ts`                                                                                                                                   | list-all             | ACL-filtered           |         security | **KEEP_CURRENT** / preserve ACL                            |
| New `access/*`, `messenger-attachment-access.op.ts`                                                                                                                      | absent               | present                | security+unified | **KEEP** ACL pieces; drop conversation-only if unused      |
| New `unified/*`, `migration/*`, `messenger-unified.service.ts`, DTOs, write-mode, scripts                                                                                | absent               | present                |              yes | **DELETE_NEW_FILE** (after CRM/Project unhook)             |
| `packages/shared/.../messenger-ws.ts`                                                                                                                                    | channel/dm           | +conversation          |           mostly | **MANUAL_MERGE** or restore + keep unused exports harmless |
| `packages/database/.../messenger.prisma`                                                                                                                                 | legacy               | legacy+unified         |           schema | **KEEP_CURRENT** (leave additive models)                   |
| Migration `20260804120000_*`                                                                                                                                             | absent               | present                |           schema | **KEEP** in repo + DB                                      |
| `drive.prisma` / `employees.prisma` relations                                                                                                                            | no unified relations | yes                    |           schema | **KEEP_CURRENT** while tables remain                       |
| CRM/Projects files                                                                                                                                                       | no ensure            | ensure PROJECT_GENERAL |         external | **RESTORE_FROM_BASELINE**                                  |
| `queue-workers.module.ts`                                                                                                                                                | no AuditModule       | AuditModule added      | unclear coupling | **MANUAL_MERGE** / inspect; prefer keep if harmless        |
| `package.json` scripts                                                                                                                                                   | none                 | backfill/reconcile     |          tooling | **MANUAL_MERGE** (remove scripts when CLIs deleted)        |
| Docs `07-Internal-Messenger-Implementation-Progress.md`, `docs/messenger-debug/*`                                                                                        | absent               | present                |             docs | optional keep for history                                  |
| `docs/architecture/bullmq-git-history-audit.md`                                                                                                                          | absent               | present                |        unrelated | **KEEP_CURRENT**                                           |

---

## 14. External Messenger Integrations

Introduced by Unified work:

| Integration                          | Path                                                                    | Effect if Messenger-only restore without cleanup                   |
| ------------------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Project create                       | `apps/api/src/modules/projects/projects.service.ts`                     | compile break if `ensure*` deleted                                 |
| Deal order bootstrap                 | `apps/api/src/modules/crm/deals/deal-order-bootstrap.ops.ts`            | compile break                                                      |
| Deal won                             | `apps/api/src/modules/crm/deals/deal-won.handler.ts`                    | compile break                                                      |
| Portfolio sheet                      | `PortfolioMessengerSheet.tsx`                                           | **unchanged**; embeds `MessengerClient` → auto follows restored UI |
| Task sheet shared thread UI          | pre-existing share (`9f6ac258`)                                         | existed before baseline tip; verify after restore                  |
| Notifications / Drive / RBAC modules | no Unified conversation dependency found outside Messenger+CRM/Projects | OK                                                                 |

Global search: `MessengerConversation` / `conversations/ensure` / `internal/entities` usage outside Messenger is limited to **CRM deals + Projects** (+ tests/mocks).

---

## 15. Database Migration History

| Migration                                                      | Commit       | Change                       | Additive/destructive           | Revert risk                          |
| -------------------------------------------------------------- | ------------ | ---------------------------- | ------------------------------ | ------------------------------------ |
| `20260430120000_messenger_internal_tables`                     | pre-baseline | legacy channels/DMs          | additive (historical)          | do not touch                         |
| `20260430143000_messenger_read_states`                         | pre-baseline | legacy read states           | additive                       | do not touch                         |
| `20260430233500_messenger_p0`                                  | pre-baseline | P0 tweaks                    | additive                       | do not touch                         |
| `20260506220000_messenger_message_content_trgm`                | pre-baseline | search indexes               | additive                       | do not touch                         |
| **`20260804120000_messenger_unified_conversation_foundation`** | `103fb297`   | unified tables + enums + FKs | **additive**; legacy untouched | **High if dropped** — leave in place |

Migration header explicitly states: no backfill, no dual-write in SQL; legacy tables intentionally untouched.

---

## 16. Legacy Schema Compatibility

Compared `f05e04bc` vs `HEAD` for legacy models:

| Model                               | Same as baseline? | Notes     |
| ----------------------------------- | ----------------- | --------- |
| `MessengerChannel`                  | yes               | unchanged |
| `MessengerChannelMessage`           | yes               | unchanged |
| `MessengerChannelMessageAttachment` | yes               | unchanged |
| `MessengerChannelReadState`         | yes               | unchanged |
| `MessengerDirectThread`             | yes               | unchanged |
| `MessengerDirectMessage`            | yes               | unchanged |
| `MessengerDirectMessageAttachment`  | yes               | unchanged |
| `MessengerDirectThreadReadState`    | yes               | unchanged |
| `MessengerChannelType` enum         | yes               | unchanged |

**Verdict:** legacy schema is backward compatible. Old app can run with unified tables present (unused).

```text
Can old Messenger code run while unified tables still exist?
YES — preferred approach
```

---

## 17. Unified Data Currently Present

Read-only live counts (connected DB via `createPrismaClient`, 2026-08-11):

| Object                     | Count |
| -------------------------- | ----: |
| Legacy channels            |     3 |
| Legacy DM threads          |     2 |
| Legacy channel messages    |     6 |
| Legacy DM messages         |     2 |
| Legacy channel read states |     0 |
| Legacy DM read states      |     0 |
| Legacy attachments (ch+dm) |     0 |
| Unified conversations      |    27 |
| Unified links              |    19 |
| Unified participants       |    26 |
| Unified messages           |    16 |
| Unified read states        |    13 |
| Unified attachments        |     0 |

Conversations by type: `PROJECT_GENERAL` 19, `INTERNAL_GROUP` 6, `DIRECT` 2.

---

## 18. Message Data Compatibility

```text
Legacy channel message count: 6
Legacy DM message count:      2
Unified message count:        16

Messages existing only unified: 8
Messages existing only legacy:  0 (channel) + 0 (dm)
Mapped/shared IDs:              8
```

Unified-only breakdown:

- `INTERNAL_GROUP`: 6 (seed-dated 2026-03-10; no legacy channel equivalent by id)
- `DIRECT`: 2 (seed-dated 2026-03-11; distinct from shared legacy DM ids)

Post-cutover (`created_at >= 2026-08-10`):

```text
unified messages after cutover: 0
unified-only after cutover:     0
```

**Interpretation for this DB:** no live Unified-only traffic after the Aug 10 code landing; seed/demo unified rows exist, but **all legacy channel/DM messages are present in legacy tables**. Old Channels+DM UI will show the complete legacy corpus.

Code risk remains for **any other environment** where users sent via Unified UI (unified send does not write legacy).

---

## 19. Read-State Compatibility

```text
legacy channel read states: 0
legacy DM read states:      0
unified read states:        13
```

Rolling back UI → unread badges likely reset / all unread relative to Unified view. Not a data-loss blocker; expected UX discontinuity.

```text
READ STATES SAFE: YES (with reset)
```

---

## 20. Attachment Compatibility

```text
legacy channel attachments: 0
legacy DM attachments:      0
unified attachments:        0
```

```text
ATTACHMENTS SAFE: YES
```

If another environment has unified-only attachments, they would not appear after rollback (no reverse dual-write).

---

## 21. Realtime Delta

| Concern                       | Baseline     | Current                         | Rollback need                                    |
| ----------------------------- | ------------ | ------------------------------- | ------------------------------------------------ |
| Namespace                     | `/messenger` | same                            | restore legacy client subscribe                  |
| Channel/DM events             | present      | present                         | restore                                          |
| Conversation events           | absent       | added                           | remove from UI; server extras harmless if unused |
| Typing / presence / peer_read | channel/dm   | +conversation                   | restore channel/dm handlers                      |
| Dual-emit flag                | n/a          | `MESSENGER_LEGACY_WS_DUAL_EMIT` | irrelevant once Unified UI removed               |

---

## 22. ACL / Security Delta

| ACL area                                | Baseline                 | Current                                        | Security regression if naive rollback    |
| --------------------------------------- | ------------------------ | ---------------------------------------------- | ---------------------------------------- |
| `MESSENGER.VIEW` / `EDIT` server checks | weak/partial on list/get | enforced via `requireMessengerView/EditAccess` | **YES** if baseline service restored raw |
| Channel visibility                      | **all channels**         | scoped (`canAccessMessengerChannel`)           | **YES**                                  |
| DM recipient validation                 | weaker                   | `assertActiveEmployeeRecipient`                | possible                                 |
| Attachment attachability                | weaker                   | `assertMessengerFileAssetsAttachable`          | **YES**                                  |
| Socket.IO auth                          | JWT-bound                | JWT-bound + conversation rooms                 | keep auth; drop conversation rooms OK    |
| Search filtering                        | used visible ids (all)   | ACL-filtered visible ids                       | **YES** if visibility ops reverted       |

---

## 23. Security Fixes That Must Be Preserved

Classify as `KEEP_AFTER_ROLLBACK`:

1. **`access/messenger-legacy-channel-access.op.ts` (+ tests)** — scoped channel access
2. **`messenger-visible-channel-ids.ops.ts` ACL filtering** — search/list leak fix
3. **`messenger-attachment-access.op.ts`** — attachability / recipient checks
4. **Service-level `ForbiddenException` on missing MESSENGER.VIEW/EDIT** — keep when restoring legacy service

Do **not** discard these when restoring baseline UI/controllers.

Approx count of distinct security improvements: **3** (plus service wiring).

---

## 24. Embedded Messenger Dependencies

| Surface                               | Before baseline?                   | After Unified                    | Rollback disposition                           |
| ------------------------------------- | ---------------------------------- | -------------------------------- | ---------------------------------------------- |
| `PortfolioMessengerSheet`             | yes (unchanged in Unified commits) | embeds current `MessengerClient` | **auto restored** when client restored         |
| Project/Deal/Task conversation ensure | no                                 | yes (API side)                   | **remove hooks** (`RESTORE` CRM/Project files) |
| Task sheet shared thread primitives   | pre-Unified                        | still present                    | verify compile; keep shared primitives         |

---

## 25. Rollback Boundary

```text
RESTORE_FROM_BASELINE
  apps/web/src/features/messenger/MessengerClient.tsx
  apps/web/src/features/messenger/MessengerSidebar.tsx
  apps/web/src/features/messenger/MessengerThread.tsx
  apps/web/src/features/messenger/messenger-active-view.ts
  apps/web/src/features/messenger/useMessengerRealtime.ts
  apps/web/src/lib/api/messenger.ts
  apps/api/src/modules/crm/deals/deal-order-bootstrap.ops.ts
  apps/api/src/modules/crm/deals/deal-won.handler.ts
  apps/api/src/modules/projects/projects.service.ts

DELETE_NEW_FILE (after CRM/Project unhook)
  apps/web/... MessengerL1Panel, MessengerL2Panel, MessengerInternalChrome,
                useMessengerNavigation, messenger-internal.constants,
                messenger-unified-message.mapper
  apps/api/... unified/*, migration/*, messenger-unified.service.ts,
                dto/messenger-unified.dto.ts, messenger-legacy-write-mode*,
                scripts/messenger-*-cli.ts
  (optional) conversation-only access ops if unused after merge

MANUAL_MERGE
  apps/api/.../messenger.controller.ts
  apps/api/.../messenger.gateway.ts
  apps/api/.../messenger.module.ts
  apps/api/.../messenger.service.ts
  apps/api/.../messenger.types.ts
  apps/api/.../messenger-audit.constants.ts
  packages/shared/src/constants/messenger-ws.ts
  package.json
  apps/api/src/runtime/queue-workers.module.ts
  apps/api/src/test-utils/mock-prisma.ts

KEEP_CURRENT
  packages/database/prisma/schema/messenger.prisma (leave unified models)
  packages/database/prisma/migrations/20260804120000_*
  packages/database/prisma/schema/drive.prisma
  packages/database/prisma/schema/employees.prisma
  access/messenger-legacy-channel-access.*
  messenger-visible-channel-ids.ops.ts (ACL version)
  messenger-attachment-access.op.ts
  docs/architecture/bullmq-git-history-audit.md

DO_NOT_TOUCH
  unrelated NBOS modules outside boundary
  production data / DROP TABLE
  main branch history rewrite
```

---

## 26. Git Strategy Comparison

### OPTION A — revert all Messenger commits

```text
git revert 16a77ae4
git revert 103fb297
```

**Risks:** loses ACL security; may fight mixed files; still leaves schema migration in history awkwardly if not careful. **Not preferred.**

### OPTION B — restore Messenger paths from old commit

```text
git restore --source=f05e04bc -- <paths>
```

**Pros:** precise. **Cons:** must still manually keep ACL + delete new Unified files + unhook CRM/Projects + leave DB schema.

### OPTION C — new rollback branch from HEAD + selective restore

**Pros:** safest; preserves remote history; reviewable PR; no force-push. **Preferred core.**

### OPTION D — branch from `PRE_UNIFIED_BASELINE`

**Pros:** instant old Messenger. **Cons:** drops all post-2026-07-27 NBOS work (auth sessions, notifications inbox, scheduler, finance, etc.). **Unsuitable.**

---

## 27. Recommended Rollback Strategy

```text
HYBRID
= new branch from current HEAD
+ selective path restore from f05e04bc for legacy UI/API surfaces and CRM/Project unhooks
+ delete Unified-only runtime files
+ MANUAL_MERGE messenger.service/controller/gateway to re-apply ACL on legacy paths
+ KEEP additive Prisma unified schema + migration
+ do not drop DB tables
+ do not revert whole commits
```

Why: only 2 tip commits, but they are **mixed** and contain **must-keep security**. Selective restore minimizes collateral damage to unrelated NBOS functionality.

---

## 28. Exact Files to Restore

From `f05e04bc`:

- `apps/web/src/features/messenger/MessengerClient.tsx`
- `apps/web/src/features/messenger/MessengerSidebar.tsx`
- `apps/web/src/features/messenger/MessengerThread.tsx`
- `apps/web/src/features/messenger/messenger-active-view.ts`
- `apps/web/src/features/messenger/useMessengerRealtime.ts`
- `apps/web/src/lib/api/messenger.ts`
- `apps/api/src/modules/crm/deals/deal-order-bootstrap.ops.ts`
- `apps/api/src/modules/crm/deals/deal-won.handler.ts`
- `apps/api/src/modules/projects/projects.service.ts`

Restore-then-merge candidates (baseline as starting point, then re-apply ACL):

- `apps/api/src/modules/messenger/messenger.service.ts`
- `apps/api/src/modules/messenger/messenger.controller.ts`
- `apps/api/src/modules/messenger/messenger.gateway.ts`
- `apps/api/src/modules/messenger/messenger.module.ts`

---

## 29. Exact Files to Remove

New Unified runtime (non-exhaustive; all added under Unified commits):

- `apps/web/src/features/messenger/MessengerInternalChrome.tsx`
- `apps/web/src/features/messenger/MessengerL1Panel.tsx`
- `apps/web/src/features/messenger/MessengerL2Panel.tsx`
- `apps/web/src/features/messenger/useMessengerNavigation.ts`
- `apps/web/src/features/messenger/messenger-internal.constants.ts`
- `apps/web/src/features/messenger/messenger-unified-message.mapper.ts`
- `apps/api/src/modules/messenger/messenger-unified.service.ts`
- `apps/api/src/modules/messenger/dto/messenger-unified.dto.ts`
- `apps/api/src/modules/messenger/messenger-legacy-write-mode.ts`
- `apps/api/src/modules/messenger/messenger-legacy-write-mode.test.ts`
- `apps/api/src/modules/messenger/unified/**`
- `apps/api/src/modules/messenger/migration/**`
- `apps/api/scripts/messenger-legacy-backfill-cli.ts`
- `apps/api/scripts/messenger-project-general-reconcile-cli.ts`
- Conversation-only access files if no longer referenced after merge:
  - `access/messenger-conversation-access.op.ts`
  - `access/messenger-entity-access.op.ts`
  - `access/messenger-canonical.util.ts` (+ tests if unused)

---

## 30. Files Requiring Manual Merge

- `messenger.service.ts` / `controller.ts` / `gateway.ts` / `module.ts`
- `packages/shared/src/constants/messenger-ws.ts`
- `package.json` (remove messenger scripts only)
- `apps/api/src/test-utils/mock-prisma.ts` (remove unified model mocks if deleted)
- `apps/api/src/runtime/queue-workers.module.ts` (decide AuditModule keep/drop)

---

## 31. Files That Must Stay Current

- Prisma unified models + migration folder
- `drive.prisma` / `employees.prisma` relation fields (while tables exist)
- Legacy ACL access ops + attachment access + visible-channel ACL
- Unrelated NBOS work since `f05e04bc`
- `docs/architecture/bullmq-git-history-audit.md` (unless intentionally removed)

---

## 32. Database Changes to Keep

| DB object                            | Baseline | Current | Old app depends | Safe to leave | Drop required |
| ------------------------------------ | -------- | ------- | --------------: | ------------: | ------------: |
| Legacy channel/DM tables             | present  | present |             yes |           yes |            no |
| `messenger_conversations`            | absent   | present |              no |       **yes** |        **no** |
| `messenger_conversation_*`           | absent   | present |              no |           yes |            no |
| `messenger_messages` (+ attachments) | absent   | present |              no |           yes |            no |
| Unified enums                        | absent   | present |              no |           yes |            no |

Preferred:

```text
Unified tables:
old app does not use them
safe to leave temporarily
do not drop during code rollback
```

---

## 33. Database Changes Potentially Reversible

| Change                                                     | Potentially reversible?        | Recommendation                  |
| ---------------------------------------------------------- | ------------------------------ | ------------------------------- |
| `20260804120000_messenger_unified_conversation_foundation` | yes, via custom down migration | **Do not** during code rollback |
| Prisma relation fields on Employee/FileAsset               | yes with schema edit           | keep while tables exist         |

---

## 34. Data Preservation Requirements

```text
preserve data
do not use it
```

Before any future destructive DB work:

1. Logical dump of unified tables.
2. Record counts (parity queries in Evidence Index).
3. Confirm no environment has post-cutover unified-only live messages.

Current DB: preserve 27 conversations / 16 messages / 13 read states even if unused.

---

## 35. Old Messenger Data Completeness

```text
If we restore old Messenger right now, will users still see all messages they should see?
YES  (on the audited DB, for Channels + DM legacy corpus)
```

Caveats:

- Unified-only `INTERNAL_GROUP` seed threads will disappear from UI (expected; legacy UI never had them).
- Unified read-state progress will not map back (legacy read tables empty).
- Other environments: re-verify; if Unified UI was used live, reverse-migrate before cutover.

---

## 36. Build Compatibility Assessment

```text
Build compatibility of path-restored Messenger against current monorepo: UNKNOWN (not compiled in worktree)
```

Reasoning (static):

- Baseline web Messenger depends on stable `@nbos/shared` WS constants + existing UI primitives still present.
- Baseline API Messenger depends on legacy Prisma models still present.
- Risk areas: shared WS constant shape, permission helpers, any post-baseline import renames — mitigated by compiling on rollback branch.

Optional worktree verification was skipped for invasiveness; recommend typecheck/build on the future rollback branch.

---

## 37. Working Tree Safety

Dirty file:

```text
M docs/messenger-debug/04_TOPIC_LIFECYCLE.md
```

Recommendation before rollback implementation:

```text
commit it  OR  stash it  OR  copy aside
```

Do **not** auto-stash. Do not discard without user intent.

---

## 38. Remote / Branch Safety

```text
current branch:     dev-Karo
remote tracking:    origin/dev-Karo @ 16a77ae4 (contains Unified)
origin/main:        does NOT contain Unified Messenger
ahead/behind main:  ~2 ahead / ~5 behind
protected branches: treat main as protected; no force-push
```

Rollback should happen on:

```text
new branch (recommended): messenger-clean-rollback
NOT main
NOT by resetting origin/dev-Karo without review
```

Because Unified is already pushed to `origin/dev-Karo`, cleanup should be a **forward-fixing PR**, not history rewrite.

---

## 39. Rollback Execution Plan — DO NOT EXECUTE

```text
DO NOT EXECUTE YET
```

Conceptual plan:

```bash
# 0) Preserve dirty doc
#    commit OR stash OR copy docs/messenger-debug/04_TOPIC_LIFECYCLE.md

# 1) New branch from current HEAD
git switch -c messenger-clean-rollback

# 2) Restore selected legacy UI + CRM/Project unhooks
git restore --source=f05e04bc -- \
  apps/web/src/features/messenger/MessengerClient.tsx \
  apps/web/src/features/messenger/MessengerSidebar.tsx \
  apps/web/src/features/messenger/MessengerThread.tsx \
  apps/web/src/features/messenger/messenger-active-view.ts \
  apps/web/src/features/messenger/useMessengerRealtime.ts \
  apps/web/src/lib/api/messenger.ts \
  apps/api/src/modules/crm/deals/deal-order-bootstrap.ops.ts \
  apps/api/src/modules/crm/deals/deal-won.handler.ts \
  apps/api/src/modules/projects/projects.service.ts

# 3) Delete Unified-only runtime files (explicit paths from §29)
#    git rm -- <new unified files>

# 4) MANUAL_MERGE API messenger.service/controller/gateway/module:
#    start from baseline or current; re-apply KEEP_AFTER_ROLLBACK ACL

# 5) Keep Prisma unified schema + migration; do not migrate down

# 6) Remove package.json messenger:* scripts if CLIs removed

# 7) typecheck / test / manual verification (§40)

# 8) PR into dev-Karo (forward fix). Do not force-push main.
```

**Not recommended:**

```bash
git revert 103fb297^..16a77ae4
git reset --hard f05e04bc
git switch -c orphan-from-baseline f05e04bc   # loses unrelated NBOS work
```

---

## 40. Post-Rollback Verification Plan

1. typecheck (api + web + shared + database generate)
2. lint
3. API Messenger unit/ops tests (legacy)
4. web Messenger tests (if any)
5. build
6. login
7. Channels load
8. DM load
9. send Channel message → row in `messenger_channel_messages`
10. send DM → row in `messenger_direct_messages`
11. realtime receive (channel + dm)
12. typing
13. unread badges (expect possible reset)
14. read receipt (channel + dm)
15. attachments
16. search (confirm ACL does not leak non-visible channels)
17. ACL OWN
18. ACL DEPARTMENT
19. ACL ALL
20. confirm old UI does **not** call `/api/messenger/internal/*` or `/conversations/*`
21. create Project / win Deal → **no** `ensureProjectGeneralConversation` / no new unified dependency errors
22. Portfolio Messenger sheet opens legacy UI
23. confirm unified tables still exist unused
24. re-run DB parity counts

---

## 41. Risks

- **Security regression** if baseline service restored without ACL re-apply
- **Compile breaks** in CRM/Projects if Unified ensure files deleted before unhook
- **Unread UX reset** (legacy read states empty)
- **Environment skew**: another DB may have unified-only live messages (not seen here)
- **Mixed commit revert** collateral (bullmq doc / queue-workers)
- Dirty working tree doc conflict during restore of `docs/messenger-debug/04_TOPIC_LIFECYCLE.md`

---

## 42. Blockers

| Blocker                              | Severity | Resolution                                |
| ------------------------------------ | -------- | ----------------------------------------- |
| ACL must be preserved across restore | high     | MANUAL_MERGE checklist                    |
| CRM/Project imports of ensure\*      | high     | restore those 3 files from baseline first |
| Uncommitted doc change               | low      | commit/stash/copy first                   |
| Other envs not audited               | medium   | run parity SQL before each deploy         |
| Build not verified in worktree       | medium   | verify on rollback branch                 |

No hard blocker for **starting** a rollback branch implementation after conditions accepted.

---

## 43. Evidence Index

### Git commands / facts

- `HEAD` = `16a77ae4`; baseline parent = `f05e04bc`; Unified intro = `103fb297`
- Only **2** commits in `f05e04bc..HEAD`
- Pickaxe: Unified symbols first appear at `103fb297`
- `103fb297` **not** ancestor of `origin/main`
- Path diffs and `--name-status` captured above

### Live DB (read-only)

```text
unifiedTableExists: true
legacyChannelMessages: 6
legacyDmMessages: 2
unifiedMessages: 16
messagesOnlyUnified: 8
messagesSharedIds: 8
channelMessagesOnlyLegacy: 0
dmMessagesOnlyLegacy: 0
afterCutover unified messages: 0
```

### Critical investigation answers

1. Unified rewrite started at **`103fb297` (2026-08-10)**.
2. Last stable pre-Unified tip: **`f05e04bc`**.
3. Restore Messenger from **`f05e04bc`**.
4. Commits after baseline affecting Messenger: **2**.
5. Mixed commits: **both** (`103fb297`, `16a77ae4`).
6. Safe to revert whole commits? **No**.
7. Selective path restore safer? **Yes** (HYBRID).
8. Rollback boundary: §25.
9. Outside Messenger: CRM deals + Projects (+ schema relations, package scripts, queue-workers, docs).
10. New migration: `20260804120000_messenger_unified_conversation_foundation`.
11. Old Messenger vs current DB schema: **yes** (legacy intact; unified additive).
12. Unified tables can remain: **yes**.
13. Legacy contains all legacy messages: **yes** (this DB).
14. Unified-only messages: **8** (seed INTERNAL_GROUP/DIRECT; none after cutover).
15. DMs safe: **yes** (this DB).
16. Attachments safe: **yes**.
17. Read states safe: **yes with reset**.  
    18–19. ACL/security after baseline: Phase-4 channel ACL + attachment checks — **KEEP**.  
    20–21. External Unified deps: Project/Deal ensure — must unhook or pages/services break.
18. Safest strategy: **HYBRID**.
19. Commands: §39 (do not execute).
20. Backup first: dirty doc + optional unified table dump.
21. Verify: §40.

---

## Required Rollback File Matrix (summary)

| Path                                            | Baseline     | Current          | Action                | Reason                  |
| ----------------------------------------------- | ------------ | ---------------- | --------------------- | ----------------------- |
| web Messenger core UI/API files                 | legacy       | unified          | RESTORE_FROM_BASELINE | return Channels+DM      |
| new L1/L2/nav/unified mappers                   | absent       | present          | DELETE_NEW_FILE       | Unified-only            |
| api `unified/` + `migration/` + unified service | absent       | present          | DELETE_NEW_FILE       | Unified-only            |
| api messenger service/controller/gateway/module | legacy       | hybrid           | MANUAL_MERGE          | keep ACL                |
| legacy ACL + attachment access + visible ids    | absent/weak  | hardened         | KEEP_CURRENT          | security                |
| CRM/Projects ensure hooks                       | absent       | present          | RESTORE_FROM_BASELINE | remove Unified coupling |
| prisma messenger + migration + relations        | legacy / n/a | additive unified | KEEP_CURRENT          | avoid DB rollback       |
| package.json messenger scripts                  | absent       | present          | MANUAL_MERGE          | remove with CLIs        |
| queue-workers AuditModule                       | absent       | present          | MANUAL_MERGE          | inspect                 |
| bullmq audit doc                                | absent       | present          | KEEP_CURRENT          | unrelated               |

---

**End of audit. Do not execute rollback until a separate implementation task is approved.**
