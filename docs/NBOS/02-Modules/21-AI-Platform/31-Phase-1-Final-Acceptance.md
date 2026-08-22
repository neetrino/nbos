# Phase 1 Final Acceptance — Chat 12

> Acceptance report, not an implementation handoff. Handoffs 26–30 and every existing `[x]` were
> treated as claims to verify, never as evidence. Where this chat could not reproduce a claim
> first-hand it is written down as such.

## Milestone

Chat 12 of [`16-Phase-1-Execution-Strategy.md`](16-Phase-1-Execution-Strategy.md), the only
milestone permitted to declare Phase 1 complete. Branch `sipan`, product HEAD at start `70c8fb9d`.
This chat did **not** commit.

It was a verification chat and made exactly one product-code change: the fix for the blocking defect
it found, on the developer's explicit decision. Nothing else in the repository was modified.

## Verdict

**PASS WITH OPERATIONAL CONDITIONS.**

Verification initially returned FAIL: this chat found a blocking product-code defect that no earlier
milestone had seen — concurrent `tasks.create` through the External Agent gateway returned HTTP 500.
On the developer's decision it was fixed in this chat and re-verified live, so the blocker is closed.
The record of the defect is kept below rather than rewritten out, because a final acceptance report
that hides how close the phase came to failing is not an honest one.

Standing after the fix:

- **718 checklist items across A–AQ verify.** The full suite, lint, typecheck, build, Prisma validate
  and migrate status are all green. AO passes 29/29 live over REST **and** MCP. AD–AI were re-walked
  first-hand, not inherited. Context and customer isolation were re-proven against adversarial inputs
  written in this chat rather than the repository's own fixtures.
- **All 11 exit criteria are met**, including criterion 9, which is what Chat 8 could not close.
- **One condition is not environment-bound: checklist item 209.** The developer accepted it as a
  documented fail-closed limitation carried into Phase 2 rather than closing it by weakening the
  idempotency guarantee. It stays `[~]` and must not be marked `[x]` until the shared-transaction or
  outbox work lands. This is a deliberate, recorded decision, not an oversight.
- Every other remaining `[~]` is genuinely environment-bound — see
  [Legitimate operational conditions](#legitimate-operational-conditions).

Phase 1 may be declared complete on the strength of this report, provided the item 209 decision is
read as part of it.

## Method

Six independent passes. No pass consisted of re-reading a previous chat's summary.

1. **Whole-repository verification** — `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`,
   `prisma validate`, `prisma migrate status`, plus the regression config, all run in this chat.
2. **Live acceptance** — AO and AP re-executed end to end against a freshly built API on dev Neon.
3. **First-hand AD–AI walk** — a new driver exercising the real admin HTTP surface, written for this
   chat.
4. **Adversarial isolation probes** — AE and AG attacked with inputs authored here, plus direct
   reproduction of the item 209 crash windows and of the live rate limiter.
5. **Structural review (AQ)** — architecture claims checked by reading the code paths they rest on.
6. **Browser walk** — employee login, all nine AI admin pages, and the Tasks/Drive regression, driven
   through a real browser session rather than by reading the components.

### An environment fault that invalidated an earlier run

The first AO/AP execution in this chat reported zero `ai_executions` rows. The cause was not product
code: `pnpm dev` serves the API from `apps/api/dist`, and that build predated the commit that
introduced execution recording. Every live result quoted below was produced **after** a full
`pnpm build` and a restart onto the fresh artifact. This is recorded because it is exactly the kind
of stale-runtime artifact that can otherwise be mistaken for a product gap in either direction.

## Blocking defect, found and fixed in this chat

### Concurrent Task creation returned HTTP 500

`TasksService.generateCode()` reads the highest existing `T-<year>-NNNN` code and then inserts,
outside any lock or transaction:

```572:584:apps/api/src/modules/tasks/tasks.service.ts
  private async generateCode(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `T-${year}-`;
    const rows = await this.prisma.task.findMany({
      where: { code: { startsWith: prefix } },
      select: { code: true },
    });
```

Two concurrent creates compute the same code and the second loses on the unique constraint.

**Reproduction (this chat, live, against the dev API).** One External Agent, granted
`workspaces.read` + `tasks.create` and one WORKSPACE scope, issuing six concurrent
`POST /api/v1/agent/workspaces/{id}/tasks` calls with six distinct idempotency keys:

```text
statuses: 201,500,500,500,500,500
500 body seen by the agent: {"error":{"code":"AGENT_INTERNAL_ERROR",
  "message":"An unexpected error occurred.","requestId":"944d6b7a-…"}}
leaks prisma/internals: false
```

A 26-request burst reproduced it again: 6 accepted, 2 correctly rate-limited, 18 × 500. The API log
shows `PrismaClientKnownRequestError … Unique constraint failed on the fields: (code)` raised from
`TasksService.create` via `AgentTaskWriteHandler.create`.

**Why this blocks Phase 1 rather than being deferrable.**

- It sits on exit criteria 1 and 2. Phase 1 exists so that _trusted external coding agents_ can
  create Tasks over REST and MCP. Such agents fan out by nature, and the platform's own ceiling
  (`AGENT_CONCURRENCY_LIMIT = 8`) explicitly permits eight in-flight invocations per agent. Six
  concurrent creates — comfortably inside that ceiling — fail five times out of six.
- It is not an environment or credential limitation, so it cannot be carried as `[~]` under the
  rules agreed in `27-Phase-1-Continuation-After-Chat-8.md`.
- It has real data consequences for a machine caller: the agent receives a generic
  `AGENT_INTERNAL_ERROR` and cannot tell whether its write landed.

**What is _not_ wrong.** The error boundary behaves correctly: the agent sees
`AGENT_INTERNAL_ERROR` with a request id and no Prisma text, table name or file path leaks. Nothing
about isolation, authorization or auditing is weakened by this defect.

**Provenance.** This is a pre-existing Tasks-module race (`git log -L` shows it predates the AI
Platform work and was last touched by `13b95362`, unrelated to Phase 1). The AI Platform did not
introduce it. Chats 1–11 never saw it because every acceptance driver so far created Tasks
sequentially. It is nonetheless a Phase 1 blocker, because the External Agent surface is the first
caller that makes it routine rather than theoretical.

**No AI Platform checklist item was falsified by this.** The defect is Tasks-owned, and no item in
A–AQ claims correctness of Task creation under concurrent invocation — U 327 defines the concurrency
_limit_, which works. The 718 `[x]` marks stand; what failed was a Phase 1 _exit criterion_ that
depends on a neighbouring module. No item was pushed down, and none was newly raised.

### The fix

The developer chose server-side allocation over a `P2002` retry loop. Migration
`20260823000000_entity_code_counters` adds one table and seeds it:

```sql
CREATE TABLE "entity_code_counters" (
  "scope"      TEXT         NOT NULL,
  "year"       INTEGER      NOT NULL,
  "next_value" INTEGER      NOT NULL,
  ...
  CONSTRAINT "entity_code_counters_pkey" PRIMARY KEY ("scope", "year")
);
```

A plain PostgreSQL `SEQUENCE` was not used, because the code series restarts each January and one
sequence per year would mean issuing DDL from application code every New Year. A `(scope, year)`
counter row gives the same server-side atomicity without runtime DDL, and the `scope` column means
the seven sibling modules carrying the same race (see C25) can adopt it without another migration.

`allocateEntityCodeNumber` reserves a number with a single statement, so PostgreSQL serializes
concurrent callers on the counter row rather than letting them compute the same value:

```28:44:apps/api/src/common/utils/entity-code-counter.ts
export async function allocateEntityCodeNumber(
  prisma: PrismaLike,
  scope: EntityCodeScope,
  year: number,
): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ next_value: number }>>(sql`
    INSERT INTO "entity_code_counters" ("scope", "year", "next_value", "updated_at")
    VALUES (${scope}, ${year}, 1, CURRENT_TIMESTAMP)
    ON CONFLICT ("scope", "year") DO UPDATE
      SET "next_value" = "entity_code_counters"."next_value" + 1,
```

`TasksService.generateCode` now allocates instead of scanning, which additionally removes a
full prefix scan of the tasks table from every single create.

**Migration safety.** Risk **LOW**. One new table plus a seed that reads `tasks`; no existing row is
rewritten, no column dropped, no index built on an existing table. The seed extracts the suffix and
compares it as an integer — lexicographically `T-2026-9999` sorts above `T-2026-10000`, which is the
defect that produced duplicate codes in the first place — and ignores non-conforming codes rather
than guessing at them. Rolling deploys are safe in both directions: old instances keep using the
read-then-insert path and never touch the new table, new instances allocate from a counter seeded at
or above every existing code. Applied to the **dev** database only; production was not touched and
`prisma migrate dev` was not used.

**Verification of the fix, live:**

- The seed matched reality exactly — `TASK/2024 → 40`, `TASK/2025 → 15`, `TASK/2026 → 331`, against
  actual maxima of 40, 15 and 331 across 386 tasks.
- The exact reproduction that returned `201,500,500,500,500,500` now returns
  `201,201,201,201,201,201`.
- At the `AGENT_CONCURRENCY_LIMIT` ceiling — 3 rounds of 8 concurrent creates — 24 of 24 succeeded,
  producing 24 distinct codes and zero server errors.
- New opt-in real-database regression `entity-code-counter.int.test.ts` allocates 40 numbers
  concurrently and asserts they form exactly `1..40`, plus that scopes and years stay independent.
- `nextTaskCodeNumericSuffix` became dead once allocation moved server-side and was removed with its
  tests; the create-path unit tests that mocked the old read were updated to the counter.

### Same race in seven sibling modules — reported, not fixed

While fixing this, the identical read-then-insert pattern turned up in Invoices, Support tickets,
Deals, Leads, Orders, Subscriptions, Projects and auto-tasks — most of them additionally ordering by
`code` as text, which is the lexicographic bug Tasks had already fixed. They are outside the Phase 1
External Agent surface and no machine actor drives them concurrently, so they were deliberately left
alone rather than turned into a drive-by refactor. Recorded as **C25**; each needs a scope entry, a
seed and a two-line service change, with no further migration to the shared table.

## Residual code-shaped partial: item 209

`209. [~] Preserve transaction boundaries.` — the domain commit and the idempotency `complete()`
are not one transaction. Chat 11 added a `responseJson` checkpoint to narrow the window. This chat
reproduced all three windows directly against `AgentIdempotencyService`:

| Scenario                                   | Observed behaviour                                                  |
| ------------------------------------------ | ------------------------------------------------------------------- |
| Crash after commit, after checkpoint       | Replays the stored result and self-heals the row to `COMPLETED`     |
| Crash after commit, before checkpoint      | `409 An identical request is already in progress` — permanently     |
| Same, after the TTL has fully elapsed      | Still `409`; the row survives, `status=IN_PROGRESS`, `expired=true` |
| Same key replayed with a different payload | `409 The idempotency key was reused with a different payload`       |

Chat 11's recovery path works as claimed. The residue is real and reproducible:
`loadLive` returns `IN_PROGRESS` rows _before_ it evaluates expiry, so an uncheckpointed reservation
is never reclaimed and that operation key is permanently unusable for that agent.

This behaviour is **fail-closed and correct in the safety dimension** — no duplicate domain write is
possible, and reclaiming the row automatically would trade that safety for liveness. The honest
resolution is a shared transaction or an outbox across the Tasks/Drive boundary, which Phase 1 canon
does not require.

**Developer decision, taken in this chat: accept it** as a documented fail-closed limitation carried
into Phase 2, rather than close it by weakening the idempotency guarantee. Item 209 therefore stays
`[~]` and must not be marked `[x]` until the shared-transaction or outbox work lands. The observable
cost is bounded: after a process crash inside a single-statement window, one operation key becomes
unusable for one agent. No data is lost and none is duplicated.

This is the one condition in this report that is **not** environment-bound. It is listed separately
from the operational conditions for exactly that reason.

## Legitimate operational conditions

These meet the `27-Phase-1-Continuation-After-Chat-8.md` bar: implementation is complete, and only
the _evidence_ is blocked by something outside the repository.

| Item             | Condition                                                                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AP 689–691       | No Anthropic key was supplied. The adapter, secret storage and sync rules are unit-covered; the live path was not exercised. No key was invented.                                    |
| AP 697           | Cross-provider `PRIMARY_FALLBACK` is accepted by the rule layer and unit-tested; live proof needs a second real provider credential.                                                 |
| AM 638           | `20260821150000_audit_actor_aware` backfills `audit_logs` and builds two non-`CONCURRENTLY` indexes. Needs a developer-controlled production window. Not applied to production here. |
| Worker TLS Redis | Verified on plain local Redis. No `rediss://` production-like endpoint was available.                                                                                                |
| AL 626           | Revalidation of a _queued_ sensitive action. Phase 1 executes every capability inline, so no queued lifecycle point exists to exercise. Structural, not missing code.                |

## What verified cleanly

### Whole-repository checks

All re-run after the fix.

| Check                   | Result                                                                    |
| ----------------------- | ------------------------------------------------------------------------- |
| `pnpm test`             | **869 files, 4411 tests, all passed** — with the opt-in real-DB suites on |
| `pnpm test:regression`  | 22 files, 284 tests, all passed                                           |
| `pnpm lint`             | Clean                                                                     |
| `pnpm typecheck`        | Clean                                                                     |
| `pnpm build`            | Clean — 1861 API files, web build complete                                |
| `prisma validate`       | Schemas valid                                                             |
| `prisma migrate status` | 217 migrations, database up to date, no drift, nothing pending            |

Before the fix the baseline was 865 files / 4404 tests with 3 files and 6 tests skipped. Those three
opt-in suites — agent credential rotation-versus-revoke concurrency, the AI platform persistence
smoke (issue → authenticate → grant → scope), and scheduler lease fencing — were all executed against
the dev database in this chat, which is what lifts E 108 and F 119/126 out of "asserted but never
run". The new counter regression brings the total to 869 / 4411.

**One flake, recorded honestly.** An intermediate run showed two timeouts in
`agent-abuse-controls.http.int.test.ts`. That test loops `AGENT_REQUEST_LIMIT_PER_WINDOW` (600) HTTP
calls against Vitest's 5s default timeout; running it in parallel with the opt-in suites hammering a
remote Neon instance pushed it over. It passes in isolation in 2.8s and passed in the clean full
run. This is test-infrastructure sensitivity, not a product defect — but the test carries no explicit
timeout for a 600-iteration loop, which is worth tightening at some point.

### AO — External Agent live acceptance (re-run)

29 items, **29 passed, 0 failed, 0 partial**, over REST and MCP against the freshly built API.
Includes the negative cases that matter: cross-workspace reads refused, forbidden-field updates
refused both before and after the `tasks.update` grant (so the refusal is the allowlist, not the
grant), Task delete absent from the 14 published MCP tools and refused when called by name.

### AP — provider / model / Internal Agent live acceptance (re-run)

22 items, **18 passed, 0 failed, 4 partial** — all four partials are the Anthropic-key items above.
The OpenAI connection validated a real key and rejected a bogus one _before_ storing anything;
the create response carries no fragment of the submitted key.

### AD–AI — first-hand walk

Ten checks over the real admin HTTP surface, all passing. The ones worth quoting:

- **AD 472–478** — `DRAFT → TESTING → PUBLISHED → RETIRED` holds; publishing v2 retired v1 and left
  exactly one `PUBLISHED` version. Rollback published a _new_ version id carrying v1's
  `contentDigest` instead of mutating history; the original row still exists.
- **AD 479–480** — 6 audit rows for the policy contain `contentDigest` and no layer text.
- **AF 503–513** — an unauthenticated approve returned 401 and an External Agent token 401, so no
  machine actor can decide an approval; the employee decision recorded `decidedByEmployeeId`; a
  second approve returned 400, so the decision is one-time.
- **AF 502/509/510** — the stored payload digest is canonical and key-order independent; a
  materially changed payload hashes differently, which is what `assertApprovedCommit` compares.
- **AF 501 / AG 529** — `assertApprovalPayload` refused a payload carrying `apiKey` with
  `SECRET_FORBIDDEN` before any row was written, and `buildSafeApprovalSummary` redacted it.
- **AI 555–557** — a 0.99 `MODEL_BASED` evaluation left the model `DISCOVERED`. A top score does not
  activate anything; `evaluationStatus` stays admin-owned.

### AE / AG — adversarial isolation, inputs written in this chat

Seven probes, all passing. Written against the exported functions with attack inputs chosen here, so
a pass is independent of the repository's own fixtures.

- An `ALLOW` issued to `agent-alpha` and replayed by `agent-bravo` → `AUTHORIZATION_DENIED`. A
  still-pending `REQUIRE_APPROVAL` → `AUTHORIZATION_REQUIRED`. No fragment is produced in either.
- Of five sources offered under a `tasks.read` / one-workspace `ALLOW`, only the in-scope one
  survived. A source claiming a different capability, one in another workspace, one with no declared
  scope, and an `ORGANIZATION`-scoped source under a workspace grant were all omitted `UNAUTHORIZED`.
  Missing scope narrows; it never widens.
- A `SECRET`-classified source, an `INTERNAL` source carrying an `apiKey`, and a nested `password`
  were all omitted `SECRET`; a `CONFIDENTIAL` source above the ceiling was omitted `CLASSIFICATION`.
  Neither secret literal appeared anywhere in the assembled result.
- `TASK` content is marked `UNTRUSTED_CONTENT` while `AGENT_CONFIG` is `TRUSTED_CONFIG`, so task
  text cannot be read as instruction. Every accepted fragment carries actor, capability, citation
  and `retrievedAt`.
- Persistent memory reports `isEnabled=false`, reads back zero records, and refuses a secret-bearing
  payload with `SECRET_FORBIDDEN` **even when explicitly enabled**.
- Customer isolation denies every mismatch by default: guessed conversation →
  `CONVERSATION_MISMATCH`, other customer → `CUSTOMER_MISMATCH`, dropped organization id →
  `ORGANIZATION_MISMATCH` (it narrows, not widens), channel swap → `CHANNEL_MISMATCH`, missing
  customer → `SCOPE_INCOMPLETE`.
- Holding `messenger.reply_draft` does not confer `messenger.reply_send`. Sending is `DENY` in
  `DRAFT_ONLY`, `REQUIRE_APPROVAL` in `APPROVAL_REQUIRED`, and `REQUIRE_APPROVAL` under
  `AUTO_SEND_ALLOWED` with an empty allowlist — an empty allowlist auto-sends nothing. Escalation to
  a human is always available.

### Prompt authorization boundary

Verified structurally, because this is a claim about absence and absence cannot be proven by a
passing test alone. `AiPolicyRequest` declares no field for prompt content. Searching
`policy-evaluator.ts`, `capability-registry.ts`, `agent-scope.ts`, `authorization-binding.ts` and
`policy-decision.ts` for any prompt reference returns nothing, and the prompt services write to no
grant or scope table. A prompt cannot widen a capability because no authorization code path can read
one.

### Secrets

Nothing in the AI surface exposes a live secret.

| Surface                       | Result                                                                        |
| ----------------------------- | ----------------------------------------------------------------------------- |
| API / worker / scheduler logs | The 164-character OpenAI key appears in none; no long `sk-` literal anywhere  |
| Driver logs (AO / AP / AD–AI) | Clean                                                                         |
| 56 `AI_*` audit rows          | Clean                                                                         |
| 40 `ai_executions` rows       | Clean — the table has no prompt-like column at all                            |
| `ai_provider_connections`     | Stores `keyPrefix` only, 8 characters (`sk-…RLQA`)                            |
| `ai_provider_secrets`         | Versioned AES-256-GCM ciphertext (`v2:…`); does not contain the plaintext key |
| 8 agent credentials           | All `$argon2id$`; no plaintext token stored anywhere                          |
| Admin UI DOM and HTML         | No long `sk-` literal, no unmasked `apiKey`/`secret`/`token`/`credential`     |

### Browser walk

Employee login, then all nine AI admin pages. Every one rendered, with no console error and no
failed network request.

| Page                         | Rendered | Data                                                                            |
| ---------------------------- | -------- | ------------------------------------------------------------------------------- |
| `/ai-agents`                 | Yes      | 4 External Agents (0 active), 1 provider, 2 active model policies, activity     |
| `/ai-agents/external-agents` | Yes      | 4 agents, all `DISABLED`                                                        |
| `/ai-agents/internal-agents` | Yes      | 1 agent, `ACTIVE`                                                               |
| `/ai-agents/providers`       | Yes      | 1 connection, `ACTIVE`, key shown as `sk-…RLQA`                                 |
| `/ai-agents/models`          | Yes      | 3 models, all `DISCOVERED` — none auto-activated                                |
| `/ai-agents/policies`        | Yes      | 2 policies, `FIXED` and `PRIMARY_FALLBACK`, both `ACTIVE`                       |
| `/ai-agents/approvals`       | Yes      | Empty state — the queue was drained by the AD–AI walk's own cleanup             |
| `/ai-agents/usage`           | Yes      | Budgets plus recent executions (`workspaces.read`, `tasks.read`, `tasks.start`) |
| `/ai-agents/audit`           | Yes      | Prompt lifecycle actions from this chat's own AD walk                           |

**Secrets in the UI — pass.** The provider page shows `OPENAI · sk-…RLQA`, a four-character hint.
Searching the rendered DOM and the raw HTML for `sk-[A-Za-z0-9\-_]{40,}` and for unmasked `apiKey` /
`secret` / `token` / `credential` fields returned nothing. The agent identifiers on screen
(`nbos_agt_27d6074ec42b18d634_afb5`) are the public key ids, not the token secrets — which matches
the database probe, where every credential is stored as an `$argon2id$` hash.

**Human regression — pass.** `/tasks` rendered its board (39 open, 1 in progress, 9 on hold) and
`/drive` rendered 300 files across its groupings. The AI module did not disturb the app shell.

**One observation, non-blocking.** A React hydration warning appears on the `/` landing page. It does
not affect navigation or any AI page, and it is not AI Platform code. Recorded rather than chased,
because fixing unrelated web pages is outside a verification milestone.

### Architecture (AQ)

- **No parallel AI architecture.** Actor types come from the shared actor foundation; AI does not
  declare its own.
- **No domain-service bypass.** A search for direct Prisma writes to Task/Drive/workspace/user
  tables from anywhere in `ai-platform` returns nothing. The gateway handlers hold `TasksService`,
  `TaskDiscussionService` and `DriveTaskArtifactService` and nothing else.
- **Human RBAC unchanged.** Every one of the 13 `ai-admin` controllers carries the same
  `@RequirePermission(AI_ADMIN_PERMISSION_MODULE, AI_ADMIN_PERMISSION_ACTION)`. AI added no
  alternative authorization path.
- **Audit is shared.** AI writes through an `AuditService` wrapper into the same `audit_logs` table.

### Runtime and regression

- **Worker** boots clean under `PROCESS_ROLE=worker`.
- **Scheduler** boots under `PROCESS_ROLE=scheduler` and registers `ai-model-catalog-sync` alongside
  all 17 pre-existing crons, none displaced.
- **Process-role guard works.** Pointing the scheduler role at the API entrypoint was refused with
  `Entrypoint "api" cannot run with PROCESS_ROLE=scheduler`. That was a driver mistake in this chat,
  and the guard catching it is evidence in the platform's favour.
- **Rate limiting is Redis-backed and live.** The API logged
  `Agent rate limits backed by Redis` at boot, and a burst against the `WRITE_SENSITIVE` ceiling
  produced `429 AGENT_RATE_LIMITED` with `Retry-After: 47` and no scope leak in the body. This
  closes the Chat 8 "counters live in process memory" debt with live evidence rather than a claim.
- **Chat 8 UI debt closed.** `PolicyCandidateEditor` sets the FIXED primary and ordered
  `PRIMARY_FALLBACK` candidates and posts to `POST /model-policies/:id/candidates`, so AJ 584/585 are
  genuinely editable on screen.

## Exit criteria — honest status

| #   | Criterion                                                        | Status                                                                                 |
| --- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 1   | REST **and** MCP against authorized Work Spaces/Tasks            | **Met** — AO 29/29; concurrent creates verified after the fix                          |
| 2   | Task create/update separately grantable and constrained          | **Met** — 24/24 concurrent creates at the ceiling, all codes unique                    |
| 3   | Task delete and force-completion unavailable                     | **Met** — AO 670/675; absent from the 14 MCP tools and refused by name                 |
| 4   | Isolation and provenance proven by negative tests                | **Met** — AO negatives, the AE/AG adversarial probes, committed security suites        |
| 5   | Provider connections and catalogs managed centrally and securely | **Met for OpenAI**; Anthropic unproven live (no key)                                   |
| 6   | Discovered models never auto-activate                            | **Met** — a 0.99 evaluation left the model `DISCOVERED`                                |
| 7   | FIXED and PRIMARY_FALLBACK configurable, incl. cross-provider    | **Met in product**; cross-provider live proof needs a second credential                |
| 8   | Internal Agent foundation independent of provider/model choice   | **Met** — AP 698–703; `promptPolicyId` confers no capability or scope                  |
| 9   | Prompt / approval / customer-facing / usage foundations          | **Met** — AD–AI walked first-hand this chat; Chat 8's blocker is closed                |
| 10  | Human NBOS workflows intact                                      | **Met** — full suite, regression suite, RBAC/audit unchanged, Tasks/Drive browser walk |
| 11  | Extensible without a second identity/authorization system        | **Met** — shared actor foundation, shared audit, no bypass                             |

All eleven are met. Criterion 9 — the reason Chat 8 could not close Phase 1 — is now genuinely met,
and criteria 1 and 2 are met including under concurrency after the fix. Criteria 5 and 7 are met in
product; only their live cross-provider evidence waits on a second credential.

## Carried into Phase 2

1. **Item 209 / C24** — close the idempotency reservation window with a shared transaction or an
   outbox. Accepted as a documented limitation, not silently.
2. **C25** — adopt `entity_code_counters` in the seven sibling modules that still read-then-insert
   their codes. No further migration to the table is needed.
3. **Anthropic evidence** — one key closes AP 689–691 and AP 697.
4. **AM 638** — apply the actor-aware audit migration in an approved production window.
5. **Worker TLS Redis** — exercise a `rediss://` endpoint from the worker.

None of these requires new AI Platform architecture.

## Cleanup register delta

Applied to [`99-AI-Cleanup-Register.md`](99-AI-Cleanup-Register.md) in this chat:

- **C23 — concurrent Task creation returned HTTP 500.** New, found here, **FIXED** and re-verified
  live.
- **C24 — gateway idempotency slot is never reclaimed (checklist 209), PARTIAL.** New. Accepted by
  the developer as a documented fail-closed limitation for Phase 2.
- **C25 — the same read-then-insert race in seven sibling modules, OPEN.** New, reported not fixed.
- **C22** moved from BUSINESS DECISION / PARTIAL to **RESOLVED**: exit criterion 9 is met.
- **Rate-limit store** debt closed with live Redis evidence.
- **AJ 584/585** debt closed.
- **E 108 / F 119/126** now backed by real-database runs rather than skipped suites.

## Test data created on dev Neon (`ep-restless-tooth-agz3assx`)

This chat used the dev database only. No production database was touched, `prisma migrate dev` was
never used, no production migration was applied, and no provider key was invented.

Migration `20260823000000_entity_code_counters` was applied to **dev only**, with
`prisma migrate deploy`. Its seed was verified against the live data before anything relied on it.

Left in place for inspection: the AO/AP acceptance agents, workspace and Tasks; roughly fifty
`Chat12 …` probe Tasks from the rate-limit and concurrency bursts; one `Chat12 AD …` prompt policy;
the three seeded `TASK` counter rows, which are real production-shaped data rather than test
residue. Rate-limit and concurrency probe agents were revoked at the end of each run. Approval,
evaluation and budget probe rows were deleted by their own drivers.

Chat drivers and probes live in `apps/api/.chat12/` and are not product code.
