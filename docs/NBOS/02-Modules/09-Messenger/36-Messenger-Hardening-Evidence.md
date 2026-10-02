# Messenger Hardening Evidence

> This file records implementation evidence and master verdicts for the
> hardening program in `35-Messenger-Hardening-Program.md`.
> Product behavior remains governed by `00-Messenger-Master-Canon.md`.

## Phase 1 — Global realtime runtime

Implementer status: `IMPLEMENTED_PENDING_MASTER_REVIEW`

Master status: **ACCEPTED** (2026-10-01)

### What the code does

Authenticated app routes render `MessengerRealtimeProvider` inside
`PermissionProvider`, `QueryProvider` (root layout), and `MessengerPersistProvider`.
When persist identity withhold returns null, the provider unmounts and the socket
closes.

The provider opens one Socket.IO client on `MESSENGER_SOCKET_NAMESPACE` only when
the signed-in employee can `VIEW` `MESSENGER` and `me.id` is present. The token
comes from `recoverRealtimeSession`. `connect_error` calls that same recovery:
a confirmed invalid session stops the socket; a replacement access token opens a
new socket. There is one production `io(` call site,
`apps/web/src/features/messenger/realtime/messenger-socket-client.ts`.

`MessengerSubscriptionRegistry` is React-free. The first `acquire` of a
conversation id asks the driver to emit `MESSENGER_WS_CLIENT_SUBSCRIBE_CONVERSATION`.
Further acquires do not. `release` decrements. A leave
(`MESSENGER_WS_CLIENT_LEAVE_CONVERSATION` with `{ conversationId }` only) is
emitted when the count hits 0 and the server had acknowledged `{ ok: true }`.
A false or missing ack is not a join, so a later release does not leave. If the
ack arrives after the count is already 0 and `{ ok: true }`, the client emits
leave and does not keep a joined flag. A stale ack for a conversation that is
still wanted does not leave and does not mark the newer attempt joined.
Reconnect calls `resubscribeAll`, which emits subscribe again for every id whose
refcount is greater than 0, including one that previously failed before
authorization. Conversation leave never targets `messenger:user:{employeeId}`.

`handleConnection` still starts authentication without blocking the Socket.IO
handshake. `subscribeSocketAfterAuth` waits for that promise before it reads
`employeeId` or calls `employeeMayUseCoreConversation`. A missing employee id is
not a permanent denial: the ACL, including the Task branch, runs only after auth
settles and an employee id is present. Auth that finishes with no employee id
acks `{ ok: false }` and does not join.

The server emits `messenger.presence.snapshot` only after it stores
`employeeId`. Until that snapshot, a `{ ok: false }` subscribe is an auth hold.
If the refcount is still greater than 0, the client subscribes again when the
snapshot arrives, and a later `{ ok: true }` marks the room joined. A
`{ ok: false }` after the snapshot is a real denial: the room stays unjoined and
is not retried until reconnect or a new acquire from refcount 0.
`employeeMayUseCoreConversation` itself is unchanged.

While the socket is up, Core events update the root `QueryClient` even if no
Messenger screen is mounted:

- conversation message → `applyMessengerRealtimeMessage` (the wire payload has no
  zone; the existing reducer keys by `conversationId` and does not create a thread
  cache that was never loaded)
- summary → `applyMessengerRealtimeSummary` using `payload.zone`
- conversation read → `applyMessengerRealtimeRead` using `payload.zone`
- list-scope read → invalidate Internal and Client summary queries
- access changed → `applyMessengerAccessChanged` for `payload.zone` with no open
  thread required

Open Internal Messenger, Client Messenger, and entity panels still register the
active id. An access event whose id matches calls their existing clear
(`setActiveId(null)` or, for an entity panel, clearing the composer draft). The
cache purge removes the entity query, so the panel does not keep a writable
thread for a revoked conversation. Reconnect runs `recoverMessengerZone` once
for `INTERNAL` and once for `CLIENT`. That recovery is not run for ordinary
live messages. Disconnect and reconnect do not delete cached messages.
Connection state is `idle`, `connecting`, `connected`, `reconnecting`, or
`disconnected` via `useMessengerConnectionState`.

Internal Messenger, Client Messenger, and entity panels call
`useInternalMessengerRealtime`, which only retains/releases and registers the
open surface. Legacy `/messenger/legacy` still mounts `MessengerClient`.
`useMessengerRealtime` listens and emits channel subscribe, channel/DM typing,
presence, and peer-read on the shared socket. It does not call `io()`.
`useMessengerConversationTyping` can emit `MESSENGER_WS_CLIENT_TYPING_CONVERSATION`.
Composer typing UX is unchanged. Task discussion is not subscribed in this phase.
`useMessengerConversationSubscription` is the public retain/release API it can
call later.

TanStack Query remains the only client cache. No Redux, Zustand, or second
`QueryClient`.

### Checks run

From the repo root, `pnpm exec vitest run` on:

- `apps/web/src/features/messenger/realtime`
- `apps/web/src/features/messenger/query/messenger-realtime-cache.test.ts`
- `apps/web/src/features/messenger/query/messenger-delta-recovery.test.ts`
- `apps/web/src/features/messenger/query/messenger-phase6-realtime-gate.test.ts`
- `apps/web/src/lib/api/messenger-core.test.ts`
- `apps/web/src/lib/api/messenger-core-client.test.ts`
- `apps/web/src/features/messenger-internal/internal-section-navigation.test.ts`
- `apps/web/src/features/messenger-client/client-section-navigation.test.ts`
- `apps/api/src/modules/messenger/messenger-gateway-core-subscribe.test.ts`

Result: **12 files, 71 tests, all passed** (Vitest 5.0.0).

`pnpm exec prettier --write` was run on every touched file.

`pnpm exec eslint` on the touched TypeScript files reported no errors.

`pnpm --filter @nbos/web typecheck` reports no errors under `src/features/messenger`. It does report two pre-existing errors in `.next/types/validator.ts` for missing `checklist-templates` pages. Those pages were not part of this phase.

`pnpm --filter @nbos/api typecheck` passed with `NODE_OPTIONS=--max-old-space-size=8192`. The default Node heap ran out of memory before that run finished.

### Checks not run

- Full monorepo `pnpm test`
- Browser exercise of two surfaces on one conversation, revoke, or reconnect
- API tests other than `messenger-gateway-core-subscribe.test.ts`

### Intentionally not done

- Optimistic send, `clientMessageId`, and removing `sendBusy` (Phase 3)
- Redis adapter and `socket-io.adapter.ts` (Phase 6)
- Client Portfolio routing (Phase 5)
- A Right Rail component
- Wiring Task discussion to subscribe (Phase 2), other than the public subscription hook
- Auto-read policy
- Database migrations and changes to `employeeMayUseCoreConversation`
- Marking Phase 1 accepted in doc 35

### Known limits

- There is no client event to leave a legacy channel room. After leaving
  `/messenger/legacy`, that channel room stays joined until the socket reconnects.
- A `{ ok: false }` after the socket is authorized is not retried until reconnect
  or a new acquire from refcount 0. A `{ ok: false }` before the post-auth
  presence snapshot is retried once that snapshot arrives, if the refcount is
  still greater than 0.
- Message events still do not create a thread cache for a conversation that was
  never loaded. Summary and access updates still apply.
- Zone recovery on reconnect is one in-flight call per zone. Open surfaces are
  passed in as `openConversationIds` / `onRemoved` so more than one active id can
  be cleared. This was not browser-verified.
- Dev Strict Mode stops and restarts the socket because the provider effect
  cleans up. Subscriptions are retained on the same hub and restored on connect.

### Master review

Independent review after the subscribe-ack fix:

- One production `io(` call site. Internal Messenger, Client Messenger, entity panels, and `/messenger/legacy` use the shared hub.
- `subscribeSocketAfterAuth` waits for the connection auth promise before `employeeMayUseCoreConversation`. Task ACL is still applied. A settled auth with no employee id does not join.
- An `{ ok: false }` before the post-auth presence snapshot is held and retried while the refcount stays positive. An `{ ok: false }` after that snapshot is not retried. A late success after refcount 0 still leaves.
- Reconnect calls `resubscribeAll` for refcount greater than 0 and does not delete cached messages.
- Summary, read, message, and access events apply on the root QueryClient while no chat surface is mounted.

Master re-ran from the repo root:

`pnpm exec vitest run` on `apps/web/src/features/messenger/realtime`, `messenger-realtime-cache.test.ts`, `messenger-phase6-realtime-gate.test.ts`, and `messenger-gateway-core-subscribe.test.ts`.

Result: **7 files, 43 tests, passed.**

Not browser-verified. Full monorepo test was not run.

Residual Low debt, deferred on purpose:

- Legacy channel subscribe and typing still return immediately when `employeeId` is missing. Core conversation subscribe does not. `/messenger/legacy` is the only caller, and that route already ignored a failed subscribe before this program.
- Legacy channel rooms have no leave event.
- A thread cache is not created for a conversation that was never loaded.
- Presence now follows the authenticated app socket, not the Messenger screen being mounted. Legacy presence UI is the only reader.

No Critical, High, or Medium defects remain for Phase 1. Phase 2 may start.

## Phase 2 — Cross-module unification

Implementer status: `IMPLEMENTED_PENDING_MASTER_REVIEW`

Master status: **ACCEPTED** (2026-10-01)

### What was already shared

Internal Messenger, including direct chats, already retains the open id through
`useInternalMessengerRealtime` and reads `useMessengerMessages(activeId)`. A
direct chat is created and then opened as that same active id. It does not keep
a private message array.

Product chat, connected Work Space discussion, standalone Work Space discussion,
Deal internal discussion, and Project General already mount
`EntityConversationPanel`. That panel uses `useEntityConversation`, which
ensures through the existing server methods, reads
`useMessengerMessages(conversation.id)`, and retains with
`useInternalMessengerRealtime`. Those panels were not rewritten.

Product chat calls `ensureProduct`. A Work Space discussion calls
`ensureWorkSpace`. On the server, `ensureWorkSpaceConversation` calls
`ensureProductWorkConversation` when the workspace has a `productId`, so a
connected Product Work Space and Product chat resolve to one product
conversation. That is already locked by
`returns the same conversationId for Product Chat and Connected Work Space Discussion`
in `messenger-core-entity-ensure.ops.test.ts`. The client does not send a second
canonical key. A standalone Work Space has no `productId` and keeps its own
workspace canonical key. That server code was not changed, and that test was
not re-run.

Client Messenger already uses the same runtime. Portfolio routing stays Phase 5.
Legacy `MessengerClient` still keeps its own channel/DM message array. It is not
one of the canonical Core surfaces in this phase.

### What changed

Task Discussion now retains its loaded conversation on
`useInternalMessengerRealtime`. It does not call `io()` and it does not create a
second cache. It still observes `useObservedMessengerMessages`.

The retain is active only while discussion is open. On desktop that is the open
Task sheet. On a mobile viewport it is the open Task sheet and the nested chat
sheet. Closing the Task sheet, or closing the mobile chat sheet, passes a null
conversation into the existing retain/release hook. If Messenger still holds
that id, the registry does not leave.

Opening the discussion does not call `markRead`.

An Internal access event for the open Task conversation uses the existing
surface binding. `clearActive` stops treating that id as the open conversation
for the current discussion session: this surface releases, the observed
messages clear, the composer is disabled, and send does not post.
`employeeMayUseCoreConversation`, including the Task ACL branch, is unchanged.

### Checks run

From the repo root, `pnpm exec vitest run` on:

- `apps/web/src/features/tasks/components/use-task-discussion.realtime.test.ts`
- `apps/web/src/features/tasks/components/use-task-discussion.subscription-source.test.ts`
- `apps/web/src/features/tasks/components/use-task-discussion.send.test.ts`
- `apps/web/src/features/tasks/components/seed-task-discussion-messages.test.ts`

Result: **4 files, 12 tests, all passed** (Vitest 5.0.0).

The realtime file covers subscribe while open, leave on close, keeping the room
when another retain is still held, a socket message landing in the shared cache
that the Task hook already observes, access revoke clearing that thread, and no
`markRead` from the subscribe. A source check only supplements that.

`pnpm exec prettier --write` was run on every touched file.

`pnpm exec eslint` on the touched Task TypeScript files reported no errors.

`pnpm --filter @nbos/web typecheck` reports no errors in the touched Task files.
It still reports the two pre-existing errors in `.next/types/validator.ts` for
missing `checklist-templates` pages.

### Checks not run

- Full monorepo `pnpm test`
- Browser exercise of Task Discussion against Messenger, revoke, or mobile chat close
- API tests, including `messenger-core-entity-ensure.ops.test.ts` (server ensure was not changed)
- `pnpm --filter @nbos/api typecheck`

### Intentionally not done

- Optimistic send, `clientMessageId`, and removing `sendBusy` (Phase 3)
- A `messenger.typing_conversation` handler. Existing composer typing was left as it was
- Redis adapter (Phase 6)
- Client Portfolio routing (Phase 5)
- Auto-read policy (Phase 4). Entity panels still mark read when a conversation id appears
- Database migrations and changes to `employeeMayUseCoreConversation`
- Marking Phase 2 accepted

### Known limits

- `useIsMobileViewport` hydrates as desktop. A mobile Task sheet can retain for
  that first commit, then release if the nested chat sheet is closed.
- Task realtime uses the same Messenger `VIEW` gate as the shared socket. An
  employee without that permission still loads discussion over HTTP. The socket
  is not started for them.
- The local revoked flag lasts for the current open discussion session. Closing
  and opening the discussion again can subscribe once more. A `{ ok: false }`
  subscribe ack does not itself disable the composer. The access event does.
- Not browser-verified.

### Master review

Task Discussion retains the loaded conversation through `useInternalMessengerRealtime` only while `discussionOpen` is true. Desktop keeps that open for the whole sheet. Mobile keeps it open only while the nested chat sheet is open. Closing releases this retain. A second retain, such as Messenger on the same id, keeps the room joined. The hook does not call `io()` or `markRead`.

A socket message is applied by the shared hub into the message cache Task already observes. Access revoke for the open id clears the messages, disables the composer, and leaves when this surface was the last retain. Send is refused locally while that flag is set.

Product chat and a connected Work Space already share one server conversation: `ensureWorkSpaceConversation` calls `ensureProductWorkConversation` when `productId` is set. Deal, Project General, and standalone Work Space already use the entity panel and the shared runtime. Those panels were not rewritten.

Master re-ran from the repo root:

`pnpm exec vitest run` on the Task discussion realtime, source, send, and seed tests, plus `messenger-core-entity-ensure.ops.test.ts`.

Result: **5 files, 27 tests, passed.**

Not browser-verified. The mobile first-paint retain and the reopen-after-revoke composer are Low. They do not leave two sockets or two caches, and a revoked open session does not send.

No Critical, High, or Medium defects remain for Phase 2. Phase 3 may start.

## Phase 3 — Optimistic send

Implementer status: `IMPLEMENTED_PENDING_MASTER_REVIEW`

Master status: **ACCEPTED** (2026-10-01)

### What the code does

A normal text send on Internal Messenger, Client Messenger, the entity conversation panel (Product, Work Space, Deal, Project General), and Task Discussion no longer waits on HTTP before the thread shows the text. The composer clears in the same turn and accepts the next message. Each logical message has its own in-memory lifecycle. `sendBusy` is gone from those composers. Legacy `/messenger/legacy` still locks its own composer.

`claimComposerSend` creates one `crypto.randomUUID()` idempotency key when a submit is accepted. The key is stored on the optimistic cache row (`idempotencyKey` and `localSend.idempotencyKey`) and in an in-memory map of in-flight sends. A double-click of the same draft is ignored and does not create a second key. Typing the text again is a new logical message and a new key. Retry calls `retryTrackedCoreSend` with the key already on the failed row. A timeout after the first attempt does not generate a new key.

Each tracked send stores the `sendSessionEpoch` from the moment it starts. `applyMessengerPersistSessionIdentity` calls `resetOptimisticCoreSendState` when the signed-in employee changes or the session signs out. That increments the epoch and clears the in-flight map and composer claims. Clearing the map does not stop a function that is already awaiting HTTP: it still holds the `TrackedCoreSend`. After `await`, `deliverTrackedSend` writes the cache only when that send's epoch is still current. A late success does not insert the canonical row or change the inbox preview that persistence snapshots. A late failure does not set `localSend` to `failed` and does not call `onFailure`. Applying the same employee again does not increment the epoch, so retry, a double-click, and websocket/HTTP collapse stay as they are for a stable session. Retry still posts the original idempotency key.

The optimistic row is inserted into the shared message cache before the request. UI phases `pending`, `sending`, `failed`, and `retrying` live on `localSend`. They are not written into `MessengerMessageStatus`. A canonical HTTP or websocket row drops `localSend`.

`mergeCoreRealtimeMessage` keeps one row per server id and per idempotency key. Socket-before-HTTP replaces the local id with the server id. HTTP-before-socket updates that same id in place. A late copy does not append and does not put `localSend` back.

The server already dedupes in `persistCoreMessage` with `lockMessengerHttpIdempotency` and `conversationId_idempotencyKey` on `messenger_messages`. This phase does not add a table or a migration. `mapCoreMessage` now includes `idempotencyKey` on the existing Core message DTO, so the HTTP body and the conversation websocket payload can match the local row.

Task Discussion still posts to `POST /api/tasks/:id/discussion`. That handler now accepts an optional `idempotencyKey` and passes it into the existing Core write (`persistAndBroadcast` / `persistCoreMessage`). When the client sends a key, it is stored instead of the actor correlation id. Agent comments that omit the key still use the correlation id. The first Task note, before a conversation id exists, is staged in the message cache under `task-pending:{taskId}` and moved onto the real id when the response arrives.

Client optimistic rows set `direction: OUTBOUND` and leave `status` unset. The receipt is "Sending" or, on failure, "Not sent". After the server responds, the label follows the server status (`Queued`, `Sent`, `Failed`, and `Delivered` or `Read` only when the server says so). Saving the NBOS row does not mark the provider delivered. Internal rows do not show a provider receipt from the local phase. A failed send stays in the thread with its original text and a Retry control.

An in-memory pending row disappears on refresh. There is no IndexedDB outbox.

### Checks run

From the repo root, `pnpm exec vitest run` on:

- `apps/web/src/features/messenger/query/messenger-optimistic-send.test.ts`
- `apps/web/src/features/messenger/merge-core-realtime-message.test.ts`
- `apps/web/src/features/messenger-internal/send-internal-thread-message.test.ts`
- `apps/web/src/features/messenger-client/send-client-thread-message.test.ts`
- `apps/web/src/features/tasks/components/use-task-discussion.send.test.ts`
- `apps/web/src/features/tasks/components/use-task-discussion.realtime.test.ts`
- `apps/web/src/features/tasks/components/use-task-discussion.subscription-source.test.ts`
- `apps/web/src/features/messenger/query/messenger-phase6-realtime-gate.test.ts`
- `apps/api/src/modules/messenger/core/messenger-core-message.ops.test.ts`
- `apps/api/src/modules/tasks/task-discussion.service.test.ts`

Result: **10 files, 44 tests, all passed** (Vitest 5.0.0).

Those tests show a second text send is not rejected while the first HTTP call is open, a retry reuses one key, websocket-before-HTTP yields one cache row, and HTTP-before-websocket yields one cache row. Ordering is asserted with deferred promises, not wall-clock sleeps.

Session-identity discard was checked after that, from the repo root, with `pnpm exec vitest run` on:

- `apps/web/src/features/messenger/query/messenger-optimistic-send.test.ts`
- `apps/web/src/features/messenger/persist/messenger-persist-boundary.test.ts`
- `apps/web/src/features/messenger/persist/messenger-persist-identity.test.ts`
- `apps/web/src/features/messenger/persist/messenger-persist-generation.test.ts`

Result: **4 files, 21 tests, passed** (Vitest 5.0.0). The optimistic-send file covers a late HTTP success after an employee change, a late success after sign-out, a late HTTP failure after an employee change, and a success that still reconciles when the same employee is applied again. The employee-change case asserts the other employee's message cache and the persisted inbox snapshot do not contain the first employee's text.

The same command on the other web files from the list above (merge, both thread send tests, the three Task discussion tests, and the phase 6 realtime gate) passed: **7 files, 23 tests**. The two API files in the earlier list were not re-run.

`pnpm exec prettier --write` was run on every touched file.

`pnpm exec eslint` on the touched TypeScript files reported no errors.

### Checks not run

- Full monorepo `pnpm test`
- `pnpm --filter @nbos/web typecheck`
- `pnpm --filter @nbos/api typecheck`
- Browser exercise of Enter, a second message, retry, or a lost response

### Intentionally not done

- IndexedDB outbox that survives reload (Phase 6)
- Redis adapter
- Portfolio routing
- Auto-read policy
- A new typing protocol
- Removing the legacy `/messenger/legacy` composer lock
- Weakening Client SEND versus Client READ
- A database migration or a second message table
- Phase 4
- Marking Phase 3 accepted

### Known limits

- Refresh drops an in-memory pending or failed row. A retry after refresh is a new key unless the user still has the old one, which they do not. A lost response that already committed can be retried safely only before refresh.
- The inbox preview updates when the canonical row arrives, not when the optimistic row is inserted. A send whose employee is no longer the active session does not update that preview.
- A response that arrives after sign-out or an account switch is ignored. If the server already stored the row, that employee sees it on a later normal load. It is not written into the other employee's cache or persisted inbox snapshot.
- The first Task note is staged under `task-pending:{taskId}` until the response includes a real conversation id. That key is not a conversation.
- A websocket payload without `idempotencyKey` cannot replace the local row. The updated `mapCoreMessage` sends the key. An older server build would not.
- `TaskSheet.tsx` remains over 300 lines. It was already over that limit in the Phase 2 working tree. This phase added `onDraftChange`.
- Not browser-verified.

### Master review

A normal Core text send inserts an optimistic row, clears the composer, and posts with one `idempotencyKey`. A second different text starts its own request. A double-click does not. Retry posts the same key. Websocket-before-HTTP and HTTP-before-websocket each leave one cache row. Client optimistic rows do not use a provider Delivered label; that label follows the server status after reconciliation.

`applyMessengerPersistSessionIdentity` bumps `sendSessionEpoch` when the employee changes or the session signs out. An in-flight response writes only if its epoch still matches. The same employee applied again does not bump the epoch, so that send still reconciles.

Master re-ran from the repo root:

`pnpm exec vitest run` on `messenger-optimistic-send.test.ts`, `merge-core-realtime-message.test.ts`, both thread send tests, and `use-task-discussion.send.test.ts`.

Result: **5 files, 22 tests, passed.**

Not browser-verified. A refresh still drops the in-memory pending row. That remains Phase 6.

No Critical, High, or Medium defects remain for Phase 3. Phase 4 may start.

## Phase 4 — Lifecycle completeness

Implementer status: `IMPLEMENTED_PENDING_MASTER_REVIEW`

### What already published

These durable writes already emitted a cache-converging websocket event. Phase 4 did not add a second name for them.

- New Core message: `messenger.conversation.message` and `messenger.conversation.summary`, after persist.
- Own read cursor: `messenger.read.updated` with conversation scope, after `markCoreConversationRead` commits. The targeted `READ` revision still advances inside that same transaction.
- Access lost: `messenger.conversation.access_changed`, published by `evictIfCoreReadLost` only after the participant or override transaction, and only when read is actually lost.
- Legacy channel and DM peer read: `messenger.channel.peer_read` and `messenger.dm.peer_read`.
- Provider revoke and provider edit already published `messenger.conversation.message` from the WhatsApp webhook after the lifecycle function returns.

### What this phase added

- `messenger.conversation.favorite` (`MESSENGER_WS_SERVER_CONVERSATION_FAVORITE`). Absolute boolean, user room. Emitted from Internal and Client `toggleFavorite` only after `toggleInternalFavorite` / `toggleClientFavorite` return, which is after the favorite transaction commits. The targeted `FAVORITE` revision was already allocated inside that transaction. No second revision kind.
- Core `markRead` now also emits the existing `messenger.conversation.peer_read` to the conversation room, in the same post-commit function as `messenger.read.updated`.

Provider ack, edit, and revoke now call `commitWhatsAppMessageRevision` inside the same `runMessengerWriteTx` as the business write. Ack bumps only when the status actually changes. The webhook still publishes the message after that function returns. A revoke sets `deletedAt`; the open message cache removes that id. The summary preview becomes null when the tombstone is the latest row at the same `lastMessageAt`, so an older timestamp still cannot move the inbox backward.

### Revision relative to commit

No new table and no migration. Existing writers stay inside the write transaction:

- Favorite: `bumpTargetedFavoriteRevision` inside the favorite transaction. Publish is after return.
- Read cursor: `bumpTargetedReadRevision` inside `markCoreConversationRead`. Publish is after return. Mark read does not also bump the global conversation revision. A sender refetch would replace a client-only READ overlay with the stored status.
- Participant add and access-override grant: `bumpGlobalConversationRevision` inside the write transaction. Remove and override revoke bump targeted `ACCESS_REMOVED` inside the transaction. The access-changed event stays after that transaction.
- Attention assignment: `bumpGlobalConversationRevision` for `CLIENT` inside `assignConversationAttention`. The acting client still patches its cache from the HTTP response.
- WhatsApp ack, edit, and revoke: `bumpGlobalConversationRevision` inside the same transaction as the message update.
- Conversation create, including its title, already bumps the global revision inside its transaction. There is no later title-update mutation.

### Auto-read

A conversation is marked read only when its id is set, the thread is the active mounted thread, and `document.visibilityState` is `visible`. Selecting an id is not enough. `openInternalConversation` and `openClientConversation` no longer call `markRead`. `useEntityConversation` no longer calls `markRead` when an entity conversation id appears.

`MessengerVisibleReadCoalescer` waits `MESSENGER_VISIBLE_READ_COALESCE_MS` (300). A burst shares one in-flight request. A follow-up is armed only if a newer note arrived while that request was in flight. Hiding the document cancels a timer that has not fired. Internal Messenger, Client Messenger, and entity panels use this gate. Task Discussion does not call `markRead`.

### Entity access revoke

An `access_changed` event for the open entity conversation sets a session `revokedId` keyed by entity id, the same render-time reset pattern Task Discussion uses. While that id matches the loaded conversation, the hook passes a null conversation id into realtime retain, so the subscription stops. Messages render empty. `canWrite` is false and send does not post. `applyMessengerAccessChanged` still removes the message query and the matching entity query. `employeeMayUseCoreConversation` was not changed. A later successful ensure for the same entity does not clear `revokedId`, so the panel does not resubscribe in that session.

### Checks

From the repo root, `pnpm exec vitest run` on:

- `apps/web/src/features/messenger/query/messenger-phase4-lifecycle.test.ts`
- `apps/web/src/features/messenger/query/messenger-visible-read.test.ts`
- `apps/web/src/features/messenger-internal/use-entity-conversation.access.test.ts`
- `apps/web/src/features/tasks/components/use-task-discussion.realtime.test.ts`
- `apps/web/src/features/tasks/components/use-task-discussion.subscription-source.test.ts`
- `apps/web/src/features/tasks/components/use-task-discussion.send.test.ts`
- `apps/web/src/features/messenger/realtime/messenger-realtime-cache-bind.test.ts`
- `apps/web/src/features/messenger/merge-core-realtime-message.test.ts`
- `apps/web/src/features/messenger/query/messenger-realtime-monotonicity.test.ts`
- `apps/api/src/modules/messenger/core/messenger-wa-lifecycle-revision.test.ts`
- `apps/api/src/modules/messenger/core/messenger-wa-lifecycle.ops.test.ts`
- `apps/api/src/modules/messenger/core/messenger-core.service.test.ts`
- `apps/api/src/modules/messenger/core/messenger-outbound-p4b-lock-order.test.ts`
- `apps/api/src/modules/messenger/core/messenger-wa-outbound.ops.test.ts`
- `apps/api/src/modules/messenger/core/messenger-wa-outbound-s8-10.ops.test.ts`
- `apps/api/src/modules/messenger/core/messenger-outbound-p4b-identity-proof.test.ts`
- `apps/api/src/modules/integrations/whatsapp-gateway/whatsapp-gateway-webhook.retry.test.ts`
- `apps/api/src/modules/messenger/messenger-gateway-fanout.test.ts`

Result: **18 files, 106 tests, passed.**

The lifecycle tests cover: a tombstone removes the open row and a duplicate tombstone does not recreate it; favorite updates the summary and does not invalidate the list; a hidden document does not mark read and a visible open thread does, once per burst; a duplicate message plus a duplicate peer read leaves one row; READ does not regress to DELIVERED. The entity test covers revoke stopping retain, emptying messages, and refusing send. The WhatsApp revision test asserts revoke and edit record update, then revision, then commit.

### Checks not run

- Full monorepo `pnpm test`
- `pnpm --filter @nbos/web typecheck`
- `pnpm --filter @nbos/api typecheck`
- ESLint
- Browser exercise of a visible thread, a hidden tab, entity revoke, or favorite on a second session

### Intentionally not done

- Pin and unpin. `MessengerUserConversationSetting.pinned` exists and defaults to false. There is no pin API, writer, or UI.
- An employee delete of their own message. The only `deletedAt` writer is WhatsApp revoke.
- A title-update mutation. Title is set when the conversation is created.
- A new participant-list event. Add, leave, and access-override already advance the existing revision inside the write transaction. Loss of read still publishes `messenger.conversation.access_changed` after commit.
- A live attention event. Assignment already bumps the CLIENT conversation revision inside its transaction, and the acting client patches attention from the HTTP response.
- A typing protocol. There is still no server handler for `messenger.typing_conversation`.
- Optimistic send, the idempotency key, and `sendSessionEpoch`.
- IndexedDB outbox, Redis adapter, and Client Portfolio routing.
- A new table or a migration.
- `scripts/migrate-prod.mjs` was not modified.
- Phase 5.
- Marking Phase 4 accepted.

### Known limits

- A missed `messenger.conversation.peer_read` is not repaired by the sender's delta. The reader's revision is targeted `READ` for that employee. Message status READ is not stored on mark read. Bumping the global conversation revision on read would invalidate the thread and could replace the overlay with the stored status.
- Another open Client session does not see an attention change until delta or a refetch. The acting session updates immediately.
- A revoked entity panel stays revoked for that entity id until the entity id changes, even if ensure later succeeds.
- Equal `lastMessageAt` can replace `lastMessagePreview`. An older `lastMessageAt` still cannot.
- Not browser-verified.

## Master review — Phase 4 — 2026-10-01

```text
PHASE 4 — complete message / conversation lifecycle

STATUS:
REJECTED

Implemented:
Favorite, peer read, WhatsApp ack/edit/revoke revision, Internal/Client/entity visible read, and entity access revoke match the inspected code. Pin and own-message delete have no writer.

Verified:
Favorite publish runs after the write transaction returns. WhatsApp ack, edit, and revoke bump the zone revision inside `runMessengerWriteTx`, then the webhook emits the mapped message, including `deletedAt`. Entity revoke nulls the subscription, empties messages, and disables send. Internal and Client visible read require a resolved active conversation plus a visible document, coalesced at 300ms.

Tests:
Master re-ran 5 files, 24 tests, passed:
messenger-phase4-lifecycle, messenger-visible-read, use-task-discussion.realtime, messenger-wa-lifecycle-revision, messenger-wa-lifecycle.ops.
The task realtime test asserts markRead is not called when the discussion opens. That assertion currently proves the gap.

Adversarial scenarios checked:
Tombstone duplicate, favorite duplicate, hidden document, READ not regressing, WhatsApp revoke inside the transaction, entity revoke. An open visible Task discussion does not advance the read cursor.

Findings:
Critical: 0
High: 0
Medium: 1
Low: pin has no writer; own-message delete has no writer; a missed peer_read is not in the sender delta; no browser verification

Medium:
Task Discussion, while open, document-visible, and bound to a real conversation id, never calls mark read. The hook documents that, and the subscription source test forbids the string markRead. Subscribe alone must still not mark read. A visible open thread must, through the existing coalescer, and must not mark read when the sheet is closed, the document is hidden, access is revoked, or the id is still task-pending.

Residual debt:
Unchanged Low items above.

Can Phase 5 start?
NO
```

## Task visible read — 2026-10-01

Task discussion now marks an Internal conversation read through `useVisibleConversationRead` only while the thread is open, the document is visible, Messenger VIEW is granted, and the conversation id is a server id. A hidden document, a discussion that closes before the 300ms coalesce window, access revoke, and a `task-pending:` id do not mark read. A burst stays one request. After a successful mark, unread for that Internal conversation is patched to 0.

## Master review — Phase 4 accepted — 2026-10-01

```text
PHASE 4 — complete message / conversation lifecycle

STATUS:
ACCEPTED

Implemented:
The earlier rejection stands as history. The Task gap is closed in useTaskDiscussion via useVisibleConversationRead. openServerConversationId returns null unless the discussion is open, not revoked, and the id is not task-pending:. threadMounted also requires Messenger VIEW. markVisibleTaskRead calls messengerCoreApi.markRead and then patchConversationUnread for INTERNAL.

Verified:
Desktop task sheet keeps the chat column mounted, so an open sheet with a visible document is a real thread. Mobile still uses discussionOpen = open && chatOpen. Subscribe-before-window still does not mark read. Hiding the document, closing the discussion, revoking access, lacking Messenger VIEW, and a pending id do not mark read. A three-message burst is one request. Unread patch only rewrites an existing summary row.

Tests:
Master re-ran 5 files, 21 tests, passed:
use-task-discussion.visible-read, use-task-discussion.realtime, use-task-discussion.subscription-source, use-task-discussion.send, messenger-visible-read.
The source test no longer bans the string markRead. It still forbids io( and still requires the shared runtime and discussionOpen.

Adversarial scenarios checked:
Hidden document before the timer, close before the timer, revoke before the timer, pending id, no Messenger VIEW, burst coalescing, immediate subscribe does not read.

Findings:
Critical: 0
High: 0
Medium: 0
Low: 4

Residual debt:
- Pin and unpin have no writer or UI. MessengerUserConversationSetting.pinned stays unused.
- There is no employee delete-own-message API. deletedAt is the WhatsApp revoke tombstone.
- A missed peer_read is not repaired by the sender delta. Mark read does not store READ on the message.
- Not browser-verified. A late markRead patch after account switch only updates summary rows still in the cache.

Can Phase 5 start?
YES
```

## Phase 5 implementer evidence — 2026-10-01

```text
STATUS: IMPLEMENTED_PENDING_MASTER_REVIEW

This is an implementer record. It is not a master acceptance.
```

### Already correct (inspected, not rewritten)

- WhatsApp: webhook claim, then Core persist or lifecycle update, then `publishPersistedCoreMessage`. Ack, edit, and revoke bump the zone revision inside the write transaction. Revoke maps `deletedAt`. A lifecycle event before the message mapping throws retryable 503 and does not mark the provider event settled. `OUTCOME_UNKNOWN` is not a resend. Duplicate provider events are claimed once.
- An open Client thread removes a row when the published message has `deletedAt`. A second tombstone does not recreate it (`messenger-phase4-lifecycle.test.ts`). `mergeCoreRealtimeMessage` now has the same tombstone assertion.
- Meta Instagram/Facebook ingest still claims the provider event, creates or reuses the Lead, persists one Core message, and calls `publishPersistedCoreMessage` after the transaction. Duplicate webhooks do not create a second lead or a second publish.
- Client SEND stays a separate decision. The access loader does not read product communication bindings, conversation links, product team, or collections. `clientSendScope: NONE` does not send, including for an active member.
- Support still stores `TICKET_SOURCE` references and links an open row to `/client-messenger?conversation=`. There is no Public/Internal composer and no second embedded chat.

### Changed

- Contact and Company portfolio communication actions open Client Messenger. The quick-action sheet mounts `ClientMessengerApp`. The communication tab links to `/client-messenger` with `portfolioContactId` or `portfolioCompanyId`. Internal Messenger is not opened.
- `GET /api/messenger/core/client/portfolio-scope` collects CLIENT conversations from active product communication bindings, CLIENT product links, and, for a contact, CLIENT lead links. Client READ filters that set. One readable id opens that conversation. Zero or many ids show a scoped Client Messenger list and do not pick a thread. A binding does not grant READ or SEND.
- Finance reminders persist as before, then `publishPersistedCoreMessage` runs after the Core write and the `core_client_send` offer. The published status is the persisted status (`QUEUED`), not WhatsApp delivered. `InvoiceCardRemindersService` and `InvoiceOverdueRemindersService` pass the API process gateway.
- An open Support ticket loads source references through TanStack Query. The same tab invalidates that query after attach. The open ticket retains the source conversation on the shared socket and refetches the reference list when that conversation's message cache updates, so an edit or revoke can refresh the preview. The original link stays the Client Messenger deep link.

### Tests

From the repo root, `pnpm exec vitest run` on:

- `apps/api/src/modules/messenger/core/messenger-portfolio-client-scope.ops.test.ts`
- `apps/api/src/modules/messenger/core/messenger-finance-reminder.ops.test.ts`
- `apps/api/src/modules/messenger/core/messenger-core-access-negatives.test.ts`
- `apps/api/src/modules/messenger/core/messenger-core-access.test.ts`
- `apps/api/src/modules/finance/invoices/invoice-card-reminders.service.test.ts`
- `apps/api/src/modules/finance/invoices/invoice-overdue-reminders.service.test.ts`
- `apps/api/src/modules/integrations/meta/meta-lead-ingest.service.test.ts`
- `apps/api/src/modules/integrations/whatsapp-gateway/whatsapp-gateway-webhook.retry.test.ts`
- `apps/api/src/modules/messenger/core/messenger-wa-lifecycle-revision.test.ts`
- `apps/api/src/modules/messenger/core/messenger-wa-lifecycle.ops.test.ts`
- `apps/web/src/features/messenger/merge-core-realtime-message.test.ts`
- `apps/web/src/features/messenger/query/messenger-phase4-lifecycle.test.ts`
- `apps/web/src/lib/api/messenger-core.test.ts`
- `apps/web/src/lib/api/messenger-core-client.test.ts`
- `apps/web/src/features/support/components/ticket-source-query.test.ts`

Result: **15 files, 81 tests, passed.**

Prettier was run on the touched files.

### Checks not run

- Full monorepo `pnpm test`
- `pnpm --filter @nbos/web typecheck`
- `pnpm --filter @nbos/api typecheck`
- ESLint
- Browser exercise of portfolio Client Messenger, a finance reminder fan-out, a WhatsApp revoke on an open Client thread, or an open ticket source list

### Residual risk

- A payment-window reminder created inside the WhatsApp outbound worker, after `official_send`, does not call `publishPersistedCoreMessage`. That worker process does not host the API Socket.IO server. The Core row is still persisted. An open Client thread sees it on delta or refetch. Scheduler and manual overdue runs on the API process do publish after commit.
- Portfolio scope returns at most 40 readable conversation ids. A single readable conversation is not truncated. More than 40 readable chats omit the rest of the list and do not auto-open one.
- A ticket source link added in another session does not push. The acting session invalidates the open ticket query. Edit and revoke refresh the preview only when that ticket is open and the shared runtime delivers the message event.
- Not browser-verified.
- Pin, unpin, and employee delete-own-message still have no writer.
- `scripts/migrate-prod.mjs` was not modified. Docs 32, 33, and 34 were not rewritten. Phase 5 is not accepted.

## Master review — Phase 5 — 2026-10-01

```text
PHASE 5 — Client Messenger and external integrations

STATUS:
REJECTED

Implemented:
Portfolio communication mounts ClientMessengerApp. portfolio-scope filters candidates with Client READ and does not grant SEND. API-process finance reminders publish QUEUED after the outbox offer. WhatsApp and Meta publish paths were left in place. Support still uses source references and a Client Messenger link.

Verified:
Worker applySideEffects calls tryEnqueueSubscriptionPaymentWindowForInvoice with prisma and outbound only. That persists a Core reminder and skips publishPersistedCoreMessage. QueueWorkersModule.forWorker is a separate process from the API socket. SupportTicketSourceMessages retains the room, but the preview refresh listens for a message-cache update, and realtime apply does not create a missing message query.

Tests:
Implementer reported 15 files, 81 tests, passed. Those tests do not cover the worker side effect or an open ticket whose message query is absent. Master did not re-run them before rejection because the missing publish is visible in the worker call.

Adversarial scenarios checked:
Official send in the worker then an eligible payment-window reminder. Open ticket with no Client thread loaded, then an edit or revoke of the source message.

Findings:
Critical: 0
High: 0
Medium: 2
Low: portfolio list cap 40; cross-session ticket attach does not push; not browser-verified

Medium:
1. A payment-window reminder created in the WhatsApp outbound worker after official_send is stored and not published. An open Client thread does not show it until refresh or delta.
2. An open Support ticket does not refresh its source preview on edit or revoke unless that conversation's message query is already cached.

Residual debt:
Unchanged until the two medium findings are closed.

Can Phase 6 start?
NO
```

## Fixer note — two Phase 5 medium defects — 2026-10-01

```text
STATUS: FIXED_PENDING_MASTER_REVIEW

This note records two defect fixes. It is not a Phase 5 acceptance and does not start Phase 6.
```

- A payment-window reminder created in the WhatsApp outbound worker after `official_send` is handed to the API publish path. The worker publishes conversation and message ids on `MessengerPersistedCoreMessageBus`. The API subscriber reloads the row and calls `publishPersistedCoreMessage`. The published status is the stored status (`QUEUED`). That path does not enqueue a second WhatsApp send. The existing idempotency key still prevents a second canonical row. `PROCESS_ROLE=all` without Redis fans out in-process. A worker or scheduler process without Redis does not treat the event as delivered to browsers. The API scheduler reminders still pass the gateway directly.
- An open Support ticket source preview refetches when a socket message event matches a source message already in that ticket query, including when the conversation message query is absent. The client does not copy a second thread. The `/client-messenger?conversation=` link is unchanged. Same-tab attach still invalidates the ticket query. A source link created in another browser session stays non-live until that ticket query is loaded again.

Tests from the repo root, `pnpm exec vitest run` on:

- `apps/api/src/modules/integrations/whatsapp-gateway/whatsapp-outbound-official-send-reminder.test.ts`
- `apps/api/src/modules/messenger/core/messenger-persisted-core-message.bridge.test.ts`
- `apps/api/src/modules/messenger/core/messenger-finance-reminder.ops.test.ts`
- `apps/api/src/modules/integrations/whatsapp-gateway/whatsapp-outbound-messages.worker.test.ts`
- `apps/api/src/modules/finance/invoices/invoice-card-reminders.service.test.ts`
- `apps/api/src/modules/finance/invoices/invoice-overdue-reminders.service.test.ts`
- `apps/web/src/features/support/components/ticket-source-preview.test.ts`
- `apps/web/src/features/support/components/ticket-source-query.test.ts`
- `apps/web/src/features/messenger/realtime/messenger-realtime-cache-bind.test.ts`
- `apps/web/src/features/messenger/query/messenger-phase4-lifecycle.test.ts`

Result: **10 files, 43 tests, passed.** Prettier was run on the touched files.

Not run: full monorepo test, API/web typecheck, ESLint, a Redis pub/sub roundtrip, or a browser exercise.

`scripts/migrate-prod.mjs` was not modified. Docs 32, 33, and 34 were not rewritten. Phase 5 is not accepted.

## Master review — Phase 5 accepted — 2026-10-01

```text
PHASE 5 — Client Messenger and external integrations

STATUS:
ACCEPTED

Implemented:
The rejection above stands as history. The worker now passes financeReminderBusPublisher into the payment-window reminder after official_send. MessengerPersistedCoreMessageBus carries conversationId and messageId. The API subscriber reloads the Client row and calls publishPersistedCoreMessage. Open ticket previews invalidate from the socket message event by source message id, including when the conversation message query is absent.

Verified:
QueueWorkersModule.forWorker imports MessengerDeliveryStatusModule, which provides the bus. MessengerModule registers the subscriber only when shouldStartPublicHttpApi is true (api and all). A worker role without a Redis publisher returns false and does not dispatch locally. PROCESS_ROLE=all without Redis dispatches in-process to the subscriber. The official_send test persists one QUEUED row, enqueues one core_client_send, and publishes that stored status. A second run does not insert or enqueue again. Ticket edit and revoke tests refetch the preview and leave the conversation message query unset. listTicketSourceReferences returns a null preview when deletedAt is set. persistCoreMessage still bumps the zone revision before the publish.

Tests:
Master re-ran 6 files, 19 tests, passed:
whatsapp-outbound-official-send-reminder, messenger-persisted-core-message.bridge, messenger-finance-reminder.ops, ticket-source-preview, ticket-source-query, messenger-realtime-cache-bind.
The worker-without-Redis case logs that browsers were not reached.

Adversarial scenarios checked:
Repeat official_send, INTERNAL zone ignored by the subscriber, blank ids rejected, unrelated ticket message does not refetch, revoke without a loaded thread cache.

Findings:
Critical: 0
High: 0
Medium: 0
Low: 5

Residual debt:
- A split worker or scheduler without REDIS_EVENTS_URL/REDIS_URL withholds live fan-out and logs it. The Core row and revision remain, so delta or refetch can repair. A two-process Redis roundtrip was not executed.
- Portfolio scope returns at most 40 readable conversations. One readable conversation still opens.
- A ticket source link created in another session does not push until that ticket query is loaded again.
- Pin, unpin, and employee delete-own-message still have no writer.
- Not browser-verified.

Can Phase 6 start?
YES
```

## Phase 6 implementer evidence — 2026-10-01

```text
STATUS: IMPLEMENTED_PENDING_MASTER_REVIEW

This is an implementer record. It is not a master acceptance.
```

### Already correct (inspected, not rewritten)

- Reconnect already lives on the one tab socket. Disconnect sets `reconnecting` or `disconnected` and does not delete the message cache. Reconnect restores subscriptions whose refcount is still positive, restores the legacy channel, and runs Internal and Client delta recovery. Global listeners stay on that same socket. `useMessengerConnectionState` exposes the state. No second socket and no SharedWorker.
- Delivery merge is monotonic. `READ` does not become `DELIVERED` or `SENT`. Duplicate message ids stay one row. An older read watermark does not raise unread. HTTP-before-WS and WS-before-HTTP still collapse on the idempotency key.
- IndexedDB already isolates by persist identity, expires at 24 hours, rejects a wrong schema or corrupt envelope, and sign-out clears the store. Summaries and collections stay the only persisted query families.

### Changed

- Socket.IO fan-out uses `@socket.io/redis-adapter` on the existing events Redis clients (`REDIS_EVENTS_URL`, then `REDIS_URL`). CORS credentials are unchanged. `PROCESS_ROLE=all` with Redis unset stays process-local. `PROCESS_ROLE=api` with Redis unset throws at API startup. `worker` and `scheduler` do not host Socket.IO; the resolver refuses them so they do not claim process-local fan-out. A configured Redis URL does not fall back to process-local if Redis is later unreachable.
- Persist schema is now version 3 and adds a Messenger outbox of at most 20 logical sends. A reloaded Internal pending send is shown again and replayed once with the same idempotency key after `getConversation` says `canWrite`. A denied or `task-pending:` id is not transmitted. A Client pending send is restored as `OUTCOME_UNKNOWN` and is not auto-resent. Logout and account switch clear the in-memory outbox. A second tab learns an unacknowledged send through the existing BroadcastChannel plus the stored envelope. It does not share the socket.

### Tests

From the repo root, `pnpm exec vitest run` on:

- `apps/api/src/modules/messenger/core/messenger-socket-io-process-local.test.ts`
- `apps/api/src/socket-io-distributed-fanout.test.ts`
- `apps/web/src/features/messenger/query/messenger-outbox-replay.test.ts`
- `apps/web/src/features/messenger/messenger-delivery-status.test.ts`
- `apps/web/src/features/messenger/merge-core-realtime-message.test.ts`
- `apps/web/src/features/messenger/realtime/messenger-realtime-hub.test.ts`
- `apps/web/src/features/messenger/persist/messenger-persist-channel.test.ts`
- `apps/web/src/features/messenger/persist/messenger-persist-envelope.test.ts`
- `apps/web/src/features/messenger/persist/messenger-persist-write.test.ts`
- `apps/web/src/features/messenger/persist/messenger-persist-hydrate.test.ts`
- `apps/web/src/features/messenger/persist/messenger-persist-generation.test.ts`
- `apps/web/src/features/messenger/persist/messenger-persist-expiry.test.ts`
- `apps/web/src/features/messenger/query/messenger-optimistic-send.test.ts`
- `apps/web/src/features/messenger-client/send-client-thread-message.test.ts`
- `apps/web/src/features/messenger/persist/messenger-persist-boundary.test.ts`

Result: **15 files, 72 tests, passed.**

The cross-server test uses a fake shared Socket.IO adapter, not a live Redis pub/sub roundtrip. Prettier was run on the touched TypeScript files.

### Checks not run

- Live Redis Socket.IO roundtrip
- Full monorepo `pnpm test`
- `pnpm --filter @nbos/api typecheck` (tsc ran out of heap)
- `pnpm --filter @nbos/web typecheck`
- ESLint
- Browser exercise of disconnect, reload replay, or two tabs

### Residual risk

- Production `PROCESS_ROLE=api` must have `REDIS_EVENTS_URL` or `REDIS_URL`. Without it the API process throws and does not serve process-local fan-out. A URL that is set while Redis is down still selects the Redis adapter; it does not silently degrade.
- Two tabs can each POST the same Internal idempotency key. The server still stores one row. A Client or provider send is not auto-replayed; an ambiguous reload stays `OUTCOME_UNKNOWN` until delta or refetch reconciles it.
- Schema v3 drops previously stored v2 summary envelopes. The outbox cap is 20. A combined envelope over the existing byte cap is not written, so that pending send would not survive reload.
- Not browser-verified. Pin, unpin, and employee delete-own-message stay out of scope.
- `scripts/migrate-prod.mjs` was not modified. Docs 32, 33, and 34 were not rewritten. Phase 6 is not accepted.

## Master review — Phase 6 — 2026-10-01

```text
PHASE 6 — distributed reliability, offline, and recovery

STATUS:
REJECTED

Implemented:
Socket.IO fan-out selection matches the process-role rules. Production api without Redis is refused. Local all without Redis stays process-local. Reconnect still restores subscriptions and calls noteMessengerSocketReady. Internal reload replay uses the same idempotency key after canWrite. Client reload is withhold and OUTCOME_UNKNOWN. Sign-out clears outbox memory.

Verified:
revokeMessengerPersistGeneration does not call clearMessengerOutboxMemory. Only purgeMessengerPersistForSignOut and the test reset do. readMessengerOutbox and mergeRemoteMessengerOutbox and upsertMessengerOutboxEntry are bound to the first identity left in memory. Account switch therefore keeps user A's rows bound. User B's snapshot reads an empty outbox, and B cannot hydrate or record their own.

Tests:
The account-switch test asserts A's text is not transmitted and is not in the query cache. It does not assert that B can store or hydrate an outbox afterward. The Redis test is a fake shared adapter plus fan-out selection. That part matches the phase allowance. Master had not re-run the suite before this rejection; the defect is in the identity binding.

Adversarial scenarios checked:
Sign-out versus account switch. Capture snapshot for the new identity while the previous outbox is still bound. Merge of the new identity's stored outbox.

Findings:
Critical: 0
High: 0
Medium: 1
Low: live Redis roundtrip not run; Redis down does not fall back to process-local; two tabs may both POST one Internal key; Client reload is not auto-resent; not browser-verified

Medium:
After an account switch in the same tab, the outbox stays bound to the previous employee. The next employee cannot persist or restore their pending sends, and the previous employee's pending rows remain in memory until sign-out. Replay and snapshots are keyed, so they do not send A's message as B. They also do not accept B's outbox.

Residual debt:
Unchanged until this finding is closed.

Can Phase 7 start?
NO
```

## Fix — account-switch outbox binding — 2026-10-01

Account switch releases the in-memory outbox when the bound employee changes and bumps the outbox generation, so the next employee can hydrate and record their own pending sends and an in-flight replay cannot write the previous employee's ack. The same employee keeps a pending send. Sign-out still clears the outbox.

## Master review — Phase 6 accepted — 2026-10-01

```text
PHASE 6 — distributed reliability, offline, and recovery

STATUS:
ACCEPTED

Implemented:
The rejection above stands as history. installMessengerPersistSessionGate now calls releaseMessengerOutboxForIdentity. That clears memory and bumps the outbox generation only when the bound employee differs. Sign-out still calls clearMessengerOutboxMemory. resetOptimisticCoreSendState pauses replay and bumps sendSessionEpoch. It does not clear the outbox.

Verified:
applyMessengerPersistSessionIdentity runs in a layout effect before hydrateMessengerPersistCache. A switch from A to B therefore releases A's binding before B's envelope is merged. readMessengerOutbox(B) can then see B's rows, and capture for B does not include A's content. An in-flight transmit checks isReplayCurrent after the ack, which fails when the channel identity or outbox generation changed, so the ack is not written. The socket lifecycle effect depends on me.id, so an account switch stops and starts the hub and noteMessengerSocketReady runs again. Same-employee release returns without clearing.

Tests:
Master re-ran 3 files, 22 tests, passed:
messenger-outbox-replay, messenger-persist-boundary, messenger-optimistic-send.
The new tests cover B hydrating and recording after A, A's text absent from B's snapshot and the query cache, no transmit of A's key, the same employee keeping a pending send, sign-out clearing the outbox, and a late ack dropped after the switch.

Adversarial scenarios checked:
Switch while a replay POST is in flight. Hydrate the next employee's stored outbox. Record a new send for that employee. Same employee reinstalled. Sign-out.

Findings:
Critical: 0
High: 0
Medium: 0
Low: 5

Residual debt:
- A live two-process Redis Socket.IO roundtrip was not run. Selection tests and a fake shared adapter were. Production PROCESS_ROLE=api without REDIS_EVENTS_URL or REDIS_URL throws. A set URL does not fall back to process-local if Redis is down.
- An HTTP request already in flight can still reach the server after a switch. The ack is dropped. The idempotency key still collapses a later retry to one row.
- Two tabs may each POST the same Internal key. The server stores one row.
- A reloaded Client send stays OUTCOME_UNKNOWN and is not auto-resent.
- Not browser-verified.

Can Phase 7 start?
YES
```

## Phase 7 implementer evidence — 2026-10-01

```text
STATUS: IMPLEMENTED_PENDING_MASTER_REVIEW

This is an implementer record. It is not a master acceptance.
The matrix is 37-Messenger-Hardening-Acceptance.md.
```

### Defect fixed

An already-open second tab dropped every outbox announcement. The writer posted the full persist envelope on BroadcastChannel. `parseChannelMessage` accepts only the four header fields, so the peer never called `importMessengerPersistOutbox` until a later read of the stored envelope. `openMessengerPersistChannel` now posts `identityId`, `capturedAt`, `writtenAt`, and `schemaVersion`. The store still holds the envelope.

Test added: `lets a second tab accept a stored envelope as a header-only announcement` in `apps/web/src/features/messenger/persist/messenger-persist-channel.test.ts`.

No other architecture was added. Docs 32, 33, and 34 were not rewritten. `scripts/migrate-prod.mjs` was not modified. Phase 7 is not accepted.

### Gate

From `c:\AI\nbos`, `pnpm exec vitest run` on:

- `apps/web/src/features/messenger/realtime/messenger-io-call-site.test.ts`
- `apps/web/src/features/messenger/realtime/messenger-realtime-hub.test.ts`
- `apps/web/src/features/messenger/realtime/messenger-subscription-registry.test.ts`
- `apps/web/src/features/messenger/realtime/messenger-realtime-cache-bind.test.ts`
- `apps/web/src/features/messenger/query/messenger-realtime-cache.test.ts`
- `apps/web/src/features/messenger/query/messenger-optimistic-send.test.ts`
- `apps/web/src/features/messenger/query/messenger-outbox-replay.test.ts`
- `apps/web/src/features/messenger/query/messenger-visible-read.test.ts`
- `apps/web/src/features/messenger/query/messenger-phase4-lifecycle.test.ts`
- `apps/web/src/features/messenger/merge-core-realtime-message.test.ts`
- `apps/web/src/features/messenger/query/messenger-delta-recovery.test.ts`
- `apps/web/src/features/messenger/messenger-delivery-status.test.ts`
- `apps/web/src/features/messenger/persist/messenger-persist-channel.test.ts`
- `apps/web/src/features/messenger/persist/messenger-persist-boundary.test.ts`
- `apps/web/src/features/messenger-internal/use-entity-conversation.access.test.ts`
- `apps/web/src/features/tasks/components/use-task-discussion.realtime.test.ts`
- `apps/web/src/features/tasks/components/use-task-discussion.visible-read.test.ts`
- `apps/web/src/features/tasks/components/use-task-discussion.send.test.ts`
- `apps/web/src/features/tasks/components/use-task-discussion.subscription-source.test.ts`
- `apps/web/src/features/messenger-client/send-client-thread-message.test.ts`
- `apps/web/src/features/messenger-internal/send-internal-thread-message.test.ts`
- `apps/web/src/features/support/components/ticket-source-preview.test.ts`
- `apps/web/src/features/messenger/query/messenger-phase6-realtime-gate.test.ts`
- `apps/api/src/modules/messenger/core/messenger-core-entity-ensure.ops.test.ts`
- `apps/api/src/modules/messenger/messenger-gateway-core-subscribe.test.ts`
- `apps/api/src/modules/messenger/core/messenger-socket-io-process-local.test.ts`
- `apps/api/src/socket-io-distributed-fanout.test.ts`
- `apps/api/src/runtime/process-role.test.ts`
- `apps/api/src/modules/messenger/core/messenger-finance-reminder.ops.test.ts`
- `apps/api/src/modules/messenger/core/messenger-persisted-core-message.bridge.test.ts`
- `apps/api/src/modules/integrations/whatsapp-gateway/whatsapp-outbound-official-send-reminder.test.ts`
- `apps/api/src/modules/messenger/core/messenger-wa-lifecycle-revision.test.ts`
- `apps/api/src/modules/integrations/meta/meta-lead-ingest.service.test.ts`
- `apps/api/src/modules/messenger/core/messenger-core-access.test.ts`
- `apps/api/src/modules/messenger/core/messenger-core-access-negatives.test.ts`
- `apps/api/src/modules/messenger/core/messenger-core-access-revoke.test.ts`
- `apps/api/src/modules/messenger/core/messenger-core-message.ops.test.ts`
- `apps/api/src/modules/messenger/core/messenger-portfolio-client-scope.ops.test.ts`
- `apps/api/src/modules/messenger/messenger-gateway-fanout.test.ts`
- `apps/api/src/modules/integrations/whatsapp-gateway/whatsapp-gateway-webhook.retry.test.ts`

First result: **40 files, 200 tests, 199 passed, 1 failed** (Vitest 5.0.0). The failure was `keeps a single production io( call site` timing out at 5000ms while the 40 files ran together. That test walks `apps/web/src`.

Immediate re-run of that file alone:

```text
pnpm exec vitest run apps/web/src/features/messenger/realtime/messenger-io-call-site.test.ts
```

Result: **1 file, 2 tests, passed.**

`pnpm exec prettier --write` on the two touched channel files left them unchanged. `pnpm exec eslint` on those files exited 0.

### Not executed

- Full monorepo `pnpm test`
- `pnpm --filter @nbos/web typecheck`
- `pnpm --filter @nbos/api typecheck`
- Browser or E2E
- Live Redis Socket.IO roundtrip
- Production configuration
- Production deployment

## Master review — Phase 7 accepted — 2026-10-01

```text
PHASE 7 — adversarial acceptance

STATUS:
ACCEPTED

Implemented:
The acceptance matrix is docs/NBOS/02-Modules/09-Messenger/37-Messenger-Hardening-Acceptance.md. The only code change in this phase is the BroadcastChannel header. openMessengerPersistChannel posts four fields after the persist write. parseChannelMessage still rejects any other key set.

Verified:
A full envelope does not parse as a channel message. post() strips it to the header, and the peer receives that header. Import then reads the stored envelope. The socket client still has one production io() call site. The matrix does not call the work browser verified, production configured, or production deployed.

Tests:
Master re-ran messenger-persist-channel.test.ts and messenger-io-call-site.test.ts: 2 files, 6 tests, passed. The implementer's parallel gate had one timeout on the io call-site file; that file passed alone and passed again in this re-run.

Adversarial scenarios checked:
Second tab announcement shape. Identity on the channel. Schema version. The final questions in the program (duplicate send, missed live publish, surface disagreement, unread, refresh, provider retry, replica fan-out, revoke, status regression, conversation identity, portfolio zone, finance, support, task, product/workspace) are answered in the acceptance doc at the level of local tests. Live Redis, browser, and production remain not executed.

Findings:
Critical: 0
High: 0
Medium: 0
Low: the residual list in the acceptance doc

Can the program be called production-ready?
NO
```
