# Messenger Hardening Acceptance

> Implementer record for Phase 7 of `35-Messenger-Hardening-Program.md`.
> Product behavior remains governed by `00-Messenger-Master-Canon.md`.
> Master verdicts for Phases 1–6 stay in `36-Messenger-Hardening-Evidence.md`.
> This file does not accept Phase 7 or the program.

Status: `PENDING_MASTER_REVIEW`

This phase did not add a second chat backend, a second `QueryClient`, Redux, Zustand, or a SharedWorker. One defect in the live two-tab persist announcement was fixed. See the evidence file for the commands.

## Words

These words are separate. A row can be implemented and tested without being browser verified.

| Word                  | Meaning in this file                                                          |
| --------------------- | ----------------------------------------------------------------------------- |
| implemented           | The current branch contains the behavior.                                     |
| tested                | An automated test asserts it, and that test passed in the Phase 7 gate below. |
| verified locally      | That gate was run on this workstation with Vitest 5.0.0.                      |
| browser verified      | A person or agent exercised the UI in a browser.                              |
| production configured | Production env for this program was set.                                      |
| production deployed   | This program was deployed.                                                    |

Browser verified, production configured, and production deployed are not claimed. The browser was not exercised. Production was not configured and was not deployed.

## Defect fixed in this phase

An already-open second tab did not learn an unacknowledged send. `commitMessengerPersistCapture` announces the full persist envelope. `parseChannelMessage` accepts only `identityId`, `capturedAt`, `writtenAt`, and `schemaVersion`. The peer dropped every announcement, so `importMessengerPersistOutbox` never ran until a later load of the stored envelope.

`openMessengerPersistChannel` now posts that four-field header. The store still holds the envelope. The peer still imports from the store after a header it accepts.

Test: `lets a second tab accept a stored envelope as a header-only announcement` in `apps/web/src/features/messenger/persist/messenger-persist-channel.test.ts`. A raw envelope still fails `parseChannelMessage`. The second channel receives the header and no `queries` or `outbox` field.

This was Medium against the accepted Phase 6 two-tab path. It did not add a socket, a cache, or a backend.

## Cross-module matrix

Verified locally for every cited test in the gate. Browser verified: no, for every row.

| Pair                                    | Result        | Citation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Messenger ↔ Messenger                   | tested        | One production `io(` site: `keeps a single production io( call site` in `messenger-io-call-site.test.ts`. One room, last release leaves: `reference-counts one room and leaves only when the last consumer releases` in `messenger-realtime-hub.test.ts`. One row per key: `collapses to one row when the websocket arrives before HTTP` and `collapses to one row when HTTP arrives before the websocket` in `messenger-optimistic-send.test.ts`. Duplicate events: `is idempotent for duplicate delivery events` in `merge-core-realtime-message.test.ts`. Server duplicate key: `returns the existing row for a duplicate idempotency key` in `messenger-core-message.ops.test.ts`.                  |
| Task ↔ Messenger                        | tested        | `keeps the room when Messenger still retains the same conversation` and `shows a socket message in the cache Task discussion already observes` in `use-task-discussion.realtime.test.ts`. Visible read: `marks one visible open thread read after the coalesce window` in `use-task-discussion.visible-read.test.ts`. Task ACL on subscribe: `denies Task conversations when MESSENGER.VIEW ALL lacks Task access` in `messenger-gateway-core-subscribe.test.ts`.                                                                                                                                                                                                                                       |
| Product ↔ Messenger                     | tested        | `ProductChatTab.tsx` mounts `EntityConversationPanel`. That panel uses `useMessengerMessages` and `useInternalMessengerRealtime` (`use-entity-conversation.ts`). Revoke on that hook: `stops the subscription, disables send, and drops the cached thread` in `use-entity-conversation.access.test.ts`. A browser with Product and Messenger open together was not executed.                                                                                                                                                                                                                                                                                                                            |
| Product ↔ connected Work Space          | tested        | `returns the same conversationId for Product Chat and Connected Work Space Discussion` in `messenger-core-entity-ensure.ops.test.ts`. Extension workspaces stay separate: `does not fold an Extension Work Space into Product Chat` in the same file. Both UIs mount `EntityConversationPanel` (`ProductChatTab.tsx`, `WorkSpaceDiscussionSheet.tsx`).                                                                                                                                                                                                                                                                                                                                                  |
| Work Space ↔ Messenger                  | tested        | Standalone workspace: `does not require a Product id or PRODUCT type for a standalone Work Space` in `messenger-core-entity-ensure.ops.test.ts`. The sheet uses the same entity panel and shared cache as Messenger.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Deal ↔ Messenger                        | tested        | `creates Internal DEAL, never CLIENT or EXTERNAL` in `messenger-core-entity-ensure.ops.test.ts`. `DealInternalDiscussionTab.tsx` mounts `EntityConversationPanel` `kind="deal"`. The shared hook revoke test covers that panel. A Deal-named client test was not executed.                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Project General ↔ Messenger             | tested        | `does not create Project General unless ensureProjectGeneral is called` in `messenger-core-entity-ensure.ops.test.ts`. `ProjectCommunicationSection.tsx` mounts `EntityConversationPanel` `kind="project-general"`. A Project-named client test was not executed.                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Client Messenger ↔ WhatsApp revoke/edit | tested        | `revokes inside the write transaction and returns the tombstone after commit` and `edits inside the write transaction and returns after commit` in `messenger-wa-lifecycle-revision.test.ts`. Open thread: `removes a revoked row from an open thread and ignores a duplicate tombstone` in `messenger-phase4-lifecycle.test.ts` and `removes an open row when the provider revoke sets deletedAt` in `merge-core-realtime-message.test.ts`. The webhook emits `handled.message` from `settleWhatsAppWebhookDispatch` after revoke/edit. A single fixture from a revoke webhook body through Socket.IO was not executed. Not-ready dispatch does not publish: `whatsapp-gateway-webhook.retry.test.ts`. |
| Client Messenger ↔ Meta publish         | tested        | `creates one lead and persists Core instead of MetaMessage` and `skips duplicate webhook events` in `meta-lead-ingest.service.test.ts`. Both assert one `publishPersistedCoreMessage`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Finance → Client Messenger, API path    | tested        | `publishes the queued Core message after the outbox offer` in `messenger-finance-reminder.ops.test.ts`. Status asserted: `QUEUED`. `tryDeliverPaymentReminderWhatsApp` passes that publisher through. Invoice service tests mock `deliverFinanceClientReminder`, so they are not the publish proof.                                                                                                                                                                                                                                                                                                                                                                                                     |
| Finance → Client Messenger, worker path | tested        | `hands the persisted QUEUED reminder to the API publish path once` in `whatsapp-outbound-official-send-reminder.test.ts`. Reload on the API: `publishes the reloaded QUEUED Client row and ignores other zones` in `messenger-persisted-core-message.bridge.test.ts`. A second official send does not insert again.                                                                                                                                                                                                                                                                                                                                                                                     |
| Support source preview                  | tested        | `refetches a revoke without copying the thread` and `refetches an edit when the conversation message query is absent` in `ticket-source-preview.test.ts`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Right Rail                              | tested, no UI | There is no Right Rail component. Summary and thread updates apply while no chat surface is mounted: `patches a cached thread and a summary while no chat surface is open` in `messenger-realtime-cache-bind.test.ts`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Two tabs, same user                     | tested        | Header announcement: the new channel test above. Stored envelope import without a second socket: `lets a second tab see an unacknowledged internal send without a second socket` in `messenger-outbox-replay.test.ts`. Account switch: `lets the next employee hydrate and record after an account switch` in the same file. Two browser tabs were not executed.                                                                                                                                                                                                                                                                                                                                        |
| API A write / API B socket              | tested        | Fake shared adapter: `reaches a socket joined on server B when server A publishes to the room` in `socket-io-distributed-fanout.test.ts`. Selection: `stays process-local only for local all when Redis is unset`, `selects Redis from REDIS_EVENTS_URL, then REDIS_URL`, and `refuses api, worker, and scheduler when Redis is unset` in `messenger-socket-io-process-local.test.ts`. The live Redis roundtrip was not run.                                                                                                                                                                                                                                                                            |

## Program scenarios

| Scenario      | Mark   | Note                                                                                                                                                                                                                                                                                         |
| ------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| send          | tested | Internal, Client, entity, and Task composers insert an optimistic row and post one idempotency key. `does not let a composer lock reject a second send` in `messenger-optimistic-send.test.ts`. Client local label is `Sending`, then server `QUEUED`: `send-client-thread-message.test.ts`. |
| receive       | tested | `applies a live message without zone recovery and clears a revoked open thread` in `messenger-realtime-hub.test.ts`. Summary while Messenger is closed: the Right Rail row above.                                                                                                            |
| read          | tested | `does not mark read from a hidden document and does mark a visible thread` in `messenger-visible-read.test.ts`. Task discussion uses the same coalescer only while the thread is open: `use-task-discussion.visible-read.test.ts`.                                                           |
| mutation      | tested | Favorite: `updates favorite on the summary without refetching the list` in `messenger-phase4-lifecycle.test.ts`. WhatsApp tombstone and edit: revision test above. Access loss: `emits access_changed only after final access loss` in `messenger-core-access-revoke.test.ts`.               |
| connection    | tested | `restores positive refcounts on reconnect without dropping cached messages` in `messenger-realtime-hub.test.ts`. Delta: `dedupes duplicate reconnect recovery onto one in-flight drain` in `messenger-delta-recovery.test.ts`. A dropped network in the browser was not executed.            |
| multi-surface | tested | Task and Messenger share one room and one message cache (Task row above). Product, Work Space, Deal, and Project General use that same panel and cache. Two mounted screens in a browser were not executed.                                                                                  |
| multi-tab     | tested | Channel header plus stored-envelope import. One socket call site remains. Two browser tabs were not executed.                                                                                                                                                                                |

## Final architecture

PostgreSQL is the authority for a conversation and its messages. The web app keeps one TanStack `QueryClient` in `apps/web/src/lib/query/query-provider.tsx`. Authenticated app routes mount `MessengerRealtimeProvider` in `apps/web/src/app/(app)/layout.tsx`. That provider owns the only production `io(` call, in `messenger-socket-client.ts`. Surfaces retain and release conversation ids. They do not open sockets.

Canonical chats are one `conversationId`. Product chat and a connected Work Space resolve to that same id on the server. Task, Product, Work Space, Deal, Project General, Internal, and Client read `useMessengerMessages` for that id. Legacy `/messenger/legacy` listens on the same socket and still keeps its own channel array. That limit is unchanged Low debt from Phase 1.

## Runtime model

One Socket.IO client per authenticated tab, and only when the employee can `VIEW` `MESSENGER`. `MessengerSubscriptionRegistry` reference-counts rooms. Reconnect resubscribes ids whose count is still greater than 0. A `{ ok: false }` after the post-auth presence snapshot is not a join. Summary, message, read, and access reducers run on the root `QueryClient` while no chat UI is mounted. Disconnect does not delete cached messages. Reconnect runs Internal and Client delta recovery.

## Optimistic model

A normal text send claims one `crypto.randomUUID()` idempotency key, inserts one local row, and clears the composer. Retry posts that same key. Websocket-before-HTTP and HTTP-before-websocket collapse to one cache row. The server lock is `conversationId_idempotencyKey` in `persistCoreMessage`. No new table.

Client local rows leave `status` unset. The receipt is `Sending`, `Not sent`, or, after a Client reload, `Unconfirmed` (`OUTCOME_UNKNOWN`). `Delivered` comes from a server status. Internal reload replays the same key after `canWrite`. A denied or `task-pending:` id is not transmitted. Client reload is not auto-resent.

Sign-out clears the outbox. An account switch releases the previous employee's outbox so the next employee can hydrate and record. A late ack after that switch is dropped.

## Realtime event model

Durable writes publish after commit, or bump the revision inside the same transaction and publish the mapped row after it returns.

- New Core message: `messenger.conversation.message` and `messenger.conversation.summary`.
- Own read: `messenger.read.updated`, plus `messenger.conversation.peer_read` for Core `markRead`.
- Favorite: `messenger.conversation.favorite` after the favorite transaction.
- Access lost: `messenger.conversation.access_changed` only when read is actually gone.
- WhatsApp ack, edit, and revoke bump the zone revision inside the write, then the webhook publishes the mapped message, including `deletedAt` on revoke.
- Finance reminders publish the stored `QUEUED` row. The worker path publishes ids on `MessengerPersistedCoreMessageBus`. The API subscriber reloads the row and calls `publishPersistedCoreMessage`. It does not enqueue a second WhatsApp send.

Duplicate message and peer-read events leave one row. `READ` does not regress to `DELIVERED`.

## Internal vs Client

Internal and Client share the runtime, the message cache, and visible auto-read. They do not share send policy.

Internal pending sends survive reload and replay once with the same key when `getConversation` says `canWrite`. Client pending sends restore as `OUTCOME_UNKNOWN` and stay unsent until a later delta or refetch reconciles them. Portfolio communication mounts `ClientMessengerApp` (`PortfolioMessengerSheet.tsx`). The scope API is tested in `messenger-portfolio-client-scope.ops.test.ts`: one readable id opens, many ids do not auto-open, and a binding the employee cannot read is dropped. A binding does not grant SEND.

## Redis / distributed realtime

`resolveSocketIoFanout` selects `REDIS_EVENTS_URL`, then `REDIS_URL`. `PROCESS_ROLE=all` with both unset is the only process-local mode. `PROCESS_ROLE=api` with both unset throws from `installMessengerSocketIoAdapter` during API startup. `worker` and `scheduler` are refused so they do not claim process-local fan-out. A configured URL does not fall back to process-local when Redis is later unreachable.

`resolveProcessRole` forbids `PROCESS_ROLE=all` when `NODE_ENV=production` (`forbids all in production` in `process-role.test.ts`). The events clients call `assertTlsInProduction`, so a production URL must be `rediss://`. A live `rediss://` Socket.IO connection was not executed.

API A to API B was verified locally with a fake shared adapter plus the selection tests. The live Redis roundtrip was not run.

## Offline / reconnect

Reconnect restores subscriptions and runs zone delta recovery without clearing the message cache. The outbox holds at most 20 logical sends in persist schema v3. A second tab learns a newer write from the four-field BroadcastChannel header, then reads the stored envelope. It does not share the socket.

A combined envelope over the existing byte cap is not written. That pending send would not survive reload. That limit is unchanged from Phase 6.

## Security notes

Client READ is not Client SEND. `allows Client READ from membership without implying SEND` and `does not turn a VIEW override into Client SEND` are in `messenger-core-access.test.ts`. `keeps Client SEND closed when clientSendScope is NONE` is in `messenger-core-access-negatives.test.ts`. The access loader does not query conversation links, product team, collections, or bindings.

Task subscribe still uses `employeeMayUseCoreConversation`, including the Task ACL branch. `MESSENGER.VIEW ALL` without Task access does not join. Auth that settles with no employee id does not join.

Access revoke wins over an open thread. Task and entity panels drop the cached messages and stop send. The server emits `access_changed` only after read is actually lost.

## Automated test evidence

Verified locally from `c:\AI\nbos` with Vitest 5.0.0. Commands and the parallel-scan retry are in `36-Messenger-Hardening-Evidence.md` under Phase 7. The gate covered the citations in this matrix, including the new channel test.

Prettier was run on the two touched channel files. ESLint on those files exited 0.

## Browser / E2E evidence

The browser was not exercised. No E2E suite was run. Nothing in this phase is browser verified.

## Residual Low debt

Left as written in `36-Messenger-Hardening-Evidence.md`. Not reopened. None of these was shown to break INV-01 through INV-10 in this phase.

From Phase 1: legacy channel subscribe returns immediately when `employeeId` is missing; legacy channel rooms have no leave; a thread cache is not created for a conversation that was never loaded; presence follows the app socket.

From Phase 2: mobile Task discussion can retain on the first paint; reopening a revoked discussion can subscribe again. An open revoked session still does not send.

From Phase 4: pin and unpin have no writer; there is no employee delete-own-message API; a missed `peer_read` is not repaired by the sender delta; a late `markRead` after account switch only patches summary rows still in the cache.

From Phase 5: a split worker or scheduler without `REDIS_EVENTS_URL` / `REDIS_URL` withholds live fan-out and logs it; portfolio scope returns at most 40 readable conversations; a ticket source link created in another session does not push until that ticket query loads again.

From Phase 6: the live Redis roundtrip was not run; Redis down does not fall back to process-local; an in-flight HTTP ack after account switch is dropped and the key still collapses a later retry; two tabs may each POST the same Internal key and the server stores one row; a reloaded Client send stays `OUTCOME_UNKNOWN`.

Not browser-verified remains Low. This phase did not clear it.

## Production configuration

Not production configured. Not production deployed.

When this is deployed, `PROCESS_ROLE=api` needs `REDIS_EVENTS_URL` or `REDIS_URL`. In production that URL must be `rediss://`. `PROCESS_ROLE=all` is forbidden in production. `PROCESS_ROLE=all` with Redis unset is the local process-local mode only.

## Migration / deployment

No new Postgres migration in this program. `scripts/migrate-prod.mjs` was not modified. Docs 32, 33, and 34 were not rewritten. Deployment was not performed.

## Rollback

Roll back the application build. There is no messenger migration to reverse. An API process with `PROCESS_ROLE=api` and no Redis URL still refuses to start, including after rollback to the Phase 6 adapter. Persist schema v3 still rejects older summary envelopes. The channel fix is client-only: an old client would again drop live two-tab headers, and a reload would still read the stored envelope.

## Implementer verdict

`PENDING_MASTER_REVIEW`

Phase 7 is not accepted. The program is not accepted. This record is not a production-ready declaration.

## Master verdict — 2026-10-01

```text
PHASE 7 — adversarial acceptance

STATUS:
ACCEPTED

The program is accepted as a local implementation with automated tests.
It is not browser verified, not production configured, and not production deployed.
```

The second-tab defect is closed. `openMessengerPersistChannel` posts only `identityId`, `capturedAt`, `writtenAt`, and `schemaVersion` after the IndexedDB write commits. A full envelope still fails `parseChannelMessage`. The peer then imports the stored outbox. Master re-ran `messenger-persist-channel.test.ts` and `messenger-io-call-site.test.ts`: 2 files, 6 tests, passed.

The matrix in this file matches the code that was reviewed across Phases 1–6. Rows that say tested cite a behavioral test. Rows that were not executed in a browser, against live Redis, or in production say so. No Right Rail UI was invented.

Residual Low debt remains: no live Redis Socket.IO roundtrip, no browser pass, two tabs may each POST one Internal idempotency key, a reloaded Client send is not auto-resent, a split worker without `REDIS_EVENTS_URL`/`REDIS_URL` withholds finance live fan-out, pin and own-message delete have no writer, and a missed peer-read receipt is not repaired from the sender delta.
