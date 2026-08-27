# Messenger Rebuild — Execution Strategy

> Status: **mandatory implementation process**.
>
> This document defines how `11-Messenger-Rebuild-Implementation-Checklist.md` is executed. It is intentionally similar to the proven AI Phase workflow: small bounded slices, fresh implementation context, independent review, and no dependency advancement before verification.

## 1. Why Messenger must be implemented by slices

Messenger touches:

- shared Messaging Core;
- Internal UI;
- Client UI and external-send security;
- Tasks;
- Product/Work Space/Deal context;
- WhatsApp transport;
- Product communication bindings;
- Deal Won;
- Finance reminders;
- Support;
- RBAC;
- realtime/search/notifications;
- migration of already-used data.

A single long implementation chat would accumulate stale assumptions and make it difficult to distinguish product decisions from implementation shortcuts.

Therefore work is executed as:

```text
Slice N
  -> Implementer Chat
  -> implementation evidence
  -> Independent Review Chat
       -> VERIFIED
       or
       -> CHANGES_REQUIRED
  -> only then dependent Slice N+1
```

**Why:** the reviewer must independently challenge migration safety, negative paths and canon compliance instead of inheriting the implementer's assumptions.

---

## 2. Allowed statuses

Every slice uses exactly one current status:

- `PLANNED`
- `IMPLEMENTING`
- `READY_FOR_REVIEW`
- `CHANGES_REQUIRED`
- `VERIFIED`
- `BLOCKED`

### Rules

`PLANNED -> IMPLEMENTING`

The implementer has read the canonical docs and begun the slice.

`IMPLEMENTING -> READY_FOR_REVIEW`

Only when implementation + tests + migration evidence + documentation for that slice are complete.

`READY_FOR_REVIEW -> VERIFIED`

Only an independent reviewer may set this after first-hand verification.

`READY_FOR_REVIEW -> CHANGES_REQUIRED`

Reviewer found defects/gaps. Implementer fixes them; same slice returns to review.

`ANY -> BLOCKED`

Use when runtime facts materially conflict with the implementation plan/canon, a dependency is missing, or safe migration cannot be proven.

A blocked slice is not solved by silently changing product architecture.

---

## 3. Implementer Chat contract

Each slice should normally start in a fresh implementation chat/context.

The implementer must read, at minimum:

1. relevant Canon documents;
2. referenced Decision ids in `08-Messenger-Decision-Register.md`;
3. `10-Messenger-Runtime-Reconciliation.md`;
4. the exact slice in `11-Messenger-Rebuild-Implementation-Checklist.md`;
5. previous dependency slice result/evidence only as context, not proof.

The implementer must inspect current code before editing it.

### Implementer may decide

- exact class/file/function names;
- exact Prisma model names where canon allows equivalents;
- local refactoring needed to satisfy the contract;
- test implementation details;
- safe migration mechanics consistent with the required sequence.

### Implementer may not decide silently

- merging Internal and Client surfaces;
- changing WORK/FINANCE binding semantics;
- reintroducing one Product → one physical group ownership;
- changing Task Discussion back to a separate permanent store;
- replacing references with copied messages;
- weakening Client READ/SEND or locked-composer safety;
- introducing public/internal Support composer;
- hard-coding a permanent support/finance person;
- building a permanent Telegram chat bridge;
- destructive migration that violates reconciliation rules.

If such a change seems necessary, mark the slice `BLOCKED` and propose a Canon amendment with rationale before coding it.

---

## 4. Independent Reviewer Chat contract

Reviewer must be a fresh chat/context where practical and must not be the same reasoning session that implemented the slice.

The reviewer treats implementation handoff statements as **claims**, not evidence.

Reviewer independently:

- reads relevant Canon/Decision ids;
- inspects the actual diff/code/schema;
- inspects migrations/backfills;
- runs or reviews test results first-hand;
- executes meaningful negative/adversarial checks;
- verifies old data paths where migration is involved;
- searches for bypasses/legacy writes;
- checks documentation/runtime agreement;
- records concrete evidence and remaining debt.

Reviewer must not approve because “the tests pass” if the tests do not cover the canonical negative paths.

---

## 5. Slice evidence file strategy

Do not create separate long implementer-handoff and reviewer-handoff documents for every chat.

For each slice, use one evidence file, for example:

```text
20-Slice-00-Baseline.md
21-Slice-01-Messaging-Core.md
22-Slice-02-Permissions-Boundary.md
...
31-Slice-11-Hardening.md
```

The file is created when the slice begins and contains both implementation and review evidence.

Template:

```markdown
# Slice N — Name

Status: IMPLEMENTING

## Canonical decisions
- M-...

## Scope
...

## Existing runtime / migration notes
...

## Implementation requirements
...

## Data migration / rollback
...

## Tests / negative tests
...

## Implementation result
- files changed
- migration result
- commands/tests executed
- known limitations

## Independent review
- reviewer scope
- code/schema evidence
- tests executed/rechecked
- adversarial checks
- findings

## Remaining debt
...

## Final status
VERIFIED / CHANGES_REQUIRED / BLOCKED
```

Git history provides detailed edit chronology; the slice file provides the concise auditable result.

---

## 6. Dependency order

Default dependency chain:

```text
0 Baseline / reconciliation
  -> 1 Messaging Core
      -> 2 Permissions / surface boundary
          -> 3 Internal base
          -> 4 Entity conversations
               -> 5 Task migration
               -> 6 Message references/actions
          -> 7 Client surface
               -> 8 WhatsApp Gateway integration
                    -> 9 Flexible Product bindings
                         -> 10 Finance / Support / routing
                              -> 11 Hardening / cleanup readiness
                                   -> Final Acceptance
```

Some work can proceed in parallel only when it does not depend on an unverified contract. For example, visual Internal UI work may be parallelized with provider adapter work after shared Core/permission contracts are `VERIFIED`.

Do not parallelize two migrations that write competing ownership models for the same records.

---

## 7. Migration execution discipline

For data-bearing changes, use this sequence unless a slice documents a safer equivalent:

```text
1. inventory
2. additive schema
3. idempotent mapping/backfill
4. parity verification
5. switch new writes
6. switch reads
7. observation / compatibility window
8. disable legacy writes
9. independent verification
10. destructive cleanup last
```

### Task Discussion special rule

Legacy human discussion storage stays available until:

- backfill parity is proven;
- Task Card reads/writes canonical Messaging Core;
- attachment/provenance samples pass;
- no legacy writes remain;
- reviewer marks migration slice VERIFIED.

### WhatsApp binding special rule

Do not remove the existing Product/group relationship until:

- every existing Product has a valid WORK binding;
- provider chat identity matches previous behavior;
- new resolver is used by all dependent sends;
- shared-group scenarios pass;
- Deal Won/Product Settings work on the new binding model;
- rollback is recorded.

External WhatsApp groups must never be recreated merely to make a schema migration easier.

---

## 8. Branch and commit discipline

Recommended:

- one implementation branch or controlled rebuild branch;
- commits scoped to the current slice;
- migrations and code that depend on them reviewed together;
- avoid unrelated refactors;
- reviewer can identify exactly which commits belong to the slice.

If a slice becomes too large to review reliably, split it **before** implementation or mark it `BLOCKED` and amend the checklist. Do not hide a second architecture project inside one slice.

---

## 9. Documentation discipline

Canon documents describe target product behavior and Why.

Implementation evidence documents describe what runtime actually does.

Rules:

- do not mark Canon “implemented” merely because a slice started;
- status docs must never become product truth;
- implementation discoveries may update reconciliation/status documents;
- product behavior changes require explicit Decision Register amendment;
- if a cross-module doc still contradicts Messenger canon, update it or clearly mark Messenger canon precedence before the relevant slice is VERIFIED.

---

## 10. Reviewer minimum security checks

Every relevant review must consider:

- unauthorized read;
- unauthorized send;
- cross-surface confusion;
- shared-Collection ACL bypass;
- Product binding granting unintended access;
- duplicate provider send/idempotency;
- webhook replay/duplication;
- stale/legacy write bypass;
- message reference source permission;
- migration duplicate/loss;
- race creating duplicate Product/Workspace conversations;
- race creating multiple active WORK bindings.

Client-facing slices require explicit adversarial review; happy-path screenshots are insufficient.

---

## 11. Stop conditions

Stop implementation and mark `BLOCKED` when:

- production/runtime data shape differs materially from the migration assumption;
- backfill cannot preserve authorship/files/order/provenance;
- an existing unique constraint cannot be safely changed without a staged migration;
- provider outcome is ambiguous and a retry might create/send duplicates;
- a permission rule is undefined;
- a proposed shortcut would merge Internal/Client safety boundaries;
- implementation requires changing a confirmed product decision.

Resolve the question in documentation first, then continue.

---

## 12. Completion and cleanup

After Slice 11 is `VERIFIED`, run `90-Messenger-Final-Acceptance.md` in a fresh review context.

Final acceptance may still reject the rebuild even if every slice was individually verified, because cross-slice integration can reveal problems that local reviews missed.

Destructive legacy cleanup should preferably occur only when:

- final acceptance confirms no runtime dependency remains; or
- cleanup itself is a separately reviewed final change with rollback/backup evidence.

`VERIFIED` means the slice contract was proven. It does not mean all future/optional Messenger features are implemented.
