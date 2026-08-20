# External Agent Access

## Goal

Allow trusted external AI development agents to work against NBOS without receiving human sessions, database credentials or broad organization access.

## Phase 1 user story

Admin creates an External Agent, grants it selected capabilities and one or more Work Space scopes, issues a credential and configures that credential in Cursor, Codex, Claude Code or another trusted machine client.

The agent can then:

1. discover only authorized Work Spaces;
2. list/read permitted tasks;
3. read permitted task-linked context and artifacts;
4. create tasks when `tasks.create` is explicitly granted;
5. modify explicitly allowlisted task fields when `tasks.update` is explicitly granted;
6. start work using the semantic Task action;
7. add comments/progress and upload/link generated artifacts;
8. submit work for review;
9. receive deterministic errors when a requested action is not permitted.

Phase 1 does **not** permit task deletion or force-completion bypass.

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

## Protocols in Phase 1

Phase 1 supports both:

1. versioned REST machine API;
2. remote MCP adapter/server for agent-native tool discovery/invocation.

Both authenticate the same External Agent identity and call the same:

```text
Actor -> Policy -> Capability -> Domain Action -> Audit
```

MCP is not a separate permission system and does not contain independent business logic.

Canonical protocol details are defined in:

- `08-External-Agent-Protocols-REST-and-MCP.md`
- `09-External-Agent-API-and-MCP-Contract.md`

## REST boundary

Use a dedicated machine namespace such as:

```text
/api/v1/agent/*
```

Agent authentication must remain unambiguous from normal employee auth.

## MCP boundary

Expose a remote MCP endpoint backed by the same agent credential/policy system.

Local clients should require only the NBOS MCP/API URL and an NBOS External Agent token; they never receive PostgreSQL credentials, SSH access, provider API keys or employee admin sessions.

## Discovery

Discovery endpoints/tools are themselves scoped. A token cannot use search/list operations to infer unauthorized Project, Product, Work Space or Task names/counts.

## Workspace task flow

Recommended coding-agent workflow:

```text
list/read tasks
 -> optional create/update (only if separately granted)
 -> start task
 -> work externally
 -> post progress / attach artifacts
 -> submit for review
 -> human review/completion
```

### Create

`tasks.create` is a separate optional capability. It must use an authorized target Work Space, strict input schema, normal Tasks business validation and idempotency.

### Update

`tasks.update` is a separate optional capability. It is an allowlisted semantic/business update, not unrestricted ORM patching.

Generic update must not permit:

- deletion;
- arbitrary status changes that bypass semantic actions;
- final-completion bypass;
- unrelated Work Space reassignment;
- hidden system/audit/security fields.

### Delete

Task deletion is unavailable to External Agents in Phase 1.

A future deletion capability requires a separate risk/business design and is not implied by `tasks.update`.

### Completion

The external agent must not force a task Completed if normal Tasks completion/review rules require human acceptance.

## Comments and provenance

Agent-authored Task discussion/activity entries visibly identify the External Agent/source rather than impersonating an employee.

## Files

File reads/writes use Drive contracts.

Generated code archives, reports, screenshots or other persisted outputs become Drive File Assets and are linked to Task/Work Space using existing Drive ownership principles.

## Rate limits

Apply limits independently per agent credential/actor. Human UI limits must not be reused blindly.

## Security

- TLS required;
- no secret query-string tokens;
- redact Authorization headers from logs;
- deny credential vault secret access in Phase 1;
- do not expose arbitrary employee/internal APIs merely because a route is reachable;
- validate payload size/type;
- audit mutations and material reads where policy requires it;
- apply the same authorization decisions through REST and MCP.

## Future expansion

The same External Agent foundation may later grant capabilities/scopes beyond Work Spaces, such as approved analytics, CRM or document operations.

Adding a new protocol or domain must reuse the same actor/policy/capability architecture rather than creating a second access system.
