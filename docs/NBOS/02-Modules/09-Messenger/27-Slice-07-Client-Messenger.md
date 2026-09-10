# Slice 7 — Client Messenger surface and locked composer

Status: VERIFIED

Independent review complete. Claims in the implementer handoff were verified first-hand.

Based on HEAD `d9f448f5` (Slice 6 VERIFIED). Slice 7 commit lands after this review.

## Canonical decisions

- `M-BOUNDARY-01` — one Messaging Core; two product surfaces (Internal and Client)
- `M-CLIENT-01` — Client navigation: Inbox / Sales / Clients / Collections
- `M-CLIENT-02` — long-lived Product client conversation (views, not copied history)
- `M-SECURITY-01` — locked Client composer; unlock is per conversation session
- `M-SECURITY-02` — Client READ ≠ SEND; UI unlock is not SEND
- `M-COLLECTIONS-01` — Client Collections are zone CLIENT; membership does not grant ACL
- `M-AI-01` — placeholder only; draft/operator does not imply SEND
- `M-CORE-01` — DB is source of truth; persist before any provider dispatch
- `M-MAIL-01` — Mail remains separate; **do not** apply Mail’s exemption to Meta

## Scope

Build the separate Client Messenger product surface before full provider cutover.

Working in this slice:

- Separate Client entry `/client-messenger`, navigation, and teal visual identity (CRM `/clients` untouched)
- Locked composer (`Reply to client` unlocks this conversation session only)
- Map live Meta Sales history (`MetaConversation` / `MetaMessage`) into Messaging Core Client Sales (`MIGRATE`, not `NEW`)
- Enable Core CLIENT persist when `evaluateMessengerCoreAccess.canSend` is true
- Client Collections (zone CLIENT); cannot contain Internal chats

Out of scope: Slice 8 Gateway WhatsApp inbound/outbound, Slice 9 Product WORK bindings, DROP Meta / Channel / DM / TaskDiscussionEntry / Task.chatId, production migrate, dual-write Channel/DM, Internal rewrite of Slice 6 actions, commit / push.

Slice 5 Task ACL GET/list/HIDDEN is unchanged. Slice 6 reply/forward/Create Task/mentions are reused from Client UI, not rewritten.

## Invariants (this slice)

- One Core. Two surfaces. Not Internal|External as the real product.
- READ ≠ SEND. Product binding ≠ ACL. Collection membership ≠ ACL.
- persistAndBroadcast arity stays 1. No `allowClientPersist` second argument.
- No HTTP `canonicalKey`.
- Dual-write: none into Channel/DM. After Meta inbound cutover, MetaMessage is not a second live source of truth. Do not DROP Meta (Slice 11).
- Empty Meta rows do not license NEW Sales history.

## HTTP

### Client (`/api/messenger/core/client`)

- `GET conversations` — ACL-filtered CLIENT zone only. Inbox/Sales/Clients views are query filters, not stores. List GET does not map Meta.
- `GET conversations/:id` — 404 INTERNAL (`MESSENGER_CORE_CLIENT_INTERNAL_ZONE_FORBIDDEN`).
- `GET conversations/:id/messages` — Core messages after Client GET.
- `POST conversations/:id/messages` — `@RequirePermission('MESSENGER', 'VIEW')` then `persistAndBroadcast` (arity 1). Gate is `canSend`, not `MESSENGER.EDIT`.
- `POST conversations/:id/read` / `favorite` / `participants` — favorite is CLIENT Favorites; invite forces `READ_ONLY`.
- `POST meta-map` — ops-only Meta → Core mapper (`MESSENGER.EDIT`). Idempotent. 0 Meta rows is a no-op.

Internal GET/list still 404s CLIENT (`MESSENGER_CORE_INTERNAL_CLIENT_ZONE_FORBIDDEN`).

### Client Collections (`/api/messenger/core/client/collections`)

Zone CLIENT create/list/get/member/item. Adding an Internal conversation 404s. Internal collection HTTP still 404s CLIENT collections. Cross-zone items still `MESSENGER_CORE_COLLECTION_ZONE_MISMATCH` at ops. Membership does not grant ACL.

DTOs have no `canonicalKey`. Create Client collection does not accept `zone` from HTTP (forced CLIENT).

## persistAndBroadcast

CLIENT + `canSend` → persist and broadcast (even when `canWrite` is false / `MESSENGER.EDIT` NONE).

CLIENT + !`canSend` → 403 `MESSENGER_CORE_CLIENT_READ_ONLY` or `MESSENGER_CORE_CLIENT_SEND_FORBIDDEN`.

Unconditional `MESSENGER_CORE_CLIENT_SEND_DISABLED` path removed. The constant remains unused.

Internal persist still `canWrite`. Grant VIEW/EDIT never becomes SEND. `senderId` required for employee persist. Arity 1. Leftover second argument is ignored and cannot bypass `canSend`.

Inbound Meta uses provider persist (`senderId` null, provenance `PROVIDER`), not employee `persistAndBroadcast`.

## Meta → Core (MIGRATE)

Additive enum values: `MessengerLegacyIdentityKind.META_CONVERSATION` / `META_MESSAGE`; `MessengerLinkEntityType.LEAD`.

Migration `20260831180000_messenger_client_meta_identity` is additive (`ADD VALUE IF NOT EXISTS`). No DROP.

- Identity + canonicalKey `legacy:meta:{metaConversationId}` (server-owned).
- Ops mapper `mapAllMetaSalesToCore` then live writer cutover.
- `meta-lead-ingest` still upserts MetaSenderIdentity / MetaConversation / Lead attach-merge (CRM remains Lead owner).
- After cutover it does **not** `metaMessage.create`. It persists Core CLIENT EXTERNAL + INSTAGRAM/FACEBOOK mapping + Core messages in the same serializable transaction, then emits Core after commit.
- Relink only with proven identity. Mapping onto INTERNAL is forbidden.
- Meta tables are not dropped. Historical MetaMessage rows remain until Slice 11. New inbound is Core SOT.

## UI

- Sidebar key `client-messenger` (distinct from `messenger` and CRM `clients`). Label **Client Messenger**. Routes: Inbox `/client-messenger`, Sales, Clients, Collections.
- Locked composer: open/switch/section change relocks; `Reply to client`; unlocked banner `CLIENT VISIBLE` + provider/context; no Internal/Public toggle.
- READ-only user never gets a usable send composer. Forged unlock cannot persist without `canSend`.
- Create Task / Forward internally / Open original / copy do not require unlock. Forward target remains Internal-only. Ticket/Deal hooks remain `createTicketImplemented: false` / `createDealImplemented: false`.
- AI placeholder only; does not grant SEND.
- Visual: teal / `#F4F7F7` vs Internal cream/gold. Header title **Client Messenger**. Internal stays **Internal Messenger**.

## Additive schema

Migration `20260831180000_messenger_client_meta_identity`:

- `MessengerLegacyIdentityKind` + `META_CONVERSATION`, `META_MESSAGE`
- `MessengerLinkEntityType` + `LEAD`

No DROP TABLE / TYPE / COLUMN. Production migrate **not run**. `pnpm --filter @nbos/database generate` run locally.

## Tests

`pnpm test -- apps/api/src/modules/messenger apps/api/src/modules/integrations/meta/meta-lead-ingest.service.test.ts apps/api/src/modules/integrations/meta/meta-lead-ingest.di.test.ts apps/web/src/lib/api/messenger-core.test.ts apps/web/src/lib/api/messenger-core-client.test.ts apps/web/src/features/messenger-client apps/web/src/features/messenger-internal/sort-selected-messages.test.ts apps/api/src/modules/messenger/core/messenger-core-slice-07.ops.test.ts apps/api/src/modules/messenger/core/messenger-core-client.service.test.ts apps/api/src/modules/messenger/core/messenger-core-task-acl.test.ts`

**229 passed**, 5 skipped (opt-in Core int tests; 43 files passed, 1 skipped). Explicit Slice 7 / Client / ingest / Slice 5 Task ACL files included in the same run.

Covered:

- persistAndBroadcast arity 1; leftover second argument ignored
- CLIENT persist succeeds when `canSend` true; `messengerMessage.create` called
- CLIENT persist succeeds with `editScope: NONE` + `clientSendScope: ALL`
- CLIENT persist 403 READ_ONLY, SEND_FORBIDDEN, grant EDIT without SEND, Client READ without SEND
- Forged `{ unlocked: true }` does not persist when `canSend` is false
- Employee persist without `senderId` is forbidden
- Internal GET still 404s CLIENT; Client GET 404s INTERNAL
- Client collection cannot add Internal conversation; Internal collection cannot add CLIENT
- List GET does not map Meta
- Mapper no-op on 0 Meta rows; idempotent skip of already-mapped messages
- Inbound persist uses `senderId` null + provenance PROVIDER; ingest does not write MetaMessage
- Mapping onto Internal is forbidden
- No HTTP `canonicalKey`
- Keyboard/route relock; Internal draft store key is not Client send-ready
- Slice 5 Task ACL GET/list/HIDDEN still holds
- No Channel/DM writes; no DROP in Slice 7 SQL

`$env:NODE_OPTIONS='--max-old-space-size=8192'; pnpm --filter @nbos/api typecheck` — pass

`pnpm --filter @nbos/web typecheck` — pass

Targeted eslint on Slice 7 API/web files — pass (pre-existing unused `Delete` warning in Internal controller untouched)

Production migrate: **not run**

## Browser

Not live-clicked in this session. Web and API were not running; no authenticated Client Messenger session was available. Locked composer, Reply to client, Sales mapped Meta, and Client Collections were **not** exercised in a browser.

## Security notes (Client surface)

```text
Scope: Client Messenger HTTP/UI; locked composer; Meta inbound cutover into Core Client Sales; Client Collections
Assets: CLIENT conversation persist; Meta Sales history identity; CRM Lead attach; Internal zone isolation
Trust boundaries: employee session + MESSENGER VIEW + evaluateMessengerCoreAccess.canSend for persist; Client READ is not SEND; collection membership is not ACL; UI unlock is not SEND
Confirmed: persistAndBroadcast arity 1; CLIENT persist when canSend; 403 without canSend; Internal GET 404s CLIENT and Client GET 404s INTERNAL; cross-zone collection items rejected; no HTTP canonicalKey; live ingest no longer writes MetaMessage; mapping cannot land on INTERNAL; grant EDIT without SEND cannot persist
Unverified: live browser; production migrate; IG/FB provider dispatch (absent); WhatsApp Gateway (Slice 8)
Severity: forged UI unlock bypassing canSend would be a client-visible send; treating empty Meta as NEW would fork Sales history; applying Mail exemption would skip mapping
Attack scenario: POST /messenger/core/client/conversations/:id/messages with VIEW but clientSendScope NONE — 403 SEND_FORBIDDEN; Internal collection item POST of a CLIENT conversation — 404/400 zone mismatch
Validation: unit tests listed above
Not reviewed: Slice 8 Gateway WhatsApp; Slice 9 Product WORK; Ticket/Deal create; production data
Remaining risk: browser not live-clicked; production migrate not run; CRM Lead UI that still reads MetaMessage will not show new inbound until it reads Core; Client invite still uses Core inviteParticipant (canWrite), so SEND-only EDIT NONE cannot invite a specialist
```

## Residual risk

- CRM Lead attach/merge still runs on MetaConversation. New inbound is Core SOT; Lead message UIs that still list MetaMessage will miss new inbound until they read Core.
- Client invite/read-only specialist is wired with forced `READ_ONLY`, but `inviteParticipant` still `requireWrite`. An employee with Client SEND and `MESSENGER.EDIT` NONE can persist and still cannot invite.
- Clients / WhatsApp views may be empty until Slice 8/9. Inbox may list Core CLIENT conversations that are empty except mapped Meta Sales.
- Meta outbound Graph send is still absent. Employee outbound persists in Core only; no fake IG/FB/WhatsApp delivery.
- Snapshot may still be 0 MetaConversation rows. Mapper is a no-op; classification remains MIGRATE.
- `MESSENGER_CORE_CLIENT_SEND_DISABLED` constant is unused leftover.
- Ticket/Deal create remains unimplemented (`MESSENGER_CLIENT_ACTION_HOOKS`).

## What this slice did not do

- Slice 8 WhatsApp Gateway inbound/outbound / WAHA
- Slice 9 Product WORK bindings
- DROP Meta / Channel / DM / TaskDiscussionEntry / Task.chatId
- Production migrate / deploy
- Dual-write Channel/DM
- Hijack CRM `/clients`
- Embed Client as a tab inside InternalMessengerApp
- Ensure Task conversations from Client Create Task
- Push to remote

## Independent review (2026-08-31)

Verdict: **VERIFIED**. Independent reviewer. Slice 6 stays `VERIFIED`. Slice 8 may begin.

Independently re-run: claimed combined vitest command — **229 passed**, 5 skipped (43 files passed, 1 skipped). Matches the handoff. Browser was **not** live-clicked. Production migrate not run. Web/API typecheck not independently re-run this pass (implementer claimed pass).

### Holds

- `/client-messenger` is a separate product (Inbox / Sales / Clients / Collections). CRM `/clients` and Internal `/messenger` are unchanged. Sidebar key `client-messenger` is distinct from `messenger` and CRM `clients`.
- Composer starts locked. `Reply to client` unlocks that conversation id only. Switch/section change relocks and clears the draft. No Internal/Public toggle. Unlock UI cannot persist without `canSend`.
- `persistAndBroadcast` arity 1. CLIENT persist when `canSend` is true, including `MESSENGER.EDIT` NONE. 403 READ_ONLY / SEND_FORBIDDEN otherwise. Unconditional `SEND_DISABLED` path is gone. Leftover second argument is ignored.
- Internal GET still 404s CLIENT. Client GET 404s INTERNAL. Client Collections are zone CLIENT; Internal collection HTTP 404s CLIENT collections and the reverse.
- Live Meta ingest no longer `metaMessage.create`. It persists Core CLIENT EXTERNAL + INSTAGRAM/FACEBOOK mapping + Core messages (`senderId` null, provenance PROVIDER) in the same transaction, then emits Core. Mapper is ops-only; list GET does not map. Mapping onto INTERNAL is forbidden. Slice 7 SQL has no DROP. No HTTP `canonicalKey`. Dual-write into Channel/DM: none.
- Slice 5 Task GET/list/HIDDEN still holds in the same run (`messenger-core-task-acl.test.ts`).
- Slice 6 Create Task / Forward internally / Open original are reused. Forward target remains Internal. Ticket/Deal hooks remain unimplemented.

### Remaining (not blocking)

- Browser not live-clicked; production migrate not run.
- CRM Lead still shows `MetaConversation.latestMessagePreview` (ingest still updates that row). Full new inbound history is Core. Lead UIs that listed `MetaMessage` would miss new bodies.
- Client invite still `requireWrite`. SEND-only with `MESSENGER.EDIT` NONE can persist and cannot invite.
- `CLIENT_READ` OWN still requires membership; Meta ensure does not seed participants. `CLIENT_READ` ALL (owner/CEO/PM/head-sales/head-delivery) can list unassigned Sales. Seller OWN will not see those chats until invited. This matches existing Slice 2 OWN, not a new ACL bypass.
- WhatsApp / Product client chats empty until Slice 8/9. No IG/FB provider dispatch.
- Draft isolation tests compare store-key strings; Client/Internal are separate trees and Client clears `newMessage` on switch.
- `MESSENGER_CORE_CLIENT_SEND_DISABLED` constant is unused leftover.

## Browser persistence (Phase 5)

Client Messenger uses the same IndexedDB envelope as Internal Messenger (`schemaVersion` `2`, immutable `capturedAt`, atomic compare-and-write, 24h retention from envelope `capturedAt`, employee identity isolation). Only the canonical Client default inbox (`q=''`) and CLIENT collection list are persisted, with the shared Internal defaults. Expired query rows are omitted on capture/parse so a stale collection cannot invalidate a fresh inbox; the envelope still expires at 24h. Search variants are not persisted. Account switch withholds the tree until the new identity is prepared. Thread messages, drafts, and Task discussion caches are not persisted. Restored lists remain non-authoritative and must pass current delta/auth-epoch guards. Logout purges memory synchronously and does not wait for IndexedDB clear. Disable with `NEXT_PUBLIC_MESSENGER_PERSISTENCE=0` (stale IDB ignored; no migration).

## Final status

VERIFIED

## Files changed (implementer)

API: Client HTTP (`messenger-core-client.*`, collection controller, DTOs, list ops), persistAndBroadcast unlock, Meta ensure/inbound/mapper/live-inbound, ingest cutover, collection zone 404s, identity kinds, mapping upsert.

Web: `/client-messenger/*`, `features/messenger-client/*`, nav + sidebar key/visual, `messenger-core-client.ts`, optional Internal `ThreadComposer` placeholder.

Schema: `messenger-core.prisma`, `messenger.prisma`, migration `20260831180000_messenger_client_meta_identity`.

Docs: this file; `07`, `10`, `11` updated to READY_FOR_REVIEW.
