# Phase 1 Chat 2 Handoff — Credentials, Auth and Policy

> Next chat must verify this evidence against the repository. Do not trust the summary blindly.

## Milestone

Chat 2 of `16-Phase-1-Execution-Strategy.md`. Closed **PASS WITH DEBTS** after three verification rounds; the debts are listed as entry conditions under "Chat 3 entry point".

Completed: External Agent persistence, credential issue/rotate/revoke on argon2id, a dedicated machine authentication boundary, the shared capability registry, agent capability grants and resource scopes, and the deny-by-default Policy Evaluator.

An External Agent now has a real identity, a verifiable credential and an authorization answer. It still has no way in: REST and MCP surfaces are Chat 4, and no domain capability is executable yet (Chat 3).

## Checklist

Status after both remediation rounds described below. Two earlier self-reports over-claimed; the statuses here are the ones the second verification could reproduce.

- D 85, 90 `[x]` (were `[~]`): External Agent lifecycle audit and capability/scope audit now emit, and each commits in the same transaction as the change it records.
- E 96–107 `[x]`; E 108 `[~]` — persistence is unit-tested against a mocked Prisma client; real-database migration/uniqueness/FK behaviour is proven only by `migrate deploy` + `migrate diff`, not by an integration test.
- F 109–126 `[x]` — including F 118: the overlap mechanism is bounded and its maximum window is now an approved 24 hours.
- G 127–139 `[x]`; G 140 `[~]` — the Employee-vs-Agent boundary is unit-tested, but the real `@Public()` + global guard wiring can only be integration-tested once Chat 4 adds controllers.
- H 141–159 `[x]`
- I 160–175 `[x]`
- J 176–185, 187–195 `[x]`; J 186 `[~]` — the evaluator consumes a rate-limit verdict, but counters and windows are section U.

No open `[!]` BUSINESS DECISION. Two questions were raised to the developer during the second remediation — the maximum credential-overlap window and how to make the concurrent-index migration recovery-safe — and both were answered; see "Decisions taken by the developer".

## Files / modules changed

| Area                | Path                                                                                                                                     |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Capability registry | `packages/shared/src/ai/capability-{types,registry,catalog.read,catalog.write}.ts`                                                       |
| Scopes / policy     | `packages/shared/src/ai/{agent-scope,policy-decision,policy-evaluator,policy-state-reasons,policy-error-mapping}.ts`                     |
| Shared export       | `packages/shared/src/{index.ts,ai/index.ts}`                                                                                             |
| Actor contract debt | `packages/shared/src/actor/{actor-context,actor-types,normalize-actor-context,index}.ts`                                                 |
| Prisma schema       | `packages/database/prisma/schema/ai-platform.prisma`, `employees.prisma` (back-relations)                                                |
| Migrations          | `packages/database/prisma/migrations/20260821170000_ai_external_agent_foundation/` (single, squashed)                                    |
| Agent lifecycle     | `apps/api/src/modules/ai-platform/agents/*`                                                                                              |
| Credentials         | `apps/api/src/modules/ai-platform/credentials/*`                                                                                         |
| Auth boundary       | `apps/api/src/modules/ai-platform/auth/*`                                                                                                |
| Grants / scopes     | `apps/api/src/modules/ai-platform/grants/*`                                                                                              |
| Policy service      | `apps/api/src/modules/ai-platform/policy/*`                                                                                              |
| Module wiring       | `apps/api/src/modules/ai-platform/{ai-platform.module,ai-platform-audit.service,ai-platform.constants}.ts`, `apps/api/src/app.module.ts` |
| Audit debts         | `apps/api/src/modules/audit/{audit-log-write.mapper,audit-actor.resolver,audit.service}.ts`                                              |
| Test utils          | `apps/api/src/test-utils/mock-prisma.ts` (four AI models, `findUniqueOrThrow`)                                                           |

Added during the first remediation: `credentials/agent-credential.rules.ts`, `grants/agent-grant.rules.ts`, `auth/agent-channel.decorator.ts`, `policy/agent-policy.assert.test.ts`, `credentials/agent-secret-hash.test.ts`, `apps/api/src/modules/audit/audit-actor.resolver.test.ts` (the last was missing from the first version of this table).

Added during the second remediation: `agents/agent-row-lock.ts` (shared `FOR UPDATE` helper and `PrismaTransaction` type), `agents/external-agent.rules.ts` (name/description normalization), `grants/agent-grant.scope.test.ts` (split out of the grant test file).

Added during the third remediation: `credentials/agent-credential.concurrency.int.test.ts` (opt-in real-database lock-order test) and `credentials/agent-credential.locks.ts` (row locking and predecessor claiming, extracted to keep the service under the file-size limit; the rotation tests moved to `credentials/agent-credential.rotation.test.ts` for the same reason).

No REST controller, no MCP adapter, no Tasks/Drive write path was added.

## Migrations

**One** migration, applied to the **dev** Neon branch `ep-late-frost-ag5aixzw` with `prisma migrate deploy` over `DIRECT_URL`. `prisma migrate status` reports 211 migrations and "Database schema is up to date!". Nothing was applied to production.

`20260821170000_ai_external_agent_foundation` — enums `ExternalAgentStatusEnum`, `AgentScopeTypeEnum`; tables `external_agents`, `external_agent_credentials`, `external_agent_capability_grants`, `external_agent_resource_scopes`; all indexes; all foreign keys. Risk **LOW**: additive only, no existing table is touched apart from new inbound foreign keys to `employees`.

**This replaces the earlier three-migration sequence** (`170000` + `170100_ai_external_agent_indexes` + `180000_ai_agent_scope_uniqueness_and_fk_indexes`), on the developer's decision. The middle one carried ten `CREATE INDEX CONCURRENTLY` statements in a single non-transactional migration, which cannot be partially rolled back: a mid-batch failure would leave a failed Prisma migration and possibly an `INVALID` index. `CONCURRENTLY` earns nothing on tables created empty in the same deployment, so the squashed migration uses plain, transactional `CREATE INDEX` and is atomic and retry-safe.

The squash was executed as disposable-dev-history surgery, not a reset: the four AI tables were confirmed to hold **0 rows**, then dropped along with the two enums, the three AI rows were deleted from `_prisma_migrations`, and `migrate deploy` re-created everything from the single file. No other table, migration or row was touched, and `prisma migrate dev` was never used — the repository's migration history carries drift and `migrate dev` would offer a reset.

Post-apply verification on dev: 19 `external_agent%` indexes, **0 invalid**; `resource_type` is `NOT NULL DEFAULT ''`; `migrate diff` shows no `external_agent` entries, so the schema (including the pinned unique-index name) matches the database exactly.

Rollback: forward-fix. The tables are unreferenced by any shipped runtime path until Chat 4, so dropping them is safe if ever needed.

## Tests run

Numbers below are from the run after the **second** remediation round.

```text
pnpm vitest run
→ 749 files passed + 1 skipped, 3702 tests passed + 2 skipped (the skipped file is the
  opt-in real-database concurrency test)

pnpm vitest run apps/api/src/modules/ai-platform packages/shared/src/ai
→ 16 files passed + 1 skipped, 226 tests passed + 2 skipped

AI_PLATFORM_DB_TEST_URL=<dev branch> pnpm vitest run …/agent-credential.concurrency.int.test.ts
→ 2 tests passed against the dev Neon branch, 0 deadlocks in 25 concurrent rounds
  (same test with the lock order inverted: 19 of 25 rounds deadlocked)

pnpm typecheck  → 6 packages in scope, 5 successful tasks (one has no typecheck task)
pnpm lint       → 0 errors, 13 pre-existing unused-var warnings (11 web + 2 api), none in this milestone's files

pnpm --filter @nbos/database exec prisma migrate deploy → 20260821170000 applied (dev branch, after squash)
pnpm --filter @nbos/database exec prisma migrate status → 211 migrations, up to date
prisma migrate diff --from-config-datasource --to-schema prisma/schema
→ non-empty because of pre-existing repository-wide drift; grepped for `external_agent`
  and `agent_` after the index-name fix: no AI-specific drift remains
```

Dev-branch state was also inspected directly: all four AI tables hold 0 rows and every
`external_agent%` index reports `indisvalid = true`, so no `CREATE INDEX CONCURRENTLY`
statement left an invalid index behind.

Baseline before any Chat 2 edit was also green, so the Chat 1 handoff was verified rather than trusted.

Not run: production migration, API/worker boot against a live database, any end-to-end agent call (no protocol surface exists yet).

## Architecture decisions

1. **Token layout is hex, not base64url.** `nbos_agt_<keyId>_<secret>`; the separator is `_`, which base64url emits, so base64url segments made a share of generated tokens unparseable. This was caught by the authenticator tests and fixed in the generator, with a 200-sample regression test.
2. **`keyId` is a public lookup handle.** Verification finds one row by indexed `key_id` and runs one argon2id verify, instead of scanning hashes. Unknown key ids burn a comparable hash so timing does not reveal existence.
3. **`EXPIRED` is derived, never stored.** Agent and credential expiry are computed from `expiresAt` at read time, so a lapsed principal can never look active through a stale status column.
4. **Rotation preserves identity.** A rotation inserts a new credential row against the same `agentId` and links `rotatedFromId`. Grants, scopes and audit history are attached to the agent, not the credential, so nothing has to be re-granted after rotation. Without `previousValidUntil` the predecessor is revoked immediately; with it, the predecessor gets a bounded overlap window instead.
5. **The guard writes `request.agent`, never `request.user`.** An agent therefore cannot enter an employee RBAC guard as a user, and an employee JWT fails the structural token parse before any database lookup. Agent routes in Chat 4 must be `@Public()` so the employee chain is skipped rather than run alongside.
6. **Capability grants and resource scopes are separate tables.** "What" and "where" are evaluated together, so a capability never implies all resources and a scope never implies all actions.
7. **ORGANIZATION scope uses a sentinel id** (`PLATFORM_ORGANIZATION_SCOPE_ID`) so `scope_id` stays `NOT NULL` and the uniqueness index holds. NBOS is single-tenant today; this keeps the column shape honest without pretending a tenant table exists.
8. **The evaluator is a pure function in `@nbos/shared`.** The API service loads state and audits; the decision itself has no I/O, which is what lets REST, MCP and future internal tool adapters share one answer. `AiPolicyRequest` accepts no free-text content, so prompt-injection cannot reach the decision.
9. **Audit goes through one module-level service.** `AiPlatformAuditService` wraps `AuditService.log({ actor })` so every AI event has the same actor shape. Human admin actions log the employee; machine denials log the agent and never write `userId`.
10. **`AuditService.registerActorLookups` breaks the module cycle.** `AiPlatformModule` registers its batched display-name resolver on init, rather than `AuditModule` importing the AI module it is a dependency of.
11. **Denial semantics are anti-enumerating.** Out-of-scope and non-existent resources both return `AGENT_RESOURCE_NOT_AVAILABLE` with an identical message; revoked/expired agents all collapse to `AGENT_DISABLED`. Internal reasons stay in the audit trail only.

## Chat 1 debts closed

| Debt                                           | Resolution                                                                                                                                                                                                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ActorChannel.source` widened with `\| string` | Narrowed to `ActorChannelSource`; `normalizeChannel` validates unknown sources through `isActorChannelSource`                                                                                                                                           |
| `MACHINE_ACTOR_TYPES` unused                   | `isMachineActorType` now reads the constant instead of `type !== 'USER'`                                                                                                                                                                                |
| `params.userId as string` in the write mapper  | Replaced by an explicit presence check that throws when neither `actor` nor `userId` is given                                                                                                                                                           |
| `AuditActorLookups` never supplied             | `AuditService.registerActorLookups`; `ExternalAgentService.resolveDisplayNames` resolves many ids in one query                                                                                                                                          |
| `await` inside `map` for machine names         | `loadMachineDisplayNames` collects ids per actor type and resolves them in one batched call per type                                                                                                                                                    |
| Index creation inside the table migration      | Reconsidered: `CONCURRENTLY` buys nothing on tables created empty in the same deployment, so indexes stay in the (transactional) table migration. The debt's intent — never hold a write lock on a populated table — is preserved for future index work |

## Canon / runtime conflicts

| ID                                  | Classification | Resolution in Chat 2                                                                                                          |
| ----------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| C2 Employee-only audit display      | OK             | Machine names resolve through batched `AuditActorLookups`; unresolved ids fall back to the type label                         |
| C3 `ResourceAccessGrant.employeeId` | OK             | Agent access lives in `external_agent_*` tables only; a test asserts no write reaches `ResourceAccessGrant`                   |
| C4 agent identity                   | OK             | `ExternalAgent` + `ExternalAgentCredential`                                                                                   |
| C5 machine auth                     | OK             | `AgentAuthGuard` / `AgentAuthenticatorService`                                                                                |
| C6 capability model                 | OK             | Shared registry; unknown keys cannot be granted                                                                               |
| C7 policy evaluation                | OK             | `evaluateAiPolicy`, deny-by-default                                                                                           |
| C8 idempotency                      | MISSING        | Capability metadata declares the requirement; enforcement is section T (Chat 3/4)                                             |
| C9 rate limits                      | PARTIAL        | Rate-limit classes are declared per capability and the evaluator honours a verdict; counters are section U                    |
| D2 Extension Work Space             | PARTIAL        | Unchanged. Scope matching operates on the resolved Product Work Space id; Chat 3 must pass the resolved id, not `extensionId` |
| Data classification vocabulary      | PARTIAL        | Shared ladder is `INTERNAL / SENSITIVE / SECRET`. Drive's `FileConfidentialityEnum` must map onto it in Chat 3, in Drive code |
| Maximum credential overlap window   | RESOLVED       | Canon requires a bounded overlap but names no value. Developer approved 24 hours on 2026-08-21                                |

## Remediation after the Chat 2 verification

The first verification returned FAIL with four HIGH and eleven MEDIUM defects. Fifteen of the seventeen prescribed fixes landed in this round. Fix 16 (recovery-safe concurrent-index migration) was only _documented_, which the second verification correctly rejected, and fix 8's size violation was only partly closed. Both are handled in the next section.

| #   | Defect                                                                          | Fix                                                                                                                                                                                                                                                                                                                 |
| --- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Revoke reversible through `disable → enable → issue`                            | `resolveAgentState` reads `revokedAt`, every transition is a conditional `updateMany ... WHERE revoked_at IS NULL AND status <> 'REVOKED'`, and issuance locks the agent row `FOR UPDATE`. Tests cover `revoke → disable`, `revoke → enable`, `revoke → update`, `revoke → issue` and the walked-back status column |
| 2   | Policy decided on a caller-supplied `agentId`                                   | `agentId` is gone from `AgentPolicyQuery`; it is derived from `actor.actor.id` and only for `EXTERNAL_AGENT`. Negative tests cover a second agent, an employee actor and an internal AI actor                                                                                                                       |
| 3   | Grant/scope committed before its audit row                                      | Both run inside one `$transaction`, with `AuditService.log(params, tx)`. A failing audit rolls the grant back                                                                                                                                                                                                       |
| 4   | Denial audit failure replaced the safe error                                    | `auditDenial` catches, logs and lets the original `AgentAccessException` propagate                                                                                                                                                                                                                                  |
| 5   | Channel taken from a client header                                              | `@AgentChannel()` route metadata via `Reflector`, defaulting to `rest`. Header and path spoofing tests added                                                                                                                                                                                                        |
| 6   | Overlap could extend the predecessor                                            | `resolveOverlapWindow` requires a future timestamp, refuses to extend an existing expiry and caps at `AGENT_CREDENTIAL_MAX_OVERLAP_MS` (24 hours), with boundary tests                                                                                                                                              |
| 7   | Auth observability incomplete, `authFailed` dead                                | Structured secret-free warn log for every rejection path; the unused `AI_AUDIT_ACTION.authFailed` constant is removed (rationale below). Checklist statuses corrected                                                                                                                                               |
| 8   | Three functions over 50 lines, docs constant name wrong                         | Split into `agent-credential.rules.ts`, `agent-grant.rules.ts` and smaller private methods; `AI_CAPABILITIES_FORBIDDEN_PHASE_1` corrected in the checklist                                                                                                                                                          |
| 9   | Missing classification was fail-open                                            | Capabilities declare `requiresTargetDataClassification`; a missing value denies with `DATA_CLASSIFICATION_UNKNOWN`                                                                                                                                                                                                  |
| 10  | Rate limit checked after scope, creating an oracle                              | Rate limit is evaluated before the scope match; a test asserts identical responses in and out of scope                                                                                                                                                                                                              |
| 11  | RESOURCE uniqueness ignored `resourceType`                                      | `resourceType` normalized (uppercase, `''` for non-resource) and part of the unique key; now folded into the squashed migration                                                                                                                                                                                     |
| 12  | Catalog diverged from canon                                                     | `tasks.submit_review` → `MEDIUM` + `REQUIRED`; `tasks.start` → `REQUIRED` as retry-sensitive                                                                                                                                                                                                                        |
| 13  | Token parser accepted arbitrary shapes; unknown key hashed instead of verifying | Canonical hex validation (18 / 64 chars) before any lookup, and a per-process decoy verifier exercised through the same `argon2.verify` path, primed at module init                                                                                                                                                 |
| 14  | Predecessor could be rotated twice                                              | Predecessor row locked `FOR UPDATE`, existing successor produces a `ConflictException` instead of a unique-violation                                                                                                                                                                                                |
| 15  | Audit failure could lose the one-time token                                     | Issue and rotate run the credential write and its audit row in one transaction, so either both commit or the caller keeps the old credential                                                                                                                                                                        |
| 16  | Concurrent-index migration is not recovery-safe                                 | **Not closed in this round** — only documented. Closed in the second round by squashing the migrations                                                                                                                                                                                                              |
| 17  | Employee FK columns unindexed                                                   | Indexed, and the two redundant single-column `agent_id` indexes dropped; now part of the squashed migration. E 106 stays `[x]`, E 108 drops to `[~]` pending a real-database test                                                                                                                                   |

**Auth failures are logged, not audited.** Unauthenticated traffic is attacker-controlled and unbounded, so a database row per attempt would hand an anonymous caller a write amplifier. Every rejection emits a structured warning with reason, public key id, channel and correlation id — never a secret — and refusals of a _known_ credential remain traceable through that agent's own lifecycle trail. If canon later requires persisted auth-failure records, they need a rate-limited or aggregated writer, not a row per request.

## Remediation after the Chat 2 re-verification

The second verification returned FAIL with one HIGH, three MEDIUM and two LOW defects, plus five inaccuracies in this document. Four were fixed in code directly; the remaining two needed a decision from the developer, which was given and then executed.

| #   | Defect                                                                                                                   | Fix                                                                                                                                                                                                                                                                                                                           |
| --- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **HIGH** — lifecycle mutation committed before its audit row; a failing audit could leave an agent enabled with no trail | Every `ExternalAgentService` mutation (`create`, `update`, `disable`, `enable`, `revoke`) now runs inside one `$transaction` and passes `tx` to `logLifecycle`. Parameterised tests assert both directions: the audit row goes through the transaction client, and a failing audit fails the whole call                       |
| 2   | **MEDIUM** — grant/scope checked terminal state before the transaction, so a concurrent revoke could be overtaken        | Grants take the same `SELECT ... FOR UPDATE` lock on the agent row _inside_ the transaction and read state after the lock. A race-oriented test flips the row to `REVOKED` at lock time and asserts the grant is refused; another asserts the lock precedes the write                                                         |
| 3   | **MEDIUM** — Prisma wanted to rename the resource-scope unique index, so `migrate diff` reported AI drift                | The index name is pinned in the schema with `map: "external_agent_resource_scopes_agent_scope_resource_key"`. A re-run of `migrate diff` shows no `external_agent` entries                                                                                                                                                    |
| 4   | **MEDIUM (operational)** — `170100` still not recovery-safe                                                              | Squashed away on the developer's decision: `170000` + `170100` + `180000` become one transactional migration with plain `CREATE INDEX`, applied to an emptied dev schema. No concurrent index creation remains                                                                                                                |
| 5   | **DECISION** — 7-day overlap described as approved                                                                       | Raised to the developer and answered: the maximum is **24 hours**, recorded with its date on the constant. The tests read the constant rather than a literal                                                                                                                                                                  |
| 6   | **LOW** — `grantScope()` over 50 lines; `timingSafeEqualToken` had no production consumer                                | `grantScope()` builds the uniqueness key once and reuses it, now well under the limit; `timingSafeEqualToken` and its test are deleted (argon2 verification is the only comparison path). `agent-grant.service.test.ts` was also over 300 lines and is split into `agent-grant.service.test.ts` + `agent-grant.scope.test.ts` |

The five documentation inaccuracies (17/17 claim, atomicity claim, "no drift", lint count, "approved" overlap) are corrected in place above rather than annotated.

**Shared lock helper.** `agents/agent-row-lock.ts` now owns `lockAgentRow` / `lockLiveAgent` and the `PrismaTransaction` type. Lifecycle, credential issuance and grants take the identical lock, so "revocation is terminal" is enforced by one mechanism instead of three similar checks.

## Remediation after the Chat 2 re-verification 2

The third verification confirmed every earlier fix and found one new defect.

| #   | Defect                                                                                                                                                                                                                                                                                                                                 | Fix                                                                                                                                                                                                                                                                                                                                                          |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **MEDIUM (concurrency)** — rotation locked the credential row first and the agent row second, while agent revoke locks them in the opposite order. The interleaving `rotate: credential locked → revoke: agent locked → both wait` is a PostgreSQL deadlock, and the loser is aborted with SQLSTATE `40P01` rather than a domain error | Rotation now resolves the owning `agentId` with an unlocked read, locks the **agent** row, then locks the credential row and re-validates the predecessor under that lock — including an assertion that ownership did not change. The module-wide order **agent row → credential row → grant/scope rows** is documented on `lockAgentRow` for future writers |

**The lock order is proven against a real PostgreSQL database, not asserted.** `credentials/agent-credential.concurrency.int.test.ts` runs 25 rounds of `rotate` and `revoke` concurrently on its own throwaway agents and fails if any transaction is aborted with `40P01`. It is opt-in — it only runs when `AI_PLATFORM_DB_TEST_URL` is set, so the default suite stays hermetic — and it cleans up its agents, credentials and audit rows afterwards.

The test was validated by inverting the fix: with the old lock order, **19 of 25** rounds deadlocked on the dev branch; with the fix, 0 of 25 across repeated runs. A unit test additionally asserts the acquisition order, so a future edit that reverses it fails without needing a database.

Run it with:

```bash
AI_PLATFORM_DB_TEST_URL="$DIRECT_URL" pnpm vitest run \
  apps/api/src/modules/ai-platform/credentials/agent-credential.concurrency.int.test.ts
```

## Decisions taken by the developer, 2026-08-21

1. **Maximum credential overlap = 24 hours.** The rotation path already enforced "future, non-extending, bounded"; the bound is now an approved value rather than an implementer guess. It is long enough for a client to redeploy, short enough that a leaked predecessor secret is not a standing key. `AGENT_CREDENTIAL_MAX_OVERLAP_MS` records the decision and its date, and the boundary tests read the constant, so the window cannot be widened without the tests following. F 118 is `[x]`.
2. **Squash the AI migrations.** Chosen over rehearsing recovery or accepting the risk, and executed — see "Migrations". Fix 16 from the first verification is now genuinely closed: no `CREATE INDEX CONCURRENTLY` remains in this milestone, so there is nothing to recover from.

## Known risks

1. **Almost nothing exercises this against a real database yet.** Every test but one uses the mocked Prisma client per repo convention; the single real-database test covers the credential lock order and nothing else. The migration is applied, but no domain query has run through the real schema. Chat 4's first live agent call is the real proof.
2. **`tokenPrefix` is stored for display and is structurally parseable** (`nbos_agt_<keyId>_<4 chars>`). It is not a usable credential — the secret fragment is truncated and no verifier matches it — but it should never be presented as if it were redacted noise.
3. **Disable does not revoke credential rows.** A disabled agent is refused at the auth boundary by agent state; its credentials stay valid-on-paper so re-enabling does not force re-issuance. Only `revoke` revokes credentials, and revocation is terminal — a revoked agent cannot be re-enabled, modified or re-credentialed. Chat 6's admin UI must present that distinction clearly.
4. **Usage telemetry is best-effort.** A failure to record `lastUsedAt` logs a warning and lets the request through; the trail is observability, not an authorization input.
5. **Approval outcomes throw today.** `REQUIRE_APPROVAL` maps to `AGENT_APPROVAL_REQUIRED` and refuses the call; the approval workflow itself is section AF.
6. **No agent-facing admin surface exists.** Agents, credentials, grants and scopes can currently only be created from server code. Chat 6 owns the Settings UI.
7. **Fail-closed classification shifts work onto Chat 3.** `drive.read_task_artifact`, `tasks.read_discussion` and `tasks.attach_artifact` now deny unless the caller states the target's classification. The Domain Action Gateway must resolve Drive's `FileConfidentialityEnum` onto the shared ladder before invoking policy, or those capabilities will simply never allow.
8. **The AI migration history was squashed on dev.** Anyone holding the previous three-migration state on another branch must drop the four AI tables and the two enums before pulling, otherwise `migrate deploy` will fail on already-existing objects. Production never saw any of it.
9. **Rollback is proven by unit tests; only the lock order is proven against a real database.** The mocked Prisma client cannot model rollback or two concurrent transactions, so those tests prove wiring — mutation and audit through one client, failure propagates. Rotation versus revoke is now covered by a real PostgreSQL test; the equivalent grant-versus-revoke race is still only unit-tested and should join the integration test in Chat 3.
10. **The concurrency test is opt-in and therefore easy to forget.** It does not run in the default suite, so a future lock-order regression would only be caught by the unit-level order assertion until someone runs it with a database. Wiring it into CI against a disposable branch is the durable fix.

## Chat 3 entry point

Chat 2 closed with **PASS WITH DEBTS**. These are the entry conditions, not optional cleanup:

| Debt                                     | Why it is still open                                                                         |
| ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| E 108 `[~]` — persistence tests          | Needs a wider real-database smoke: issue → authenticate → grant → scope                      |
| G 140 `[~]` — Employee-vs-Agent boundary | The real `@Public()` + global guard wiring only exists once protocol controllers do (Chat 4) |
| J 186 `[~]` — rate limits                | The evaluator consumes a verdict; counters and windows are section U                         |
| Concurrency test is opt-in               | It does not run in CI, so only the unit-level order assertion guards a lock-order regression |
| Grant/scope versus revoke race           | Proven by unit tests only; belongs in the same real-database suite as the rotation race      |

1. Read this handoff, `10-Phase-1-…` K–T, `02-AI-Capability-and-Action-Layer.md`, `03-External-Agent-Access.md`.
2. Build the Domain Action Gateway: capability key in, `AgentPolicyService.assertAllowed` first, existing Tasks/Drive **domain services** second. No Prisma writes from AI code.
3. Derive the `tasks.update` field allowlist from `TasksService` domain rules (checklist item 39), not from any agent-facing DTO.
4. Keep `tasks.delete` and force-complete unregistered; `buildTaskCompletionBlockers` stays authoritative.
5. Persist task discussion in Tasks (Chat 1 conflict D3). Do not fake Employee authorship for agent comments; use `ActorContext`.
6. Map Drive `FileConfidentialityEnum` onto the shared data-classification ladder in Drive code, and block `SECRET_ADJACENT` artifacts for agents.
7. Pass the resolved Product Work Space id into scope checks for Extension work (conflict D2).
8. Add idempotency (section T) for every write capability whose metadata declares `REQUIRED` — that now includes `tasks.start` and `tasks.submit_review`.
9. Pass a resolved `targetDataClassification` for every classification-sensitive capability; without it the evaluator denies by design.
10. Add the real-database integration smoke the verification asked for (issue → authenticate → grant → scope), which is what lifts E 108 and G 140 out of `[~]`. `agent-credential.concurrency.int.test.ts` is the pattern to follow, and the grant-versus-revoke race belongs in the same suite. Consider running it in CI against a disposable branch so the opt-in gate does not hide regressions.
11. Still no REST/MCP controllers — that is Chat 4.

## Verification (Chat 2)

- Проверял: GPT-5.6 Sol, 2026-08-21.
- Вердикт: **FAIL**.
- Git:
  - ветка `sipan`, `HEAD 8171715b40ac018ab9eff044dcfd8828e720e8ff`, совпадает с `origin/sipan`;
  - staged-файлов нет; дерево не чистое: 12 modified + 42 untracked = 54 файла, включая этот handoff;
  - фактический baseline незакоммиченного Chat 2 — `8171715b`, а не старый Chat 1 commit `66ebd5e3`;
  - все заявленные пути существуют; удалённых файлов и тестов нет.
- Запущено:
  - `pnpm --filter @nbos/database exec prisma migrate status` → dev Neon `ep-late-frost-ag5aixzw`, 212 migrations, `Database schema is up to date!`;
  - `pnpm --filter @nbos/database exec prisma validate` → schema valid;
  - `pnpm vitest run apps/api/src/modules/ai-platform packages/shared/src/ai` → 13 files, 160 tests passed;
  - `pnpm vitest run apps/api/src/modules/audit` → 4 files, 24 tests passed;
  - `pnpm vitest run` → 746 files, 3636 tests passed, 122.34s;
  - `pnpm typecheck` → 5 successful tasks / 5 total; прямые `tsc --noEmit` для `@nbos/shared`, `@nbos/database`, `@nbos/api` также passed;
  - `pnpm lint` → 0 errors, 13 warnings (11 web + 2 api, все вне diff);
  - `git diff --check HEAD` → чисто; статический поиск не нашёл `any`, default exports, `console.log`, прямых Tasks/Drive/`ResourceAccessGrant` writes или удалённых тестов в milestone diff.
- Расхождения с самоотчётом:
  - числа тестов, lint и migrate status подтверждены;
  - формулировка `typecheck → 5/5 packages` неточна: Turbo показал 6 packages in scope и 5 successful tasks;
  - таблица changed files не упоминает новый `apps/api/src/modules/audit/audit-actor.resolver.test.ts`;
  - утверждение о terminal revoke опровергнуто: revoked agent можно провести через `disable → enable` и затем выпустить новый credential;
  - G 139 `[x]` завышен: `AI_AUDIT_ACTION.authFailed` не используется, а malformed/unknown/revoked/expired auth failures не получают заявленного структурированного observability;
  - G 134/140 `[x]` подтверждены лишь частично: token parser не проверяет canonical hex/length, unknown-key path отличается от known-key verification, а employee/agent boundary проверена unit-тестами без реального `@Public()` + global guards wiring;
  - H 145/149 и J 177/183/191 `[x]` завышены: catalog расходится с canon по risk/idempotency, отсутствующая classification разрешается fail-open, а rate-limit response создаёт scope oracle;
  - E 108 `[x]` завышен: все persistence tests используют mock Prisma; migration/unique/FK behavior на реальной test DB не покрыт;
  - способ применения миграций, baseline до Chat 2 и неприменение на production ретроспективно не доказуемы read-only проверкой; подтверждено только текущее состояние dev branch.
- Найденные дефекты:
  - `apps/api/src/modules/ai-platform/agents/external-agent.service.ts:122-153` — `disable()` не запрещает переход из `REVOKED`, `enable()` проверяет только текущий status, а `resolveAgentState` не учитывает `revokedAt`; последовательность `revoke → disable → enable → issue` восстанавливает terminal identity — **HIGH**.
  - `apps/api/src/modules/ai-platform/policy/agent-policy.service.ts:23-35,51-73` — `actor` и `agentId` независимы; grants/scopes загружаются по `agentId`, но evaluator проверяет только machine actor type. Actor A может получить решение по permissions Actor B при ошибке adapter/gateway — **HIGH**.
  - `apps/api/src/modules/ai-platform/grants/agent-grant.service.ts:96-126,169-204` и `apps/api/src/modules/ai-platform/ai-platform-audit.service.ts:33-53` — security mutation коммитится до отдельной Audit write. При отказе Audit API возвращает ошибку, но grant/scope уже активен и не имеет audit row — **HIGH**.
  - `packages/shared/src/ai/policy-evaluator.ts:82-88` — отсутствующая `targetDataClassification` пропускает classification check. Для `drive.read_task_artifact` с ceiling `INTERNAL` вызывающий код может не передать classification и получить ALLOW для SECRET resource, вопреки canonical `Default is DENY when required policy information is missing` — **HIGH**.
  - `apps/api/src/modules/ai-platform/auth/agent-auth.guard.ts:9-14,82-88` — клиентский `x-nbos-agent-channel` может пометить REST-вызов как MCP и подменить protocol provenance в Actor/Audit — **MEDIUM**.
  - `apps/api/src/modules/ai-platform/credentials/agent-credential.service.ts:120-145` — `previousValidUntil` не валидируется и перезаписывает более ранний `expiresAt`; rotation может продлить старый credential до произвольной даты — **MEDIUM**.
  - `apps/api/src/modules/ai-platform/credentials/agent-credential.service.ts:105-145` и `packages/database/prisma/schema/ai-platform.prisma:64` — overlap оставляет predecessor неотозванным, но `rotatedFromId` unique; повторная rotation того же predecessor проходит service checks и падает необработанным unique violation вместо deterministic conflict — **MEDIUM**.
  - `apps/api/src/modules/ai-platform/credentials/agent-token.ts:16-20,61-78` и `apps/api/src/modules/ai-platform/auth/agent-authenticator.service.ts:65-76` — parser принимает key/secret произвольного алфавита и длины, а unknown key выполняет fresh hash короткой константы вместо того же dummy-verify path. Заявленная canonical validation/timing parity не обеспечена и не протестирована — **MEDIUM**.
  - `apps/api/src/modules/ai-platform/credentials/agent-credential.service.ts:67-94,125-161` — credential row/rotation коммитятся до Audit write; при отказе Audit одноразовый token не возвращается, а predecessor уже может быть отозван, что оставляет недоступный новый credential и возможный lockout — **MEDIUM**.
  - `apps/api/src/modules/ai-platform/policy/agent-policy.service.ts:81-93` — Audit failure при DENY заменяет безопасный deterministic agent error на внутреннюю ошибку, хотя доступ остаётся закрыт — **MEDIUM**.
  - `packages/shared/src/ai/policy-evaluator.ts:94-105` и `packages/shared/src/ai/policy-error-mapping.ts:119-133` — scope проверяется до rate-limit: throttled agent получает 404 для чужого id и 429 для разрешённого, превращая status code в scope oracle — **MEDIUM**.
  - `packages/database/prisma/schema/ai-platform.prisma:128`, `packages/database/prisma/migrations/20260821170100_ai_external_agent_indexes/migration.sql:13`, `apps/api/src/modules/ai-platform/grants/agent-grant.service.ts:169-189` — unique key RESOURCE scope не содержит `resourceType`; grant с тем же `scopeId` другого типа upsert-ом заменяет существующий scope — **MEDIUM**.
  - `packages/database/prisma/migrations/20260821170000_ai_external_agent_foundation/migration.sql:14-122` и `packages/database/prisma/migrations/20260821170100_ai_external_agent_indexes/migration.sql:7-25` — uniqueness отсутствует после первой migration и добавляется пачкой из 10 non-transactional `CREATE INDEX CONCURRENTLY` без retry protection. Частичный отказ оставляет созданные/возможные INVALID indexes и failed Prisma migration, требующую ручного recovery до повторного deploy — **MEDIUM (operational)**.
  - `packages/database/prisma/schema/ai-platform.prisma:29,62,67,89,93,116,120` — FK-поля `createdById` / `grantedById` / `revokedById` не индексированы; employee offboarding/delete с `RESTRICT`/`SET NULL` будет сканировать растущие agent tables, несмотря на E 106 `[x]` — **MEDIUM**.
  - `packages/shared/src/ai/capability-catalog.write.ts:54-63,88-97` — `tasks.submit_review` имеет `risk: LOW` и `idempotency: NOT_REQUIRED`, хотя canon задаёт `risk: MEDIUM`, `idempotent: true`; `tasks.start` также объявлен `NOT_REQUIRED`, несмотря на retry-sensitive semantic mutation — **MEDIUM**.
  - `apps/api/src/modules/ai-platform/auth/agent-authenticator.service.ts:56-125`, `apps/api/src/modules/ai-platform/credentials/agent-credential.service.ts:105-162`, `packages/shared/src/ai/policy-evaluator.ts:45-112` — функции имеют соответственно 70, 58 и 68 строк при лимите 50 — **LOW**.
  - `docs/NBOS/02-Modules/21-AI-Platform/10-Phase-1-AI-Foundation-and-External-Agent-Implementation.md:215` — evidence называет отсутствующий `AI_FORBIDDEN_CAPABILITY_KEYS`; фактический symbol — `AI_CAPABILITIES_FORBIDDEN_PHASE_1` — **LOW**.
- Точный список правок для исполнителя:
  1. Сделать `REVOKED` необратимым на уровне service transition и атомарного DB predicate; учитывать `revokedAt` в effective state и credential issuance. Добавить тесты `revoke → disable`, `revoke → enable`, `revoke → issue` и race/conditional-update.
  2. Убрать независимый caller-supplied `agentId` из policy boundary либо обязательно проверить `actor.type === EXTERNAL_AGENT && actor.id === agentId` до DB reads. Добавить negative test Actor A + Agent B grants/scopes.
  3. Выполнять capability/scope mutation и AuditLog write в одной транзакции либо через durable outbox. Добавить audit-failure tests, доказывающие отсутствие активного неаудированного grant/scope.
  4. При policy DENY сохранить исходный safe `AgentAccessException` даже при недоступном Audit, с безопасным fallback log/metric или durable audit delivery.
  5. Не доверять channel header клиента: protocol/channel должен задаваться server-side REST/MCP adapter/route metadata. Добавить spoofing test.
  6. Не разрешать overlap продлевать исходный expiry; валидировать future timestamp. Максимальное окно вынести в именованную, отдельно утверждённую policy-константу и покрыть boundary tests.
  7. Реализовать полное безопасное auth observability либо вернуть G 139 в `[~]`; исправить статусы D 85/90, E 101, F 118/119, I 172 и J 176/178 до повторной проверки.
  8. Разбить три функции длиннее 50 строк, удалить/использовать dead `authFailed` и синхронизировать фактическое имя forbidden-capability constant в docs.
  9. Сделать classification fail-closed: обязательная classification для classification-sensitive capabilities либо safe default `SECRET`; добавить missing-classification negative test.
  10. Проверять rate limit до scope-sensitive результата либо унифицировать throttled response так, чтобы 429/404 не раскрывали наличие scope; добавить enumeration test.
  11. Включить нормализованный `resourceType` в RESOURCE uniqueness без нарушения uniqueness non-RESOURCE rows; потребуется новая forward-fix migration и schema/service tests.
  12. Исправить catalog по canon: минимум `tasks.submit_review` → `MEDIUM` + `REQUIRED`; классифицировать `tasks.start` как retry-sensitive и покрыть metadata contract tests. Вернуть H 145/149 и J 177/183/191 в `[~]` до исправления.
  13. Валидировать token до DB как exact canonical shape: 18 hex chars для `keyId`, 64 hex chars для `secret`; unknown key проверять через заранее созданный dummy argon2id verifier тем же `verify` path. Добавить malformed/oversized/non-hex и dummy-path tests.
  14. Сделать rotation predecessor одноразовым и конкурентно безопасным: deterministic conflict при уже существующем `rotatedTo`, conditional update/transaction и retry tests для overlap rotation.
  15. Включить issue/rotate и соответствующий AuditLog в одну transaction/durable delivery boundary, чтобы audit failure не терял одноразовый token и не отзывал рабочий predecessor без успешного ответа. В Chat 4 добавить integration test реального `@Public()` + `AgentAuthGuard` + global employee guards.
  16. До production отдельно утвердить recovery-safe форму index migration. Поскольку обе migration уже applied на dev, не редактировать их молча: либо пересоздать только disposable dev branch/history и разбить concurrent indexes по одной migration, либо протестировать и задокументировать recovery (`INVALID` cleanup + `prisma migrate resolve`) на disposable branch. Production deploy должен останавливаться, если `170100` не завершилась.
  17. Добавить отдельной forward-fix migration индексы для employee FK columns, убрать действительно redundant single-column `agentId` indexes после проверки планов, и перевести E 106/108 в `[~]` до real-DB migration/persistence test.
- Долги для следующего милстоуна:
  - Chat 3 не начинать до исправления HIGH/MEDIUM defects и повторной проверки этого milestone;
  - после исправлений добавить real-DB integration smoke для issue/auth/grant/scope и проверить DML-права runtime `app_user`;
  - J 186 остаётся `[~]`: counters/windows/rate limits не реализованы;
  - classification mapping и обязательная передача canonical resolved Work Space остаются входными условиями Chat 3.
  - синхронизировать `99-AI-Cleanup-Register.md`: C2 уже частично закрыт runtime wiring, C4–C6 больше не `MISSING`, но остаются открытыми до устранения дефектов этой проверки.
- Не проверено:
  - production БД и production migration status — намеренно не запрашивались;
  - миграции не применялись, данные не изменялись;
  - реальный CRUD через Prisma на dev DB не выполнялся;
  - DML-права `app_user`, default privileges и recovery частично применённого concurrent-index batch;
  - история команд исполнителя и green baseline до его изменений;
  - REST/MCP/E2E отсутствуют по scope; worker/scheduler не перезапускались проверяющим отдельно.

## Re-verification (Chat 2)

- Проверял: GPT-5.6 Sol, 2026-08-21.
- Вердикт: **FAIL**.
- Git:
  - ветка `sipan`, `HEAD 8171715b40ac018ab9eff044dcfd8828e720e8ff`, совпадает с `origin/sipan`;
  - staged-файлов и удалённых файлов нет; дерево не чистое: 59 changed paths;
  - `git diff --check HEAD` прошёл.
- Запущено:
  - `pnpm --filter @nbos/database exec prisma migrate status` → 213 migrations, `Database schema is up to date!`;
  - `pnpm --filter @nbos/database exec prisma validate` → schema valid;
  - `pnpm vitest run apps/api/src/modules/ai-platform packages/shared/src/ai` → 14 files, 213 tests passed;
  - `pnpm vitest run` → 747 files, 3689 tests passed, 94.90s;
  - `pnpm typecheck` → 6 packages in scope, 5 successful tasks / 5 total;
  - прямые `tsc --noEmit` для `@nbos/shared`, `@nbos/database`, `@nbos/api` → passed;
  - `pnpm lint` → 0 errors, 13 warnings (11 web + 2 api, вне milestone diff);
  - `prisma migrate diff --from-config-datasource --to-schema prisma/schema --exit-code` → exit 2; среди общего ранее существовавшего drift найден один AI-specific drift: Prisma хочет переименовать `external_agent_resource_scopes_agent_scope_resource_key`.
- Подтверждённые исправления:
  - revocation теперь определяется также по `revokedAt`; update/disable/enable и credential issue не восстанавливают revoked identity;
  - policy principal берётся из `actor.actor.id`, независимый `agentId` удалён;
  - credential/grant/scope mutations передают transaction client в Audit;
  - channel берётся из server-side route metadata, spoofed header/path игнорируются;
  - rotation проверяет future/bounded overlap и одноразового predecessor;
  - token parser проверяет canonical hex shape; unknown key проходит decoy `argon2.verify`;
  - classification стала fail-closed для отмеченных capability; rate limit проверяется до scope;
  - RESOURCE uniqueness включает нормализованный `resourceType`; employee FK indexes добавлены;
  - catalog metadata для `tasks.start` и `tasks.submit_review` исправлена;
  - запрещённые `any`, default exports, `console.log`, прямые Tasks/Drive writes, сырые secrets и удалённые тесты не найдены; prod/test files AI Platform не превышают 300 строк.
- Расхождения с remediation-самоотчётом:
  - утверждение «all seventeen prescribed fixes are addressed» неверно: fix 16 только описан как риск; recovery не репетировался и migration не стала recovery-safe;
  - checklist утверждает, что lifecycle mutation и audit коммитятся вместе, но `ExternalAgentService` всё ещё пишет Audit после завершения mutation/transaction;
  - `prisma migrate diff → no drift for the AI tables` опровергнуто AI-specific index-name drift;
  - lint имеет 13 warnings, а не заявленные 15;
  - 7-дневное overlap window в тесте названо approved, но отдельного утверждения этого security-sensitive значения не зафиксировано.
- Найденные дефекты:
  - `apps/api/src/modules/ai-platform/agents/external-agent.service.ts:72-87,100-118,140-155,193-203` — create/update/disable/enable/revoke коммитят lifecycle mutation до отдельного Audit write. Особенно `enable()` может активировать agent без audit row при отказе Audit, хотя checklist прямо заявляет атомарность — **HIGH**.
  - `apps/api/src/modules/ai-platform/grants/agent-grant.service.ts:62-66,140-147,245-257` — проверка terminal revocation выполняется до grant transaction без блокировки agent row. Конкурентный revoke между check и upsert позволяет записать новый grant/scope уже revoked agent, вопреки заявленному invariant — **MEDIUM**.
  - `packages/database/prisma/schema/ai-platform.prisma:134` и `packages/database/prisma/migrations/20260821180000_ai_agent_scope_uniqueness_and_fk_indexes/migration.sql:21-22` — schema не закрепляет фактическое имя unique index через `map`, поэтому `migrate diff` обнаруживает AI drift и предлагает rename — **MEDIUM**.
  - `packages/database/prisma/migrations/20260821170100_ai_external_agent_indexes/migration.sql:7-25` — десять concurrent indexes всё ещё находятся в одном non-transactional migration; частичный failure/retry не исправлен и recovery не репетировался. Документирование caveat не закрывает fix 16 — **MEDIUM (operational)**.
  - `apps/api/src/modules/ai-platform/ai-platform.constants.ts:32-38` и `credentials/agent-credential.service.test.ts:186-203` — security-sensitive maximum overlap самостоятельно установлен в 7 дней и назван approved без зафиксированного решения — **BUSINESS/SECURITY DECISION REQUIRED**.
  - `apps/api/src/modules/ai-platform/grants/agent-grant.service.ts:136-191` — `grantScope()` всё ещё длиннее лимита 50 строк, несмотря на заявленное закрытие size violation — **LOW**.
  - `apps/api/src/modules/ai-platform/credentials/agent-token.ts:93-104` — `timingSafeEqualToken` используется только собственным unit-test и не имеет production consumer; это оставшийся dead helper — **LOW**.
- Точный список правок для исполнителя:
  1. Перенести все External Agent lifecycle mutations и соответствующий AuditLog в один `$transaction`; передавать `tx` в `logLifecycle`. Добавить audit-failure tests для create/update/enable/disable/revoke и доказать, что mutation не остаётся committed без audit.
  2. Сериализовать grant/scope с revoke через одинаковую блокировку agent row внутри transaction; terminal state проверять после lock. Добавить race-oriented test.
  3. Закрепить имя resource-scope unique index в Prisma schema через `map` на уже созданное migration имя и повторить AI-focused migrate diff.
  4. Реально закрыть migration 170100: либо пересоздать disposable dev history и разделить concurrent indexes на retry-safe migrations, либо отрепетировать и зафиксировать recovery на disposable branch. Одного caveat недостаточно.
  5. Получить явное решение по максимальному credential overlap; до него отметить пункт как `[!]`/`[~]`, а не `approved`.
  6. Разбить `grantScope()` до лимита и удалить `timingSafeEqualToken`, если production use-case отсутствует.
- Не проверено:
  - production БД и production migrations;
  - реальные rollback/locking semantics через integration DB — mock Prisma не моделирует rollback или конкурентные транзакции;
  - DML-права runtime `app_user`;
  - recovery частично упавшего `170100`;
  - REST/MCP/global-guard E2E, которых ещё нет по scope Chat 2.

## Re-verification 2 (Chat 2)

- Проверял: GPT-5.6 Sol, 2026-08-21.
- Вердикт: **FAIL**.
- Git:
  - ветка `sipan`, `HEAD 8171715b40ac018ab9eff044dcfd8828e720e8ff`, совпадает с `origin/sipan`;
  - staged-файлов и удалённых файлов нет; дерево не чистое: 60 changed paths;
  - `git diff --check HEAD` прошёл.
- Запущено:
  - `pnpm --filter @nbos/database exec prisma migrate status` → 211 migrations, `Database schema is up to date!`;
  - `pnpm --filter @nbos/database exec prisma validate` → schema valid;
  - `prisma migrate diff --from-config-datasource --to-schema prisma/schema --exit-code` → остаётся только известный repository-wide drift; `external_agent` / AI-specific entries отсутствуют;
  - `pnpm vitest run apps/api/src/modules/ai-platform packages/shared/src/ai` → 15 files, 224 tests passed;
  - `pnpm vitest run` → 748 files, 3700 tests passed, 107.97s;
  - `pnpm typecheck` → 6 packages in scope, 5 successful tasks / 5 total;
  - прямые `tsc --noEmit` для `@nbos/shared`, `@nbos/database`, `@nbos/api` → passed;
  - `pnpm lint` → 0 errors, 13 warnings (11 web + 2 api, вне milestone diff).
- Подтверждено:
  - все шесть дефектов предыдущей re-verification исправлены;
  - lifecycle mutations и Audit используют один transaction client;
  - grant/scope берут agent row lock внутри transaction до проверки terminal state;
  - Prisma unique-index name закреплён через `map`, AI drift исчез;
  - три AI migration корректно заменены одной transactional additive migration; `CREATE INDEX CONCURRENTLY`, destructive SQL и отдельные forward-fix migrations отсутствуют;
  - решение разработчика `credential overlap = 24 hours` и выбор migration squash подтверждаются историей диалога;
  - `grantScope()` укладывается в 50 строк; files AI Platform не превышают 300 строк; dead `timingSafeEqualToken` удалён;
  - запрещённые `any`, default exports, `console.log`, прямые Tasks/Drive writes, сырые secrets и удалённые тесты не найдены.
- Найденный дефект:
  - `apps/api/src/modules/ai-platform/credentials/agent-credential.service.ts:110-113,220-236` и `apps/api/src/modules/ai-platform/agents/external-agent.service.ts:118-138` — конкурентные credential rotation и agent revoke берут блокировки в обратном порядке. `rotate()` сначала блокирует predecessor credential, затем agent; `revoke()` сначала блокирует agent, затем через `externalAgentCredential.updateMany` пытается блокировать credentials. Интерливинг `rotate: credential locked → revoke: agent locked → rotate waits agent → revoke waits credential` образует PostgreSQL deadlock; одна security transaction будет принудительно отменена без deterministic domain error или retry — **MEDIUM (concurrency/reliability)**.
- Точный список правок для исполнителя:
  1. Установить единый глобальный lock order `agent row → credential row`. В `rotate()` сначала безопасно получить immutable `agentId` predecessor без lock, затем заблокировать/проверить agent, затем заблокировать credential и повторно прочитать/проверить predecessor и successor под lock.
  2. Добавить real-DB concurrency test `rotate ↔ agent revoke`, который запускает обе transaction параллельно и доказывает отсутствие deadlock; mock Prisma не проверяет PostgreSQL lock graph.
- Не проверено:
  - production БД и production migrations;
  - фактический concurrent lock test на PostgreSQL — проверка выявила deadlock статически по порядку lock acquisition;
  - DML-права runtime `app_user`;
  - REST/MCP/global-guard E2E, которых ещё нет по scope Chat 2.

## Re-verification 3 (Chat 2)

- Проверял: GPT-5.6 Sol, 2026-08-21.
- Вердикт: **PASS WITH DEBTS**.
- Git:
  - ветка `sipan`, `HEAD 8171715b40ac018ab9eff044dcfd8828e720e8ff`, совпадает с `origin/sipan`;
  - staged-файлов и удалённых файлов нет; дерево не чистое: 63 changed paths;
  - `git diff --check HEAD` прошёл.
- Запущено:
  - `pnpm --filter @nbos/database exec prisma migrate status` → 211 migrations, `Database schema is up to date!`;
  - `pnpm --filter @nbos/database exec prisma validate` → schema valid;
  - `pnpm vitest run apps/api/src/modules/ai-platform packages/shared/src/ai` → 16 files passed + 1 skipped, 226 tests passed + 2 skipped;
  - `AI_PLATFORM_DB_TEST_URL="$DIRECT_URL" pnpm vitest run apps/api/src/modules/ai-platform/credentials/agent-credential.concurrency.int.test.ts` → 1 file, 2 tests passed against dev Neon in 54.98s;
  - `pnpm vitest run` → 749 files passed + 1 skipped, 3702 tests passed + 2 skipped, 119.70s;
  - `pnpm typecheck` → 6 packages in scope, 5 successful tasks / 5 total;
  - прямые `tsc --noEmit` для `@nbos/shared`, `@nbos/database`, `@nbos/api` → passed;
  - `pnpm lint` → 0 errors, 13 warnings (11 web + 2 api, вне milestone diff).
- Расхождения с самоотчётом: **нет**.
- Подтверждённое исправление:
  - `rotate()` сначала читает immutable `agentId`, затем берёт agent row lock, после него credential row lock и повторно валидирует ownership/state/successor под lock;
  - порядок совпадает с agent revoke: `agent → credential`, поэтому прежнего lock cycle больше нет;
  - unit-test фиксирует порядок acquisition;
  - реальный PostgreSQL-тест выполнил 25 конкурентных `rotate ↔ revoke` раундов без deadlock и отдельно подтвердил terminal state: revoked agent не оставляет live credential;
  - integration test создал и удалил только собственные временные строки на dev branch; production не затрагивался.
- Найденные дефекты: **нет новых блокирующих дефектов**.
- Долги для следующего милстоуна:
  - E 108 остаётся `[~]`: нужен более широкий real-DB smoke `issue → authenticate → grant → scope`;
  - G 140 остаётся `[~]`: реальный `@Public()` + global employee guards wiring появится с protocol controllers;
  - concurrency integration test opt-in и пока не запускается в CI автоматически;
  - grant/scope-versus-revoke lock race подтверждён unit-тестом, но ещё не real-DB concurrency test;
  - J 186 остаётся `[~]`: rate-limit counters/windows не входят в Chat 2.
- Не проверено:
  - production БД, production migration status и production deploy;
  - DML-права runtime `app_user`;
  - REST/MCP/global-guard E2E, которых ещё нет по scope Chat 2.

Chat 2 может быть закрыт; Chat 3 может начинаться с перечисленными долгами как явными entry conditions.
