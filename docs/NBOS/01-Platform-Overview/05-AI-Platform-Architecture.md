# NBOS AI Platform Architecture

> Status: canonical target architecture for AI capabilities in NBOS.
> Date: 2026-08-20.

## 1. Purpose

NBOS AI is not a single chatbot, one automation, or one external integration. It is a platform-wide capability layer that allows trusted AI actors to read approved context, reason over it, and execute approved NBOS domain actions without bypassing business rules, RBAC, audit, stage gates, or module ownership.

The architecture must support both:

- external AI actors: Cursor, Codex, Claude, custom agents and future MCP/API clients;
- internal AI actors: NBOS Assistant, Messenger AI, Documents AI, CRM AI, Analytics AI and future specialized agents.

The same security, authorization, capability, audit and execution model must be reused by both.

## 2. Core architecture

```text
Human User / External AI / Internal AI / System Automation
                        |
                        v
                  Actor Identity
                        |
                        v
              Policy / Authorization
                        |
                        v
                Capability Registry
                        |
                        v
               Domain Action Layer
                        |
        +---------------+---------------+
        |               |               |
      Tasks            CRM           Finance ...
        |               |               |
        +---------------+---------------+
                        |
                        v
                     Audit
```

AI must never mutate module tables directly from integration code. Every write passes through the same domain service or explicit application command used by trusted NBOS runtime.

## 3. AI as an actor, not an employee

NBOS must distinguish the principal that caused an action.

Canonical actor types:

- `USER`
- `EXTERNAL_AGENT`
- `INTERNAL_AI`
- `SYSTEM`
- `AUTOMATION`

An AI actor is never modeled as a fake Employee merely to satisfy existing authorization or audit code.

A user may delegate authority to an AI actor, but delegated execution must preserve both identities:

- actor: the AI principal performing the operation;
- onBehalfOf: the human or system principal that granted or initiated the authority when applicable.

## 4. Authorization model

Authorization is evaluated from multiple dimensions:

```text
Actor
+ Capability
+ Resource
+ Scope
+ Action
+ Data Policy
+ Risk Policy
= Allow / Deny / Require Approval
```

Existing human RBAC remains valid. AI authorization extends the platform; it does not replace employee roles or existing module access rules.

No AI actor receives broad database access.

## 5. Capabilities

A capability is an explicit platform contract representing a safe operation.

Examples:

- `tasks.read`
- `tasks.create`
- `tasks.update`
- `tasks.start`
- `tasks.submit_review`
- `tasks.comment`
- `drive.read_linked_file`
- `documents.read`
- `crm.read_deal`
- `reports.read`

Capabilities are not equivalent to raw REST routes. One capability may call several internal services; one REST route may require multiple policy checks.

Capabilities must be:

- versionable;
- auditable;
- deny-by-default;
- independently assignable;
- scoped to organizations, projects, products, workspaces, records or safe query boundaries.

## 6. External Agent Access

External agents authenticate using NBOS-issued agent credentials, not employee sessions.

Each external agent has:

- stable agent identity;
- display name;
- owner / creator;
- enabled/disabled state;
- credential(s) stored only as secure hashes where possible;
- granted capabilities;
- resource scope;
- optional expiry;
- last-used metadata;
- audit trail;
- revocation support.

A leaked agent token must be revocable without changing employee credentials or unrelated integrations.

## 7. Internal AI Runtime

Internal AI features must use the same capability layer as external agents.

The internal AI runtime may additionally include:

- model/provider routing;
- prompt templates;
- context assembly;
- tool selection;
- conversation state;
- approval workflows;
- cost/usage metrics.

Those concerns sit above authorization and domain actions. An internal model must not gain more privileges simply because it runs inside NBOS.

## 8. Domain ownership

AI does not become a new source of truth.

Canonical rule:

```text
PostgreSQL module state remains source of truth.
AI proposes or invokes domain actions.
Module services validate and commit state.
```

Examples:

- Task status changes still obey Tasks rules.
- Deal transitions still obey CRM stage gates.
- Finance writes still obey finance idempotency and journal rules.
- Credential reveal remains governed by Credentials security and step-up rules.

## 9. Data security classes

The old three-label concept `Forbidden / Masked / Allowed` is retained only as a simple communication aid, not as the authorization model.

The actual policy is resource- and capability-aware.

Baseline rules:

### Never exposed to general AI context

- credential secrets;
- passwords;
- API keys;
- refresh tokens;
- private keys;
- secret environment values;
- encryption keys.

### Sensitive / conditional

- finance details;
- personal data;
- contracts;
- private mail;
- private messenger content;
- internal HR / compensation data.

These may be available only to explicitly authorized specialized agents with narrow scopes and audit.

### Normal operational context

- task metadata;
- project/product status;
- approved documentation;
- public/client-safe FAQ;
- selected reports;
- non-secret technical metadata.

## 10. Context minimization

AI receives the smallest context required for the requested capability.

Do not provide full Project, Company, Mailbox or Drive payloads when a narrow projection is enough.

Context assembly must support:

- field allowlists;
- field redaction;
- record-level authorization;
- linked-resource authorization;
- size/token limits;
- source attribution.

## 11. Audit

AI activity is first-class audit data.

Audit must capture at minimum:

- actor type;
- actor id;
- on-behalf-of identity when applicable;
- capability;
- target entity type/id;
- action;
- success/failure;
- correlation/request id;
- approval information when applicable;
- safe structured changes/result metadata;
- timestamp;
- IP/client metadata for external actors when available.

Secrets, model prompts containing sensitive data, and raw credentials must never be copied into audit payloads.

## 12. Human approval

Policy outcome is not only Allow/Deny.

Canonical decisions:

- `ALLOW`
- `DENY`
- `REQUIRE_APPROVAL`

High-risk capabilities may require approval even when the agent normally has access.

Examples that may require approval depending on module policy:

- sending external client communication;
- changing money state;
- destructive actions;
- bulk changes;
- exporting sensitive data;
- granting access;
- executing infrastructure-changing operations.

Task updates inside a specifically granted workspace may be allowed without approval.

## 13. Async execution

Long-running, external, retryable or model-heavy AI work must use BullMQ/worker infrastructure.

Synchronous API requests may handle:

- authentication;
- authorization;
- lightweight reads;
- creation of an execution request;
- status retrieval.

Worker execution must preserve actor identity and policy context in a tamper-resistant job envelope.

## 14. Idempotency

AI write capabilities must support idempotency where retries could duplicate work.

External agent mutation requests should accept an idempotency key or equivalent request identity.

Examples:

- task creation;
- comment creation;
- status transition;
- generated document creation;
- external message send.

## 15. Rate limits and abuse controls

External agents require independent limits by agent and capability.

Controls may include:

- requests/minute;
- concurrent executions;
- daily action limit;
- daily AI/model budget;
- payload size;
- allowed network/IP ranges where needed;
- temporary suspension on anomalous behavior.

## 16. Workspace isolation

Phase 1 external agent access is workspace-centric.

An agent granted access to one Work Space must not discover or operate on another Work Space merely because records share a Project or employee.

Authorization must be checked on every read and write, not only when issuing the token.

## 17. Files and artifacts

AI file access goes through Drive ownership rules.

An agent may read a Drive File Asset only when:

1. its capability allows file reading;
2. the file is inside or explicitly linked to an authorized context;
3. Drive access policy allows the operation;
4. the file is not a forbidden secret artifact.

Generated outputs that should persist are stored through Drive and linked to the appropriate Task/WorkSpace/Document/entity.

## 18. API and protocol boundaries

The first implementation may expose REST endpoints optimized for external agents.

The architecture must not bind the platform to one client such as Cursor or to one protocol such as MCP.

Future adapters may include:

- REST API;
- MCP server;
- internal tool calling;
- event/webhook subscriptions.

All adapters terminate into the same capability and domain-action layer.

## 19. Realtime and event subscriptions

External agents do not need unrestricted Socket.io access in Phase 1.

Initial work retrieval can use scoped REST reads/polling.

Later, agents may subscribe to safe events or webhooks such as:

- task assigned;
- task changed;
- review requested;
- new permitted comment;
- execution cancelled.

Event subscriptions must use the same scope authorization.

## 20. Failure and revocation behavior

If an AI subsystem is disabled or unavailable:

- core NBOS modules continue operating;
- no module crashes because AI is missing;
- unfinished AI execution remains visible as failed/pending;
- credentials can be revoked immediately;
- queued work from a revoked agent must not continue blindly.

Worker must re-check execution authorization for sensitive or delayed actions before commit where appropriate.

## 21. Phase strategy

### Phase 1 — AI Foundation + External Workspace Agent

Status: **COMPLETE** (`02-Modules/21-AI-Platform/31-Phase-1-Final-Acceptance.md`).

Build:

- actor identity foundation;
- actor-aware audit;
- external agent registry;
- secure agent credentials;
- capability registry;
- policy evaluator;
- workspace scopes;
- Tasks read/write capabilities;
- linked Drive file reads;
- idempotency;
- rate limits;
- tests and admin controls.

### Phase 2 — Internal AI Runtime

Status: **PLANNED — BLOCKED BY AI PRODUCT ENTRY GATE**.

Add:

- durable provider-independent Internal Agent execution;
- OpenAI/Anthropic invocation behind the existing adapter and Model Policy;
- Project AI Profile and versioned Project/Product AI Rules;
- Project base knowledge with exact Product overlays and PostgreSQL FTS;
- isolated Project/Contact/Conversation memory with human-reviewed model candidates;
- a multi-source Context Plan and purpose-built live module projections;
- grounded employee Project Assistant answers with citations/freshness;
- Messenger-owned, Employee-reviewed `DRAFT_ONLY` Product WhatsApp replies;
- evaluation, usage/cost, audit, budgets, feature flags and kill switches.

Detailed plan: `02-Modules/21-AI-Platform/42-Phase-2-Project-Intelligence-and-Draft-Assistant-Architecture.md`.

AI-owned external send, approval-bound machine send and auto-send are not part
of Phase 2.

### Phase 3 — Specialized Agents

Examples:

- Messenger triage;
- CRM assistant;
- Documents assistant;
- analytics agent;
- marketing agent;
- delivery/project agent.

Approval-bound customer send and any narrow auto-send may be considered only
as separately designed/accepted future capabilities; Phase 3 does not grant
them implicitly.

## 22. Non-goals for Phase 1

Do not build yet:

- autonomous finance agent;
- credential-reading AI;
- unrestricted SQL access;
- broad company-wide semantic search;
- autonomous external client replies;
- generic workflow-builder for all agents;
- multi-agent orchestration framework;
- model marketplace;
- mandatory MCP layer.

## 23. Canonical rules

1. AI is a platform actor class, not a fake employee.
2. Every AI operation uses explicit capabilities.
3. Authorization is deny-by-default and scope-aware.
4. Existing module business rules remain final authority.
5. AI never directly owns business truth.
6. AI never bypasses domain services for writes.
7. External and internal AI reuse the same capability/policy layer.
8. Secrets are not general AI context.
9. Every material AI action is auditable.
10. High-risk actions can require human approval.
11. Long-running AI work uses worker/queue infrastructure.
12. Agent credentials are independently revocable.
13. Workspace isolation is enforced on every operation.
14. Drive remains owner of files.
15. AI failures must degrade gracefully and never break core modules.
