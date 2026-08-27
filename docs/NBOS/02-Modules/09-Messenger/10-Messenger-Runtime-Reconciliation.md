# Messenger Runtime Reconciliation and Migration Safety

> Status: **required implementation precondition**.
>
> Product truth: `00-Messenger-Overview.md` + `08-Messenger-Decision-Register.md`.
>
> This document describes how the approved Messenger canon must be reconciled with already existing runtime/data. It is not permission to redesign the canon to match legacy code.

## 1. Core rule

When current runtime conflicts with approved product architecture:

```text
Canon wins for target behavior.
Existing production data/runtime wins for migration safety.
```

Therefore implementation follows:

```text
ADD NEW MODEL / COMPATIBLE PATH
  -> BACKFILL / MAP
  -> VERIFY PARITY
  -> CUT OVER READS/WRITES
  -> OBSERVE
  -> REMOVE LEGACY ONLY LAST
```

**Why:** the Messenger rebuild changes several already-used relationships. A drop-first rewrite could lose discussion history, break Deal Won/WhatsApp behavior, duplicate provider groups, or make existing Products unable to resolve their client communication.

Destructive migration is forbidden until the relevant slice has independent review evidence and the final cleanup gate allows it.

---

## 2. Reconciliation classifications

Use only these labels when inspecting current code/schema:

- `REUSE` — existing runtime already satisfies the target contract.
- `EXTEND` — keep existing behavior and add target capability around it.
- `MIGRATE` — existing working data/runtime must move to a new canonical model.
- `NEW` — target capability does not materially exist yet.
- `DELETE-LATER` — legacy data/code remains temporarily for safe cutover, then is removed only after verification.
- `VERIFY/MISSING` — documentation or previous inspection suggests something, but current runtime was not confirmed strongly enough to treat as implemented.

A reviewer must reject any slice that silently treats `VERIFY/MISSING` as `REUSE`.

---

## 3. Current reconciliation map

| Area | Classification | Required treatment |
| --- | --- | --- |
| Existing internal channel/direct primitives | `REUSE/EXTEND` where compatible | Preserve working persistence/realtime/ACL behavior; map into canonical Messaging Core rather than rebuilding blindly. |
| Preserved/unused unified Messenger schema | `VERIFY` | Inspect model-by-model; reuse only if contracts match canon. Do not resurrect old L1/L2 architecture because tables exist. |
| L1/L2 Topics / mandatory Project General | `DELETE-LATER/DO NOT RETURN` | Historical artifacts may remain during migration, but target product must not depend on them. |
| Human Task Discussion (`TaskDiscussionEntry` / equivalent legacy runtime) | `MIGRATE` | Preserve full history/provenance/files/audit while moving human discussion to Messaging Core. |
| Task system Activity Feed | `REUSE` | Remains task/system activity, not converted into human chat messages. |
| Product + Connected Work Space separate conversation assumptions | `MIGRATE/RECONCILE` | Resolve both surfaces to one canonical internal Conversation. |
| Current hard Product ↔ WhatsApp group binding / raw group id assumptions | `MIGRATE` | Replace with flexible purpose-based bindings; existing bindings backfill as `WORK`. |
| Deal Won WhatsApp create/bind lifecycle | `EXTEND` | Keep proven create/bind/failure/outcome semantics; target becomes Product `WORK` binding and existing-conversation selection. |
| Product Client Communication settings | `EXTEND/REPLACE` | Replace one raw group concept with WORK/FINANCE destinations. |
| Client Messenger external UI | `NEW/REPLACE` | Build separate Client surface; old mixed Internal/External switch is not target UX. |
| Platform RBAC/entity access foundation | `REUSE/EXTEND` | Add conversation participation and external READ/SEND; do not invent separate global ACL system. |
| Support Ticket case workflow | `REUSE/EXTEND` | Keep SLA/case state; remove public client-composer semantics and link to canonical Client messages. |
| Finance reminder Messenger send path | `VERIFY/MISSING` | End-to-end Messenger/WhatsApp reminders are not treated as complete. New implementation must use purpose resolver. |
| WhatsApp Gateway v1 account/send/inbound webhook infrastructure | `REUSE/EXTEND` | Gateway already owns transport/session/provider concerns; NBOS must consume it rather than rebuild it. |
| Gateway docs that say “store returned group id on Product” | `LEGACY DOC / CHANGE` | New NBOS model stores provider mapping on External Conversation and Product purpose binding separately. |
| Permanent Telegram ↔ NBOS chat bridge | `DO NOT BUILD` | One-time import only where needed; Telegram notifications remain a separate concern. |
| Old `NBOS-Messanger-App` basic schema/UI | `OPTIONAL REUSE` | Reuse visual components only if useful; do not constrain new domain model to its old schema. |

---

## 4. Task Discussion migration — mandatory safe sequence

### Target

Human Task discussion becomes a Messaging Core Conversation embedded in Task Card (`M-TASK-01`). Task Activity remains separate (`M-TASK-02`).

### Existing risk

The current/previously verified runtime has a real separate Task Discussion path with its own entries, attachments and provenance. This is not a cosmetic UI migration.

### Preserve at minimum

For every legacy human discussion entry preserve:

- task association;
- author / actor identity;
- created/edited timestamps and ordering;
- body/content;
- attachment/File Asset references;
- AI/system provenance where present;
- audit/activity references where they exist;
- reply/reference relationships where representable;
- stable source provenance so migrated data can be traced back during verification.

### Migration sequence

1. Add/confirm canonical Messaging Core models required for Task discussion.
2. Add a deterministic Task → Conversation mapping without deleting legacy discussion data.
3. Create Task Conversations only for Tasks that actually have discussion, unless a real new message lazily creates one. Do not bulk-create thousands of empty chats.
4. Backfill legacy discussion entries into canonical Messages using an idempotent migration.
5. Preserve a legacy-source key/reference to prevent duplicate backfill on rerun.
6. Backfill attachment/File Asset references and provenance.
7. Verify per-Task counts, chronological order, author identity and attachment coverage.
8. Run representative UI/API reads against the canonical store.
9. Cut new **writes** to Messaging Core only after backfill code is proven rerunnable.
10. Cut Task Card **reads** to Messaging Core.
11. If a temporary compatibility/shadow path is required during rollout, it must have an explicit removal date/gate and must not become permanent dual-write architecture.
12. Keep legacy Task Discussion tables/read code as `DELETE-LATER` until independent verification and final acceptance.
13. Remove legacy writes first; remove legacy storage only after final migration parity evidence and backup/rollback plan.

### Hard prohibitions

- no drop/recreate migration;
- no permanent second Task comments source of truth;
- no copying only visible text while losing files/provenance/audit;
- no eager empty Task Conversation creation for every Task;
- no migration that changes human Discussion into Activity Feed records.

**Why:** Task discussions may contain real execution decisions. Losing ordering, authorship or attachments is a business-data loss, even if message bodies appear to have migrated.

---

## 5. Product WhatsApp binding migration — 1:1 to flexible bindings

### Target

```text
Product + Purpose -> External Conversation -> Provider Mapping -> WhatsApp chat/group id
```

Initial purposes:

```text
WORK
FINANCE
```

Rules:

- one active `WORK` destination per Product;
- zero or one explicit `FINANCE` destination per Product;
- missing FINANCE resolves to WORK;
- one External Conversation may be bound to multiple Products;
- bindings do not grant employee access.

### Existing risk

The existing Product WhatsApp model was designed around a hard one-Product/one-group relationship and raw provider group identity. That structure cannot represent Website + SEO sharing a WORK group or one finance group serving five Products.

### Required migration sequence

1. **Additive schema first.** Add/confirm canonical Client Conversation, External Conversation/provider mapping and Product purpose binding structures side-by-side with legacy fields/tables.
2. Do **not** remove current unique constraints/legacy fields before data is mapped and all current Products resolve successfully.
3. For every existing physical WhatsApp group, create or map exactly one canonical External Conversation/provider mapping using the existing provider/account/chat id.
4. For every existing Product ↔ group relationship, create a `WORK` binding to that mapped External Conversation.
5. Preserve current group creation/bind provenance, provider ids, account/session mapping, statuses, retry/outcome-unknown state, invitation history and settings where they exist.
6. Do **not** auto-create FINANCE bindings during migration. Existing clients default to `FINANCE -> WORK` unless a human explicitly configures another finance destination.
7. Introduce a single resolver such as `resolveClientDestination(productId, purpose)` and route new business sends through it.
8. Adapt Product settings and Deal Won to create/select `WORK` bindings instead of writing a raw Product-owned group id.
9. Allow an existing allowed External Conversation to be selected for another Product; do not clone the physical WhatsApp group.
10. Enforce target determinism at the **binding** layer: at most one active `(productId, purpose)` for WORK/FINANCE. Do **not** make `externalConversationId` globally unique because sharing is intentional.
11. Verify every legacy Product resolves its `WORK` destination to the same physical WhatsApp chat it used before migration.
12. Verify the shared-group cases before cutover: two Products → one WORK conversation; several Products → one FINANCE conversation.
13. Switch all Product/Finance/Subscription/Client Service send paths to the resolver.
14. Add telemetry/logging for any attempted raw legacy Product `groupChatId` send after cutover; treat it as migration debt/error.
15. Only after parity and dependent slices are verified may old one-to-one constraints/fields/tables move to destructive cleanup.

### Rollback rule

Before destructive cleanup, rollback must be possible by leaving the legacy binding intact while the new structures are additive. After cutover, rollback should switch application resolution/read paths, not recreate deleted provider relationships.

### Idempotency rule

Old Product-only operation identity is insufficient for flexible purposes. New create/bind operations must identify Product + purpose + intended target/operation. `OUTCOME_UNKNOWN` must never trigger blind creation of another physical WhatsApp group.

**Why:** physical WhatsApp groups are external resources. Duplicating or losing their identity during schema migration is harder to repair than an ordinary relational row.

---

## 6. Deal Won migration rule

Existing useful semantics are retained:

- explicit create or bind/select;
- provider/Gateway failure does not roll back successful Deal/Product creation once the communication attempt is recorded according to current business flow;
- pending/failure/outcome-unknown remains visible and retryable;
- Extension does not automatically create a second physical group.

Change only the ownership target:

```text
OLD concept: Product owns one WhatsApp group
NEW concept: Deal Won resolves Product WORK communication binding
```

Separate FINANCE configuration stays optional and can be done later in Product Client Communication settings.

Do not rewrite proven Deal Won business behavior merely because the storage model changes.

---

## 7. Finance / automatic reminder migration rule

All automatic payment-related client messages are `FINANCE` purpose:

- invoice/payment reminders;
- subscriptions;
- hosting/domain costs;
- maintenance/client-service payments;
- other approved money/payment reminders.

Target call semantics:

```text
Finance business rule decides WHAT/WHEN to send
  -> resolveClientDestination(productId, FINANCE)
  -> explicit FINANCE conversation if configured
  -> otherwise WORK conversation
  -> Messaging Core durable outbound
  -> provider adapter/Gateway
```

The current end-to-end reminder-to-Messenger/WhatsApp runtime is `VERIFY/MISSING`; implementation must not assume an already-correct raw send path.

After cutover, Finance/Subscriptions/Client Services must not query or store a raw Product WhatsApp group id for sending.

Manual employee conversation in a FINANCE chat is ordinary Client Messenger behavior and is distinct from automatic system reminder generation.

Client replies remain in the same physical conversation that received the reminder.

---

## 8. FINANCE participant/access defaults

For a dedicated FINANCE client conversation, the default Neetrino participant/access template is:

- Owner;
- CEO;
- Finance Director;
- relevant Seller;
- relevant Product PM.

Seller/PM are context-specific, not global hard-coded people. Developers and other Product employees are not automatically granted access.

These are defaults/recommendations, not a replacement for effective Messenger permissions. Manual membership/access can be adjusted.

All participants still require appropriate Client Messenger permissions; external READ and SEND remain separate.

**Why:** finance-only groups exist specifically because some clients do not want operational employees participating in financial discussion.

---

## 9. WhatsApp Gateway reconciliation

The existing `neetrino/whatsapp-gateway` is retained.

Verified reusable capabilities include account-scoped v1 send/status APIs and MESSENGER-mode chat/history plus normalized Project inbound webhooks. Gateway remains transport-only.

NBOS target integration should prefer the account-scoped/idempotent API where appropriate and consume authenticated inbound events into Messaging Core.

Gateway must **not** become owner of:

- Product/Project meaning;
- WORK/FINANCE bindings;
- NBOS employee permissions;
- Support/Finance routing;
- AI policy;
- canonical NBOS message history.

Any Gateway integration documentation that instructs NBOS to “store returned group id directly on Product” is legacy wording. Target is:

```text
Gateway group/chat id
  -> ExternalConversationMapping
  -> Client Conversation
  -> ProductCommunicationBinding(s)
```

Changing this documentation/adapter contract must not require rebuilding Gateway sessions or re-creating existing physical groups.

---

## 10. Internal vs Client surface migration

The shared Messaging Core may reuse technical primitives, but target UI/runtime must expose two separate product surfaces.

Migration rule:

- do not delete reusable internal channel/DM primitives before mapping equivalent behavior;
- do not extend the old casual `Internal | External` screen into the final Client experience;
- build Client Messenger as a separate route/entry surface with locked composer and READ/SEND checks;
- ensure a Client conversation cannot be rendered/sent from an Internal composer path;
- ensure Collections are surface-scoped at both API and database validation layers.

No compatibility mode may allow one mixed daily list as the final state.

---

## 11. Product + Connected Work Space reconciliation

If current Product and Connected Work Space code can resolve different chat identities, migration must converge them to one canonical internal Conversation.

Safe sequence:

1. identify existing Product/Workspace conversations and links;
2. detect duplicates before modifying links;
3. when only one side has real discussion, make it canonical and link both entities;
4. when both sides have real history, do not silently discard either; migrate/merge with preserved timestamps/source provenance or require explicit/manual mapping if ambiguity is material;
5. update both Product `Chat` and Work Space `Discussion` entry points to resolve the same conversation id;
6. verify no new duplicate conversation can be auto-created by race/independent ensure logic.

---

## 12. Support reconciliation

Keep Support Ticket business state. Change communication boundary:

- external client messages stay canonical in Client Messenger;
- Ticket links/references relevant external messages;
- Ticket internal discussion may use internal messaging behavior;
- remove/disable any final product path where the same Ticket composer can accidentally switch between Public and Internal send modes.

Do not delete historical Support data just because the future composer model changes.

---

## 13. Cleanup prohibited until these gates pass

No legacy data/table/field with production relevance may be deleted until:

- migration/backfill is idempotent or safely resumable;
- row/message counts and key business mappings are verified;
- representative history renders correctly;
- permissions and negative tests pass;
- all new writes use canonical target paths;
- searches/static checks show no uncontrolled legacy writes/sends;
- rollback/backup procedure is recorded;
- independent reviewer marks the responsible slice `VERIFIED`;
- final acceptance has not identified unresolved dependency on the legacy path.

---

## 14. Explicitly prohibited shortcuts

Implementation/review must reject:

- drop-first migration;
- deleting legacy Task Discussion before proven backfill;
- permanent dual Task discussion stores;
- direct Finance/Product sending to raw `groupChatId` after cutover;
- keeping a global uniqueness that prevents an External Conversation from serving multiple Products;
- binding a Product and thereby silently granting Client conversation access;
- recreating provider WhatsApp groups merely to satisfy a new database model;
- mixed Internal/Client product surface as a shortcut;
- public/internal toggle in Support Ticket composer;
- copying canonical source messages into independent stores instead of references;
- permanent Telegram chat bridge;
- treating historical implementation/status documents as proof of current runtime.

---

## 15. Handoff to implementation planning

`11-Messenger-Rebuild-Implementation-Checklist.md` is executable only together with this reconciliation document.

Every slice that touches existing data must explicitly state:

```text
Existing runtime affected
Migration/backfill
Compatibility window
Verification evidence
Rollback behavior
Delete-later items
```

If implementation discovers a materially different runtime fact, the slice becomes `BLOCKED` until this reconciliation document is amended. The implementer must not silently redesign the target canon around unexpected legacy code.
