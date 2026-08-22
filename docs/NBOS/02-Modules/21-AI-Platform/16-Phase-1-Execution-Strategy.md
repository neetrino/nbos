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

## Recommended 8-chat / milestone split

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

Status: FAIL remediations applied in working tree; evidence `23-Phase-1-Chat-6-Handoff.md`. Not committed.

Focus:

- `Settings -> AI & Agents`;
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
- queued execution actor revalidation;
- human RBAC regression;
- Tasks/Drive regression;
- API/worker/scheduler build and boot checks;
- migration safety;
- operational runbooks.

### Chat 8 — Final Verification and Acceptance

This chat should primarily verify rather than invent new architecture.

Focus:

- walk the complete Phase 1 checklist from the beginning;
- confirm every item with code/test/evidence;
- mark `[x]`, `[~]` or `[!]` honestly;
- run final REST external-agent scenario;
- run final MCP external-agent scenario;
- verify create/update permissions independently;
- verify delete remains unavailable;
- verify credential revoke/agent disable behavior;
- verify provider/model foundation;
- verify central AI administration UI;
- verify human NBOS flows remain intact;
- update cleanup register and canonical docs;
- produce final remaining-gap report.

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
- final security/architecture review.

The reviewer should inspect the code and canon independently rather than merely accepting the primary agent's summary.

## Handoff between chats

At the end of every milestone, record:

- checklist items completed;
- files/modules changed;
- migrations added;
- tests executed and results;
- unresolved `[~]` / `[!]` items;
- architecture decisions made during reconciliation;
- known risks;
- exact next milestone entry point.

The next chat must verify this evidence against the repository instead of trusting the summary blindly.

## Completion rule

The eight-chat split is a recommended execution strategy, not eight independent architectures.

There remains exactly one canonical AI Platform architecture and one Phase 1 checklist. All chats implement successive slices of the same system.
