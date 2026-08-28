# Phase 2 — Execution Strategy

> Status: **PLANNED — BLOCKED BY AI PRODUCT ENTRY GATE**  
> Architecture: `42-Phase-2-Project-Intelligence-and-Draft-Assistant-Architecture.md`  
> Executable checklist: `43-Phase-2-Implementation-Checklist.md`  
> Acceptance, migration and rollout: `45-Phase-2-Acceptance-Migration-Rollout-and-Operations.md`

## 1. Purpose

Phase 2 introduces a real Internal AI execution runtime, Project Knowledge, isolated customer memory,
live NBOS context and a Messenger-owned customer draft. These concerns cross several trust boundaries
and must not be implemented in one unlimited coding conversation.

This document defines the implementation sequence, review contract and handoff evidence. It does not
replace the architecture or checklist and does not authorize product code before the Product Entry Gate
is closed.

## 2. Non-negotiable execution rules

1. Use a fresh implementation chat for every milestone.
2. Use one repository worktree for only one writer at a time. Do not implement overlapping schema or
   shared-contract milestones in parallel.
3. Read the current repository, active canon, checklist status and preceding handoff before editing.
4. Verify claims against code and tests; a previous handoff is evidence to inspect, not authority.
5. Keep one canonical architecture. Milestones divide delivery, not product ownership.
6. Every code-changing milestone receives an independent verifier after the executor finishes.
7. A verifier records `PASS`, `PASS WITH DEBTS` or `FAIL`. A `FAIL` returns to the same executor for
   remediation and then to the verifier again.
8. Do not move an unmet checklist item forward merely to close a chat.
9. Do not perform production deployment, production migration, provider-secret changes, pilot
   activation or data backfill as part of an implementation chat.
10. Preserve unrelated work and do not silently rewrite existing architecture, public contracts or
    module ownership.

## 3. Entry gate

Phase 2 planning documents may be reviewed now. Chat 1 may change product code only after
`41-AI-Product-Entry-Gate-Final-Acceptance.md` exists and records an acceptable verdict with no open
authorization, isolation or lifecycle-consistency blocker.

Files `39`–`41` remain reserved for:

- Product Entry Gate Workstream 2 handoff;
- Product Entry Gate Workstream 3 and focused cross-regression handoff;
- Product Entry Gate final acceptance.

If the gate is not closed, the Phase 2 executor stops after current-state reconciliation and reports the
blocker. It must not use these planning documents as permission to bypass the gate.

## 4. Recommended 12-chat delivery sequence

### Chat 1 — Runtime reconciliation and durable invocation

Primary checklist scope: A 1–20, B 21–40, C 41–52, E 69–90, F 91–110 and the runtime portion of G
111–128.

Focus:

- verify the Product Entry Gate and current Phase 1 runtime first-hand;
- create the touched-module, schema, API, worker and UI map;
- approve or explicitly block every decision needed by the next milestones;
- define the provider-independent invocation port;
- add normalized OpenAI/Anthropic generation, structured output, cancellation and usage metadata;
- extend `AiExecution` with durable root execution and provider attempts;
- enqueue with deterministic identity and reconcile committed-but-not-enqueued rows;
- re-authorize in the worker and enforce timeout, retry, fallback, tool-loop and budget limits;
- deliver admin-only/non-production invocation diagnostics;
- prove no customer or domain-write path was opened.

Required negative tests include inactive model/connection/policy, forbidden provider fallback, timeout,
cancellation, duplicate job, worker restart, access revocation and safe-error redaction.

Handoff: `46-Phase-2-Chat-1-Runtime-Handoff.md`.

### Chat 2 — Project AI Profile and versioned rules

Primary checklist scope: D 53–68 and H 129–143.

Focus:

- add the Project AI Profile activation/configuration boundary;
- bind Project base context, optional Product overlays and one Internal Agent;
- define Project/Product AI Rules lifecycle and immutable published versions;
- validate agent scopes, model policy and prompt/rules dependencies before activation;
- enforce Project/Product relationships server-side;
- provide safe preview/test behavior without an admin bypass;
- add lifecycle, authorization and sibling-Product/cross-Project tests.

Handoff: `47-Phase-2-Chat-2-Profile-and-Rules-Handoff.md`.

### Chat 3 — Project Knowledge ingestion and retrieval

Primary checklist scope: I 144–164 and J 165–188.

Focus:

- add Project Knowledge Space, governed source versions and rebuildable chunks;
- support curated manual entries, selected native Documents and eligible selected Drive text;
- require explicit AI publication and separate `INTERNAL_ONLY` / `CUSTOMER_VISIBLE` visibility;
- preserve owning-module authorization and source provenance;
- implement PostgreSQL FTS with exact relational pre-filtering and post-retrieval revalidation;
- implement publish, index, fail, stale, quarantine, revoke, retire and delete behavior;
- make a revoke tombstone effective before asynchronous chunk cleanup;
- exclude ambiguous multi-linked or unsafe file content;
- prove Project/Product/source-version isolation and deterministic rebuild.

No vector database, pgvector, arbitrary crawler, OCR platform or generic binary parser may be added.

Handoff: `48-Phase-2-Chat-3-Project-Knowledge-Handoff.md`.

### Chat 4 — Customer and conversation memory

Primary checklist scope: K 189–204 and L 205–227.

Focus:

- establish exact Contact/participant resolution and ambiguous-identity behavior;
- implement Project + Contact memory with optional Product/Conversation narrowing;
- implement typed categories, provenance, verification, expiry, supersession and deletion;
- make model extraction create reviewable candidates rather than trusted facts;
- add inspection, correction, rejection and deletion application services;
- make canonical live module state override memory;
- handle Contact merge, Project/Product lifecycle and conversation deletion safely;
- prove one Contact in two Projects remains isolated;
- prove private participant memory never leaks into group-visible context.

Do not backfill historical conversations and do not store credentials, payment secrets, sensitive
inferences or unverified commitments.

Handoff: `49-Phase-2-Chat-4-Customer-Memory-Handoff.md`.

### Chat 5 — Context Plan and live NBOS projections

Primary checklist scope: M 228–247 and N 248–270.

Focus:

- replace the single-decision context assumption with a typed multi-source Context Plan;
- require a fresh bound authorization decision for each source/capability;
- add source purpose, scope, classification, visibility, freshness, provenance and omission metadata;
- implement token-budget and deterministic source-priority rules;
- expose purpose-built, customer-safe projections from owning modules;
- start with Project, Product, Tasks/Work Space, Contact/CRM and approved Messenger state;
- keep Finance, Payroll, Credentials, private Mail and broad Drive excluded;
- validate stale, unavailable, denied and partially available sources;
- prove prompt content and model-selected ids cannot widen the plan.

Handoff: `50-Phase-2-Chat-5-Context-and-Live-Projections-Handoff.md`.

### Chat 6 — Grounded Project Assistant

Primary checklist scope: O 271–290 and P 291–307.

Focus:

- implement the employee-initiated Project Assistant command/API;
- assemble Project base and exact Product overlay context;
- validate structured response schema and customer/internal egress mode;
- return citations, freshness, omissions, uncertainty and escalation information;
- prevent unsupported factual claims and hidden domain mutation;
- expose execution status/cancellation and useful safe diagnostics;
- cover multilingual quality and citation behavior with deterministic and curated evaluation fixtures;
- prove the initiating Employee and Internal Agent access intersection.

Handoff: `51-Phase-2-Chat-6-Project-Assistant-Handoff.md`.

### Chat 7 — Project, memory and AI administration UX

Primary checklist scope: R 327–345 plus UI parts of D, I–L and P.

Focus:

- add Project/Product AI configuration and assistant surfaces;
- add knowledge lifecycle, indexing, provenance and preview UI;
- add memory inspection/correction/deletion UI in the correct Project/Contact context;
- extend central `AI & Agents` with runtime diagnostics, usage and evaluation views;
- preserve target-module RBAC and disabled-state behavior;
- make customer visibility, stale data, uncertainty and AI provenance understandable;
- add accessibility, localization, browser and negative authorization coverage.

Handoff: `52-Phase-2-Chat-7-Project-and-Admin-UX-Handoff.md`.

### Chat 8 — External Messenger readiness and `DRAFT_ONLY`

Primary checklist scope: Q 308–326 and the customer-facing parts of K, M, N, O and R.

This milestone starts with a hard dependency audit. If Messenger still lacks canonical external
Conversation/Message/Draft persistence, participant-to-Contact resolution, Product/Project mapping or
Employee-owned send semantics, implement the minimal Messenger-owned foundation approved by Messenger
canon or record a blocker. Do not emulate Messenger ownership inside AI Platform.

Focus:

- persist inbound external conversation/message identity and deduplicate provider events where needed;
- resolve exact channel account, Project, Product, Conversation, Contact and participant scope;
- require an explicit authorized Employee generation command; inbound
  persistence alone never invokes the model in Phase 2;
- create a Messenger-owned immutable draft revision with AI execution provenance;
- generate the draft only from `CUSTOMER_VISIBLE` exact-scope context;
- make new inbound/human messages or target changes mark old drafts stale;
- allow an authorized Employee to review, edit and manually send through Messenger;
- prove generation alone never enqueues or sends an external message;
- add takeover, escalation and per-conversation kill-switch behavior;
- prove group and unknown-sender safety.

Approval-bound machine send and auto-send remain out of Phase 2.

Handoff: `53-Phase-2-Chat-8-Messenger-Draft-Handoff.md`.

### Chat 9 — Security, privacy, audit and evaluation hardening

Primary checklist scope: S 346–364 and T 365–384.

Focus:

- perform a code-backed trust-boundary review across Project/Product/Contact/Conversation/source scope;
- test prompt injection, model-supplied identifiers, BOLA, stale permission and memory poisoning;
- add secret/content scanning, source quarantine and safe logging controls;
- verify provider data-policy/fallback eligibility and no-training/retention configuration evidence;
- complete execution/source-use/tool/draft audit provenance without raw context or chain-of-thought;
- create deterministic, human and model-graded evaluation suites with version attribution;
- test budget exhaustion, provider failure, cancellation, queue replay and kill switches;
- record confirmed findings, residual risks and remediation evidence.

Handoff: `54-Phase-2-Chat-9-Security-and-Evaluation-Handoff.md`.

### Chat 10 — Migrations, retention and operations

Primary checklist scope: U 385–402 and the operational part of S/T.

Focus:

- validate expand/backfill/contract migration sequencing on representative non-production data;
- implement idempotent, resumable derived-index rebuilds and bounded cleanup jobs;
- implement retention, expiry, revocation, merge, trash and purge hooks;
- add independent global/project/product/agent/surface feature flags and kill switches;
- add health, backlog, latency, cost, stale-source and error observability;
- update runbooks for provider failure, index failure, queue recovery, data correction and disablement;
- rehearse rollback without deleting authoritative business data.

This chat prepares operator commands and evidence. It does not execute production migration or rollout.

Handoff: `55-Phase-2-Chat-10-Migration-and-Operations-Handoff.md`.

### Chat 11 — Cross-regression and pilot readiness

Primary checklist scope: V 403–418 and W 419–430.

Focus:

- run full affected-project lint, typecheck, tests and builds;
- verify human Tasks/Drive, External Agent REST/MCP and AI Admin Phase 1 regressions;
- exercise API, worker, scheduler, Redis/queue and browser paths together;
- execute adversarial isolation and failure matrices from the acceptance document;
- validate performance, context and cost budgets with representative data;
- synchronize architecture, checklist, module canon, TECH_CARD, roadmap and cleanup register;
- prepare a disabled-by-default pilot manifest and evidence bundle;
- leave all production actions as explicit operator decisions.

Handoff: `56-Phase-2-Chat-11-Cross-Regression-and-Pilot-Readiness.md`.

### Chat 12 — Final Phase 2 acceptance

Primary checklist scope: X 431–450.

This is an independent acceptance milestone. It should verify rather than invent architecture or fill
large missing implementation sections.

Focus:

- re-walk all 450 checklist items first-hand;
- verify every preceding milestone and unresolved debt against repository evidence;
- run the complete acceptance, isolation, injection, lifecycle and failure suites;
- demonstrate real non-production provider invocation and grounded Project Assistant behavior;
- demonstrate the Messenger `DRAFT_ONLY` flow and prove generation cannot send;
- validate migration evidence, rollback posture, runbooks and kill switches;
- distinguish product-code completion from separately authorized production rollout actions;
- issue the honest final verdict.

Final report: `57-Phase-2-Final-Acceptance.md`.

## 5. Independent verification contract

For Chats 1–11, the verifier must:

1. read the architecture, checklist, milestone handoff and actual diff;
2. map every completed checklist item to code, test or operational evidence;
3. run focused negative/security checks rather than only happy paths;
4. confirm no unrelated architecture, API or business behavior changed;
5. distinguish an implementation defect from missing environment/credential evidence;
6. record exact commands, results and unverified conditions;
7. return actionable findings to the same executor before the milestone closes.

A milestone may be `PASS WITH DEBTS` only when every debt is operational or explicitly future scope.
Authorization, isolation, privacy, data-loss, duplicate-side-effect, external-send or required product-code
debt forces `FAIL`.

## 6. Handoff template

Every handoff records:

- scope and checklist item ranges;
- branch/commit or exact diff boundary reviewed;
- current architecture/runtime reconciliation;
- files, schemas, APIs, workers, flags and UI changed;
- migrations created and migration evidence;
- tests/checks executed with exact results;
- independent verifier verdict and remediation cycle;
- security/privacy findings;
- decisions made and their canonical destination;
- unresolved `[~]` / `[!]` items and owners;
- production-only or credential-dependent evidence still required;
- rollback/recovery posture;
- exact entry point for the next chat.

## 7. Change and decision control

If implementation discovers a real conflict:

1. stop the affected slice;
2. classify it as runtime drift, missing canon, security blocker or product decision;
3. propose the smallest compatible resolution;
4. update architecture/checklist before implementing behavior that changes scope;
5. record who approved any adaptive value marked `[!]`.

Do not silently expand Phase 2 to vector infrastructure, broad company search, autonomous domain writes,
approval-bound AI send or auto-send.

## 8. Completion rule

Phase 2 is complete only when `57-Phase-2-Final-Acceptance.md` records an acceptable verdict and every
applicable checklist item is verified. A complete codebase remains disabled until separately approved
non-production/production migrations, credentials, pilot enrollment and rollout actions are executed.
