# Phase 1 Continuation After Chat 8

## Status

**APPROVED EXECUTION DECISION**

This document resolves the phase-level decision raised by `26-Phase-1-Chat-8-Acceptance.md`.

## Decision

Sections AD–AI of `10-Phase-1-AI-Foundation-and-External-Agent-Implementation.md` remain part of the current Phase 1 and must be implemented before Phase 1 is declared complete.

They are not moved to a new Phase 2.

The missing work is:

- AD — Prompt Policy / Prompt Version foundation;
- AE — Context / Memory / Knowledge contracts;
- AF — Risk / Approval persistence and lifecycle;
- AG — Customer-facing AI policy foundation;
- AH — Usage / Cost / Observability foundation;
- AI — Evaluation foundation.

Chat 8 correctly identified that these canonical sections had no dedicated implementation milestone in the original eight-chat execution split. This is an execution-plan omission, not a new architecture requirement.

## Why this remains Phase 1

The current AI Platform is intended to be the shared foundation for both External Agents and future Internal AI use cases.

External Agent, provider/model and Internal Agent identity foundations are already substantially implemented, but Internal AI cannot be considered properly founded without the contracts that determine:

- which prompt/version an agent executes with;
- what context it may retrieve and how that context is classified;
- how future memory/knowledge stays scoped and authorized;
- how higher-risk actions require approval;
- how customer-facing behavior is classified and constrained;
- how executions are attributed for usage/cost/observability;
- how models/policies/prompts can later be evaluated without replacing the architecture.

These foundations were already part of the canonical Phase 1 exit criterion. Implementing them now prevents the next Internal AI or Messenger capability from creating parallel ad-hoc systems.

## Execution sequence

### Chat 9 — Prompt + Context/Memory/Knowledge

Checklist: AD 470–481 and AE 482–496.

Deliver real persistence/lifecycle where canon requires it and minimal stable contracts where canon explicitly describes future interfaces.

Do not expand this milestone into production RAG, a vector platform, unrestricted persistent memory or a full employee AI chat.

Expected handoff: `28-Phase-1-Chat-9-Handoff.md`.

### Chat 10 — Approvals + Customer-Facing Safety

Checklist: AF 497–517 and AG 518–531.

Deliver Approval Request persistence/lifecycle, approval revalidation, approval Audit, customer/conversation scope classification, customer-facing response modes, separate draft/send authorization and isolation/security contracts.

Do not implement production Messenger auto-reply in this milestone.

Expected handoff: `29-Phase-1-Chat-10-Handoff.md`.

### Chat 11 — Usage/Cost/Evaluation + Actionable Debts

Checklist: AH 532–548 and AI 549–557 plus remaining actionable Phase 1 debts.

At minimum reconcile and close where applicable:

- shared Redis-backed agent rate-limit state for multi-instance correctness;
- idempotency crash/recovery gap around domain commit vs idempotency completion;
- declared output/projection schema validation if still required by the checklist;
- Model Policy candidate ordering/edit UI if still partial;
- browser E2E for critical AI administration flows where the existing test stack supports it cleanly.

Expected handoff: `30-Phase-1-Chat-11-Handoff.md`.

### Chat 12 — Final Re-Acceptance

Re-walk the complete Phase 1 checklist and all 11 exit criteria.

Expected final report: `31-Phase-1-Final-Acceptance.md`.

Chat 12 is the only milestone after Chat 8 that may declare Phase 1 complete.

## What may remain partial after product implementation

A product-code gap must not be hidden as an operational dependency.

However, the following may honestly remain `[~]` at final acceptance if the implementation itself is complete and the missing evidence truly requires an external environment/credential or developer-controlled production window:

- live Anthropic validation/sync when no real Anthropic key is supplied;
- live cross-provider fallback when only one real provider credential is available;
- production `rediss://` connectivity evidence when no production-like TLS Redis endpoint is available;
- production application of the actor-aware Audit migration until an approved maintenance/deployment window exists.

The final acceptance report must distinguish these from missing code.

## Existing Chat 8 acceptance

Chat 8 remains valid evidence for:

- External Agent REST/MCP acceptance;
- Workspace/Task/Drive isolation;
- independent create/update grants;
- no delete/force-complete path;
- idempotent retry behavior already covered there;
- credential revoke and Agent disable behavior;
- actor-aware audit/provenance;
- OpenAI provider/model live validation;
- model discovery not auto-activating;
- FIXED / PRIMARY_FALLBACK foundation;
- Internal Agent lifecycle foundation;
- architecture reuse of one Actor -> Policy -> Capability -> Domain Action -> Audit path.

Chats 9–11 must preserve those behaviors and run targeted regression tests around any shared foundation they touch.

## Verification rule

Each implementation chat 9–11 is followed by a fresh independent verification chat using a different model family.

The verifier:

- reads the handoff but does not trust it;
- checks the actual branch/diff/runtime;
- runs targeted tests and typecheck;
- checks migrations without applying production migrations;
- verifies checklist `[x]` claims against code/tests;
- writes no product code;
- returns FAIL findings to the same executor chat for remediation.

## Database safety

Existing development database rules remain in force:

- development uses the designated non-production Neon branch;
- never use `prisma migrate dev` against the inherited dev/prod-like data;
- migrations are applied to development only with the approved deploy path;
- production migrations are developer-controlled;
- large-table production indexes require the repository migration standard and an approved rollout plan.

## Exit rule

Phase 1 is complete only when Chat 12 verifies that:

1. all applicable product-code requirements in the canonical Phase 1 checklist are implemented;
2. all 11 exit criteria are met;
3. no missing product implementation is mislabeled as an environment-only limitation;
4. remaining partial items, if any, are explicitly tied to unavailable real credentials/environments or a developer-controlled production maintenance window;
5. current External Agent, provider/model and human NBOS behavior remains intact.
