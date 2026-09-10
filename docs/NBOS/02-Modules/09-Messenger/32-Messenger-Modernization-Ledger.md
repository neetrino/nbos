# Messenger Modernization — Verified State and Decision Ledger

> Status: **execution evidence**.
>
> Product behavior remains governed by `00-Messenger-Master-Canon.md` and
> `08-Messenger-Decision-Register.md`. This ledger records verified runtime
> state and implementation-level architecture decisions for the modernization
> program; it does not amend product canon.

## Phase status

| Phase | Scope | Status |
| --- | --- | --- |
| 0 | Full current-state audit | `VERIFIED` |
| 1 | Shared frontend cache foundation | `VERIFIED` |
| 2 | Realtime inbox events, reducers and room security | `VERIFIED` |
| 3 | Bootstrap, list/query and Collections optimization | `VERIFIED` |
| 4 | Revision, delta sync and reconnect recovery | `VERIFIED` |
| 4B | Atomic external-send intent and independent reconciliation | `IMPLEMENTING` |
| 5 | Offline resilience and persistence policy | `PLANNED` |
| 6 | Final performance, security and regression hardening | `PLANNED` |

## Phase 0 — verified baseline

**Final status:** `VERIFIED`

**Repository baseline:** branch `Karo`, commit
`9f763df8614b56ba6d97b5ee7a9eb43b0dbf5463`.

**Preserved unrelated work:** `packages/database/prisma.config.ts` was already
modified before this program and is outside modernization scope.

Verified runtime facts:

- PostgreSQL-backed Messaging Core is canonical and serves separate Internal
  and Client product surfaces.
- Messenger web state is component-owned; the root TanStack Query client is
  available but Messenger does not use it.
- Internal/Client list refreshes serially couple Collections and Conversations,
  blank state on section changes and refetch whole lists after live events.
- Internal All and Tasks are fetched separately even though they can share one
  accessible summary dataset for ordinary navigation.
- Task Discussion and entity panels use canonical Core messages server-side but
  maintain separate frontend arrays.
- Per-conversation thread requests can complete out of order; Client A history
  can overwrite the displayed thread after navigation to Client B.
- Realtime has no inbox revision/delta recovery and only active joined rooms
  receive conversation message events.
- Socket subscription authorization does not apply the extra Task access check
  used by HTTP, and old conversation rooms accumulate until disconnect.
- Socket.IO delivery is process-local because no shared adapter is configured.
- `MessengerMessage` and `MessengerCommand` creation are not one atomic
  transaction.
- Existing `whatsapp.outbound-messages` BullMQ workers are the approved external
  execution path. Recovery is opportunistic; no independent MessengerCommand
  scheduler reconciliation exists.
- Targeted Messenger tests passed at audit time. Web typecheck passed. API
  typecheck retained five pre-existing Product WhatsApp/Projects errors and is
  not a green repository baseline.

## Architecture Decision Ledger

### MM-ADR-001 — Reuse the root TanStack Query client

Messenger server state uses the existing application `QueryClient`. No second
QueryClient, Redux store, Zustand server-state store, context cache or custom
event bus is introduced.

### MM-ADR-002 — Separate summary and thread cache identities

Internal summaries, Client summaries, Collections by zone and messages by
`conversationId` are separate canonical cache categories. Inbox bootstrap does
not cache complete message histories.

### MM-ADR-003 — Derive Internal All and Tasks locally

Ordinary All/Tasks navigation derives both views from one cached Internal All
summary dataset. Server-backed search/mentions and entity semantics remain
server-backed where the cached summary dataset cannot preserve behavior.

### MM-ADR-004 — Keep PostgreSQL authoritative

HTTP supplies bootstrap and recovery. Realtime and send responses patch the
client cache idempotently but never become durable truth.

### MM-ADR-005 — Share message cache ownership across surfaces

`/messenger`, Task Discussion and entity-chat panels use the same message query
identity once the canonical `conversationId` is known.

### MM-ADR-006 — Keep outbound execution out of navigation

The existing `whatsapp.outbound-messages` worker remains the external execution
path. Messenger navigation, list loading and thread reads never wait for a
worker.

### MM-ADR-007 — Defer reliability redesign to Phase 4B

Atomic Message + MessengerCommand persistence, independent scheduled recovery,
bounded `OUTCOME_UNKNOWN` handling and delivery-status realtime are reviewed as
one dedicated reliability phase, not mixed into frontend cache work.

### MM-ADR-008 — Phase-gated independent verification

An implementation phase advances only after repository diff inspection,
surrounding-code review, relevant tests, type/lint checks, security and
regression assessment produce `VERIFIED PASS`. Failed phases receive a bounded
fix task and repeat independent review.

## Phase 1 — confirmed contract

Objective:

- cached Messenger summaries and threads render immediately on re-entry;
- All ↔ Tasks does not blank or issue a conversation-list request;
- Collections and Conversations load independently;
- send results and duplicate realtime results patch cache idempotently;
- Task/entity/Messenger thread ownership converges by `conversationId`;
- out-of-order thread responses cannot cross the active conversation context;
- cached data remains visible during background refresh and errors;
- React Strict Mode remains enabled and touched subscriptions clean up.

Explicit exclusions:

- no bootstrap or delta endpoint;
- no revision/checkpoint or database migration;
- no worker, queue, scheduler or MessengerCommand redesign;
- no provider/Gateway contract change;
- no legacy cleanup or broad UI redesign.

Phase 1 uses named cache policy constants with a reviewed starting policy of
five-minute `staleTime` and one-hour `gcTime`. Phase 2 realtime work may later
justify changing those values with new evidence.

### Independent review — iteration 1

**Status:** `FAIL`

Verified positive evidence:

- Internal All → Tasks → All rendered the shared cached dataset in-browser
  without a Messenger API request.
- Internal search issued the conversation query without reissuing the
  Collections query.
- Targeted tests passed: 402 passed, 5 skipped.
- Web typecheck and focused lint passed.
- API typecheck retained the known six diagnostics across the same three
  pre-existing Product WhatsApp/Projects files; no Phase 1 file failed.
- No schema, migration, worker, queue, scheduler, Gateway or MessengerCommand
  file changed.

Blocking findings:

1. `upsertConversationSummary` inserts an opened/created conversation into
   every cached summary query under the zone root. This can pollute unrelated
   section, search, mentions, provider and attention-filter result sets.
2. duplicate realtime delivery deduplicates the thread but still applies
   another unread increment to inactive-conversation summaries.
3. Task Discussion seeds its paged result into the canonical message cache with
   `hasMoreOlder: false` even when the Task API reports older pages. The shared
   cache can therefore present a partial thread as complete.
4. keying the entire Messenger screen by section tears down and recreates token
   recovery and the Socket.IO session for every section navigation, and
   implicitly resets local session state. Section navigation must preserve the
   live session while still relocking Client external send safely.

Required correction:

- make summary upsert eligibility explicit and never add rows to arbitrary
  filtered/query-specific result sets;
- make realtime summary/unread reduction idempotent by message id;
- preserve truthful Task pagination completeness in the shared message cache;
- remove section-key screen remounting and test stable realtime-session
  ownership across All/Tasks navigation while retaining Client composer relock.

### Independent review — iteration 2

**Status:** `FAIL`

Closed from iteration 1:

- missing rows are no longer inserted into arbitrary filtered summary caches;
- realtime summary/unread effects are bounded and idempotent by message id;
- section-key remounting was removed and Client section changes relock/clear the
  external composer;
- Task pagination metadata is truthful when no message cache already exists.

Remaining blocking findings:

1. Task pagination merges always preserve existing `meta`. If a send creates a
   cache entry with `hasMoreOlder: false` before the Task list resolves, a later
   partial Task page with stronger `hasMoreOlder: true` evidence cannot correct
   it. Merge must preserve `true` from either source.
2. opened-conversation setters accept late detail responses unconditionally.
   In an A → B race, a late A detail overwrites B's opened overlay. B may then
   disappear when it is not already present in the current summary query.
3. Internal All → Tasks preserves any active/opened conversation, including a
   Group that is not a member of Tasks. Client section changes similarly retain
   an opened row without proving membership in the destination view. Preserve a
   selection only when destination membership is proven; otherwise clear
   selection/draft without remounting the realtime session.
4. Internal active summary datasets are server-filtered to `status: ACTIVE`,
   but local membership insertion checks only zone/type. Opening an archived
   conversation can therefore pollute active All/typed caches.

### Independent review — iteration 3

**Status:** `VERIFIED PASS`

Final evidence:

- summary insertion is constrained by zone, active status and provable section
  membership; unknown filtered sets are never polluted;
- duplicate realtime message ids cannot apply summary/unread effects twice;
- Task pagination combines existing and Task evidence without downgrading or
  hiding known older history;
- late detail responses commit only when their conversation remains active;
- Internal All/Tasks keeps only a proven Task selection when entering Tasks;
- Client section changes clear unprovable selection and relock/clear the
  external composer without remounting the screen or socket;
- browser verification confirmed cached All/Tasks rendering and independent
  search vs Collections requests;
- final targeted run: 426 passed, 5 skipped;
- web typecheck, focused ESLint, IDE diagnostics and `git diff --check` passed;
- API typecheck remains red only on the recorded six pre-existing diagnostics
  in Product WhatsApp/Projects integration files;
- no schema, migration, worker, queue, scheduler, Gateway, provider contract or
  MessengerCommand implementation changed.

Phase 1 is closed. Its cache keys and reducer contracts are the baseline for
Phase 2 realtime work.

## Phase 2 — confirmed contract

Objective:

- authorized users receive recipient-scoped conversation-summary events even
  when a conversation thread is not currently joined;
- realtime payloads carry absolute server-derived summary/read values rather
  than client-side unread increments;
- one idempotent reducer updates relevant cached summaries and active threads;
- reconnect performs bounded HTTP revalidation so missed events cannot leave
  the session indefinitely stale;
- switching conversations leaves the previous room;
- Socket.IO subscription authorization exactly matches HTTP Core access,
  including Task-specific access;
- revoked/changed access cannot be widened through new room subscriptions;
- Internal and Client event routing remains strictly separated.

Explicit exclusions:

- no revision/checkpoint or delta-sync schema/endpoint (Phase 4);
- no Redis Socket.IO adapter deployment (scale prerequisite remains recorded);
- no bootstrap/query optimization (Phase 3);
- no Message + MessengerCommand transaction or scheduler recovery (Phase 4B);
- no provider/Gateway contract redesign;
- no database migration unless an unavoidable, additive event-read contract
  cannot be implemented from existing data.

### Phase 2 independent review — iteration 1

**Status:** `FAIL`

Verified positive evidence:

- Socket subscribe now reuses the HTTP Core read resolver, including Task
  object access, and denied/malformed subscriptions do not join.
- explicit A → B leave/join exists and cannot leave the authenticated user
  room.
- recipient derivation is limited to deduplicated authenticated connected
  employees and batches employee access, participants, grants and read states;
- summary/read payloads use absolute values and web payload guards reject
  malformed data and cross-zone cache writes;
- reconnect distinguishes initial connect and revalidates summary/active-thread
  queries once.

Blocking findings:

1. recipient summary publication is wired only through
   `MessengerCoreService.persistAndBroadcast`. WhatsApp webhook and Meta inbound
   paths still emit only the joined conversation-room message event, so an
   accessible inactive Client conversation remains absent/stale in Inbox.
   Other direct Core message emit paths must be reconciled as well.
2. `persistAndBroadcast` awaits fanout ACL/read queries before broadcasting the
   thread event and returning the HTTP command. Realtime fanout is best-effort
   transport and must not add connected-recipient query latency to durable send
   completion.
3. participant/override revoke unconditionally evicts and emits
   `access_changed`, even when the employee still has READ through another
   participant/grant/RBAC basis. Conversely, the web access-changed reducer
   removes messages but only invalidates summaries; a failed refetch preserves
   stale revoked title/preview rows. Post-mutation access must be re-evaluated,
   and confirmed loss must immediately purge matching summaries/thread and
   clear active UI state.
4. summary fanout forces sender unread to `0`, but HTTP Internal/Client list
   mapping still derives unread solely from `lastMessageAt > lastReadAt`.
   Reconnect can therefore mark a sender's own latest message unread again.
   Absolute realtime and HTTP recovery must share the same sender-aware rule.

### Phase 2 independent review — iteration 2

**Status:** `FAIL`

Closed from iteration 1:

- Core send, WhatsApp inbound, Meta inbound and Core forward now use one
  persisted-message publish path;
- room delivery is immediate and summary fanout is best-effort/non-blocking;
- access revocation re-evaluates remaining READ bases before eviction;
- confirmed access loss immediately purges cached summaries/messages/entity and
  Collection data and clears active composer/session state;
- Internal/Client HTTP list mapping and realtime fanout share a sender-aware
  binary unread rule without extra per-row queries.

Remaining blocking finding:

1. summary/read reducers are not monotonic. Concurrent async fanout for messages
   M1 and M2 can complete M2 → M1, allowing M1 to overwrite M2's preview and
   ordering. A `markRead` event can similarly set unread to `0`, then a delayed
   summary derived from an older read state can set it back to `1`. Phase 2
   needs an in-session last-message ordering guard plus a read watermark; Phase
   4 remains responsible for durable revision/delta recovery across missed
   events and process restarts.

### Phase 2 final verification

**Final status:** `VERIFIED PASS`

Verified architecture and behavior:

- Socket subscription reuses the HTTP Core read resolver, including Task ACL,
  and explicit conversation leave prevents stale room accumulation;
- authenticated sockets join one employee-scoped room used for recipient-only
  summary, read and access-loss events;
- persisted Core sends, forwards, WhatsApp inbound and Meta inbound use one
  publish path: joined-room message delivery is immediate, while recipient
  summary derivation is best-effort and cannot block durable HTTP completion;
- recipient summaries batch connected-employee access inputs, apply effective
  Core READ, and carry absolute sender-aware unread plus the recipient read
  watermark;
- Internal/Client HTTP lists use the same sender-aware unread rule as realtime;
- access mutation re-evaluates all remaining READ bases before room eviction
  and `access_changed`; confirmed loss immediately purges matching web caches
  and active composer/session state;
- web summary reduction is monotonic by `lastMessageAt`; per-zone read
  watermarks prevent delayed summaries and older read events from restoring
  stale unread state;
- read watermarks are bounded to 256 conversations per zone on a per-QueryClient
  WeakMap, survive inactive-query garbage collection for the browser session,
  and are cleared on confirmed access loss;
- reconnect performs one bounded HTTP summary/active-thread revalidation;
- Internal/Client payload guards preserve zone isolation and reject malformed
  event data.

Independent final evidence:

- focused web realtime gate: 20 passed;
- focused API authorization/fanout/unread gate: 40 passed;
- web and shared TypeScript checks passed;
- focused IDE diagnostics and `git diff --check` passed;
- API TypeScript remained at the recorded six unrelated baseline diagnostics;
- no Prisma schema, provider transport, queue/worker or scheduler change.

### MM-ADR-009 — Recipient-scoped realtime summaries

Conversation-room events carry durable thread messages. Employee-room events
carry recipient-authorized absolute summary/read/access state so inactive inbox
rows update without exposing conversation data to unauthorized sockets.

### MM-ADR-010 — Reuse HTTP Core read authorization for sockets

Socket conversation subscribe and post-revoke re-evaluation use the same Core
read resolver as HTTP, including Task object access. Collection membership and
room history never grant conversation access.

### MM-ADR-011 — Keep realtime publication off the command critical path

After persistence, active-thread delivery is emitted immediately. Recipient
summary ACL/read derivation is logged best-effort work and cannot make a
successful durable command fail or wait on connected-recipient fanout.

### MM-ADR-012 — Bound Phase 2 monotonicity to the browser session

Absolute events reduce monotonically using message time and a bounded
per-QueryClient read watermark. This prevents ordinary in-session reordering;
Phase 4 still owns durable revisions, missed-event deltas and restart recovery.

## Phase 3 — confirmed contract

Objective:

- add one zone-specific inbox bootstrap boundary that returns independently
  useful summary and Collection startup data without message histories;
- remove redundant ordinary startup/list requests while preserving independent
  query-cache ownership and partial rendering;
- eliminate Collection item and Favorites seeding N+1 access/write loops with
  set-based, authorization-equivalent operations;
- move exact unread/needs-response filtering and bounded pagination truth into
  database queries so sparse matches are not silently omitted by fixed
  over-fetch multipliers;
- preserve Internal/Client zones, effective Core/Task ACL, list DTO semantics,
  sort order and cache identities;
- prove query-count bounds and no write side effect on ordinary read paths.

Explicit exclusions:

- no revision/checkpoint or delta endpoint (Phase 4);
- no message histories in bootstrap;
- no DB schema migration unless existing indexes cannot support the approved
  query plan and evidence justifies an additive index;
- no realtime event redesign, Redis adapter, worker/provider change or external
  send reliability work;
- no legacy cleanup or UI redesign.

### Phase 3 independent review — iteration 1

**Status:** `FAIL`

Verified positive evidence:

- zone bootstrap returns default summaries and Collections without histories
  and seeds the existing canonical TanStack Query identities;
- Strict Mode/in-flight deduplication prevents duplicate default startup
  requests;
- sparse unread/needs-response selection uses parameterized set-based SQL and
  stable conversation ordering instead of a fixed over-fetch multiplier;
- Collection detail intersects one ordered item-id query with existing
  set-based zone/Task ACL hydration;
- ordinary Collection list/detail GET paths no longer reconcile rows;
- no schema, worker, scheduler, provider or realtime contract was changed.

Blocking findings:

1. removing Favorites creation from Collection GET means a first-time employee
   receives no built-in Favorites Collection at startup, contrary to
   `M-COLLECTIONS-01`. First-star creation also does not refresh the already
   fresh Collections cache. Initialization/backfill must be explicit,
   idempotent, concurrency-safe and reflected in the bootstrap response while
   ordinary GET remains read-only.
2. Internal `unread` still derives from the cached first All page because it
   shares the `all-dataset` key. The exact SQL path is therefore not used by
   the product UI and unread conversations beyond that page remain omitted.
3. bootstrap failure is retained in a per-QueryClient error map. Standalone
   fallback queries can successfully repopulate both canonical caches, but the
   stale bootstrap error remains surfaced and cannot retry correctly after the
   data becomes stale again.
4. unread SQL uses denormalized `c.last_message_at` while sender/visibility
   comes from the latest visible non-deleted message. A later deleted message
   or HIDDEN Task note can therefore create false unread and diverge from the
   hydrated mapper.
5. post-SQL ACL hydration may remove the complete candidate page during a
   concurrent revoke. The result can report `hasMore: true` with no
   `nextCursor`, making truthful continuation impossible.
6. Collection item order uses only `createdAt DESC`; equal timestamps have no
   stable tie-breaker.

### Phase 3 independent review — iteration 2

**Status:** `FAIL`

Closed from iteration 1:

- bootstrap is now an explicit POST initialization command; a transaction and
  employee/zone advisory lock serialize Favorites ensure, and every bootstrap
  performs set-based idempotent settings backfill before returning Collections;
- favorite toggles invalidate the zone Collection list and Favorites detail;
- Internal unread All/Tasks now use distinct server-backed filtered queries;
- unread filtering/mapping uses the latest visible non-deleted message time;
- continuation metadata comes from the raw ordered candidate page even when
  defense-in-depth hydration removes rows;
- Collection items use `createdAt DESC, id DESC`.

Remaining blocking findings:

1. stale but present default cache data currently marks bootstrap `settled`.
   Standalone default summary and Collection hooks therefore refetch in parallel
   with bootstrap, recreating duplicate startup requests. If bootstrap fails,
   the same old cache data also suppresses the error before a successful
   fallback refresh is proven.
2. the raw SQL empty-list helper emits
   `IN (SELECT NULL::text WHERE FALSE)`. For UUID conversation IDs this requires
   PostgreSQL to compare `uuid = text` and fails for the common restricted-user
   case with participant access and zero explicit resource grants.

### Phase 3 final verification

**Final status:** `VERIFIED PASS`

Verified architecture and behavior:

- Internal and Client expose separate POST bootstrap initialization commands
  that return default summaries and zone Collections without message history;
- bootstrap seeds only the existing canonical TanStack summary/Collection keys;
  first entry and stale-cache entry suppress duplicate standalone default
  requests while cached stale rows remain renderable;
- bootstrap failure is surfaced, enables standalone fallback, clears only after
  both canonical keys refresh after the failure, and permits one later retry;
- employee/zone advisory locking serializes real Favorites Collection ensure;
  every explicit bootstrap set-backfills favorite settings before returning,
  while repeated Collection GET remains write-free;
- Internal unread All/Tasks and Client unread/needs-response use exact,
  parameterized server queries rather than fixed-factor over-fetch or partial
  local filtering;
- unread uses latest visible non-deleted message time and sender; HIDDEN Task
  notes do not create false unread;
- filtered pages use deterministic raw sort columns and raw continuation
  cursors, preserving forward progress if defense-in-depth ACL hydration removes
  candidates;
- empty grant lists render participant-only predicates, never UUID/text empty
  subquery comparisons;
- Collection detail uses one ordered item-id query plus existing set-based
  zone/Task ACL hydration, preserving `createdAt DESC, id DESC`;
- no Prisma schema/index, realtime, queue, worker, scheduler or provider
  contract changed.

Independent final evidence:

- focused bootstrap/list/Collection gate: 38 passed;
- focused SQL-shape/bootstrap-state follow-up: 11 passed;
- implementer full targeted Phase 1–3 run: 486 passed, 5 skipped;
- web and shared TypeScript checks passed;
- focused IDE diagnostics and `git diff --check` passed;
- API TypeScript retained only the recorded six unrelated baseline diagnostics.

Environmental limitation:

- test database URLs and an authenticated browser session were unavailable, so
  live PostgreSQL `EXPLAIN` and browser network request counts were not observed;
  no index was added without that evidence.

### MM-ADR-013 — Bootstrap seeds canonical cache identities

Zone bootstrap is a startup transport optimization, not a new state owner. Its
summary and Collection fields seed the same keys used by standalone REST
queries; message histories remain independently fetched by conversation ID.

### MM-ADR-014 — Favorites initialization is an explicit command

Ordinary Collection GET is read-only. The POST bootstrap command serializes
employee/zone Favorites ensure and performs set-based idempotent settings
backfill before returning startup Collections.

### MM-ADR-015 — Filter first, hydrate through canonical ACL

Sparse attention filters select a deterministic candidate page in parameterized
PostgreSQL, then hydrate through existing zone/Task ACL mapping as
defense-in-depth. Continuation derives from raw candidates so concurrent access
loss cannot trap pagination.

### MM-ADR-016 — Visible message time owns visible unread

Unread and needs-response semantics use the latest visible non-deleted message,
not a denormalized conversation timestamp that may refer to hidden or deleted
content.

## Phase 4 — confirmed contract

Objective:

- introduce an additive PostgreSQL-backed per-zone revision/checkpoint
  mechanism for Messenger inbox and read/access changes;
- return bootstrap data with a recovery checkpoint that cannot skip a
  concurrently committing mutation;
- expose separate authenticated Internal and Client delta endpoints that return
  only currently authorized current-state summaries plus explicit
  employee-scoped removals;
- coalesce revision state by conversation/employee rather than retain
  unbounded message bodies or a permanent duplicate event history;
- append/bump recovery state atomically with every covered durable mutation;
- reconnect from the last HTTP checkpoint, apply deltas idempotently, purge
  revoked rows, and invalidate only changed cached thread histories;
- fall back to canonical bootstrap/full revalidation when no checkpoint exists
  or recovery cannot be proven complete;
- preserve Phase 2 live events as low-latency transport; realtime receipt alone
  must not advance the durable recovery checkpoint.

Required consistency:

- revision allocation is ordered with transaction commit visibility; a
  sequence value alone is insufficient because PostgreSQL sequences do not
  order commits;
- bootstrap/delta checkpoint capture and state reads use a transaction protocol
  that cannot acknowledge an uncommitted lower revision;
- delta pagination uses the existing Messenger list page-size policy and stable
  revision/conversation ordering; no silent truncation;
- global conversation changes disclose data only after current effective Core
  READ/Task ACL filtering;
- access/read/favorite changes that are safe only for one employee use targeted
  revision rows; inaccessible global changes never reveal unknown conversation
  identifiers;
- revision payloads contain identifiers/change kinds only, never message
  bodies, provider secrets or copied history.

Schema/migration boundary:

- additive counter/coalesced revision tables and indexes only;
- no destructive or production migration;
- migration must be rolling-deploy compatible and require no historical
  backfill because bootstrap establishes the initial checkpoint/state;
- no retention TTL is introduced: coalesced rows are bounded by existing
  conversation and employee-conversation cardinality.

Explicit exclusions:

- no Message + MessengerCommand atomic external-send redesign or scheduler
  reconciliation (Phase 4B);
- no offline browser persistence/service worker policy (Phase 5);
- no Redis Socket.IO adapter deployment;
- no provider/Gateway, queue, worker or delivery-status redesign;
- no legacy cleanup or broad UI redesign.

### Phase 4 independent review — iteration 1

**Status:** `FAIL`

Verified positive evidence:

- migration is additive and coalesces identifiers/change kinds without message
  content or provider payload;
- bootstrap emits string checkpoints and separate Internal/Client delta
  endpoints apply current set-based ACL hydration;
- revision rows are written inside covered Core state transactions;
- web advances a session checkpoint only after draining every page and retains
  the prior checkpoint on partial failure;
- targeted removals are employee-scoped and inaccessible global rows disclose
  neither summary nor identifier.

Blocking findings:

1. counter writers and snapshot readers use `REPEATABLE READ`. Concurrent
   updates/locks of the same zone counter can raise PostgreSQL serialization
   failures rather than safely queueing, making normal concurrent same-zone
   sends and recovery unreliable.
2. delta SQL applies `DISTINCT ON (conversation_id)` ordered by newest revision.
   A global message after a targeted `ACCESS_REMOVED` shadows the removal; the
   now-inaccessible global row is then suppressed, so the offline employee
   receives no purge.
3. authorization epoch includes Task scope/departments but not the employee's
   actual accessible Task set. Task assignment/participation loss outside
   Messenger can leave a cached Task conversation after reconnect.
4. rolling deployment is not compatible as claimed. Old application instances
   can persist Core state without revision markers while new clients already
   trust bootstrap checkpoints/delta, creating an unobservable gap.
5. recovery fallback performs a successful bootstrap and then invalidates its
   freshly seeded summaries, issuing a redundant full list request. Delta also
   accepts a caller `after` above the live counter and web validation does not
   reject checkpoint regression or malformed zone summary/removal payloads.

### Phase 4 independent review — iteration 2

**Status:** `FAIL`

Iteration-1 findings were corrected: the counter protocol now uses
`READ COMMITTED`, targeted access removal survives later global changes, the
Internal epoch includes effective Task access, recovery has a default-off
two-stage activation flag, and fallback/boundary validation is stricter.

Remaining blocking findings:

1. effective Messenger access can disappear when a temporary
   `ResourceAccessGrant.expiresAt` passes without a database mutation.
   Authorization epochs do not include the caller's current active
   per-conversation grant set, so reconnect delta can retain a conversation
   after its override expires.
2. the legacy Channel/DM-to-Core mapper can create/update Core conversations
   and copy messages without a global revision marker. If it executes after
   DELTA activation, clients can advance across an unobservable checkpoint
   gap.

### Phase 4 independent review — iteration 3

**Status:** `FAIL`

Iteration-2 added zone-specific grant digests and revisioned newly mapped
Channel/DM conversations, but independent inspection found:

1. active grants are cached in a process-lifetime `Map` keyed by
   `employeeId:zone` under the Prisma singleton. Grant expiry, revocation and
   level changes are therefore never re-read after the first request, defeating
   the epoch and creating unbounded employee-key retention.
2. an existing Channel mapping still runs participant backfill while being
   treated as a no-op. When that backfill inserts participants it changes
   conversation visibility without a global revision.

### Phase 4 final gate

**Status:** `VERIFIED PASS`

Verified architecture state:

- additive coalesced PostgreSQL revisions are allocated by a per-zone
  `READ COMMITTED` counter barrier in the same transaction as covered state;
- bootstrap checkpoints activate only after an explicit default-off,
  mixed-version-safe deployment gate;
- Internal and Client deltas are zone-separated, ACL-hydrated and preserve
  targeted access removal even after newer global changes;
- authorization epochs cover current RBAC/departments, effective Task access
  and zone-specific active Messenger grants, including natural grant expiry;
- grant and Task ACL data is operation-scoped, never process-cached;
- web recovery validates all pages, advances only after a complete drain,
  purges revoked rows and falls back to bootstrap without blanking or a
  duplicate summary request;
- all executable Core conversation/message writers found by the final audit,
  including legacy mapping and participant backfill, are revisioned.

Independent checks:

- focused Phase 4 suite: `10 files / 59 tests` passed;
- web and shared TypeScript checks passed;
- Prisma schema validation passed;
- focused IDE diagnostics and `git diff --check` passed;
- API TypeScript remains at the same six unrelated recorded baseline
  diagnostics.

Residual operational gate:

- real PostgreSQL concurrent-writer/reader integration tests remain skipped
  because no approved isolated test database URL is available;
- production migration is not applied and
  `MESSENGER_DELTA_RECOVERY_ENABLED` remains disabled by default.

## Phase 4B — confirmed contract

Objective:

- atomically persist supported external Core Message, provider command and
  revision state;
- enqueue only after commit and recover durable commands independently through
  the dedicated scheduler;
- keep Message, command and provider-reference states monotonic and
  transactionally consistent;
- bound same-key `OUTCOME_UNKNOWN` recovery by the Gateway idempotency window;
- deliver worker status changes to API Socket rooms through a best-effort Redis
  event bridge while PostgreSQL remains truth.

### Phase 4B independent review — iteration 1

**Status:** `FAIL`

Verified positive evidence:

- Message, command, intent audit and revision are composed in one Core write
  transaction; queue offer happens after commit;
- the scheduler job is default-off, lease-managed and uses the existing
  one-minute/batch-50 policy;
- worker/API delivery transport carries identifiers and absolute status only,
  and API reloads authoritative CLIENT data before room emission;
- migration is additive and does not apply production DDL.

Blocking findings:

1. concurrent idempotency recovery catches a unique violation inside the same
   PostgreSQL transaction, which is already aborted. Command
   `findUnique -> create` has the same race.
2. the 24-hour Gateway idempotency window is measured from command creation,
   not the first possible provider submission. A long queue outage can expire a
   never-attempted send, while a late first attempt receives too little recovery
   time.
3. malformed/expired commands are terminalized without atomically moving their
   Message from `QUEUED`/`SENDING`, leaving contradictory durable/UI state.
4. a proven WhatsApp external reference can complete the command without
   advancing a `QUEUED`/`SENDING` Message to at least `SENT`; direct worker
   dispatch may submit again despite the proof.
5. completion/failure/unknown/invalid audits are written after their state
   transaction. Audit failure can commit outcome state without the required
   audit, and retry may never recreate it.
6. invalid-command updates are keyed only by idempotency key, without expected
   kind/message/conversation/open-status predicates, so stale or forged jobs can
   regress a completed command.

### Phase 4B independent review — iteration 2

**Status:** `FAIL`

Iteration-1 corrections added advisory serialization, `firstAttemptAt`,
canonical command predicates, paired invalid outcomes and transactional audits.
Remaining blockers:

1. first-attempt orchestration checks an open command, updates the Message, then
   ignores whether the command stamp matched. A concurrent terminal command can
   still allow a Gateway call.
2. legacy `SENT`/`DELIVERED`/`READ` without `firstAttemptAt` stamps the current
   time, extending rather than conservatively inferring the original provider
   idempotency window.
3. scheduler expiry invokes invalidation without its delivery publisher, so the
   scheduler-originated Message transition is not emitted despite publisher
   wiring.
4. invalid/failure paths mutate Message before winning/locking the canonical
   command transition. Concurrent completion can split durable Message and
   command outcomes.
5. no-op command upsert does not prove which caller created the row and can
   duplicate the intent audit outside the HTTP advisory-lock path.
6. Gateway acceptance uses `createMany(skipDuplicates)` and proceeds without
   proving that a uniqueness-conflicting provider reference belongs to the
   current Message.
7. an HTTP idempotency retry after mapping drift compares the immutable existing
   command payload with the new mapping and returns conflict rather than the
   original result.

### Phase 4B independent review — iteration 3

**Status:** `FAIL`

Iteration-2 corrections closed mapping-stable replay, creator-only intent
auditing, 64-bit advisory locking and provider-reference ownership validation.
Remaining blockers:

1. `nextReconcileAt` is treated as dispatch ownership, but terminal transitions
   do not predicate on that claim. A stale scheduler transition can win after
   claim commit and before Gateway HTTP while the worker still submits.
2. failure/invalid reducers transition command first; if Message CAS then loses
   to an ACK/stronger state, they return without rollback or deriving a
   compatible completion. Contradictory command and Message states can commit.
3. Gateway acceptance creates the provider reference before winning command
   transition ownership. A losing command CAS returns normally, so the
   transaction can commit a new proof row without reconciling Message/command.
4. proof-derived completion inside invalid/failure handling has no completion
   audit.
5. webhook ACK completion can move PENDING/UNKNOWN commands to COMPLETED without
   a transactional external-send completion audit.

### Phase 4B independent review — iteration 4

**Status:** `FAIL`

Dispatch tokens close the previously identified active-submit race, and outcome
auditing is now transactional. Remaining blockers:

1. worker reducers acquire command then Message, while ACK lifecycle updates
   Message then command. The inverted lock order permits a PostgreSQL deadlock.
2. Gateway provider-proof processing creates/checks the external reference
   before acquiring the command row, so proof paths do not share one canonical
   command-first lock order.
3. FAILED-command proof repair is implemented as a separate message-first path.
   If its command CAS loses after advancing Message, it can commit the Message
   change without delivery publication.
4. post-claim `skip` states, including a concurrent cancellation, retain a
   PENDING command. After lease expiry reconciliation continues to skip the row
   rather than reaching an audited compatible terminal state.

### Phase 4B independent review — iteration 5

**Status:** `FAIL`

The command-first lock order and cancellation convergence are corrected.
Remaining durable-integrity blockers:

1. proof authorization locks by command id/key/kind but does not verify the
   locked command's `resultMessageId` and `conversationId` against the resolved
   Message before completion/audit. A malformed canonical-key collision can
   complete the wrong command.
2. an existing provider reference proven to belong to the Message does not
   repair `Message=FAILED`; the reducer returns no-op and leaves command/Message
   failed. Provider acceptance must remain authoritative and independently
   repairable after crashes or an earlier incorrect failure transition.

### Phase 4B independent review — iteration 6

**Status:** `FAIL`

Locked proof identity and FAILED repair are corrected. Two pre-dispatch gaps
remain:

1. queue/worker command validation accepts any idempotency key that matches the
   job; it does not require `core-wa-send:{resultMessageId}` before Gateway HTTP.
   A malformed persisted command can therefore be submitted before the later
   proof reducer rejects it.
2. the worker's initial `prepare.kind === 'skip'` branch returns without
   terminalizing a PENDING command when Message is already CANCELLED/FAILED.
   With reconciliation rollout-disabled, convergence is not guaranteed.

### Phase 4B independent review — iteration 7

**Status:** `FAIL`

Pre-dispatch validation and initial terminal-state handling are present. One
corrupt-row convergence defect remains: the scheduler detects a malformed
canonical key, but its generic invalid reducer requires that same canonical key
to be valid. The transition is rejected, the `invalid` counter is incremented,
and the command remains PENDING for every later scan. Scheduler-owned malformed
commands require a command-only audited terminal transition that cannot mutate
the referenced Message.

### Phase 4B final gate

**Status:** `VERIFIED PASS`

Verified architecture state:

- supported external Core Message, MessengerCommand intent, intent audit and
  revision are committed atomically before queue offer;
- queue failure leaves PostgreSQL-owned PENDING work for the dedicated,
  default-off scheduler to rediscover through the existing outbound queue;
- a 60-second opaque dispatch lease is shorter than the 30-second Gateway
  timeout and prevents scheduler/worker outcome races without holding a
  transaction across HTTP;
- the 24-hour same-key uncertainty window starts at first provider attempt,
  with conservative `createdAt` inference for legacy attempted rows;
- all paired outcomes use command-first PostgreSQL row locking, exact canonical
  identity and one transactional Message/command/provider-ref/audit reducer;
- owned provider proof and ACK are authoritative, monotonic and can repair
  FAILED/UNKNOWN state while preserving CANCELLED Message state;
- malformed, cancelled and failed commands converge without provider calls,
  including command-only scheduler terminalization when Message identity is
  untrusted;
- delivery-status publication occurs after commit and PostgreSQL remains truth;
- existing `whatsapp.outbound-messages` remains the only execution queue and no
  new Messenger worker was introduced.

Independent checks:

- final focused adversarial gate: `5 files / 49 tests` passed;
- complete implementer regression evidence: `844 passed / 11 skipped`;
- Prisma validation/generation, web/shared typechecks, focused lint and
  `git diff --check` passed;
- API TypeScript remains at the same six unrelated recorded baseline
  diagnostics.

Residual operational gates:

- live PostgreSQL lock/isolation behavior remains environment-gated because no
  approved isolated test database URL is available;
- live Redis, Gateway HTTP and browser flows were not exercised;
- production migrations were not applied; scheduler and delta recovery remain
  default-off pending controlled rollout.

## Phase 5 — policy gate

**Status:** `CONFIRMED — IMPLEMENTATION PENDING`

Confirmed scope is browser persistence/prefetch/polish: versioned asynchronous
Messenger cache restoration, safe user/logout isolation, bootstrap/route or
next-page prefetch where evidence supports it, cold-load-only skeletons and
background authoritative recovery. Thread history, attachments, credentials
and mutation state must not be persisted by default.

Approved persistence policy:

- maximum persisted age: 24 hours;
- purge on logout or account/employee identity change;
- persist only versioned Messenger inbox summaries, collections and safe HTTP
  recovery checkpoints;
- do not persist thread messages, attachments, drafts, mutation state,
  credentials or provider payloads;
- restored data renders immediately but remains non-authoritative and must
  reconcile in the background.

### Phase 5 independent review — iteration 1

**Status:** `FAIL`

Positive evidence:

- persistence is client-only, native IndexedDB and versioned with the approved
  24-hour maximum age;
- thread histories, mutation state and non-Messenger query families are not
  selected for persistence;
- same-session QueryClient state remains authoritative and restored data feeds
  the existing bootstrap/delta path;
- no API, database, worker or realtime contract was changed.

Blocking findings:

1. multi-tab read/compare/write uses separate IndexedDB transactions and assigns
   `writtenAt` at commit. A delayed older capture can overwrite a newer
   envelope.
2. BroadcastChannel freshness is global rather than identity-scoped and accepts
   unvalidated version/future timestamps, allowing unrelated or skewed tabs to
   suppress writes.
3. envelope data validation accepts any object with summary `id`, or collection
   `id/name`; unknown nested fields are hydrated instead of being rejected or
   sanitized by an exact DTO allowlist.
4. centralized sign-out awaits IndexedDB clear before creating its dedupe
   promise and before NextAuth redirect. Concurrent calls can duplicate sign-out
   and blocked IndexedDB can delay logout.
5. hydration is marked pending only in a client effect and defaults false.
   Messenger queries can begin during the initial render/effect pass before
   restore has registered its gate.

### Phase 5 independent review — iteration 2

**Status:** `FAIL`

Atomic capture ordering, identity-scoped channel validation, strict DTO parsing,
non-blocking logout and initial hydration gating are corrected. Remaining
findings:

1. account identity changes are detected in passive effects. Before those
   effects purge/re-block the shared unscoped Messenger query keys, the next
   employee can render the previous employee's cached summaries.
2. the 16-query envelope cap sorts all search/filter/provider variants by
   recency. Those variants can crowd out canonical default summaries and
   collections, leaving no useful base inbox to restore.

### Phase 5 independent review — iteration 3

**Status:** `FAIL`

Cross-account render isolation and canonical four-key persistence are
corrected. One retention defect remains: snapshot capture includes canonical
records whose `dataUpdatedAt` already exceeds the approved 24-hour age. The
freshly written envelope then rejects itself on reload, and one old collection
record can discard otherwise fresh summaries.

### Phase 5 independent review — iteration 4

**Status:** `FAIL`

Record-level expiration is corrected. The non-persistable-identity fallback has
one cross-account race: A→B marks B ready without incrementing the persistence
generation or replacing the QueryClient hydration gate. A delayed hydration or
write from persisted identity A can therefore remain current and reapply data
after B's purge.

### Phase 5 final gate

**Status:** `VERIFIED PASS`

Verified architecture state:

- native IndexedDB persists only four strict canonical cache families:
  Internal default summaries, Client default summaries and both collection
  lists;
- envelopes use schema version 2, immutable capture time, a 24-hour maximum age
  and strict bounded DTO validation; expired records cannot invalidate fresh
  siblings or mint a new lifetime;
- atomic per-identity IndexedDB compare/write and identity-scoped validated
  BroadcastChannel hints prevent older tabs from replacing newer captures;
- thread messages, searches, filtered variants, attachments, drafts, mutation
  state, credentials and provider payloads are not persisted;
- initial hydration blocks Messenger queries only; restored summaries render
  before authoritative bootstrap/delta recovery;
- account changes withhold the application subtree until previous Messenger
  memory is purged and the new identity gate is installed, preventing a
  cross-account frame or fetch;
- every identity transition revokes prior hydration/write generations,
  including non-persistable identity and session-bypass paths;
- logout purges memory synchronously, deduplicates NextAuth sign-out and clears
  storage best-effort without delaying navigation;
- navigation prefetch is bounded to cold canonical bootstrap and reuses TanStack
  in-flight deduplication.

Independent checks:

- final persistence/query gate: `23 files / 96 tests` passed;
- web TypeScript passed;
- focused IDE diagnostics and `git diff --check` passed.

Residual operational evidence:

- production `next build` was not run in this gate;
- live browser IndexedDB quota/blocked-open and two-real-tab scheduling remain
  to be exercised in Phase 6;
- persisted data remains device-local sensitive data and is intentionally not
  represented as encrypted-at-rest.

## Phase 6 — confirmed contract

Objective:

- measure browser request count, cold bootstrap, cached navigation, payload and
  memory behavior with reproducible evidence;
- measure/verify backend query count and timing without speculative indexes;
- validate realtime/reconnect/listener cleanup and no-refetch invariants;
- validate outbound queue offer, reconciliation and delivery latency
  observability without changing its durable state machine;
- close final acceptance/documentation gaps and produce an evidence-based
  before/after engineering report;
- keep infrastructure, provider and unrelated worker hardening out of scope.

**Status:** `IMPLEMENTATION PENDING`

### Phase 6 independent review — iteration 1

**Status:** `FAIL`

The final evidence adds useful UTF-8, cardinality, realtime, outbound and static
index checks, and the production web build passed. Evidence blockers:

1. the cold-start request-count test calls `runMessengerBootstrap()` directly
   instead of mounting the real bootstrap + summaries + collections hook graph;
   it therefore cannot prove one request or Strict Mode deduplication.
2. bootstrap query-count tests mock out Favorites ensure even though the real
   endpoint always executes its advisory lock, collection lookup/create and
   backfill lookup. The reported three-read/zero-mutation endpoint cost is
   incomplete.
3. the final evidence document lists production build as both unavailable and
   PASS.

### Phase 6 final engineering gate

**Status:** `VERIFIED PASS`

Independent inspection confirms the iteration-1 evidence blockers are closed:

- jsdom integration mounts the production Internal and Client query-hook
  compositions and proves cold, Strict Mode, failure-fallback and stale-restore
  request graphs;
- bootstrap call counts now include unmocked Favorites provisioning and
  distinguish steady state (6), first initialization (7), and bounded legacy
  backfill (10), with transaction boundaries explicitly excluded from mock
  statement totals;
- UTF-8 envelope sizing, bounded cache/query cardinality, realtime selective
  invalidation, outbound queue observability and process-local Socket.IO limits
  are documented and covered by focused tests;
- final evidence consistently records the local production web build as PASS
  without representing it as a deployment.

Independent focused validation passed: 3 files / 10 tests, lint diagnostics
clean, and `git diff --check` clean.

Residual gates are explicit and do not invalidate this engineering phase:
live isolated PostgreSQL `EXPLAIN`, authenticated browser/two-tab acceptance,
and a multi-replica Socket.IO adapter remain operational prerequisites or
manual acceptance work. Slice 11 remains planned and the product-level
`90-Messenger-Final-Acceptance.md` verdict remains `NOT RUN`; Phase 6 does not
claim the Messenger rebuild is product-accepted or production-deployed.

## Verification protocol

For each phase:

1. implementation is delegated in a bounded task;
2. implementer claims are treated as unverified;
3. the master reviewer inspects repository state and full phase diff;
4. relevant behavior, security, query/DB, realtime and worker boundaries are
   checked independently;
5. tests and static checks are rerun first-hand;
6. status becomes `VERIFIED PASS`, `FAIL` or `BLOCKED`;
7. failures receive a precise fix task and repeat the same gate.
