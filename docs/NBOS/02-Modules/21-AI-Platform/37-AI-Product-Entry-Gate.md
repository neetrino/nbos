# AI Platform — Product Entry Gate

## Status

**PROPOSED — NOT STARTED**

This is a short mandatory gate between the completed Phase 1 remediation work
and the next functional AI phase. It does not reopen Phase 1, Tasks C9, AI C25,
or Drive K209/C24.

The gate exists because the current-state audit confirmed three separate
residuals:

1. production received the sibling-code and artifact-operation migrations, but
   the rollout record does not evidence the required old-writer pause or a
   post-cutover reconciliation;
2. Internal AI Drive authorization checks agent identity/state but not Task
   scope or the effective permissions of the on-behalf-of Employee;
3. the common task-artifact API still has a permissive auth fallback, while
   Human upload cancellation and artifact-operation state can diverge.

Do not start Messenger AI, employee AI chat, Project Knowledge, Customer
Memory, production RAG, or another functional AI entrypoint until this gate is
closed.

## Working model

- One Cursor executor chat per workstream.
- Do not run workstreams in parallel: they share one repository/worktree.
- Every executor starts from actual Git/runtime state and treats this document
  and prior handoffs as claims until verified.
- Every code-changing workstream requires a fresh independent verifier chat.
- The technical lead reviews each result before issuing the next prompt.
- Do not commit, push, deploy, apply production migrations, delete data, or
  repair production rows without explicit developer instruction.
- Keep product canon, owning-module behavior, and AI orchestration concerns
  separate.

## Workstream 1 — Production post-cutover reconciliation

### Purpose

Determine whether the production cutover left counters behind business tables
or left Drive artifact rows in an inconsistent state. This workstream is
read-only. It does not repair anything.

### Required checks

1. Confirm branch, HEAD, worktree, current production release SHA, and the exact
   production database/environment being inspected. Do not confuse local/dev
   Neon with production.
2. Inspect `_prisma_migrations` for:
   - `20260823000000_entity_code_counters`;
   - `20260823120000_seed_sibling_entity_code_counters`;
   - `20260823140000_file_artifact_operations`.
3. For every year and every production code series, compare the numeric maximum
   suffix in the business table with `entity_code_counters.next_value`:
   - `TASK` / `tasks` / `T-`;
   - `INVOICE` / `invoices` / `INV-`;
   - `SUPPORT_TICKET` / `support_tickets` / `TKT-`;
   - `DEAL` / `deals` / `D-`;
   - `LEAD` / `leads` / `L-`;
   - `ORDER` / `orders` / `ORD-`;
   - `SUBSCRIPTION` / `subscriptions` / `SUB-`;
   - `PROJECT` / `projects` / `P-`.
4. Report missing counter rows, `next_value < numeric MAX`, malformed canonical
   candidates, duplicate codes, and suffixes that exceed the PostgreSQL
   `INTEGER` contract. Do not advance counters.
5. Confirm the artifact-operation table and partial unique idempotency index
   exist. Inventory operations by source/status and identify aged non-terminal
   rows, duplicate/conflicting identities, missing completed FileAsset/FileLink
   references, and FileAssets created during the mixed-version window without
   a matching operation where database evidence can establish that fact.
6. Inspect production migration/deployment evidence to bound the mixed-version
   window. Do not infer that a successful migration proves a write pause.
7. Record limitations honestly when R2 or deployment evidence is unavailable.

### Output

Create:

`38-AI-Product-Entry-Gate-Production-Reconciliation.md`

Verdict must be one of:

- `PASS` — no data-integrity mismatch found;
- `PASS WITH DEBTS` — no mismatch, but bounded evidence is unavailable;
- `FAIL — REMEDIATION REQUIRED` — a concrete mismatch exists.

On `FAIL`, stop after a proposed repair/verification plan. Do not execute the
repair.

## Workstream 2 — Fail-closed Internal AI Drive authorization

Start only after the technical lead reviews Workstream 1.

### Required outcome

- Remove the production `allowArtifactAuth()` fallback from
  `createAndLinkTaskArtifact`; production callers must provide an explicit
  authorization port.
- Keep test-only bypasses explicit and impossible to import accidentally into a
  production caller.
- Internal Agent authorization must evaluate agent state/assignment, the stored
  Task/resource target, and effective on-behalf-of Employee Drive/Task access.
- Re-check authorization at prepare and deferred/resumed finalize.
- Revocation, cross-Task idempotency reuse, absent on-behalf-of identity, and
  unauthorized Employee scope must fail closed.
- Reuse existing Tasks, Drive, Platform Access, and Internal Agent contracts.
  Do not build an AI-only RBAC system or query Prisma from the AI gateway.
- Preserve External Agent, Human, and SYSTEM behavior.

### Evidence

Add negative and regression tests, including cross-resource isolation and
revocation between prepare/finalize. Run targeted Drive + AI gateway tests,
typecheck, lint, and the appropriate production build.

Create executor handoff:

`39-AI-Product-Entry-Gate-Internal-Authorization-Handoff.md`

Then use a new independent verifier chat. Do not continue to Workstream 3 until
the verdict is `PASS` or `PASS WITH DEBTS` with no authorization debt.

## Workstream 3 — Drive compatibility lifecycle consistency

Start only after Workstream 2 passes independent verification.

### Required outcome

- Reconcile `failUploadSession` / expire / cancel semantics with the matching
  `FileArtifactOperation` without creating a second lifecycle.
- Make retry/finalize behavior deterministic after a Human client abort.
- Integrate conservative owned-orphan handling into an existing Drive-owned
  operator/cleanup path, or document why no safe production wiring is possible.
- Decide scheduled recovery separately from authorization-sensitive finalize;
  do not add a queue or cron merely to close a checklist item.
- Preserve the `FileUploadSession` expand-and-contract compatibility path until
  old pending sessions are proven expired or migrated.

### Evidence

Test cancel/finalize races, exact retry, object-present abort, legacy session
fallback, conservative deletion, and authorization revalidation. Create:

`40-AI-Product-Entry-Gate-Drive-Consistency-Handoff.md`

Then use a new independent verifier chat.

## Final gate close

After all three workstreams:

1. run a focused cross-regression for Tasks, Drive, Human upload, Internal AI
   adapter, External Agent REST/MCP, code allocation, and cleanup;
2. confirm active docs reflect code-complete, dev-migrated, production-migrated,
   and remaining operations debt separately;
3. create `41-AI-Product-Entry-Gate-Final-Acceptance.md`;
4. choose the next functional AI milestone. The preferred candidate remains
   Project Knowledge + Customer Memory / Context Assembler unless current
   product priorities select Messenger AI or another approved capability.

The gate is `READY` only when production reconciliation has no unresolved
integrity mismatch and the Internal AI path is fail-closed. A scheduled recovery
worker is not automatically required.
