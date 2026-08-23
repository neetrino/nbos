# Post-Phase-1 Chat 1 Handoff — Tasks Domain Ownership

> Next chat must verify this evidence against the repository. Do not trust the summary blindly.
> This chat did **not** commit.

## Milestone

NEW CHAT 1 of root `ai-modul-steps.md` / Workstream 3 of
`32-Post-Phase-1-Technical-Debt-Plan.md`. Branch `sipan`.

Goal: close Tasks Cleanup C9 domain-ownership residual. Support, Automation and
other applicable production producers create Task rows only through a
Tasks-owned application create operation.

Do **not** start NEW CHAT 2 (atomic sibling-module codes) or NEW CHAT 3
(Drive artifact lifecycle) from this handoff.

## Inventory — Task writers

Repository search used:

```text
.task.create / prisma.task.create / tx.task.create
.task.createMany / .task.upsert
INSERT INTO "tasks"
```

| Writer                                                            | Kind                  | Classification                                                                                 | After this chat                 |
| ----------------------------------------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------- |
| `apps/api/src/modules/tasks/create-task.op.ts` → `db.task.create` | Production insert     | Tasks-owned helper. The only supported production insert.                                      | Keep                            |
| `TaskCreationService.create`                                      | Production port       | Nest application contract. Allocates `T-...` then calls `createTask`.                          | Keep                            |
| `TasksService.create`                                             | Production facade     | Human/API, Recurring, External Agent. Delegates to `TaskCreationService`. Not a second writer. | Keep                            |
| `SupportService.createExecutionTask`                              | Was production bypass | Direct `prisma.task.create` + `allocateTaskCode`.                                              | Now calls `TaskCreationService` |
| `AutoTasksService.generateTasks*`                                 | Was production bypass | Direct `prisma.task.create` + `allocateTaskCode`.                                              | Now calls `TaskCreationService` |
| `RecurringTasksService.spawnFromTemplate`                         | Already Tasks-owned   | Already called `TasksService.create`.                                                          | Unchanged                       |
| `AgentTaskWriteHandler.commitPreparedCreate`                      | Already Tasks-owned   | Already called `TasksService.create` after External Agent policy.                              | Unchanged                       |
| `packages/database/prisma/seed.ts` `prisma.task.upsert`           | Dev/demo fixture      | Not a production writer. Fixed historical codes.                                               | Left as fixture                 |
| Unit/int tests that mock or assert `prisma.task.create`           | Test                  | Not production.                                                                                | Updated to the owned path       |
| `createMany` / SQL `INSERT INTO tasks`                            | None found            | —                                                                                              | —                               |

No other production module inserts Task rows.

## Architecture decision

One Tasks-owned create port, reused by every producer:

```text
Human/API ────────── TasksService.create ──┐
Recurring ────────── TasksService.create ──┤
External Agent ───── TasksService.create ──┼──> TaskCreationService.create ──> createTask ──> Task
Support ──────────── TaskCreationService ──┤
Automation ───────── TaskCreationService ──┘
```

Why a narrow `TaskCreationService` instead of injecting the full `TasksService`
into Support/Automation:

- it is the same create path, not a parallel system-only service;
- Support/Automation do not pull update/complete/delete/notifications;
- `TasksModule` already exported services and does not import Support or
  Automation, so there is no circular Nest module graph;
- trusted internal callers never enter External Agent token/grant/policy.

Actor/source rules:

- `creatorId` remains the accountable Employee;
- machine/system producers set `createdByActorType` / `createdByActorId`;
- Support: `{ type: 'SYSTEM', id: 'support:{ticketId}' }`;
- Automation: `{ type: 'AUTOMATION', id: 'auto-tasks:{linkType}:{linkId}' }`;
- human HTTP create still omits actor columns (unchanged);
- HTTP mapper still drops forged actor keys and now also drops `productId` /
  `extensionId`.

Preserved caller semantics:

- Support title/description/assignee/priority map, ticket/project/product
  links, product Work Space → `workspaceId` + `BACKLOG`;
- Automation blueprint titles, `NORMAL` priority, DEAL/PRODUCT links,
  `productId` FK on product packs;
- shared `allocateTaskCode` / `entity_code_counters` (C26: reserve on the
  committed client, not inside a longer interactive transaction);
- default status `OPEN`; no lifecycle/status rewrite;
- External Agent still goes Human/API create after its own policy, not the reverse.

## Files

Added:

- `apps/api/src/modules/tasks/task-creation.service.ts`
- `apps/api/src/modules/tasks/create-task.op.ts`
- `apps/api/src/modules/tasks/task-creation-actors.ts`
- `apps/api/src/modules/tasks/task-creation.service.test.ts`
- `apps/api/src/modules/tasks/task-creation-actors.test.ts`
- `docs/NBOS/02-Modules/21-AI-Platform/33-Post-Phase-1-Chat-1-Tasks-Ownership-Handoff.md`

Changed:

- `apps/api/src/modules/tasks/task-create.input.ts`
- `apps/api/src/modules/tasks/tasks.service.ts`
- `apps/api/src/modules/tasks/tasks.module.ts`
- `apps/api/src/modules/tasks/task-code-generation.ts`
- `apps/api/src/modules/support/support.service.ts`
- `apps/api/src/modules/support/support.module.ts`
- `apps/api/src/modules/automation/auto-tasks.service.ts`
- `apps/api/src/modules/automation/automation.module.ts`
- matching unit/int tests
- `docs/NBOS/02-Modules/05-Tasks/04-Tasks-Cleanup-Register.md` (C9 ownership)
- `docs/NBOS/02-Modules/21-AI-Platform/32-Post-Phase-1-Technical-Debt-Plan.md`

## Migrations

None. No schema change. `createdByActorType` / `createdByActorId` and
`Task.productId` already exist. Rolling deploy of this chat is a code-only
cutover: old Support/Automation binaries keep writing Task rows directly, new
binaries go through the same table/allocator. Mixed old/new writers remain
safe for the code series because both already used `allocateTaskCode`.

## Tests

Targeted:

- `task-creation.service.test.ts` — human create, Support/Automation
  provenance, product FK, reserved-code / tx reserve-on-committed-client,
  reject empty title before allocate;
- `task-creation-actors.test.ts`;
- `task-create.input.test.ts` — HTTP drops actor + delivery FKs;
- `tasks.service.test.ts` create suite (facade regression);
- `support.service.test.ts` `createExecutionTask` — owned-path write shape,
  mock-port “no direct insert”, closed-ticket block;
- `auto-tasks.service.test.ts` — blueprint counts, shared allocator, DEAL
  provenance, mock-port “no direct insert”, PRODUCT FK + link.

Wiring-only updates (constructors):

- `task-code-allocation.int.test.ts`
- `agent-create-concurrency.int.test.ts`
- `agent-write-atomicity.int.test.ts`

Transaction semantics of create are unchanged (allocate on committed client,
then insert, optional caller `tx` for the insert only). The existing opt-in
real-DB suites still cover allocator contention and agent tx atomicity. They
were not re-run here unless `AI_PLATFORM_DB_TEST_URL` was set.

## Remaining debts

Out of this chat on purpose:

- C8 — Automation rules vs Task Blueprints split;
- C25 / NEW CHAT 2 — sibling-module human-readable codes (Invoice, TKT-, …);
- K209 / C24 / NEW CHAT 3 — Drive artifact lifecycle;
- Recurring spawn still has no machine actor column (already Tasks-owned;
  adding `AUTOMATION`/`SYSTEM` there is a later product choice);
- seed `task.upsert` still bypasses the port (fixture);
- Support list of execution tasks still reads `prisma.task.findMany` (read,
  not a create writer);
- C1–C7 Tasks cleanup items unchanged.

## Verifier scope

Exact searches the verifier should re-run:

```text
rg '\\.task\\.create(?:Many)?' --glob '*.ts'
rg 'prisma\\.task\\.(create|createMany|upsert)' --glob '*.ts'
rg 'tx\\.task\\.(create|createMany|upsert)' --glob '*.ts'
rg 'INSERT INTO .+tasks' --glob '*.{ts,sql}'
rg 'allocateTaskCode' --glob '*.ts'
```

Allowed production `task.create` after this chat: only
`apps/api/src/modules/tasks/create-task.op.ts`.

Allowed production `allocateTaskCode` after this chat:

- `TaskCreationService.reserveCode` (also used by `TasksService.reserveCode`
  and therefore by `AgentTaskWriteHandler.reserveCreateCode`)

The concurrency int test helper still calls `allocateTaskCode` directly to
stand in for that reserve step. That is test-only.

Support and Automation source must not contain `prisma.task.create` or
`allocateTaskCode`.

Also confirm:

1. no circular `TasksModule` ↔ `SupportModule` / `AutomationModule`;
2. no second system-only Tasks create implementation;
3. human `POST /tasks` still uses `TasksService.create` without forged actor;
4. External Agent still does not become the Support/Automation path;
5. C9 residual ownership text is honest;
6. NEW CHAT 2 / NEW CHAT 3 were not started.

## Executor checks (not a substitute for independent verification)

- Targeted unit tests: 8 files / 99 passed, plus 5 related Agent/Recurring files / 67 passed.
- `eslint` on changed API files: passed.
- `@nbos/api` `tsc --noEmit`: passed with `NODE_OPTIONS=--max-old-space-size=8192` (default heap OOM is a pre-existing tsc cost, not a type error).
- Opt-in real-DB suites (`AI_PLATFORM_DB_TEST_URL`): **not run** — env unset. Transaction/allocator semantics were not changed; existing suites remain the evidence if the verifier has a disposable DB.
- Production build: not run.
- No commit.

## Independent verification

**Verifier:** NEW CHAT 1 independent verifier (fresh chat). Product code was not modified.

**Verdict: PASS WITH DEBTS**

C9 domain-ownership residual is closed. Remaining items are out of this milestone’s scope (C8, C25 / NEW CHAT 2, K209/C24 / NEW CHAT 3, Recurring machine-actor product choice, seed fixture upsert). No ownership gap and no human/API create regression were found.

### 1. Branch / HEAD / worktree

| Fact     | Value                                                                                                                                        |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Branch   | `sipan`                                                                                                                                      |
| HEAD     | `ba9b1287` `docs(ai-platform): expand post-phase remediation architecture`                                                                   |
| Worktree | `/Users/user/{} Development/1. Production/nbos`                                                                                              |
| Commit   | **not created** (uncommitted Chat 1 work, as claimed)                                                                                        |
| Remote   | local `sipan` is **1 commit behind** `origin/sipan` (`240c84b3` docs-only verifier-prompt commit). No product-code conflict with this slice. |

Uncommitted Chat 1 surface matches the handoff file list: Support/Automation/Tasks create refactor + tests + C9/plan docs + this handoff. NEW CHAT 2 / NEW CHAT 3 were not started.

### 2. Independent writer inventory

Re-ran the handoff searches plus `task.create(` / `task.createMany` / `task.upsert` / `INSERT INTO …tasks` / `allocateTaskCode`.

| Writer                                                  | Kind              | Verifier classification                                                                   |
| ------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------- |
| `create-task.op.ts` → `params.db.task.create`           | Production insert | **Only** production Task insert                                                           |
| `TaskCreationService.create`                            | Production port   | Allocates `T-…` then calls `createTask`                                                   |
| `TasksService.create`                                   | Facade            | Delegates to `TaskCreationService`. Human/API, Recurring, Client Services, External Agent |
| `SupportService.createExecutionTask`                    | Production caller | Calls `TaskCreationService`. No `prisma.task.create` / `allocateTaskCode`                 |
| `AutoTasksService.generateTasks*`                       | Production caller | Calls `TaskCreationService`. No Prisma client, no `allocateTaskCode`                      |
| `RecurringTasksService.spawnFromTemplate`               | Production caller | Already `TasksService.create`                                                             |
| `AgentTaskWriteHandler.commitPreparedCreate`            | Production caller | Policy first, then `TasksService.create`                                                  |
| `ClientServiceFlowsService.createTask`                  | Production caller | Already `TasksService.create` (not a bypass; not claimed as a Chat 1 rewrite)             |
| `packages/database/prisma/seed.ts` `prisma.task.upsert` | Fixture           | Not production                                                                            |
| Unit/int tests asserting `prisma.task.create`           | Test              | Not production                                                                            |
| `createMany` / SQL `INSERT INTO tasks`                  | None in runtime   | —                                                                                         |

Production `allocateTaskCode` callers: only `TaskCreationService.reserveCode` (used by `TasksService.reserveCode` → External Agent `reserveCreateCode`). The concurrency int helper still calls `allocateTaskCode` directly — test-only.

### 3–5. Ownership / no parallel service / no circular graph

- Support and Automation no longer insert Task rows. Mock-port tests prove they call `TaskCreationService.create` and do not touch `prisma.task.create`.
- Create logic lives once in `create-task.op.ts`. `TaskCreationService` is the narrow exported port; `TasksService.create` is a facade, not a second implementation. Support/Automation skip the full `TasksService` (update/complete/notifications) as designed.
- Nest graph: `TasksModule` exports `TaskCreationService` and does **not** import Support/Automation. `SupportModule` and `AutomationModule` import `TasksModule`. `NotificationModule` does not import either. No `ModuleRef` / service-locator lookup for this path. TypeScript cycle: Tasks production files do not import Support/Automation (only the code-allocation int test does).

### 6. Caller semantics preserved

Compared to `HEAD` Support/Automation/Tasks create:

- Support title/description/assignee/priority map, ticket/project/product links, product Work Space → `workspaceId` + `BACKLOG` when a workspace exists, closed-ticket block: preserved.
- Automation blueprint counts, `NORMAL` priority, DEAL/PRODUCT links, `productId` FK on product packs: preserved.
- Shared `allocateTaskCode` / `entity_code_counters`; reserve stays on the committed client (C26).
- Workflow status still omitted → Prisma default `OPEN`. No lifecycle rewrite.
- Human HTTP still uses `TasksService.create(createTaskInputFromHttpBody(body))` with no actor argument. Mapper drops forged actor keys and now also `productId` / `extensionId`.
- Audit/notifications on create: none before, none after (same as previous `TasksService.create`).
- Support create response include changed from `SUPPORT_TASK_INCLUDE` to `TASK_INCLUDE` (superset: reviewer, workspace, sprint, employee avatar). List-of-execution-tasks still uses `SUPPORT_TASK_INCLUDE`. Additive, not a field loss.

Observed alignment (not a residual bypass): writers that previously omitted `planningStatus` hit Prisma default `UNPLANNED`. The owned path already used by human/Recurring/Agent runs `resolveTaskSprintAssignment` → `derivePlanningStatusFromSprint(null)` → `BACKLOG` when no sprint/planning is supplied. Support-without-workspace and Automation now get that same Tasks default. Caller-specified Support `BACKLOG` (with workspace) is unchanged.

### 7–8. Auth and actor provenance

- Support/Automation do not enter External Agent REST/MCP, token, grant, or policy. They inject `TaskCreationService` only.
- External Agent still prepares via `AgentPolicyService` and commits through `TasksService.create` with its own actor. It is not the Support/Automation path.
- Support actor: `{ type: 'SYSTEM', id: 'support:{ticketId}' }`.
- Automation actor: `{ type: 'AUTOMATION', id: 'auto-tasks:{linkType}:{linkId}' }`.
- Both types are canonical (`packages/shared` actor catalog). `creatorId` remains the accountable Employee. No fake Employee id.

### 9–11. Human regression and transactions

- Human `POST /tasks` path unchanged: mapper → `TasksService.create` → same insert helper.
- `TasksService` create unit suite, HTTP mapper tests, Recurring spawn, Client Services create, External Agent write/parity/REST tests passed (see below).
- Transaction boundary unchanged: allocate on committed `PrismaClient`, insert on `tx ?? prisma`. Caller `tx` is insert-only. Support/Automation do not pass `tx` (same as before: sequential allocate-then-insert).

### 12. C9 closeability

Yes. The residual C9 note (“Support/Automation still write Task via Prisma past the domain owner”) is no longer true. Allocator uniqueness was already shipped; this chat restores the ownership boundary. C8 is correctly left open.

### Checks run

| Check                                                                                                                                                                  | Result                                                                                                    |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Targeted: task-creation + actors + input + TasksService + Recurring + Support + Automation + Client Services create + Agent write + AI module wiring + REST/MCP parity | **12 files / 157 passed**                                                                                 |
| `pnpm test:regression`                                                                                                                                                 | **22 files / 285 passed**                                                                                 |
| eslint on changed API files                                                                                                                                            | **passed**                                                                                                |
| `@nbos/api` `tsc --noEmit` with `NODE_OPTIONS=--max-old-space-size=8192`                                                                                               | **passed**                                                                                                |
| Independent repository writer search                                                                                                                                   | **passed** — only `create-task.op.ts` production insert                                                   |
| Opt-in real-DB (`AI_PLATFORM_DB_TEST_URL`)                                                                                                                             | **not run** — env unset. Transaction/allocator semantics were not changed; not required for this verdict. |
| Production build                                                                                                                                                       | **not run**                                                                                               |

### Out-of-scope debts (do not block C9)

- C8 — Automation rules vs Task Blueprints.
- C25 / NEW CHAT 2 — sibling-module codes (including Support ticket `TKT-` and Deal `D-`, still MAX+1).
- K209 / C24 / NEW CHAT 3 — Drive artifact lifecycle.
- Recurring spawn still has no machine actor column (already Tasks-owned).
- Seed `task.upsert` remains fixture-only.
- Support execution-task list remains a Prisma read.

### Findings for executor chat

None that require a code fix. C9 may stay closed. Do not start NEW CHAT 2 until this work is committed after this PASS WITH DEBTS.

## Independent re-verification — GPT-5.6 Sol (2026-08-23)

**Verdict: PASS WITH DEBTS.** Commit `2aae557d` was re-reviewed independently at repository `HEAD` `0bc07ed5`. The only current worktree item was an unrelated untracked deployment document and was excluded from scope.

- Repository-wide production writer search again found exactly one Task insert: `apps/api/src/modules/tasks/create-task.op.ts`.
- Support and Automation use the exported `TaskCreationService`; Recurring, Client Services and External Agent remain on Tasks-owned facades. No parallel create implementation, direct Prisma bypass, service locator, or circular Tasks ↔ caller module dependency was found.
- Human/API mapping still rejects caller-controlled actor provenance and delivery FKs. Support/Automation preserve accountable `creatorId` while recording explicit non-Employee producer provenance.
- Targeted current-tree regression: **7 files / 88 tests passed** (`task-creation`, actors, HTTP input, TasksService, Support, Automation, Recurring).
- The first `pnpm exec vitest` attempt did not execute because Corepack refused an unverifiable pnpm registry signature; the already-installed `node_modules/.bin/vitest` binary was used successfully instead.
- Real-DB suites were not rerun because Chat 1 did not change the pre-existing allocator/transaction boundary and no disposable DB URL was established in this verification.

No new actionable finding was identified. C9 remains honestly closed; the previously listed out-of-scope debts remain non-blocking for this milestone.
