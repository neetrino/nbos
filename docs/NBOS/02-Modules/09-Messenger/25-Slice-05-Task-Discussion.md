# Slice 5 — Task Discussion migration and Task Card wiring

Status: VERIFIED

Implementer evidence for independent review. Claims in this handoff are not review proof.

## Canonical decisions

- `M-TASK-01` — human Task Discussion is Messaging Core Conversation/Message, not a second comments engine
- `M-TASK-02` — system Activity Feed stays Task-owned (status/assignment/deadline/checklist/automation)
- `M-FILES-01` — attachments are Drive File Assets. `TaskDiscussionEntry` has none — none invented

## Scope

Replace the live `TaskDiscussionEntry` write/read path with Messaging Core. Lazy TASK conversations. Task Card and Messenger `/messenger/tasks` share the same messages. Access before ensure. Mapper is idempotent.

Out of scope: Slice 6 message actions / Create Task from messages, Slice 7 Client composer, Slice 8 Gateway WhatsApp, DROP `TaskDiscussionEntry` / Channel / DM / Meta, reopening Slice 4 entity ACL, commit / push, production migrate.

## Identity

Server-computed keys only. HTTP create still has no caller `canonicalKey`. `persistAndBroadcast` arity remains 1. No Task entity-ensure HTTP (would eager-create empty Tasks).

| Entity | Type   | Zone     | canonicalKey    | Link         |
| ------ | ------ | -------- | --------------- | ------------ |
| TASK   | `TASK` | INTERNAL | `task:{taskId}` | TASK PRIMARY |

Mapped via ConversationLink TASK PRIMARY + canonicalKey + `messenger_legacy_identities` (`TASK` for the conversation, `TASK_DISCUSSION_ENTRY` for each legacy row). **Do not** store `MessengerConversation.id` on `Task.chatId`.

Race-safe ensure: lookup unique canonicalKey, create, recover unique conflict (same helper as Slice 4). No eager-ensure on Task create/list.

## Inventory (Slice 0 facts, not re-invented)

Inventoried DB (Slice 0): **0** `TaskDiscussionEntry` rows, **0** `Task.chatId` non-null. Schema fields that exist:

```text
id, taskId, body, actorType, actorId, actorDisplayName, channelSource, correlationId, visibility (STANDARD|HIDDEN), createdAt
```

No `editedAt`, no parent/reply, no `fileAssetId`. Attachments skipped (`attachmentsSkipped: 0`). 0-row inventory is a valid report; the mapper still exists so a later row cannot be lost.

## Additive schema

Migration `20260831120000_messenger_task_discussion_legacy_identity`:

- `MessengerLegacyIdentityKind` ADD VALUE `TASK`, `TASK_DISCUSSION_ENTRY`
- `messenger_messages.metadata` JSONB nullable (actorType / actorId / channelSource / correlationId / visibility)

No DROP. No DROP of `task_discussion_entries`. Production migrate **not run**. `pnpm --filter @nbos/database generate` run locally.

`TaskDiscussionEntry` schema comment updated: Core is the write path; table remains DELETE-LATER.

## Access / ACL

Access to the Task runs **before** create/relink/reuse/read of the Task conversation (`requireTaskEntityAccess` / `assertTaskAccessible` / `buildTasksParticipationWhere`). `TASKS.VIEW ALL` bypasses the Tasks row filter the same way Task discussion did. `MESSENGER.VIEW ALL` does **not** replace Task access for ensure or for GET of a Task conversation by id.

Internal/Core GET: after Slice 2 `canRead`, if `conversationType === 'TASK'`, `requireTaskConversationAccess` 404s unless the caller may open that Task. Non-TASK Internal conversations are unchanged.

List `/messenger/tasks` (and All) and collection-by-ids: when Tasks view is not ALL, TASK rows are further filtered to linked tasks the caller can open. `TASKS.VIEW ALL` may see Task conversations they can open in Tasks.

**toSeeds choice:** personal marks (creator, assignee, reviewer, co-assignees, observers) plus the opener **after** Task access succeeded. Failed access → 404, no conversation row, no participant row. The opener is not minted on the 404 path. Agent-first discussion does not forge an Employee; `createdById` is `task.creatorId`; agent `senderId` is null.

HTTP messenger entity routes stay `MESSENGER.VIEW`. Task Card routes stay `TASKS.VIEW` / `TASKS.EDIT`. After cutover, POST discussion checks Task access then Core `canWrite` via `persistAndBroadcast` (employee, no tx).

## Migration / backfill sequence

1. Inventory documented (0 rows / 0 chatId; fields not fabricated).
2. Additive schema as above.
3. Backfill only Tasks with at least one discussion row (`mapAllTaskDiscussionsToCore`). Empty Tasks stay lazy.
4. Each entry mapped idempotently: `idempotencyKey` `task-discussion-entry:{entry.id}` (persistCoreMessage returns the existing row for that unique key) plus `messenger_legacy_identities` (`TASK_DISCUSSION_ENTRY` + entry id) in **one transaction**. Rerun skips existing `messageId`. Rerun after persist-without-identity does not create a second message.
5. Preserves actorType / actorId / actorDisplayName / channelSource / correlationId / visibility / original `createdAt` / order.
6. HIDDEN preserved in metadata; Task Card `listEntries`, Internal TASK `listMessages`, All/Tasks `lastMessagePreview`, and search message-body match exclude HIDDEN as a normal note.
7. Per-Task verification report on the mapper result (counts, hidden, agent vs employee, correlationId, chatId ignored, attachmentsSkipped 0).
8. New human writes → Core (Task Card POST + agent `comment()`). Task Card reads → Core.
9. Legacy `TaskDiscussionEntry.create` frozen (`TASK_DISCUSSION_LEGACY_WRITES_DISABLED`). Table DELETE-LATER.

Ops map: `POST /api/messenger/core/internal/task-discussion-map` (`MESSENGER.EDIT`), sibling of Channel/DM `legacy-map`. Not hooked into Channel/DM send.

## Runtime cutover

- Task Card `GET/POST /api/tasks/:id/discussion` reads/writes Core (same `conversationId` as Messenger Tasks).
- Activity stays `buildTaskActivity` from Task timestamps in `TaskSheetChatPanel`. Not persisted through `persistAndBroadcast`.
- Agent `comment()` still calls `TaskDiscussionService.addEntry` (optional tx). After cutover that path persists Core (`persistCoreMessage` on the gateway tx), not `TaskDiscussionEntry`. Provenance `AI`, `senderId` null.
- Employee notes without tx use `persistAndBroadcast` (arity 1) after ensure.
- Messenger `/messenger/tasks` lists type `TASK`. Empty copy: “Open a Task Card and add a note to start.”
- Internal GET still 404s CLIENT. No Channel/DM writes from Task ensure/persist/map.

Closing/trashing a Task does not delete the conversation (`tasks.service` has no `messengerConversation.delete`).

## Tests

`pnpm test -- apps/api/src/modules/messenger apps/api/src/modules/tasks/task-discussion.service.test.ts apps/web/src/lib/api/messenger-core.test.ts apps/api/src/modules/ai-platform/gateway/agent-task-write.handler.test.ts`

**194 passed**, 5 skipped (opt-in Core int tests). Slice 1–4 messenger tests remain.

Covered:

- Empty Task does not create a conversation on list / Task create-list source
- First human/agent write ensures one TASK conversation `task:{taskId}`
- Duplicate ensure / rerun backfill does not duplicate messages
- Rerun after persist-without-identity uses `task-discussion-entry:{entry.id}` and does not create a second message
- Employee and agent actor provenance (no forged Employee)
- `createdAt` order preserved on map
- HIDDEN not listed as a normal note (Task Card, Internal messages, lastMessagePreview, search body)
- Activity is not a Core human message
- OWN/non-member 404s Task ensure (no participant mint)
- MESSENGER.VIEW ALL without Task access 404s GET by conversation id
- TASKS.VIEW ALL may GET a Task conversation (row filter bypass)
- MESSENGER.VIEW ALL + Tasks OWN collection-by-ids does not return a TASK id the caller cannot open
- Closed/trashed does not delete the conversation (source)
- Agent comment still calls `addEntry`; `addEntry` writes Core not `TaskDiscussionEntry`
- `persistAndBroadcast` arity 1; no HTTP `canonicalKey`
- No DROP in Slice 5 SQL

`$env:NODE_OPTIONS='--max-old-space-size=8192'; pnpm --filter @nbos/api typecheck` — pass

`pnpm --filter @nbos/web typecheck` — not run (copy/constants only on web)

Production migrate: **not run**

## Browser

Not live-clicked. Web still requires sign-in; API env (`AUTH_REFRESH_TOKEN_PEPPER`) may be unset in this session. Task Card note → same conversation as `/messenger/tasks`, outsider GET 404, empty Task lazy, and HIDDEN hiding were **not** exercised in a browser.

## Security notes (Task discussion)

```text
Scope: Task conversation ensure + Task Card discussion + Internal GET of type TASK + agent comment
Assets: Task human discussion history; Activity must not become messages; Client zone must stay 404
Trust boundaries: employee session + TASKS VIEW/EDIT + Task participation / TASKS.VIEW ALL + Core canWrite for employee persist; agent policy then Core persist with null senderId
Confirmed: access before ensure; MESSENGER.VIEW ALL does not skip Task GET; no Task.chatId pointer; no Channel/DM dual-write; no HTTP canonicalKey; persistAndBroadcast arity 1; agent does not forge Employee
Unverified: live DB backfill (0 rows); production migrate; browser
Severity: opening an inaccessible Task conversation via Messenger id would be IDOR
Attack scenario: UUID-guess Internal GET of a TASK conversation without Task access — 404, no participant mint
Validation: unit tests listed above
Not reviewed: Client composer, Gateway WhatsApp, production data
Remaining risk: 0-row mapper not proven against real entries; live browser not clicked
```

## What this slice did not do

- Slice 6 mentions, Create Task, forward/references UI
- Slice 7 Client Messenger / locked composer
- Slice 8 WhatsApp Gateway
- Dual-write or mapper hook-in to Channel/DM send
- DROP `TaskDiscussionEntry`, Channel/DM, Meta
- Reopen Slice 4 Product/Deal/Project ACL
- Production migrate / commit / push

## Remaining debt

- Additive enum + metadata SQL is in repo; production migrate was not run
- Opt-in real-DB int tests not run unless a disposable DB URL is set
- `prisma migrate status` still blocked by pre-existing empty `20260828170000_client_service_reminder_language`
- Mapper report is 0-row until a real discussion row exists
- `TaskDiscussionEntry` remains DELETE-LATER until final acceptance
- `Task.chatId` leftover column remains DELETE-LATER
- Independent re-review of this FIX is complete (`VERIFIED`). Slice 6 may begin.

## Independent review (2026-08-31)

Verdict at that review: **CHANGES_REQUIRED**. Independent reviewer. No commit. Slice 6 must not start.

Independently re-run then: `pnpm test -- apps/api/src/modules/messenger apps/api/src/modules/tasks/task-discussion.service.test.ts apps/web/src/lib/api/messenger-core.test.ts apps/api/src/modules/ai-platform/gateway/agent-task-write.handler.test.ts` — **190 passed**, 5 skipped. Slice 1–4 closures still present (`persistAndBroadcast` arity 1; no HTTP `canonicalKey`; Internal GET still 404s CLIENT). Browser was **not** live-clicked. Live DB backfill not run (0 `TaskDiscussionEntry` rows).

### Holds (not sufficient for VERIFIED)

- Human writes/reads go to Core `TASK` / `task:{taskId}` / TASK PRIMARY. `Task.chatId` is not the pointer. Empty Task list does not ensure. Activity stays `buildTaskActivity` on the Task Card.
- Access before ensure. `MESSENGER.VIEW ALL` without Task access 404s GET by id (tested). `TASKS.VIEW ALL` may GET. Opener seeded only after access. All/`/messenger/tasks` apply `taskConversationListWhere` when Tasks view is not ALL.
- Agent `comment()` still calls `addEntry`; agent persist is Core with `senderId` null and provenance `AI`. Employee persist uses `persistAndBroadcast` arity 1. `TaskDiscussionEntry.create` is not called. SQL is additive, no DROP.
- HIDDEN is excluded from Task Card `listEntries` and Internal `listMessages` when type is TASK.

### FINDING-S5-01 (MEDIUM) — mapper persist is not crash-safe idempotent

`persistOneLegacyEntry` writes a Core message, then creates `messenger_legacy_identities`. There is no `idempotencyKey` derived from the entry id, and the two writes are not one transaction. If persist succeeds and identity create fails (or a parallel map races), rerun sees no `messageId` and persists again. The existing rerun test only covers the skip when identity already has `messageId`. Checklist: rerunning backfill creates no duplicates.

### FINDING-S5-02 (MEDIUM) — HIDDEN still surfaces as a normal list note

Task Card and Internal thread omit HIDDEN. `listInclude` still takes the latest message with no visibility filter, so All/Tasks `lastMessagePreview` can be a HIDDEN body. `searchWhere` searches any non-deleted message content, including HIDDEN. Masterprompt: HIDDEN is not listed as a normal note.

### FINDING-S5-03 (MEDIUM) — collection-by-ids skips the Task access list gate

`listAccessibleInternalConversations` applies `taskConversationListWhere`. `listAccessibleInternalConversationsByIds` (collection open) does not. `MESSENGER.VIEW ALL` can see TASK titles in a collection without Task access. GET still 404s. The intended contract on the list helper is that VIEW ALL does not list Task conversations the caller cannot open in Tasks.

## FIX (2026-08-31)

Implementer FIX. Claims here are not review proof. No commit. Slice 6 not started. Slice 4 left `VERIFIED`.

Re-run: same test command — **194 passed**, 5 skipped. `$env:NODE_OPTIONS='--max-old-space-size=8192'; pnpm --filter @nbos/api typecheck` — pass. Browser not live-clicked. Production migrate not run.

### FINDING-S5-01 closed

`persistOneLegacyEntry` now derives `idempotencyKey` `task-discussion-entry:{entry.id}`. `persistCoreMessage` returns the existing row for that unique key. Core message persist and `messenger_legacy_identities` upsert run in one `$transaction`. Rerun still skips when identity already has `messageId`. Rerun after simulated persist-without-identity (identity missing, persist returns the same message id) does not create a second message. `attachmentsSkipped` remains `0`.

### FINDING-S5-02 closed

`hiddenTaskDiscussionNoteWhere` is the shared JSON path (`metadata.taskDiscussion.visibility` ≠ HIDDEN). `listInclude` last-message preview and `searchWhere` message-body match use it (same helper as Internal TASK `listMessages`). Tests: `lastMessagePreview` is not a HIDDEN body; search where excludes HIDDEN. Task Card `listEntries` and Internal `listMessages` HIDDEN exclusion unchanged.

### FINDING-S5-03 closed

`listAccessibleInternalConversationsByIds` applies the same `taskConversationListWhere` as All (no extra filter when `TASKS.VIEW ALL`). Internal collection GET passes `tasksAccessFromUser`. Test: `MESSENGER.VIEW ALL` + Tasks OWN does not return a TASK conversation id the caller cannot open. GET-by-id Task ACL unchanged.

## Independent review of FIX (2026-08-31)

Verdict: **VERIFIED**. Independent reviewer. Slice 4 remains `VERIFIED`. Slice 6 may begin.

Independently re-run: `pnpm test -- apps/api/src/modules/messenger apps/api/src/modules/tasks/task-discussion.service.test.ts apps/web/src/lib/api/messenger-core.test.ts apps/api/src/modules/ai-platform/gateway/agent-task-write.handler.test.ts` — **194 passed**, 5 skipped. Slice 1–4 closures still present (`persistAndBroadcast` arity 1; no HTTP `canonicalKey`; Internal GET still 404s CLIENT; Task GET-by-id still 404s without Task access). Browser was **not** live-clicked. Live DB backfill not run (0 `TaskDiscussionEntry` rows). Web typecheck not independently re-run this pass.

### FINDING-S5-01 closed

`persistOneLegacyEntry` wraps persist + identity upsert in `prisma.$transaction`. `idempotencyKey` is `task-discussion-entry:{entry.id}`. `persistCoreMessage` looks up `conversationId_idempotencyKey` and returns the existing row. Unique constraint `@@unique([conversationId, idempotencyKey])` exists. Test covers persist-without-identity rerun. `attachmentsSkipped` remains `0`.

### FINDING-S5-02 closed

Shared `hiddenTaskDiscussionNoteWhere` filters All/Tasks `lastMessagePreview` (`listInclude`) and search message-body match. Internal TASK `listMessages` still passes `excludeHiddenTaskNotes`. Task Card `listEntries` still excludes HIDDEN.

### FINDING-S5-03 closed

`listAccessibleInternalConversationsByIds` ANDs the same `taskConversationListWhere` as All. Collection GET controller passes `tasksAccessFromUser`. GET-by-id Task ACL is unchanged (`requireTaskConversationAccess` after Slice 2 `canRead`).

### Remaining (not blocking)

- Mapper unit test mocks `persistCoreMessage`; unique-constraint recovery inside a real Prisma transaction is not proven by that test (the persist helper still has its own idempotency test).
- Parallel ops-map HTTP of the same entry can throw P2002; sequential rerun does not duplicate. Ops-only.
- Identity-recovery is counted in `entriesMapped` (reporting, not a second message).
- Collection **add-item** still uses Slice 2 `canRead` without the extra Task ACL. Collection **list** and GET-by-id remain gated. Membership ≠ ACL.
- `lastMessageAt` can still mark unread when the latest row is HIDDEN; the preview body is not HIDDEN.
- Agent Core persist still does not emit realtime.
- 0-row mapper not proven against live entries; production migrate not run; browser not live-clicked.

## Final status

VERIFIED
