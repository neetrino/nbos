# AI Platform — Post-Phase-1 Technical Debt Plan

## Status

**APPROVED POST-PHASE-1 REMEDIATION PLAN**

This document records three product-code debts discovered during AI Platform Phase 1 acceptance and the agreed target architecture for resolving them.

Execution prompts live only in root `ai-modul-steps.md` so this file does not become a second orchestration source.

Source debts:

- Workstream 1 — AI Platform K209 / Cleanup C24;
- Workstream 2 — AI Platform Cleanup C25;
- Workstream 3 — Tasks Cleanup C9.

These are three different problems and must be implemented/reviewed as separate milestones.

---

# Workstream 1 — Unified Durable Drive Artifact Lifecycle

## Source gap

K209 / C24 is currently partial only for `tasks.attach_artifact`.

The current machine-generated artifact path crosses two systems:

1. object storage (R2);
2. PostgreSQL (`FileAsset`, `FileVersion`, `FileLink`, idempotency/audit state).

A PostgreSQL transaction cannot atomically commit an R2 `PutObject` and database writes.

The current External Agent implementation is deliberately fail-closed. In the narrow crash window after the object/domain side has progressed but before the idempotency checkpoint is durable, the operation key can remain unusable rather than risking a duplicate mutation.

That behavior is safer than blind retry, but it is not the final Drive architecture.

## Agreed architecture

Do **not** build a separate AI-only upload subsystem.

Build one Drive-owned durable Artifact Operation lifecycle used by all three sources:

```text
Human UI ────────────┐
Internal AI ─────────┼──> Drive Artifact Operation
External AI ─────────┘          │
                                ├─ durable state / recovery
                                ├─ verification / finalization
                                ├─ FileAsset / FileVersion / FileLink
                                ├─ audit / provenance
                                └─ R2/object storage
```

The ingress differs by source, but the lifecycle/finalization/recovery engine is one.

### Human UI ingress

Keep browser-direct upload efficiency:

```text
Browser
→ Drive prepare operation
→ presigned URL / staging key
→ Browser uploads directly to R2
→ Drive verify/finalize operation
```

Large user files should not be unnecessarily proxied through the API.

### Internal AI ingress

Internal AI/tool runtime creates the same Drive Artifact Operation and uses a trusted server/worker machine upload adapter for generated content.

Internal AI must not own separate `FileAsset` / `FileLink` creation logic.

### External AI ingress

External Agent REST/MCP stays on the existing:

```text
Actor → Policy → Capability → Domain Action → Audit
```

`tasks.attach_artifact` becomes an adapter into the same Drive Artifact Operation.

REST and MCP must retain equivalent behavior and authorization semantics.

For large machine uploads, a prepare/presigned pattern may be added if justified, but it must remain an ingress adapter over the same durable operation rather than a second lifecycle.

## Common durable operation responsibilities

The Drive-owned operation must persist enough state to recover safely, including as applicable:

- stable operation identity;
- source/actor/provenance;
- intended target entity/link;
- stable storage/staging key;
- filename/MIME/size/checksum metadata;
- lifecycle state;
- retry/recovery state;
- final `FileAsset` / version / link identity;
- audit/correlation metadata;
- cleanup/reconciliation state.

Exact enum names should be chosen after reconciliation with existing Drive runtime, but the lifecycle must distinguish at least:

```text
prepared
→ upload/object pending
→ object uploaded/verified
→ DB finalization/link pending
→ completed
```

with explicit failed/retryable/cancelled/recovery semantics where required.

## Correctness requirements

- Never pretend R2 + PostgreSQL form one ACID transaction.
- Persist the durable operation/storage identity before irreversible upload where needed.
- Retry must not generate a new random object identity and create duplicates.
- Crash after object upload but before DB finalization must be recoverable.
- Crash after DB linkage but before operation completion must be recoverable/idempotent.
- Exact retry must never create a duplicate object, `FileAsset`, `FileVersion` or `FileLink`.
- Do not blindly expire/reclaim an `IN_PROGRESS` request and rerun the mutation.
- Recovery decides from durable operation state plus actual R2/DB state.
- Deferred/resumed sensitive finalization revalidates the appropriate authorization at the correct lifecycle point.
- Human, Internal AI and External AI keep their own authentication/authorization models; only the Drive operation lifecycle is shared.
- Storage object existence must never become an authorization bypass.
- Cleanup is conservative: never delete an object unless ownership/state is proven.
- Drive remains the only owner of file/storage lifecycle rules.

## Definition of Done

- Human UI upload path uses/reconciles into the common Drive operation while preserving direct-to-R2 efficiency.
- Internal AI has a machine-ingress contract over the same operation.
- External Agent `tasks.attach_artifact` uses the same operation over REST and MCP.
- K209/C24 crash window is removed rather than hidden.
- Recovery works after every meaningful crash boundary.
- Duplicate object/FileAsset/FileLink creation is impossible under exact retry/concurrency.
- Authorization revocation/revalidation behavior is explicit and tested.
- orphan/reconciliation behavior is defined and tested.
- existing Drive uploads/versions remain compatible.
- source docs are updated only after implementation evidence exists.

---

# Workstream 2 — Atomic Human-Readable Codes in Sibling Modules

## Source gap

Tasks previously generated codes using a pattern equivalent to:

```text
read current maximum
→ add 1 in application code
→ insert
```

Under concurrency, two callers could choose the same next code. Some implementations also sorted the full code string lexicographically, which becomes wrong at digit-width boundaries such as `9999` → `10000`.

Tasks fixed this by introducing the server-side PostgreSQL `entity_code_counters` allocator.

Other independent business-code series still contain variants of the old pattern.

Known candidates include:

- invoices;
- support tickets (`TKT-`, not Task `T-`);
- deals;
- leads;
- orders;
- subscriptions;
- projects.

This list is not authoritative until a repository-wide inventory is performed.

## Agreed architecture

Every independent business-code series has exactly one authoritative allocator backed by PostgreSQL `entity_code_counters`.

Each business module remains owner of the entity and its formatting/business rules. Only the next-number primitive is shared.

```text
Module create operation
→ atomic DB counter reservation
→ format business code
→ entity insert
```

## Correctness requirements

- inventory every production next-number generator first;
- identify every writer for each series;
- one named counter scope per independent series;
- numeric seed from actual historical values;
- malformed historical codes handled explicitly, never guessed;
- preserve year/global reset semantics per real series;
- all writers of one series move together;
- never leave `counter` and `MAX(table)` as competing authorities;
- gaps after failed reservations are acceptable; duplicate codes are not;
- prove the `9999` → `10000` boundary;
- concurrency correctness requires real-DB evidence;
- rollout must account for mixed old/new writers and require a write pause if necessary.

## Definition of Done

- repository-wide inventory completed;
- all confirmed unsafe production code generators migrated;
- each series has one authoritative counter scope;
- seed/rollout is safe on representative existing data;
- concurrent creates produce unique codes;
- lexicographic max bugs are eliminated;
- no unrelated domain ownership/business behavior is changed;
- C25 and any module-specific cleanup entries are updated with evidence.

---

# Workstream 3 — Tasks Domain Ownership

## Source gap

Some Support and Automation production flows still create `Task` rows directly through Prisma instead of going through a Tasks-owned application/domain creation operation.

The shared `T-...` allocator is already fixed, so these writers no longer corrupt the Task code series.

The remaining issue is domain ownership.

If Tasks adds or changes a required invariant — validation, provenance, defaults, workspace resolution, events, audit behavior, lifecycle metadata — a direct Prisma writer can silently bypass it.

## Agreed architecture

Tasks owns one explicit application/domain creation contract used by every applicable producer:

```text
Human/API ───────┐
Support ─────────┤
Automation ──────┼──> Tasks-owned create operation ──> Task
System producer ─┘
```

Trusted Support/Automation/system flows do **not** go through External Agent REST/MCP authorization. They use their appropriate internal actor/source context while still calling the Tasks-owned invariant path.

## Correctness requirements

- repository-wide inventory of direct production Task writers;
- classify fixtures/migrations/tests separately from production bypasses;
- Support/Automation stop direct Task inserts;
- reuse one Tasks-owned creation path rather than introducing a parallel service;
- preserve source/provenance;
- preserve creator/assignee/link/workspace/default/status/priority semantics;
- preserve the common Task-code allocator;
- preserve transaction behavior;
- no fake Employee identity for non-human system actors;
- avoid circular module dependencies through a narrow exported Tasks application service/port if needed;
- existing human/API Task behavior remains unchanged.

## Status (2026-08-23)

**PASS WITH DEBTS** — independent verifier recorded in
`docs/NBOS/02-Modules/21-AI-Platform/33-Post-Phase-1-Chat-1-Tasks-Ownership-Handoff.md`.

C9 domain ownership is closed. Remaining debts (C8, C25 / NEW CHAT 2, K209/C24 / NEW CHAT 3, Recurring machine actor, seed fixture) are out of this workstream. Do not start NEW CHAT 2 until this slice is committed.

## Definition of Done

- all applicable production Task creation writers use the Tasks-owned operation;
- Support and Automation no longer own partial Task-creation logic;
- regression tests prove caller-specific behavior is preserved;
- repository search confirms no unexplained direct production Task writer remains;
- Tasks Cleanup C9 can be honestly closed.

---

# Execution order

The workstream numbers above identify the debts; they are **not** the recommended implementation order.

Execute as follows:

```text
NEW CHAT 1 → Workstream 3 — Tasks Domain Ownership
NEW CHAT 2 → Workstream 2 — Atomic Human-Readable Codes
NEW CHAT 3 → Workstream 1 — Unified Durable Drive Artifact Lifecycle
```

Reasoning:

1. establish clean Tasks ownership before adding more producers/refactors;
2. perform the cross-module allocator cleanup as a focused reliability slice;
3. then implement the deepest cross-storage lifecycle work as its own Drive-focused milestone.

Each implementation chat requires a fresh independent verifier before commit/next stage.

The exact executor and verifier prompts are maintained in root `ai-modul-steps.md`.

---

# Relation to AI Platform Phase 1

- K209/C24 remains the explicit accepted fail-closed Drive partial until Workstream 1 is implemented and verified.
- C25 is a cross-module reliability debt discovered during acceptance, not an External Agent Phase 1 requirement.
- Tasks C9 is a Tasks domain-ownership debt, not an AI authorization requirement.

This plan must not retroactively mark any partial item `[x]`.

When a workstream is completed, update its real source-of-truth cleanup/canon entry with implementation evidence, then mark this plan's corresponding workstream completed.
