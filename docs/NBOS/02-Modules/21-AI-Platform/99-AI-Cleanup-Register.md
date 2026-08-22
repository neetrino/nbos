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

### C7. No AI execution record/correlation model — MISSING

Required for async execution, status, failure, approval and observability. Chat 5 added Internal Agent execution _context_ (actor/channel/onBehalfOf) but not an execution record table. Usage/evaluation entities remain AH/AI.

### C8. No idempotency contract for agent mutations — PARTIAL

Capability metadata declares `REQUIRED`. Chat 3 stores replay rows in `external_agent_idempotency_records` and enforces them in the gateway. `abort()` runs only when the domain call fails; after a successful Tasks/Drive write the `IN_PROGRESS` row is left in place if `complete()` fails, and stale `IN_PROGRESS` is never reclaimed. REST `Idempotency-Key` / MCP `clientOperationId` header/tool binding is Chat 4. Domain commit and `complete()` are still not one transaction (K 209).

### C9. No external-agent rate-limit policy — PARTIAL

Chat 7 shipped section U: `AgentPreAuthGuard` bounds requests and failed authentications per source address before any credential lookup or Argon2 verification, then `AgentRateLimitGuard` + `AgentRateLimitService` charge per-agent request, per-capability-class and concurrency budgets, before the `lastUsedAt` write, on both REST and MCP, with `AGENT_RATE_LIMITED` + `Retry-After` + `X-RateLimit-*`. The payload ceiling is enforced by the agent body parser on real socket bytes ahead of the global parsers. The agent namespace carries `@SkipThrottle()`, so agent traffic cannot draw down employee `ThrottlerGuard` capacity (U 329).

Remaining gaps: counters live in process memory, so with more than one API instance the effective ceiling is multiplied by the instance count and a restart clears the windows. Moving the window store to Redis is the follow-up; the guard/service boundary is already the only place that would change. Until then the limiter, not the policy evaluator, owns the refusal, so J 186 stays `[~]`: `AgentPolicyService` never receives a live `rateLimitExceeded` verdict because enforcement deliberately happens before policy touches the database.

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

## G. Implementation rule

Before closing any cleanup item, verify all three layers:

1. canon documentation;
2. current runtime/code/schema;
3. desired business/security behavior.

Mark the item only after tests prove the behavior where runtime is affected.
