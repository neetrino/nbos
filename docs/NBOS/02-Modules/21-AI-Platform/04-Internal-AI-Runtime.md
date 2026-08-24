# Internal AI Runtime

## Status

The Phase 1 configuration/security foundation is complete. The full Internal AI
execution runtime is planned for Phase 2 and remains blocked by
`37-AI-Product-Entry-Gate.md` until the final gate acceptance exists.

The Phase 2 scope and execution contract are defined in:

- `42-Phase-2-Project-Intelligence-and-Draft-Assistant-Architecture.md`;
- `43-Phase-2-Implementation-Checklist.md`;
- `44-Phase-2-Execution-Strategy.md`;
- `45-Phase-2-Acceptance-Migration-Rollout-and-Operations.md`.

## Principle

Internal AI is another AI actor using the same capability/policy/domain-action layer as external agents.

Running inside NBOS does not grant implicit superuser access.

## Phase 1 foundation delivered

Phase 1 established:

- Internal Agent identity/lifecycle foundation;
- provider connection abstraction;
- OpenAI provider connection;
- Anthropic provider connection;
- provider credential lifecycle/security;
- model catalog synchronization;
- model enable/disable lifecycle;
- Model Policy / Routing Profile foundation;
- `FIXED` routing mode;
- `PRIMARY_FALLBACK` routing mode;
- Internal Agent -> Model Policy linkage;
- prompt-policy/versioning foundation;
- approval/risk contract foundation;
- execution/usage/cost attribution fields/contracts;
- central AI administration UI shell.

These foundations do not imply that employee AI chat, Messenger AI or RAG are production-enabled in Phase 1.

## Phase 2 planned runtime responsibilities

The execution runtime owns or coordinates:

- provider/model invocation adapters;
- runtime model routing;
- system/prompt templates and published versions;
- conversation/session state;
- context assembly;
- tool/capability selection;
- approval requests;
- execution tracking;
- token/cost/latency metrics;
- fallback execution;
- structured output validation;
- retry/error handling;
- Project/Product knowledge retrieval and isolated customer/conversation memory.

## Internal Agents

Possible specialized agents:

- NBOS General Assistant;
- Client Messenger Agent;
- CRM Assistant;
- Delivery / Project Agent;
- Documents Assistant;
- Sales Analytics Agent;
- Marketing Analytics Agent;
- Finance Analytics Agent.

These are separate actor identities/policies even if they use the same underlying provider/model.

Canonical lifecycle and assignment rules are defined in:

- `11-Internal-Agent-Lifecycle-and-Assignments.md`

## Agent != Model

Business surfaces bind to an Internal Agent, not directly to a raw model name.

```text
Surface / Domain
 -> Internal Agent
 -> capabilities / scope / prompt / approval policy
 -> Model Policy
 -> one or more provider models
```

Changing a model version/provider must not silently change the agent's permissions or business policy.

Provider/model architecture is defined in:

- `06-AI-Providers-Models-and-Routing.md`

## Context assembler

Context assembly occurs only after authorization and requests module-specific purpose-built projections.

It must support:

- allowlisted fields;
- redaction;
- maximum context size;
- source references/provenance;
- freshness information;
- permission filtering;
- customer/resource isolation;
- secret blocking.

Prompt/context/memory/knowledge rules are defined in:

- `12-AI-Prompts-Context-Memory-and-Knowledge.md`

## Provider independence

Business logic must not depend directly on one model provider.

Provider/model selection belongs to runtime configuration/Model Policy while capabilities remain stable.

Initial provider targets are OpenAI and Anthropic, but the domain-action architecture must support additional provider adapters later without changing NBOS business modules.

## Routing

Initial supported policy modes:

- FIXED;
- PRIMARY_FALLBACK.

Future architecture may add TIERED/ADAPTIVE routing after evaluation, usage and operational evidence exists.

Do not implement opaque autonomous routing that cannot explain which model was selected and why.

## Prompt configuration

System/agent prompts are versioned configuration.

Production behavior should reference published versions and support testing/rollback rather than embedding mutable prompts invisibly in application code.

## Memory

Do not create unrestricted global AI memory from NBOS data.

Any persistent memory must have explicit owner/subject, scope, purpose, retention, provenance and access rules.

## Human approval

Internal AI may create approval requests for high-risk actions.

Approval binds to the proposed action payload/digest so it cannot authorize a materially different action.

Canonical policy:

- `13-AI-Risk-and-Approval-Policy.md`

## Customer-facing AI

AI that sends messages or acts on behalf of NBOS toward customers uses stricter customer/conversation isolation, draft/send separation and escalation/approval policies.

Canonical policy:

- `15-Customer-Facing-AI-Policy.md`

## Usage, cost and evaluation

Executions should be attributable to provider, model, model policy, agent, capability/domain and correlation ID.

New models discovered from provider catalogs are not automatically promoted to production use.

Canonical rules:

- `14-AI-Evaluation-Usage-Cost-and-Observability.md`

## Failure behavior

Provider/model failure cannot corrupt domain state.

Domain writes occur only after validated capability invocation. Fallback/retry must preserve idempotency and must not duplicate external messages, task changes or other mutations.

If all configured models fail, the execution fails safely and records operational metadata.

## Non-goals for Phase 1

Phase 1 does not require:

- employee general AI chat runtime;
- Messenger auto-reply production runtime;
- vector/RAG infrastructure;
- unrestricted persistent memory;
- adaptive learned routing;
- autonomous high-risk actions;
- automatic activation of newly discovered models.
