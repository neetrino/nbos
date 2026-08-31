# Slice 6 — Message actions, references, Create Task, mentions

Status: VERIFIED

Independent review complete. FINDING-S6-01/02 closed.

## Canonical decisions

- `M-MESSAGE-01` — where permissions allow: reply, share/forward as a reference, Create Task, copy/open source
- `M-MESSAGE-02` — Task/forward workflows reference canonical source messages; they do not copy them as a second source of truth
- `M-MESSAGE-03` — threads/replies are optional; Forward / Discuss internally / Create Task must not auto-create a Conversation or a thread

## Scope

Turn messages into reusable work context on Messaging Core.

Working in this slice: Internal selection, Reply, Forward-as-reference into an existing writable Internal conversation, Create Task via `QuickCreateTaskDialog`, Open/copy source, queryable mention persist + Mentions list filter.

Out of scope: Slice 7 Client Messenger / locked composer, Support Ticket product, Deal create-from-message product, Create Task with AI, dual-write, Channel/DM send hook-in, DROP of `TaskDiscussionEntry` / Channel / DM / Meta / `Task.chatId`, production migrate, commit / push.

Slice 5 Task ACL is unchanged: `MESSENGER.VIEW ALL` does not open/list Task conversations the caller cannot open in Tasks. HIDDEN Task notes stay excluded from Task Card `listEntries`, Internal TASK `listMessages`, `lastMessagePreview`, search bodies, and mention snippets.

## HTTP

### Internal (`/api/messenger/core/internal`)

- `POST conversations/:id/messages` — `replyToMessageId` (same conversation) + `mentionedEmployeeIds` (queryable rows; mentioning does not grant ACL)
- `POST conversations/:id/forwards` — `{ sourceMessageIds }` into **this** target conversation. Target must be Internal + `canWrite`. Source conversations require READ (Internal or Client). Internal → Client is rejected (Internal GET 404s CLIENT before forward). Does not create a Conversation. Does not set `threadRootMessageId`.
- `GET conversations?filter=mentions` — same All-list ACL + Task gate, plus a mention of the caller on a non-HIDDEN message. `mentionsAvailable: true`

Internal GET still 404s CLIENT. Client persist remains `MESSENGER_CORE_CLIENT_SEND_DISABLED`.

### Core (`/api/messenger/core`)

- `GET messages/:id` — open original / copy source. The client must pass each canonical `sourceMessageId` from `MessengerMessageReference` (`purpose FORWARD`, `sortOrder`), not the FORWARD holder id. `requireRead` on that source conversation (includes Slice 5 Task ACL). 404 if not allowed, including when the caller can READ the target but not the source. A reference does not grant source READ.
- `POST messages/task-sources` — after Task create succeeds: `requireTaskEntityAccess` (`assertTaskAccessible` + `tasksAccessFromUser`) then `TASK_SOURCE` rows (`entityType TASK`, `entityId`, `sortOrder`, `createdById`). `MESSENGER.EDIT` is not enough. Still requires READ on each source conversation. Accepts Client source ids when the caller can READ them. Does **not** ensure a Task conversation. Does **not** copy message body into Task title/description.
- `DELETE messages/references/:id` — deletes the reference row only; source message remains. `TASK_SOURCE` delete also requires Task access on `entityId`.
- `POST messages/references` — now sets `targetConversationId` (from holder), `createdById`, `sortOrder`. FORWARD requires a holder in an Internal conversation the caller can WRITE.

## Forward card

Target receives one holder message (short preview, not a second canonical body) plus `MessengerMessageReference` rows `purpose FORWARD`, one per selected source, `sortOrder` matching `createdAt` then `id`. The reference card exposes **Open original** per source id (deterministic `sortOrder` then `sourceMessageId`). Opening original / copy source GET each `sourceMessageId` and navigate to / copy the source conversation and body, not the holder.

## Create Task

Internal UI opens `QuickCreateTaskDialog` (full Task form). Title/description/assignee/dates stay empty until the Employee fills them. Optional `defaultLinks` from the source conversation PRIMARY Product/Deal/Work Space/Project links. Multiple PRODUCT PRIMARY links are omitted (do not guess a Product). After create, `POST messages/task-sources`.

Client-surface Create Task button is a prepared hook (`CLIENT_MESSAGE_ACTION_HOOKS`); not a Client app. Ticket/Deal purposes already exist; create is not implemented (`createTicketImplemented: false`, `createDealImplemented: false`). Invite remains Slice 2 `inviteParticipant`.

## Mentions

Additive table `messenger_message_mentions` (`messageId` + `employeeId` unique). Persist on Internal send. Mentions filter uses the same list ACL as All (plus Task list gate) and excludes HIDDEN Task notes from the mention match and from preview/search snippets. Mentioning an employee does not add a participant.

## Additive schema

Migration `20260831140000_messenger_message_actions_mentions`:

- `messenger_message_references.sort_order` INTEGER NOT NULL DEFAULT 0
- table `messenger_message_mentions`

No DROP TABLE / TYPE / COLUMN. Production migrate **not run**. `pnpm --filter @nbos/database generate` run locally.

## Tests

`pnpm test -- apps/api/src/modules/messenger apps/web/src/lib/api/messenger-core.test.ts apps/web/src/features/messenger-internal/sort-selected-messages.test.ts`

Also run explicitly (multi-path filter can drop it): `apps/api/src/modules/messenger/core/messenger-core-slice-06.ops.test.ts` and `apps/api/src/modules/messenger/core/messenger-core-slice-06-fix.test.ts`, plus `canonical-source-message-ids.test.ts` and `open-original-source.test.ts`.

**199 passed**, 5 skipped (opt-in Core int tests; 38 files on the multi-path command). Explicit Slice 6 files: **23 passed**. Slice 1–5 messenger tests remain.

Covered:

- Source message remains after Task create and after reference delete
- Deleting a reference does not delete the source message
- Open original 404s without source conversation READ (Task ACL path uses the same `requireRead`)
- Open original / copy on a FORWARD holder GETs `sourceMessageId`, not `holder.id`
- Source GET 404s when source READ/Task ACL fails even if the caller can READ the target
- Allowed caller GET of `sourceMessageId` returns the source conversation id
- Attach to a Task the caller cannot open 404s and creates no reference
- Delete of TASK_SOURCE without Task access 404s; source message remains
- Multi-select retains `createdAt`, then `id` order
- Forward into a conversation the caller cannot write is 403
- Forward does not create a conversation or a thread root
- Internal → Client forward is rejected
- Create Task attach does not auto-set Task title/body and does not ensure a Task conversation
- Mentions filter uses Internal list ACL (not an ungated mention table scan) and sets `mentionsAvailable: true`
- Mention persist does not add participants
- Multiple PRODUCT PRIMARY links are not guessed as Task `defaultLinks`
- `persistAndBroadcast` arity 1; no HTTP `canonicalKey`
- No Channel/DM writes; no DROP in Slice 6 SQL

`$env:NODE_OPTIONS='--max-old-space-size=8192'; pnpm --filter @nbos/api typecheck` — pass (FIX re-run)

`pnpm --filter @nbos/web typecheck` — pass (FIX re-run)

Production migrate: **not run**

## Browser

Not live-clicked in this session. Web and API were not running; no authenticated Internal Messenger session was available. Open original on a forward card (source vs holder) and attach-to-inaccessible-task 404 were **not** exercised in a browser.

## Security notes (message actions)

```text
Scope: Internal message selection/actions; Core open-source GET; Forward into Internal; TASK_SOURCE attach; mention persist + Mentions filter
Assets: canonical source messages; Internal conversation write; Client history READ without SEND; Task ACL; HIDDEN Task notes
Trust boundaries: employee session + MESSENGER VIEW/EDIT + conversation canRead/canWrite + Task access for TASK sources; TASKS create remains Tasks-owned (QuickCreateTaskDialog)
Confirmed: source remains after Task create and reference delete; Forward does not create a Conversation or thread; Internal → Client forward rejected; Open original GETs sourceMessageId (not holder) and 404s without source READ; TASK_SOURCE create/delete requires Task access; mentions do not grant ACL; HIDDEN bodies not used as mention snippets; persistAndBroadcast arity 1; no HTTP canonicalKey; no Channel/DM dual-write
Unverified: live browser; production migrate; Client-surface button (Slice 7 hook only)
Severity: forwarding into a Client conversation would be a client-visible send; opening a TASK source without Task access would be IDOR
Attack scenario: UUID-guess GET /messenger/core/messages/:id for a TASK note — 404 via requireRead + requireTaskConversationAccess; attach TASK_SOURCE to a Task the caller cannot open — 404 via requireTaskEntityAccess
Validation: unit tests listed above
Not reviewed: Client composer, Gateway WhatsApp, Ticket/Deal create, production data
Remaining risk: browser not live-clicked; production migrate not run
```

## What this slice did not do

- Slice 7 Client Messenger / locked composer / Client-surface Create Task button (hook only)
- Support Ticket create / Deal create from messages
- Create Task with AI
- Dual-write or mapper hook-in to Channel/DM send
- DROP `TaskDiscussionEntry`, Channel/DM, Meta, `Task.chatId`
- Reopen Slice 5 Task ACL
- Production migrate / commit / push

## Remaining debt

- Additive mention table + `sort_order` SQL is in repo; production migrate was not run
- Opt-in real-DB int tests not run unless a disposable DB URL is set
- `prisma migrate status` still blocked by pre-existing empty `20260828170000_client_service_reminder_language`
- Browser not live-clicked
- Client Ticket/Deal/Invite-from-message product remains later slices
- FINDING-S6-01/02 closed. Independent review of the FIX is `VERIFIED`. Slice 7 may begin.

## Independent review (2026-08-31)

Verdict: **CHANGES_REQUIRED**. Independent reviewer. No commit. Slice 5 stays `VERIFIED`. Slice 7 must not start.

Independently re-run: claimed command `pnpm test -- apps/api/src/modules/messenger apps/web/src/lib/api/messenger-core.test.ts apps/web/src/features/messenger-internal/sort-selected-messages.test.ts` — **194 passed**, 5 skipped (36 files). Targeted `messenger-core-slice-06.ops.test.ts` + `sort-selected-messages.test.ts` — **12 passed**. Browser was **not** live-clicked. Production migrate not run.

### Holds (not sufficient for VERIFIED)

- Reply stays in the same conversation (`replyToMessageId` + `assertOptionalReply`). No `threadRootMessageId` required. Forward does not call `messengerConversation.create`.
- Internal `POST .../forwards` 404s Client targets via `getConversation`. `assertForwardTargetZone` rejects CLIENT. `requireWrite` on the target. Source `requireRead` (includes Slice 5 Task ACL).
- Create Task UI reuses `QuickCreateTaskDialog` with empty title/body. `attachTaskSourceReferences` does not `task.update` or ensure a Task conversation. Multiple PRODUCT PRIMARY links are omitted.
- Mentions persist in `messenger_message_mentions` (unique message+employee). Mentions filter ANDs All-list ACL + Task gate + HIDDEN exclusion. Mention persist does not add participants.
- `persistAndBroadcast` arity 1. No HTTP `canonicalKey`. Dual-write none. Slice 6 SQL has no DROP. GET-by-id Task ACL still goes through `requireRead`.

### FINDING-S6-01 (MEDIUM) — Open original / copy source do not use the canonical source

Canon `M-MESSAGE-02` / Internal §12: the target receives a reference card with `Open original`, not a disconnected copy. Masterprompt: opening original uses the **source** message id; preview/open requires source READ.

`GET /messenger/core/messages/:id` is a correct ACL gate **if** the client passes the source id. The Internal UI calls it with `selectedMessages[0].id`. A FORWARD holder is a new message in the **target** conversation. Selecting that card then Open original / Copy source GETs the holder (target READ, 140-char preview), never `references[].sourceMessageId`. The card only shows “Reference card · N sources” with no control that opens the source. Copy of the holder preview is not “copy source”. Tests 404 `getSourceMessage` when `requireRead` is mocked on the id passed in — they never pass a holder id.

### FINDING-S6-02 (MEDIUM) — TASK_SOURCE attach/delete skips Task access

`attachTaskSources` checks `MESSENGER.EDIT` and source conversation READ only. It does not call `assertTaskAccessible` / `requireTaskEntityAccess`. Any editor who knows a non-trashed `taskId` can write `TASK_SOURCE` rows onto a Task they cannot open in Tasks. `deleteReference` on a TASK_SOURCE row (`targetConversationId` null) uses `requireEditAccess` only. Slice 5: Messenger EDIT/VIEW ALL is not a substitute for Task access. Create Task remains Tasks-owned on the dialog; the attach API is not.

## FIX (2026-08-31)

Implementer FIX. Claims here are not review proof. No commit. Slice 7 not started. Slice 5 left `VERIFIED`. Status after this FIX: `READY_FOR_REVIEW` (not `VERIFIED`).

Re-run: claimed command `pnpm test -- apps/api/src/modules/messenger apps/web/src/lib/api/messenger-core.test.ts apps/web/src/features/messenger-internal/sort-selected-messages.test.ts` — **199 passed**, 5 skipped. Explicit `messenger-core-slice-06.ops.test.ts` + `messenger-core-slice-06-fix.test.ts` + `canonical-source-message-ids.test.ts` + `open-original-source.test.ts` — **23 passed**. `$env:NODE_OPTIONS='--max-old-space-size=8192'; pnpm --filter @nbos/api typecheck` — pass. `pnpm --filter @nbos/web typecheck` — pass.

### FINDING-S6-01 closed

`canonicalSourceMessageIds` takes `purpose FORWARD` references ordered by `sortOrder` then `sourceMessageId`. Open original / Copy source and the reference-card **Open original** control GET `/messenger/core/messages/:id` with each `sourceMessageId`, not `holder.id`. Internal navigation uses the source `conversationId`. Copy uses the GET source body, not the 140-char holder preview. GET of the source still `requireRead`s the source conversation (Task ACL included). Tests: holder resolves to source ids; source GET 404s when target would be readable; allowed caller reaches the source conversation id.

### FINDING-S6-02 closed

`attachTaskSources` and `deleteReference` of `TASK_SOURCE` call `requireTaskEntityAccess` with `tasksAccessFromUser` before create/delete. `MESSENGER.EDIT` remains required and is not sufficient. Source conversation READ is still required on attach. No Task conversation ensure. No copy of message body into Task title/description. Tests: attach without Task access 404s and creates no reference; delete without Task access 404s; source message remains.

## Independent review of FIX (2026-08-31)

Verdict: **VERIFIED**. Independent reviewer. Slice 5 stays `VERIFIED`. Slice 7 may begin.

Independently re-run: `pnpm test -- apps/api/src/modules/messenger apps/web/src/lib/api/messenger-core.test.ts apps/web/src/features/messenger-internal/sort-selected-messages.test.ts` — **199 passed**, 5 skipped. Explicit `slice-06.ops` + `slice-06-fix` + `canonical-source-message-ids` + `open-original-source` — **23 passed**. Browser was **not** live-clicked. Production migrate not run. Web/API typecheck not independently re-run this pass (implementer claimed pass).

### FINDING-S6-01 closed

`canonicalSourceMessageIds` returns FORWARD `sourceMessageId`s by `sortOrder` then id, not the holder id. Selection Open original / Copy source and the reference-card **Open original** control GET `/messenger/core/messages/:id` with those source ids. Navigation uses the source `conversationId`. Copy uses the GET source body. GET of `src-1` 404s when the caller can READ the target but not the source. `requireRead` still includes Slice 5 Task ACL.

### FINDING-S6-02 closed

Controller passes `tasksAccessFromUser`. `attachTaskSources` calls `requireTaskEntityAccess` before loading sources or creating rows. `deleteReference` of `TASK_SOURCE` calls `requireTaskEntityAccess` on `entityId`. Tests: attach/delete without Task access 404 and do not delete the source message. `MESSENGER.EDIT` remains required and is not sufficient.

### Remaining (not blocking)

- Combined vitest filters can still omit some Slice 6 files; the explicit 23-test command covers them.
- Duplicated `canonicalSourceMessageIds` on API and web.
- Multi-source Open original navigates to the first INTERNAL source conversation only.
- Mentions persist is not in the same DB transaction as the message.
- Browser not live-clicked; production migrate not run.
- Pre-commit eslint failed on `setState` in `InternalForwardDialog` effect; remount-on-open applied so the VERIFIED commit can land.

## Final status

VERIFIED
