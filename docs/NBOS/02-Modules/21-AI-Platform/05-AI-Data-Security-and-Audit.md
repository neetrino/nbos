# AI Data Security and Audit

## Security posture

AI access is deny-by-default, least-privilege, scope-aware and auditable.

## Secret exclusion

General AI context must never include:

- credential passwords;
- API keys;
- access/refresh tokens;
- private keys;
- environment secrets;
- encryption keys;
- raw agent credentials.

Credential metadata may be exposed only if a future explicit capability is approved; secret values remain separately governed by Credentials security.

## Sensitive-data handling

Sensitive business data is not globally forbidden. It is conditionally available only when an explicitly authorized capability needs it.

Examples:

- Finance Analytics Agent may receive approved financial projections but not unrelated payroll details.
- CRM Agent may receive selected contact/deal context but not Credentials.
- Messenger Agent may receive the permitted conversation being triaged but not all mailboxes/chats.

## Context minimization

Every AI read should use purpose-built projections rather than returning full ORM entities.

Apply:

- field allowlists;
- record authorization;
- linked-resource checks;
- redaction;
- payload limits;
- retention rules.

## Prompt-injection boundary

Content stored in messages, documents, tasks or files is untrusted data, not system policy.

AI runtime must not allow document/message text to override:

- authorization;
- capability grants;
- system safety policy;
- approval requirements;
- secret restrictions.

## Audit actor model

Current Audit is user-centric and must be generalized.

Target audit identity contains:

- `actorType`;
- `actorId`;
- optional `userId` for backward compatibility/human actor lookup;
- optional `onBehalfOfType` / `onBehalfOfId`;
- external credential/client metadata when safe.

Existing historical audit rows must remain readable.

## AI audit events

Material events include:

- agent created/disabled/revoked;
- credential issued/rotated/revoked;
- capability/scope changed;
- authorization denied for sensitive action;
- task/domain mutation;
- approval requested/approved/rejected;
- AI execution started/completed/failed/cancelled;
- sensitive report/export read when module policy requires it.

## Audit payload rules

Never persist:

- bearer token;
- raw secret;
- full sensitive prompt unless separately approved;
- full file body by default;
- private provider credentials.

Prefer IDs, hashes/digests, action summaries and safe structured diffs.

## Observability

Operational logs should carry correlation IDs linking:

```text
HTTP request -> actor -> capability -> AI execution -> BullMQ job -> domain action -> audit record
```

Authorization headers and secrets must be redacted.

## Approval safety

Approval records must identify:

- requester actor;
- requested capability;
- target resource;
- proposed action payload or digest;
- approver;
- decision;
- timestamps;
- one-time/expiry semantics.

## Revocation

Revocation must block new requests immediately. Delayed/queued sensitive writes should revalidate actor status and applicable grants before commit.
