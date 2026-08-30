# Slice 3 — Internal Messenger base: Groups, Direct, All, Collections

Status: VERIFIED

Implementer evidence for independent review. Claims in this handoff are not review proof.

## Canonical decisions

- `M-INTERNAL-01` — Internal navigation: All / Products / Tasks / Deals / Work Spaces / Groups / Direct / Collections
- `M-INTERNAL-02` — `All` is a flat recent-activity inbox, not a Project tree
- `M-COLLECTIONS-01` — Favorites is the built-in PERSONAL Collection; PERSONAL/SHARED; membership does not grant ACL
- `M-BOUNDARY-02` — Internal Collections contain only Internal conversations

## Scope

Rebuild the daily Internal Messenger surface on Messaging Core.

Working in this slice: **All, Groups, Direct, Collections**.

Out of scope: Slice 4 entity ensure (Product/Work Space/Deal as first-class conversations), Slice 5 Task Discussion, Slice 6 mentions persist / message actions, Slice 7 Client composer, Slice 8 Gateway, dual-write into Channel/DM send, DROP Channel/DM/Meta/Task discussion.

## Cutover / mapping

Required sequence executed:

```text
1. Idempotent mapper for existing Channel/DM rows into Core
2. Internal UI reads/writes Core
3. Channel/DM tables left in place (rollback store)
4. Mapper is not hooked into Channel/DM send as dual-write
```

Mapper (`mapAllLegacyInternalToCore` / `mapLegacyChannelToCore` / `mapLegacyDirectThreadToCore`):

- Channel canonicalKey remains `legacy:channel:{id}` as INTERNAL_GROUP
- Direct reuses `direct:{low}:{high}`
- Mapper copies `lastMessageAt`, Channel visibility as Core participants (not senders-only), Direct pair, and Channel/DM read states
- GENERAL/ANNOUNCEMENT (and non-UUID PROJECT keys): active employees with MESSENGER.VIEW; EDIT → MEMBER, VIEW-only → READ_ONLY
- PROJECT + UUID: project team-graph members as participants
- Direct: both participants (unchanged)
- 0-row Channel/DM is a no-op (unchanged)
- Remapping the same source returns the existing Core conversation (`created: false`); missing participants may be backfilled; messages are never copied again

**When it runs:** mapper is **ops-only**. `POST messenger/core/internal/legacy-map` (MESSENGER.EDIT), once at cutover. `GET messenger/core/internal/conversations` is read-only and does not map. Internal UI does not POST legacy-map on inbox boot. This is a **one-way cutover**, not a dual-write window. After cutover, Internal writes Core only.

**Compatibility / rollback:** no env flag. Daily Internal entry is `/messenger` (Core). Channel/DM UI remains at `/messenger/legacy` for rollback only and is not the product nav. Channel/DM HTTP send endpoints remain for that rollback client. Permanent dual-write is forbidden.

Empty Channel/DM in a DB is a mapper no-op; it does not prove Channel/DM unused.

## UI routes

| Route                                                  | Surface                                            |
| ------------------------------------------------------ | -------------------------------------------------- |
| `/messenger`                                           | Internal All                                       |
| `/messenger/groups`                                    | Internal Groups                                    |
| `/messenger/direct`                                    | Internal Direct                                    |
| `/messenger/collections`                               | Internal Collections (Favorites + PERSONAL/SHARED) |
| `/messenger/products` `/tasks` `/deals` `/work-spaces` | Progressive shells (empty until Slice 4)           |
| `/messenger/legacy`                                    | Channel/DM rollback UI (not product nav)           |

Sidebar Messenger children match Internal navigation. There is no Internal\|External product toggle on the new surface. Visual identity stays Internal (`#F5F5F0` / `#E5A84B`). Client conversations are not listed or opened on Internal routes (404).

## HTTP (Internal)

Prefix: `GET/POST /api/messenger/core/internal`

- `POST legacy-map` — idempotent Channel/DM → Core
- `GET conversations?section=&q=&filter=unread\|mentions` — Internal zone only, ACL-filtered, `lastMessageAt` desc; list items include `canWrite`
- `POST conversations` — INTERNAL_GROUP or DIRECT only
- `GET conversations/:id` — Internal zone; includes `canWrite` from `evaluateMessengerCoreAccess`
- `GET/POST conversations/:id/messages` — Core persist via `persistAndBroadcast` (arity 1); composer uses `canWrite`
- `POST conversations/:id/read` — Core `markRead`
- `POST conversations/:id/favorite` — built-in Favorites PERSONAL Collection + `MessengerUserConversationSetting.favorite`
- `GET/POST collections` — Internal zone forced
- `GET collections/:id` — ACL-filtered item ids plus those conversations (not paginated All ∩ ids)
- `POST collections/:id/members` and `POST/DELETE collections/:id/items` — Internal zone required (Client collections 404)

`filter=mentions` is a hook: empty list, `mentionsAvailable: false` (mention persist is Slice 6). Search and Unread filters are live.

Slice 2 Core HTTP (`messenger/core`) is unchanged. Client persist stays `MESSENGER_CORE_CLIENT_SEND_DISABLED`. HTTP create still has no `canonicalKey`.

## Realtime

WS `messenger.subscribe_conversation` now joins `messenger:conversation:{id}` after Core ACL `canRead`. Persist still happens before `messenger.conversation.message` emit.

## Collections / Favorites

- Built-in PERSONAL Internal collection named `Favorites` is ensured on Internal collection list
- `MessengerUserConversationSetting.favorite` seeds Favorites items (idempotent upsert); toggle writes both the Collection item and the setting (one favorites system)
- PERSONAL and SHARED create on Internal routes (zone forced INTERNAL)
- One conversation may belong to multiple Collections
- SHARED membership does not grant conversation ACL; GET items are filtered with Slice 2 `evaluateMessengerCoreAccess`
- Internal Collection still rejects Client conversations (ops + DB trigger from Slice 2)

## What still uses Channel/DM

Labeled rollback only (not product nav, not Portfolio):

- `/messenger/legacy` → `MessengerClient`
- `apps/web/src/lib/api/messenger.ts` Channel/DM HTTP client (used by that rollback UI)
- `MessengerService` / `MessengerController` Channel/DM HTTP

Product daily Internal (`/messenger`, Portfolio sheet) embeds `InternalMessengerApp` and `messenger-core.ts` only. Mapper is not called from Channel/DM send.

## Tests

`pnpm test -- apps/api/src/modules/messenger apps/web/src/lib/api/messenger-core.test.ts`

**123 passed**, 5 skipped (opt-in Core int tests). Slice 1+2 cases remain.

Mandatory Slice 3:

- All orders by `lastMessageAt` and Internal where clause never includes CLIENT
- Groups/Direct persist calls `persistAndBroadcast`, not `messengerChannelMessage` / `messengerDirectMessage`
- Favorites PERSONAL seed from settings; SHARED list ACL-filtered
- Internal Collection rejects Client (existing ops test kept)
- Mapper idempotent and ops-only; list GET does not map; Channel/DM models still in schema
- Empty GENERAL maps VIEW-capable participants; PROJECT UUID maps team-graph members; remap does not duplicate messages
- Internal collection POST members/items 404 Client collections
- Web `messenger-core.ts` and Portfolio/Internal app do not call `/api/messenger/channels` or `/api/messenger/dm`
- Internal GET/list expose `canWrite`

## Commands executed

- `pnpm test -- apps/api/src/modules/messenger apps/web/src/lib/api/messenger-core.test.ts` — **123 passed**, 5 skipped
- `$env:NODE_OPTIONS='--max-old-space-size=8192'; pnpm --filter @nbos/api typecheck` — pass
- `pnpm --filter @nbos/web typecheck` — pass
- Prisma `generate` — **not run** (no new migration)
- Production migrate: **not run**
- No DROP

## Browser

FIX cycle (2026-08-30): web is up at `http://localhost:3000`. Opening `/messenger` still redirects to `/sign-in?callbackUrl=/messenger` (no session). API `http://localhost:4000` did not respond (timeout). Live All → Group send → Direct → Favorites → Collections and Portfolio sheet clicks were **not** exercised.

Portfolio no longer embeds `MessengerClient`; unit scan covers Channel/DM URL absence on the product embed path. Entity shells remain empty until Slice 4.

Reviewer should browser-exercise All → Group send → Direct send → Favorites → Collections, confirm entity shells empty, and confirm Portfolio no longer sends Channel/DM, against a running API.

## Security notes (Internal ACL paths)

```text
Scope: Internal list/get/persist/collections/WS subscribe
Assets: Internal conversation history; Client history must not appear on Internal
Trust boundaries: employee session + MESSENGER VIEW/EDIT + Slice 2 conversation ACL
Confirmed: Internal routes 404 CLIENT zone; list where zone=INTERNAL; SHARED items ACL-filtered; persist uses Core ACL then persistAndBroadcast
Unverified: real-DB int tests not run; live Channel/DM row mapping depends on local DB contents
Severity: Client history on Internal would be a boundary break; rejected by Internal get/list
Attack scenario: Internal GET with a Client conversation UUID
Recommended remediation: implemented (NotFoundException)
Validation: unit tests listed above
Not reviewed: Client composer, Gateway, production data
Remaining risk: Internal VIEW ALL still sees all Internal conversations (Slice 2 model). DEPARTMENT colleagues who are not on a PROJECT team graph are not seeded as participants (smallest correction: team-graph copy).
```

## What this slice did not do

- Slice 4 Product / Work Space / Deal ensure
- Slice 5 Task Discussion
- Slice 6 mention persist, Create Task, forward/references UI
- Slice 7 Client Messenger / locked composer
- Slice 8 WhatsApp Gateway
- Dual-write or mapper hook-in to Channel/DM send
- DROP Channel/DM, Meta, Task discussion
- Commit (not requested)

## Remaining debt

- Mentions filter is a hook until Slice 6
- Entity tabs are empty shells until Slice 4
- Opt-in real-DB int tests not run
- `prisma migrate status` still blocked by pre-existing empty `20260828170000_client_service_reminder_language`
- `/messenger/legacy` Channel/DM remains as labeled rollback, not in nav

## Independent review (2026-08-30)

First pass: **CHANGES_REQUIRED** (FINDING-S3-01…S3-06). FIX cycle closed those findings in code.

Second pass: **VERIFIED**. Independent reviewer. Slice 4 may begin.

Independently re-run: `pnpm test -- apps/api/src/modules/messenger apps/web/src/lib/api/messenger-core.test.ts` — **123 passed**, 5 skipped. Slice 1+2 closures still present. Browser All → Group send → Direct → Favorites was **not** live-clicked (API watch abort / `AUTH_REFRESH_TOKEN_PEPPER`); remaining risk, not a reopened High.

Schema: comment-only change on `messenger.prisma` (Core is daily Internal SOT). No new migration. No DROP.

Ops remaining: DBs with Channel/DM history must run `POST /api/messenger/core/internal/legacy-map` once (MESSENGER.EDIT). List GET does not map.

### Holds (preserved)

- `/messenger` and section routes use `InternalMessengerApp` + `messenger/core/internal`. Nav matches `M-INTERNAL-01`. No Internal|External toggle on the new surface.
- Internal GET 404s CLIENT zone. List `where.zone = INTERNAL`. Persist uses `persistAndBroadcast` arity 1, not Channel/DM tables.
- HTTP create still has no `canonicalKey`. Client persist still `MESSENGER_CORE_CLIENT_SEND_DISABLED`.
- WS `messenger.subscribe_conversation` joins `messenger:conversation:{id}` after `evaluateMessengerCoreAccess.canRead`.
- Favorites PERSONAL seed + SHARED item ACL filter tests exist.
- `/messenger/legacy` is not in product nav.

### FINDING-S3-01 (HIGH) — closed

List GET no longer calls the mapper. `POST messenger/core/internal/legacy-map` remains the ops cutover (MESSENGER.EDIT). `InternalMessengerApp` no longer POSTs legacy-map on mount. Remap still does not copy later Channel/DM messages (not dual-ingest). Unit test: list does not call the mapper.

### FINDING-S3-02 (HIGH) — closed

`PortfolioMessengerSheet` embeds `InternalMessengerApp` (Core). Remaining Channel/DM writers: `/messenger/legacy` → `MessengerClient`, `apps/web/src/lib/api/messenger.ts`, `MessengerService` / `MessengerController`. Scan test: Portfolio + Internal app do not call `/api/messenger/channels` or `/dm`.

### FINDING-S3-03 (HIGH) — closed

Channel mapper seeds Core participants from legacy visibility: GENERAL/ANNOUNCEMENT (and non-UUID PROJECT) = active MESSENGER.VIEW employees; PROJECT UUID = team-graph members; Direct pair unchanged. EDIT → MEMBER, VIEW-only → READ_ONLY. Remap backfills missing participants without duplicating messages. Tests: empty GENERAL VIEW participants; PROJECT UUID team members; remap does not copy messages.

### FINDING-S3-04 (MEDIUM) — closed

Internal `POST collections/:id/members` and `POST collections/:id/items` use `addInternalMember` / `addInternalItem`, which call `requireInternalCollection` (404 Client collections). Test: Client collection mutate 404s; Internal collection mutate proceeds.

### FINDING-S3-05 (MEDIUM) — closed

`GET collections/:id` returns ACL-filtered `items` plus `conversations` loaded by those ids. `openCollection` uses `collection.conversations`, not paginated All ∩ ids.

### FINDING-S3-06 (MEDIUM) — closed

Internal GET conversation and list items expose `canWrite` from `evaluateMessengerCoreAccess` (list uses the same write rule). Composer uses `canWrite`, not module EDIT alone. Persist ACL stays server-side.

## Final status

VERIFIED
