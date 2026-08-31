# Slice 4 — Entity conversations: Product, Work Space, Deal, optional Project General

Status: VERIFIED

Implementer evidence for independent review. Claims in this handoff are not review proof.

## Canonical decisions

- `M-WORK-01` — Product and its Connected Work Space share one Internal conversation
- `M-WORK-02` — Standalone Work Space gets its own conversation (no fake Product)
- `M-PROJECT-01` — Project is an aggregator; Project General is optional/lazy

## Scope

Connect Internal business entities to Messaging Core conversations. Activate Messenger entity tabs that were empty shells after Slice 3.

Out of scope: Slice 5 Task Discussion (`TaskDiscussionEntry` stays), Slice 6 message actions, Slice 7 Client composer, Slice 8 Gateway, dual-write into Channel/DM, DROP Channel/DM/Meta/Task discussion, Product WhatsApp `groupChatId` (Slice 9). Product binding ≠ conversation ACL.

## Identity

Server-computed keys only. HTTP create still has no caller `canonicalKey`. `persistAndBroadcast` arity remains 1.

| Entity                                   | Type              | Zone     | canonicalKey                  | Links                                                            |
| ---------------------------------------- | ----------------- | -------- | ----------------------------- | ---------------------------------------------------------------- |
| Product + Connected Work Space           | `PRODUCT`         | INTERNAL | `product:{productId}`         | PRODUCT PRIMARY + WORKSPACE PRIMARY on the same `conversationId` |
| Standalone Work Space (`productId` null) | `WORKSPACE`       | INTERNAL | `workspace:{workspaceId}`     | WORKSPACE PRIMARY                                                |
| Internal Deal                            | `DEAL`            | INTERNAL | `deal:{dealId}`               | DEAL PRIMARY                                                     |
| Project General                          | `PROJECT_GENERAL` | INTERNAL | `project_general:{projectId}` | PROJECT PRIMARY (lazy only)                                      |

Work Space ensure: only `workSpace.productId` (Connected Work Space) calls Product ensure. Extension-only spaces (`productId` null) use `workspace:{workspaceId}`. There is no second Product Chat plus Connected Work Space Chat.

`WORKSPACE` type is additive (`20260830210000_messenger_entity_workspace_type`). PRODUCT would be fake ownership; INTERNAL_GROUP would pollute Groups. ConversationLink uniqueness stays per conversation (`conversationId, entityType, entityId, relationType`). No global unique on `(entityType, entityId)`.

## Race / ensure

Same pattern as `ensureDirectConversation`: lookup by unique canonicalKey, create, recover on unique conflict. Parallel Product ensures converge on one row. Duplicate ensure does not persist messages.

HTTP:

```text
POST /api/messenger/core/internal/entities/products/:productId
POST /api/messenger/core/internal/entities/work-spaces/:workspaceId
POST /api/messenger/core/internal/entities/deals/:dealId
POST /api/messenger/core/internal/entities/projects/:projectId/general
```

No request body key. MESSENGER.VIEW. After ensure, Internal GET still 404s CLIENT.

## Participants / ACL

Entity access is checked **before** create/relink/reuse. OWN users must be on the platform team graph (`buildProjectParticipationWhere` / `listProjectTeamGraphEmployeeIds`) or Deal seller / seller assistant / PM. `MESSENGER.VIEW ALL` does not replace that check for Product / Deal / Project General. HTTP stays VIEW after the check (ensure is get-or-create).

Work Space access reuses Tasks `buildWorkSpaceParticipationWhere` (project/product/extension graph **and** `STANDALONE_OPERATIONAL` + task involvement). Connected Work Space (`productId` set) still requires Product team-graph access. Org-level standalone (`STANDALONE_OPERATIONAL`, `productId` and `extensionId` null) may ensure after the row exists if the caller has `TASKS.VIEW` other than NONE — the same bar as `GET /tasks/work-spaces/:id`. `MESSENGER.VIEW` / `MESSENGER.VIEW ALL` is not a substitute for `TASKS.VIEW`. Extension-only spaces stay on participation; they do not get the org-level `TASKS.VIEW` bypass.

Failed access → 404. No conversation row, no participant row, caller is not minted OWNER/MEMBER.

Seed remains the team graph (plus Deal commercial roles). The opener is not force-inserted as OWNER on Product/Deal/Project seeds. Standalone with no `projectId` seeds the caller as OWNER only after they passed workspace access. VIEW ALL can GET an existing Internal conversation without being seeded. Product binding does not grant ACL. `persistAndBroadcast` arity stays 1.

## Legacy overlap

Mapped INTERNAL_GROUP rows (`legacy:channel:{id}`) are inspected before creating a Product/standalone Work Space conversation.

- Relink only with proven identity: existing PRODUCT/WORKSPACE PRIMARY link on that mapped group, or legacy metadata that names this `productId` / `workspaceId`. Empty groups matching **title + `metadata.projectId` only** are not relinked (ambiguous / name-only → `preserve_both` or `none`).
- If the mapped group has real history, both are preserved: new PRODUCT/WORKSPACE conversation is created; mapped group is not overwritten. Metadata `legacyOverlapPreservedIds` records the sibling. Manual map/merge remains an ops action; no third store.
- Project-wide channels (projectId only, no title/link proof) are not stolen as a Product conversation.

## Project General laziness

Project create/list does not call ensure and does not insert `PROJECT_GENERAL`. The Project page Communication section lists Product Chat links. “Open Project General” is an explicit click that POSTs ensure.

## UI

- Product page `Chat` tab → Product ensure
- Connected Work Space `Discussion` (Work Space page and Product Work Space tab) → Work Space ensure (same id when `productId` is set)
- Deal sheet `Internal` tab → Deal ensure (never Client Sales / EXTERNAL)
- Messenger `/messenger/products` type PRODUCT; `/messenger/work-spaces` WORKSPACE links; `/messenger/deals` type DEAL
- `/messenger/tasks` remains Slice 5 empty hook
- `All` stays flat `lastMessageAt` (includes entity conversations once they have activity)

Persist uses Internal Core `persistAndBroadcast`, not Channel/DM, not a local comments store.

## Tests

`pnpm test -- apps/api/src/modules/messenger apps/web/src/lib/api/messenger-core.test.ts`

Mandatory Slice 4:

- Product Chat and Connected Work Space Discussion return the same conversationId (parallel ensure → one row)
- Standalone Work Space does not require a Product id / PRODUCT type
- Deal conversation is INTERNAL DEAL, not CLIENT/EXTERNAL
- No eager Project General on Project create/list
- Duplicate ensure does not duplicate messages
- Internal surface still 404s CLIENT
- No Channel/DM writes from entity ensure/persist
- Mapped group with history is preserved; empty **name-only** match does not relink; empty **proven-identity** group may relink
- OWN non-member 404s Product / Work Space / Deal / Project General ensure (no conversation or participant row)
- Team member may ensure and is a participant
- Extension Work Space with null `workSpace.productId` does not return `product:{productId}`
- Org-level standalone (`projectId`/`productId`/`extensionId` null) ensure succeeds with `TASKS.VIEW` and writes `WORKSPACE` / `workspace:{id}`; access query is `buildWorkSpaceParticipationWhere`
- Same workspace with `TASKS.VIEW` NONE 404s with no writes (`MESSENGER.VIEW` ALL is not a substitute)
- Standalone task involvement matches participation without the `TASKS.VIEW` fallback
- Slice 1–3 messenger tests remain

## Commands executed

- `pnpm --filter @nbos/database generate` — pass
- `pnpm test -- apps/api/src/modules/messenger apps/web/src/lib/api/messenger-core.test.ts` — **154 passed**, 5 skipped (opt-in Core int tests). Slice 1–3 cases remain. FINDING-S4-04 where-clause tests added.
- `$env:NODE_OPTIONS='--max-old-space-size=8192'; pnpm --filter @nbos/api typecheck` — pass (re-run after S4-04 FIX)
- `pnpm --filter @nbos/web typecheck` — not re-run (no public web type changes in this FIX)
- Production migrate: **not run**
- No DROP

## Browser

Web at `http://localhost:3000` still redirects `/messenger/products` to sign-in (`callbackUrl=/messenger/products`). API `dev:api` is not running (`AUTH_REFRESH_TOKEN_PEPPER` ≥32 chars required in the API process env). Product Chat and Connected Work Space Discussion (same id for a team member), OWN outsider ensure 404, and Extension Discussion ≠ Product Chat were **not** live-clicked.

Reviewer should browser-exercise those flows against a running API with a session.

## Security notes (entity ensure)

```text
Scope: Product/Work Space/Deal/Project General ensure + Internal persist
Assets: Internal entity conversation history; Client Sales must not merge
Trust boundaries: employee session + MESSENGER VIEW + entity team-graph access + Slice 2 conversation ACL
Confirmed: ensure computes keys server-side; Deal type DEAL zone INTERNAL; Internal GET still 404s CLIENT; no Channel/DM writes; entity access 404 before create/relink/reuse; VIEW ALL does not skip entity access on ensure
Unverified: live DB overlap against mapped groups; WORKSPACE enum not applied (generate only)
Severity: merging Internal Deal with Client EXTERNAL would be a boundary break
Attack scenario: caller-supplied canonicalKey on entity ensure — no body field exists; OWN UUID-guess ensure — 404 without minting membership
Validation: unit tests listed above
Not reviewed: Client composer, Gateway, production data
Remaining risk: VIEW ALL still sees all Internal (Slice 2 GET model); ensure still requires entity membership
```

## What this slice did not do

- Slice 5 Task Discussion / `TaskDiscussionEntry`
- Slice 6 mentions, Create Task, forward/references UI
- Slice 7 Client Messenger / locked composer
- Slice 8 WhatsApp Gateway
- Dual-write or mapper hook-in to Channel/DM send
- DROP Channel/DM, Meta, Task discussion
- Product WhatsApp `groupChatId` / communication bindings

## Remaining debt

- Additive `WORKSPACE` enum migration is in repo SQL; production migrate was not run
- Opt-in real-DB int tests not run unless a disposable DB URL is set
- `prisma migrate status` still blocked by pre-existing empty `20260828170000_client_service_reminder_language`
- Mentions filter remains a Slice 6 hook
- Ambiguous duplicate histories require a manual map/merge with provenance (name-only matches are not relinked)

## Independent review (2026-08-30)

Verdict at that review: **CHANGES_REQUIRED**. Independent reviewer. No commit. Slice 5 must not start.

Independently re-run then: `pnpm test -- apps/api/src/modules/messenger apps/web/src/lib/api/messenger-core.test.ts` — **140 passed**, 5 skipped. Slice 1–3 closures still present. Browser Product Chat → Work Space Discussion was **not** live-clicked (sign-in + API env).

### Holds (not sufficient for VERIFIED)

- Product + Connected Work Space ensure share `product:{productId}` and both PRIMARY links on one id. Work Space with `productId` calls Product ensure.
- Standalone Work Space uses additive `WORKSPACE` type and `workspace:{workspaceId}` (no fake Product).
- Deal ensure is INTERNAL `DEAL`, not CLIENT/EXTERNAL. Deal sheet Internal tab is separate from other Deal tabs.
- Project create/list do not call ensure. UI “Open Project General” is the only ensure.
- HTTP entity ensure has no caller `canonicalKey`. `persistAndBroadcast` arity 1. List GET still does not map. No Channel/DM writes from ensure.
- Mapped group with history is preserved (`legacyOverlapPreservedIds`). No global ConversationLink unique.

### FINDING-S4-01 (HIGH) — entity ensure is an ACL join — closed in FIX

Closed: `requireProductEntityAccess` / `requireWorkSpaceEntityAccess` / `requireDealEntityAccess` / `requireProjectEntityAccess` run before create/relink/reuse. Graph is `buildProjectParticipationWhere` plus Deal `buildDealParticipationWhere` (seller / assistant / PM) and project-graph fallback when `deal.projectId` is set. `toSeeds` no longer force-inserts `createdById`. Failed access 404s with no conversation or participant row. HTTP remains VIEW. VIEW ALL still GETs existing Internal conversations via Slice 2 without being seeded.

### FINDING-S4-02 (MEDIUM) — empty mapped group relink is title+project — closed in FIX

Closed: relink only when a mapped INTERNAL_GROUP has a PRODUCT/WORKSPACE PRIMARY link or metadata `productId`/`workspaceId` for this entity. Title + `metadata.projectId` alone never relinks (history → `preserve_both`; empty → `none`). History-preserve test remains.

### FINDING-S4-03 (MEDIUM) — Extension Work Space folds into Product Chat — closed in FIX

Closed: `ensureWorkSpaceConversation` reuses Product ensure only when `workSpace.productId` is set. `extension.productId` is not a substitute. Extension-only spaces get `workspace:{workspaceId}`.

## FIX implementer (2026-08-30)

Status returned to **READY_FOR_REVIEW**. FINDING-S4-01/02/03 closed as above. Slice 5 not started. No DROP. No commit.

## Independent review of FIX (2026-08-31)

Verdict: **CHANGES_REQUIRED**. Independent reviewer. No commit. Slice 5 must not start.

Independently re-run: `pnpm test -- apps/api/src/modules/messenger apps/web/src/lib/api/messenger-core.test.ts` — **146 passed**, 5 skipped. Slice 1–3 closures still present (`persistAndBroadcast` arity 1; list GET does not map; Internal GET still 404s CLIENT). Browser Product Chat → Work Space Discussion was **not** live-clicked (sign-in + API env).

### Holds (S4-01 / S4-02 / S4-03 remain closed)

- Entity access runs before create/relink/reuse. Product / Project use `buildProjectParticipationWhere`. Deal uses `buildDealParticipationWhere` then project graph when `deal.projectId` is set. `toSeeds` does not force-insert `createdById`. Failed access 404s with no conversation or participant row. HTTP stays VIEW. `MESSENGER.VIEW ALL` does not skip Product/Deal/Project ensure.
- Relink only with proven identity (PRIMARY PRODUCT/WORKSPACE link or metadata `productId`/`workspaceId`). Title + `metadata.projectId` never relinks (empty → `none`; history → `preserve_both`).
- Product ensure from Work Space only when `workSpace.productId` is set. Extension-only spaces stay `workspace:{workspaceId}`.
- Product + Connected Work Space still share `product:{productId}`. Deal is INTERNAL `DEAL`. Project General is lazy. No HTTP `canonicalKey`. Dual-write none.

### FINDING-S4-04 (HIGH) — org-level standalone Work Space Discussion 404s for everyone

`requireWorkSpaceEntityAccess` uses only nested `project` / `product` / `extension` participation. Prisma does not match those relations when the FKs are null.

Canon `M-WORK-02` standalone examples (Marketing, Finance, CEO planning) and the live create path (`CreateStandaloneWorkSpaceDialog`) set **no** `projectId` / `productId` / `extensionId`. Seed demo workspaces `a0000001-…` and `a0000002-…` are the same shape.

Tasks already encodes the missing clause in `buildWorkSpaceParticipationWhere` (`STANDALONE_OPERATIONAL` + task involvement) and `GET /tasks/work-spaces/:id` is `TASKS.VIEW` + existence. Messenger copied a subset of the Tasks where and dropped standalone, so Discussion ensure 404s for every employee, including people who can open the Work Space page.

The “CEO planning” unit test mocks `workSpace.findFirst` to return the row, so it never executes the production where-clause.

Do not reopen S4-01: Product / Deal / Project General stay team-graph gated; do not use `MESSENGER.VIEW ALL` to skip those.

### FINDING-S4-04 — closed in FIX (2026-08-31)

Closed: `requireWorkSpaceEntityAccess` reuses Tasks `buildWorkSpaceParticipationWhere` (including `STANDALONE_OPERATIONAL` + task involvement). Connected Work Space still requires `requireProductEntityAccess`; `TASKS.VIEW` / `MESSENGER.VIEW ALL` do not skip Product team-graph. Org-level standalone (`STANDALONE_OPERATIONAL`, `productId` and `extensionId` null) may ensure after the row exists when `TASKS.VIEW` is not NONE — same bar as `GET /tasks/work-spaces/:id`. Extension-only spaces stay on participation; they do not get that `TASKS.VIEW` bypass. HTTP remains `MESSENGER.VIEW`. Tests assert the participation `where` instead of only stubbing `findFirst` to return the row.

## FIX implementer (2026-08-31)

Status returned to **READY_FOR_REVIEW**. FINDING-S4-01/02/03 remain closed. FINDING-S4-04 closed as above. Slice 5 not started. No DROP. No commit.

## Independent review of S4-04 FIX (2026-08-31)

Verdict: **VERIFIED**. Independent reviewer. Slice 5 may begin.

Independently re-run: `pnpm test -- apps/api/src/modules/messenger apps/web/src/lib/api/messenger-core.test.ts` — **154 passed**, 5 skipped. Slice 1–3 closures still present (`persistAndBroadcast` arity 1; list GET does not map; Internal GET still 404s CLIENT). Browser Product Chat → Work Space Discussion was **not** live-clicked (sign-in + API env); remaining risk, not a reopened finding.

### Holds

- Access before create/relink/reuse. Product/Project: `buildProjectParticipationWhere`. Deal: commercial roles then project graph. `toSeeds` does not force-insert `createdById` on those paths. HTTP stays VIEW. `MESSENGER.VIEW ALL` does not skip Product/Deal/Project ensure.
- Relink only with proven identity. Title + `metadata.projectId` never relinks.
- Product reuse only when `workSpace.productId` is set. Extension-only stays `workspace:{workspaceId}` and does not get the org-level `TASKS.VIEW` bypass.
- Work Space access reuses Tasks `buildWorkSpaceParticipationWhere`. HTTP `POST .../work-spaces/:id` forwards `user.permissions.TASKS_VIEW`. Org-level standalone (`STANDALONE_OPERATIONAL`, `productId` and `extensionId` null) may ensure when `TASKS.VIEW` is not NONE after the row exists; `MESSENGER.VIEW` / `MESSENGER.VIEW ALL` is not a substitute. Tests assert that `where`, including `TASKS.VIEW` NONE 404s with no writes.
- Connected Work Space still calls `requireProductEntityAccess` after the `productId` early return. `TASKS.VIEW` does not skip Product team-graph.
- Product + Connected Work Space share `product:{productId}`. Deal is INTERNAL `DEAL`. Project General is lazy. No HTTP `canonicalKey`. Dual-write none.

### FINDING-S4-01…S4-04 — closed

S4-01/02/03 remain closed. S4-04 closed as in the FIX: org-level standalone Discussion is reachable for people who can open that Work Space in Tasks; Product/Deal/Project IDOR stays closed.

## Final status

VERIFIED
