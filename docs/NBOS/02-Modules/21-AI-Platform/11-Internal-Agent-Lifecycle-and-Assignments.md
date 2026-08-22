# Internal Agent Lifecycle and Assignments

## Purpose

Define Internal AI Agents as stable NBOS actors/configurations independent from any specific provider model.

## Core rule

```text
Surface / Domain
      -> Internal Agent
      -> Policy + Capabilities + Scope + Prompt
      -> Model Policy
      -> Provider Model(s)
```

An Internal Agent is not a model name and is not automatically privileged because it runs inside NBOS.

## Internal Agent entity

Conceptual properties:

```text
InternalAIAgent
- id
- name
- description/purpose
- status
- ownerEmployeeId
- capabilities
- resource scopes
- channels/surfaces
- promptPolicyId
- modelPolicyId
- approvalPolicyId
- execution settings
- environment
- createdAt
- updatedAt
```

Possible statuses:

- DRAFT
- ACTIVE
- PAUSED
- DISABLED
- ARCHIVED

## Examples

- NBOS General Assistant
- Client Messenger Agent
- CRM Assistant
- Delivery / Project Agent
- Documents Assistant
- Sales Analytics Agent
- Marketing Analytics Agent
- Finance Analytics Agent

These should be separate actor identities even if several use the same provider/model.

## Assignment model

Business surfaces bind to an Internal Agent, not directly to a provider model.

Examples:

```text
Messenger client auto-reply -> Client Messenger Agent
Documents AI actions        -> Documents Assistant
Sales reporting             -> Sales Analytics Agent
Task assistance             -> Delivery Assistant
```

One Internal Agent may be assigned to multiple compatible surfaces only when its capability/scope/prompt policy is intentionally shared.

Do not create one global super-agent for all NBOS modules by default.

## Capability and scope

Internal Agents use the same capability/policy architecture as External Agents.

Effective access must be deny-by-default and may additionally intersect with an initiating user/customer/session context.

Conceptually:

```text
Effective authorization =
agent grants
INTERSECT initiating principal rights where applicable
INTERSECT module policy
INTERSECT resource scope
INTERSECT data/risk policy
```

An internal agent cannot use a human initiation event as permission escalation.

## Channels

Internal Agent execution may originate from:

- employee AI chat;
- Messenger conversation;
- task action;
- document action;
- scheduled automation;
- system event;
- manual admin/test execution.

Channel/source must be preserved in execution and audit context.

## onBehalfOf

When a human initiates an AI action:

```text
actor = INTERNAL_AI:<agentId>
onBehalfOf = USER:<employeeId>
```

For customer-facing contexts, the execution may also carry a customer/conversation/session subject reference without turning the customer into an Employee.

## Model Policy assignment

Each active Internal Agent references a Model Policy.

Supported initial modes are defined in `06-AI-Providers-Models-and-Routing.md`:

- FIXED
- PRIMARY_FALLBACK

Changing a Model Policy or its candidate model must not change domain permissions or prompt policy automatically.

## Prompt Policy assignment

Agent behavior instructions are versioned configuration, not hardcoded model identity.

The active agent should reference a published prompt/config version. Draft versions may be tested without becoming production behavior.

See `12-AI-Prompts-Context-Memory-and-Knowledge.md`.

## Approval Policy assignment

Agent-level default risk/approval settings may further restrict capability-level policy.

Examples:

- Client Messenger Agent may auto-send low-risk FAQ answers but require human approval for refund/contract/financial promises.
- Finance Analytics Agent may read approved finance data but have no write capabilities.

See `13-AI-Risk-and-Approval-Policy.md`.

## Lifecycle

### Create

Admin creates an agent in DRAFT.

### Configure

Assign:

- capabilities;
- scopes;
- surface/channel;
- prompt policy;
- model policy;
- approval policy;
- usage limits.

### Validate

Before activation, system validates required provider/model/config dependencies and policy consistency.

### Activate

Only explicitly activated agent may serve production traffic.

### Pause/Disable

Pause/disable blocks new executions immediately. Queued sensitive actions should revalidate state before commit.

### Archive

Historical audit/execution data remains attributable after archival.

## Configuration changes

Material changes should be auditable:

- capability/scope changes;
- prompt version publish;
- model policy assignment;
- approval policy assignment;
- surface assignment;
- activate/pause/disable/archive.

Where practical, executions should record the relevant configuration version IDs to support later debugging/reproducibility.

## First implementation scope

Build enough foundation now to represent and administer Internal Agents even if full model execution/chat runtime comes later:

- persistence/entity;
- status lifecycle;
- capability/scope linkage;
- model policy linkage;
- prompt policy linkage to a published Prompt Policy/Version;
- approval policy linkage placeholder/contract;
- surface assignment model;
- admin UI shell;
- audit.

Do not require full RAG, memory, adaptive routing or autonomous orchestration for this foundation.
