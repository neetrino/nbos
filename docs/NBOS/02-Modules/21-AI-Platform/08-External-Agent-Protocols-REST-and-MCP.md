# External Agent Protocols — REST and MCP

## Decision

Phase 1 should support both:

1. a versioned REST machine API as the stable transport/API contract;
2. an MCP adapter/server for agent-native tool discovery and invocation.

MCP does not own business logic and does not bypass REST/domain authorization concepts.

## Architecture

```text
Cursor / Codex / Claude Code / custom client
        | REST              | MCP
        v                   v
External Agent Adapters / Protocol Layer
                 |
                 v
          ActorContext
                 |
                 v
       Policy / Capability Layer
                 |
                 v
        Domain Action Gateway
                 |
          Tasks / Drive / ...
                 |
                 v
               Audit
```

REST and MCP must invoke the same capability/domain-action services.

Do not duplicate Task logic, authorization or audit behavior in MCP handlers.

## REST role

REST remains useful for:

- generic machine clients;
- automation scripts;
- deterministic integration tests;
- OpenAPI contract generation;
- debugging/troubleshooting;
- integrations that do not support MCP.

Recommended namespace:

```text
/api/v1/agent/*
```

## MCP role

MCP is the preferred ergonomic interface for coding/AI clients that support it.

The MCP server exposes purpose-built NBOS tools mapped to capabilities.

Initial tool set may include:

```text
nbos_list_workspaces
nbos_list_tasks
nbos_get_task
nbos_get_task_discussion
nbos_get_task_artifacts
nbos_start_task
nbos_create_task
nbos_update_task
nbos_add_task_comment
nbos_attach_task_artifact
nbos_submit_task_review
```

Exact names may be adjusted to project conventions, but every tool maps to a defined capability and scope check.

There is no delete-task tool in the initial external coding-agent release.

## Authentication

External agent identity/credentials are the same logical identity regardless of REST or MCP transport.

An administrator creates one External Agent and its grants, then may use its credential with REST and/or MCP according to the supported client setup.

Do not create a second independent MCP permission model.

## Tool discovery is not authorization

An MCP client may learn that a generic tool exists, but actual resource/action access is always evaluated server-side.

Where useful, the server may expose only tools compatible with the actor's capabilities, but this is UX hardening, not the security boundary.

## Local client connection

A local coding agent does not receive database/VPS access.

It connects over TLS to the public/private NBOS machine endpoint and receives only authorized projections/actions.

Conceptually:

```text
Local Cursor/Codex/Claude
       -> HTTPS REST or MCP
       -> NBOS External Agent Auth
       -> Policy
       -> authorized capability
```

## Phase 1 permissions for coding agents

The access system must allow administrators to grant capabilities independently.

Available Task capabilities should include at minimum:

- read/list Tasks;
- read discussion;
- read linked artifacts;
- start Task;
- create Task (optional grant);
- update Task allowed fields (optional grant);
- add comments/progress;
- attach generated artifacts;
- submit for Review.

Task deletion is intentionally not exposed in the initial release.

Task completion must still follow normal Tasks workflow/completion/review controls; an external agent must not receive an unrestricted force-complete capability.

## Update semantics

`task.update` must be field-allowlisted and capability-controlled.

Do not expose a generic unrestricted patch that can silently alter protected fields or workflow state.

Examples of potentially allowed fields depending on policy:

- title;
- description;
- priority;
- due date;
- selected metadata/tags;
- assignee only if explicitly approved by Tasks canon/policy.

Workflow transitions should prefer semantic commands such as start/submit-review rather than arbitrary status assignment.

## Task creation

Task creation is an explicit capability, not a default side effect of read access.

Creation input must be scoped so an agent cannot choose an unauthorized Work Space/Project/Product relationship.

The server resolves/validates target scope and applies normal Tasks business rules.

## Protocol/version evolution

REST uses explicit API versioning.

MCP tool contracts should evolve compatibly and may expose capability/tool metadata versions when needed.

Deprecation must be observable before removal.

## Testing

Every material operation should be tested through the shared capability layer, plus protocol adapter tests proving REST and MCP produce equivalent authorization outcomes.

Critical tests:

- same actor has same effective rights over REST and MCP;
- cross-workspace denial over both protocols;
- revoked credential blocks both protocols;
- create/update rights require explicit capability;
- delete unavailable;
- audit provenance identifies the same External Agent regardless of protocol.