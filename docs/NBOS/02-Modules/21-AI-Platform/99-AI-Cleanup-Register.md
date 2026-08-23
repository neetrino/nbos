# AI Platform Cleanup Register

> Tracks stale assumptions, runtime gaps and migration work required to reach the AI Platform canon.

## Status legend

- `OK`
- `PARTIAL`
- `MISSING`
- `STALE`
- `BUSINESS DECISION`

## A. Existing foundations to preserve

### A1. PostgreSQL is source of truth — OK

Keep AI as an actor/action layer, never a competing state store.

### A2. BullMQ worker architecture — OK

Reuse for long-running/retryable AI executions.

### A3. Module-owned domain rules — OK

CRM/Tasks/Finance/etc. remain final authorities.

### A4. Drive owns files — OK

AI artifacts must use Drive File Assets.

### A5. Platform Access participation logic — PARTIAL

Useful for resource resolution, but current grants are employee-centric.

## B. Documentation cleanup

### B1. AI described only as Automation Layer feature — OK

Chat 7 rewrote `01-Platform-Overview/02-Platform-Architecture-Layers.md`: AI left the Automation Layer stack diagram, the overview now states that AI Platform is a cross-cutting actor/capability layer running through all five layers, and the automation examples are explicitly labelled as consumers of that layer.

### B2. Old AI Governance `Forbidden / Masked / Allowed` — STALE/PARTIAL

Retain as simplified terminology only. Replace as authorization model with resource/capability/data/risk policy.

### B3. Documents says AI Assistant is future separate module — OK/PARTIAL

Direction is correct. Reference `21-AI-Platform` rather than inventing a Documents-local assistant architecture.

### B4. Roadmap lacks AI Foundation phase — PARTIAL

`00-Implementation-Roadmap.md` now points at the AI Platform Phase 1 checklist and Chat 5 completion. Full roadmap phase numbering vs the eight-chat split remains a docs cleanup, not a runtime gap.

## C. Runtime gaps

### C1. AuditLog requires `userId` — OK

Chat 1 made `userId` optional and added `actorType` / `actorId` / `onBehalfOf*` / channel / protocol / `correlationId` / safe `clientMetadata`.

Historical rows are backfilled as `USER` + `actorId = userId`. Human `AuditService.log({ userId })` still works and also writes actor fields. Machine actors write `userId = null`.

Migration: `20260821150000_audit_actor_aware`.

### C2. Audit actor attachment resolves only Employee — OK

Employees still resolve by id. Machine actors resolve through `AuditActorLookups` (`ExternalAgentService.resolveDisplayNames`). Unresolved ids fall back to the type label.

### C3. ResourceAccessGrant requires `employeeId` — OK

Agent access lives in `external_agent_*` tables only. Nothing inserts an AI principal into `ResourceAccessGrant.employeeId`.

### C4. No External Agent entity/credential registry — OK

Chat 2: `ExternalAgent` + `ExternalAgentCredential`, argon2id issue/rotate/revoke.

### C5. No capability registry/policy evaluator — OK

Shared registry + `evaluateAiPolicy`. Domain execution is Chat 3 (`AgentCapabilityGateway`).

### C6. No agent-specific machine auth guard — OK

Chat 2: `AgentAuthGuard` / `AgentAuthenticatorService`. Protocol wiring is Chat 4.

### C7. No AI execution record/correlation model — OK

Chat 11: `AiExecution` stores actor, External/Internal Agent, provider, model, Model Policy, capability, channel, correlation, status, latency, retry, fallback and optional token/cost/pricing metadata. No prompt/completion/secret columns. External Agent protocol writes capability rows best-effort. See C19.

### C8. No idempotency contract for agent mutations — PARTIAL

Capability metadata declares `REQUIRED`. Chat 3 stores replay rows in `external_agent_idempotency_records` and enforces them in the gateway. Chat 11 checkpoints `responseJson` while the row is still `IN_PROGRESS` after Tasks/Drive commit, then marks `COMPLETED`. Retry of `IN_PROGRESS` + json replays and tries to complete. Stale `IN_PROGRESS` without a checkpoint still conflicts (no second domain write). Chat 12 closed the crash window for the five Tasks write capabilities by committing the domain change and the checkpoint in one transaction; `tasks.attach_artifact` keeps the window because its object-store write cannot join a database transaction. See C24.

### C9. No external-agent rate-limit policy — OK

Chat 7 shipped section U. Chat 11 moved counters to `AgentRateLimitStore`: Redis when `REDIS_STATE_URL`/`REDIS_URL` is set (shared multi-instance ceiling, fail-closed on errors), otherwise process memory. Vitest uses memory unless `AI_RATE_LIMIT_REDIS_IN_TEST=1`. `AgentProtocolInvoker` now passes a live `rateLimitExceeded` verdict into `AgentPolicyService.evaluate` before throwing `AGENT_RATE_LIMITED` with `Retry-After` (J 186). Production `rediss://` TLS evidence is still an operational gap, not a missing store.

### C10. Provider/model/Internal Agent foundation — OK

Chat 5: OpenAI/Anthropic adapters, AES-256-GCM provider secrets, model catalog sync without auto-activate, FIXED/PRIMARY_FALLBACK policies, Internal Agent lifecycle. Chat 6: Settings → AI & Agents employee admin UI and Work Space AI Access over the same services. Chat 7 closed the scheduler gap: `ai-model-catalog-sync` is a Nest cron on the scheduler process (`SchedulerAiService` → `runScheduledCatalogSync`, shared lease, `rosterIntent: 'off'`), reached through the new `AiPlatformCoreModule` so the scheduler gets AI services without mounting the External Agent or admin HTTP surface. Lease ownership is fenced in the database: the sync locks its `scheduler_leases` row for the running owner and fencing token as the first statement of the write transaction (`isSchedulerLeaseHeld`), so a lease lost mid-transaction commits nothing and a successor cannot write in parallel. The same job is dispatchable from the Settings manual runner under that lease.

### C11. Idempotent replay ignored later revocation — OK

Chat 7 added `AgentReplayAuthorization`. Before `AgentCapabilityGateway` returns a stored result, the policy is re-evaluated for the original target, so a capability grant or resource scope revoked after the first success is not honoured by a retry. This is not AL 626: it re-authorizes after the first domain commit, while 626 asks for revalidation of a queued action immediately before its own commit, which Phase 1 has no deferred execution path for.

### C12. Expired agent could be re-enabled without extending expiry — OK

Chat 7: `ExternalAgentService.enable` refuses an agent whose `expiresAt` has elapsed, including a `DISABLED` agent. The expiry must be extended first, so a disabled agent cannot become live later as a side effect of an unrelated edit. An agent that only timed out (`EXPIRED`, or `ACTIVE` past its expiry) returns to service when the expiry is extended — it was never disabled by a human decision — and the runbook states the difference explicitly.

### C13. Provider key preflight failures were not audited — OK

Chat 7 added `PROVIDER_KEY_PREFLIGHT_VALIDATED`. Replacement-key validation and rotation now audit both success and failure with the acting employee, and `lastValidatedAt` is only stamped while the connection is still `ACTIVE`, so a concurrent disable cannot leave a stale "validated" timestamp.

### C14. Audit backfill migration needs a production window — PARTIAL

`20260821150000_audit_actor_aware` performs a full-table `UPDATE` on `audit_logs` and builds two indexes without `CONCURRENTLY`. Validated on dev data (339 rows, 0 rows left without `actor_type`). Per `docs/deployment/AUTOMATED-PRODUCTION-DATABASE-MIGRATIONS-STANDARD.md` §9 this class of change needs explicit approval and a maintenance window on a large production `audit_logs`; the migration itself must not be edited after being applied.

### C15. Prompt policy/version domain (AD 470–481) — OK

Chat 9 added `AiPromptPolicy` / `AiPromptVersion` with DRAFT / TESTING / PUBLISHED / RETIRED, publish/rollback, digest-only audit, and a real FK from `InternalAiAgent.promptPolicyId`. Assignment and activation accept only a policy that currently has a PUBLISHED version. Prompt text cannot grant capabilities or scopes. Migration `20260822180000_ai_prompt_policy_context_foundation` is additive; invalid Chat 8 free-form ids are nulled before the FK. The migration is **not** applied to production.

### C16. Context / memory / knowledge contracts (AE 482–496) — OK

Chat 9 added the Context Assembler, session-context, disabled persistent-memory and authorization-first Knowledge/RAG contracts in `@nbos/shared`, with thin Nest wrappers. Assembly requires an ALLOW bound to the same actor, capability, matched scope and classification ceiling, and only purpose-built projections. Secret-shaped fields are rejected recursively (nested objects/arrays). Persistent memory and knowledge retrieval stay disabled. No vector store. Chat N9 closed **PASS WITH DEBTS**; see `28-Phase-1-Chat-9-Handoff.md`.

### C17. Approval request persistence (AF 499–516) — OK

Chat 10 added `AiApprovalRequest` with PENDING / APPROVED / REJECTED / EXPIRED / CANCELLED / CONSUMED, payload digest binding, employee-only decisions, AI self-approval prohibition, expiry by risk TTL, and consume-time revalidation of actor/grant/domain state. Audit emits request/decision/cancel/expiry/consumption. Admin queue HTTP + UI list exist. Migration `20260822210000_ai_approval_request_foundation` is additive and **not** applied to production. See `29-Phase-1-Chat-10-Handoff.md`.

### C18. Customer-facing AI policy contracts (AG 518–527, 531) — OK

Chat 10 added DRAFT_ONLY / APPROVAL_REQUIRED / AUTO_SEND_ALLOWED, distinct `messenger.reply_draft` vs `messenger.reply_send`, conversation/customer isolation, escalation reasons, and INTERNAL_ONLY vs CUSTOMER_VISIBLE. Customer text remains untrusted and cannot widen capabilities. AUTO_SEND_ALLOWED with an empty category list still requires approval. Production Messenger auto-reply was not built. Negative tests cover cross-customer isolation and prompt-injection shaped fields.

### C19. Usage, cost and evaluation entities (AH 532–546, 548; AI 549–554) — OK

Chat 11 added `AiExecution`, `AiBudgetLimit`, `AiEvaluationSuite` / `Dataset` / `Run`, and `AiModel.evaluationStatus`. Execution rows never store prompts or secrets. A run has exactly one grading kind. Evaluation scores cannot auto-activate a model. Migration `20260822220000_ai_usage_evaluation_foundation` is additive and **not** applied to production. See `30-Phase-1-Chat-11-Handoff.md`.

### C20. Anthropic provider never exercised live — PARTIAL

Chat 8 ran the AP walk with a real OpenAI key supplied by the developer: connect, validate, sync (124 models), activate/disable, FIXED and PRIMARY_FALLBACK policies, Internal Agent DRAFT → ACTIVE. No Anthropic test key was supplied, so AP 689–691 and the cross-provider fallback case AP 697 rest on `anthropic.adapter.test.ts`, `ai-model-sync.service.test.ts` and `ai-model-policy.rules.test.ts` rather than a live provider call. Closing this needs nothing but a key.

### C21. AI & Agents was a Settings sub-page — OK

Chat 8 promoted it to a first-class sidebar module at `/ai-agents` (`SIDEBAR_MODULE_KEYS`, `NAV_MODULE_DEFINITIONS` with the nine section children, module visual). `/settings/ai-agents/*` now issues a temporary redirect so existing links and the runbooks keep working. RBAC is unchanged: `COMPANY:EDIT`, the same permission the `ai-admin` controllers require.

### C22. Phase 1 exit criterion 9 — RESOLVED

`27-Phase-1-Continuation-After-Chat-8.md` decided AD–AI stay in the current Phase 1 (Chats 9–12). Chat 9 closed AD/AE (C15, C16). Chat 10 closed AF/AG (C17, C18). Chat 11 closed AH/AI (C19 / C7) and the actionable Chat 8 product-code debts listed in `30-Phase-1-Chat-11-Handoff.md`. The 2026-08-23 final closure gate walked AD–AI first-hand and recorded **PHASE 1 CLOSEABLE**. Exit criterion 9 is met. Phase 1 is officially complete. Post-Phase-1 debts are `32-Post-Phase-1-Technical-Debt-Plan.md`, not a continuation of this phase.

### C23. Concurrent Task creation returned HTTP 500 — FIXED

Found first-hand in Chat 12 and present in no earlier handoff. `TasksService.generateCode()` (`apps/api/src/modules/tasks/tasks.service.ts`) reads the highest existing `T-<year>-NNNN` code and then inserts, outside any lock or transaction, so two concurrent creates compute the same code and the second loses on the unique `Task.code` constraint. Six concurrent `POST /api/v1/agent/workspaces/{id}/tasks` calls with six distinct idempotency keys returned `201,500,500,500,500,500`; a 26-request burst returned 6 accepted, 2 rate-limited and 18 × 500.

The defect is Tasks-owned and pre-existing — it predates the AI Platform work and no AI Platform checklist item is falsified by it. It blocks Phase 1 anyway, because the External Agent surface is the first caller that makes it routine: Phase 1 exists for parallel coding agents and `AGENT_CONCURRENCY_LIMIT` explicitly permits eight in-flight invocations per agent. Exit criteria 1 and 2 therefore fail on reliability while passing on authorization.

The error boundary was not at fault: the agent received `AGENT_INTERNAL_ERROR` with a request id, and no Prisma text, table name or file path leaked.

**Fixed in Chat 12** with a server-side allocator, on the developer's decision. Migration `20260823000000_entity_code_counters` adds `entity_code_counters (scope, year, next_value)` and seeds the `TASK` scope from existing codes, comparing suffixes numerically. `allocateEntityCodeNumber` (`apps/api/src/common/utils/entity-code-counter.ts`) reserves a number with one `INSERT … ON CONFLICT DO UPDATE … RETURNING`, so PostgreSQL serializes concurrent callers on the counter row instead of letting them compute the same value. `TasksService.generateCode` no longer reads the tasks table at all, which also removes a full prefix scan from every create. Numbers are reserved rather than reissued, so a failed insert leaves a gap; gaps are acceptable in a human-readable code, duplicates are not.

Verified: the exact reproduction that returned `201,500,500,500,500,500` now returns `201,201,201,201,201,201`; at the `AGENT_CONCURRENCY_LIMIT` ceiling, 24 creates over 3 rounds of 8 produced 24 unique codes and zero server errors. Regression: `entity-code-counter.int.test.ts` (opt-in, real database) allocates 40 numbers concurrently and asserts they form exactly `1..40`. Evidence: `31-Phase-1-Final-Acceptance.md`.

**That first fix was incomplete**, as the independent review found. Three services write the `T-<year>` series, not one: `SupportService.createExecutionTask` and `AutoTasksService` each carried their own `max(tasks)+1` generator and inserted through Prisma directly. Converting only `TasksService` left two sources of truth for one series and made the failure _easier_ to reach — a single `max`-derived insert leaves the counter behind the table, and the next ordinary create then collides with no concurrency at all. Completed by routing every writer through `allocateTaskCode` (`apps/api/src/modules/tasks/task-code-generation.ts`), the one supported entry point; the private generators are gone. Regression: `task-code-allocation.int.test.ts` drives Tasks and Automation concurrently against a real database and asserts distinct codes, and each service's unit tests assert that the tasks table is never read for a code. Because the counter and `max(tasks)` cannot both be authoritative, the rollout requires a write pause rather than a rolling deploy — sequence in C9 of `../05-Tasks/04-Tasks-Cleanup-Register.md`.

### C25. The same read-then-insert race exists in sibling code series — FIXED

Found while fixing C23 and originally deferred because these are independent series outside the Phase 1 External Agent surface. Inventory (post-Phase-1 Chat 2) confirmed seven affected production series besides Tasks `T-`: Invoice `INV-`, Support Ticket `TKT-`, Deal `D-`, Lead `L-`, Order `ORD-`, Subscription `SUB-`, Project `P-`. Every one used `findFirst(orderBy code desc)` + parse + 1, including the lexicographic `9999` > `10000` trap.

Scope correction: the Task writers in Support and Automation belonged to C23 and were already fixed. A race inside `INV-` cannot corrupt `T-`.

**Implemented in post-Phase-1 Chat 2.** Each series has a named `ENTITY_CODE_SCOPE` and a single allocate entry point over `allocateEntityCodeNumber`. All writers of a series moved together. Seed migration `20260823120000_seed_sibling_entity_code_counters` computes the numeric max per year and ignores malformed historical codes. Gaps after a failed reservation remain acceptable; duplicates are not.

Rollout is **not** rolling-deploy safe: mixed old `MAX(table)` writers and new counter writers leave the counter behind the table. Write pause + seed + cutover is required. Sequence and writer inventory: `34-Post-Phase-1-Chat-2-Code-Allocator-Handoff.md`.

**Independent verifier (NEW CHAT 2) closed this item.** Disposable local Postgres (`AI_PLATFORM_DB_TEST_URL`): concurrent named allocators, invoice `9999` → `10000`, numeric seed `VALUES` + SQL replay (`2026=10000`, malformed ignored), parallel Lead + Support creates. Designated non-prod Neon was inspected read-only (sibling counters absent; no 10+ digit suffixes; seed **not** applied). Tasks ownership and Drive lifecycle were not changed. Production apply of the seed remains an operations step under the write-pause sequence.

### C24. Gateway idempotency slot is never reclaimed (checklist 209) — FIXED for Tasks, PARTIAL for Drive

Chat 12 reproduced all three crash windows directly against `AgentIdempotencyService`. Chat 11's `responseJson` checkpoint works: a crash after the checkpoint replays the stored result and self-heals the row to `COMPLETED`. The residue was real — `loadLive` returns `IN_PROGRESS` rows _before_ it evaluates expiry, so a reservation that crashed between the domain commit and the checkpoint stayed `409 An identical request is already in progress` permanently, even after its TTL elapsed.

Moving the expiry check above that branch would have been the wrong fix: it frees the key after the TTL, but the retry then re-executes the domain action and creates a second task. The stuck key was fail-closed on purpose. The resolution has to remove the window, not reopen the key.

**Fixed for Tasks in Chat 12** by committing the domain change and the idempotency checkpoint in one transaction, on the developer's decision. `AgentCapabilityGateway.commitDomainWithCheckpoint` opens a transaction for the five capabilities whose domain change is nothing but database writes (`tasks.create`, `tasks.update`, `tasks.start`, `tasks.comment`, `tasks.submit_review`) and hands the same client to the domain service and to `checkpointCommittedResult`. There is no longer a state where the task is committed and the checkpoint is not: either both are durable, or the transaction rolls back and the reservation is released for a clean retry.

The Tasks write paths and their helper operations now accept that client (`TasksDbClient`, a narrow `Pick` rather than a `PrismaClient | TransactionClient` union, which exceeds the TypeScript instantiation depth). Callers that pass nothing keep the previous autocommit behaviour, so human RBAC paths are unchanged.

Evidence: `agent-write-atomicity.int.test.ts` (opt-in, real database) fails the surrounding transaction after `TasksService.create` and asserts no task survives — a mock could only show which client was passed, not that the write joined that transaction, and a single leftover `this.prisma` would have escaped it. `agent-capability.gateway.test.ts` asserts that the domain call and the checkpoint receive the same transaction, that a failing checkpoint releases the reservation instead of pinning it, and that Drive does not open a transaction.

The counter reservation must stay outside this transaction (C26). Putting `allocateTaskCode` on the interactive client reintroduced a 500 on concurrent `tasks.create` after the two remediations landed together.

**Still PARTIAL for `tasks.attach_artifact` — accepted post-Phase-1 debt.** Its domain change includes an object-store write, which cannot join a database transaction, so it keeps the sequential path and the narrow window remains there. The window is fail-closed: no second artifact or Task link is written. Closing it needs an outbox or a domain operation record (Workstream 1 in `32-Post-Phase-1-Technical-Debt-Plan.md`). The overall checklist item 209 stays `[~]` and must not be marked `[x]`. `27-Phase-1-Continuation-After-Chat-8.md` officially accepts this residual so Phase 1 can close without pretending the Drive path is atomic.

### C26. Shared K209 transaction holds the Task-code counter lock — FIXED

Found first-hand in the independent re-acceptance after `6be85612` + `dde78e46`. The five Tasks write capabilities open one Prisma interactive transaction for the domain write and the idempotency checkpoint. The first fix ran `allocateTaskCode` on that same client, so the counter upsert held `(TASK, year)` until the whole task+checkpoint committed.

PostgreSQL serializes those upserts on the single row. Six concurrent `POST /api/v1/agent/workspaces/{id}/tasks` calls queued behind the first in-flight create and expired Prisma's 5000 ms interactive-transaction timeout (~5.7–5.9 s) inside `allocateEntityCodeNumber`. The agent saw HTTP 500 `AGENT_INTERNAL_ERROR`. No `P2002` — this is not the original C23 collision.

**Fixed in Chat 12.** Two nested mechanisms, both required:

1. Reserve the number in a short committed statement _before_ `BEGIN`, then pass the code into the task+checkpoint transaction. Doing the upsert on `this.prisma` _inside_ the interactive callback still opened six transactions first.
2. Run policy and owner lookup before `BEGIN` as well. api `poolMax` is 5. Six interactive transactions that then called `this.prisma` for policy held every connection and deadlocked (`Unable to start a transaction in the given time` / expired transaction at ~5.7 s). The interactive transaction now only writes the task and the checkpoint.

The `$transaction` timeout was not raised. A failed create may skip a number; that is the existing reserve-not-reissue contract.

Evidence: `agent-capability.gateway.test.ts` asserts prepare → reserve → `BEGIN`. `agent-create-concurrency.int.test.ts` drives six concurrent `invoke('tasks.create')` on a real database. Live REST after the committed fix `5ed6c5ea`, fresh SWC `dist` on `:4110`: six parallel `POST /api/v1/agent/workspaces/{id}/tasks` returned `201 × 6`, codes `T-2026-0823`–`T-2026-0828`, no 500, no `P2002`.

**Not reopened by Phase 1 close:** item 209 / `tasks.attach_artifact` remains `[~]` (C24) as accepted post-Phase-1 Workstream 1.

## D. Tasks alignment issues to verify before implementation

### D1. Canon/runtime status vocabulary — PARTIAL

Tasks documentation, cleanup register and current Prisma must be reconciled before exposing semantic agent actions. External API must follow actual accepted lifecycle and not preserve obsolete statuses accidentally.

### D2. Extension Work Space legacy/runtime shape — PARTIAL

Canon says Extension uses parent Product Work Space. Chat 3 resolves Extension delivery ids to the Product Work Space before policy (`resolveCanonicalWorkSpace` / `canonicalWorkspaceScopeId`) and never scopes against `extensionId`. Legacy columns still exist on `WorkSpace`.

### D3. Task discussion author identity — OK

`TaskDiscussionEntry` is Tasks-owned. Authorship is `ActorContext` (`actorType` / `actorId` / `actorDisplayName`). External Agents are not forged as Employees. Messenger is not involved.

### D4. Review/completion behavior — PARTIAL

Expose semantic `submit_review`; do not grant generic completion if human review/completion rules are not fully safe.

## E. Security decisions

### E1. Credentials access in Phase 1 — DECIDED

No secret access.

### E2. Arbitrary SQL/database tool — DECIDED

Forbidden.

### E3. External client messaging in Phase 1 — DECIDED

Not included.

### E4. Finance mutation by external AI — DECIDED

Not included.

### E5. MCP in Phase 1 — STALE

Cleanup previously said MCP was optional. That is stale.

Canonical Phase 1 sources (`03`, `08`, `09`, `10` item 43, `16`) require both REST and MCP as protocol adapters over one Actor → Policy → Capability → Domain Action → Audit path. Chat 4 implements both.

## F. Chat 1 evidence

2026-08-21: ActorContext + actor-aware Audit shipped. See `17-Phase-1-Chat-1-Handoff.md`.

## F2. Chat 2 evidence

2026-08-21: External Agent identity, credentials, grants, scopes, Policy Evaluator. See `18-Phase-1-Chat-2-Handoff.md`.

## F3. Chat 3 evidence

2026-08-21: Domain Action Gateway, Workspace/Tasks/Drive capabilities, Tasks-owned discussion, Drive classification mapping, idempotency store. See `19-Phase-1-Chat-3-Handoff.md`.

## F4. Chat 4 evidence

2026-08-21: External Agent REST and MCP. See `20-Phase-1-Chat-4-Handoff.md`.

## F5. Chat 5 evidence

2026-08-22: Providers, model catalog, Model Policy, Internal Agent foundation. See `22-Phase-1-Chat-5-Handoff.md`.

## F6. Chat 6 evidence

2026-08-22: Employee AI administration UI and contextual Work Space AI Access. See `23-Phase-1-Chat-6-Handoff.md`.

## F7. Chat 7 evidence

2026-08-22: Rate limits and abuse controls (U), the AL security suite as executable tests, replay re-authorization, scheduler catalog bind, regression evidence and operations runbooks. See `24-Phase-1-Chat-7-Handoff.md` and `25-AI-Platform-Operations-Runbooks.md`.

## F8. Chat 8 evidence

2026-08-22: final verification and acceptance. AO 657–685 live, 29/29 PASS over REST and MCP; AP 686–705 live on OpenAI with Anthropic and usage attribution `[~]`; AQ 706–721 architecture review, 15/16 `[x]`. AM 627/631/636 closed with a browser walk and a `ready:true` worker. `pnpm test` 844 files / 4291 tests, `pnpm lint` 0, `pnpm typecheck` 0. See `26-Phase-1-Chat-8-Acceptance.md`.

## F9. Chat 9 evidence

2026-08-22: Prompt Policy / Prompt Version persistence and lifecycle; Internal Agent published-only linkage; Context Assembler + session/memory/knowledge contracts. Independent Chat N9 first pass **FAIL**; remediations closed actor/scope binding, recursive secrets and Prompt Policy HTTP coverage. Re-verification: **PASS WITH DEBTS** (16/100 targeted+HTTP, 12/138 regression/security, shared/API typecheck and ESLint 0). Migration written, not applied to production, still pending on a drifted non-designated Neon. See `28-Phase-1-Chat-9-Handoff.md`.

## F10. Chat 10 evidence

2026-08-22: Approval Request persistence/lifecycle and customer-facing safety contracts. Independent Chat N10 verdict **PASS WITH DEBTS** (16/131 targeted, 10/88 regression+MCP with 1 file / 2 tests skipped, shared/API/web typecheck and ESLint 0). Migrations written, not applied to production, still pending on a drifted non-designated Neon. See `29-Phase-1-Chat-10-Handoff.md` § Verification.

## F11. Chat 11 evidence

2026-08-22: Usage/cost/evaluation foundation (`AiExecution`, budgets, evaluation suite/run, `AiModel.evaluationStatus`), Redis-backed rate-limit store, idempotency checkpoint/recovery, catalog output projection + MCP `outputSchema`, Model Policy candidate editor, usage admin UI. Independent Chat N11 first pass **FAIL** (K 205 dropped live `{ items, meta }`); remediation restored the `09` envelope. Re-verification: **PASS WITH DEBTS** (5/56 FAIL-set, 110/2 files and 843/4 on ai-platform + shared/ai). Migration `20260822220000_ai_usage_evaluation_foundation` written, not applied. See `30-Phase-1-Chat-11-Handoff.md` § Re-verification.

## F12. Final closure gate

2026-08-23: independent final A–AQ re-walk on committed product HEAD `5ed6c5ea`. C26 live `201 × 6` unique Task codes. AO REST+MCP, AD–AI, full suite 874/4432, regression 22/284, lint 0 errors, typecheck, build, Prisma validate/status all green on non-production Neon. Verdict **PHASE 1 CLOSEABLE**. Item 209 stays `[~]`. See `31-Phase-1-Final-Acceptance.md` § Final closure gate. Post-Phase-1 workstreams: `32-Post-Phase-1-Technical-Debt-Plan.md`.

## G. Implementation rule

Before closing any cleanup item, verify all three layers:

1. canon documentation;
2. current runtime/code/schema;
3. desired business/security behavior.

Mark the item only after tests prove the behavior where runtime is affected.
