# Project Knowledge and Customer Memory

Status: APPROVED
Target: V2 / Phase 2 candidate
Priority: HIGH
Canon summary: Give each project controlled AI knowledge plus isolated customer/conversation memory and live NBOS context so customer-facing agents answer with current, project-specific information.

## Goal

Enable future customer-facing Internal AI Agents, especially Messenger agents, to answer with accurate project-specific information, remember relevant prior communication with each customer and combine that memory with current authoritative NBOS data.

The capability must fit the existing AI Platform architecture rather than create a separate chatbot-specific memory system.

## Why we need it

A useful customer-facing agent cannot rely only on a static prompt or the model's pretrained knowledge.

It must know, for the current project and customer:

- what the project/business offers;
- current approved product/service information;
- project-specific policies and operating rules;
- what this customer previously discussed with the company;
- important prior promises, preferences, questions and unresolved items;
- current authoritative status from NBOS modules;
- which information is internal-only and which may be disclosed to the customer.

This information changes over time, so the system must support controlled refresh/update rather than assuming the model permanently remembers old context.

## Core architecture

```text
Incoming customer message
        |
        v
Client Messenger Agent
        |
        v
Actor / Policy / Customer Scope
        |
        v
Context Assembler
        |-- Project Knowledge
        |-- Project AI Rules
        |-- Customer Memory
        |-- Recent Conversation
        |-- Live NBOS Context
        `-- Source / Freshness metadata
        |
        v
Model Policy
        |
        v
Draft / Approval / Send Policy
        |
        v
Customer response
```

The model is replaceable. Knowledge and memory belong to NBOS, not to GPT, Claude or another provider.

## Core separation

The future runtime must keep these layers separate.

### 1. Project Knowledge

Durable, curated information that applies to a specific project/business context.

Examples:

- company/project description;
- services/products;
- approved FAQ;
- policies;
- delivery/service rules;
- operating hours;
- public/approved documentation;
- support procedures;
- project-specific terminology;
- approved pricing guidance where the owning module/policy permits it.

Project Knowledge is not customer-specific memory.

### 2. Project AI Rules

Versioned behavioral/business instructions for the project's customer-facing agent.

Examples:

- preferred language/tone;
- escalation rules;
- forbidden commitments;
- discount/price boundaries;
- when human approval is required;
- what information may or may not be disclosed;
- channel-specific response rules.

These rules must integrate with Prompt Policy and Risk/Approval Policy. They never grant permissions by themselves.

### 3. Customer / Conversation Memory

Durable structured or summarized information learned from prior allowed interactions with one customer/conversation.

Examples:

- preferred language;
- product/service interest;
- relevant preferences;
- previously clarified requirements;
- unresolved questions;
- important promises/commitments already made by authorized staff;
- prior support context;
- useful communication summary.

Memory must be isolated by customer/conversation/project scope and must not silently become organization-wide memory.

### 4. Recent Conversation

A bounded recent-message window from the current conversation.

Recent conversation is runtime context, not automatically long-term memory.

### 5. Live NBOS Context

Authoritative current information retrieved from owning NBOS modules at answer time when freshness matters.

Examples:

- Deal state;
- Task state;
- order/status information if an Orders module exists;
- booking/appointment state;
- payment state when explicitly authorized;
- current project/service configuration;
- document/workflow state;
- other module-owned operational data.

The agent should retrieve live data instead of relying on stale remembered values for operational facts.

## Source-of-truth rule

Different information classes have different authorities.

```text
Project knowledge/configuration -> approved Project Knowledge sources
Customer communication history -> Messenger/conversation records
Persistent customer memory      -> AI Memory records derived under policy
Operational state               -> owning NBOS business module
Agent behavior                  -> Prompt/Agent/Approval policies
Authorization                   -> Actor/Policy/Capability layer
```

Persistent memory must never override newer authoritative module data.

Example: if memory says an order was `PROCESSING` yesterday but Orders currently says `DELIVERED`, the current Orders state wins.

## Freshness model

Every context source should be able to carry freshness/provenance metadata where material.

The runtime should distinguish:

- durable knowledge;
- derived memory;
- recent messages;
- live authoritative data.

For time-sensitive facts, the agent should prefer live retrieval.

If required live information cannot be retrieved, the agent must not invent a definitive current answer.

## Project Knowledge update flow

Project knowledge should support controlled updates from approved sources.

Possible future sources:

- manually curated knowledge entries;
- Documents;
- approved Drive files;
- selected CRM/project records;
- approved FAQ/content sources;
- other module-owned projections.

The architecture should support:

- source identity;
- version/change tracking where useful;
- updatedAt/lastIndexedAt metadata;
- re-index/rebuild when a source changes;
- removal/invalidation when source access is revoked or source is deleted;
- explicit external/customer-visible classification where needed.

The AI model must not silently rewrite project knowledge based only on its own generated answer.

## Customer memory update flow

After an eligible interaction, a controlled memory pipeline may evaluate whether useful durable memory should be created or updated.

Conceptually:

```text
new messages / human actions / domain events
        |
        v
Memory extraction candidate
        |
        v
Policy + schema validation
        |
        v
Create / merge / update / ignore
        |
        v
Customer Memory
```

The model may propose memory candidates, but persistence is governed by NBOS policy and schema.

Do not store every message as duplicated memory.

Prefer structured facts and/or bounded summaries that remain useful in later conversations.

## Memory record requirements

Future persistent customer memory should preserve at minimum:

- stable memory id;
- organization/project scope;
- customer/contact subject;
- optional conversation scope;
- memory type/category;
- normalized content/value;
- source/provenance reference;
- createdAt;
- updatedAt;
- freshness/lastConfirmedAt where relevant;
- retention/expiry behavior where relevant;
- confidence/verification state if used;
- access classification;
- correction/deletion support.

Secrets must never be stored as AI memory.

## Memory correction and forgetting

The system must support correction/removal.

Examples:

- customer changes preference;
- previously stored fact was wrong;
- employee explicitly corrects memory;
- source conversation/data is deleted under policy;
- retention period expires.

Newer verified information should supersede older contradictory memory without losing necessary provenance/audit history.

## Customer and project isolation

This is a hard architecture boundary.

Conceptually:

```text
Organization
  `-- Project A
      |-- Project Knowledge A
      |-- Project Rules A
      |-- Customer 1 Memory
      |-- Customer 2 Memory
      `-- authorized live Project A context

Organization
  `-- Project B
      |-- Project Knowledge B
      `-- separate customer memories
```

A Project A Messenger Agent must never retrieve Project B knowledge or Customer B memory merely because embeddings/search deem it relevant.

Authorization/scope filtering must happen outside model instructions.

## Context assembly behavior

For each incoming customer message, Context Assembler should retrieve only the minimum relevant allowed context.

A likely future order is:

1. identify organization/project/channel/conversation/customer;
2. authenticate/resolve Internal Agent and initiating context;
3. evaluate policy and allowed data sources;
4. load project AI rules/prompt version;
5. load bounded recent conversation;
6. retrieve relevant customer memory;
7. retrieve relevant project knowledge;
8. call live NBOS capabilities for freshness-sensitive facts when needed;
9. apply redaction/classification/customer-visible rules;
10. enforce size/token budgets;
11. attach provenance/freshness metadata;
12. invoke model through Model Policy.

## Retrieval / RAG

This capability may later use semantic/vector retrieval, but RAG is only a retrieval technique.

It must not become the authorization boundary.

Any future search/index must retain enough metadata to filter by:

- organization;
- project/workspace/product scope as appropriate;
- customer/contact/conversation where applicable;
- source access/classification;
- source lifecycle/version.

Do not create one unrestricted vector store and rely on prompts to prevent cross-project/customer leakage.

## Interaction with existing AI Platform

This future capability reuses existing concepts:

- `InternalAIAgent` for the Client Messenger Agent;
- ActorContext and `onBehalfOf` where applicable;
- Capability Registry / Policy Evaluator;
- Prompt Policy/versioning;
- Model Policy/routing;
- Context Assembler;
- persistent memory contracts;
- approval/risk policy;
- customer-facing AI policy;
- Audit and AI Execution attribution.

Relevant current canon:

- `../04-Internal-AI-Runtime.md`
- `../11-Internal-Agent-Lifecycle-and-Assignments.md`
- `../12-AI-Prompts-Context-Memory-and-Knowledge.md`
- `../13-AI-Risk-and-Approval-Policy.md`
- `../15-Customer-Facing-AI-Policy.md`

## Initial future functional requirements

When promoted to implementation, the capability should at minimum support:

- one or more Project Knowledge namespaces/sources;
- project-specific AI rules/configuration;
- isolated persistent customer/conversation memory;
- recent conversation context;
- controlled automatic memory extraction/update;
- human-visible memory inspection where appropriate;
- memory correction/delete controls;
- live NBOS context retrieval for time-sensitive facts;
- freshness/source provenance;
- strict project/customer isolation;
- bounded context assembly;
- explicit customer-visible/internal-only data controls;
- audit of material memory/knowledge configuration changes;
- integration with draft/approval/auto-send policy.

## Admin/product UX direction

A future UI may expose project-level AI configuration such as:

```text
Project / Work Space -> AI
  |-- Knowledge
  |-- Rules
  |-- Customer Memory policy
  |-- Sources
  |-- Agent assignment
  |-- Model Policy
  |-- Response/approval mode
  `-- Activity / diagnostics
```

Customer memory should also be inspectable from the relevant Contact/Conversation context when permissions allow.

The exact navigation remains a future product decision.

## Security requirements

Mandatory design requirements:

- deny-by-default source access;
- no cross-project memory retrieval;
- no cross-customer memory retrieval;
- no Credentials/provider secrets in knowledge or memory;
- customer messages treated as untrusted input;
- model output cannot grant itself memory/source access;
- source deletion/revocation must invalidate future retrieval;
- memory writes require explicit policy/schema;
- externally visible answers must respect customer-facing disclosure rules;
- live business actions still require capabilities/approval independently of memory.

## Non-goals

This design does not mean:

- the model itself permanently remembers every customer;
- every chat message is stored twice as AI memory;
- the AI may autonomously edit canonical business data from conversation;
- memory may replace live module queries;
- one global project/customer vector index is automatically safe;
- the Messenger Agent receives unrestricted CRM/Finance/Drive access;
- model/provider choice owns business memory.

## Dependencies

Before full implementation, expect dependencies on:

- Internal AI execution runtime;
- Messenger AI integration;
- Context Assembler implementation;
- Prompt Policy/runtime;
- memory persistence design;
- knowledge/indexing design if semantic retrieval is required;
- Messenger/CRM customer identity mapping;
- module capabilities for required live data;
- customer-facing approval/send controls.

## Open decisions

Decide during planning, based on actual Messenger/CRM runtime:

- exact project scope entity: Work Space, Product, Project or explicit AI Knowledge Space;
- memory schema categories;
- memory retention defaults;
- automatic vs approval-based memory write categories;
- when memory is conversation-specific vs Contact-wide;
- knowledge ingestion/index technology;
- customer-visible vs internal-only classification model;
- exact live module capabilities required by the first customer-facing use case.

These are implementation-planning decisions, not reasons to change the current Actor/Policy/Capability/Context architecture.

## Future acceptance criteria

Before this capability can be considered production-ready:

- Project A responses never retrieve Project B knowledge;
- Customer A never receives Customer B memory/context;
- a model/provider swap preserves knowledge and customer memory;
- customer memory survives normal conversation/session restart where policy allows;
- updated verified memory supersedes stale contradictory memory;
- live authoritative NBOS state overrides stale remembered state;
- source updates/removals are reflected in future retrieval;
- customer can be escalated to a human when context is insufficient/risky;
- no secret source can enter customer-facing context;
- memory/knowledge provenance is diagnosable;
- prompt injection cannot widen retrieval/action capabilities;
- response send remains controlled by customer-facing risk/approval policy.

## Canonization plan after implementation

When implementation begins, change this document to `PLANNED` or `IN_IMPLEMENTATION` and create an executable checklist/milestone.

After implementation, move final rules into the active canon, expected primarily in:

- `../04-Internal-AI-Runtime.md`;
- `../12-AI-Prompts-Context-Memory-and-Knowledge.md`;
- `../15-Customer-Facing-AI-Policy.md`;
- relevant Messenger canon;
- relevant CRM/project/workspace canon;
- technical decisions/roadmap where appropriate.

Then mark this document `DONE` and list the exact canonicalized destinations. The implemented canon wins if it differs from this future design.
