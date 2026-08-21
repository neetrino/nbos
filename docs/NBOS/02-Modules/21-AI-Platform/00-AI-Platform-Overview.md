# AI Platform Overview

## Purpose

`AI Platform` is the NBOS module responsible for AI identities, capabilities, policies, execution boundaries, agent credentials, AI audit semantics and shared runtime contracts.

It does not own CRM, Tasks, Finance, Documents, Drive, Messenger or other business data. Those modules remain owners of their entities and business rules.

## Core responsibilities

- register internal and external AI actors;
- authenticate external agents;
- assign capabilities and resource scopes;
- evaluate policy decisions;
- create approval requirements for risky actions;
- provide a shared domain-action gateway;
- preserve actor identity through API/queue/worker execution;
- expose administration and revocation controls;
- emit complete AI audit records;
- enforce data-minimization and secret restrictions.

## Actor types

- `USER`
- `EXTERNAL_AGENT`
- `INTERNAL_AI`
- `SYSTEM`
- `AUTOMATION`

AI actors are not Employees.

## Main subdomains

1. Actor Identity
2. Agent Credentials
3. Capability Registry
4. Policy & Scope Evaluation
5. Domain Action Gateway
6. Approval Flow
7. AI Execution Tracking
8. Audit & Security
9. Usage / Rate Limits
10. Internal AI Runtime (later)

## Phase 1 target

Phase 1 delivers an external Work Space agent capable of safely operating approved Tasks and linked artifacts inside a narrow Work Space scope.

Baseline capabilities:

- list/read authorized workspace tasks;
- read allowed task metadata and discussion context;
- read allowed linked Drive artifacts;
- create/update a task where allowed;
- start work;
- add progress/comment information;
- submit work for review;
- attach generated artifacts through Drive;
- receive deterministic policy errors;
- support idempotent writes.

## Future capability workflow

Future AI functionality must not be mixed casually into current production canon.

Canonical rule:

```text
new/raw idea
  -> record briefly in `90-Future-Capabilities/00-Future-Capabilities-Index.md`
  -> discuss/design it
  -> if substantial or approved, create a dedicated numbered file in `90-Future-Capabilities/`
  -> assign Status / Target / Priority / one-sentence Canon summary
  -> when scheduled, promote it into an executable implementation checklist/milestone
  -> after implementation, move final rules into normal active canon and mark the future document DONE
```

For every new AI idea, another AI/engineer should be able to understand from the Future Capabilities Index in a few seconds:

- what the capability is;
- its current status;
- target phase/release;
- priority;
- one-sentence design/canon summary;
- which dedicated file contains the full design when one exists.

Use `90-Future-Capabilities/00-Future-Capabilities-Index.md` as the canonical workflow/routing document for future AI ideas.

Do not create a separate file for every undeveloped sentence. Raw ideas belong in the Index `Idea Inbox`; substantial/approved capabilities receive their own numbered design file.

`90-Future-Capabilities` is a controlled future-design backlog, not a second production canon. Once functionality is implemented, the active module canon is the source of truth.

## Boundaries

The AI Platform must not:

- execute raw SQL on behalf of agents;
- return Credential secrets;
- bypass module services;
- silently impersonate a human;
- invent business data;
- treat client integrations such as Meta/Gmail as AI agent identities;
- become a second task/workflow engine.

## Source of truth

- domain data: owned by each NBOS module;
- AI actor/grant/execution data: AI Platform;
- human roles/access: existing RBAC and Platform Access Foundation;
- files: Drive;
- audit: shared Audit foundation;
- future AI capability design backlog: `90-Future-Capabilities/`;
- implemented behavior: normal active AI Platform and owning-module canon, not Future Capabilities documents.

## Canon references

- `01-Platform-Overview/05-AI-Platform-Architecture.md`
- `00-Technical-Decisions-By-Module.md`
- `02-Modules/07-My-Company/09-Platform-Access-Foundation.md`
- `02-Modules/05-Tasks/*`
- `02-Modules/11-Drive/*`
- `90-Future-Capabilities/00-Future-Capabilities-Index.md`
