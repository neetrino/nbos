# Phase 1 Chat 9 Handoff — Prompt Policy and Context/Memory/Knowledge Foundation

> Next chat must verify this evidence against the repository. Do not trust the summary blindly.
> This chat did **not** commit.

## Milestone

Chat 9 of `16-Phase-1-Execution-Strategy.md`. Branch `sipan`.

Completed: Prompt Policy / Prompt Version persistence and lifecycle (AD 470–481) and the
Context / session / persistent-memory / Knowledge contracts (AE 482–496). Internal Agents may
reference only a published Prompt Policy. Prompt text does not grant capabilities. Context
assembly requires an ALLOW decision and purpose-built projections.

This chat does **not** start Chat 10. Phase 1 is **not** complete. Production RAG, a vector store,
unrestricted persistent memory, employee AI chat and Messenger auto-reply were not built.

## Checklist

### AD 470–481 — `[x]`

| Item    | Status | Evidence                                                                                                                                           |
| ------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 470–471 | `[x]`  | `packages/database/prisma/schema/ai-prompts.prisma` — `AiPromptPolicy`, `AiPromptVersion`                                                          |
| 472–475 | `[x]`  | DRAFT / TESTING / PUBLISHED / RETIRED; only DRAFT is editable; one PUBLISHED per policy (partial unique index)                                     |
| 476     | `[x]`  | `InternalAiAgent.promptPolicyId` is a real FK; `requireAssignablePublished` on assign and activate                                                 |
| 477     | `[x]`  | `buildInternalAgentExecutionRecord` stores policy/version/digest, not instruction text                                                             |
| 478     | `[x]`  | `rollback` clones a previously published version (`predecessorVersionId`) and publishes the clone                                                  |
| 479     | `[x]`  | `PROMPT_POLICY_CREATED`, `PROMPT_VERSION_CREATED`, `PROMPT_VERSION_PUBLISHED`, `PROMPT_VERSION_ROLLED_BACK`; audit `changes` carry ids/digest only |
| 480     | `[x]`  | Prompt service never writes grant/scope tables; `AiPolicyRequest` has no prompt/content fields                                                     |
| 481     | `[x]`  | `prompt-version-lifecycle.test.ts`, `ai-prompt-policy.service.test.ts`                                                                             |

### AE 482–496 — `[x]`

| Item    | Status | Evidence                                                                                                                  |
| ------- | ------ | ------------------------------------------------------------------------------------------------------------------------- |
| 482–484 | `[x]`  | `assembleAuthorizedContext` — ALLOW required and bound to actor + matched scope; projections only; no Prisma domain load  |
| 485–486 | `[x]`  | Provenance (`sourceType/id`, `retrievedAt`, `accessBasis`, citation) and freshness (`stale` / `maxAgeMs`)                 |
| 487–489 | `[x]`  | Classification ceiling (request ∩ capability), SECRET / recursive secret-shaped omit, UNTRUSTED_CONTENT vs TRUSTED_CONFIG |
| 488     | `[x]`  | Named fragment/char budget; trusted config kept first; truncation recorded                                                |
| 490     | `[x]`  | `AiSessionContext` with `persistence: 'SESSION_ONLY'`                                                                     |
| 491–493 | `[x]`  | Disabled memory store; owner/scope/purpose/retention/provenance required; nested secrets rejected even when disabled      |
| 494–495 | `[x]`  | `retrieveKnowledgeDisabled` — no retrieve without a bound ALLOW (actor + capability + source scope + classification)      |
| 496     | `[x]`  | No embedding / pgvector / vector-store code                                                                               |

No new `[!]` BUSINESS DECISION. C22 remains open at phase level because AF–AI are still Chat 10–11.

## Files / modules changed

New Prisma schema (additive):

| Area                    | Path                                                        |
| ----------------------- | ----------------------------------------------------------- |
| Prompt Policy / Version | `packages/database/prisma/schema/ai-prompts.prisma`         |
| Internal Agent FK       | `packages/database/prisma/schema/ai-internal-agents.prisma` |
| Employee relations      | `packages/database/prisma/schema/employees.prisma`          |

New under `apps/api/src/modules/ai-platform/`:

| Area               | Path                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------- |
| Prompt domain      | `prompts/ai-prompt-policy.service.ts`, rules, mapper, lock, version writes                              |
| Admin HTTP         | `admin/ai-admin-prompt-policies.controller.ts`, `dto/create-prompt-policy.dto.ts`                       |
| Context wrappers   | `context/ai-context-assembler.service.ts`, `ai-persistent-memory.service.ts`, `ai-knowledge.service.ts` |
| Isolation test     | `security/prompt-context-isolation.security.test.ts`                                                    |
| Prompt Policy HTTP | `admin/ai-admin.prompt-policies.http.int.test.ts`                                                       |

Shared (`packages/shared/src/ai/`):

| Area                         | Path                                                                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Prompt                       | `prompt-policy-types.ts`, `prompt-layers.ts`, `prompt-version-lifecycle.ts`                                              |
| Context                      | `context-types.ts`, `context-classification.ts`, `context-budget.ts`, `context-assembler.ts`, `authorization-binding.ts` |
| Session / memory / knowledge | `session-context.ts`, `persistent-memory.ts`, `knowledge-source.ts`                                                      |

Modified: `InternalAgentService` (published-only assignment), `internal-agent-execution.ts`
(attribution record), `AiPlatformCoreModule` / `AiPlatformModule`, `ai-platform.constants.ts`,
`mock-prisma.ts`, Internal Agent detail helper copy.

## Migrations

**One additive migration**, **not applied to production**, **not applied in this chat**.

- Directory: `packages/database/prisma/migrations/20260822180000_ai_prompt_policy_context_foundation/`
- Risk: **LOW** — new empty tables/enums, nullable FK, indexes on empty tables. Existing
  `internal_ai_agents.prompt_policy_id` values that are not real policy ids are nulled before the FK
  (Chat 8 stored opaque free-form ids).
- `prisma validate` → schemas valid.
- `prisma migrate dev` was **not** run.
- Production Neon `ep-sweet-dew-ag7259wn` was **not** contacted.

`prisma migrate status` was run against the current `.env.local` host
`ep-restless-tooth-agz3assx`. That host is **neither** the designated Chat 8/5/7 Neon
(`ep-late-frost-ag5aixzw`) **nor** production. It already has migration-history drift
(extra/missing historical names). Deploy was **not** run there.

Chat 10 / the developer should apply this migration to the designated non-production Neon with
`prisma migrate deploy` over `DIRECT_URL` after confirming the host. Do not use `prisma migrate dev`.

## Tests run

```text
pnpm exec vitest run
  packages/shared/src/ai/prompt-layers.test.ts
  packages/shared/src/ai/prompt-version-lifecycle.test.ts
  packages/shared/src/ai/context-assembler.test.ts
  apps/api/src/modules/ai-platform/prompts/ai-prompt-policy.rules.test.ts
  apps/api/src/modules/ai-platform/prompts/ai-prompt-policy.service.test.ts
  apps/api/src/modules/ai-platform/internal-agents/internal-agent.service.test.ts
  apps/api/src/modules/ai-platform/internal-agents/internal-agent-execution.test.ts
  apps/api/src/modules/ai-platform/internal-agents/internal-agent-grant.service.test.ts
  apps/api/src/modules/ai-platform/context/ai-context-foundation.test.ts
  apps/api/src/modules/ai-platform/security/prompt-context-isolation.security.test.ts
  apps/api/src/modules/ai-platform/admin/dto/update-internal-agent.dto.test.ts
  apps/api/src/modules/ai-platform/policies/ai-model-policy.service.test.ts
→ 12 files / 50 tests passed

pnpm --filter @nbos/shared typecheck → exit 0
NODE_OPTIONS='--max-old-space-size=8192' pnpm --filter @nbos/api typecheck → exit 0
eslint on changed prompt/context/internal-agent files → exit 0
prisma validate → valid
```

Not run: full `pnpm test`, `pnpm lint`, `pnpm typecheck` (turbo), browser walk, live AO/AP,
production migrate.

## Remaining `[~]` / `[!]`

Unchanged from Chat 8 except C15/C16 now OK:

| Item                    | Status  | Note                                        |
| ----------------------- | ------- | ------------------------------------------- |
| AF 499–516 / D 91 / C17 | open    | Approval persistence — Chat 10              |
| AG 518–527, 531 / C18   | open    | Customer-facing modes — Chat 10             |
| AH / AI / C7 / C19      | open    | Usage/evaluation entities — Chat 11         |
| J 186 / U store / C9    | `[~]`   | In-process rate-limit counters              |
| K 205 / W 368           | `[~]`   | Output schema validation                    |
| K 209 / C8              | `[~]`   | Idempotency complete() vs domain commit     |
| AL 626                  | `[~]`   | Queued revalidation — no deferred execution |
| AJ 584/585              | `[~]`   | Model Policy candidate editor UI            |
| AM 638 / C14            | `[~]`   | Production audit-migration window           |
| AP 689–691, 697 / C20   | `[~]`   | No Anthropic live key                       |
| C22                     | PARTIAL | AD/AE closed; AF–AI remain Phase 1          |

No Prompt Policy Settings page was added. Employee admin HTTP exists at
`/api/ai-admin/prompt-policies`. The Internal Agent UI still takes a policy id and now fails if
that id is not a published policy.

## Security decisions

- Prompt layers are configuration, not authorization. Policy evaluator still accepts no content.
- Audit never stores full prompt text — only version identity and SHA-256 digest.
- Context assembly cannot run on DENY or REQUIRE_APPROVAL, or on an ALLOW replayed for another actor.
- Each context/knowledge source must be covered by the decision `matchedScope`; missing scope never widens.
- SECRET classification and secret-shaped field keys (`apiKey`, `token`, `password`, …) are walked
  recursively through objects and arrays; they never enter assembled context or memory writes.
- Knowledge retrieve has no unauthenticated entry point and cannot ignore source scope/classification.
- Persistent memory default is off; there is no memory table.

## Exact entry point for Chat 10

Read `29` is not written yet. Chat 10 executor prompt is in `ai-modul-steps.md`.

Primary checklist: **AF 497–517** and **AG 518–531**.

Canon: `13-AI-Risk-and-Approval-Policy.md`, `15-Customer-Facing-AI-Policy.md`, this handoff, and
the current policy/capability/audit runtime.

Do **not** implement production Messenger auto-reply. Do **not** declare Phase 1 complete.

Before writing Approval Request persistence, confirm the designated non-production Neon host and
apply `20260822180000_ai_prompt_policy_context_foundation` there if it is still pending.

## Verification (Chat N9)

- Model/date: GPT-5.6 Sol, 2026-08-22.
- Verdict: **FAIL**.
- Scope: branch/HEAD/worktree, complete Chat 9 diff, AD 470–481, AE 482–496, Prisma
  schema/migration/status, targeted and regression tests, typechecks, authorization/isolation,
  secret handling, module-service boundaries, migration safety, and out-of-scope subsystem checks.

### Commands and actual results

- `git status --short --branch`, `git rev-parse HEAD`, `git log --oneline --decorate -12`:
  branch `sipan`, HEAD `d764a68fd7a52db6b83e5aacbf59dd7bd34c4cc6`, equal to
  `origin/sipan`; Chat 9 is uncommitted.
- `git diff --stat`, `git diff --name-status`, `git diff --check`: 21 tracked files,
  333 insertions / 82 deletions, plus the untracked files shown by status; diff check exited 0.
  The tracked and untracked Chat 9 implementation files were reviewed, not only the handoff.
- Sanitized `.env.local` target inspection:
  `DATABASE_URL=ep-restless-tooth-agz3assx-pooler.../neondb`,
  `DIRECT_URL=ep-restless-tooth-agz3assx.../neondb`. This is not the known production host, but
  it is also not the designated Chat 8 branch.
- `pnpm exec prisma validate --config prisma.config.ts`: exit 0, multi-file schema valid.
- `pnpm exec prisma migrate status --config prisma.config.ts`: exit 1. Prisma found 214 local
  migrations; last common migration is `20260822010000_ai_provider_model_internal_agent`;
  `20260822180000_ai_prompt_policy_context_foundation` is pending. The configured database has
  extra migration-history entries not present locally, including one duplicate
  `20260331180000_restore_products_extensions`.
- Claimed targeted Vitest command: 12 files / 50 tests passed, exit 0.
- Independent AI foundation regression/security selection: 12 files / 138 tests passed, exit 0.
  It covered admin authorization, External Agent service/protocol parity, REST/MCP, scope/surface
  isolation, provider isolation/key/connection, model sync/policy resolution, and Internal Agent.
- `pnpm --filter @nbos/shared typecheck`: exit 0.
- `NODE_OPTIONS='--max-old-space-size=8192' pnpm --filter @nbos/api typecheck`: first parallel
  process failed to spawn; isolated retry exited 0.
- `NODE_OPTIONS='--max-old-space-size=8192' pnpm --filter @nbos/web typecheck`: exit 0.
- Targeted API/shared ESLint and changed web component ESLint: exit 0; web lint emitted only the
  existing pages-directory configuration warning.
- Runtime contract probe with `assembleAuthorizedContext`: returned `ok: true` and retained a
  `TASK` source carrying `scopeId=ws-other` plus nested `metadata.apiKey`, even though the ALLOW
  decision carried `matchedScope=ws-authorized`.
- Runtime contract probe with `evaluatePersistentMemoryWrite`: returned `{ "ok": true }` for an
  enabled write containing nested `metadata.apiKey`.
- Runtime contract probe with `assertKnowledgeRetrievalAllowed`: returned
  `{ "ok": true, "fragments": [] }` for a `SECRET` Documents source under a `tasks.read` decision
  that was scoped only to `ws-authorized`.

### Checklist evidence

- AD 470–481 has structural and test evidence: models/migration, version states, DRAFT-only edits,
  serialized publish/retire, published-only assignment validation, attribution, rollback cloning,
  digest-only Audit changes, and no grant/scope writes.
- AE 482, 484–492, 494 and 496 have foundation evidence, subject to the defects below.
- AE 493 and 495 do **not** have valid evidence and must not remain `[x]` until the defects below
  and their negative tests are fixed.
- Static write-path review found no Tasks/Drive/CRM/domain Prisma writes in the new prompt/context code; Prompt Policy writes only its module-owned tables and checks Employee identity.
- Scope review found no vector store, embeddings platform, production RAG, unrestricted memory persistence, employee chat, Messenger auto-reply, or second authorization engine.

### Discrepancies

- The handoff says secret-shaped fields never enter context or memory, but detection examines only
  top-level keys.
- The handoff says future retrieval cannot bypass authorization, but authorization evidence is not
  bound to the request actor or each source scope/resource/classification.
- The migration is described as purely additive/LOW, but it performs a lossy `UPDATE` that clears
  every non-null legacy `internal_ai_agents.prompt_policy_id` before adding the FK. The old field
  was non-authoritative and unused, so rolling application compatibility appears acceptable, but
  the data mutation must be called out and checked on the actual target before deploy.
- Existing `ai-admin.authorization.http.int.test.ts` passed, but its harness does not mount the new
  `AiAdminPromptPoliciesController`; it is not evidence for the new HTTP surface.

### Defects and required fixes

1. **Authorization/resource-isolation binding**
   - Files: `packages/shared/src/ai/context-types.ts`,
     `packages/shared/src/ai/context-assembler.ts`,
     `packages/shared/src/ai/knowledge-source.ts`.
   - Behavior: an ALLOW decision can be replayed with another `actorId`, another source scope/id,
     or an unrelated Knowledge source. The assembler checks only the capability key; Knowledge
     checks only `requiredCapability` and ignores source classification.
   - Fix: bind authorization evidence to actor, capability, target/matched scope and applicable
     classification; reject every source whose access basis is not covered by that evidence before
     it can enter context or retrieval.
   - Tests: cross-actor, cross-Work-Space/customer/resource, capability-match-but-scope-mismatch,
     and SECRET/classification-ceiling negative cases for both assembler and Knowledge contracts.

2. **Recursive secret exclusion**
   - Files: `packages/shared/src/ai/context-classification.ts`,
     `packages/shared/src/ai/context-assembler.ts`,
     `packages/shared/src/ai/persistent-memory.ts`.
   - Behavior: `projectionContainsSecretFields` and redaction inspect only root keys. Nested objects
     and arrays containing `apiKey`, token, password, private-key or authorization fields pass.
   - Fix: recursively inspect JSON-compatible projections/payloads and reject or deeply redact
     secret-shaped fields consistently. The disabled memory store must remain disabled.
   - Tests: nested object, nested array, normalized/case/punctuation variants, and safe sibling
     fields for context and memory.

3. **Required HTTP security/integration coverage**
   - Files: `apps/api/src/modules/ai-platform/admin/ai-admin.http.harness.ts`,
     `apps/api/src/modules/ai-platform/admin/ai-admin.authorization.http.int.test.ts` or a dedicated
     Prompt Policy HTTP integration test.
   - Behavior: no HTTP test mounts the new Prompt Policy controller, so employee permission,
     External Agent rejection, DTO validation and publish/rollback routing are unproven.
   - Fix/tests: mount the controller and Prompt Policy service mock; prove COMPANY/EDIT success,
     missing permission 403, External Agent token 401, invalid nested DTO 400, and service routing
     for create/publish/rollback.

After fixes, rerun the two explicit contract probes as negative tests and reconcile AD/AE checklist
statuses from code/test evidence.

### Remaining debts

- Existing Phase 1 debts listed above remain unchanged; this verification does not accept or close
  AF–AI, rate-limit, idempotency, output-schema, Model Policy UI, production audit-window, Anthropic
  live, Redis TLS, or browser-E2E debts.
- Before any non-production deploy, inspect/count legacy non-null `prompt_policy_id` values on the
  designated branch and explicitly accept, map, or preserve them; do not silently treat the update
  as additive.

### Not verified and why

- Migration application on a clean database or the designated non-production Neon: not run because
  the configured database is a different drifted branch. No production migration was applied.
- Full `pnpm test`, root `pnpm lint`, root `pnpm typecheck`, builds, browser walk, and live AO/AP:
  not rerun because this milestone already fails on reproducible contract defects; targeted
  regression/security suites and all affected-package typechecks passed.
- Live provider calls and production secrets: not needed for Chat 9 and no credentials were used.

## Remediation after Chat N9 FAIL

Product code **was** changed after the FAIL. Phase 1 is still **not** complete. Chat 10 was not started.

### Fixes

1. **Authorization/resource-isolation binding**
   - `evaluateAiPolicy` stamps `actorId` / `actorType` on ALLOW and REQUIRE_APPROVAL.
   - `assertBoundAllowDecision` refuses a replayed ALLOW for another actor.
   - `isSourceCoveredByMatchedScope` uses the existing `matchesGrantedScope` deny-by-default matcher.
   - A source without `scopeType`/`scopeId` is unauthorized, including under an ORGANIZATION grant.
   - Classification uses the tighter of the request ceiling and `capability.maxDataClassification`.
   - Knowledge sources now require `scopeType`/`scopeId` and the same actor/scope/classification bind.
   - Files: `policy-decision.ts`, `policy-evaluator.ts`, `authorization-binding.ts`,
     `context-assembler.ts`, `knowledge-source.ts`.

2. **Recursive secret exclusion**
   - `jsonContainsSecretShapedFields` / `redactSecretShapedFields` walk objects and arrays.
   - Depth overflow is fail-closed (treat as secret / drop).
   - Persistent memory still stays disabled; enabled writes with nested secrets still return
     `SECRET_FORBIDDEN`.
   - Files: `context-classification.ts`, `persistent-memory.ts` (same `projectionContainsSecretFields`).

3. **Prompt Policy HTTP coverage**
   - `startAiAdminHarness` mounts `AiAdminPromptPoliciesController` and a Prompt Policy service mock.
   - `ai-admin.prompt-policies.http.int.test.ts` proves COMPANY/EDIT 200, missing permission 403,
     External Agent token 401, invalid nested DTO 400, and create/publish/rollback routing.
   - Nested `layers` DTO now requires `@IsDefined()` / `@IsObject()` so missing `platformSafety` is 400.

### Verifier probes as negative tests

- Foreign workspace `ws-other` + nested `metadata.apiKey` under ALLOW `ws-authorized` → source omitted
  `UNAUTHORIZED` (scope checked before projection).
- Matching scope + nested `apiKey` / `token` / `API-Key` → omitted `SECRET`; safe sibling kept.
- `assertKnowledgeRetrievalAllowed` for SECRET Documents + `ws-other` → `RESOURCE_OUT_OF_SCOPE`;
  same source on `ws-authorized` → `SECRET_FORBIDDEN`. Nested memory `metadata.apiKey` →
  `SECRET_FORBIDDEN`.

### Tests run after remediations

```text
pnpm exec vitest run
  packages/shared/src/ai/context-assembler.test.ts
  packages/shared/src/ai/session-memory-knowledge.test.ts
  packages/shared/src/ai/prompt-layers.test.ts
  packages/shared/src/ai/prompt-version-lifecycle.test.ts
  packages/shared/src/ai/policy-evaluator.test.ts
  apps/api/src/modules/ai-platform/prompts/*
  apps/api/src/modules/ai-platform/internal-agents/*
  apps/api/src/modules/ai-platform/context/ai-context-foundation.test.ts
  apps/api/src/modules/ai-platform/security/prompt-context-isolation.security.test.ts
  apps/api/src/modules/ai-platform/admin/dto/update-internal-agent.dto.test.ts
  apps/api/src/modules/ai-platform/policies/ai-model-policy.service.test.ts
  apps/api/src/modules/ai-platform/admin/ai-admin.prompt-policies.http.int.test.ts
  apps/api/src/modules/ai-platform/admin/ai-admin.authorization.http.int.test.ts
→ 16 files / 99 tests passed

pnpm exec vitest run (AI auth/security regression slice)
  admin authorization + prompt-policies HTTP, security/*, internal-agents/*,
  model policy, policy-evaluator
→ 11 files / 110 tests passed

pnpm --filter @nbos/shared typecheck → exit 0
NODE_OPTIONS='--max-old-space-size=8192' pnpm --filter @nbos/api typecheck → exit 0
eslint on changed prompt/context/admin files → exit 0
```

Not rerun: full `pnpm test`, root `pnpm lint` / `pnpm typecheck`, prisma migrate status (unchanged
drift), production migrate, browser walk, live AO/AP.

Ready for the same-chat re-verify. Do not treat this remediations section as PASS.

## Re-verification (Chat N9)

- Model/date: GPT-5.6 Sol, 2026-08-22.
- Verdict: **PASS WITH DEBTS** for Chat 9 only. Phase 1 is not complete; Chat 10 was not started.
- Branch/HEAD: `sipan`, `d764a68fd7a52db6b83e5aacbf59dd7bd34c4cc6`, equal to
  `origin/sipan`; remediation remains uncommitted. `git diff --check` exited 0.

### Commands and actual results

- Remediation targeted + HTTP command: **16 files / 100 tests passed**, exit 0.
- Independent External Agent/provider/model/Internal Agent regression selection:
  **12 files / 138 tests passed**, exit 0.
- `pnpm --filter @nbos/shared typecheck`: exit 0.
- `NODE_OPTIONS='--max-old-space-size=8192' pnpm --filter @nbos/api typecheck`: exit 0.
- ESLint over all remediation files: exit 0.
- `pnpm exec prisma validate --config prisma.config.ts`: exit 0, schema valid.
- `pnpm exec prisma migrate status --config prisma.config.ts`: expected exit 1 from unchanged
  history drift; 214 local migrations, last common
  `20260822010000_ai_provider_model_internal_agent`, Chat 9 migration still pending.
- Independent runtime probes now return:
  - foreign `ws-other` context source under `ws-authorized` ALLOW: omitted `UNAUTHORIZED`;
  - nested memory `metadata.apiKey`: `SECRET_FORBIDDEN`;
  - foreign Knowledge source: `RESOURCE_OUT_OF_SCOPE`;
  - matching-scope SECRET Knowledge source: `SECRET_FORBIDDEN`.

### Defect re-check

1. Actor/scope/classification binding: **closed**. ALLOW/REQUIRE_APPROVAL decisions carry actor
   identity; context and Knowledge use the shared deny-by-default binding and scope matcher.
2. Recursive secret exclusion: **closed**. Nested object/array and normalized key variants are
   covered; depth overflow fails closed; disabled memory remains disabled.
3. Prompt Policy HTTP coverage: **closed**. The controller is mounted in the real admin harness and
   permission, machine-token rejection, nested DTO validation, create, publish and rollback paths
   pass.

No new actionable product-code defect was found in the remediation diff. AE 493 and 495 now have
code plus negative-test evidence for `[x]`.

### Discrepancies

- The remediation section records 16 files / 99 tests; the same explicit file selection now
  executes 16 files / 100 tests. Current result is authoritative.
- Migration wording debt remains: SQL clears legacy non-null `prompt_policy_id` values and is not
  purely additive, even though old/new application versions tolerate null.

### Remaining debts

- Confirm the designated non-production Neon target and inspect/map/accept legacy non-null
  `prompt_policy_id` values before `migrate deploy`.
- Existing Phase 1 debts outside Chat 9 remain unchanged; this verdict does not close AF–AI or
  declare Phase 1 complete.

### Not verified and why

- No migration was applied: the configured Neon branch is non-designated and has history drift;
  production was not contacted.
- Full root test/lint/typecheck, builds, browser walk and live AO/AP were not rerun. The remediation
  was covered by targeted HTTP/security tests, affected-package typechecks, lint, direct probes and
  the independent foundation regression selection.
