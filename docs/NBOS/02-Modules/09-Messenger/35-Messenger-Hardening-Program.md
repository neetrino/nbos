# Messenger Hardening Program

> Status: **execution plan**. Product behavior remains governed by
> `00-Messenger-Master-Canon.md`. Historical modernization evidence in
> `32-Messenger-Modernization-Ledger.md`, `33-Messenger-Modernization-Final-Evidence.md`,
> and `34-Messenger-Phase6-Browser-Checklist.md` is not rewritten by this program.

Baseline revalidated on branch `Karo` at `515af4f73` (2026-10-01). Unrelated dirty
file `scripts/migrate-prod.mjs` is outside this program and must be preserved.

No phase below is accepted until a master review records that verdict in
`36-Messenger-Hardening-Evidence.md`.

## Audit revalidation

| ID  | Hypothesis                                          | Verdict                      | Current evidence                                                                                                                                                                               |
| --- | --------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | Own send waits for the network                      | CONFIRMED                    | `send-internal-thread-message.ts`, `send-client-thread-message.ts`, `use-entity-conversation.ts`, and legacy `MessengerClient.tsx` render only after the request. No client correlation id.    |
| B   | Composer `sendBusy` blocks the next send            | CONFIRMED                    | Same send paths plus `messenger-session-chrome.ts`.                                                                                                                                            |
| C   | Task discussion has no realtime subscription        | CONFIRMED                    | `use-task-discussion.ts` reads the shared message cache but never subscribes. Live updates depend on some other mounted socket already joined to that conversation.                            |
| D   | Realtime lifetime follows mounted UI                | CONFIRMED                    | `useInternalMessengerRealtime` is called from Internal Messenger, Client Messenger, and `useEntityConversation` only.                                                                          |
| E   | Global summary stays stale when Messenger is closed | CONFIRMED (no Right Rail UI) | There is no Messenger Right Rail component. Sidebar only prefetches bootstrap. Summary events are applied only while a chat surface owns a socket. Do not invent a Right Rail in this program. |
| F   | Multiple Socket.IO clients                          | CONFIRMED                    | `io()` in `useInternalMessengerRealtime.ts` and legacy `useMessengerRealtime.ts`. Each Core consumer creates its own connection.                                                               |
| G   | Process-local Socket.IO fan-out                     | CONFIRMED                    | `SocketIoCorsAdapter` is CORS-only. `messenger-socket-io-process-local.test.ts` locks that in. Phase 6 only.                                                                                   |
| H   | Lifecycle events incomplete                         | CONFIRMED for later phases   | Shared events cover message, summary, read, access, typing, presence, peer read. No dedicated delete, pin, or favorite event constants. Phase 4.                                               |
| I   | Auto-read ignores visibility                        | CONFIRMED risk               | `useEntityConversation` calls `markRead` when a conversation id appears, with no visibility check. Phase 4.                                                                                    |
| J   | Entity chats lag Task on realtime                   | CHANGED                      | Product, Work Space, Deal, and Project General use `EntityConversationPanel`, which opens its own socket. Task does not. Typing is not wired on Core surfaces.                                 |
| K   | Portfolio opens Internal Messenger                  | CONFIRMED                    | `PortfolioMessengerSheet.tsx` mounts `InternalMessengerApp`. Phase 5.                                                                                                                          |
| L   | Finance skips post-commit publish                   | NOT FULLY TRACED             | No `publishPersistedCoreMessage` call under `apps/api/src/modules/finance`. Phase 5 must trace the real writer before changing it.                                                             |
| M   | WhatsApp lifecycle publish                          | PARTIALLY PRESENT            | Inbound webhook calls `publishPersistedCoreMessage`. Revoke/edit DTO completeness stays a Phase 5 check.                                                                                       |
| N   | Support source references                           | NOT REOPENED                 | Preserve source references. Phase 5 verifies open-ticket convergence.                                                                                                                          |

## Invariants (every phase)

- INV-01 one canonical `conversationId` per logical chat.
- INV-02 same id converges in the shared TanStack Query cache.
- INV-03 PostgreSQL remains authoritative.
- INV-04 one optimistic row reconciles to one server message.
- INV-05 missed events recover through reconnect and existing revision/delta.
- INV-06 one Socket.IO client per authenticated tab. Components subscribe; they do not call `io()`.
- INV-07 access revocation stops the subscription and blocks further use.
- INV-08 Client READ is not Client SEND. Bindings and attention are not ACL.
- INV-09 duplicate events are idempotent.
- INV-10 thread, preview, order, and unread stay coherent.
- Task socket subscribe keeps using `employeeMayUseCoreConversation`, including the Task ACL branch.
- Do not add Redux, Zustand, a second QueryClient, or a second chat backend.

## Phases

### Phase 1 — Global realtime runtime

Move Core Socket.IO ownership to the authenticated app shell (`(app)/layout.tsx` tree, inside `PermissionProvider` and `QueryProvider`). One connection. Reference-counted `subscribeConversation` / `releaseConversation`. Global summary, read, access, and message reducers stay active when Messenger UI is closed. Reconnect restores subscriptions with refcount greater than zero. Subscribe ACK `{ ok: false }` does not treat the room as joined. Legacy `/messenger/legacy` must use this same connection.

Out of scope: optimistic send, Redis adapter, portfolio routing, new Right Rail UI, Task product wiring beyond the subscribe API, auto-read policy changes.

### Phase 2 — Cross-module unification

Every surface for a canonical conversation uses the Phase 1 runtime and the shared message cache: Task Discussion, Product, connected and standalone Work Space, Deal, Project General, Internal Messenger, direct chats. Same `conversationId` updates every open surface without refresh.

### Phase 3 — Optimistic send

Per-message lifecycle. Composer clears immediately. Stable client idempotency identity reused on retry. No composer-wide `sendBusy` for ordinary sends. Client Messenger must not show provider delivered from local persistence alone.

### Phase 4 — Lifecycle completeness

User-visible durable mutations converge in cache. Revision/checkpoint remains the recovery path. Visibility-based read. Access revoke purges a writable thread.

### Phase 5 — Client Messenger and external producers

Portfolio opens Client Messenger context. WhatsApp and Meta keep idempotent Core publish. Finance-generated client messages use the same post-commit publish path once the writer is traced. Support keeps source references. READ and SEND stay separate.

### Phase 6 — Distributed fan-out, reconnect, offline

Redis Socket.IO adapter for multi-instance fan-out, with an explicit local single-instance fallback that cannot silently become production behavior. Reconnect recovery, monotonic reducers, outbox replay with the same idempotency identity, persist isolation on logout.

### Phase 7 — Adversarial acceptance

No new architecture unless a defect requires it. Prove the cross-surface matrix. Separate `implemented`, `tested`, `verified locally`, and `browser verified`.

## Acceptance rule

Critical, High, and Medium findings block the next phase. Low debt may remain only when it does not break a phase invariant, is written into the evidence file, and is intentionally deferred.
