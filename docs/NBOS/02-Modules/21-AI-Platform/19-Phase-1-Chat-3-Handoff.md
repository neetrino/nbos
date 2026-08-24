# Phase 1 Chat 3 Handoff — Domain Capabilities: Workspaces, Tasks and Drive

> Next chat must verify this evidence against the repository. Do not trust the summary blindly.

## Milestone

Chat 3 of `16-Phase-1-Execution-Strategy.md`. Closed **PASS WITH DEBTS** by the required independent-model verification after round-3/4 remediations (round 5, 2026-08-21).

Completed: Domain Action Gateway (`capability key → AgentPolicyService.assertAllowed → Tasks/Drive domain services → audit`), authorized Workspace discovery with Product/Extension canonicalization (conflict D2), purpose-built Task read projections, Tasks-owned discussion (conflict D3), Drive confidentiality mapping and `SECRET_ADJACENT` denial, separately granted `tasks.create` / allowlisted `tasks.update`, semantic `tasks.start` / `tasks.comment` / `tasks.submit_review`, artifact attach through Drive, and REQUIRED-write idempotency.

An External Agent can now **execute** granted Workspace/Tasks/Drive capabilities through `AgentCapabilityGateway.invoke`. It still has **no wire**: REST and MCP adapters are Chat 4. Do not treat this milestone as “an agent can connect over HTTP/MCP”.

## Checklist

K–T after this chat. Statuses are those the commands below could reproduce, not an aspiration.

- K 196, 199–204, 206–208, 210 `[x]`; K 197–198 `[~]` until REST/MCP controllers exist (Chat 4); K 205 `[~]` — purpose-built projections exist; there is no second runtime validator that checks catalog `output.fields`; K 209 `[~]` — domain commit and idempotency `complete()` are not one transaction.
- L 211–221 `[x]`
- M 222–240 `[x]` — checklist state is omitted from the agent projection (payload minimization). Finance, Credentials and unrelated customer records are not projected. `tasks.read_links` filters each target through grant scope (`evaluate`, omit on deny).
- N 241–249 `[x]`
- O 250–258 `[x]` — cross-task artifact isolation and SENSITIVE-by-id both return `AGENT_RESOURCE_NOT_AVAILABLE`.
- P 259–272 `[x]`
- Q 273–288 `[x]`; B 39 `[x]` — allowlist from `TasksService` rules: `title`, `description`, `priority`, `dueDate`. `expectedUpdatedAt` is **required** and applied as `UPDATE … WHERE id AND updatedAt`. Task projections include `updatedAt` so the agent can round-trip the lock.
- R 289–302 `[x]` — `tasks.delete` / force-complete / generic `set_status` are unregistered. `buildTaskCompletionBlockers` is untouched. `submitForReview` maps to `REVIEW`. `submit_review` on `COMPLETED` is validation and does not call `complete()`.
- S 303–312 `[x]`
- T 313, 316–323 `[x]`; T 314–315 `[~]` — gateway accepts `invocation.idempotencyKey` and strips `clientOperationId` / `idempotencyKey` from JSON input; HTTP `Idempotency-Key` and MCP tool-arg binding are Chat 4. `abort()` only after a failed `dispatch`. Stale `IN_PROGRESS` is never reclaimed.

Chat 2 debts:

- E 108 `[x]` (was `[~]`) — real-database smoke: issue → authenticate → grant → scope, plus grant/scope versus revoke.
- G 140 `[~]` — **not closed**. `@Public()` + global guard wiring needs protocol controllers (Chat 4). User instruction: do not close G 140 here.
- J 186 `[~]` — **not closed**. Counters/windows are section U.

No open `[!]` BUSINESS DECISION.

## Files / modules changed

| Area                    | Path                                                                                                                                     |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Gateway                 | `apps/api/src/modules/ai-platform/gateway/*`                                                                                             |
| Policy D2               | `apps/api/src/modules/ai-platform/policy/agent-policy.service.ts` (canonical WORKSPACE scope ids)                                        |
| Module wiring           | `apps/api/src/modules/ai-platform/ai-platform.module.ts` (imports Tasks + Drive, exports gateway)                                        |
| Audit constants         | `apps/api/src/modules/ai-platform/ai-platform.constants.ts` (`capability` / `capabilityInvoked`)                                         |
| Agent errors            | `apps/api/src/modules/ai-platform/auth/agent-auth.errors.ts` (validation/conflict/idempotency)                                           |
| Real-DB smoke           | `apps/api/src/modules/ai-platform/grants/agent-foundation.int.test.ts`                                                                   |
| Tasks discussion        | `apps/api/src/modules/tasks/task-discussion.{constants,rules,service,controller}.ts`                                                     |
| Tasks allowlist         | `apps/api/src/modules/tasks/task-agent-update.allowlist.ts`                                                                              |
| Work Space D2           | `apps/api/src/modules/tasks/work-space-canonical.op.ts`                                                                                  |
| Tasks create provenance | `apps/api/src/modules/tasks/task-create.input.ts`, `tasks.service.ts` (trusted actor arg only)                                           |
| Tasks optimistic lock   | `apps/api/src/modules/tasks/commit-task-update.op.ts`                                                                                    |
| Tasks transitions       | `apps/api/src/modules/tasks/task-status-transition.op.ts`                                                                                |
| Drive mapping           | `apps/api/src/modules/drive/drive-ai-classification.ts`                                                                                  |
| Drive artifacts         | `apps/api/src/modules/drive/drive-task-artifact.service.ts`                                                                              |
| Catalog                 | `packages/shared/src/ai/capability-catalog.{read,write}.ts` (`sortBy`, `expectedUpdatedAt`)                                              |
| Prisma                  | `packages/database/prisma/schema/{ai-platform,tasks}.prisma`                                                                             |
| Migration               | `packages/database/prisma/migrations/20260821190000_ai_domain_capabilities/`                                                             |
| Human UI                | `apps/web/src/features/tasks/components/{use-task-discussion.ts,TaskSheet.tsx,use-task-sheet-state.ts}`, `apps/web/src/lib/api/tasks.ts` |
| Test utils              | `apps/api/src/test-utils/mock-prisma.ts`                                                                                                 |

No REST controller. No MCP adapter. AI code does not `prisma.task.create` / `prisma.fileAsset.create`; those writes stay in Tasks/Drive services. The idempotency table is AI-owned.

`ai-modul-steps.md` is a pre-existing dirty file and is not part of this milestone.

## Migrations

**One** migration, applied to the **dev** Neon branch `ep-late-frost-ag5aixzw` with `prisma migrate deploy` over `DIRECT_URL`. `prisma migrate status` reports **212** migrations and "Database schema is up to date!". Nothing was applied to production (`ep-sweet-dew-ag7259wn`). `prisma migrate dev` was not used.

`20260821190000_ai_domain_capabilities` — enums `TaskDiscussionVisibilityEnum`, `AgentIdempotencyStatusEnum`; `tasks.created_by_actor_type` / `created_by_actor_id`; tables `task_discussion_entries`, `external_agent_idempotency_records`; transactional `CREATE INDEX` (tables empty; no `CONCURRENTLY`). Risk **LOW**: additive only.

`prisma migrate diff --from-config-datasource --to-schema prisma/schema` grepped for `task_discussion`, `external_agent_idempotency`, `created_by_actor`: no Chat 3-specific drift.

Rollback: forward-fix. Discussion and actor columns are unused by human flows until the new Tasks discussion API is called; idempotency rows are empty until Chat 4.

## Tests run

```text
pnpm vitest run
→ 767 files passed + 2 skipped, 3793 tests passed + 4 skipped
  (skipped files: the two opt-in real-database suites)

pnpm vitest run apps/api/src/modules/ai-platform packages/shared/src/ai \
  apps/api/src/modules/tasks/task-discussion.service.test.ts \
  apps/api/src/modules/tasks/task-agent-update.allowlist.test.ts \
  apps/api/src/modules/tasks/work-space-canonical.op.test.ts \
  apps/api/src/modules/tasks/task-create.input.test.ts \
  apps/api/src/modules/tasks/commit-task-update.op.test.ts \
  apps/api/src/modules/tasks/tasks.service.test.ts \
  apps/api/src/modules/drive/drive-ai-classification.test.ts \
  apps/api/src/modules/drive/drive-task-artifact.service.test.ts
→ 35 files passed + 2 skipped, 343 tests passed + 4 skipped

pnpm --filter @nbos/api exec tsc --noEmit → exit 0

Opt-in real-DB suites were not re-run after round-4 remediations.
```

Not run: production migration, API boot against a live agent token, any REST/MCP round-trip (no protocol surface), browser UI of TaskSheet discussion.

## Architecture decisions

1. **Gateway is the only agent execution path.** REST and MCP in Chat 4 must call `AgentCapabilityGateway.invoke`. Handlers never write `task` / `fileAsset` / `fileLink` via Prisma.
2. **`creatorId` stays the owner Employee FK.** An agent cannot be an Employee. `TasksService.create` still requires `creatorId`; the gateway uses the agent's **owner**. Provenance for the machine is `createdByActorType` / `createdByActorId`. Human UI that shows “creator” remains an employee; audit and discussion use ActorContext.
3. **Discussion is Tasks-owned (D3).** `TaskDiscussionEntry` records `actorType` / `actorId` / `actorDisplayName`. Messenger is not involved. Human `GET/POST /api/tasks/:id/discussion` uses Employee RBAC; the agent path uses policy then the same service without a fake Employee.
4. **Drive mapping lives in Drive.** `PUBLIC_INTERNAL` / `CONFIDENTIAL` → `INTERNAL`; `FINANCE_SENSITIVE` / `LEGAL_SENSITIVE` → `SENSITIVE`; `SECRET_ADJACENT` is forbidden to agents **before** policy, with the same external error as a missing file. Unknown Drive values fail closed to `SECRET`.
5. **Classification-sensitive calls always pass a resolved ladder value.** `tasks.read_discussion` → `SENSITIVE`; drive list/attach first assert `INTERNAL`, then a single-file read re-asserts with the mapped file classification. Missing classification remains deny-by-default in the evaluator (Chat 2).
6. **Scope checks use the Product Work Space id (D2).** `resolveCanonicalWorkSpace` maps Extension delivery rows via `extensionId → Extension.productId → Product Work Space`. `WorkSpace.productId` is unique, so an Extension row cannot share `productId` with the Product Work Space. `AgentPolicyService` canonicalizes stored `WORKSPACE` scope ids the same way. `extensionId` is never a policy target.
7. **Idempotency is AI-owned.** `(agentId, capabilityKey, operationKey)` + SHA-256 fingerprint. Domain success then `complete()`. Domain failure `abort()`s the `IN_PROGRESS` row so the key can be retried. After domain success, `abort` is forbidden. A live or stale `IN_PROGRESS` row always conflicts; retries do not re-enter Tasks/Drive. Replay of `COMPLETED` skips Tasks/Drive.
8. **Successful mutation audit is after domain commit and before idempotency `complete()`**, via `AiPlatformAuditService.logMachineAction` (`userId` null). A failed `complete()` still has an audit row. A failed audit after a successful write is logged, not rolled back (checklist 207). Denials stay on `AgentPolicyService`.
9. **`tasks.update` allowlist is from TasksService, not the agent catalog DTO.** Catalog input fields are a second gate (`pickCapabilityInput` rejects unknown JSON). Semantic status/workspace/assignment fields never reach `TasksService.update`.
10. **Agent artifact provenance is `sourceModule: AI_PLATFORM`**, not `FileAsset.createdById` (that column is an Employee FK). Do not put the agent id there.

## Canon / runtime conflicts

| ID                                    | Classification | Resolution in Chat 3                                                                               |
| ------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------- |
| D2 Extension Work Space               | PARTIAL        | Target and WORKSPACE grants resolve to Product Work Space id. Legacy `extensionId` columns remain. |
| D3 discussion authorship              | OK             | `TaskDiscussionEntry` + ActorContext. No fake Employee.                                            |
| C8 idempotency                        | PARTIAL        | Store + gateway enforcement. Protocol header/tool mapping is Chat 4.                               |
| Data classification vocabulary        | PARTIAL        | Drive mapper in Drive code. `SECRET_ADJACENT` blocked for agents.                                  |
| G 140 Employee-vs-Agent HTTP boundary | PARTIAL        | Unchanged. Needs Chat 4 controllers.                                                               |
| J 186 rate limits                     | PARTIAL        | Unchanged. Section U.                                                                              |

## Decisions taken in this chat (no developer stop)

1. **Accountable creator vs machine provenance.** Nulling `creatorId` would break human Task UI and the Employee FK. Owner Employee remains `creatorId`; actor columns carry the agent.
2. **Idempotency abort only on domain failure.** An `IN_PROGRESS` row that survived a thrown create would pin the key for 60s and then risk a duplicate. Failed **dispatch** deletes the in-progress row. After a successful domain write, `abort` is forbidden even if `complete()` throws.
3. **Orphan Extension delivery is not a Product Work Space.** If `EXTENSION_DELIVERY` has no `productId` or no parent Product row, resolution returns `null` (same external error as missing).
4. **ORGANIZATION scope lists every discoverable (non-Extension) Work Space.** That is the grant’s meaning, not a leak of unauthorized names.

## Known risks

1. **Domain commit and idempotency `complete()` are not one transaction.** After domain success `abort()` is forbidden, so a failed `complete()` cannot reopen the key immediately. A retry after the in-progress TTL can still duplicate. Logged; not solved without a shared transaction Tasks/Drive do not expose (K 209 `[~]`).
2. **No protocol surface.** Chat 3 cannot prove an external client can authenticate over HTTP/MCP. G 140 stays `[~]`.
3. **Opt-in real-database tests.** Default `pnpm vitest run` skips them. CI against a disposable branch is still the durable fix.
4. **Agent file assets have `createdById = null`.** Drive access rules that key off uploader employee will not treat the agent owner as uploader. Listing is by task link, which is what the agent path uses.
5. **Discussion human API is new.** TaskSheet now loads persisted notes instead of local-only state. Empty history for old tasks is expected.
6. **Output schema (205) is convention, not a validator.** A handler that adds a field will not fail a catalog check.
7. **Chat 4 must populate `ActorContext.correlationId`.** The gateway forwards `agent.actor`; it does not mint a correlation id of its own.

## Chat 4 entry point

Chat 3 closed with **PASS WITH DEBTS**. Entry conditions:

| Debt            | Why it is still open                                                                     |
| --------------- | ---------------------------------------------------------------------------------------- |
| G 140 `[~]`     | Real `@Public()` + global `AgentAuthGuard` wiring needs controllers                      |
| J 186 `[~]`     | Rate-limit counters/windows are section U                                                |
| T 314–315 `[~]` | Map HTTP `Idempotency-Key` and MCP `clientOperationId` onto `invoke({ idempotencyKey })` |
| K 197–198 `[~]` | REST/MCP controllers do not exist; Prisma-free adapters cannot be proven yet             |
| K 205 `[~]`     | Optional: validate/strip results against catalog output fields                           |
| K 209 `[~]`     | Domain commit and idempotency `complete()` are not one transaction                       |
| Opt-in DB tests | Still not in default CI                                                                  |
| No REST/MCP     | This chat by design                                                                      |

1. Read this handoff, `10-Phase-1-…` V–W, `08-External-Agent-Protocols-REST-and-MCP.md`, `09-External-Agent-API-and-MCP-Contract.md`.
2. Implement `/api/v1/agent` and the MCP adapter. Both authenticate with `AgentAuthGuard`; agent routes are `@Public()` so the employee JWT chain is skipped.
3. Controllers/adapters call **only** `AgentCapabilityGateway.invoke`. No Prisma, no second policy, no Tasks/Drive writes.
4. Map `Idempotency-Key` (REST) and `clientOperationId` (MCP) to `invocation.idempotencyKey`. Binary attach bytes go in `invocation.payload`, not JSON.
5. Identity endpoint (`GET /agent/me` / `nbos_get_identity`) is Chat 4; it must not grant capabilities.
6. Do not expose delete, force-complete, or Credentials/vault tools.
7. Contract tests for REST vs MCP parity, including identical deny codes for missing vs unauthorized resources.
8. Still no Settings admin UI (Chat 6) and no provider/model foundation (Chat 5).

## Verification (Chat 3)

- Проверял: Cursor Grok 4.6, 2026-08-21. (В `ai-modul-steps.md` для этой проверки указан GPT-5.6 Sol High; этот чат — Grok, то же семейство, что исполнитель.)
- Вердикт: **FAIL**.
- Git:
  - ветка `sipan`, `HEAD 1636cf51834851d18835b4984e768f6e3a51685d` (`docs(ai): record Phase 1 Chat 2 evidence and handoff`), совпадает с заявленным baseline Chat 2;
  - ветка ahead of `origin/sipan` на 5 коммитов; staged нет; дерево **не чистое**: 19 modified tracked + 39 untracked файлов; коммита Chat 3 нет (как просили);
  - все заявленные пути существуют; `git diff --diff-filter=D HEAD` пуст — тесты не удалялись;
  - артефакты Chat 2 на месте: `packages/shared/src/ai/policy-evaluator.ts`, `apps/api/src/modules/ai-platform/auth/agent-auth.guard.ts`, `packages/database/prisma/migrations/20260821170000_ai_external_agent_foundation/`.
- Запущено (только чтение миграций; `migrate deploy` / `migrate dev` не вызывались):
  - `.env.local` `DATABASE_URL` / `DIRECT_URL` → `ep-late-frost-ag5aixzw` (не прод `ep-sweet-dew-ag7259wn`);
  - `pnpm --filter @nbos/database exec prisma migrate status` → datasource `ep-late-frost-ag5aixzw.c-2.eu-central-1.aws.neon.tech`, **212** migrations, `Database schema is up to date!`;
  - `pnpm --filter @nbos/database exec prisma validate` → schemas valid;
  - `prisma migrate diff --from-config-datasource --to-schema prisma/schema` → 6336 символов pre-existing drift; **нет** `task_discussion` / `external_agent_idempotency` / `created_by_actor` / `DROP TABLE|COLUMN|TYPE`;
  - `pnpm vitest run apps/api/src/modules/ai-platform packages/shared/src/ai` + Chat 3 Tasks/Drive unit files → **30 passed | 2 skipped**, **291 passed | 4 skipped**;
  - `pnpm vitest run` → **763 passed | 2 skipped**, **3767 passed | 4 skipped**;
  - `AI_PLATFORM_DB_TEST_URL=<dev DIRECT_URL> pnpm vitest run …/agent-foundation.int.test.ts …/agent-credential.concurrency.int.test.ts` → **2 files, 4 tests passed** (55.99s) против `ep-late-frost-ag5aixzw`;
  - `pnpm typecheck` (turbo cache hit) и повтор `turbo typecheck --force --filter=@nbos/api --filter=@nbos/shared --filter=@nbos/database --filter=@nbos/web` → **5 successful / 5 total**, 0 cached, 48.4s;
  - `pnpm lint` → 0 errors, 13 warnings (11 web + 2 api), все вне diff Chat 3;
  - `git diff --check HEAD` → чисто.
- Расхождения с самоотчётом:
  - числа vitest / lint / migrate status / typecheck **подтверждены**;
  - таблица Files не называет `99-AI-Cleanup-Register.md`, `drive.module.ts`, `tasks.module.ts`, чеклист `10-Phase-1-…`, human `task-discussion.controller.ts` (они есть в дереве);
  - риск «complete() после domain commit → retry после TTL» **занижен**: `invoke` abort’ит reservation на **любой** ошибке после `dispatch`, включая `complete()`, поэтому дубль возможен сразу, не через 60s;
  - K 197–198, K 209, Q 283, K 208 (list-path) отмечены `[x]` без соответствующего доказательства;
  - «Production Neon was not touched» ретроспективно не доказуемо read-only проверкой; подтверждён только текущий dev host в `.env.local` и `migrate status`.
- Найденные дефекты:
  - `apps/api/src/modules/ai-platform/gateway/agent-capability.gateway.ts:45-58` — `catch` вызывает `idempotency.abort` после успешного domain `dispatch`, если падает `complete()` (или любой код после него). Ряд `IN_PROGRESS` удаляется, повтор того же ключа снова пишет Tasks/Drive. T 319/320/321 `[x]` при этом неверны. Теста на отказ `complete()` нет — **HIGH**.
  - `apps/api/src/modules/ai-platform/gateway/agent-workspace.handler.ts:66-88` — list discovery идёт через `policy.evaluate`, не `assertAllowed`. DENY (`AGENT_DISABLED`, `CAPABILITY_NOT_GRANTED`, …) не аудируется, хотя `workspaces.read` имеет `audit: ON_DENY`. K 208 `[x]` завышен — **MEDIUM**.
  - `apps/api/src/modules/ai-platform/gateway/agent-task-write.handler.ts:112-116` — `expectedUpdatedAt` опционален; без него агент молча перезаписывает более новый human `updatedAt`. Q 283 `[x]` завышен (287 покрыт только если поле передано) — **MEDIUM**.
  - K 209 `[x]` «Preserve transaction boundaries» при задокументированном split domain vs `complete()` — отметка нечестна — **MEDIUM** (honesty).
  - K 197–198 `[x]` «prohibit Prisma writes from REST/MCP» при отсутствии контроллеров: то же вакуумное `[x]`, которое для G 140 честно оставили `[~]` — **MEDIUM** (honesty).
  - O 257 `[x]` без теста «file task B + taskId A → `AGENT_RESOURCE_NOT_AVAILABLE`»; R 302 слабо: invalid submit-review на `COMPLETED` не покрыт (есть только start) — **MEDIUM** (evidence).
  - `apps/api/src/modules/tasks/tasks.service.ts` 590→604 строк (лимит 300, файл уже был oversized) — **LOW**.
  - `apps/api/src/modules/ai-platform/gateway/agent-idempotency.service.ts:83-86` silent `.catch` на delete expired; `tryInsert` глотает любую ошибку create как conflict — **LOW**.
- Долги для следующего милстоуна (после FAIL-фиксов; не закрывать Chat 3 ими):
  - G 140 `[~]`, J 186 `[~]`, T 314–315 `[~]`, K 205 `[~]`;
  - opt-in real-DB тесты всё ещё не в default CI;
  - остаточный split-transaction / IN_PROGRESS TTL replay (даже после фикса abort);
  - Chat 4 должен выставлять `ActorContext.correlationId` и маппить HTTP/MCP idempotency keys.
- Не проверено:
  - запись в production Neon (намеренно не подключались);
  - API boot с живым agent token / любой REST/MCP round-trip (поверхности нет);
  - браузерный UI TaskSheet discussion;
  - что `prisma migrate deploy` именно применял `20260821190000` (видно только «up to date» на 212);
  - независимое семейство модели: план требовал GPT-5.6 Sol High.

### Точный список правок для исполнителя

1. **Идемпотентность после domain commit (блокирует Chat 3).** В `AgentCapabilityGateway.invoke` abort’ить reservation **только** если упал `dispatch`. После успешного domain вызова `abort` запрещён. Если `complete()` бросил — залогировать, **не** удалять `IN_PROGRESS` (или сохранить результат другим retry-safe способом). Тест: `complete()` reject после `tasks.create` → `abort` не вызван → повтор `invoke` с тем же ключом **не** вызывает `TasksService.create`. Пока этого нет, T 319–322 не `[x]`.
2. **Audit list-deny.** `AgentWorkspaceHandler` для ненулевого DENY (всё кроме пустого `RESOURCE_OUT_OF_SCOPE`) должен идти через `assertAllowed` / `auditDenial`. Тест: disabled / ungranted `workspaces.read` list пишет policy-deny audit.
3. **Честные отметки:** K 197–198 `[~]` до Chat 4; K 209 `[~]` пока domain+idempotency не в одной транзакции; Q 283 `[~]` либо сделать `expectedUpdatedAt` обязательным для `tasks.update`.
4. **Недостающие тесты:** cross-task artifact (task A + file task B → тот же `AGENT_RESOURCE_NOT_AVAILABLE`, что missing); `FINANCE_SENSITIVE`/`LEGAL_SENSITIVE` by id → тот же код, что missing; `tasks.submit_review` на `COMPLETED` → validation, `complete()` не вызывается.
5. Код продукта, коммит, push, `migrate deploy`/`dev` в этом чате проверки не делать. После правок — повторная проверка в этом же чате.

## Remediation after Chat 3 FAIL (same chat)

Independent verification (2026-08-21) returned **FAIL**. Product code was then changed in this chat; no commit.

1. **Idempotency abort.** `AgentCapabilityGateway` aborts only when `dispatch` fails. After domain commit, a `complete()` rejection is logged and the `IN_PROGRESS` row is left in place. Test: `complete()` reject after `tasks.create` → `deleteMany`/`abort` not called → retry with the same key does not call `TasksService.create`.
2. **List-deny audit.** `workspaces.read` list uses `assertAllowed` whenever the outcome is a real DENY. Empty `RESOURCE_OUT_OF_SCOPE` remains an empty page. Tests: disabled / ungranted list write `AGENT_POLICY_DENIED`.
3. **Honest markers.** K 197–198 `[~]` until Chat 4 controllers; K 209 `[~]` until one transaction; Q 283 `[x]` because `expectedUpdatedAt` is now required.
4. **Missing tests.** Cross-task artifact, `FINANCE_SENSITIVE`/`LEGAL_SENSITIVE` by id, `submit_review` on `COMPLETED` without `complete()`.

Re-run after remediations (this chat, no commit): `pnpm vitest run` → 763 files / 3776 tests passed (+2/+4 skipped); targeted AI+Tasks/Drive → 30 files / 300 tests; `@nbos/api` typecheck green. Opt-in real-DB tests were not re-run.

## Verification (Chat 3, round 2)

- Проверял: Cursor Grok 4.6, 2026-08-21 (повтор после FAIL).
- Вердикт: **PASS WITH DEBTS**.
- Запущено:
  - git: ветка `sipan`, `HEAD 1636cf51834851d18835b4984e768f6e3a51685d`, коммита Chat 3 нет, дерево грязное (uncommitted remediations);
  - `pnpm vitest run apps/api/src/modules/ai-platform packages/shared/src/ai` + Chat 3 Tasks/Drive unit files → **30 passed | 2 skipped**, **300 passed | 4 skipped**;
  - `pnpm vitest run` → **763 passed | 2 skipped**, **3776 passed | 4 skipped**;
  - `pnpm --filter @nbos/api exec tsc --noEmit` → exit 0;
  - eslint по gateway / policy / discussion / allowlist / Drive Chat 3 файлам → 0 errors;
  - opt-in real-DB в этом проходе **не** гонялись (как заявил исполнитель; E 108 уже подтверждён в round 1).
- Расхождения с самоотчётом: нет по числам vitest (30/300 и 763/3776) и typecheck. K 197–198 / K 209 действительно `[~]`; Q 283 `[x]` с обязательным `expectedUpdatedAt` подтверждён кодом и тестом.
- Найденные дефекты: блокирующий abort-после-`complete()` закрыт (`dispatchAndFinish` + `releaseReservation`, тест `does not abort after domain commit if complete() fails…`). List-deny audit, required `expectedUpdatedAt`, cross-task / SENSITIVE-by-id / `submit_review` на COMPLETED — есть код и тесты. Новых HIGH/MEDIUM не найдено.
- Долги для Chat 4 (честные `[~]`, не регрессия abort):
  - G 140, J 186, T 314–315, K 197–198, K 205, K 209;
  - opt-in real-DB не в default CI;
  - после TTL у `IN_PROGRESS` retry теоретически может повторить запись (K 209);
  - Chat 4: `correlationId`, HTTP/MCP idempotency binding, контроллеры только через `invoke`.
- Не проверено: production Neon; live agent token / REST/MCP; браузер TaskSheet; повтор opt-in DB suite.

## Verification (Chat 3, round 3 — independent model)

- Проверял: **GPT-5.6 Sol**, 2026-08-21. Это первый раунд Chat 3 не семейством Grok; он заменяет вердикт round 2.
- Вердикт: **FAIL**.
- Git:
  - ветка `sipan`, `HEAD 1636cf51834851d18835b4984e768f6e3a51685d`; Chat 3 по-прежнему не закоммичен;
  - дерево грязное: 19 modified tracked Chat 3/pre-existing файлов и 40 untracked на момент проверки; удалённых файлов/тестов нет; `git diff --check HEAD` чист;
  - появившаяся параллельно deployment-документация не относилась к заявленному Chat 3 scope.
- Запущено:
  - `pnpm --filter @nbos/database exec prisma migrate status` → dev Neon `ep-late-frost-ag5aixzw`, **212 migrations**, `Database schema is up to date!`; migration apply не запускался;
  - read-only SQL transaction на том же dev host → 3 `PRODUCT_DELIVERY`, 3 `STANDALONE_OPERATIONAL`, **0** `EXTENSION_DELIVERY`;
  - targeted AI + Tasks/Drive tests → **30 passed | 2 skipped files**, **300 passed | 4 skipped tests**;
  - `pnpm vitest run` → **763 passed | 2 skipped files**, **3776 passed | 4 skipped tests**;
  - opt-in dev-DB suites (`agent-foundation` + credential concurrency) → **2 files / 4 tests passed**;
  - forced typecheck `@nbos/api`, `@nbos/shared`, `@nbos/database`, `@nbos/web` → **5 successful / 5 total**, 0 cached;
  - targeted eslint → exit 0.
- Что Grok проверил правильно:
  - round 1 правильно нашёл abort-after-domain дефект, list-deny audit и optional `expectedUpdatedAt`;
  - заявленные числа unit/full tests и typecheck воспроизводятся;
  - исправление немедленного `abort()` после отказа `complete()` действительно присутствует;
  - миграция additive-only; индексы создаются только на новых пустых таблицах, поэтому отсутствие `CONCURRENTLY` не блокирует.
- Расхождения с round 2 / новые дефекты:
  - `apps/api/src/modules/tasks/tasks.controller.ts:124-145`, `apps/api/src/modules/tasks/tasks.service.ts:38-57,165,581-588` — `createdByActorType` / `createdByActorId` добавлены в обычный `CreateTaskDto`, а human controller передаёт raw body прямо в `TasksService.create`. Inline object type не даёт `ValidationPipe` DTO metadata, поэтому клиент может добавить эти поля и подделать machine provenance; сервис принимает любые непустые строки — **HIGH**.
  - `apps/api/src/modules/ai-platform/gateway/agent-task-write.handler.ts:65-71`, `agent-task-projection.ts:20-43`, `packages/shared/src/ai/capability-catalog.read.ts:73-85`, `apps/api/src/modules/tasks/tasks.service.ts:206-265` — required `expectedUpdatedAt` одновременно **непригоден и неатомарен**: `updatedAt` отсутствует в agent Task projection/catalog output, поэтому агент не может получить корректное значение через gateway; сама проверка выполняется до unconditional `task.update`, а не в `WHERE` записи. Human update между read/check и write будет молча затёрт. Q 282–283 `[x]` не подтверждены — **HIGH**.
  - `apps/api/src/modules/ai-platform/gateway/agent-idempotency.service.ts:129-142`, `agent-capability.constants.ts:8-15` — через 60 секунд `IN_PROGRESS` возвращает `null`, что gateway трактует как разрешение выполнять domain action; row при этом атомарно не reclaim'ится. После domain success + failed `complete()` один или несколько retry снова создают Task/comment/artifact/transition. Это конкретный путь дубликата, а не только K 209 debt; T 319–322 `[x]` неверны — **HIGH**.
  - `apps/api/src/modules/ai-platform/gateway/agent-capability.gateway.ts:63-78` — `auditSuccess` вызывается только после `finishReservation`. Если domain write успешен, а `complete()` падает, audit не выполняется вообще. K 207 / K 208 для этого success-path завышены — **MEDIUM**.
  - `packages/database/prisma/schema/tasks.prisma:37-41`, `apps/api/src/modules/tasks/work-space-canonical.op.ts:27-47` — resolver ищет второй Work Space с тем же `row.productId`, хотя `WorkSpace.productId` имеет `@unique`. Тесты моделируют невозможные две строки с одним product id. Реальный dev DB не содержит `EXTENSION_DELIVERY`, поэтому D2 не доказан real-DB тестом; legacy extension row должен разрешаться через `extensionId -> Extension.productId -> Product Work Space` — **MEDIUM**.
  - `apps/api/src/modules/ai-platform/gateway/agent-task-projection.ts:46-55` — `tasks.read_links` фильтрует только тип (`PROJECT/PRODUCT/WORKSPACE/TASK`), но не проверяет scope связанного entity. Авторизованный Task A может раскрыть id Task/Work Space B вне scope; M 233 `[x]` не имеет cross-scope evidence — **MEDIUM**.
  - `apps/api/src/modules/ai-platform/gateway/agent-capability.input.ts:19-38`, `agent-task-write.handler.ts:121-149`, `agent-task-read.handler.ts:104-108` — registry валидирует имена полей, но не полный schema contract: invalid `status`, `priority`, `dueDate` и malformed `expectedUpdatedAt` не получают последовательную boundary validation. K 204 `[x]` завышен — **MEDIUM**.
  - `apps/api/src/modules/ai-platform/gateway/agent-task-write.handler.ts:74-111`, `apps/api/src/modules/tasks/tasks.service.ts:268-280,332-345` — status check и workflow update также разделены; `start` допускает REVIEW/IN_PROGRESS и race с concurrent completion. R 291/296 `[x]` покрыты только простыми mock-тестами — **MEDIUM**.
  - `apps/web/src/features/tasks/components/use-task-discussion.ts:14-29`, `apps/api/src/modules/tasks/task-discussion.service.ts:53-79` — UI всегда запрашивает page 1, а backend сортирует ascending; после первых 20 записей reload показывает старейшие, а не новые сообщения — **LOW**.
  - `apps/api/src/modules/tasks/tasks.service.ts` остаётся 604 строки после изменения (лимит 300) — **LOW**.
- Долги, не являющиеся новыми блокерами: G 140, J 186, T 314–315, K 197–198, K 205, shared transaction K 209, REST/MCP surface, default-CI для real-DB suites.
- Не проверено:
  - production Neon и история того, применялась ли migration только к dev;
  - live REST/MCP round-trip (surface ещё отсутствует);
  - browser TaskSheet flow;
  - нагрузочный race на реальной Tasks/Drive записи — существующие suites не содержат gateway concurrency test.

### Точный список исправлений после round 3

1. Убрать actor provenance из клиентского `CreateTaskDto`. Передавать доверенный `ActorContext` отдельным service argument / отдельным internal method; human controller не должен иметь возможность прислать `createdByActor*`. Добавить controller/integration negative test.
2. Добавить `updatedAt` в purpose-built agent Task projection и catalog outputs, затем сделать `expectedUpdatedAt` атомарным условием domain update (`WHERE id + updatedAt`, count/conflict). Добавить round-trip test `read/create -> update` и race-test с concurrent human update.
3. Не считать stale `IN_PROGRESS` безопасной новой reservation. До общей transaction/outbox/domain operation key возвращать ambiguous/in-progress conflict либо реализовать атомарный at-most-once protocol. Добавить test: failed `complete()` → elapsed 60s → один и concurrent retries не вызывают domain повторно. Пока не исправлено, T 319–322 должны быть `[~]`.
4. Гарантировать success audit после domain commit даже при отказе idempotency completion; добавить regression test на `complete()` rejection и audit call/durable delivery.
5. Исправить D2 resolver через реальную DB-valid relation `extensionId -> Extension.productId -> Product Work Space`; заменить impossible mocks и добавить integration evidence либо честно вернуть L 215 в `[~]`.
6. Для `tasks.read_links` проверять authorization/scope каждого возвращаемого link target либо исключить типы, которые нельзя безопасно авторизовать; добавить cross-workspace/task tests.
7. Добавить concrete runtime validators для enum/date/status/sort inputs и deterministic `AGENT_VALIDATION_FAILED`; K 204 держать `[~]` до покрытия.
8. Сделать semantic transitions conditional/atomic и определить разрешённые source statuses; добавить concurrent completion и invalid REVIEW/IN_PROGRESS transition tests.
9. Исправить discussion pagination на latest-page/cursor behavior и покрыть историю > default page size.

## Remediation after Chat 3 FAIL round 3 (same chat)

Independent verification (GPT-5.6 Sol, 2026-08-21) returned **FAIL**. Product code was then changed in this chat; no commit.

1. **Identity forge.** Human `POST /tasks` copies known fields through `createTaskInputFromHttpBody`. `TasksService.create` only writes `createdByActor*` from a separate trusted argument. Extra JSON keys cannot persist EXTERNAL_AGENT provenance.
2. **Atomic `expectedUpdatedAt`.** Agent updates call `commitTaskUpdate` (`UPDATE … WHERE id AND updatedAt`). Count 0 → `ConflictException` → `AGENT_CONFLICT`. Task projections and catalog outputs include `updatedAt` for a read→update round-trip.
3. **Stale `IN_PROGRESS`.** `replayOrConflict` never returns null for `IN_PROGRESS`. Rows are not deleted on TTL. Retries after 60s conflict and do not call Tasks/Drive. Crash between reserve and dispatch can pin the key (K 209).
4. **Audit on complete failure.** `auditSuccess` runs after domain commit and before `complete()`. Regression: `complete()` reject still calls `logMachineAction`.
5. **D2.** Extension delivery resolves `extensionId → Extension.productId → Product Work Space`. Tests no longer invent two Work Spaces with the same unique `productId`. Dev DB still has 0 `EXTENSION_DELIVERY` rows, so this is unit evidence, not a live-DB walk.
6. **`tasks.read_links`.** Targets are filtered to the authorized Work Space (PROJECT/PRODUCT/TASK/WORKSPACE). Foreign task ids are omitted.
7. **Runtime validators.** Invalid status/priority/sortBy/date/`expectedUpdatedAt` fail with `AGENT_VALIDATION_FAILED`.
8. **Semantic transitions.** `start` is `UPDATE … WHERE status IN (OPEN, ON_HOLD)`. `submitForReview` is `OPEN|IN_PROGRESS|ON_HOLD`. Concurrent complete / REVIEW start yield count 0.
9. **Discussion.** Human list without `page` requests the latest page; history > 20 entries is covered.

Re-run after remediations (this chat, no commit): `pnpm vitest run` → 767 files / 3789 tests passed (+2/+4 skipped); targeted AI+Tasks/Drive → 35 files / 339 tests; `@nbos/api` typecheck green. Opt-in real-DB tests were not re-run.

## Verification (Chat 3, round 4 — independent recheck)

- Проверял: **GPT-5.6 Sol**, 2026-08-21.
- Вердикт: **FAIL** — 8 из 9 round-3 corrections подтверждены; isolation для `tasks.read_links` исправлена только частично.
- Git:
  - ветка `sipan`, `HEAD 1636cf51834851d18835b4984e768f6e3a51685d`; коммита Chat 3 нет;
  - 21 modified tracked файла и 49 untracked files; удалённых файлов/тестов нет; `git diff --check HEAD` чист;
  - `ai-modul-steps.md` и параллельная deployment-документация не относятся к Chat 3.
- Запущено:
  - targeted AI + Tasks/Drive, включая `tasks.service.test.ts` и новые OCC/provenance suites → **35 passed | 2 skipped files**, **339 passed | 4 skipped tests**;
  - `pnpm vitest run` → **767 passed | 2 skipped files**, **3789 passed | 4 skipped tests**;
  - forced typecheck `@nbos/api`, `@nbos/shared`, `@nbos/database`, `@nbos/web` → **5 successful / 5 total**, 0 cached;
  - targeted eslint → exit 0;
  - `prisma migrate status` → dev Neon `ep-late-frost-ag5aixzw`, **212 migrations**, `Database schema is up to date!`; `prisma validate` → schemas valid;
  - opt-in dev-DB `agent-foundation` + credential concurrency → **2 files / 4 tests passed**.
- Подтверждённые исправления:
  1. Human create копирует allowlisted fields; actor provenance приходит отдельным trusted argument.
  2. `updatedAt` присутствует в list/read/create/update projections/catalog; agent update использует atomic `updateMany WHERE id + updatedAt`.
  3. Любой `IN_PROGRESS`, включая stale/expired, возвращает conflict и больше не reclaims domain action.
  4. Success audit вызывается после domain result и до idempotency `complete()`; regression test подтверждает audit при отказе `complete()`.
  5. D2 resolver использует `extensionId -> Extension.productId -> Product Work Space`; impossible duplicate-product fixture удалён.
  6. Enum/status/sort/date validators возвращают agent validation errors.
  7. `start` использует atomic source-status predicate `OPEN|ON_HOLD`; `submit_review` — `OPEN|IN_PROGRESS|ON_HOLD`.
  8. Human discussion без `page` выбирает последнюю страницу.
- Незакрытый дефект:
  - `packages/shared/src/ai/capability-catalog.read.ts:12-18`, `apps/api/src/modules/ai-platform/gateway/agent-task-read.handler.ts:71-78`, `agent-task-links.scope.ts:13-45` — `TASK_SCOPES` разрешает `RESOURCE`, но link filter получает только canonical Work Space и не получает actor/granted scopes/policy. Агент со scope `RESOURCE(Task A)` проходит policy для A, после чего любой link на `Task B` в том же Work Space возвращается, хотя прямой `tasks.read_links`/`tasks.read` для B был бы `RESOURCE_OUT_OF_SCOPE`. Текущий тест проверяет foreign Work Space, но не same-Workspace foreign RESOURCE. M 233 `[x]` и correction 6 остаются завышенными — **MEDIUM (authorization/data isolation)**.
- Остаточные LOW debts:
  - нет прямого unit test для реального `TasksService.submitForReview` source-status predicate (handler test мокирует service);
  - `toAgentTaskLinks` остался dead production export и используется только старым unit test;
  - `apps/api/src/modules/tasks/tasks.service.ts` всё ещё 585 строк при лимите 300.
- Честные архитектурные долги подтверждены: K 209, G 140, J 186, T 314–315; live REST/MCP, live Extension row и production DB не проверялись.

### Точная оставшаяся правка после round 4

1. Фильтровать каждый link target по фактическому grant scope для текущего агента, а не только по совпадению Work Space. Минимальный regression: `RESOURCE(Task A)` + link `Task B` в том же Work Space → B omitted; `WORKSPACE`/`PROJECT`/`ORGANIZATION` scope → B returned. Аналогично проверить PROJECT/PRODUCT/WORKSPACE links. Filtering не должен превращаться в resource-existence oracle.
2. Добавить direct service tests для valid/invalid `submitForReview` predicate и удалить неиспользуемый `toAgentTaskLinks`.

## Remediation after Chat 3 FAIL round 4 (same chat)

Independent recheck (GPT-5.6 Sol, 2026-08-21) returned **FAIL** on remaining `tasks.read_links` isolation. Product code was then changed; no commit.

1. **Grant-scope link filter.** Each permitted link is resolved to an `AiResourceTarget` and kept only when `policy.evaluate({ capabilityKey: 'tasks.read_links', target })` is ALLOW. `RESOURCE(Task A)` omits same-workspace Task B, PROJECT/PRODUCT/WORKSPACE links, and foreign-workspace tasks. `WORKSPACE`/`PROJECT`/`PRODUCT` keep same-workspace Task B. `ORGANIZATION` also keeps a cross-workspace Task. Missing and out-of-scope ids are omitted (no existence oracle). Denials use `evaluate`, not `assertAllowed`, so omitted siblings are not audited as parent denials.
2. **`submitForReview` predicate.** Direct `TasksService` tests cover allowed `OPEN|IN_PROGRESS|ON_HOLD` `updateMany` and rejection from COMPLETED. Unused `toAgentTaskLinks` removed.

Re-run after remediations (this chat, no commit): `pnpm vitest run` → 767 files / 3793 tests passed (+2/+4 skipped); targeted AI+Tasks/Drive → 35 files / 343 tests; `@nbos/api` typecheck green. Opt-in real-DB tests were not re-run.

## Verification (Chat 3, round 5 — independent recheck)

- Проверял: **GPT-5.6 Sol**, 2026-08-21.
- Вердикт: **PASS WITH DEBTS**. Round-4 authorization blocker закрыт; новых HIGH/MEDIUM дефектов не найдено.
- Git:
  - ветка `sipan`, `HEAD 1636cf51834851d18835b4984e768f6e3a51685d`; коммита Chat 3 нет, дерево грязное;
  - удалённых файлов/тестов нет; `git diff --check HEAD` чист.
- Запущено:
  - targeted AI + Tasks/Drive → **35 passed | 2 skipped files**, **343 passed | 4 skipped tests**;
  - `pnpm vitest run` → **767 passed | 2 skipped files**, **3793 passed | 4 skipped tests**;
  - forced typecheck `@nbos/api` + `@nbos/shared` → exit 0, 3 turbo tasks successful (включая database client generation);
  - targeted eslint финальных remediation-файлов → exit 0;
  - `prisma migrate status` → dev Neon `ep-late-frost-ag5aixzw`, **212 migrations**, `Database schema is up to date!`; migration apply не запускался.
- Подтверждено:
  - `readLinks` сначала авторизует source Task, затем каждый PROJECT/PRODUCT/WORKSPACE/TASK link резолвится в server-owned `AiResourceTarget`;
  - каждый target проходит `AgentPolicyService.evaluate` с `tasks.read_links`; `assertAllowed` для omitted siblings не вызывается;
  - `RESOURCE(Task A)` возвращает только Task A; same-Workspace Task B omitted;
  - WORKSPACE/PROJECT/PRODUCT scopes возвращают same-Workspace Task B; ORGANIZATION также разрешает cross-Workspace Task;
  - missing Task и out-of-scope Task одинаково omitted;
  - прямые `TasksService.submitForReview` tests подтверждают allowed predicate `OPEN|IN_PROGRESS|ON_HOLD` и rejection из COMPLETED/REVIEW;
  - dead `toAgentTaskLinks` удалён.
- Расхождения с remediation-самоотчётом: **нет** по заявленным full/targeted test totals и API typecheck; дополнительно подтверждён shared typecheck.
- Остаточные долги:
  - K 209 `[~]`: domain commit и idempotency completion не в одной transaction; безопасно pinned `IN_PROGRESS` требует reconciliation/операционного cleanup;
  - G 140, J 186, T 314–315, K 197–198, K 205 остаются `[~]` до своих milestone/protocol работ;
  - opt-in real-DB suites не re-run в round 5 (они прошли 2 files / 4 tests в round 4; финальный diff не меняет schema/auth/grant persistence);
  - нет live-DB link-policy integration test и живого `EXTENSION_DELIVERY` row;
  - PROJECT/PRODUCT missing-target existence отдельно не загружается; stale polymorphic link при broad ORGANIZATION scope может остаться в projection — **LOW**, не authorization widen на существующий ресурс;
  - link filtering делает sequential target/policy lookups; при больших link sets потребуется batching — **LOW performance debt**;
  - `apps/api/src/modules/tasks/tasks.service.ts` остаётся 585 строк при лимите 300 — pre-existing structural debt.
- Не проверено: production Neon, live REST/MCP, browser TaskSheet, production deployment.
