# Slice 2 — Permission model and Internal/Client boundary

Status: VERIFIED

Independent review (fix cycle) closed FINDING-S2-01 and FINDING-S2-02. Slice 3 may begin.

## Canonical decisions

- `M-BOUNDARY-01` — one Core, two product surfaces; Internal APIs are not a Client send path
- `M-BOUNDARY-02` — Collections never mix Internal and Client conversations
- `M-SECURITY-01` — no always-on Client send path in this slice (locked composer is Slice 7)
- `M-SECURITY-02` — Client READ ≠ SEND; invite/membership/binding do not silently grant SEND
- `M-ROUTING-01` — attention ownership is not access; Support/Finance queues not implemented

## Scope

Make conversation ACL real on Messaging Core HTTP. Module `MESSENGER.VIEW` / `EDIT` remains necessary and is no longer sufficient.

Out of scope: Slice 3 Internal UI, Slice 7 Client composer/unlock session, Slice 8 Gateway, dual-write, mapper hook-in, table drops.

## Permission model

```text
module MESSENGER.VIEW
  + conversation-level decision
```

Conversation-level facts (only):

1. Active participant (`leftAt` null). `READ_ONLY` is read without write/SEND.
2. `MESSENGER.VIEW` / `EDIT` scope `ALL` for **Internal** only (same platform meaning as Channel ALL).
3. `MESSENGER.CLIENT_READ` / `CLIENT_SEND` scopes. `CLIENT_READ ALL` can **read** Client conversations without membership; it does not grant write. `VIEW ALL` does **not** reveal Client history.
4. Explicit `ResourceAccessGrant` on `messenger_conversation` (`VIEW` = READ, `EDIT` = Internal write / Client structural mutation). Never Client SEND.

Ignored (negative by construction):

- `ConversationLink` (including PRODUCT PRIMARY)
- Product/Project team membership
- SHARED Collection membership
- attention / routing fields (not added)

### Internal READ / WRITE

- READ: `VIEW != NONE` and (participant **or** `VIEW ALL` **or** grant).
- WRITE: `EDIT != NONE` and (writeable participant **or** `EDIT ALL` **or** grant `EDIT`).
- `OWN` / `DEPARTMENT` without a participant row do not grant Core GET by UUID.
- ConversationLink is not membership.

### Client READ / SEND

Catalog actions on module `MESSENGER` (same Permission + `seed-rbac` + `RequirePermission` pattern as `CRM_CALL_RECORDINGS.PLAY`):

| Permission              | Meaning                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------- |
| `MESSENGER.CLIENT_READ` | Coarse Client READ ceiling (`ALL` bypasses membership; `OWN` still needs membership/grant)  |
| `MESSENGER.CLIENT_SEND` | Coarse Client SEND ceiling; never implied by READ, invite, grant `EDIT`, or Product binding |

Effective Client GET: module `VIEW` **and** (participant **or** `CLIENT_READ ALL` **or** grant).

Effective Client **write** (invite / addLink / override): `EDIT != NONE` **and** (writeable participant **or** grant `EDIT`). `CLIENT_READ ALL` and Internal `EDIT ALL` are not Client write bypasses.

Effective Client SEND: Client READ **and** `CLIENT_SEND != NONE` **and** role is not `READ_ONLY`.

Persist of CLIENT remains globally disabled (`MESSENGER_CORE_CLIENT_SEND_DISABLED`) **after** the SEND check, so missing SEND (`MESSENGER_CORE_CLIENT_SEND_FORBIDDEN` / `READ_ONLY`) is distinct from “not enabled yet”.

HTTP GET without conversation-level access returns **404** (does not leak Client existence to Internal-only users). Missing module `VIEW` remains 403.

Default seed (developers omitted on purpose):

- Owner, CEO, PM, Head of Sales, Head of Delivery: `CLIENT_READ ALL` + `CLIENT_SEND ALL`
- Seller: `CLIENT_READ OWN` + `CLIENT_SEND OWN`

## What was reused

- `loadMessengerLegacyAccess` / `RequirePermission` / Permission catalog / `seed-rbac`
- `ResourceAccessGrant` + `activeResourceAccessGrantWhere` as explicit, auditable conversation override (EmployeeAccessOverride is family-scoped and has no Messenger family; it was not stretched into a silent SEND)
- `AuditService` for Client participant grant/revoke and override grant/revoke (no message bodies)
- `MessengerParticipantRole.READ_ONLY` for read-only invite
- Channel/DM ALL semantics only for Internal Core, not copied onto Client

## HTTP surface

Tightened `messenger/core`:

- GET / persist / markRead / addLink require conversation ACL
- persist Internal requires Internal write
- persist Client: SEND check then still disabled; arity of `persistAndBroadcast` remains 1; no `allowClientPersist`
- create CLIENT requires `CLIENT_READ != NONE` in addition to `EDIT`
- invite default role `READ_ONLY`; Client grant/revoke audited. Actor must be a writeable participant or hold grant `EDIT`.
- `addReference` requires conversation READ on the source message conversation, and on the holder/target message conversation when present.
- access-overrides use `ResourceAccessGrant` (`VIEW` never becomes SEND)
- `POST messenger/core/collections` additive API only (no `/messenger` UI)

No new HTTP that maps a provider onto INTERNAL. `createCoreExternalMapping` / provider-send outbox stay CLIENT-only.

## Collections (server only)

Additive tables:

- `messenger_conversation_collections` (PERSONAL/SHARED, zone INTERNAL|CLIENT, zone immutable trigger)
- `messenger_conversation_collection_items` (unique per collection+conversation; zone-match trigger)
- `messenger_conversation_collection_members`

One conversation may belong to multiple Collections. SHARED membership does not grant GET/SEND. Slice 3 owns Collection screens.

## Data migration / rollback

```text
Change: additive Collection tables + RBAC catalog rows
Framework: Prisma 7 / PostgreSQL 17
Risk classification: LOW
```

New migration only: `20260830200000_messenger_core_permissions_boundary`. Slice 1 `20260830190000_messenger_core_relational_foundation` and its checksum were not edited. No DROP of Channel/DM, Meta, or Task discussion.

Rollback for unapplied environments: do not apply. If applied in a disposable DB: drop the three Collection tables and `MessengerCollectionVisibility`. No production migrate in this slice. No backfill.

`seed-rbac` inserts `MESSENGER.CLIENT_READ` / `CLIENT_SEND`. Next seed run updates role_permissions via the existing deleteMany/createMany.

## Tests

`pnpm test -- apps/api/src/modules/messenger` — **98 passed**, 5 skipped (opt-in int tests). Slice 1 cases remain.

Mandatory negatives:

- Product developer without Client READ cannot GET Client history (forged UUID) — helper + HTTP/service 404
- READ without SEND cannot persist — helper `NO_SEND` vs `READ_ONLY`; HTTP `MESSENGER_CORE_CLIENT_SEND_FORBIDDEN` distinct from `MESSENGER_CORE_CLIENT_SEND_DISABLED`
- `CLIENT_READ ALL` + `EDIT OWN`, not participant, no grant → `canRead` true, `canWrite` false; invite/addLink/override 403
- grant `EDIT` without SEND cannot persist Client; persist still `DISABLED` after `canSend` true
- `addReference` on a Client source without Client READ → 404, no create; Internal source member can create
- ConversationLink / Product team not consulted by the access loader
- SHARED Collection membership is not an access fact; GET stays denied
- Client item into Internal Collection (and reverse) rejected in ops + DB trigger SQL
- Internal conversation cannot acquire provider mapping (existing ops test)
- `persistAndBroadcast` arity 1; CLIENT persist forbidden; no `allowClientPersist`
- HTTP create has no `canonicalKey`
- Channel/DM writers still do not write `messengerConversation`

## Implementation result

### Files (principal)

**Schema**

- `packages/database/prisma/schema/messenger-core.prisma` — Collection models
- `packages/database/prisma/schema/messenger.prisma` / `employees.prisma` — relations
- `packages/database/prisma/migrations/20260830200000_messenger_core_permissions_boundary/migration.sql`

**RBAC / platform**

- `packages/shared/src/constants/messenger-client-permissions.ts`
- `packages/shared/src/platform-access/constants.ts` — `messenger_conversation` grant type
- `packages/database/prisma/seed-rbac.ts`

**Runtime**

- `apps/api/src/modules/messenger/core/messenger-core-access*.ts`
- `apps/api/src/modules/messenger/core/messenger-core.service.ts` / `.controller.ts`
- Collection + override + participant ops
- `apps/api/src/modules/messenger/access/messenger-legacy-channel-access.op.ts` — `clientReadScope` / `clientSendScope`

**Docs**

- this file
- checklist Slice 2 → `READY_FOR_REVIEW`
- reconciliation + progress Slice 2 status only

### Commands executed

- `pnpm test -- apps/api/src/modules/messenger` — **98 passed**, 5 skipped
- `$env:NODE_OPTIONS='--max-old-space-size=8192'; pnpm --filter @nbos/api typecheck` — pass
- Prisma schema not changed in the fix cycle; `generate` not required
- Production migrate: **not run**
- Browser: N/A (no UI)

### Security review (ACL paths)

```text
Scope: Core HTTP GET/persist/invite/override/collections; mapping/outbox ops
Assets: Internal and Client conversation history; Client SEND capability
Trust boundaries: employee session + RBAC + conversation membership/grant
Confirmed findings: FINDING-S2-01/02 closed in this fix cycle (CLIENT_READ is read-only; addReference uses conversation ACL). GET IDOR remains closed.
Unverified risks: real-DB int tests not run; seed not applied to live roles until next seed
Severity: previous hole was IDOR on Core GET by UUID (Client history). Closed by conversation ACL + 404
Attack scenario: employee with MESSENGER.VIEW forges a Client conversation UUID
Recommended remediation: implemented (404 without Client READ/membership/grant)
Validation: unit tests listed above
Not reviewed: Channel/DM UI, Gateway, Client composer, production data
Remaining risk: CLIENT_READ ALL roles can GET any Client conversation by UUID by design; that ceiling does not grant write or SEND. Grant EDIT never becomes SEND.
```

## What this slice did not do

- Slice 3 Internal Messenger UI / Channel/DM cutover
- Slice 7 Client composer, unlock session, Meta mapping
- Slice 8 WhatsApp Gateway dispatch
- Dual-write or mapper hook-in to Channel/DM send
- DROP Channel/DM, Meta, Task discussion
- Support/Finance attention queues
- Collection screens
- Commit (not requested)

## Independent review

- reviewer scope: Slice 2 only. Handoff treated as claims, not proof.
- tests executed/rechecked: `pnpm test -- apps/api/src/modules/messenger` — **98 passed**, 5 skipped. Real-DB int tests not run. Browser N/A.
- Slice 1 invariants rechecked: no `canonicalKey` on HTTP create; `persistAndBroadcast` arity 1; no `allowClientPersist`; Channel/DM isolation test still present; Slice 1 migration checksum not edited.

### Confirmed (not disputed)

- Module VIEW/EDIT is no longer sufficient for Core GET. Internal OWN/DEPARTMENT without a participant row cannot GET by UUID. Internal VIEW ALL does not reveal Client history.
- Client GET 404 without membership / `CLIENT_READ ALL` / grant. Catalog actions `MESSENGER.CLIENT_READ` / `CLIENT_SEND` exist. Grant VIEW/EDIT never becomes SEND. Persist on CLIENT still disabled after a distinct SEND failure.
- ConversationLink / Product team / Collection membership are not access facts in the loader.
- Collections are zone-scoped (ops + DB trigger). SHARED membership does not grant GET.
- ResourceAccessGrant + AuditService reused. EmployeeAccessOverride was not stretched into SEND.
- Dual-write none. Mapper still unhooked. No Collection UI.

### Findings

- **FINDING-S2-01:** closed. Independently rechecked: `evaluateClient` `canWrite` is `editScope !== 'NONE'` and (writeable participant or grant `EDIT`) only. `CLIENT_READ ALL` + `EDIT OWN` without participant/grant → `canWrite` false; invite/addLink/override → 403. Invite audit uses a writeable `MEMBER`. Internal `EDIT ALL` is not a Client write bypass.
- **FINDING-S2-02:** closed. Independently rechecked: `addReference` `requireRead`s source conversation and holder/target conversation when a holder id is present. Client source without Client READ → 404, no create. Internal source member can still create.

## Remaining debt

- Opt-in real-DB int tests not run.
- `prisma migrate status` still blocked by pre-existing empty `20260828170000_client_service_reminder_language`.
- Collection HTTP is ops-only; Slice 3 owns Favorites UI and Internal navigation.
- Client persist remains disabled until Slice 7.
- Core GET/create still not Channel/DM UI (Slice 3 cutover).

## Final status

VERIFIED
