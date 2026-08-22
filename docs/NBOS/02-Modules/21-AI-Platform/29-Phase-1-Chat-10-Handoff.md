# Phase 1 Chat 10 Handoff — Approval and Customer-Facing Safety Foundation

> Next chat must verify this evidence against the repository. Do not trust the summary blindly.
> This chat did **not** commit.

## Milestone

Chat 10 of `16-Phase-1-Execution-Strategy.md`. Branch `sipan`.

Completed: Approval Request persistence/lifecycle (AF 497–517) and customer-facing safety
contracts (AG 518–531). `ALLOW / DENY / REQUIRE_APPROVAL` remains the single policy contract.
Approvals are one-time, digest-bound, employee-decided, and revalidated immediately before
consume. Draft and send are separate capabilities. Production Messenger auto-reply was not built.

This chat does **not** start Chat 11. Phase 1 is **not** complete. Usage/cost/evaluation (AH/AI)
remain Chat 11.

Chat 9 independent verdict was **PASS WITH DEBTS**. Chat 10 proceeded from that.

## Checklist

### AF 497–517 — `[x]`

| Item    | Status | Evidence                                                                                             |
| ------- | ------ | ---------------------------------------------------------------------------------------------------- |
| 497–498 | `[x]`  | Unchanged: capability `risk` + `AI_POLICY_OUTCOMES`. Send catalog key is HIGH + `approval: REQUIRED` |
| 499–502 | `[x]`  | `AiApprovalRequest` stores actor, capability, resource, SHA-256 digest, secret-stripped summary      |
| 503–508 | `[x]`  | PENDING / APPROVED / REJECTED / EXPIRED / CANCELLED / CONSUMED                                       |
| 509–511 | `[x]`  | Canonical JSON digest; material change → `PAYLOAD_CHANGED`; CONSUMED is one-time                     |
| 512–513 | `[x]`  | Employee JWT + `COMPANY:EDIT`; machine approver → `AI_SELF_APPROVAL`                                 |
| 514     | `[x]`  | TTL by risk (`AI_APPROVAL_TTL_MS`); PENDING and unused APPROVED expire                               |
| 515     | `[x]`  | `assertApprovedCommit` + `consumeForCommit` recheck actor, capability, digest, ALLOW, domain state   |
| 516     | `[x]`  | `APPROVAL_REQUESTED` / `DECIDED` / `CANCELLED` / `EXPIRED` / `CONSUMED`; D 91 closed                 |
| 517     | `[x]`  | Shared lifecycle/payload/revalidation tests + service + HTTP tests                                   |

### AG 518–531 — `[x]`

| Item    | Status | Evidence                                                                                              |
| ------- | ------ | ----------------------------------------------------------------------------------------------------- |
| 518–520 | `[x]`  | Channel + `conversationId` + `customerId` deny-by-default isolation                                   |
| 521–523 | `[x]`  | DRAFT_ONLY / APPROVAL_REQUIRED / AUTO_SEND_ALLOWED; empty auto-send allowlist still requires approval |
| 524     | `[x]`  | `messenger.reply_draft` vs `messenger.reply_send` (canon `messenger.reply.draft` / `.send`)           |
| 525     | `[x]`  | Escalation reasons + `action: escalate` always ALLOW as a handoff                                     |
| 526     | `[x]`  | `INTERNAL_ONLY` cannot be customer-disclosed                                                          |
| 527–528 | `[x]`  | Customer messages are `UNTRUSTED_CONTENT` and are not policy inputs                                   |
| 529     | `[x]`  | Approval create refuses secret-shaped payloads; context assembler still redacts recursively           |
| 530     | `[x]`  | No Messenger send handler on REST/MCP or Domain Action Gateway                                        |
| 531     | `[x]`  | Cross-customer, guessed conversation, prompt-injection, draft≠send negative tests                     |

No new `[!]` BUSINESS DECISION. C22 remains open at phase level because AH–AI are still Chat 11.

## Files / modules changed

New Prisma schema (additive):

| Area              | Path                                                  |
| ----------------- | ----------------------------------------------------- |
| Approval requests | `packages/database/prisma/schema/ai-approvals.prisma` |
| Employee relation | `packages/database/prisma/schema/employees.prisma`    |

New under `apps/api/src/modules/ai-platform/`:

| Area            | Path                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------- |
| Approval domain | `approvals/ai-approval-request.service.ts`, rules, mapper, lock, errors, audit-actor, types |
| Admin HTTP      | `admin/ai-admin-approvals.controller.ts`, `dto/decide-approval.dto.ts`                      |
| HTTP tests      | `admin/ai-admin.approvals.http.int.test.ts`                                                 |
| Isolation tests | `security/approval-customer-isolation.security.test.ts`                                     |

Shared (`packages/shared/src/ai/`):

| Area            | Path                                                                                            |
| --------------- | ----------------------------------------------------------------------------------------------- |
| Approval        | `approval-types.ts`, `approval-lifecycle.ts`, `approval-payload.ts`, `approval-revalidation.ts` |
| Customer-facing | `customer-facing-types.ts`, `customer-facing-policy.ts`, `customer-isolation.ts`                |
| Capabilities    | `capability-catalog.customer.ts`                                                                |

Web: `ApprovalQueuePanel` + `/ai-agents/approvals` now lists pending and can approve/reject.
`aiAdminApprovalsApi` is a separate client so `ai-admin.ts` is not grown further.

## Migrations

**One additive migration**, **not applied to production**, **not applied in this chat**.

- Directory: `packages/database/prisma/migrations/20260822210000_ai_approval_request_foundation/`
- Risk: **LOW** — new empty enum + table + indexes. No backfill, no existing-table rewrite.
- Chat 9 migration `20260822180000_ai_prompt_policy_context_foundation` is still pending on the
  configured host.
- `prisma validate` → schemas valid.
- `prisma generate` → client generated locally.
- `prisma migrate dev` was **not** run.
- Production Neon `ep-sweet-dew-ag7259wn` was **not** contacted.

`prisma migrate status` against `.env.local` host `ep-restless-tooth-agz3assx` (not production,
not the designated Chat 8/5/7 branch `ep-late-frost-ag5aixzw`): exit 1 from unchanged history
drift. Last common: `20260822010000_ai_provider_model_internal_agent`. Pending locally:
Chat 9 + Chat 10 migrations. Database has extra historical names not in this repo.

Chat 11 / the developer should apply both pending migrations to the designated non-production
Neon with `prisma migrate deploy` over `DIRECT_URL` after confirming the host. Do not use
`prisma migrate dev`.

## Tests run

```text
pnpm exec vitest run
  packages/shared/src/ai/approval-*.test.ts
  packages/shared/src/ai/customer-facing-policy.test.ts
  packages/shared/src/ai/customer-isolation.test.ts
  packages/shared/src/ai/capability-registry.test.ts
  packages/shared/src/ai/policy-evaluator.test.ts
  apps/api/.../approvals/ai-approval-request.service.test.ts
  apps/api/.../admin/ai-admin.approvals.http.int.test.ts
  apps/api/.../admin/ai-admin.prompt-policies.http.int.test.ts
  apps/api/.../admin/ai-admin.authorization.http.int.test.ts
  apps/api/.../security/approval-customer-isolation.security.test.ts
  apps/api/.../security/agent-surface.security.test.ts
  apps/api/.../gateway/agent-replay-authorization.test.ts
  apps/api/.../protocol/agent-operation.registry.test.ts
  apps/api/.../policy/agent-policy.assert.test.ts
→ 16 files / 131 tests passed

pnpm exec vitest run (internal-agents + grants + context-assembler)
→ 7 files passed / 1 skipped; 63 tests passed / 2 skipped

pnpm --filter @nbos/shared typecheck → exit 0
NODE_OPTIONS='--max-old-space-size=8192' pnpm --filter @nbos/api typecheck → exit 0
NODE_OPTIONS='--max-old-space-size=8192' pnpm --filter @nbos/web typecheck → exit 0
eslint on Chat 10 TS files → exit 0
prisma validate → valid
prisma generate → client generated
```

Not run: full `pnpm test`, `pnpm lint`, `pnpm typecheck` (turbo), browser walk, live AO/AP,
production migrate, `migrate deploy`.

## Remaining `[~]` / `[!]`

| Item                  | Status  | Note                                        |
| --------------------- | ------- | ------------------------------------------- |
| AH / AI / C7 / C19    | open    | Usage/evaluation entities — Chat 11         |
| J 186 / U store / C9  | `[~]`   | In-process rate-limit counters              |
| K 205 / W 368         | `[~]`   | Output schema validation                    |
| K 209 / C8            | `[~]`   | Idempotency complete() vs domain commit     |
| AL 626                | `[~]`   | Queued revalidation — no deferred execution |
| AJ 584/585            | `[~]`   | Model Policy candidate editor UI            |
| AM 638 / C14          | `[~]`   | Production audit-migration window           |
| AP 689–691, 697 / C20 | `[~]`   | No Anthropic live key                       |
| C22                   | PARTIAL | AD–AG closed; AH–AI remain Phase 1          |

Approval TTL values (`LOW/MEDIUM` 24h, `HIGH` 8h, `CRITICAL` 1h) are named Phase 1 defaults in
`AI_APPROVAL_TTL_MS`. Raising them lengthens the window a captured approval can still be consumed.

`InternalAiAgent.approvalPolicyId` remains an opaque assignment placeholder (AJ 591). Requests
live on `AiApprovalRequest`, not that column.

## Security decisions

- Authorization and approval stay separate. A grant can still yield `REQUIRE_APPROVAL`.
- Consume is the only path to `CONSUMED`. It requires a fresh ALLOW bound to the same actor and
  capability, matching digest, and `domainStateValid`.
- AI actors cannot approve. Admin decide routes are employee JWT + `COMPANY:EDIT`.
- Secret-shaped payload fields are refused at create; audit `changes` carry ids/digest/status only.
- Customer text is not a policy input and cannot add tools or skip approval.
- Draft grant does not imply send. DRAFT_ONLY denies send even when send is granted.
- AUTO_SEND_ALLOWED with an empty category allowlist still requires approval. No send runtime exists.
- External Agent REST/MCP remain Tasks/Drive only. Messenger keys are grantable contracts without a
  protocol handler.

## Exact entry point for Chat 11

Read `30` is not written yet. Chat 11 executor prompt is in `ai-modul-steps.md`.

Primary checklist: **AH 532–548** and **AI 549–557**, plus actionable Chat 8 debts that do not
require production-only credentials/windows.

Do **not** declare Phase 1 complete.

Before writing usage/evaluation tables, confirm the designated non-production Neon host and apply
`20260822180000_ai_prompt_policy_context_foundation` then
`20260822210000_ai_approval_request_foundation` there if still pending.

## Verification (Chat N)

- Model/date: Cursor Grok 4.6, 2026-08-22.
- Verdict: **PASS WITH DEBTS** for Chat 10 only. Phase 1 is not complete. Chat 11 was not started.
- Branch/HEAD: `sipan`, `f0d204c593387f9e6b56a7b06086acdd6ce4ae0b` (Chat 9 commit). Chat 10 remains **uncommitted** working tree; `git diff --check` exited 0. Tracking `origin/sipan`.

### Commands and actual results

```text
pnpm exec vitest run (AF/AG targeted + admin HTTP + surface/replay/policy)
  16 files / 131 tests passed, exit 0

pnpm exec vitest run (internal-agents + grants + context-assembler
  + mcp tools + agent-error.envelope)
  10 files passed / 1 skipped; 88 tests passed / 2 skipped, exit 0

pnpm --filter @nbos/shared typecheck → exit 0
NODE_OPTIONS='--max-old-space-size=8192' pnpm --filter @nbos/api typecheck → exit 0
NODE_OPTIONS='--max-old-space-size=8192' pnpm --filter @nbos/web typecheck → exit 0
eslint on Chat 10 TS/TSX files → exit 0
pnpm exec prisma validate --config prisma.config.ts → schemas valid, exit 0
pnpm exec prisma migrate status --config prisma.config.ts → exit 1 (expected drift)
  host ep-restless-tooth-agz3assx (not production ep-sweet-dew-ag7259wn)
  last common: 20260822010000_ai_provider_model_internal_agent
  pending locally: Chat 9 + Chat 10 migrations
git diff --check → exit 0
```

Production Neon was not contacted. `prisma migrate dev` / `migrate deploy` were not run.

### Discrepancies

- Handoff listed 7 files / 63 tests for the Internal Agent/grants/context slice. The same named files plus `context-assembler`, MCP tools and error-envelope regression ran as **10 passed / 1 skipped, 88/2**. The 16/131 targeted set matches.
- Executor prompt in `ai-modul-steps.md` recommends Claude Opus 5 High for Chat 10; the milestone table records Cursor Grok 4.6. This verifier chat also ran as Cursor Grok 4.6, not GPT-5.6 Sol High. The relay rule prefers a different model family; product evidence is still judged from the independently re-run commands and the uncommitted diff, not the executor handoff.
- Cleanup C17/C18 were marked OK in the same executor chat, before this independent review. The review agrees the AF/AG foundation exists; the debts below are not closed by that OK.
- `AgentGrantService` / `InternalAgentGrantService` accept any registered key, including `messenger.reply_*`. REST/MCP and the Domain Action Gateway still have no Messenger handler; dispatch is `CAPABILITY_UNKNOWN`. This is grant-surface widening, not a send runtime.
- Domain Action Gateway still fail-closes `REQUIRE_APPROVAL` (`AgentPolicyService.assertAllowed` throws) and never calls `createPending` / `consumeForCommit`. The admin queue has no production producer until a later runtime wires it. That matches “no Messenger auto-send” and is not an [x] overclaim for persistence/lifecycle contracts.
- `assertApprovedCommit` rechecks actor, capability, digest, a caller-supplied ALLOW decision and `domainStateValid`. It does not compare stored `resourceType`/`resourceId` or `matchedScope` to a current target. Resource identity is bound only if the caller puts it in the digested payload.

### Defects

None that require returning this milestone to the executor. No FAIL list.

Confirmed non-issues in this scope:

- Approval writes go to `AiApprovalRequest` through `AiApprovalRequestService`; audit goes through `AiPlatformAuditService` → `AuditService`. No Tasks/Drive/grant Prisma writes in the new service.
- Admin decide routes are employee JWT + `COMPANY:EDIT`; External Agent token → 401.
- Secret-shaped payloads are refused at create; audit `changes` carry ids/digest/status.
- Customer text is not a policy input. Draft and send are distinct registry keys. Empty AUTO_SEND allowlist still requires approval. No Messenger send handler on REST/MCP/gateway.
- Migration is additive (new enum + empty table + transactional indexes + FK). Backward compatible with undeployed Chat 9/10 schema.

### Remaining debts

- Apply Chat 9 then Chat 10 migrations to the designated non-production Neon with `prisma migrate deploy` over `DIRECT_URL` after confirming the host. Do not use `prisma migrate dev`.
- Restrict External Agent grants to protocol/Tasks-Drive keys, or add a negative test that `messenger.reply_*` cannot be granted to an External Agent.
- When a commit path is wired: call `consumeForCommit` (do not treat `approvalGranted: true` as sufficient); bind current resource/scope to the stored approval row.
- AH/AI, Chat 8 environment debts, and Chat 9 migration-host debt remain. `InternalAiAgent.approvalPolicyId` stays an opaque placeholder (AJ 591).
- Approval TTL values are named Phase 1 defaults; raising them lengthens the consume window.

### Not verified and why

- Full root `pnpm test` / `pnpm lint` / turbo `pnpm typecheck` / production builds — targeted package checks were sufficient for this uncommitted slice.
- Browser walk of `/ai-agents/approvals` — no E2E in the current stack for this panel.
- Live AO/AP External Agent/provider acceptance — unchanged Chat 8 evidence; Chat 10 did not touch those runtimes.
- Designated Neon `ep-late-frost-ag5aixzw` and production `ep-sweet-dew-ag7259wn` — not contacted; status was read from the configured non-designated host only.
