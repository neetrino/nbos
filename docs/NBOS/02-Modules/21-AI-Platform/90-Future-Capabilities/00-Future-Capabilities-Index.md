# AI Future Capabilities Index

## Purpose

This directory is the controlled design backlog for future AI Platform capabilities that have not yet become implemented canon.

It exists so future functionality is discussed, designed and recorded without mixing speculative behavior into the current production canon.

## Canon summary

**Future capability design backlog.**

## Required workflow for every new AI idea

```text
Idea
  -> discuss and clarify purpose
  -> decide whether it belongs in AI Platform
  -> record in this index
  -> if substantial/approved: create a dedicated capability document
  -> assign status and target phase
  -> when implementation is planned: create/extend executable checklist
  -> implement and verify
  -> move final implemented rules into normal canonical module documents
  -> mark the Future Capability document DONE and link the final canon
```

Do not place a future idea directly into current production rules unless the idea has already been approved as current behavior.

## Where to put a new idea

### Small/raw idea

If the idea is still only a sentence and has not been designed, add it to the `Idea Inbox` in this file.

Example:

```text
- AI meeting summarization
- proactive project-risk detection
- automatic sales coaching
```

Do not create a separate file for every undeveloped thought.

### Substantial or approved idea

Create a dedicated file in this directory when at least one is true:

- the idea has been discussed and we want to preserve the decision;
- it affects architecture, permissions, memory, data, security or multiple modules;
- it has meaningful functional requirements;
- it is a likely Phase/V2 candidate;
- implementation could otherwise misunderstand the intended behavior.

Naming convention:

```text
90-Future-Capabilities/
  00-Future-Capabilities-Index.md
  01-<Capability-Name>.md
  02-<Capability-Name>.md
  ...
```

Use the next available numeric prefix. Do not renumber existing capability documents.

## Required header for a dedicated capability document

Every dedicated Future Capability document must begin with enough information for another AI or engineer to understand its state immediately:

```text
Status: IDEA | DESIGNING | APPROVED | PLANNED | IN_IMPLEMENTATION | DONE | DEFERRED | REJECTED
Target: Unscheduled | V2 candidate | Phase 2 | <named phase>
Priority: LOW | MEDIUM | HIGH | CRITICAL
Canon summary: <one short sentence>
```

`Canon summary` should explain the capability in one sentence without requiring the reader to open the full design.

## Recommended document structure

A substantial capability document should normally contain:

1. Goal
2. Why we need it
3. User/business scenarios
4. Functional requirements
5. Intended architecture
6. Data ownership and source of truth
7. Permissions / scopes / security
8. AI context / memory / knowledge behavior where relevant
9. Integration with existing AI Platform concepts
10. Non-goals
11. Dependencies
12. Open decisions
13. Future acceptance criteria
14. Canonization plan after implementation

Not every document needs every section, but architecture/security/data behavior must never be omitted when material.

## Status meanings

- `IDEA` — captured but not designed/approved.
- `DESIGNING` — actively being discussed and shaped.
- `APPROVED` — desired future capability and design direction accepted.
- `PLANNED` — assigned to a concrete implementation phase/release.
- `IN_IMPLEMENTATION` — executable implementation work has started.
- `DONE` — implemented and final behavior has been moved into current canon.
- `DEFERRED` — intentionally postponed.
- `REJECTED` — considered and intentionally not pursued.

## Canonization rule

`90-Future-Capabilities` must never become a second production canon.

When a capability is implemented:

1. update the appropriate normal AI Platform/module canon with the actual implemented rules;
2. update any implementation checklist/roadmap/cleanup register;
3. change the Future Capability document to `DONE`;
4. add explicit links under `Canonicalized into:`;
5. leave the design document as historical decision context, not the active source of truth.

Example:

```text
Status: DONE
Canonicalized into:
- ../12-AI-Prompts-Context-Memory-and-Knowledge.md
- ../../19-Messenger/<relevant-canon>.md
```

If implementation differs from the original future design, the final canon wins.

## Promotion to implementation

An `APPROVED` Future Capability does not automatically enter the current implementation scope.

Before coding begins it should normally be promoted to `PLANNED` and translated into an executable implementation checklist or milestone with:

- exact scope;
- migrations/data changes;
- APIs/capabilities;
- UI;
- security/negative tests;
- regression tests;
- acceptance criteria.

This preserves the separation:

```text
CURRENT CANON
= what the platform currently promises / has approved for current implementation

FUTURE CAPABILITIES
= what we want to build next and how it should fit

IMPLEMENTATION CHECKLIST
= what is actively being built and verified

CLEANUP REGISTER
= known stale/conflicting/gap work
```

## Idea Inbox

Add undeveloped ideas here first. Promote them to dedicated numbered documents after discussion when they become substantial.

- No unstructured ideas recorded yet.

## Capability register

| ID | Capability | Status | Target | Priority | Canon summary |
| --- | --- | --- | --- | --- | --- |
| 01 | Project Knowledge and Customer Memory | APPROVED | V2 / Phase 2 candidate | HIGH | Give each project controlled AI knowledge plus isolated customer/conversation memory and live NBOS context so customer-facing agents answer with current, project-specific information. |
