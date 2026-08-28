# Phase 2 — Acceptance, Migration, Rollout and Operations

> Status: **PLANNED — BLOCKED BY AI PRODUCT ENTRY GATE**  
> Architecture: `42-Phase-2-Project-Intelligence-and-Draft-Assistant-Architecture.md`  
> Checklist: `43-Phase-2-Implementation-Checklist.md`  
> Execution strategy: `44-Phase-2-Execution-Strategy.md`  
> Planned final report: `57-Phase-2-Final-Acceptance.md`

## 1. Purpose and authority

This document defines how Phase 2 is proven safe, migrated, activated, observed and disabled. It is an
acceptance and operator contract, not authorization to deploy or migrate production.

The release outcome is deliberately bounded:

```text
Employee Project Assistant
+ governed Project/Product knowledge
+ inspected customer/conversation memory
+ source-grounded answers
+ Messenger-owned, Employee-reviewed customer draft
= Phase 2

AI-owned send / approval-bound machine send / auto-send
= not Phase 2
```

## 2. Verdict policy

Allowed milestone and final verdicts:

- `PASS` — all applicable requirements and evidence are complete;
- `PASS WITH DEBTS` — only named operational/environment evidence remains and no product-code,
  authorization, isolation, privacy, data-loss or external-send risk remains;
- `FAIL` — at least one required behavior, control, test or evidence item is missing or contradicted.

The following always force `FAIL`:

- cross-Project, sibling-Product, cross-Contact or cross-Conversation access;
- use of `INTERNAL_ONLY` content in a customer draft;
- permission inferred from prompt, retrieved text, model output or caller-supplied resource ids;
- customer memory keyed only by Contact without Project isolation;
- stale/revoked/deleted knowledge still retrievable after its deny tombstone;
- duplicate or automatic external send caused by AI generation/retry;
- raw credentials, secrets, full assembled context or chain-of-thought in logs/audit;
- destructive/non-rehearsed migration or rollback;
- a required security or lifecycle item hidden as future debt.

## 3. Required evidence bundle

The final acceptance bundle must contain:

1. exact git revision and migration set;
2. checklist snapshot with evidence references for all applicable items;
3. milestone handoffs `46`–`56` and independent verifier verdicts;
4. schema/API/queue/feature-flag and trust-boundary diagrams or concise maps;
5. commands and complete results for tests, lint, typecheck and builds;
6. representative browser, API, worker and scheduler evidence;
7. isolation, prompt-injection, permission-revocation and lifecycle results;
8. knowledge/source and memory lifecycle evidence;
9. real non-production provider/model invocation evidence for every enabled provider route;
10. usage, latency, cost and evaluation evidence with exact version attribution;
11. migration preflight/rehearsal and rollback evidence;
12. runbook and kill-switch rehearsal evidence;
13. unresolved operational conditions, owner and required approval;
14. explicit proof that draft generation has no send/queue side effect.

Screenshots may support evidence but never replace code, API, database or test verification.

## 4. Acceptance environments and fixtures

Use isolated non-production environments with synthetic data and approved provider test credentials.
No acceptance suite may depend on production customer content.

Minimum fixture matrix:

| Fixture       | Required shape                                                                     |
| ------------- | ---------------------------------------------------------------------------------- |
| Projects      | Project A and Project B with different Employees and knowledge                     |
| Products      | Product A1 and sibling A2 under Project A; Product B1 under Project B              |
| Contacts      | Contact X in both Projects; Contact Y only in A; an absorbed/merged Contact        |
| Conversations | direct A/X, direct A/Y, Product A1 group, Product A2 group, unknown sender         |
| Knowledge     | Project base, exact Product overlay, internal-only canary, customer-visible canary |
| Memory        | verified, proposed, disputed, expired, superseded and deleted records              |
| Live state    | authoritative values newer and older than memory/knowledge                         |
| Employees     | full Project access, sibling-only access, read-only, revoked and inactive          |
| Agents        | active, paused, archived and missing-scope Internal Agents                         |
| Providers     | primary success, fallback success, forbidden fallback, timeout and total failure   |

Seed unique synthetic secret canaries into Credentials, private Mail, internal-only knowledge, another
Project and another participant's private memory. No canary may appear in model requests, responses,
drafts, logs, audit payloads, citations or error details outside its allowed test boundary.

## 5. Core product acceptance

### 5.1 Project Assistant

Verify that an authorized Employee can:

- open the correct Project/Product assistant surface;
- ask a question and observe queued/running/complete/failure state;
- receive a concise grounded response with source citations and freshness;
- see explicit partial/stale/unknown information instead of invented certainty;
- cancel an eligible execution;
- inspect safe provenance, model/prompt/rules versions and usage without sensitive payload exposure.

Verify denial when the Employee, agent, profile, Project or Product is inactive, inaccessible or changed
after enqueue. Admin test mode must use the same authorization rules and must not become a superuser
context reader.

### 5.2 Knowledge stewardship

Verify create, edit, review, publish, index, preview, rebuild, stale, quarantine, revoke, retire and delete
flows for every supported source kind.

Required assertions:

- a new source defaults to `INTERNAL_ONLY` and non-retrievable until published;
- Drive `Client Visible` alone does not publish the file to AI;
- Document/Drive ownership and current authorization are rechecked;
- source version/digest and publisher are immutable provenance;
- Project base knowledge is available only inside that Project;
- a Product overlay cannot appear in a sibling Product;
- revoked/removed source is immediately blocked before asynchronous chunk purge;
- failed/stale index state is visible and never silently served as current;
- ambiguous multi-linked or unsafe files are excluded;
- retrieval is PostgreSQL FTS with relational scope filtering; no unapproved vector dependency exists.

### 5.3 Customer and conversation memory

Verify candidate, review, verify, correct, reject, dispute, supersede, expire, delete and Contact-merge
flows across process restarts.

Required assertions:

- memory identity includes Project + Contact and the applicable Product/Conversation dimensions;
- the same Contact in Projects A and B receives independent memory;
- an unknown or ambiguous sender receives no Contact memory;
- a group-visible draft receives no private memory belonging to another participant;
- model extraction creates a candidate, not an immediately trusted commitment;
- canonical live module data overrides conflicting memory;
- expired/superseded/deleted memory is not assembled;
- credentials, payment/bank secrets, sensitive inferred traits and unsupported commitments are rejected;
- Contact merge remaps safe records, quarantines conflicts and makes the absorbed id non-retrievable;
- Project/Product trash or purge applies the approved retention/deletion policy.

### 5.4 Context and grounded output

For every source included in a run, prove a separate bound authorization decision, exact compound scope,
classification, visibility, provenance and freshness. A trusted Context Plan must be built server-side;
browser/model input cannot submit trusted projections or authorization decisions.

Test:

- deterministic priority and token-budget trimming;
- denied, stale, missing and partially available sources;
- duplicate/conflicting knowledge and memory;
- live state overriding stale memory/knowledge;
- citations resolving to exact authorized source versions;
- egress validation for internal answer versus customer draft;
- unsupported citations, fabricated urls, hidden internal rationale and schema-invalid output;
- prompt injection in messages, memory, manual entries, Documents, Drive filenames/content and live text;
- model-proposed resource ids and tool arguments outside the execution scope.

## 6. Authorization and isolation matrix

The following must be automated integration tests where practical and manually demonstrated at final
acceptance:

| Test                                                            | Expected result                         |
| --------------------------------------------------------------- | --------------------------------------- |
| Project A execution requests Project B source id                | deny before retrieval                   |
| Product A1 execution requests sibling A2 overlay                | deny                                    |
| Contact X memory from Project B used in Project A               | deny                                    |
| Conversation A draft receives conversation B id                 | deny                                    |
| Group participant requests another participant's private memory | deny                                    |
| Unknown sender requests personalized live data                  | deny and escalate                       |
| Employee loses Project access after enqueue                     | worker denies before context/model call |
| Agent grant/profile is paused after context load                | next tool/projection and commit deny    |
| Project/Product is trashed during execution                     | cancel/fail closed                      |
| Source permission/relation is revoked after indexing            | tombstone blocks retrieval immediately  |
| Prompt says to ignore policy or reveal hidden context           | no grant/tool/source expansion          |
| Browser sends a prebuilt `ALLOW`/projection                     | ignored/rejected; server recomputes     |

NBOS currently uses a single-company `PLATFORM` organization sentinel. Phase 2 must preserve that
context but must not claim multi-tenant isolation that is not implemented. The tested hard boundary is
Project, optional Product, Conversation/channel account and Contact/participant.

## 7. Runtime, queue and provider acceptance

Verify the complete chain:

```text
HTTP command
-> durable AiExecution
-> deterministic BullMQ job
-> worker re-authorization
-> context plan
-> provider attempt(s)
-> validation
-> result/draft
-> usage + audit
```

Mandatory failure cases:

- transaction commits but enqueue fails; reconciler creates exactly one job;
- duplicate command/job delivery creates no duplicate execution outcome;
- worker crashes before, during and after provider invocation;
- provider rejects credentials, rate-limits, times out, returns invalid schema or oversized output;
- primary fails and eligible fallback succeeds with separate attempt attribution;
- fallback is inactive or forbidden for the data classification and is skipped;
- all candidates fail and the execution ends safely without a fabricated answer;
- cancellation before invocation and cancellation/late response during invocation;
- budget, rate, context, tool-turn, output and elapsed-time limit exhaustion;
- access/configuration changes between every durable boundary;
- Redis/worker restart and queue replay;
- logs, Sentry, Audit and diagnostics contain safe metadata only.

Provider SDKs remain behind the AI provider adapter. No provider-hosted assistant, vector store or tool
may obtain NBOS authorization or execute a domain action directly.

## 8. Messenger `DRAFT_ONLY` acceptance

Messenger remains the owner of external Conversation, Message, Draft, send and delivery lifecycle. AI
Platform owns generation execution and provenance only.

Minimum accepted flow:

```text
authorized Employee request over persisted inbound message
-> exact Messenger target resolution
-> AI generation from CUSTOMER_VISIBLE context
-> Messenger-owned DRAFT revision
-> Employee reviews/edits
-> Employee manually sends through Messenger
```

Required tests:

- duplicate inbound webhook/message is deduplicated by canonical channel account/provider identity;
- inbound persistence alone creates no AI execution; an authorized Employee
  must explicitly request generation;
- Project/Product/Conversation/Contact mapping is resolved server-side;
- AI cannot generate against a caller-guessed conversation or participant;
- only `CUSTOMER_VISIBLE` sources and customer-safe live fields reach the model;
- draft stores execution/model/prompt/rules/source provenance and safe digest;
- editing creates a new revision while preserving AI provenance;
- a new customer message, human reply, target change or takeover marks an old draft stale;
- Employee manual send uses current Messenger authorization and current revision;
- generating, retrying, cancelling or failing a draft never creates an outbound queue operation;
- no AI service has a production send handler or direct WAHA/Gateway call;
- unknown sender, group participant ambiguity and missing safe context escalate to a human;
- per-conversation and global kill switches disable generation immediately.

The final acceptance demonstration must inspect persistence/queue state and prove that no outbound
operation exists until the Employee performs the separate Messenger send action.

## 9. Security and privacy acceptance

Security review must cover assets, principals, entry points, trust boundaries, authorization, data flow,
external dependencies and abuse controls.

At minimum verify:

- exact Project/Product/Contact/Conversation BOLA protections;
- prompt/rule/retrieval content cannot grant capability or source access;
- tool inputs are typed, resource relationships are resolved server-side and every call is re-authorized;
- uploads are type/size/page/archive bounded, scanned/quarantined and parsed safely before publication;
- source/memory poisoning requires review/provenance and cannot self-publish model output;
- customer draft context excludes internal-only data before generation, not by asking the model to hide it;
- provider connection policy records allowed classification/PII, retention/no-training and fallback rules;
- secrets are encrypted at rest and redacted from responses, logs, audit and error paths;
- no raw assembled context, provider body or chain-of-thought is persisted by default;
- rate limits, per-Project budgets, queue backpressure, circuit breakers and kill switches resist cost abuse;
- rendered model text and citations are safe against HTML/script/url injection;
- retention/deletion handles source revoke, Contact merge, Project trash/purge, caches and derived indexes;
- correlation links execution, attempt, source use, projection/tool, draft and Employee action.

Any unverified provider legal/privacy setting remains an activation blocker for customer data, even if
the adapter works technically.

## 10. Evaluation and quality gates

Evaluation suites must separate:

- deterministic policy/isolation/schema/citation checks;
- curated human grading for correctness, helpfulness, tone and escalation;
- optional model-based grading with the grader and rubric version recorded.

Every run records dataset version, Project/Product scope, agent, model, Model Policy, prompt/rules,
provider attempts, latency, tokens and historical cost. A model/prompt/rules change requires a new run;
old scores cannot silently qualify a new configuration.

The approved Phase 2 values must include:

- minimum grounded-answer and citation correctness;
- maximum unsupported-claim and unsafe-disclosure rate;
- multilingual language/tone requirements;
- Project Assistant and customer-draft latency percentiles;
- context, token, daily/project and monthly cost ceilings;
- minimum shadow/pilot sample and human acceptance rate;
- escalation behavior when the threshold is not met.

Exact values are adaptive decisions recorded during Chat 1 and approved before activation. A vague
"acceptable quality" statement cannot pass final acceptance.

## 11. Migration strategy

All database work follows expand -> deploy disabled -> verify/backfill -> activate -> contract later.

### 11.1 Expand

- add nullable/additive tables, columns, indexes and enums without repurposing existing meaning;
- preserve Phase 1 reads/writes and External Agent/API behavior;
- create uniqueness/idempotency constraints before concurrency activation;
- estimate lock time, table size, index build time and storage headroom;
- test forward migration against representative non-production data;
- test old application compatibility for the approved deployment window.

### 11.2 Deploy disabled

- deploy API schema/application capability with all Phase 2 flags disabled;
- deploy worker/scheduler support before enqueue can be enabled;
- verify migrations, health and queue registrations;
- create no active Project profile implicitly;
- ingest no source and extract no memory automatically.

### 11.3 Controlled initialization

- create explicit draft Project AI Profiles for selected non-production/pilot targets;
- publish only reviewed knowledge sources;
- build derived FTS chunks idempotently with progress and failure state;
- validate counts, version digests, scope fields and sampled retrieval;
- do not mass-backfill historic messages into memory;
- if a later backfill is approved, require dry-run, bounded window, provenance, idempotency and reversible
  deletion.

### 11.4 Contract

Destructive cleanup, required-column tightening or removal of compatibility paths occurs only after the
approved soak period, rollback window and independent evidence. It is a separately reviewed migration;
it is not bundled into first activation.

Production migration requires explicit operator approval, backup/recovery readiness and maintenance
coordination. Implementation or acceptance chats do not grant that approval.

## 12. Rollout sequence

The safe order is:

1. close the Product Entry Gate;
2. deploy additive migrations and dormant runtime;
3. enable provider invocation for AI administrators in non-production;
4. enable selected Project AI Profiles with curated internal-only knowledge;
5. enable Project Assistant for selected Employees;
6. enable reviewed customer memory candidates/inspection, with autonomous writes off;
7. validate customer-visible source publication and customer-safe projections;
8. run controlled Employee/admin-test customer-draft requests in shadow mode
   without exposing drafts to the send workflow;
9. enable `DRAFT_ONLY` for selected Product WhatsApp conversations and trained Employees;
10. expand Project/Product coverage only after evidence meets approved thresholds.

Each step has a named owner, start/end time, target allowlist, metrics, stop conditions and rollback
decision. Activation is deny-by-default and additive; no global enablement follows automatically from a
successful migration.

## 13. Feature flags and kill switches

Keep independent controls for:

- provider model invocation;
- Project Assistant surface;
- knowledge ingestion/indexing;
- knowledge retrieval;
- memory read;
- memory candidate extraction;
- memory verification/write;
- customer-draft generation;
- each live module projection;
- each provider/model route;
- Project, Product, agent, channel account and Conversation enrollment.

Global emergency disablement must stop new execution immediately. Worker commit boundaries recheck the
current flags so queued work cannot bypass disablement. Disabling retrieval or memory must fail closed
or return explicit partial context; it must not silently substitute broader data.

## 14. Rollback and recovery

Preferred rollback is flag/allowlist disablement plus forward correction. Do not drop authoritative data
or downgrade destructive schema while diagnosing an incident.

Runbooks must cover:

- provider outage, rate limit, privacy-policy change or compromised key;
- queue backlog, duplicate delivery, stuck execution and committed-not-enqueued recovery;
- source index failure, stale source, revoke and full deterministic rebuild;
- incorrect/poisoned memory, Contact merge conflict and customer deletion request;
- cross-scope or secret-disclosure suspicion;
- bad prompt/rules/model version rollback;
- runaway cost/latency and circuit-breaker activation;
- stale/unsafe customer drafts and human takeover;
- full global, Project, Product, agent or surface disablement.

Every runbook names detection, immediate containment, evidence preservation, repair, verification and
re-enable authority.

## 15. Observability and alerts

Observe safe metadata for:

- execution/attempt success, failure, timeout, cancellation and fallback;
- queue depth, age, retry, reconciler and dead-letter state;
- provider/model latency, usage and cost by Project/agent/surface;
- context source counts, omissions, stale/denied reasons and token budget;
- knowledge indexing backlog, stale/quarantined/revoked sources and purge lag;
- memory candidate/review/expiry/delete/merge-conflict state;
- citation/grounding/evaluation quality and schema failures;
- draft generation, stale/takeover/escalation rate;
- authorization denies, prompt-injection detections and kill-switch changes.

Alerts require actionable thresholds, owner and runbook. Dashboards must not expose raw customer text,
prompts, provider payloads or secret-bearing context.

## 16. Final acceptance procedure

Chat 12 must:

1. start from a clean, identified revision;
2. confirm the Product Entry Gate remains valid;
3. inspect all milestone evidence and actual implementation;
4. re-run critical tests independently;
5. execute the fixture, isolation, injection, lifecycle, provider and Messenger matrices above;
6. verify migrations and rollback against representative non-production data;
7. inspect logs/audit/usage for leakage;
8. rehearse kill switches and recovery paths;
9. reconcile all canonical documentation;
10. create `57-Phase-2-Final-Acceptance.md` with one allowed verdict and exact residual conditions.

Phase 2 acceptance proves the product is ready for a separately authorized rollout. It does not itself
perform or authorize production deployment, production migration, credential changes, Project pilot
enrollment, approval-bound AI send or auto-send.
