# Internal AI Runtime

## Status

Future phase. Architecture is defined now so Phase 1 does not block it later.

## Principle

Internal AI is another AI actor using the same capability/policy/domain-action layer as external agents.

Running inside NBOS does not grant implicit superuser access.

## Runtime responsibilities

Later runtime may own:

- model/provider adapters;
- model routing;
- system/prompt templates;
- conversation/session state;
- context assembly;
- tool/capability selection;
- approval requests;
- execution tracking;
- token/cost/latency metrics;
- fallback providers;
- structured output validation.

## Context assembler

Context assembly occurs only after authorization and should request module-specific projections.

It must support:

- allowlisted fields;
- redaction;
- maximum context size;
- source references;
- freshness information;
- permission filtering;
- secret blocking.

## Internal agents

Possible specialized agents:

- NBOS General Assistant;
- Messenger Triage Agent;
- CRM Assistant;
- Delivery / Project Agent;
- Documents Assistant;
- Analytics Agent;
- Marketing Agent.

These are separate actor identities/policies even if they use the same underlying model.

## Provider independence

Business logic must not depend directly on one model provider.

Provider/model selection belongs to runtime configuration, while capabilities remain stable.

## Memory

Do not create unrestricted global AI memory from NBOS data.

Any persistent memory must have explicit owner, scope, retention, source and access rules.

## Human approval

Internal AI may create approval requests for high-risk actions. Approval should bind to the proposed action payload or digest so approval cannot be reused for a materially different action.

## Failure behavior

Model/provider failure cannot corrupt domain state. Domain writes occur only after validated capability invocation.
