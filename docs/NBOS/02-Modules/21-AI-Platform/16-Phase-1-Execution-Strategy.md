# Phase 1 Execution Strategy

## Purpose

Phase 1 is intentionally large and should not be executed as one unlimited AI coding conversation.

The canonical implementation checklist remains:

`10-Phase-1-AI-Foundation-and-External-Agent-Implementation.md`

This document defines the recommended execution method for Cursor or another coding agent.

## Core rule

Use multiple fresh agent chats / implementation milestones instead of one long conversation.

Reasons:

- reduce context degradation;
- keep the active task scope understandable;
- prevent old reasoning/tool traces from consuming useful context;
- make code review and rollback easier;
- make checklist evidence easier to verify;
- isolate failures and architectural mistakes;
- allow an independent reviewer between critical milestones.

Each new chat must read the relevant AI canon, the current checklist status, the latest runtime/code and the previous milestone evidence before changing code.

## Milestone strategy

The original execution plan used eight chats. Chat 8 correctly discovered that sections AD–AI of the canonical Phase 1 checklist had never received their own implementation milestone even though they are required by Phase 1 exit criterion 9.

This is an execution-plan gap, not a change to the canonical architecture and not a newly invented Phase 2 scope.

Therefore Phase 1 continues through Chats 9–12:

- Chats 9–11 implement the missing canonical foundations and close actionable acceptance debts;
- Chat 12 is the final Phase 1 re-acceptance gate;
- Phase 1 is not considered complete merely because Chat 8 accepted External Agent/provider/model/Internal Agent foundations.

## Recommended 12-chat / milestone split

### Chat 1 — Foundation and Audit

Focus:

- canon/runtime reconciliation;
- touched-module map;
- ActorType / ActorContext;
- backward-compatible actor-aware Audit migration;
- correlation/on-behalf-of foundations;
- regression protection for existing employee audit flows.

Do not continue to external-agent APIs until this foundation is stable and tested.

Handoff: `17-Phase-1-Chat-1-Handoff.md`.

### Chat 2 — External Identity, Credentials and Policy

Focus:

- External Agent persistence;
- credential generation/hash/rotation/revocation;
- dedicated machine authentication boundary;
- capability registry;
- capability grants;
- resource scopes;
- Policy Evaluator;
- deny-by-default and isolation tests.

### Chat 3 — Domain Capabilities: Workspaces, Tasks and Drive

Focus:

- Domain Action Gateway;
- authorized Workspace discovery;
- Task read projections;
- discussion/context reads;
- linked Drive artifact reads;
- optional `tasks.create` capability;
- allowlisted `tasks.update` capability;
- `tasks.start`;
- `tasks.comment`;
- `tasks.submit_review`;
- artifact writes;
- concurrency and idempotency.

Phase 1 must not expose `tasks.delete` or force-complete behavior.

### Chat 4 — External Protocols: REST and MCP

Focus:

- versioned External Agent REST API;
- exact request/response/error contracts;
- MCP server/adapter;
- MCP tool schemas;
- REST/MCP capability parity;
- auth parity;
- idempotency parity;
- protocol-level negative/security tests.

REST and MCP must invoke the same Actor -> Policy -> Capability -> Domain Action -> Audit foundation.

### Chat 5 — Providers, Models and Internal-Agent Foundation

Focus:

- OpenAI provider connection foundation;
- Anthropic provider connection foundation;
- secure provider-key lifecycle;
- provider validation;
- model catalog synchronization;
- model status lifecycle;
- model activation/deactivation;
- Model Policy data model;
- FIXED routing;
- PRIMARY_FALLBACK routing;
- Internal Agent identity/configuration foundation.

Do not build adaptive routing, full internal chat, RAG or Messenger AI execution in this milestone.

### Chat 6 — AI Administration UI

Focus:

- AI & Agents administration module;
- External Agents UI;
- capabilities/scopes UI;
- credential issue/rotate/revoke UI;
- Providers UI;
- Models UI;
- Model Policies UI;
- Internal Agents foundation UI;
- contextual `Workspace -> Settings -> AI Access` view;
- permission checks and admin authorization tests.

### Chat 7 — Security, Regression and Operational Hardening

Focus:

- secret leakage checks;
- cross-workspace isolation;
- prompt-injection boundaries;
- provider-key protection;
- rate limits;
- audit completeness;
- queued execution actor revalidation where a queued runtime exists;
- human RBAC regression;
- Tasks/Drive regression;
- API/worker/scheduler build and boot checks;
- migration safety;
- operational runbooks.

### Chat 8 — Intermediate Acceptance and Gap Discovery

Chat 8 is an acceptance checkpoint, not the final Phase 1 exit gate.

Focus:

- walk the complete Phase 1 checklist from the beginning;
- confirm implemented items with code/test/live evidence;
- run final-style REST and MCP External Agent scenarios;
- verify provider/model/Internal Agent foundations;
- verify human NBOS flows remain intact;
- identify every remaining gap honestly;
- update cleanup register and acceptance evidence.

Canonical evidence: `26-Phase-1-Chat-8-Acceptance.md`.

Chat 8 established that External Agent/provider/model/Internal Agent foundations are working, but Phase 1 exit criterion 9 is not met because AD–AI were never implemented. C22 is therefore resolved by continuing Phase 1 rather than deferring these sections to a new phase.

### Chat 9 — Prompt Policy and Context/Memory/Knowledge Foundation

Primary checklist scope: AD 470–481 and AE 482–496.

Focus:

- Prompt Policy persistence/configuration foundation;
- immutable/versioned Prompt Version lifecycle;
- DRAFT / TESTING / PUBLISHED / RETIRED semantics;
- Internal Agent linkage to published prompt policy/version;
- prompt version attribution and rollback contract;
- Context Assembler interface and authorized retrieval contract;
- source/provenance, freshness, classification/redaction and token-budget metadata;
- session-context contract;
- persistent-memory interface/contract with owner/scope/purpose/retention/provenance;
- future Knowledge/RAG source contract with authorization boundary.

Do not build production RAG, unrestricted persistent memory, a vector platform or full employee chat in this milestone.

The implementation must be minimal but real: where the canonical checklist requires persistence/lifecycle, implement it; where it requires only a future interface/contract, do not inflate it into an unused subsystem.

Handoff: `28-Phase-1-Chat-9-Handoff.md`.

### Chat 10 — Approval and Customer-Facing Safety Foundation

Primary checklist scope: AF 497–517 and AG 518–531.

Focus:

- capability risk metadata integration;
- `ALLOW / DENY / REQUIRE_APPROVAL` runtime contract;
- Approval Request persistence;
- requesting actor/capability/resource attribution;
- safe payload summary and canonical payload digest;
- PENDING / APPROVED / REJECTED / EXPIRED / CANCELLED / CONSUMED lifecycle;
- one-time approval semantics and expiration;
- AI self-approval prevention;
- actor/grant/domain-state revalidation before approved commit;
- approval lifecycle Audit events;
- customer/conversation scope classification;
- DRAFT_ONLY / APPROVAL_REQUIRED / AUTO_SEND_ALLOWED policy contracts;
- separate draft-vs-send authorization;
- escalation contract;
- customer isolation and prompt-injection/security tests.

Do not build production Messenger auto-reply or broad autonomous customer actions in this milestone.

Handoff: `29-Phase-1-Chat-10-Handoff.md`.

### Chat 11 — Usage/Cost/Evaluation Foundation and Actionable Debt Closure

Primary checklist scope: AH 532–548 and AI 549–557, plus remaining Phase 1 debts that are actionable without production-only credentials/windows.

Focus:

- AI execution/usage record foundation;
- actor/Internal Agent/provider/model/Model Policy/capability/channel attribution;
- correlation, status, latency, retry and fallback attribution;
- provider token/usage units and historical cost metadata where available;
- basic budget/usage-limit contracts;
- Evaluation Suite/Run foundation;
- model/model-policy/prompt-version/dataset attribution;
- aggregate quality/latency/cost results;
- separation of deterministic, human and model-based grading;
- finish Model Policy candidate ordering/edit UI if still open;
- move rate-limit state to a shared Redis-backed store for multi-instance correctness;
- close the idempotency crash-gap between domain commit and idempotency completion, or document a canon-consistent recoverable design with tests;
- add declared response-schema/output validation where the checklist still requires it;
- add browser E2E for critical AI Admin flows if practical and stable in the existing test stack.

Do not fabricate live Anthropic evidence, production Redis TLS evidence or production audit-migration evidence. Those require real credentials/environments or an explicit developer-controlled maintenance window and may remain operational acceptance conditions rather than product-code gaps.

Handoff: `30-Phase-1-Chat-11-Handoff.md`.

### Chat 12 — Final Phase 1 Re-Acceptance

This is the true Phase 1 exit gate.

It should primarily verify rather than invent architecture.

Focus:

- re-walk the entire canonical checklist A–AQ;
- verify AD–AI first-hand rather than trusting Chats 9–11;
- re-run AO External Agent live acceptance;
- re-run AP provider/model/Internal Agent acceptance with every real provider credential available;
- re-run AQ architecture review;
- verify all 11 Phase 1 exit criteria;
- distinguish product-code completion from production-only operational evidence;
- confirm all remaining `[~]` items are genuinely environment/business-window dependent or intentionally non-applicable;
- run full tests, lint, typecheck, build and relevant browser/integration checks;
- synchronize canon, cleanup register and final acceptance report.

Final acceptance report: `31-Phase-1-Final-Acceptance.md`.

Phase 1 may be declared complete only after Chat 12 finds no unresolved product-code requirement from the canonical Phase 1 checklist.

## Model usage recommendation

The implementation model may remain the same across milestones, but each milestone should normally start with a fresh chat/context.

For high-risk milestones, an independent strong-model review is recommended after the primary implementation, especially for:

- database migrations;
- actor-aware Audit;
- authentication/credential handling;
- Policy Evaluator;
- cross-workspace isolation;
- REST/MCP authorization parity;
- provider secret storage;
- approval execution/revalidation;
- customer-facing authorization/isolation;
- final security/architecture review.

Recommended continuation allocation:

- Chat 9 executor: Cursor Grok 4.6; reviewer: GPT-5.6 Sol High;
- Chat 10 executor: Claude Opus 5 High; reviewer: GPT-5.6 Sol High;
- Chat 11 executor: Cursor Grok 4.6; reviewer: GPT-5.6 Sol High;
- Chat 12 acceptance: Claude Opus 5 High; independent report review: GPT-5.6 Sol High.

The reviewer should inspect the code and canon independently rather than merely accepting the primary agent's summary.

## Handoff between chats

At the end of every implementation milestone, record:

- checklist items completed;
- files/modules changed;
- migrations added;
- tests executed and results;
- unresolved `[~]` / `[!]` items;
- architecture decisions made during reconciliation;
- known risks;
- exact next milestone entry point.

The next chat must verify this evidence against the repository instead of trusting the summary blindly.

For Chats 9–11, use a fresh independent verification chat after the executor. The verifier does not write product code; FAIL findings return to the same executor chat for remediation, then the verifier re-checks.

## Completion rule

The multi-chat split is an execution strategy, not multiple architectures or product phases.

There remains exactly one canonical AI Platform architecture and one Phase 1 checklist. Chats 9–12 continue the same Phase 1 because the missing AD–AI sections were already part of that checklist.

Phase 1 is complete only when:

1. every applicable product-code requirement in the canonical checklist is implemented and verified;
2. all 11 exit criteria are met;
3. any remaining partial item is explicitly proven to require a production-only credential, environment, maintenance window or future runtime that does not yet exist;
4. the final acceptance report distinguishes those operational conditions from missing product implementation.
