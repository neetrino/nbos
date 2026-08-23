# AI Platform — Post-Phase-1 Technical Debt Plan

## Purpose

This file records the three known product-code debts that are intentionally kept separate from the Phase 1 closure gate.

They are not one problem and should not be implemented in one large chat. Each workstream has a different owner, failure mode and correct architectural solution.

Current source evidence:

- AI Platform checklist item K 209 and Cleanup Register C24;
- AI Platform Cleanup Register C25;
- Tasks Cleanup Register C9.

Phase 1 closure must continue to report these honestly. This file does not change an existing `[~]` to `[x]` and does not make any product claim by itself.

---

# Workstream 1 — `tasks.attach_artifact` atomicity / K209

## Status

**KNOWN PARTIAL — POST-PHASE-1**

## Human summary

When an AI agent attaches a file to a Task, the operation crosses two different storage systems:

1. the file/object storage;
2. PostgreSQL, where the Task/Drive link and the idempotency state live.

A normal database transaction cannot make the object-storage write and the PostgreSQL write commit atomically as one unit.

Today the implementation fails closed: in a very small process-crash window, the requested attachment is not duplicated, but the specific idempotency operation key can remain permanently unusable. The system prefers "do not execute twice" over "automatically retry and risk duplicating the write".

This is safer than reclaiming the key blindly, but it is not the final architecture.

## Desired end state

Use a durable cross-boundary operation pattern, preferably an outbox / domain-operation record, so that:

- the request has one durable operation identity;
- object-store and database progress can be reconciled after a crash;
- retries never duplicate the artifact or Task link;
- a crash cannot permanently strand an operation key;
- actor/scope/capability authorization is revalidated at the correct lifecycle point;
- audit/provenance remains correct;
- REST and MCP retain identical semantics.

Do not solve this by simply expiring/reclaiming an `IN_PROGRESS` idempotency row, because that can replay the domain mutation after it already committed.

## Definition of Done

- `tasks.attach_artifact` no longer has the post-domain/pre-checkpoint unrecoverable window;
- crash/restart tests cover every lifecycle boundary;
- duplicate object/file/link creation is impossible under retry;
- revocation/re-authorization semantics are explicit;
- checklist K209/C24 can honestly become closed for Drive as well as Tasks;
- no second Drive ownership path is created.

## Cursor task prompt

```text
Implement post-Phase-1 Workstream 1: close AI Platform K209/C24 for `tasks.attach_artifact`.

Read first:
- docs/NBOS/02-Modules/21-AI-Platform/32-Post-Phase-1-Technical-Debt-Plan.md
- docs/NBOS/02-Modules/21-AI-Platform/10-Phase-1-AI-Foundation-and-External-Agent-Implementation.md (K209)
- docs/NBOS/02-Modules/21-AI-Platform/99-AI-Cleanup-Register.md (C8/C24)
- Drive canon and the current Drive artifact services
- current AgentCapabilityGateway / AgentIdempotencyService / replay authorization code

Goal:
remove the unrecoverable crash window for `tasks.attach_artifact` without weakening at-most-once safety.

Constraints:
- do not reclaim stale IN_PROGRESS blindly;
- do not duplicate object-store uploads, FileAssets or Task links;
- keep Drive as owner of files;
- keep REST and MCP on the same capability/domain path;
- preserve ActorContext, scope checks, audit and correlation;
- use a durable outbox/domain-operation design if required by the cross-storage boundary;
- revalidate authorization at the correct execution/commit point;
- do not redesign unrelated Tasks/Drive functionality.

Prove with tests:
- crash before object write;
- crash after object write but before DB linkage/checkpoint;
- crash after DB linkage but before final idempotency completion;
- exact retry;
- changed-payload retry;
- revoked actor/grant before resumed execution;
- no duplicate artifact/link.

Update K209/C24 only if evidence genuinely closes the gap.
Do not start Workstream 2 or 3.
```

---

# Workstream 2 — atomic human-readable codes in sibling modules / C25

## Status

**KNOWN CROSS-MODULE RELIABILITY DEBT — POST-PHASE-1**

## Human summary

Tasks used to generate numbers approximately like this:

`find the largest current number -> add 1 -> insert`.

Two requests arriving together could both see the same largest number and both choose the same next code. One then failed on the unique constraint.

Tasks were fixed by introducing the shared server-side `entity_code_counters` allocator.

Several other modules still use the old pattern for their own independent code series, for example invoices, deals, leads, orders, subscriptions, projects and support-ticket codes.

This does not corrupt the Task `T-...` series anymore; each of these is a separate series. That is why it is not an AI Phase 1 blocker. But the same concurrency bug still exists inside those modules.

Some of the old generators also sort codes as text, which breaks after digit widths change (`9999` vs `10000`).

## Desired end state

Adopt the already-created shared `entity_code_counters` mechanism for every affected code series.

Each module remains owner of its business entity; only the number-allocation primitive is shared.

## Definition of Done

- inventory every remaining read-max-then-insert generator;
- add an explicit counter scope for each affected series;
- safely seed each scope from existing data using numeric suffix parsing;
- replace old generators with atomic allocation;
- add concurrency regression tests for each important series or a reusable representative test strategy;
- document rollout requirements where old and new allocators cannot safely write simultaneously;
- no unrelated business behavior changes.

## Cursor task prompt

```text
Implement post-Phase-1 Workstream 2: close AI Platform Cleanup C25 — unsafe human-readable code generation in sibling modules.

Read first:
- docs/NBOS/02-Modules/21-AI-Platform/32-Post-Phase-1-Technical-Debt-Plan.md
- docs/NBOS/02-Modules/21-AI-Platform/99-AI-Cleanup-Register.md (C23/C25/C26)
- docs/NBOS/02-Modules/05-Tasks/04-Tasks-Cleanup-Register.md (C9 and Task code allocator history)
- apps/api/src/common/utils/entity-code-counter.ts
- apps/api/src/modules/tasks/task-code-generation.ts
- migration 20260823000000_entity_code_counters

First perform a repository-wide inventory of every business code generator that uses max/read/sort + 1 or equivalent.
Confirm the exact remaining independent series before editing.

Known candidates include:
- invoices;
- support tickets (`TKT-`, not Task `T-`);
- deals;
- leads;
- orders;
- subscriptions;
- projects.

Goal:
move every confirmed affected independent code series to the shared atomic `entity_code_counters` allocator without changing entity ownership or business behavior.

Requirements:
- one named ENTITY_CODE_SCOPE per series;
- safe numeric seeding from real existing codes;
- malformed/nonconforming historical codes handled explicitly, never guessed;
- concurrency-safe allocation;
- year-scoped behavior preserved where the series resets yearly;
- gaps after failed reservations are acceptable; duplicates are not;
- no lexicographic max/sort bug;
- migration/rollout plan must account for old/new writers and avoid an unsafe rolling mixed-writer period if applicable;
- targeted + real-DB concurrency tests.

Do not refactor Support/Automation Task ownership in this workstream except where necessary to preserve the already-fixed `T-` allocator. That is Workstream 3.
Do not start Workstream 1 or 3.
```

---

# Workstream 3 — Support/Automation bypass Tasks domain owner / Tasks C9

## Status

**KNOWN DOMAIN-OWNERSHIP DEBT — POST-PHASE-1**

## Human summary

A Task should normally be created through the Tasks module, because that module owns Task business rules.

Today some Support and Automation flows still create `Task` rows directly through Prisma.

The important code-number race has already been fixed: those writers now use the same Task code allocator, so they no longer corrupt the `T-...` series.

But the architectural problem remains: if Tasks later adds another mandatory rule — provenance, validation, defaults, events, completion metadata, audit behavior, or another invariant — a direct Prisma writer can silently skip it.

So this is not mainly a current data-corruption bug. It is a maintainability and future-correctness problem: multiple modules can partially implement "how to create a Task" themselves.

## Desired end state

Tasks owns one explicit application/domain creation contract that human UI, Support, Automation and future system producers can call with the appropriate actor/source context.

Support and Automation should request Task creation through that contract rather than writing the Task table directly.

This must not force those modules through External Agent authorization. They are trusted internal/system callers, but they should still use the Tasks-owned domain operation.

## Definition of Done

- repository inventory confirms all direct Task creation writers;
- Support and Automation stop direct Task Prisma inserts;
- one Tasks-owned creation operation supports the required caller/source variants;
- existing Support/Automation behavior and provenance are preserved;
- transaction boundaries remain correct;
- no circular module dependency is introduced;
- tests prove Task invariants cannot be bypassed by these flows;
- Tasks Cleanup C9 can be closed.

## Cursor task prompt

```text
Implement post-Phase-1 Workstream 3: close Tasks Cleanup C9 — Support/Automation direct Task writes bypass the Tasks domain owner.

Read first:
- docs/NBOS/02-Modules/21-AI-Platform/32-Post-Phase-1-Technical-Debt-Plan.md
- docs/NBOS/02-Modules/05-Tasks/01-Task-System-Overview.md
- docs/NBOS/02-Modules/05-Tasks/04-Tasks-Cleanup-Register.md (C8/C9 and related ownership notes)
- current TasksService / Tasks module application operations
- SupportService task-creation paths
- AutoTasksService task-creation paths
- task-code-generation.ts and entity-code-counter.ts

Goal:
make Tasks the single owner of Task creation invariants while preserving Support and Automation behavior.

First inventory every direct `prisma.task.create` / equivalent writer outside the Tasks-owned layer and classify it. Do not assume only two callers exist.

Design one Tasks-owned application/domain operation for trusted internal/system callers. Reuse existing creation logic rather than creating a second parallel Tasks API.

Requirements:
- Support/Automation do not write Task rows directly after the refactor;
- preserve source/provenance, links, assignee/creator semantics, workspace resolution, code allocation and current defaults;
- do not route trusted internal modules through External Agent REST/MCP authorization;
- preserve transactional behavior;
- avoid circular Nest module dependencies; use a narrow exported Tasks application service/port if necessary;
- add regression tests proving these callers go through the Tasks-owned invariant path;
- search for and report any remaining direct Task writers that are intentionally different.

Do not redesign the whole automation subsystem.
Do not change unrelated task lifecycle semantics.
Do not start Workstream 1 or 2.
```

---

# Recommended execution order

These workstreams are independent enough to use separate fresh chats.

Recommended order after Phase 1 closure:

1. **Workstream 3 — Tasks ownership**: establishes the clean domain boundary before more producers are added.
2. **Workstream 2 — sibling code allocators**: mechanical but cross-module reliability cleanup.
3. **Workstream 1 — artifact outbox/atomicity**: deepest architectural change; do it as a focused AI+Drive reliability slice with independent review.

Workstream 1 may also be done first if reliable agent artifact production becomes immediately business-critical.

Each workstream should have its own independent verification chat before merge.

## Relation to Phase 1

- Workstream 1 corresponds to the deliberately partial K209/C24 for `tasks.attach_artifact`.
- Workstream 2 is C25 and is outside the External Agent Phase 1 surface.
- Workstream 3 is Tasks Cleanup C9 and is a Tasks domain-ownership cleanup, not an AI authorization requirement.

The Phase 1 closure gate should verify that these are accurately documented and do not invalidate current Phase 1 exit behavior; it should not implement them merely to make every repository debt disappear.
