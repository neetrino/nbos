# Customer-Facing AI Policy

## Purpose

Define additional safety, privacy and approval requirements for AI that communicates with or acts in workflows involving external customers/clients.

Customer-facing AI has a higher risk profile than an internal employee assistant because mistakes may disclose data, create commitments or send incorrect information externally.

## Core principles

- deny by default;
- strict conversation/customer/resource isolation;
- least-privilege context;
- explicit send permissions;
- human escalation path;
- no secret access;
- no cross-customer data leakage;
- auditable actions;
- domain rules remain authoritative.

## Customer context boundary

An execution must identify its customer-facing scope, for example:

```text
channel = MESSENGER
conversationId = ...
customer/contactId = ...
organizationId = ...
```

The agent may only receive data explicitly authorized for that interaction.

One customer's conversation must never create implicit access to another customer's records.

## Data available to customer-facing agent

Potentially permitted when relevant and authorized:

- current conversation/history within configured limits;
- public/approved FAQ/knowledge;
- selected contact profile fields;
- related Deal/Order/Support context when explicitly configured;
- approved product/service information;
- approved operational status information.

Not available by default:

- other customers' conversations;
- employee private data;
- Credentials/secrets/tokens;
- unrestricted finance/payroll;
- unrelated internal documents;
- full organization Drive;
- hidden/internal notes unless explicitly permitted by policy.

## Internal-only vs customer-visible content

NBOS data should distinguish content that may be sent externally from internal-only content where the owning module supports that concept.

The AI must not assume every internal comment/note/document is suitable for customer disclosure.

## Response modes

Customer-facing agents may operate in modes such as:

### DRAFT_ONLY

AI prepares a response; a human sends it.

### APPROVAL_REQUIRED

AI proposes a response/action and creates an approval request before send.

### AUTO_SEND_ALLOWED

AI may send only within explicitly approved low-risk categories/policies.

Initial production deployment should prefer DRAFT_ONLY or narrow AUTO_SEND_ALLOWED policies until quality/safety is proven.

## Message send capability

Sending is separate from drafting.

Examples:

```text
messenger.reply.draft
messenger.reply.send
```

Granting read or draft rights does not grant send rights.

## Escalation

Agent must be able/required to escalate to a human when:

- request falls outside allowed capability/domain;
- customer asks for legal/contractual commitment beyond policy;
- refund/payment/financial promise requires approval;
- identity/security verification is required;
- policy detects sensitive/high-risk topic;
- required data is missing/ambiguous;
- model/tool execution fails;
- configured confidence/quality gate fails (as supporting policy, not sole security control).

Escalation should preserve conversation context and reason.

## Business commitments

Customer-facing AI must not create unauthorized commitments regarding:

- pricing/discounts outside configured rules;
- refunds/credits;
- legal terms;
- delivery/SLA guarantees;
- security/privacy promises;
- financial obligations.

Such actions require explicit capabilities and possibly approval.

## Task creation

A Messenger/customer-facing agent may later receive a scoped `tasks.create` capability for operational follow-up.

Rules:

- target Work Space/Task type must be policy-selected/authorized;
- customer message content is treated as untrusted input;
- task create uses normal Tasks validation;
- no task deletion capability;
- provenance links the task to source conversation when appropriate;
- duplication prevention/idempotency applies.

## Prompt injection and malicious customer input

Customer messages are untrusted data.

A customer cannot instruct the agent to:

- reveal system prompts;
- reveal secrets;
- bypass permissions;
- access other customers;
- call unauthorized tools;
- ignore approval requirements.

Enforcement belongs to tool/policy boundaries, not only prompt wording.

## Identity and authentication

AI must not claim successful customer identity verification unless the relevant NBOS/module flow has actually verified it.

Sensitive account changes should rely on established authentication/verification workflows rather than conversational assertions.

## Retrieval / knowledge

Customer-facing retrieval sources must be explicitly approved for external use or filtered appropriately.

Internal-only sources may support reasoning only if policy allows and response generation prevents disclosure of protected content.

Where the distinction cannot be enforced reliably, exclude the source.

## Hallucination/freshness controls

For factual operational answers (prices, availability, order status, policy, schedules), prefer authoritative NBOS/domain data over model memory.

Context should carry source/freshness metadata where useful.

If authoritative data is unavailable, the agent should not invent a definitive answer.

## Human visibility

Human operators should be able to see:

- that a response/action was AI-generated;
- which Internal Agent produced it;
- whether it was auto-sent or approved;
- key source/provenance information where appropriate;
- escalation/approval history.

Customer-facing disclosure that AI is being used is a product/legal policy decision and should be configurable according to applicable requirements; internal provenance remains mandatory regardless.

## Rate and abuse limits

Protect against:

- customer spam causing excessive model spend;
- automated prompt-injection probing;
- repeated tool/action attempts;
- runaway loops;
- excessive message generation.

Rate limits may apply per conversation/customer/channel/agent.

## Failure behavior

If provider/model/tooling fails:

- do not silently claim success;
- do not duplicate sends/actions on retry;
- preserve idempotency;
- escalate or return a safe fallback according to channel policy;
- record execution failure.

## Customer isolation tests

Mandatory future acceptance tests include:

- Customer A cannot retrieve Customer B conversation/data;
- conversation ID guessing does not bypass scope;
- linked Deal/Order lookup stays within permitted customer/resource relationship;
- internal notes are not externally exposed without explicit policy;
- secret endpoints are unreachable;
- malicious prompt text cannot widen capabilities;
- send capability is separate from draft capability;
- approval-required response cannot send without valid approval.

## First implementation scope

Foundation now:

- customer-facing channel/risk classification;
- explicit draft vs send capability distinction;
- DRAFT_ONLY / APPROVAL_REQUIRED / AUTO_SEND_ALLOWED policy modes;
- conversation/customer scope contract;
- escalation contract;
- admin configuration placeholders/contracts;
- audit/provenance requirements.

Not required now:

- actual Messenger AI auto-reply runtime;
- autonomous client negotiations;
- unrestricted customer action automation.
