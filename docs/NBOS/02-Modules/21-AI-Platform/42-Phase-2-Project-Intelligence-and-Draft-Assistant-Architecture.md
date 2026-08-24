# Phase 2 — Internal AI Runtime, Project Intelligence and Draft Assistant

> Status: **PLANNED — BLOCKED BY AI PRODUCT ENTRY GATE**  
> Target: AI Platform Phase 2  
> Implementation gate: `41-AI-Product-Entry-Gate-Final-Acceptance.md`  
> Executable checklist: `43-Phase-2-Implementation-Checklist.md`  
> Execution strategy: `44-Phase-2-Execution-Strategy.md`  
> Acceptance and rollout: `45-Phase-2-Acceptance-Migration-Rollout-and-Operations.md`

## 1. Authority and objective

This document promotes the approved future capability in
`90-Future-Capabilities/01-Project-Knowledge-and-Customer-Memory.md` into the planned Phase 2
architecture.

Phase 2 turns the Phase 1 security/configuration foundation into one useful, governed product:

```text
Internal AI Runtime
  + Project base knowledge
  + Product-specific knowledge overlay
  + isolated customer/conversation memory
  + current NBOS module projections
  + source-grounded answer generation
  = Project Intelligence and a human-controlled customer reply draft
```

The first production customer-facing mode is `DRAFT_ONLY`. An Employee reviews, edits and sends the
message through the owning Messenger domain. The Internal Agent has no production send path in this
phase.

Primary canon inputs:

- `../../01-Platform-Overview/05-AI-Platform-Architecture.md` and
  `../../00-Technical-Decisions-By-Module.md`;
- `04-Internal-AI-Runtime.md`,
  `12-AI-Prompts-Context-Memory-and-Knowledge.md`,
  `13-AI-Risk-and-Approval-Policy.md`,
  `14-AI-Evaluation-Usage-Cost-and-Observability.md`,
  `15-Customer-Facing-AI-Policy.md` and `37-AI-Product-Entry-Gate.md`;
- `../02-Projects-Hub/01-Project-Hub-Overview.md`,
  `../02-Projects-Hub/03-Products-and-Extensions.md` and
  `../02-Projects-Hub/05-Product-Centric-Navigation.md`;
- `../03-Clients/02-Contacts.md`, `../03-Clients/07-Contact-and-Product.md`,
  `../09-Messenger/02-External-Messenger-and-CRM-Inbox.md` and
  `../09-Messenger/03-Messenger-Architecture.md`;
- `../../06-Integrations/06-WhatsApp-Gateway-NBOS-Boundary.md` and
  `../../06-Integrations/08-Product-WhatsApp-Groups.md`.

## 2. Entry conditions

Planning may happen now. Product implementation must not start until all of these are true:

1. Product Entry Gate Workstreams 1–3 are complete.
2. `41-AI-Product-Entry-Gate-Final-Acceptance.md` records `READY` with no
   authorization, resource-isolation or lifecycle-consistency debt.
3. Phase 1 External Agent REST/MCP and human Tasks/Drive regressions remain green.
4. The implementation chat re-verifies runtime state instead of treating these planning documents as
   evidence that code exists.

## 3. Phase 2 scope lock

Phase 2 includes:

- real OpenAI/Anthropic model invocation behind the provider adapter boundary;
- durable Internal Agent execution with Model Policy routing, fallback and usage attribution;
- an employee-initiated Project Assistant and an admin test/diagnostic surface;
- Project AI Profile and versioned Project/Product AI Rules;
- curated Project Knowledge with Product overlays;
- authorization-filtered PostgreSQL full-text retrieval;
- structured, isolated customer/conversation memory with human inspection and correction;
- a multi-source Context Plan and Context Assembler;
- purpose-built live Project, Product, Tasks, CRM/Contact and approved Messenger projections;
- grounded answers with citations, freshness, omission and uncertainty information;
- a controlled `Generate draft` flow for a Product WhatsApp conversation when its canonical mapping
  exists;
- feature flags, kill switches, budgets, evaluation, audit and operational diagnostics.

Phase 2 does not include:

- a global general-purpose company assistant;
- organization-wide semantic search or memory;
- CRM lead negotiation or pre-Project sales auto-replies;
- autonomous price, discount, refund, legal, security or delivery commitments;
- Finance, Payroll, Credentials or private Mail context;
- AI-owned external send, approval-bound machine send or auto-send;
- arbitrary business-domain writes;
- arbitrary URL crawling, website ingestion, OCR platform or broad binary-file parsing;
- pgvector, an external vector database, Meilisearch or a new search dependency;
- adaptive/learned routing, model training, fine-tuning or multi-agent orchestration.

## 4. Product outcomes

### 4.1 Employee Project Assistant

An authorized Employee opens a Project or Product AI surface, asks a question and receives:

- a concise answer limited to the current Project/Product context;
- citations to the exact knowledge/live sources used;
- freshness and stale/partial warnings;
- an explicit statement when authoritative data is unavailable;
- no hidden domain mutation.

Every execution uses the intersection of the Internal Agent grants and the initiating Employee's
current access. Admin test mode is not a superuser bypass.

### 4.2 Knowledge steward

An authorized Project/AI administrator can:

- manage curated knowledge entries;
- attach an eligible Document or Drive source;
- classify it as `INTERNAL_ONLY` or explicitly approved `CUSTOMER_VISIBLE`;
- draft, test, publish, retire, revoke and rebuild source versions;
- see indexing, freshness and failure state;
- preview retrieval using the same production authorization boundary.

Drive `Client Visible` is not sufficient by itself. A source must also be explicitly selected and
published for AI use.

### 4.3 Customer-memory steward

An authorized Employee can inspect memory only inside the relevant Project/Contact context, review a
model-proposed candidate, correct it, reject it, supersede it or delete it. The UI always shows source,
status, last confirmation and retention state.

### 4.4 Product WhatsApp draft

For a canonical Product WhatsApp group text message, an authorized Employee may request a draft.
Phase 2 stores the draft and its AI provenance, but only the Employee may send it through Messenger. A
draft never becomes queued/sent merely because generation succeeded. CRM Inbox, WhatsApp 1:1, other
channels, attachment interpretation and historical-message backfill are deferred.

## 5. Scope and identity model

The business boundary is:

```text
Project (required knowledge root)
  `-- Product (optional narrowing/overlay)
       `-- exact channel account + external Conversation / Product WhatsApp Group
            `-- exact sender participant + Contact when identity mapping is unambiguous
```

Rules:

- `Project` owns the base knowledge/rules context.
- `Product` may narrow or override the Project context but cannot access sibling Product overlays.
- `Work Space` is an internal planning/live-data source, not a customer-knowledge owner.
- a technical `AiKnowledgeSpace` represents the governed Project/Product namespace; it is not a new
  independent business entity;
- memory has a tagged subject: `CONTACT` is scoped by Project + Contact and may narrow by
  Product/Conversation; `CONVERSATION` is non-personalized and scoped by Project + exact channel
  account + Conversation/Product;
- every customer-facing execution also binds the exact channel account and sender participant;
- the same Contact in two Projects has separate memory;
- conversation-only memory is allowed when a participant cannot be mapped safely to a Contact;
- ambiguous customer identity forbids Contact memory and personalized live reads;
- all private Contact memory is categorically excluded from Product WhatsApp group drafts in Phase 2;
  only group/conversation-scoped memory may be group-visible;
- NBOS is currently single-company; Phase 2 must not claim unimplemented multi-tenant behavior. All
  records must still preserve/resolvably bind the current organization context.

The Phase 1 customer-scope contract (channel + conversation + customer) is not
sufficient for this use case. Phase 2 must version/extend it with required
Project and channel-account dimensions, optional exact Product, and explicit
participant/Contact identity state. Missing required dimensions deny; they are
not wildcards.

## 6. Effective authorization

For employee-initiated execution:

```text
effective access =
  active Internal Agent
  INTERSECT active agent capability grant
  INTERSECT active agent resource scope
  INTERSECT initiating Employee RBAC and participation
  INTERSECT exact target relationship
  INTERSECT source classification/customer visibility
  INTERSECT risk and feature policy
```

The initiating Employee is always recorded as `onBehalfOf=USER:<employeeId>`. Pausing the agent,
revoking either principal's access, trashing the target or disabling the feature blocks new and queued
execution. Customer text, retrieved content, prompts and model output cannot create grants.

### 6.1 Planned capability matrix

Exact keys/versions are frozen in Chat 1 before schema/API work. The planned v1 intents are:

| Operation                | Planned AI capability                                | Required scope                               |
| ------------------------ | ---------------------------------------------------- | -------------------------------------------- |
| Run Project Assistant    | `ai.project_assistant`                               | exact Project, optional Product              |
| Read Project Knowledge   | `ai.knowledge_read`                                  | exact Project/Product Knowledge Space        |
| Read eligible memory     | `ai.customer_memory_read`                            | exact tagged subject scope                   |
| Propose memory candidate | `ai.customer_memory_propose`                         | exact tagged subject + source execution      |
| Read live context        | owning-module `*.read_ai_context` key per projection | exact owning resource                        |
| Generate customer draft  | existing `messenger.reply_draft`                     | exact channel account + Conversation/Product |

These are separate grants. Root execution does not imply knowledge, memory, live-projection or draft
access. Every owning-module projection receives its own registered key/version and resource resolver.

### 6.2 Human operation matrix

Chat 1 must map each operation to existing RBAC plus exact Project/Product/Conversation participation
before any API/schema implementation:

| Human operation                          | Minimum authorization rule                                                     |
| ---------------------------------------- | ------------------------------------------------------------------------------ |
| Use Project Assistant                    | Project read/participation + enrolled profile/surface                          |
| Admin test                               | AI admin permission + the same target Project access; no superuser data bypass |
| Edit/publish Profile or Rules            | Project edit + explicit AI configuration steward authority                     |
| Add/publish/revoke/delete/preview source | source read/ownership + Project edit + knowledge steward authority             |
| View memory                              | exact Project/Contact or Conversation read + memory-view authority             |
| Verify/correct/delete memory             | exact subject access + memory-steward authority                                |
| Generate/edit draft                      | exact external Conversation read + draft eligibility                           |
| Send draft                               | separate current Messenger external-send permission on the target Conversation |

Broad `COMPANY:EDIT` alone is insufficient for target data. Draft permission never implies send.

## 7. Target runtime

```text
Employee command over a Project/Product or persisted inbound message
  -> employee auth + target access
  -> Internal Agent + Project AI Profile resolution
  -> durable AiExecution + deterministic queue identity
  -> worker re-authorization
  -> Context Plan
       -> Project/Product rules
       -> bounded recent conversation
       -> scoped active memory
       -> Project base knowledge
       -> Product knowledge overlay
       -> independently authorized live module projections
  -> Context Assembler (classification, redaction, budget, provenance)
  -> Model Policy resolver
  -> provider invocation adapter
  -> schema/output and grounding validation
  -> answer / draft / escalation
  -> usage + audit + diagnostics
```

Business modules never import provider SDKs. AI Platform never reads or writes their tables directly
when a module-owned projection/service can enforce the rule.

## 8. Durable execution and sessions

Phase 2 extends the existing `AiExecution` foundation into a recoverable Internal Agent run.

Required behavior:

- create the execution/session turn before enqueue;
- use execution id as deterministic BullMQ job identity;
- reconcile durable queued rows that were committed but not enqueued;
- persist configuration ids/versions, actor, on-behalf-of, target and correlation metadata;
- record each provider attempt/fallback and each tool invocation without storing chain-of-thought;
- support safe cancellation and ignore late provider output after cancellation;
- revalidate agent, Employee and target access before context retrieval and before every tool call;
- perform a final current authorization/flag/target/source-tombstone recheck before publishing an
  assistant result, persisting a memory candidate or creating a Draft; suppress late provider output
  after revocation;
- bounded retry only for classified transient provider failures;
- no retry after an externally visible side effect without idempotency evidence;
- session retention is separate from persistent memory retention.

Status polling is mandatory. Socket.io completion updates may improve UX. Token streaming is optional
and is not a Phase 2 exit criterion.

## 9. Provider invocation and routing

The existing provider adapters currently validate credentials and list models. Phase 2 adds a stable
model-invocation port supporting:

- normalized messages and structured output schema;
- supported tool definitions;
- provider timeout and cancellation;
- token/usage metadata;
- normalized safe error categories;
- `FIXED` and `PRIMARY_FALLBACK` routes;
- explicit fallback reasons and attempt attribution.

Only `ACTIVE` connections/models and an `ACTIVE` Model Policy may run. Provider/model changes never
change agent permissions. Provider response content is untrusted until schema and policy validation.
Use of Vercel AI SDK is an infrastructure choice behind this port, not a business-module dependency.

Each provider connection also has a versioned operational data policy: allowed
classification ceiling, whether customer PII is permitted, purpose/surface
eligibility, retention/no-training assurance, region/residency evidence and
reviewed-at/owner metadata. Every primary/fallback candidate must independently
pass that policy for the current execution; technical availability is not
enough. Missing or expired evidence fails closed for customer data.

Tool loops must have named, configurable limits for attempts, tool calls, elapsed time, context size
and output size. Exact production values require approval during the first implementation milestone;
unbounded loops are forbidden.

## 10. Project AI Profile and rules

`ProjectAiProfile` is the activation/configuration record for one Project. At most one profile is
active for a Project in one deployment; every Product/surface overlay is unique and resolution fails
closed on collision. It binds:

- active Internal Agent;
- Project base Knowledge Space;
- one published Project AI Rules version; the Internal Agent continues to own its separate published
  Prompt Policy and the profile validates that assignment rather than duplicating it;
- optional Product overlays;
- allowed source kinds and classifications;
- memory policy and retention reference;
- escalation owner;
- enabled surfaces;
- budget/rate policy;
- feature/rollout state.

Instruction precedence is:

```text
platform authorization and safety
> Internal Agent / risk policy
> published Project rules
> published Product/channel overlay
> authorized dynamic context
> user/customer content
```

Lower layers may restrict behavior but never grant access or override a higher layer.

Project/Product rules are internal control instructions, not factual sources or customer citations.
They may constrain tone, disclosure and escalation, but their text is never copied/revealed merely
because the generated answer is customer-visible.

## 11. Project Knowledge

### 11.1 Knowledge namespace

Each Knowledge Space belongs to exactly one Project and may have an optional Product applicability.
Retrieval may combine the Project base and the exact Product overlay. It never combines sibling
Product overlays.

### 11.2 Initial source types

Required:

- manually curated entry;
- selected native Document with a safe text projection;
- selected Drive File Asset only when an allowlisted safe text-extraction projection exists.

Unsupported files remain visible as unsupported; the runtime must not pretend they were indexed.
Arbitrary URLs, Credentials, `.env`, private-key/certificate material and secret exports are rejected.

### 11.3 Lifecycle

```text
source: DRAFT -> IN_REVIEW -> PUBLISHED -> RETIRED | REVOKED
          |            |          `-----> new source version
          `------------`----------------> QUARANTINED
remove: REVOKED/RETIRED -> REMOVED_TOMBSTONE

index: PENDING -> INDEXING -> READY | STALE | FAILED | TOMBSTONED
```

Each derived retrieval row keeps source id, source version, content digest, classification, Project,
optional Product, lifecycle status and indexing timestamps. Revocation blocks retrieval synchronously;
derived-index cleanup may finish later.

Each source has an `activeReadyVersionId`. A new published version remains non-retrievable while
indexing; the previous READY version remains active and is cited by its real version until the new one
becomes READY and an atomic pointer swap succeeds. Failed/quarantined v2 never displaces v1. Revoke or
remove tombstones all versions immediately.

### 11.4 Retrieval baseline

Phase 2 uses PostgreSQL full-text search plus relational scope/classification filters. Authorization
filters are applied in the retrieval query, not only after top results are selected. Semantic/vector
retrieval requires a later technical decision backed by measured recall need.

Every source/chunk stores declared/validated language (`HY`, `RU`, `EN` or `OTHER`) and normalized
Unicode text. PostgreSQL language configuration is selected explicitly per language with `simple` as
the fail-safe fallback. HY/RU/EN recall is benchmarked separately; a language that misses the approved
threshold is not activated rather than silently adding a new search dependency.

## 12. Customer and conversation memory

Memory categories are allowlisted initially:

- `PREFERENCE`;
- `CONFIRMED_REQUIREMENT`;
- `UNRESOLVED_QUESTION`;
- `APPROVED_INTEREST`;
- `AUTHORIZED_COMMITMENT`;
- `SUPPORT_CONTEXT`;
- `BOUNDED_SUMMARY`.

Verification and lifecycle are separate axes:

```text
verification: PROPOSED -> VERIFIED | REJECTED
                 VERIFIED -> DISPUTED
                 DISPUTED -> VERIFIED | REJECTED

lifecycle: ACTIVE -> SUPERSEDED | EXPIRED | DELETED

retrieval eligible = ACTIVE + VERIFIED + allowed audience/egress
```

Model extraction creates a candidate, never a trusted active fact. Direct human entry may become
verified after validation. Phase 2 requires human review for model-derived customer memory; future
auto-accept categories require a separate policy decision.

Candidates are produced only as an explicit structured output of an authorized Employee-initiated
assistant/draft execution (or direct human entry), keyed idempotently by execution, source watermark
and semantic key. There is no background inbound-message extraction in Phase 2.

Every record keeps tagged subject type/id, Project, optional Product/Conversation, typed normalized
payload, provenance, confidence/verification state, lifecycle, classification, separate
`INTERNAL_ONLY`/`CUSTOMER_VISIBLE` audience, retention, timestamps and supersession links. Verification
does not change audience. New memory defaults `INTERNAL_ONLY`; customer egress requires an authorized
steward decision and remains forbidden for private Contact memory in a group draft.

`AUTHORIZED_COMMITMENT` is eligible only when provenance proves the commitment was already made by an
authorized Employee or authoritative signed/domain record. Model output, an unsent draft or an
unsupported direct memory entry cannot become a commitment merely through review.

Canonical module fields win. Contact language/channel, Product status, Deal state and other
module-owned facts are read live; memory may hold a provisional observation but cannot silently
overwrite module truth. Contact merge must remap/reconcile memory transactionally or quarantine a
conflict—never leave two active identities silently.

## 13. Multi-source Context Plan

The Phase 1 assembler accepts one bound `ALLOW` decision. Phase 2 must not reuse that decision for
unrelated sources.

The server builds a Context Plan where every source request has its own:

- capability key and version;
- fresh policy decision bound to the same Internal Agent and initiating Employee;
- exact scope/resource target;
- purpose-built projection loader;
- classification and customer-visibility ceiling;
- freshness requirement;
- fragment/character/token budget;
- provenance/citation metadata.

The browser/model cannot submit trusted policy decisions or raw projections. Queued plans are
re-evaluated at execution time. Omitted and truncated sources are recorded safely.

Factual authority is type-aware. Current owning-module state always wins for canonical fields.
Project/Product rules constrain behavior but are not facts. Eligible verified memory may specialize
published knowledge, but a newer explicit customer statement that conflicts with memory creates a
dispute/candidate and uncertainty; neither side silently overwrites the other. Recent conversation and
model prior knowledge remain untrusted. When required live data is unavailable, the output must
express uncertainty or escalate.

## 14. Initial live projections

Owning modules expose minimal, read-only projections:

- Projects: customer-safe Project/Product identity, configuration and current delivery summary;
- Tasks/Work Space: only explicitly approved status aggregates or selected task context, never raw
  private discussion by default;
- CRM/Clients: exact Contact/Company relationship and selected Deal context;
- Messenger/WhatsApp: exact persisted conversation mapping and bounded recent messages;
- Documents/Drive: published source text and citation metadata.

Finance, Payroll, Credentials, private Mail, unrestricted CRM and full Drive browse are excluded.
Adding a projection requires an owning-module canon update, capability, field allowlist, relationship
check, classification, negative tests and source-freshness contract.

## 15. Draft semantics and Messenger ownership

Before Phase 2 draft integration, Messenger must provide a canonical external conversation/message
contract with Product/Project/customer mapping and durable provider identities.

Inbound trust is Messenger-owned: authenticated Gateway server-to-server credentials with rotation,
channel-account binding, replay-window/idempotency checks and normalized event validation precede
Message persistence. Browser/caller-supplied provider ids or raw webhook payloads are never trusted
conversation evidence.

The Employee-owned send path must already create a durable, idempotent
Messenger outbound operation + outbox before provider submission. An ambiguous
post-submission timeout becomes `OUTCOME_UNKNOWN` and requires reconciliation;
it is never blind-retried. This safety belongs to Messenger for human and any
future machine send alike.

```text
authorized Employee `Generate draft` command over persisted inbound Message
  -> AI execution
  -> Messenger-owned Draft linked to aiExecutionId
  -> Employee review/edit
  -> Employee-owned Messenger send command
  -> Messenger queue / External Channel Adapter / delivery
```

AI Platform owns execution, context manifest and model provenance. Messenger owns Conversation,
Message, Draft, send authorization, queue, provider delivery and retry. AI never calls WhatsApp
Gateway/WAHA directly and never writes a fake Employee sender.

Required draft properties:

- exact conversation/customer/Product relationship;
- generated-by agent/execution attribution;
- body digest and source manifest reference;
- immutable revisions and one current revision;
- lifecycle `ACTIVE -> STALE | CANCELLED | SENT`;
- inbound watermark/conversation version and human edit history/provenance;
- no implicit send on generation, approval, retry or page refresh.

New inbound/human messages, target changes or takeover make the draft `STALE`. A stale revision cannot
send in Phase 2; the Employee must regenerate or edit/reconfirm against the current watermark, creating
a new `ACTIVE` revision. Send atomically checks expected current revision and watermark.

`messenger.reply_send` remains without a production Internal Agent handler in Phase 2.

Persisting an inbound event does not itself invoke a model in Phase 2. The
initial pilot requires an explicit authorized Employee generation command.

The selected source message must be inbound text authored by a confirmed external participant. A
connected-account echo, mapped Employee, bot/system or outbound author is ineligible. An unambiguous
external participant without Contact mapping may receive only a non-personalized group/conversation
draft with an `IDENTITY_UNRESOLVED` warning; if external authorship itself is uncertain, generation is
refused.

### Future send gate (not Phase 2)

The Phase 1 approval foundation is not, by itself, authority to send to a
customer. Any later approval-bound machine send must separately provide:

- an approver resolver that proves current Project/Conversation external-send
  permission; broad `COMPANY:EDIT` is insufficient;
- approval bound to immutable draft revision, body digest, Conversation,
  channel account and recipient/group;
- atomic approval consumption + Messenger outbound operation + outbox creation;
- current inbound watermark/revision, human-takeover and target revalidation;
- independent security, delivery and duplicate-send acceptance.

None of these prerequisites create a hidden send path in Phase 2.

## 16. UX surfaces

### Central `AI & Agents`

Owns providers, models, Internal Agents, prompts/rules, Model Policies, budgets, evaluation, approvals
foundation, usage, audit and global diagnostics.

### Project / Product -> AI

Shows readiness, Project base knowledge, Product overlays, rules, sources, memory policy, agent
assignment, budget, test console, activity and kill switch. Contextual screens project the central
configuration; they do not own provider secrets.

### Contact / Conversation

Shows memory grouped by Project/Product, candidate review/correction/delete controls and provenance.
It never presents one mixed global Contact memory.

### External Messenger / Product WhatsApp

Shows `Generate draft`, AI attribution, citations/freshness, missing-context warnings and escalation
reason. The external/client-visible visual guardrails remain Messenger-owned.

## 17. Security and privacy requirements

- deny by default at agent, Employee, target, source and output layers;
- exclude `INTERNAL_ONLY` context entirely from customer draft generation;
- treat messages, documents, files, memory, knowledge and model output as untrusted content;
- validate tool arguments independently and reauthorize every tool call;
- never expose Credentials/provider keys/agent tokens or copy them into knowledge/memory;
- reject secret-prone source types and quarantine suspected secret content;
- no arbitrary server-side URL fetch in Phase 2;
- render model Markdown safely; no unsanitized HTML/script execution;
- rate-limit by Employee, Project, conversation and Internal Agent;
- cap input, retrieved content, tool calls, output and provider retries;
- audit material configuration/lifecycle actions without prompt bodies or sensitive context;
- support session/memory/source correction, expiry and deletion;
- revocation takes effect before asynchronous index/object cleanup;
- prevent an outbound AI-assisted message from triggering an AI reply loop.

## 18. Failure and kill-switch behavior

Failures must be visible and non-destructive:

- provider failure -> configured fallback or failed execution, never invented success;
- missing/stale required data -> uncertainty/escalation;
- malformed output -> validation failure, no draft/domain action;
- queue unavailable -> durable queued state plus reconciliation or explicit unavailable response;
- revoked access/source -> deny and omit, even if derived index data still exists;
- budget exhausted -> fail before a new provider call;
- all Phase 2 feature flags off -> core NBOS continues normally.

Required controls include a global Internal AI runtime kill switch, per-Project activation, per-Product
draft activation and per-agent pause/disable.

## 19. Rollout posture

The only Phase 2 customer-facing production mode is a selected-project
`DRAFT_ONLY` pilot after migrations, non-production acceptance and
shadow/test-console evaluation. Approval-bound AI send and
`AUTO_SEND_ALLOWED` require a separate future implementation and explicit production decision.

Exact retention durations, context/tool limits, pilot roles, cost ceilings, multilingual quality
thresholds and rollout duration are adaptive operational values. They must be named configuration,
approved before production activation and recorded in the Phase 2 handoff/acceptance evidence.

## 20. Exit criteria

Phase 2 is closeable only when:

1. the Product Entry Gate is closed;
2. a real Internal Agent invokes an approved provider/model through Model Policy;
3. the Project Assistant returns grounded, cited Project/Product answers;
4. Project base and Product overlay isolation pass adversarial tests;
5. persistent memory survives restart and supports review, correction, expiry and deletion;
6. the same Contact in different Projects cannot cross-read memory;
7. live module state overrides stale memory/knowledge;
8. source revoke/delete blocks retrieval immediately;
9. queued/resumed execution revalidates agent and Employee access;
10. customer draft generation uses only customer-visible sources and exact conversation mapping;
11. generated drafts never send without a separate Employee Messenger action;
12. prompt injection cannot widen context, tools or actions;
13. audit/usage/cost/evaluation are attributable without secrets/full sensitive payloads;
14. migrations, worker recovery, kill switches and rollback are verified;
15. existing External Agent, AI Admin and human module workflows remain intact.

## 21. Canonization after implementation

After final acceptance, move implemented behavior into active AI, Projects, Clients, Messenger,
Drive/Documents and technical-decision canon; mark the future capability `DONE`; and record exact
destinations. Until then this document and the checklist are planned target canon, not runtime
evidence.
