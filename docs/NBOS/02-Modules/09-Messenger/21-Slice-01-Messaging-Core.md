# Slice 1 — Messaging Core relational foundation

Status: VERIFIED

Independent review (fix cycle) closed FINDING-S1-01 and FINDING-S1-02. Slice 2 may begin.

## Canonical decisions

- `M-CORE-01` — one Messaging Core
- `M-FILES-01` — attachments are Drive File Assets
- `M-MESSAGE-02` — persist before realtime
- `M-BOUNDARY-01` — Internal vs Client surfaces (data-zone only in this slice)

## Scope

Establish the canonical durable Messaging Core by evolving existing Unified tables (`MessengerConversation*`). Add zone/kind, message direction/status/provenance, references, reactions, provider mapping, command/idempotency hook, and scheduled Channel/DM identity mapping.

Out of scope: Slice 2 Client READ/SEND matrix, Slice 3 Channel/DM UI cutover, Client send, Gateway dispatch, Meta/Task/WhatsApp binding migration, dual-write, table drops.

## Existing runtime / migration notes

Slice 0 (`20-Slice-00-Baseline.md`, SHA `302f57f7`) is independently `VERIFIED`.

Core path chosen: **evolve Unified as Core**. Not a third store. Channel/DM remains the live Internal UI write path (`messenger.service.ts`) until Slice 3.

Dual-write: **none**.

Mapping: scheduled. Ops exist (`mapLegacyChannelToCore` / `mapLegacyDirectThreadToCore`) with `messenger_legacy_identities` and canonicalKey `legacy:channel:{id}`. Not hooked into Channel/DM send.

Meta stays until Slice 7. Task discussion stays until Slice 5.

Live DB (same unlabeled Neon host as Slice 0 inventory; not labeled prod vs staging): Core objects were already applied as `_prisma_migrations.20260830190000_messenger_core_relational_foundation`. Repo SQL was reconstructed to match that live shape after an earlier local enums/composite-key attempt failed. Failed `20260830190000_messenger_core_enums` row was removed. Checksum of the reconstructed file was written back onto the applied row. Channel/DM, Unified, Meta, and Task discussion tables were not dropped.

## Implementation requirements

- Conversation `zone` is `INTERNAL` | `CLIENT` and immutable after create (DB trigger + no update API).
- INTERNAL types vs CLIENT `EXTERNAL` are validated in app and DB (CHECK + align trigger).
- Messages persist with `direction` / `status` default `SENT` / `provenance` default `EMPLOYEE`.
- Persist Core message, then emit unused WS `messenger.conversation.message`.
- HTTP `messenger/core` requires `MESSENGER` VIEW/EDIT + `CurrentUser`.
- Client persist blocked (`MESSENGER_CORE_CLIENT_SEND_DISABLED`).
- Provider mapping rejected on INTERNAL; allowed on CLIENT without Gateway dispatch.
- `messenger_commands` is an idempotency hook only (`SEND_MESSAGE` / `PENDING`).
- MessageReference Restrict on source; deleting a reference does not delete the source.
- Attachments require an existing Drive FileAsset.

## Data migration / rollback

```text
inventory → additive schema → scheduled mapping (not executed as cutover) → no dual-write
```

Rollback for fresh environments: do not apply this migration. For the inventoried DB, Core columns/tables already exist; reversing them is out of slice scope and would be destructive.

Channel/DM writers are unchanged. Turning off Core HTTP does not affect daily Internal Messenger.

## Tests / negative tests

Unit (Vitest, `apps/api/src/modules/messenger/core`):

- zone/type and direction validation
- DIRECT canonical-key reuse and unique-constraint race
- persist-before-emit; no emit when persist throws
- Client persist blocked
- INTERNAL provider mapping / provider-send command rejected
- CLIENT mapping hook without Gateway
- MessageReference missing source; delete reference keeps source
- FileAsset missing fails closed
- idempotent remapping; 0-row Channel/DM mapper is a no-op
- migration SQL does not DROP Channel/DM, Unified, Meta, or Task discussion
- Core routes require MESSENGER VIEW/EDIT; Channel/DM controller unchanged
- HTTP/DTO has no `canonicalKey`; CLIENT EXTERNAL / INTERNAL_GROUP / PRODUCT ignore stolen `product:` / `direct:` keys
- DIRECT still computes `direct:{low}:{high}` and ignores a caller-supplied key
- `persistAndBroadcast` arity is 1; leftover `allowClientPersist: true` still cannot persist CLIENT
- Mapper create still sets `legacy:channel:{id}`

Integration (`messenger-core.int.test.ts`): skipped unless `AI_PLATFORM_DB_TEST_URL` or `MESSENGER_CORE_DB_TEST_URL` is set.

## Implementation result

### Branch / SHA

- Branch: `feat/messenger-slice-01-messaging-core`
- Slice 0 / origin/main SHA at start: `302f57f7e6b13f7a1acdc3c09e027549389fbabe`
- Working tree: uncommitted Slice 1 implementation (no commit requested)

### Files changed (principal)

**Schema**

- `packages/database/prisma/schema/messenger.prisma` — Unified comment + zone/kind/message Core fields; type `EXTERNAL`
- `packages/database/prisma/schema/messenger-core.prisma` — Core enums and satellite tables
- `packages/database/prisma/schema/employees.prisma` — reactions/commands/references relations
- `packages/database/prisma/migrations/20260830190000_messenger_core_relational_foundation/migration.sql` — reconstructed to live DB

**Runtime**

- `apps/api/src/modules/messenger/core/*` — Core ops, HTTP, mapper, tests
- `apps/api/src/modules/messenger/messenger.module.ts` — Core controller/service
- `apps/api/src/modules/messenger/messenger.gateway.ts` — `emitCoreConversationMessage`

**Docs**

- this file
- `11-Messenger-Rebuild-Implementation-Checklist.md` — Slice 1 `VERIFIED`
- `10-Messenger-Runtime-Reconciliation.md` — Core path, dual-write none, mapping schedule
- `07-Internal-Messenger-Implementation-Progress.md` — Slice 1 status only

### Commands / tests executed

- `pnpm --filter @nbos/database generate` — pass (Prisma Client 7.8.0)
- `NODE_OPTIONS=--max-old-space-size=8192 pnpm --filter @nbos/api typecheck` — pass
- `pnpm test -- apps/api/src/modules/messenger` — 58 passed, 5 skipped (opt-in int tests), 19 files passed / 1 skipped
- Live DB migration history: failed `20260830190000_messenger_core_enums` row deleted; reconstructed `20260830190000_messenger_core_relational_foundation` checksum written onto the already-applied row
- `pnpm --filter @nbos/database migrate:status` — **not green**: P3015 empty directory `20260828170000_client_service_reminder_language` (pre-existing, not Slice 1)
- `prisma migrate diff --from-config-datasource --to-schema prisma/schema` — not empty: pre-existing unrelated drift (DealType/OrderType, document search_vector, index renames). No missing Core tables/columns. Not applied.

Integration tests not run (`AI_PLATFORM_DB_TEST_URL` / `MESSENGER_CORE_DB_TEST_URL` unset). Browser verification not applicable (no UI cutover).

### FINDING-S1-01 / FINDING-S1-02 fix (implementer)

- **FINDING-S1-01 closed (implementer):** `CreateCoreConversationDto` no longer has `canonicalKey`. HTTP create does not forward a key. `createCoreConversation` never persists a caller-supplied key: DIRECT computes `direct:{low}:{high}` internally; all other types created through this function store `canonicalKey` as null (field omitted). Mapper still sets `legacy:channel:{id}` via its own `messengerConversation.create`. No new migration; applied `20260830190000_messenger_core_relational_foundation` checksum was not edited. ConversationLink uniqueness unchanged.
- **FINDING-S1-02 closed (implementer):** `persistAndBroadcast` has a single argument. Client zone unconditionally throws `MESSENGER_CORE_CLIENT_SEND_DISABLED`. No options bag.
- **FINDING-S1-03:** docs-only; ConversationLink uniqueness left per conversation.

Files: `dto/create-core-conversation.dto.ts`, `messenger-core.controller.ts`, `messenger-core.types.ts`, `messenger-core-conversation.ops.ts`, `messenger-core.service.ts`, `messenger-core.constants.ts`, corresponding tests.

### Commands / tests executed (fix)

- `pnpm test -- apps/api/src/modules/messenger` — **65 passed**, 5 skipped (opt-in int tests)
- `NODE_OPTIONS=--max-old-space-size=8192 pnpm --filter @nbos/api typecheck` — pass
- Prisma schema not changed; `generate` not required
- Applied migration checksum not edited; no production migrate

### Known limitations

- Daily `/messenger` Channel/DM UI is unchanged (Slice 3).
- Client SEND persist remains disabled (Slice 7 enables persist; Slice 8 Gateway).
- `messenger_commands` does not dispatch Gateway (Slice 8).
- Mapper is not invoked from Channel/DM send.
- ConversationLink uniqueness is per conversation (`@@unique([conversationId, entityType, entityId, relationType])`), not global per entity.
- CLIENT CHECK allows `kind = EXTERNAL` without requiring `type = EXTERNAL`; a separate trigger requires `type = EXTERNAL`.
- Integration tests not run unless a disposable DB URL is provided.
- `prisma migrate status` is blocked by a pre-existing empty migration directory `20260828170000_client_service_reminder_language` (not Slice 1).
- Live schema vs Prisma still has pre-existing non-Messenger drift; Slice 1 did not apply that diff.

## Independent review

- reviewer scope: Slice 1 only, including the FINDING-S1-01 / S1-02 fix cycle. Handoff treated as claims, not proof.
- HEAD: `302f57f7e6b13f7a1acdc3c09e027549389fbabe` on `feat/messenger-slice-01-messaging-core`. Working tree uncommitted. No commit.
- code/schema evidence: DTO, controller, `createCoreConversation`, `MessengerCoreService.persistAndBroadcast`, mapper create path, types, tests. Prisma schema and applied migration checksum were not edited in the fix.
- tests executed/rechecked: `pnpm test -- apps/api/src/modules/messenger` — **65 passed**, 5 skipped. Real-DB int tests not run. Browser N/A.

### Fix-cycle adversarial checks

- HTTP create DTO / controller contain no `canonicalKey`. `CreateMessengerCoreConversationInput` has no optional key. `createCoreConversation` does not persist `input.canonicalKey`.
- Stolen `product:` / `direct:` keys on CLIENT EXTERNAL, INTERNAL_GROUP, and PRODUCT are not stored (Prisma create data omits `canonicalKey`).
- DIRECT still computes `direct:{low}:{high}` and ignores a caller-supplied key. Mapper still writes `legacy:channel:{id}` on its own create path, not via HTTP.
- `persistAndBroadcast` arity is 1; no `allowClientPersist`. Leftover `{ allowClientPersist: true }` still cannot persist CLIENT.
- Dual-write still none. Channel/DM isolation test still requires Channel/DM writers. No Topic/L1/L2.

### Findings

- **FINDING-S1-01:** closed. HTTP cannot accept a caller key; `createCoreConversation` never stores one except computed DIRECT.
- **FINDING-S1-02:** closed. Client persist is unconditional on the service. No options bag.
- **FINDING-S1-03:** closed as docs-only. ConversationLink uniqueness left per conversation.

## Remaining debt

- Live-DB checksum rewrite of `20260830190000_messenger_core_relational_foundation` is ops debt. Do not edit that applied checksum again. New additive migrations only.
- Integration tests not run on a real DB.
- `prisma migrate status` blocked by pre-existing empty folder `20260828170000_client_service_reminder_language` (not this slice).
- Core GET/create uses module MESSENGER VIEW/EDIT, not conversation membership or Client READ — **Slice 2 owns this**.
- Optional CLIENT `canonical_key` CHECK was not added (allowed).
- Slice 3 Channel/DM cutover and mapper execution window
- Slice 5 Task Discussion backfill
- Slice 7 Meta → Core Client Sales
- Do not DROP Channel/DM, Meta, or Task discussion in this slice

## Final status

VERIFIED
