# External Agent Access

## Goal

Allow trusted external AI development agents to work against NBOS without receiving human sessions, database credentials or broad organization access.

## Phase 1 user story

Admin creates an External Agent, grants it selected capabilities and one or more Work Space scopes, generates a token and configures that token in Cursor or another agent client.

The agent can then:

1. discover only authorized Work Spaces;
2. list/read permitted tasks;
3. read permitted task-linked context and artifacts;
4. perform explicitly granted task actions;
5. upload/link generated artifacts;
6. submit work for review;
7. receive deterministic errors when a requested action is not permitted.

## Admin lifecycle

External Agent states:

- ACTIVE
- DISABLED
- REVOKED
- EXPIRED

Admin operations:

- create;
- rename/describe;
- grant/revoke capabilities;
- grant/revoke scopes;
- issue credential;
- rotate credential;
- revoke credential;
- disable/re-enable agent;
- inspect last use and audit history.

## Token behavior

- opaque bearer credential;
- token displayed once;
- hashed at rest;
- optional expiry;
- independent rotation;
- immediate revocation;
- token prefix for identification without exposing secret;
- no human employee JWT reuse.

## Suggested API boundary

Use a dedicated versioned machine API namespace, for example:

```text
/api/v1/agent/*
```

Exact route naming may change during implementation, but agent auth must be unambiguous from normal employee auth.

## Discovery

Discovery endpoints must themselves be scoped. A token cannot use search/list endpoints to infer unauthorized Project, Product, Work Space or Task names.

## Workspace task flow

Recommended semantic workflow:

```text
list tasks
 -> read task/context
 -> start task
 -> work externally
 -> post progress / attach artifacts
 -> submit for review
```

The external agent must not mark a task completed if normal Tasks completion/review rules require a human review step.

## Comments and provenance

Agent-authored task discussion entries should visibly identify the agent as author/source rather than impersonating an employee.

## Files

File reads/writes use Drive contracts.

Generated code archives, reports, screenshots or other persisted outputs become Drive File Assets and are linked to Task/WorkSpace using existing Drive ownership principles.

## Rate limits

Apply limits independently per agent credential/actor. Human UI limits must not be reused blindly.

## Security

- TLS required;
- no secret query-string tokens;
- redact Authorization headers from logs;
- deny credential vault access in Phase 1;
- do not expose arbitrary internal APIs simply because a route is reachable;
- validate payload size/type;
- audit mutations and material reads where policy requires it.

## Future protocols

MCP or another agent protocol may later wrap the same capabilities. REST Phase 1 must not embed Cursor-specific assumptions into domain services.
