# External Agent API and MCP Contract

## Status

Canonical Phase 1 transport contract for trusted external AI agents.

The REST API and MCP server are two protocol adapters over the same External Agent authentication, Policy Evaluator, Capability Layer and NBOS domain services.

Neither protocol may implement separate authorization or business logic.

---

## 1. Authentication

External agents authenticate with an NBOS-issued opaque bearer token.

```http
Authorization: Bearer <agent-token>
```

Rules:

- token belongs to an External Agent credential, not an Employee;
- raw token is displayed once at issuance/rotation;
- token is stored hashed at rest;
- disabled/revoked/expired actor or credential is rejected immediately;
- Authorization values are never logged;
- token is never accepted as a query-string secret;
- all machine endpoints require TLS in production.

MCP remote transport uses the same External Agent credential and resolves the same ActorContext.

---

## 2. REST namespace

Canonical Phase 1 namespace:

```text
/api/v1/agent
```

Do not expose employee controllers directly to agent credentials.

Suggested endpoints:

### Identity / discovery

```text
GET  /api/v1/agent/me
GET  /api/v1/agent/workspaces
GET  /api/v1/agent/workspaces/:workspaceId
```

### Tasks

```text
GET   /api/v1/agent/workspaces/:workspaceId/tasks
GET   /api/v1/agent/tasks/:taskId
POST  /api/v1/agent/workspaces/:workspaceId/tasks
PATCH /api/v1/agent/tasks/:taskId
POST  /api/v1/agent/tasks/:taskId/start
POST  /api/v1/agent/tasks/:taskId/comments
POST  /api/v1/agent/tasks/:taskId/submit-review
```

### Task context / artifacts

```text
GET  /api/v1/agent/tasks/:taskId/discussion
GET  /api/v1/agent/tasks/:taskId/artifacts
POST /api/v1/agent/tasks/:taskId/artifacts
GET  /api/v1/agent/artifacts/:artifactId/download
```

Exact route mechanics may adapt to established NBOS API conventions, but the semantic capability boundaries in this document are canonical.

---

## 3. Phase 1 capability mapping

| REST operation | Capability | Notes |
|---|---|---|
| GET workspaces | `workspaces.read` | returns only authorized Work Spaces |
| GET workspace | `workspaces.read` | scope checked |
| GET workspace tasks | `tasks.list` | scope checked |
| GET task | `tasks.read` | minimal projection |
| POST task | `tasks.create` | optional grant; allowed in Phase 1 |
| PATCH task | `tasks.update` | optional grant; field allowlist only |
| POST start | `tasks.start` | semantic transition |
| POST comments | `tasks.comment` | preserves AI provenance |
| POST submit-review | `tasks.submit_review` | semantic transition |
| GET discussion | `tasks.read_discussion` | scoped read |
| GET artifacts | `drive.read_task_artifact` | linked artifacts only |
| POST artifacts | `tasks.attach_artifact` | through Drive contracts |

Phase 1 deliberately does **not** expose:

- `tasks.delete`;
- generic arbitrary `tasks.set_status`;
- `tasks.force_complete`;
- Credentials secrets;
- unrestricted Finance mutation;
- unrestricted Messenger/client send.

Task creation and allowed-field update are grantable capabilities, not implicit rights.

---

## 4. Task create contract

`tasks.create` must require an authorized target Work Space and a strict input schema.

Suggested request shape:

```json
{
  "title": "Fix checkout race condition",
  "description": "...",
  "priority": "HIGH",
  "dueDate": null,
  "assigneeId": null,
  "reviewerId": null,
  "clientOperationId": "agent-generated-id"
}
```

Rules:

- server derives/validates Work Space scope;
- client cannot attach the task to an unrelated Project/Product/entity by guessed ID;
- server applies Tasks defaults and normal business validation;
- idempotency prevents duplicate create on retry;
- capability may be disabled per External Agent.

---

## 5. Task update contract

`tasks.update` is not a generic ORM patch.

Phase 1 editable fields must use an explicit allowlist derived from Tasks canon/runtime. Example candidate fields:

- title;
- description;
- priority;
- dueDate;
- allowed assignee/reviewer fields only if Tasks policy supports them;
- permitted checklist/progress fields if separately approved.

Explicitly excluded from generic update:

- deletion;
- arbitrary status;
- completion bypass;
- workspace reassignment outside authorized workflow;
- hidden ownership/security fields;
- audit/system fields.

If a status change has a semantic capability such as `tasks.start` or `tasks.submit_review`, the generic update route must reject direct status manipulation for that transition.

Use optimistic preconditions/version/updatedAt where stale overwrite is material.

---

## 6. Task lifecycle semantics

Coding-agent expected flow:

```text
read/list
 -> optional create/update
 -> start
 -> work externally
 -> comment/progress
 -> attach artifacts
 -> submit review
 -> human review/completion
```

An External Agent cannot delete a task in Phase 1.

An External Agent cannot force final completion when normal Tasks rules require human acceptance.

If human review returns work to an active state, the agent may read the new state/comments and continue if its grants still allow it.

---

## 7. Response envelope

Use existing NBOS API standards where compatible. Machine errors must remain deterministic.

Suggested successful collection shape:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 50,
    "total": 0
  }
}
```

Suggested error shape:

```json
{
  "error": {
    "code": "AGENT_SCOPE_DENIED",
    "message": "The requested operation is not available to this agent.",
    "requestId": "..."
  }
}
```

Do not reveal whether an unauthorized record exists.

---

## 8. Stable error codes

Minimum machine-readable classes:

```text
AGENT_AUTH_INVALID
AGENT_CREDENTIAL_REVOKED
AGENT_CREDENTIAL_EXPIRED
AGENT_DISABLED
AGENT_CAPABILITY_DENIED
AGENT_SCOPE_DENIED
AGENT_APPROVAL_REQUIRED
AGENT_RESOURCE_NOT_AVAILABLE
AGENT_VALIDATION_FAILED
AGENT_CONFLICT
AGENT_IDEMPOTENCY_CONFLICT
AGENT_RATE_LIMITED
AGENT_PROVIDER_UNAVAILABLE
```

HTTP status mapping follows normal semantics while preserving anti-enumeration behavior.

---

## 9. Idempotency

All retry-sensitive agent mutations must accept an idempotency/client operation identifier.

Recommended REST header:

```text
Idempotency-Key: <stable-client-operation-id>
```

The server scopes it to authenticated actor/credential + capability and returns the original compatible result for a duplicate safe retry.

MCP mutation tools expose equivalent `clientOperationId` input where protocol headers are not sufficient.

---

## 10. Pagination, filtering and sorting

List endpoints must define stable bounded pagination.

Tasks should support only agent-useful filters that preserve scope, for example:

- status;
- priority;
- sprint;
- updatedSince;
- assigned/reviewer state where authorized.

Sorting should be deterministic and bounded.

No global search endpoint may reveal unauthorized entity names/counts.

---

## 11. MCP endpoint

Phase 1 provides a remote MCP server backed by the same NBOS External Agent auth and capabilities.

Canonical deployment concept:

```text
https://<nbos-host>/mcp
```

Transport details follow the chosen supported MCP remote transport for the implementation stack.

MCP authentication resolves the same credential -> External Agent -> ActorContext path as REST.

---

## 12. MCP tool catalog

Canonical Phase 1 tool names:

```text
nbos_get_identity
nbos_list_workspaces
nbos_get_workspace
nbos_list_tasks
nbos_get_task
nbos_create_task
nbos_update_task
nbos_start_task
nbos_get_task_discussion
nbos_add_task_comment
nbos_list_task_artifacts
nbos_get_task_artifact
nbos_attach_task_artifact
nbos_submit_task_review
```

Tools must use structured schemas and never instruct the model to call internal REST routes manually as a substitute for authorization.

---

## 13. MCP -> capability mapping

| MCP tool | Capability |
|---|---|
| `nbos_list_workspaces` | `workspaces.read` |
| `nbos_get_workspace` | `workspaces.read` |
| `nbos_list_tasks` | `tasks.list` |
| `nbos_get_task` | `tasks.read` |
| `nbos_create_task` | `tasks.create` |
| `nbos_update_task` | `tasks.update` |
| `nbos_start_task` | `tasks.start` |
| `nbos_get_task_discussion` | `tasks.read_discussion` |
| `nbos_add_task_comment` | `tasks.comment` |
| `nbos_list_task_artifacts` | `drive.read_task_artifact` |
| `nbos_get_task_artifact` | `drive.read_task_artifact` |
| `nbos_attach_task_artifact` | `tasks.attach_artifact` |
| `nbos_submit_task_review` | `tasks.submit_review` |

REST and MCP must produce equivalent authorization decisions for equivalent operations.

---

## 14. MCP resources/prompts

Phase 1 does not need broad MCP Resources that mirror all NBOS data.

Prefer explicit tools with authorization-aware projections.

If MCP Resources are introduced later, discovery and read access must use the same scope/policy engine and must not create an alternate data-exfiltration path.

Server-provided MCP Prompts, if later added, are convenience templates only and never authorization policy.

---

## 15. Artifacts

Artifacts are owned by Drive.

External agent artifact access must:

- verify Task/Work Space link;
- use short-lived/safe download mechanisms;
- preserve Drive access policy;
- validate upload size/type;
- record agent provenance;
- prevent arbitrary bucket/object traversal.

---

## 16. Correlation and audit

Each REST/MCP invocation should produce/propagate a request or correlation ID.

Audit should be able to identify:

- actor;
- credential/client metadata when safe;
- protocol (`REST` or `MCP`);
- capability;
- target resource;
- result;
- correlation ID;
- idempotency identity for mutations where appropriate.

Never store raw tokens or provider secrets.

---

## 17. Contract parity tests

Phase 1 acceptance must prove:

- REST and MCP both deny unauthorized Workspace access;
- REST and MCP both allow the same granted capability;
- create/update grants are independently controllable;
- delete is unavailable from both transports;
- semantic status protections are identical;
- token revoke/agent disable blocks both transports;
- idempotent mutation retry does not duplicate effects;
- audit records protocol + actor + capability consistently.

---

## 18. Client setup goal

A local Cursor/Codex/Claude Code client should need only:

- NBOS base/MCP URL;
- one NBOS External Agent token;
- protocol-specific client configuration.

It must never require:

- database credentials;
- employee session cookies/JWT;
- direct server SSH;
- provider API keys;
- broad NBOS administrator credentials.
