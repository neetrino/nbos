# Messenger Modernization — Phase 6 Final Evidence

> Status: **implementer evidence**. Independent master audit is required.
> Not a `VERIFIED PASS` claim.
>
> Product canon remains `00-Messenger-Master-Canon.md`. This file records
> Phase 6 methodology, automated measurements, and residual gates.

Date: 2026-09-07  
Task: PHASE 6 — performance / observability / final engineering audit.

## 1. Methodology

- Phases 0–5 are treated as the verified program baseline supplied to this
  task. The modernization ledger was **not** edited.
- Measurements are code-backed: Vitest assertions of request/query counts,
  UTF-8 payload bytes (`TextEncoder` / `Buffer.byteLength`), cache
  cardinality, and static SQL/index alignment.
- Mock Prisma call counts are **not** production latency. No millisecond
  improvement is claimed.
- Existing conventions reused: TanStack Query cache, Prisma mock call
  counts (same pattern as Internal list-by-ids), `logBullmqJob` duration,
  `packages/database` `db.query` / `db.slow_query` metrics. No Server-Timing
  header and no new monitoring stack were added.
- Live PostgreSQL `EXPLAIN`, browser IndexedDB quota, two-real-tab
  scheduling, and live provider send were not fabricated. Local production
  `next build` **PASS** (implementer machine; not a production deploy).
- Client request-graph evidence is a jsdom mount of the production Internal
  and Client query hooks. Direct `runMessengerBootstrap` helpers remain unit
  evidence only.
- Prisma counts distinguish GET/list aggregation from POST bootstrap
  provisioning (Favorites ensure is not a read-only path). Mock counts are
  not production latency. `$transaction` BEGIN/COMMIT is not visible to the
  mock counter; `$transaction` invocations are counted separately.

## 2. Before baseline (Phase 0, verified)

From `32-Messenger-Modernization-Ledger.md` Phase 0 (commit
`9f763df8614b56ba6d97b5ee7a9eb43b0dbf5463`):

- Messenger web state was component-owned; the root QueryClient existed but
  Messenger did not use it.
- Internal/Client list refreshes coupled Collections and Conversations,
  blanked on section change, and refetched whole lists after live events.
- Internal All and Tasks were fetched separately.
- No inbox revision/delta recovery.
- Socket.IO delivery was process-local (no shared adapter).
- `MessengerMessage` and `MessengerCommand` were not one atomic transaction.
- Existing `whatsapp.outbound-messages` workers were the approved external
  path; no independent MessengerCommand scheduler existed.

After Phases 1–5 (this task’s supplied verified baseline): shared QueryClient
cache; no list blanking; recipient-scoped idempotent realtime; zone bootstrap
and exact DB pagination; PostgreSQL revision/delta reconnect; atomic external
Message+MessengerCommand with command-first dispatch; 24h identity-isolated
IndexedDB canonical restore. Delta/scheduler flags default-off.

## 3. After — automated metrics

### 3.1 Client request counts (by endpoint)

Primary evidence mounts `useInternalMessengerQueries` /
`useClientMessengerQueries` under QueryClient + persist-ready (jsdom):
`messenger-phase6-hook-request-graph.test.ts`.

| Scenario | Asserted operations | Result |
| --- | --- | --- |
| Cold Internal default (hooks) | `POST /messenger/core/internal/bootstrap` ×1; zero conversations GET; zero collections GET | automated integration |
| Cold Client default (hooks) | `POST /messenger/core/client/bootstrap` ×1; zero Client list/collection GETs | automated integration |
| Strict Mode remount (hooks) | one bootstrap per zone; no fallback GETs | automated integration |
| Bootstrap failure (hooks) | 1 failed POST + 1 conversations GET + 1 collections GET; list paints from fallback; latch clears after those GETs write cache | automated integration |
| Stale restored canonical (hooks) | persisted ids visible on first paint; one background POST bootstrap; no GET waterfall; no blanking | automated integration |
| All ↔ Tasks after canonical cache | zero Messenger HTTP | automated unit |
| Same-session return | fresh cache; bootstrap not pending; no blank placeholder | automated unit |
| Realtime message/summary/read/delivery | zero `invalidateQueries` of the inbox list | automated |
| Access revocation | local purge; zero list invalidate | automated |
| Reconnect delta | `GET .../delta` only; only changed thread histories invalidated | automated |

Unit helpers (`runMessengerBootstrap` / `ensureMessengerBootstrap`) remain in
`messenger-phase6-request-counts.test.ts`. Realtime:
`messenger-phase6-realtime-gate.test.ts`.

### 3.2 Payload UTF-8 sizes (observed; not an SLA)

Named persist budget (from API page contract, already in code):

- `MESSENGER_PERSIST_ROWS_PER_QUERY_MAX` = 100 (`MESSENGER_CORE_*_LIST_PAGE_SIZE`)
- `MESSENGER_PERSIST_ENVELOPE_MAX_BYTES` = 2 × 100 × 8192 = **1_638_400**

No approved millisecond or bootstrap-byte SLA exists. Observed UTF-8 sizes
from canonical fixtures (`TextEncoder`, not JS `string.length`):

| Fixture | Bytes |
| --- | ---: |
| 1-row persist envelope (ASCII previews) | 915 |
| Bootstrap payload fixture | 617 |
| Summary realtime event | 147 |
| Read realtime event | 120 |
| 100-row short-preview list page | 32_541 |
| Named envelope max (`2 × 100 × 8192`) | 1_638_400 |

These are fixture observations, not production latency or an SLA. ASCII
fixtures have equal JS `string.length`; multi-byte undercount is covered by
`messenger-utf8-bytes.test.ts` (`й` = 2 bytes, `☃` = 3).

UTF-8 is now used for persist envelope max checks. That was a Phase 6
correctness fix: multi-byte previews were previously undercounted.

Test: `messenger-phase6-payload-sizes.test.ts`.

### 3.3 Memory / cache cardinality

| Bound | Value | Evidence |
| --- | --- | --- |
| Persisted families | 4 | Internal default, Client default, INTERNAL collections, CLIENT collections |
| Rows per persisted query | 100 | API list page |
| Read watermarks / zone | 256; oldest evicted | `MESSENGER_READ_WATERMARK_MAX_PER_ZONE` |
| HTTP checkpoints | 2 zones on one QueryClient | WeakMap store |
| Thread cache | `gcTime` 1 hour; not persisted | `MESSENGER_QUERY_GC_TIME_MS` |
| Socket listeners | cleanup calls `socket.close()` | Strict Mode remount |

Test: `messenger-phase6-cardinality.test.ts`.

### 3.4 Backend Prisma query counts (mock call boundary)

Counts are independent of returned row cardinality (2 vs 80). Nested
`include` is one `findMany`, not a per-row loop. No timing claim.

**GET / standalone list aggregation** (Favorites ensure not invoked):

| Path | Bounded queries | Mutating |
| --- | --- | --- |
| Internal default GET list | 2 (grants + conversations) | 0 |
| Client default GET list | 2 | 0 |
| Internal unread | 3 (grants + `$queryRaw` + hydrate) | 0 |
| Client unread / needs_response | 3 | 0 |
| Collection GET list | 1 | 0 |

**POST bootstrap provisioning** (Favorites ensure unmocked, delta off).
`$transaction` ×1; BEGIN/COMMIT not visible. Advisory `$executeRaw` counted
in `raw` and `total`.

| Scenario | Total | Raw | Mutating |
| --- | ---: | ---: | ---: |
| Steady-state Favorites exist, no legacy settings (Internal and Client) | 6 | 1 | 0 |
| First initialization, collection absent (Internal and Client) | 7 | 1 | 1 |
| Legacy favorites backfill, 2 or 80 settings (Internal and Client) | 10 | 1 | 1 |

The previous “bootstrap = 3 reads / 0 mutation” figure is **only** the
default-list+collections aggregation with Favorites ensure mocked. It is
not the complete POST bootstrap. POST bootstrap is idempotent provisioning;
GET paths remain zero writes.

Tests: `messenger-core-query-count.test.ts` (GET + mocked-ensure
aggregation), `messenger-core-bootstrap-query-count.test.ts` (unmocked
ensure), `messenger-core-read-path-writes.test.ts`.

GET delta uses `SELECT ... FOR SHARE` on the zone counter (`$queryRaw`), not
Favorites provisioning. That is a read lock, not a write of user data.

### 3.5 SQL / index alignment (no live EXPLAIN)

Static schema vs query shape:

- List order `lastMessageAt desc, createdAt desc, id desc`; `take` = pageSize+1.
- Supporting indexes: `lastMessageAt`; `zone, status`; messages
  `(conversationId, createdAt)`; participants `(employeeId, leftAt)` /
  `(conversationId, leftAt)`.
- **Not present:** composite `(zone, status, lastMessageAt, createdAt, id)`.
  Adding it is an **OPERATIONAL GATE** pending live `EXPLAIN` on isolated
  PostgreSQL. No index was added.
- Collections: `(ownerEmployeeId, zone)`, unique `(collectionId, conversationId)`.
- Revisions: `(zone, revision, conversationId)` and
  `(employeeId, zone, revision, conversationId)`.
- Outbound reconcile: `(kind, status, nextReconcileAt)`.

Test: `messenger-core-sql-index-alignment.test.ts`.

`EXPLAIN` live: **OPERATIONAL GATE**. See §10: not run (URL in `.env.local` is
not treated as isolated PostgreSQL).

### 3.6 Timing observability (reused, not duplicated)

- HTTP: no Server-Timing interceptor in Nest. Sampled `db.query` /
  `db.slow_query` JSON metrics already exist (`packages/database` query
  metrics: `operation`, `model`, `durationMs`, `sqlFingerprint`; secrets
  redacted). Messenger list/bootstrap rides that path in production Prisma.
- Queue: `logBullmqJob` on `whatsapp.outbound-messages` logs `queue`,
  `jobName`, `jobId`, `attempt`, `durationMs`, `status`. Worker completion
  logs do **not** pass `messageId` into that helper.
- No high-cardinality conversation/message ids were added as metric labels.
- Message bodies, search text, participant names, tokens, and provider
  payloads are not logged by these paths.

## 4. Realtime / recovery final gate

Covered by Phase 6 plus prior verified tests:

- Duplicate / out-of-order summary and read: `messenger-realtime-monotonicity.test.ts`
- Delivery monotonicity: `messenger-delivery-status.test.ts` + Phase 6 gate
- Mark-read vs newer summary: Phase 6 gate (stale preview cannot regress)
- Access revocation purge: Phase 6 gate + `messenger-core-access-revoke.test.ts`
- Multi-page delta / invalid epoch / FULL fallback: `messenger-delta-recovery.test.ts`
- Active thread selective invalidation: Phase 6 reconnect test
- Room leave / reconnect join-only-B: `messenger-realtime-bind.test.ts`
- Worker delivery bridge reloads CLIENT row then emits to the conversation
  room: `messenger-delivery-status.bridge.test.ts` (`findUnique` then
  `emitCoreConversationMessage`; no `publishPersistedCoreMessage`)
- Missing-row summary **does** invalidate the zone summary root (intentional
  for unknown conversations; not a blind refetch of every event)

### Socket.IO multi-replica

`SocketIoCorsAdapter` is CORS-only. There is **no** Redis Socket.IO adapter.
Delivery is process-local to a single API process. Multi-replica fan-out is a
**prerequisite**, not deployed. Test:
`messenger-socket-io-process-local.test.ts`.

## 5. Outbound reliability / observability

Deterministic P4B suites remain the reliability evidence (races, UNKNOWN 24h,
malformed/cancelled, dispatch claim, mapping replay, window, skip/cancel).
Phase 6 adds:

- Queue payload keys are identity-only (`kind`, `chatId`, `accountId`,
  `messageId`, `conversationId`, `idempotencyKey`); no credentials or body.
- Redis enqueue failure after durable outbox is swallowed; HTTP is not
  blocked on a worker `process()`.
- Scheduler job `messenger-outbound-reconcile` `rosterIntent=off`; seed
  enabled only when `SCHEDULER_MESSENGER_OUTBOUND_RECONCILE_ENABLED=true`.
- Worker already logs attempt duration via `logBullmqJob`.

Existing `whatsapp.outbound-messages` worker is unchanged as the execution
path. Unrelated worker items stay deferred.

## 6. Phase 5 live-capable acceptance

Manual checklist: `34-Messenger-Phase6-Browser-Checklist.md`.

| Item | Status |
| --- | --- |
| Automated persist/query gate (Phase 5) | cited as prior verified work |
| Manual same-user reload / logout / IDB / two-tab / a11y | **NOT RUN** (no Playwright; no authenticated browser session in this pass) |
| Production `next build` | **PASS** (local `pnpm --filter @nbos/web build`, Next.js 16.2.11; no `SKIP_NEXT_TYPECHECK`) |

Persisted IndexedDB remains device-local sensitive data and is **not**
encrypted at rest (Phase 5 residual).

## 7. Rollout gates (explicit)

Order:

1. Apply additive revision/command migrations **before** new API/web that
   reads those tables.
2. Enable `MESSENGER_DELTA_RECOVERY_ENABLED` on a full instrumented API
   fleet after writers already bump revisions (writers always instrument).
3. Enable browser persistence (`NEXT_PUBLIC_MESSENGER_PERSISTENCE` not `0`)
   after delta (or accept FULL bootstrap recovery while delta is off).
4. Enable `SCHEDULER_MESSENGER_OUTBOUND_RECONCILE_ENABLED` only after
   migration + worker + API compatibility; keep
   `whatsapp.outbound-messages` consuming `core_client_send`.
5. Monitor UNKNOWN/PENDING age inside the Gateway 24h window.
6. Rollback: set the three flags off; stale IDB is ignored; scheduler
   roster stays off; no destructive cleanup.
7. Multi-API Socket.IO adapter is a **prerequisite**, not part of this
   phase. Do not deploy an adapter from this work.

Flags default-off (delta, scheduler) except persistence, which is on in web
unless set to `0`/`false`.

## 8. Residual / deferred

| Item | Status |
| --- | --- |
| Live `EXPLAIN` on isolated PostgreSQL | OPERATIONAL GATE |
| Composite list index `(zone, status, lastMessageAt, …)` | not added; needs EXPLAIN |
| Redis Socket.IO adapter | prerequisite; not deployed |
| Production load test / live provider send | out of scope |
| Unrelated WhatsApp worker hardening | deferred |
| Slice 11 destructive cleanup | not started |
| Independent `90-Messenger-Final-Acceptance.md` product ACCEPTED | NOT RUN (rebuild slices 0–10 VERIFIED; Slice 11 PLANNED) |
| Ledger Phase 6 status | not edited by implementer |

## 9. Tests added or extended (this phase)

Web: UTF-8 helper; hook request-graph integration; unit request counts;
payload sizes; cardinality; realtime gate.
API: Prisma call-count helper (raw + `$transaction` separate); GET
query counts; unmocked Favorites bootstrap provisioning; GET no-provision;
SQL/index alignment; outbound observability; Socket.IO process-local.

A persist envelope max-size check now uses UTF-8 bytes.

## 10. Validation (P6-01–03 review iteration)

Not `VERIFIED PASS`. Independent master audit is still required.
Product rebuild ACCEPTED / Slice 11 remain **NOT RUN** / `PLANNED`.

| Check | Result |
| --- | --- |
| Phase 6 focused Vitest | **14 files / 51 tests PASS** |
| Web Messenger + Internal + Client Vitest | **46 files / 178 tests PASS** |
| API Messenger + scheduler Vitest | **118 files / 688 tests PASS**, **4 files / 11 skipped** |
| `@nbos/shared` tests + typecheck | **48 files / 326 tests PASS**; typecheck **PASS** |
| `@nbos/web typecheck` | **FAIL** ×2 then **PASS** (rest-spread `TS2556`; then `vi.mock` hoist of `forbidden`; factory now lazy-calls `forbidden(id)`) |
| `@nbos/api typecheck` | **6 diagnostics**, same unrelated baseline (`product-whatsapp-group.service.ts` ×3, `product-communication-legacy-write.ops.ts` ×2, `projects.service.ts` ×1). No new Phase 6 diagnostics. Heap 8GB. |
| ESLint changed Phase 6 paths | **PASS** |
| `git diff --check` (this iteration paths) | **PASS** |
| Production `next build` | **PASS** (local; Next.js 16.2.11; `SKIP_NEXT_TYPECHECK` unset; **not a production deploy**) |
| Prisma validate/generate | **NOT RUN** (schema / `prisma.config.ts` not touched) |
| Live isolated PostgreSQL `EXPLAIN` | **OPERATIONAL GATE** / **NOT RUN** |
| Live browser checklist / Playwright | **NOT RUN** |
| Live provider send / production migrate / deploy | **NOT RUN** |

No fabricated millisecond improvements. Mock Prisma counts are not production latency.
