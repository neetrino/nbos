# AI Risk and Approval Policy

## Purpose

Define how NBOS classifies AI actions by risk and when human approval is required before a domain action may commit.

## Core rule

Authorization and approval are separate.

An actor may be authorized for a capability but still require approval for a particular use case/resource/action.

Policy decision:

```text
ALLOW
DENY
REQUIRE_APPROVAL
```

Default is DENY when required policy information is missing.

## Risk dimensions

Risk may depend on:

- action type;
- read vs write;
- reversibility;
- financial effect;
- customer/external communication;
- data sensitivity;
- resource scope;
- automation/autonomy level;
- actor type;
- channel;
- volume/batch size;
- confidence/evaluation constraints where explicitly designed.

Do not determine risk from model confidence alone.

## Suggested risk classes

- LOW
- MEDIUM
- HIGH
- CRITICAL

Examples:

### LOW

- read an authorized Task;
- read public/internal FAQ content;
- add an internal progress note where explicitly granted.

### MEDIUM

- create/update a Task;
- submit Task for review;
- create a draft document;
- prepare a client reply draft.

### HIGH

- send a client-facing message automatically;
- alter financial/business-critical data;
- bulk-create or bulk-update records;
- publish externally visible content.

### CRITICAL

- destructive deletion;
- credential/secret operations;
- irreversible money movement;
- high-impact legal/security actions.

CRITICAL capabilities may remain entirely forbidden to AI even with approval until a future explicit design exists.

## Approval policy

Conceptual policy can consider:

```text
actor / internal agent
capability
resource scope
data classification
channel
risk class
payload characteristics
business rule
```

An agent-specific policy may only restrict a globally allowed capability; it cannot bypass module/platform restrictions.

## Approval record

Conceptual fields:

```text
AIApprovalRequest
- id
- requesterActorType
- requesterActorId
- onBehalfOf...
- capability
- resourceType/resourceId
- payloadDigest
- safePayloadSummary
- status
- requestedAt
- expiresAt
- decidedByEmployeeId
- decidedAt
- decisionReason
- execution/correlationId
```

Statuses:

- PENDING
- APPROVED
- REJECTED
- EXPIRED
- CANCELLED
- CONSUMED

## Payload binding

Approval must bind to the proposed action or a canonical digest of it.

If material action data changes after approval, the old approval cannot authorize the new payload.

Examples of material change:

- different recipient;
- different amount;
- different task/project;
- different message content where content matters;
- different document/publication target.

## One-time semantics

Default approval is one-time and consumed by the approved action.

Reusable approvals require an explicitly designed policy scope/time window and are not the Phase 1 default.

## Who may approve

Approval uses normal employee RBAC/module permissions.

An AI actor cannot approve its own action.

The initiating employee is not automatically a valid approver if the target module requires a higher permission.

## Expiration

Approvals expire after a configured period appropriate to risk.

Expired approval requires a new request and revalidation.

## Revalidation before commit

Even after approval, the Domain Action Gateway revalidates:

- actor active state;
- capability grant;
- resource scope;
- current domain/business state;
- approval validity and payload digest;
- relevant module policy.

Approval is not a permanent authorization bypass.

## Queued actions

For delayed/queued high-risk actions, policy is revalidated close to commit.

Revoking/disabling the actor or grant before commit must prevent execution where policy requires it.

## External Agent Phase 1

Coding-agent Task actions normally follow capability grants:

- Task read/list: no approval after grant;
- Task create/update: no separate human approval by default, but explicit capability required;
- Task start/comment/attach: no approval by default after grant;
- submit review: allowed after grant;
- delete: unavailable;
- force complete: unavailable.

Existing Task human review/completion remains a domain workflow, not an AI Approval replacement.

## Internal Agent examples

### Client Messenger Agent

Possible future policy:

- read active conversation: ALLOW;
- generate draft response: ALLOW;
- send routine low-risk approved-class response: optionally ALLOW;
- sensitive/refund/legal/financial promise: REQUIRE_APPROVAL;
- disclose secrets: DENY.

### Finance Analytics Agent

- approved finance read: ALLOW;
- generate analysis/report: ALLOW;
- change invoice/payment/accounting data: DENY or REQUIRE_APPROVAL only after separate business design.

## Batch actions

Batch size may raise risk.

Example:

```text
create one task -> MEDIUM
bulk update 500 tasks -> HIGH
```

Policy should support thresholds rather than treating every call equally.

## Approval UX

Central AI administration should expose a pending approval queue, and contextual surfaces may show related approvals.

Approver UI must show:

- requesting agent;
- action/capability;
- affected resource;
- safe proposed payload summary;
- risk reason;
- expiry;
- approve/reject.

Never require the approver to reveal provider/agent secrets.

## Audit

Audit:

- approval request;
- decision;
- expiry/cancel;
- consumption;
- final action result.

Link via correlation/execution IDs.

## First implementation scope

Foundation now:

- risk metadata on capabilities;
- `ALLOW/DENY/REQUIRE_APPROVAL` policy contract;
- approval persistence/schema;
- payload digest binding;
- lifecycle/expiration;
- admin queue/API shell;
- audit hooks.

Not required now:

- elaborate approval rules for every future module;
- autonomous risk scoring by an LLM;
- reusable blanket approvals for high-risk actions.
