# AI Providers, Models and Routing

## Purpose

This document defines how NBOS connects to internal AI providers (for example OpenAI and Anthropic), discovers available models, keeps a controlled model catalog and assigns one or more models to internal AI agents/use cases without coupling business logic to a specific model name.

## Core rule: Agent != Model

An `Internal AI Agent` is a stable functional identity with permissions, policies, prompts, tools/capabilities and domain scope.

A `Model` is a replaceable execution engine used by that agent.

Example:

```text
Client Messenger Agent
  -> permissions / policy / prompt / tools
  -> Model Policy: CLIENT_SUPPORT
      -> primary model
      -> fallback model(s)
```

Changing GPT/Claude/model version must not require recreating the internal agent or changing its domain permissions.

## Provider connections

NBOS should support provider adapters behind one interface.

Initial provider targets:

- OpenAI
- Anthropic

Future adapters may include other providers without changing the capability/domain-action layer.

Conceptual entity:

```text
AIProviderConnection
- id
- provider
- name
- status
- credential reference/encrypted secret
- provider organization/project metadata where applicable
- baseUrl override only when explicitly supported
- lastValidatedAt
- lastModelSyncAt
- createdBy
- createdAt
- updatedAt
```

Multiple connections for the same provider should remain structurally possible (for example production/test or different provider projects/accounts), even if the first UI normally creates one connection per provider.

## Provider secret rules

Provider API keys are system integration secrets, not normal AI-readable Credentials.

Rules:

- never expose provider secrets to AI actors;
- full secret shown/accepted only during connection/rotation flow;
- encrypt at rest using the platform-approved secret mechanism;
- never log raw keys;
- never return raw key after save;
- allow rotation and immediate revoke/disable;
- audit connection lifecycle without storing secret material.

Do not make provider keys ordinary task/document context.

## Model catalog synchronization

Provider adapters should implement model discovery when the provider exposes a model-list API.

NBOS must support:

- manual `Sync models` action;
- scheduled model synchronization;
- `lastSeenAt` / `lastSyncedAt` metadata;
- new model discovery without automatic production activation;
- retirement/unavailability detection without deleting historical records.

Suggested model lifecycle:

```text
DISCOVERED
ACTIVE
DISABLED
DEPRECATED
UNAVAILABLE
```

A newly discovered model starts as `DISCOVERED` and is not automatically assigned to production use cases.

## Why discovery is not activation

Provider catalogs prove availability, not business suitability.

NBOS must separately maintain operational metadata such as:

- supported modalities;
- tool/function calling support;
- reasoning support;
- context constraints;
- known latency/cost class;
- internal suitability tags;
- internal evaluation results;
- approved production status.

Do not infer critical routing decisions only from provider marketing names or from model self-description.

## Model identity

Conceptual entity:

```text
AIModel
- id
- provider
- providerModelId
- displayName
- status
- discoveredAt
- lastSeenAt
- metadata
- technicalCapabilities
- suitabilityTags
- notes
```

Provider model IDs must be treated as external identifiers. Internal references should use stable NBOS model record IDs.

Where a provider exposes aliases and pinned snapshots, NBOS should record both and allow administrators to choose whether a routing profile uses a moving alias or a pinned model version.

Production-critical agents should prefer explicit/pinned versions when reproducibility is more important than automatically receiving model upgrades.

## Internal suitability tags

Example tags (not provider truth):

- CLIENT_SUPPORT
- GENERAL_ASSISTANT
- DOCUMENT_WRITING
- SALES_ANALYTICS
- MARKETING_ANALYTICS
- FINANCE_ANALYTICS
- CODING
- DEEP_REASONING
- FAST_LOW_COST
- VISION

These tags should eventually be backed by internal evaluations rather than manually assumed forever.

## Model Policy / Routing Profile

An internal AI agent should not store one hardcoded model string.

It should reference a reusable `Model Policy` / `Routing Profile`.

Conceptual model:

```text
AIModelPolicy
- id
- name
- purpose
- mode
- status
- constraints

AIModelPolicyCandidate
- policyId
- modelId
- role/tier
- priority
- enabled
- constraints
```

## Routing modes

The architecture should support these modes:

### FIXED

One explicitly selected model.

Use for the first simple production integrations when predictability matters.

### PRIMARY_FALLBACK

One primary model plus ordered fallback models.

Fallback may happen because of:

- provider outage/error;
- model unavailable;
- rate limit;
- timeout;
- configured operational condition.

This mode should be implemented before adaptive complexity routing.

### TIERED / ADAPTIVE (future)

One use case may contain multiple eligible models across one or more providers.

Example:

```text
FAST      -> inexpensive/low-latency model
STANDARD  -> balanced model
DEEP      -> strongest approved reasoning model
```

A routing service chooses a tier/model according to validated rules such as:

- task/use-case classification;
- required modality/tool support;
- context size;
- policy/risk class;
- latency target;
- budget/cost limits;
- previous attempt failure/escalation;
- approved evaluation score.

Do not rely only on a model's self-reported confidence to escalate.

## Cross-provider routing

A routing profile may contain models from the same provider or different providers.

Examples:

```text
CLIENT_SUPPORT
  primary: OpenAI model A
  fallback: Anthropic model B
```

or later:

```text
SALES_ANALYTICS
  FAST: OpenAI model A
  DEEP: Anthropic model B
  fallback: OpenAI model C
```

Provider-specific request/response formats are normalized by adapters before reaching internal agent orchestration.

## Agent/use-case binding

Functional surfaces bind to internal agents, not directly to raw models.

Examples:

```text
Messenger client replies -> Client Messenger Agent
Task assistance          -> Delivery Assistant
Documents                -> Documents Assistant
Sales analytics          -> Sales Analytics Agent
Marketing analytics      -> Marketing Analytics Agent
```

Each agent then references its own Model Policy.

This allows different agents to use different model pools and permissions.

## First implementation scope

Implement now as foundation:

- OpenAI provider connection;
- Anthropic provider connection;
- secure provider credential lifecycle;
- provider validation;
- model catalog sync;
- discovered/active/disabled model lifecycle;
- manual model activation/deactivation;
- model metadata/admin notes;
- `FIXED` and `PRIMARY_FALLBACK` model policy data model/UI.

Do not implement now unless needed by the first internal AI use case:

- autonomous adaptive model selection;
- learned router;
- complex cost optimization engine;
- automatic production activation of newly discovered models;
- automatic promotion based only on provider release status.

## Failure semantics

Provider failure must never bypass NBOS policy/domain rules.

If all configured models fail, the AI execution fails safely and records operational metadata. It must not partially mutate domain state outside validated capability commits.

## Future evaluation layer

Before important new models are promoted into high-risk domains, NBOS should support domain-specific evaluations comparing quality, cost, latency and tool-use reliability.

A new provider model should be easy to discover, review, evaluate, activate and assign without code changes to the business module.