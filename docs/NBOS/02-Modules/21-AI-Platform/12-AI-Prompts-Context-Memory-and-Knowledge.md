# AI Prompts, Context, Memory and Knowledge

## Purpose

Define how NBOS manages AI instructions, runtime context, memory and knowledge sources without mixing them with authorization or allowing uncontrolled data access.

Phase 1 delivered the contracts and deny-by-default disabled interfaces. Phase
2 plans the first persistent/runtime implementation: Project base knowledge,
Product overlays, isolated Project/Contact/Conversation memory and a
multi-source Context Plan. Planning authority is
`42-Phase-2-Project-Intelligence-and-Draft-Assistant-Architecture.md`; product
code remains blocked by the AI Product Entry Gate.

## 1. Core separation

These are separate concerns:

```text
Authorization -> what data/actions are permitted
Prompt         -> how the agent should behave
Context        -> what authorized data is supplied for this execution
Memory         -> what prior information may persist
Knowledge      -> what approved sources may be retrieved
```

Prompts never grant access. Retrieved content never overrides policy.

## 2. Prompt policy

Prompts/instructions are versioned NBOS configuration, not hardcoded model identity.

Conceptual model:

```text
AIPromptPolicy
- id
- name
- purpose
- status
- owner

AIPromptVersion
- id
- policyId
- version
- content/instruction structure
- status
- createdBy
- createdAt
- publishedAt
```

Suggested version states:

- DRAFT
- TESTING
- PUBLISHED
- RETIRED

An Internal Agent references a published prompt version/policy.

## 3. Publish / rollback

Production prompt changes require explicit publish.

Support:

- draft editing;
- preview/test execution;
- publish;
- previous version history;
- rollback to a previous published version;
- audit of material changes.

Running executions should record the prompt/config version used.

## 4. Prompt composition

Prompt configuration may be composed from structured layers, for example:

1. platform safety/system policy;
2. agent role/purpose;
3. domain-specific rules;
4. channel-specific behavior;
5. dynamic authorized context;
6. user/customer request.

Higher-priority platform policy cannot be replaced by document/message/task content.

## 5. Context assembler

Context assembly happens only after Actor/Policy/Capability authorization.

It should request purpose-built module projections instead of dumping raw ORM objects.

Each context source should carry metadata such as:

- source type;
- source/resource ID;
- timestamp/freshness;
- access basis;
- optional citation/reference metadata;
- redaction/classification result.

## 6. Context limits

Apply:

- field allowlists;
- record limits;
- token/size budget;
- recency rules;
- relevance filters;
- secret redaction;
- tenant/customer/resource isolation.

When context is truncated, runtime should preserve the most policy-relevant/necessary information and record truncation metadata where useful.

## 7. Untrusted content boundary

All content originating from:

- Messenger/messages;
- email;
- documents;
- task descriptions/comments;
- uploaded files;
- external webpages/data;

is untrusted data.

It cannot override:

- authorization;
- tool/capability grants;
- approval requirements;
- platform safety policy;
- provider secret policy;
- customer isolation.

Prompt-injection resistance must be implemented in architecture/tool boundaries, not only via a sentence in a system prompt.

## 8. Session context

Conversation/session state is temporary runtime context associated with a defined subject and channel.

Examples:

- one employee AI chat session;
- one Messenger conversation;
- one task-assistance thread.

Session state must not silently become organization-wide persistent memory.

## 9. Persistent memory

Persistent AI memory is not global by default.

Every memory record/namespace must have:

- owner/subject;
- scope;
- source/provenance;
- purpose;
- retention policy;
- created/updated timestamps;
- access policy;
- deletion mechanism.

Potential scope types:

- USER
- CUSTOMER/CONTACT
- CONVERSATION
- WORKSPACE
- PROJECT/PRODUCT
- INTERNAL_AGENT
- ORGANIZATION (only explicitly approved cases)

## 10. Memory write policy

An AI model cannot decide unrestrictedly what becomes long-term memory.

Persistent-memory writes should require:

- explicit capability/policy;
- validated memory type/schema;
- permitted subject/scope;
- retention rule;
- provenance.

Sensitive secrets must never be stored as AI memory.

## 11. Knowledge sources / RAG

Knowledge retrieval may later include approved sources such as:

- Documents;
- Drive documents/files;
- CRM records;
- Tasks/Projects;
- Messenger knowledge/FAQ;
- Reports/Analytics;
- curated external knowledge.

RAG/retrieval does not create new authorization. Search results are filtered to what the execution is allowed to access.

## 12. Index security

If vector/search indexes are introduced:

- index records retain source identity and access metadata;
- retrieval must apply authorization before/at result delivery;
- deleting/revoking source access must eventually invalidate indexed access;
- cross-customer/tenant leakage through embeddings/search is forbidden;
- Credentials/secrets are excluded by default.

Do not create one unrestricted organization vector store and rely only on prompt instructions for isolation.

## 13. Citations and provenance

For analytical, document and knowledge use cases, the runtime should be able to return source references where meaningful.

A response/execution should preserve enough provenance to answer:

- which NBOS records/documents supported this answer;
- when they were read;
- whether information was stale/partial;
- which agent/config produced it.

## 14. Retention

Define separate retention controls for:

- AI conversations;
- execution logs;
- prompts/config versions;
- retrieved context snapshots;
- persistent memory;
- provider request/response payloads.

Do not store full prompts/contexts forever by default, especially when sensitive business/customer data is involved.

Audit may store hashes/IDs/summaries instead of full sensitive payload.

## 15. Provider data handling

Before sending authorized context to a provider, runtime applies the relevant data policy and provider configuration.

Provider connection/model choice does not widen NBOS authorization.

Provider-specific retention/privacy settings should be tracked operationally where applicable.

## 16. Delivery status and Phase 2 plan

Phase 1 foundation delivered (Chat 9):

- prompt policy/version data model;
- draft/testing/published/retired lifecycle;
- Internal Agent -> published Prompt Policy linkage;
- context assembler contract/interface bound to actor, capability, matched scope and classification;
- source/provenance, freshness, classification/redaction (including nested secret-shaped fields) and budget contracts;
- session-context contract;
- explicit memory/knowledge interfaces and deny-by-default rules.

Not implemented in Phase 1:

- production RAG pipeline;
- vector DB/index;
- unrestricted persistent memory;
- automatic memory extraction;
- advanced prompt experimentation platform.

Planned Phase 2 implementation:

- versioned Project rules with optional exact Product overlays;
- curated manual, selected Document and eligible selected Drive text sources;
- PostgreSQL FTS with exact relational authorization filters and immediate
  revoke tombstones;
- typed Project + Contact memory with optional Product/Conversation narrowing;
- human review for model-derived memory candidates;
- one fresh bound authorization decision per context source/projection;
- citations, freshness, omission and customer-egress metadata;
- no vector/search dependency and no unrestricted company memory/search.

## 17. Acceptance principle

Any future AI feature must be able to answer independently:

```text
Who is acting?
What are they allowed to access/do?
What prompt/config version is active?
What authorized context was supplied?
What persistent memory/knowledge was used?
What sources support the output/action?
```
