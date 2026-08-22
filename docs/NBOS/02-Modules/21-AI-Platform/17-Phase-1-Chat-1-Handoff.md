# Phase 1 Chat 1 Handoff — Foundation and Audit

> Next chat must verify this evidence against the repository. Do not trust the summary blindly.

## Milestone

Chat 1 of `16-Phase-1-Execution-Strategy.md`.

Completed: canon/runtime reconciliation, `ActorType` / `ActorContext`, backward-compatible actor-aware Audit, human audit regression.

Do not start External Agent REST/MCP until Chat 2 identity/policy is in place.

## Checklist

- A 1–35 `[x]`
- B 36–38, 40–55 `[x]`; B 39 `[~]` (Tasks update allowlist is Chat 3)
- C 56–70 `[x]`
- D 71–84, 92–95 `[x]`; D 85–91 `[~]` (write contract exists; emitters wait for entities)

## Files / modules changed

| Area                 | Path                                                                    |
| -------------------- | ----------------------------------------------------------------------- |
| Actor contract       | `packages/shared/src/actor/*`                                           |
| Shared export        | `packages/shared/src/index.ts`                                          |
| Audit schema         | `packages/database/prisma/schema/audit.prisma`                          |
| Migration            | `packages/database/prisma/migrations/20260821150000_audit_actor_aware/` |
| Audit write/read     | `apps/api/src/modules/audit/*`                                          |
| Payroll trail compat | `apps/api/src/modules/payroll-runs/payroll-run-audit-trail.ts`          |
| Web audit types      | `apps/web/src/lib/api/audit.ts`                                         |
| Human audit UI       | checklist template + delivery history panels                            |

## Migration

- Risk: **MEDIUM**, expand-and-contract, no deletes.
- Adds nullable actor columns; makes `user_id` nullable; backfills `actor_type = USER`, `actor_id = user_id`.
- Not applied to production from this chat.
- Local/non-prod: `pnpm --filter @nbos/database migrate:dev` or `migrate:deploy` with `DIRECT_URL`.
- Rollback: forward-fix only. Do not drop `user_id`. New columns may stay unused.

## Tests run

```text
pnpm exec vitest run
  packages/shared/src/actor
  apps/api/src/modules/audit
  apps/api/src/modules/payroll-runs/payroll-run-audit-trail.test.ts
  apps/web/src/lib/api/audit-actor-label.test.ts
→ 6 files, 34 tests, passed

pnpm --filter @nbos/shared typecheck  → passed
pnpm --filter @nbos/database typecheck → passed
pnpm --filter api typecheck            → passed
pnpm --filter web typecheck            → passed
```

Not run: full monorepo test suite, production migrate, API/worker boot.

## Architecture decisions

1. `ActorContext` lives in `@nbos/shared`, not in API-only types, so workers can reuse it later.
2. Machine actors never write `AuditLog.userId`. Employees still do.
3. Legacy `AuditService.log({ userId })` is preserved and infers `USER`.
4. Audit display keeps `firstName` / `lastName` for existing human UI.
5. Machine display uses type labels until Chat 2/5 wire name lookups (`AuditActorLookups`).
6. Cleanup **E5 is STALE**: MCP is a Phase 1 deliverable (Chat 4).
7. Provider keys reuse existing Credentials AES-GCM (`CREDENTIALS_ENCRYPTION_KEY`) in Chat 5. Do not invent a second crypto stack.
8. Do not reuse Meta/Gmail/WhatsApp connections as AI identities.

## Canon / runtime conflicts

| ID                                  | Classification | Resolution                                                                                                                                                                                         |
| ----------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1 Audit `userId` required          | OK             | Chat 1 migration + service                                                                                                                                                                         |
| C2 Employee-only display            | PARTIAL        | Resolver + fallback labels; wire names in Chat 2/5                                                                                                                                                 |
| C3 `ResourceAccessGrant.employeeId` | PARTIAL        | Do not insert AI into employee grants. Chat 2 adds agent grants                                                                                                                                    |
| C4–C9 agent/policy/auth/idempotency | MISSING        | Chat 2–4                                                                                                                                                                                           |
| D1 Task statuses                    | OK             | Runtime = `OPEN / IN_PROGRESS / REVIEW / ON_HOLD / COMPLETED`. Some Tasks docs still say `DONE` — STALE wording                                                                                    |
| D2 Extension Work Space             | PARTIAL        | Runtime lists exclude `EXTENSION_DELIVERY`; `extensionId` resolves to parent Product WS. Agent scope must use resolved Product WS                                                                  |
| D3 Task discussion                  | MISSING        | UI is local React state (`TaskSheetChatPanel`). `Task.chatId` unused. Chat 3 must persist `tasks.comment` / `tasks.read_discussion` in Tasks, not fake Employee authorship, not wait for Messenger |
| D4 Review / complete                | PARTIAL        | `submitForReview` → `REVIEW`. `complete` blocked by `buildTaskCompletionBlockers`. No force-complete. Do not expose `complete` / `delete` to agents                                                |
| E5 MCP optional                     | STALE          | REST + MCP are both Phase 1                                                                                                                                                                        |
| B1 AI as Automation Layer           | STALE          | Docs-only; Chat 8 architecture wording                                                                                                                                                             |
| WhatsApp audit `userId`             | PARTIAL        | Some historical rows use product UUID as `userId`. Backfill keeps them as `USER`; display stays `actor: null` if no Employee. Do not rewrite meaning in Chat 1                                     |
| Start Task                          | OK             | `TasksService.start` → `IN_PROGRESS` unless `COMPLETED`                                                                                                                                            |
| Submit Review                       | OK             | `TasksService.submitForReview` → `REVIEW` unless `COMPLETED`                                                                                                                                       |
| Drive artifacts                     | OK             | `FileLink` + `TASK_ATTACHMENT`. Block `SECRET_ADJACENT` for agents in Chat 3                                                                                                                       |
| Secrets                             | OK             | `apps/api/src/common/utils/crypto.ts` AES-256-GCM v2                                                                                                                                               |
| BullMQ actor                        | MISSING        | Workers pass employee `actorId` string only. Chat 7 / later execution work must propagate `ActorContext`                                                                                           |
| Task create RBAC                    | PARTIAL        | `POST /api/tasks` has no `@RequirePermission` today. Do not copy that hole to the agent API                                                                                                        |

No Chat 1 `[!]` BUSINESS DECISION. Chat 3 persistence of task discussion is a senior technical decision: add a Tasks-owned discussion record, do not invent Messenger runtime.

## Phase 1 touched-module map

| Layer     | Reuse                                                                              | Add later                                                                     |
| --------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Identity  | Employee JWT + RBAC unchanged                                                      | Chat 2: External Agent + hashed credentials + machine guard                   |
| Audit     | This chat                                                                          | Wire agent/internal display names when entities exist                         |
| Policy    | Tasks/Drive domain services                                                        | Chat 2: capability registry + evaluator                                       |
| Tasks     | `create`, `start`, `submitForReview`, allowlisted `update`                         | Chat 3: gateway + projections + discussion persist. No delete/force-complete  |
| Drive     | `FileLink`, `getAssetViewUrl`                                                      | Chat 3: agent-safe artifact projection                                        |
| Workers   | BullMQ                                                                             | Later: full ActorContext on jobs                                              |
| Admin     | `/settings` hub                                                                    | Chat 6: Settings → AI & Agents                                                |
| Providers | Credentials crypto                                                                 | Chat 5: OpenAI/Anthropic + catalog + model policy + Internal Agent foundation |
| Protocols | API envelope `{ data, timestamp }` / error `{ statusCode, message, error, code? }` | Chat 4: `/api/v1/agent` + MCP                                                 |

## Known risks

- Migration not applied to any live database from this chat.
- Historical non-employee `userId` values remain `USER` for backfill fidelity.
- `AuditActorLookups` are empty until Chat 2/5.
- Existing human `log({ userId })` callers were not migrated to `ActorContext` (compatible by design).
- Payroll audit trail still employee-shaped; machine rows fall back to `Unknown user`.

## Chat 2 entry point

1. Read this handoff, `10-Phase-1-…` A–J, `01`, `03`, `05`.
2. Apply the Audit migration in local/dev if not applied.
3. Add External Agent + Credential models. Identity stays stable across rotation.
4. Dedicated machine auth guard. Do not send agent tokens through `EmployeeGuard`.
5. Capability registry + grants + scopes + deny-by-default Policy Evaluator.
6. Audit grant/agent lifecycle using `AuditService.log({ actor })`.
7. Wire `resolveExternalAgentDisplayName` into `attachActorsToAuditLogs`.
8. Do not add REST/MCP controllers yet (Chat 4).
9. Do not write Tasks/Drive via Prisma from AI code.
