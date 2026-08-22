# Phase 1 Chat 11 Handoff — Usage/Cost/Evaluation Foundation

> Next chat must verify this evidence against the repository. Do not trust the summary blindly.
> This chat did **not** commit.

## Milestone

Chat 11 of `16-Phase-1-Execution-Strategy.md`. Branch `sipan`.

Completed: AI execution/usage/budget contracts (AH 532–548), Evaluation Suite/Run foundation
(AI 549–557), and actionable Chat 8 product-code debts that do not require production-only
credentials: Redis-backed rate-limit store, J 186 live `rateLimitExceeded` verdict, K 205 / W 368
output projection + MCP `outputSchema`, K 209 checkpoint/recovery (residual crash window remains),
AJ 584/585 Model Policy candidate editor, usage admin UI.

Independent Chat N11 first pass was **FAIL** (list envelope). After remediation, **Re-verification
(Chat N)** is **PASS WITH DEBTS**. Chat 12 may start as final re-acceptance. Phase 1 is **not**
complete.

Chat 10 independent verdict was **PASS WITH DEBTS**. Chat 11 proceeded from that after checking
runtime, not the handoff alone.

## Independent review of Chat 10 (this chat)

Product HEAD at start: `2919d5aa feat(ai): add approval request lifecycle and customer-facing safety contracts`.

Confirmed in repo: `AiApprovalRequest`, approvals admin HTTP/UI, customer-facing shared contracts,
Chat N10 **PASS WITH DEBTS**. Remaining Chat 10/8 environment debts were not fabricated here
(Anthropic live key, production `rediss://`, production audit-migration window, AL 626).

## DB safety

Configured `.env.local` hosts:

- `DATABASE_URL` pooler: `ep-restless-tooth-agz3assx` (not production)
- `DIRECT_URL`: `ep-restless-tooth-agz3assx` (not production)
- Not production `ep-sweet-dew-ag7259wn`
- Not designated Chat 8/5/7 Neon `ep-late-frost-ag5aixzw`

`prisma migrate dev` was **not** run. `migrate deploy` was **not** run. Production was **not**
contacted. Chat 11 migration is SQL-only in the repo.

## Checklist

### AH 532–548 — `[x]`

| Item    | Status | Evidence                                                                                              |
| ------- | ------ | ----------------------------------------------------------------------------------------------------- |
| 532     | `[x]`  | `AiExecution` + shared `AiExecutionRecord`                                                            |
| 533–538 | `[x]`  | Actor, External/Internal Agent, provider, model, Model Policy, capability/domain/channel, correlation |
| 539–542 | `[x]`  | Status, latency, retry, fallback reason/primary/fallback model ids                                    |
| 543–545 | `[x]`  | Token unit fields + provider/estimated cost + `pricingVersion` / `pricingEffectiveOn`                 |
| 546     | `[x]`  | `AiBudgetLimit` + `evaluateAiBudget` / `shouldHardStopAiBudget`                                       |
| 547     | `[x]`  | No prompt/completion/secret columns; `findExecutionRecordSafetyIssues`                                |
| 548     | `[x]`  | `execution-evaluation.test.ts`, `ai-execution.service.test.ts`, invoker record tests                  |

HARD_STOP is defined as blocking a **new** model invocation, never wrapping an in-flight
Tasks/Drive commit. External Agent still uses section U rate limits. Phase 1 has no Internal Agent
model-call loop, so live protocol rows typically leave provider/model/policy/cost null.

### AI 549–557 — `[x]`

| Item    | Status | Evidence                                                                                                           |
| ------- | ------ | ------------------------------------------------------------------------------------------------------------------ |
| 549–552 | `[x]`  | Suite / dataset (`identityKey`+version) / run with model or Model Policy + prompt version                          |
| 553     | `[x]`  | Aggregate quality/latency/cost/sampleCount on complete                                                             |
| 554     | `[x]`  | Exactly one `gradingKind` per run; suite lists allowed kinds                                                       |
| 555–556 | `[x]`  | Unchanged negatives; `evaluationScoreMayAutoActivateModel()` is `false`; complete does not update `AiModel.status` |
| 557     | `[x]`  | Admin-owned `AiModel.evaluationStatus`; sync does not set it                                                       |

### Actionable Chat 8 debts

| Item                             | Status  | Evidence                                                                                                |
| -------------------------------- | ------- | ------------------------------------------------------------------------------------------------------- |
| Redis rate-limit store / C9      | `[x]`   | `RedisAgentRateLimitStore` when `REDIS_STATE_URL`/`REDIS_URL` set; fail-closed; memory otherwise        |
| J 186                            | `[x]`   | Invoker calls `policy.evaluate({ rateLimitExceeded: true, target: {} })` then `AGENT_RATE_LIMITED`      |
| K 205 / W 368                    | `[x]`   | Projection keeps handler `{ items, meta }`; extra item fields stripped; MCP list tools advertise `meta` |
| K 209 / C8                       | `[~]`   | Checkpoint + replay of `IN_PROGRESS`+json. Residual: crash after domain commit before checkpoint        |
| AJ 584/585                       | `[x]`   | `PolicyCandidateEditor` replaces FIXED primary and ordered PRIMARY_FALLBACK candidates                  |
| Usage admin UI                   | `[x]`   | `/ai-agents/usage` lists executions + budgets                                                           |
| Browser E2E                      | open    | No Playwright/Cypress in the stack; not added                                                           |
| Anthropic live / AP 689–691, 697 | `[~]`   | No key supplied                                                                                         |
| Production `rediss://`           | open    | Not evidenced                                                                                           |
| AM 638 / C14                     | `[~]`   | Production audit-migration window                                                                       |
| AL 626                           | `[~]`   | No queued execution                                                                                     |
| C22                              | PARTIAL | Chat 12 only may declare Phase 1 complete                                                               |

No new `[!]` BUSINESS DECISION.

## Files / modules changed

New Prisma schema (additive):

| Area                        | Path                                                      |
| --------------------------- | --------------------------------------------------------- |
| Executions / budgets / eval | `packages/database/prisma/schema/ai-observability.prisma` |
| Model evaluation status     | `packages/database/prisma/schema/ai-providers.prisma`     |
| Employee relations          | `packages/database/prisma/schema/employees.prisma`        |

New under `apps/api/src/modules/ai-platform/`:

| Area             | Path                                                                                      |
| ---------------- | ----------------------------------------------------------------------------------------- |
| Usage            | `observability/ai-execution.service.ts`, mapper, tests                                    |
| Budgets          | `observability/ai-budget-limit.service.ts`                                                |
| Evaluation       | `evaluation/ai-evaluation.service.ts`, mapper, tests                                      |
| Admin HTTP       | `admin/ai-admin-usage.controller.ts`, `admin/ai-admin-evaluation.controller.ts`           |
| Rate-limit store | `limits/agent-rate-limit.store.ts`, memory/redis stores, factory, redis-keys, redis tests |
| MCP output       | `mcp/agent-mcp.output-schema.ts`                                                          |

Shared (`packages/shared/src/ai/`): execution/budget/evaluation types + lifecycle, capability output projection, tests.

Web: `PolicyCandidateEditor`, `PolicyModelSelect`, `UsagePanel`, model catalog evaluation-status select.

## Migrations

**One additive migration**, **not applied to production**, **not applied in this chat**.

- Directory: `packages/database/prisma/migrations/20260822220000_ai_usage_evaluation_foundation/`
- Risk: **LOW** — new enums + empty tables + `ai_models.evaluation_status` default `NOT_EVALUATED`.
  No backfill rewrite. Transactional indexes on empty tables.
- Chat 9/10 migrations are still pending on the configured host.
- `prisma validate` → schemas valid.
- `prisma generate` ran earlier in this chat (client present).
- `prisma migrate dev` was **not** run.
- Production Neon `ep-sweet-dew-ag7259wn` was **not** contacted.

History drift on `ep-restless-tooth-agz3assx` is unchanged: last common
`20260822010000_ai_provider_model_internal_agent`. Do not use `prisma migrate dev`. Apply Chat 9 then
10 then 11 to the **designated** non-production Neon with `prisma migrate deploy` over `DIRECT_URL`
after confirming the host.

## Tests run

```text
pnpm exec vitest run (Chat 11 slice + approval regression, after Decimal / mock-prisma / type fixes)
  execution-evaluation, execution/evaluation services, redis-store, invoker,
  idempotency, gateway, mcp tools, rate-limit guard, approval service
→ 10 files / 71 tests passed

Earlier same-chat slice including catalog/sync/policy/preauth/rate-limit service:
→ 14 files / 115 tests passed

pnpm --filter @nbos/shared typecheck → exit 0
NODE_OPTIONS='--max-old-space-size=8192' pnpm --filter @nbos/api typecheck → exit 0
NODE_OPTIONS='--max-old-space-size=8192' pnpm --filter @nbos/web typecheck → exit 0
eslint on Chat 11 TS/TSX files → exit 0
prisma validate → valid
```

An earlier broader `apps/api/src/modules/ai-platform` + shared/web AI-admin run was **121 passed /
2 skipped files, 866 passed / 4 skipped tests, 7 failed** — those 7 were Chat 10 approval tests
because `createMockPrisma()` briefly omitted `aiApprovalRequest`. Restored and the 7-file approval
service suite passed. The full AI-platform glob was **not** re-run after that restore.

Not run: full `pnpm test`, `pnpm lint`, turbo `pnpm typecheck`, production build, browser walk,
live AO/AP, `migrate deploy`, Anthropic live, production Redis TLS.

## Remaining `[~]` / `[!]`

| Item                     | Status  | Note                                                   |
| ------------------------ | ------- | ------------------------------------------------------ |
| K 209 / C8               | `[~]`   | Crash between domain commit and idempotency checkpoint |
| AL 626                   | `[~]`   | Queued revalidation — no deferred execution            |
| AM 638 / C14             | `[~]`   | Production audit-migration window                      |
| AP 689–691, 697 / C20    | `[~]`   | No Anthropic live key                                  |
| Worker / API `rediss://` | open    | Production TLS Redis not evidenced                     |
| Browser E2E              | open    | No E2E framework in the stack                          |
| Chat 9/10/11 migrations  | pending | Not applied to designated Neon or this drifted host    |
| C22                      | PARTIAL | Chat 12 final re-acceptance only                       |

Budget behaviors other than ALERT_ONLY / HARD_STOP are stored but not enacted. No evaluation
runner executes datasets. No dedicated Evaluation admin UI (HTTP foundation only).

## Architecture decisions

- One `AiExecution` table for capability invocations and future model calls. Opaque ids, no FKs, so
  history survives archive. Never prompt/completion/secret fields.
- Cost metadata lives on the execution row (`providerReportedCost` / `estimatedCost` + pricing
  version/date). No separate pricing catalog.
- Budgets are contracts + admin CRUD + pure evaluation. HARD_STOP is before a new model invocation.
- Evaluation run has exactly one grading kind. Scores never activate models.
- Rate-limit store is shared Redis when configured; fail closed; tests stay on memory.
- Output projection is catalog-field stripping at the gateway, not a second JSON-schema engine.
- Idempotency recovery writes `responseJson` before `COMPLETED` so a post-commit crash can replay.
  Wrapping Tasks/Drive + idempotency in one transaction was not done (module boundary).

## Security decisions

- Execution/metrics writes are best-effort and must not fail a successful domain commit.
- Pre-auth 429s are not recorded (write amplification). Authenticated capability-budget 429s are.
- Secrets/prompts are not execution columns; extra caller fields are dropped before persist.
- Admin usage/evaluation HTTP is employee JWT + `COMPANY:EDIT`, same as other `ai-admin` routes.
- Redis rate-limit errors deny rather than opening the namespace.

## Exact entry point for Chat 12

Chat 12 is **Final Phase 1 Re-Acceptance**. Report: `31-Phase-1-Final-Acceptance.md`.

It should primarily verify rather than invent architecture. Re-walk A–AQ, verify AD–AI first-hand,
re-run AO/AP with every real provider credential available, distinguish product-code completion from
production-only operational evidence. Do **not** declare Phase 1 complete unless no unresolved
product-code requirement remains.

## Verification (Chat N)

Current verdict after remediation: **PASS WITH DEBTS** — see **Re-verification (Chat N)** below. First pass remains on record as FAIL.

- Model/date: Cursor Grok 4.6, 2026-08-22.
- First-pass verdict: **FAIL**. Phase 1 is not complete. Chat 12 must not start until this FAIL is fixed and re-verified in this same verifier chat.
- Branch/HEAD: `sipan`, `2919d5aacf12a21f153033df721ed30fde044f98` (Chat 10 commit). Chat 11 remains **uncommitted** working tree; `git diff --check` exited 0. Tracking `origin/sipan`.

### Commands and actual results

```text
git branch --show-current → sipan
git rev-parse HEAD → 2919d5aacf12a21f153033df721ed30fde044f98
git diff --check HEAD → exit 0

pnpm exec vitest run (Chat 11 named slice + approval service)
  execution-evaluation, execution/evaluation services, redis-store, invoker,
  idempotency, gateway, mcp tools, rate-limit guard, approval service
→ 10 files / 71 tests passed, exit 0

pnpm exec vitest run (catalog/sync, rate-limit service, preauth, envelope,
  task-read/workspace handlers, admin authorization HTTP, approvals HTTP,
  model-catalog-groups)
→ 10 files / 70 tests passed, exit 0

pnpm exec vitest run apps/api/src/modules/ai-platform packages/shared/src/ai
→ 110 passed / 2 skipped files; 840 passed / 4 skipped tests, exit 0

pnpm --filter @nbos/shared typecheck → exit 0
NODE_OPTIONS='--max-old-space-size=8192' pnpm --filter @nbos/api typecheck → exit 0
NODE_OPTIONS='--max-old-space-size=8192' pnpm --filter @nbos/web typecheck → exit 0
eslint on Chat 11 TS/TSX files → exit 0
pnpm exec prisma validate --config prisma.config.ts → schemas valid, exit 0
pnpm exec prisma migrate status --config prisma.config.ts → exit 1 (expected drift)
  host ep-restless-tooth-agz3assx (not production ep-sweet-dew-ag7259wn)
  last common: 20260822010000_ai_provider_model_internal_agent
  pending locally: Chat 9 + Chat 10 + Chat 11 migrations
git diff --check → exit 0

First-hand list-envelope probe (tsx, handler shape → projectCapabilityOutput →
toAgentResponseBody) for tasks.list { items, meta }:
  projected = { items: [...] }          // meta dropped
  body      = { data: { items: [...] } } // not { data: [...], meta }
```

Production Neon was not contacted. `prisma migrate dev` / `migrate deploy` were not run.

### Discrepancies

- Handoff listed 10/71 for the named slice (matches) and an earlier 14/115 including catalog/sync/policy/preauth. Independently the catalog/sync/preauth/HTTP regression set was **10/70**. The full `ai-platform` + `packages/shared/src/ai` glob after mock-prisma restore is **110 passed / 2 skipped files, 840/4 tests**, not the unreproduced 121/866.
- Cleanup C19 was marked OK in the same executor chat, before this independent review. AH/AI entities exist; the milestone still FAILs because K 205 broke the live External Agent list contract.
- Strategy asks GPT-5.6 Sol High for this verifier seat. This review ran as Cursor Grok 4.6 (same family as the Chat 11 executor). Product evidence is from independently re-run commands and the uncommitted diff, not the executor handoff.
- `AgentProtocolInvoker` calls `policy.evaluate({ rateLimitExceeded: true, target: {} })` and **discards the decision**, then always throws `AGENT_RATE_LIMITED`. J 186 has a production caller; request/pre-auth ceilings still refuse at their guards, as the checklist runtime note says.
- K 205 tests use `{ items, page }`. Live handlers return `{ items, meta }`. The tests are green while REST/MCP list responses are not.

### Defects

Return this milestone to the executor. Do not treat AH/AI `[x]` as closed until the External Agent list contract is restored.

1. **List envelope regression (HIGH)** — `projectCapabilityOutput` keeps only `page` as a list envelope key. Domain handlers (`tasks.list`, `workspaces.read`, `tasks.read_links`, discussion/artifact lists) return `{ items, meta }`. After Chat 11 the gateway drops `meta`, so `toAgentResponseBody` emits `{ data: { items } }` instead of the `09` `{ data: items, meta }` contract.
   - File/path: `packages/shared/src/ai/capability-output.ts` (`AI_OUTPUT_ENVELOPE_FIELDS` / list branch).
   - Behavior: preserve `meta` (the key `toAgentResponseBody` actually reads). Keep stripping undeclared **item** fields. Do not rename the live envelope to `page`.
   - Test: replace the `{ items, page }` case in `packages/shared/src/ai/execution-evaluation.test.ts` with the real handler shape `{ items, meta }`. Add a gateway test in `apps/api/src/modules/ai-platform/gateway/agent-capability.gateway.test.ts` that `tasks.list` (or `workspaces.read`) keeps `meta` and still drops extra item fields. Compose projection → `toAgentResponseBody` and assert `{ data: [...], meta }`.
2. **MCP output schema does not match the live envelope** — `buildOutputSchema` always advertises `items`/`page` on every capability tool and never `meta`.
   - File/path: `apps/api/src/modules/ai-platform/mcp/agent-mcp.output-schema.ts`.
   - Behavior: describe the actual `09` list envelope (`meta`), and do not advertise list envelope fields on non-list tools.
   - Test: `apps/api/src/modules/ai-platform/mcp/agent-mcp.tools.test.ts` must assert `meta` for list tools and must not require `page` as the pagination key.
3. **K 205 `[x]` is an overclaim until 1–2 are green.** Keep the checklist marker `[~]` (or leave it unchecked in the fix) until the restored list contract has a failing-then-passing test. W 368 `[x]` is only honest after the MCP schema matches REST.

Confirmed non-issues in this scope (do not “fix” these as part of the FAIL):

- AH/AI tables, shared contracts, admin CRUD, budget evaluate/HARD_STOP **definition**, evaluation grading-kind split, and `evaluationScoreMayAutoActivateModel() === false` exist. Sync `createMany`/`update` paths do not write `evaluationStatus`.
- Execution/evaluation/budget services write only their own tables. Gateway still routes Tasks/Drive through module handlers. No new direct domain Prisma writes.
- Admin usage/evaluation controllers use employee JWT + `COMPANY:EDIT` (`RequirePermission`), not `AgentAuthGuard`. Existing admin HTTP tests still refuse an agent token on `/ai-admin/overview` with 401.
- Redis store fail-closes on errors; Vitest stays on memory unless `AI_RATE_LIMIT_REDIS_IN_TEST=1`.
- Migration is additive (new enums + empty tables + `ai_models.evaluation_status` default `NOT_EVALUATED`). Backward compatible with undeployed Chat 9/10/11 schema. Risk LOW. Not applied.
- Secrets/prompts are not execution columns; extra caller fields are dropped before persist.
- K 209 remains honestly `[~]`. AJ 584/585 editor calls `replacePolicyCandidates` for FIXED primary and ordered PRIMARY_FALLBACK candidates.

### Remaining debts

- Apply Chat 9 then Chat 10 then Chat 11 migrations to the designated non-production Neon with `prisma migrate deploy` over `DIRECT_URL` after confirming the host. Do not use `prisma migrate dev`.
- K 209 / C8 residual crash window after domain commit and before checkpoint.
- Live External Agent `AiExecution` rows typically leave provider/model/policy/token/cost null (no Internal Agent model-call loop). Schema/service persist those fields; protocol does not fill them yet.
- Budget behaviors other than ALERT_ONLY / HARD_STOP are stored and not enacted. `shouldHardStopAiBudget` is not on the capability path (correct: no in-flight Tasks/Drive wrap).
- No evaluation runner. No evaluation admin UI (HTTP foundation only). No usage/evaluation rows in `ai-admin.http.harness.ts` / HTTP int tests.
- Chat 10 grant-surface debt: `messenger.reply_*` can still be granted; REST/MCP still have no send handler.
- Anthropic live / AP 689–691, 697; production `rediss://`; AM 638 / C14 production audit-migration window; AL 626 queued revalidation; browser E2E; C22 / Chat 12 only.

### Not verified and why

- Full root `pnpm test` / `pnpm lint` / turbo `pnpm typecheck` / production builds — targeted package checks plus the ai-platform glob were sufficient to prove the FAIL.
- Browser walk of `/ai-agents/usage` and Model Policy candidate editor — no E2E in the current stack.
- Live AO/AP External Agent/provider acceptance — not re-run; the list-envelope defect is visible from unit composition without a live token.
- `GET/POST /api/ai-admin/usage/*` and `/api/ai-admin/evaluation/*` specifically — existing HTTP tests cover the admin namespace pattern, not these new paths.
- Designated Neon `ep-late-frost-ag5aixzw` and production `ep-sweet-dew-ag7259wn` — not contacted; status was read from the configured non-designated host only.

## Remediation (executor, after FAIL)

List envelope restored. Verifier Chat N must re-check; this section does **not** close the FAIL.

1. `projectCapabilityOutput` keeps handler `{ items, meta }` and still strips extra **item** fields. A top-level `page` key is not promoted to `meta`.
2. Shared + gateway tests use the live `{ items, meta }` shape and assert `toAgentResponseBody` → `{ data: [...], meta }`.
3. MCP `outputSchema` advertises `meta` (not `page`) only on `workspaces.list`, `tasks.list`, `tasks.discussion`.

```text
pnpm exec vitest run
  packages/shared/src/ai/execution-evaluation.test.ts
  apps/api/.../gateway/agent-capability.gateway.test.ts
  apps/api/.../mcp/agent-mcp.tools.test.ts
  apps/api/.../protocol/agent-protocol.invoker.test.ts
  apps/api/.../protocol/agent-response.envelope.test.ts
→ 5 files / 56 tests passed
```

## Re-verification (Chat N)

- Model/date: Cursor Grok 4.6, 2026-08-22 (same verifier chat as the FAIL).
- Verdict: **PASS WITH DEBTS** for Chat 11 only. Phase 1 is not complete. Chat 12 may start as final re-acceptance.
- Branch/HEAD: `sipan`, `2919d5aacf12a21f153033df721ed30fde044f98`. Chat 11 remains **uncommitted**; `git diff --check` exited 0.

### Commands and actual results

```text
pnpm exec vitest run (FAIL remediation set)
  execution-evaluation, gateway, mcp tools, invoker, envelope
→ 5 files / 56 tests passed, exit 0

pnpm exec vitest run apps/api/src/modules/ai-platform packages/shared/src/ai
→ 110 passed / 2 skipped files; 843 passed / 4 skipped tests, exit 0
  (was 840/4 before remediation; +3 envelope tests)

pnpm --filter @nbos/shared typecheck → exit 0
git diff --check HEAD → exit 0

First-hand list-envelope probe after fix (tsx, handler { items, meta } →
projectCapabilityOutput → toAgentResponseBody):
  tasks.list projected keeps meta; extra item field `extra` stripped
  body = { data: [...], meta: { page, pageSize, total, totalPages } }
  workspaces.read same envelope
  top-level `page` without `meta` is not promoted (still not { data, meta })
```

Prisma validate/status, api/web typecheck, and eslint were not re-run this pass; the FAIL fix is projection/schema/tests only. Prior-pass results still stand: schemas valid; migrate status drift on `ep-restless-tooth-agz3assx`; api/web typecheck exit 0.

### Defects from FAIL — closed

1. List envelope: `projectCapabilityOutput` now keeps `meta`. Gateway test `keeps list meta so the 09 envelope stays { data, meta }` plus shared tests on `{ items, meta }` and “page is not the envelope”.
2. MCP `outputSchema`: `items`/`meta` only on `workspaces.list`, `tasks.list`, `tasks.discussion`; no `page` key. `artifacts.list` is a bare array (not `{ items, meta }`) and correctly omitted.
3. K 205 / W 368 `[x]` match the restored live contract.

No new FAIL list.

### Remaining debts

Unchanged from the first-pass remaining-debts list (migrations not applied, K 209 residual window, live execution provider/model/cost null, budget behaviors not enacted, no evaluation runner/UI, no usage/evaluation HTTP int tests, Chat 10 `messenger.reply_*` grant surface, Anthropic live / `rediss://` / audit-migration window / AL 626 / browser E2E / C22).

### Not verified and why

Same as first pass for live AO/AP, browser walk, new admin usage/evaluation HTTP paths, designated/production Neon, full root `pnpm test` / lint / turbo typecheck / production builds. This re-check targeted the FAIL files plus the ai-platform + shared AI glob.
