# AI Capability and Domain Action Layer

## Purpose

The capability layer is the stable contract between AI clients and NBOS business modules.

External protocol adapters and internal AI tools must call capabilities, not raw Prisma operations.

## Capability contract

Each capability definition should describe:

- stable key;
- version;
- owning module;
- read/write/risk class;
- allowed scope types;
- required input schema;
- output schema/projection;
- idempotency requirement;
- audit behavior;
- approval policy;
- rate-limit class.

Example conceptual definition:

```text
key: tasks.submit_review
owner: Tasks
risk: MEDIUM
scopes: [WORKSPACE, TASK]
idempotent: true
approval: NONE
```

## Domain Action Gateway

All writes must call module-owned services or explicit application commands.

Incorrect:

```text
AI controller -> Prisma.task.update()
```

Correct:

```text
AI adapter
 -> authenticate actor
 -> evaluate policy
 -> invoke capability
 -> Tasks application/domain service
 -> business validation
 -> database commit
 -> audit
```

## Task Phase 1 capability catalog

Read:

- `workspaces.read`
- `tasks.list`
- `tasks.read`
- `tasks.read_links`
- `tasks.read_discussion`
- `drive.read_task_artifact`

Write:

- `tasks.create`
- `tasks.update`
- `tasks.start`
- `tasks.comment`
- `tasks.submit_review`
- `tasks.attach_artifact`

Optional only if existing task domain contract supports it safely:

- `tasks.update_checklist`
- `tasks.request_clarification`

Do not expose a generic `tasks.set_status(anyStatus)` if narrower semantic commands can express the intended transitions.

## Semantic commands

Prefer business-intent commands:

- start task;
- submit for review;
- add progress note;
- attach artifact;
- request clarification.

This reduces accidental bypass of lifecycle logic and makes future policy easier.

## Reads

AI read projections should be purpose-built and minimal.

Task projection may include:

- id/code/title;
- description;
- priority/status;
- due date;
- workspace/sprint context;
- allowed links;
- checklist state;
- permitted discussion context;
- permitted artifact metadata.

Do not automatically include unrelated project finances, credentials, full client profile or all Drive contents.

## Idempotency

Mutation capabilities vulnerable to retries must accept a client operation id / idempotency key.

Server stores enough state to return the original result for a duplicate safe retry.

## Optimistic/concurrent updates

Where concurrent human/agent edits can conflict, mutations should support version or updatedAt preconditions where practical.

Never silently overwrite a materially newer human change from stale agent context.

## Capability lifecycle

Capabilities must support deprecation/versioning.

Breaking input/output or semantic changes require a new version or controlled compatibility layer.

Do not make Cursor-specific contracts canonical domain contracts.
