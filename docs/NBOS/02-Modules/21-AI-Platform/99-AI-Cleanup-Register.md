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

### B1. AI described only as Automation Layer feature — STALE

`01-Platform-Overview/02-Platform-Architecture-Layers.md` currently lists AI under automation examples. Keep examples, but reference the new AI Platform architecture and clarify AI is a cross-platform actor/capability layer.

### B2. Old AI Governance `Forbidden / Masked / Allowed` — STALE/PARTIAL

Retain as simplified terminology only. Replace as authorization model with resource/capability/data/risk policy.

### B3. Documents says AI Assistant is future separate module — OK/PARTIAL

Direction is correct. Reference `21-AI-Platform` rather than inventing a Documents-local assistant architecture.

### B4. Roadmap lacks AI Foundation phase — MISSING

Add a dedicated phase/slice before broad internal AI features.

## C. Runtime gaps

### C1. AuditLog requires `userId` — OK

Chat 1 made `userId` optional and added `actorType` / `actorId` / `onBehalfOf*` / channel / protocol / `correlationId` / safe `clientMetadata`.

Historical rows are backfilled as `USER` + `actorId = userId`. Human `AuditService.log({ userId })` still works and also writes actor fields. Machine actors write `userId = null`.

Migration: `20260821150000_audit_actor_aware`.

### C2. Audit actor attachment resolves only Employee — PARTIAL

Employees still resolve by id. Machine actors resolve to stable type labels (`External Agent`, `Internal AI`, `System`, `Automation`) without fake Employees.

Chat 2 must wire `resolveExternalAgentDisplayName`. Chat 5 must wire `resolveInternalAiDisplayName`.

### C3. ResourceAccessGrant requires `employeeId` — PARTIAL

Do not insert fake employees for external/internal AI.

Implement agent-specific grants or a safe generic principal grant evolution.

### C4. No External Agent entity/credential registry — MISSING

Add agent identity, credential hash/rotation/revoke and status model.

### C5. No capability registry/policy evaluator — MISSING

Existing endpoint guards alone are insufficient for reusable external/internal AI capabilities.

### C6. No agent-specific machine auth guard — MISSING

Add dedicated external-agent authentication path.

### C7. No AI execution record/correlation model — MISSING

Required for async execution, status, failure, approval and observability.

### C8. No idempotency contract for agent mutations — MISSING

Add for retry-safe external writes.

### C9. No external-agent rate-limit policy — MISSING

Add actor/capability scoped limits.

## D. Tasks alignment issues to verify before implementation

### D1. Canon/runtime status vocabulary — PARTIAL

Tasks documentation, cleanup register and current Prisma must be reconciled before exposing semantic agent actions. External API must follow actual accepted lifecycle and not preserve obsolete statuses accidentally.

### D2. Extension Work Space legacy/runtime shape — PARTIAL

Canon says Extension uses parent Product Work Space, while historical/runtime fields may still contain Extension workspace compatibility. Agent scoping should use resolved canonical Work Space semantics, not raw legacy foreign keys.

### D3. Task discussion author identity — MISSING/PARTIAL

Ensure agent-authored comments can record an AI actor rather than fake Employee authorship.

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

## G. Implementation rule

Before closing any cleanup item, verify all three layers:

1. canon documentation;
2. current runtime/code/schema;
3. desired business/security behavior.

Mark the item only after tests prove the behavior where runtime is affected.
