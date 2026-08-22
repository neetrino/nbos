# Phase 1 Chat 7 Handoff — Security, Regression and Operational Hardening

> Next chat must verify this evidence against the repository. Do not trust the summary blindly.

## Milestone

Chat 7 of `16-Phase-1-Execution-Strategy.md`. Branch `sipan`. Product HEAD at start was `5fe73e50`
(`feat(ai): add employee AI admin HTTP and Settings AI & Agents`), Chat 6 closed
PASS WITH DEBTS. This chat does **not** commit.

Completed: section U rate limits and abuse controls, the AL security suite as executable tests,
replay re-authorization for revoked grants, the AA 420 scheduler bind for the model catalog sync,
the three leftover Chat 6 security defects, the AM regression walk, and the AN documentation/runbook
synchronization. After the verification pass below, J 186 and AL 626 were returned to `[~]`: the
remediation section states exactly why.

This chat does **not** implement AO–AQ live acceptance, usage/evaluation runtime (AH/AI), adaptive
routing, RAG, Messenger auto-reply, the K 205 output schema validator, the K 209 commit/`complete()`
merge, or D 91 approval emitters. REST/MCP routes, tool names, error codes and the response envelope
were not reshaped — the rate-limit headers and `AGENT_RATE_LIMITED` are the `09` contract extension
that section U already required.

## Checklist

U, AL, AM, AN after this chat, plus J 186 and AA 420.

- **J 186 `[~]`**. Section U ships the counters, but production refuses at the limiter before policy
  runs, so no production caller passes the live verdict into the evaluator. See remediation 7.
- **U 324–330 `[x]`**. Pre-auth source throttle, per-agent request budget, per-capability-class
  budgets, payload ceiling on real bytes, concurrency ceiling, MCP batch ceiling,
  `AGENT_RATE_LIMITED` + `Retry-After` + `X-RateLimit-*`, employee capacity isolation via
  `@SkipThrottle()`, and tests for each.
- **AA 420 `[x]`**. `ai-model-catalog-sync` is a registered Nest cron on the scheduler process with
  `rosterIntent: 'off'`.
- **AL 603–625 `[x]`**, **AL 626 `[~]`**. 603–625 are asserted by tests in
  `apps/api/src/modules/ai-platform/security/` plus the Drive handler suite. 626 asks for
  revalidation of a queued sensitive action before its own domain commit; Phase 1 executes every
  capability inline, so there is nothing queued to revalidate. Replay re-authorization
  (`AgentReplayAuthorization`) is real hardening at a different lifecycle point and is now described
  separately. See remediation 4.
- **AM 627–640** — `[x]` except **627**, **631**, **636**, **638** which are `[~]`:
  - 627 / 631: API and web suites pass, but a browser walk of login and the Tasks UI is section AO,
    not this chat, and the remediation pass could not re-observe a process boot (see the boot row in
    the remediation table);
  - 636: the worker process boots and registers all four queues, but this environment has no Redis
    service, so `/ready` stays `false`;
  - 638: `20260821150000_audit_actor_aware` backfills `audit_logs` and builds two non-`CONCURRENTLY`
    indexes — production-safe only with the approval/window the project migration standard requires.
- **AN 641–656 `[x]`**. Hub, Technical Decisions, Roadmap, Architecture Layers, Audit, Tasks, Drive,
  Platform Access, Cleanup Register, client setup doc, and the new operations runbooks.

Still open, deliberately not touched: **K 205 `[~]` / W 368 `[~]`**, **K 209 `[~]`**, **D 91 `[~]`**,
584/585 policy candidate editor, AO–AQ.

No open `[!]` BUSINESS DECISION.

## Files / modules changed

New — rate limits (`apps/api/src/modules/ai-platform/limits/`):

| File                                                          | Role                                                           |
| ------------------------------------------------------------- | -------------------------------------------------------------- |
| `agent-rate-limit.constants.ts`                               | Every window, ceiling and header name as a named constant      |
| `agent-rate-limit.window.ts`                                  | Pure fixed-window counter and decision shape                   |
| `agent-rate-limit.service.ts`                                 | Per-agent request, per-capability, concurrency state + sweeper |
| `agent-rate-limit.guard.ts`                                   | Charges the request budget after auth, before the usage write  |
| `agent-preauth-throttle.service.ts`, `agent-preauth.guard.ts` | Per-source ceiling ahead of DB/Argon2                          |
| `agent-body-limit.middleware.ts`                              | 768 KiB on real socket bytes + `09` envelope for the refusal   |
| `*.test.ts` (7 files)                                         | Unit, window, guard, body-limit and HTTP integration coverage  |

New — security suite (`apps/api/src/modules/ai-platform/security/`):

| File                                       | Items                       |
| ------------------------------------------ | --------------------------- |
| `agent-boundary.security.http.int.test.ts` | 603, 604, 609, 610, 613–616 |
| `agent-scope-isolation.security.test.ts`   | 605–608, 617                |
| `agent-surface.security.test.ts`           | 611, 612, 619–625           |

New — other:

| File                                                | Role                                                         |
| --------------------------------------------------- | ------------------------------------------------------------ |
| `ai-platform/gateway/agent-replay-authorization.ts` | Re-authorizes an idempotent replay before it is returned     |
| `ai-platform/auth/agent-usage.interceptor.ts`       | Records `lastUsedAt` only for a request every guard admitted |
| `test-utils/raw-http-request.ts`                    | Socket-level HTTP client for header/body edge cases          |
| `ai-platform/ai-platform-core.module.ts`            | AI services without the agent/admin HTTP surface             |
| `ai-platform/ai-platform.module.wiring.test.ts`     | Static DI check for both modules                             |
| `scheduler/scheduler-ai.service.ts`                 | Lease-guarded runner for the catalog sync                    |
| `scheduler/ai-model-catalog-sync.cron.ts`           | Nest cron registration                                       |
| `docs/.../25-AI-Platform-Operations-Runbooks.md`    | AN 652–656                                                   |

Modified (behaviour):

| File                                                                                                             | Change                                                                                                       |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `protocol/agent-protocol.decorators.ts`                                                                          | `@SkipThrottle()` + `AgentPreAuthGuard` → `AgentAuthGuard` → `AgentRateLimitGuard` → `AgentUsageInterceptor` |
| `main.ts`                                                                                                        | Agent body parser and its error handler mounted before the global parsers                                    |
| `protocol/agent-protocol.invoker.ts`                                                                             | Charges the capability class and holds the concurrency slot                                                  |
| `protocol/agent-error.envelope.ts`, `.filter.ts`                                                                 | Optional `retryAfterSeconds` + `Retry-After` header                                                          |
| `mcp/agent-mcp.controller.ts`                                                                                    | JSON-RPC batch ceiling                                                                                       |
| `gateway/agent-capability.gateway.ts`                                                                            | Replay goes through `AgentReplayAuthorization`                                                               |
| `agents/external-agent.service.ts`, `agent-issuable.ts`                                                          | Expired agent cannot be enabled                                                                              |
| `providers/ai-provider-connection.validate-ops.ts`, `.service.ts`, `admin/ai-admin-providers.controller.ts`      | Preflight audit + `lastValidatedAt` only while `ACTIVE`                                                      |
| `ai-platform.constants.ts`                                                                                       | `PROVIDER_KEY_PREFLIGHT_VALIDATED` audit action                                                              |
| `models/ai-model-sync.rules.ts`, `.service.ts`                                                                   | `AI_MODEL_STATUS_ON_DISCOVERY` named constant                                                                |
| `ai-platform.module.ts`                                                                                          | Imports `AiPlatformCoreModule` + `AuditModule`                                                               |
| `scheduler/scheduler.module.ts`, `scheduler-job-catalog.entries.ts`, `.types.ts`, `scheduler-lease.constants.ts` | Catalog entry, `AI` group, lease name, wiring                                                                |
| `vitest.regression.config.ts`                                                                                    | Missing `oxc.decorator` block — the gate script was failing to parse Nest services                           |

REST/MCP routes, tool names and error codes were **not** changed. `21-External-Agent-Client-Setup.md`
was extended (section 5.1), not rewritten. Handoffs `17`–`23` were not touched.

## Migrations

**None.** Chat 7 is guards, services, tests and documentation over the Chat 1/3/5 tables.

- `prisma migrate dev` was not run.
- `prisma migrate deploy` was not run.
- Production Neon `ep-sweet-dew-ag7259wn` was not contacted.
- `prisma migrate status` against dev Neon `ep-late-frost-ag5aixzw`: 213 migrations, schema up to date.

Existing Phase 1 migrations were reviewed against
`docs/deployment/AUTOMATED-PRODUCTION-DATABASE-MIGRATIONS-STANDARD.md`:

| Migration                                         | Verdict                                                                                                                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `20260821150000_audit_actor_aware`                | Additive columns + `DROP NOT NULL` are cheap; the full-table backfill and two non-`CONCURRENTLY` indexes on `audit_logs` need approval and a window on a large production table |
| `20260821170000_ai_external_agent_foundation`     | New tables and indexes only                                                                                                                                                     |
| `20260821190000_ai_domain_capabilities`           | New tables + two nullable columns on `tasks`; FK validates against an empty child table                                                                                         |
| `20260822010000_ai_provider_model_internal_agent` | New tables and indexes only                                                                                                                                                     |

The audit migration must not be edited now that it is applied — its checksum is recorded. Any
change to the index strategy has to be a new forward migration.

## Tests run

```text
pnpm test
→ 838 files passed + 2 skipped, 4245 tests passed + 4 skipped, exit 0

pnpm test:regression
→ 22 files passed, 284 tests passed
   (was 15 files failing to parse before the config fix in this chat)

pnpm vitest run apps/api/src/modules/ai-platform
→ 80 files passed + 2 skipped, 633 tests passed + 4 skipped

pnpm vitest run apps/api/src/modules/ai-platform/security \
                apps/api/src/modules/ai-platform/limits \
                apps/api/src/modules/ai-platform/gateway/agent-replay-authorization.test.ts
→ 8 files passed, 81 tests passed

AI_PLATFORM_DB_TEST_URL=<dev DIRECT_URL> pnpm vitest run \
  apps/api/src/modules/ai-platform/grants/agent-foundation.int.test.ts \
  apps/api/src/modules/ai-platform/credentials/agent-credential.concurrency.int.test.ts
→ 2 files passed, 4 tests passed (the opt-in real-database suites, run against dev Neon)

pnpm lint      → exit 0 (0 errors, 11 pre-existing web warnings)
pnpm typecheck → exit 0 (api, web, shared, database)
```

Regression suites per area (files / tests, all passing):

| Area                          | Result |
| ----------------------------- | ------ |
| `modules/auth`                | 10/37  |
| `modules/platform-access`     | 4/8    |
| `modules/audit`               | 4/28   |
| `modules/tasks`               | 21/105 |
| `apps/web/src/features/tasks` | 26/95  |
| `modules/drive`               | 24/140 |
| `modules/integrations`        | 25/177 |
| `modules/employees`           | 10/33  |
| `apps/api/src/security`       | 2/7    |

Process boots (dev Neon, production untouched):

| Process   | Result                                                                                                                                                                                         |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API       | Starts; `/api/health` 200; `/api/v1/agent/me` and `/api/v1/agent/mcp` answer `401 AGENT_AUTH_INVALID` in the `09` envelope                                                                     |
| Worker    | Starts; registers `mail`, `reports.export-jobs`, `drive.zip-export-jobs`, `whatsapp.product-groups`; `/health` 200, Prisma ready; `/ready` false because no Redis is available here            |
| Scheduler | Starts; registers `ai-model-catalog-sync` (paused, `SCHEDULER_ENABLED=false`) alongside the existing 17 jobs; seeded `SchedulerJobPolicy` row is `enabled=false` as the roster intent requires |

Not run: production migration, live OpenAI/Anthropic keys, browser click-through, multi-instance
rate-limit behaviour, AO–AQ acceptance.

## Rate-limit windows chosen

| Budget                            | Constant                                 | Value     | Why this number                                                                                      |
| --------------------------------- | ---------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------- |
| Window                            | `AGENT_RATE_LIMIT_WINDOW_MS`             | 60 s      | Short enough to recover quickly, long enough to absorb a normal agent burst                          |
| Requests per agent                | `AGENT_REQUEST_LIMIT_PER_WINDOW`         | 600       | 10 rps sustained for one agent — far above real use, still bounds a loop                             |
| Requests per source, pre-auth     | `AGENT_PREAUTH_REQUEST_LIMIT_PER_WINDOW` | 900       | Above the per-agent ceiling on purpose: a well-behaved agent must hit its own budget first           |
| Failed authentications per source | `AGENT_PREAUTH_FAILURE_LIMIT_PER_WINDOW` | 20        | A real client fails at most once per rotation; key-id scanning costs a counter, not an Argon2 verify |
| `READ_STANDARD`                   | `AGENT_CAPABILITY_LIMIT_PER_WINDOW`      | 300       | Reads are cheap and are what an agent does most                                                      |
| `WRITE_STANDARD`                  | same                                     | 60        | Writes are cheaper to abuse than to undo                                                             |
| `WRITE_SENSITIVE`                 | same                                     | 20        | `tasks.create` / `tasks.attach_artifact` create durable records                                      |
| Concurrency                       | `AGENT_CONCURRENCY_LIMIT`                | 8         | Fits a parallel agent's fan-out; stops one credential owning the request pool                        |
| Request body                      | `AGENT_MAX_REQUEST_BYTES`                | 768 KiB   | Below the 1 MB express cap so the agent envelope answers, above one 512 KiB artifact in base64       |
| JSON-RPC batch                    | `AGENT_MCP_MAX_BATCH_MESSAGES`           | 20        | One HTTP request stays worth one request                                                             |
| Counter retention                 | `AGENT_RATE_LIMIT_RETENTION_MS`          | 2 windows | An agent pausing between bursts is never charged twice for one boundary                              |

## Architecture decisions

1. **The budget belongs to the agent, not the address — but the address is still bounded.**
   `AgentRateLimitGuard` runs after `AgentAuthGuard`, so an unauthenticated caller can never evict or
   consume another agent's window and several agents behind one egress IP do not share a ceiling.
   Because that guard needs an authenticated principal, `AgentPreAuthGuard` meters the source address
   first, so unauthenticated traffic cannot buy unlimited credential verification work.
2. **Employee capacity is isolated structurally, not by tuning.** The agent namespace carries
   `@SkipThrottle()`. There is no shared bucket to exhaust, so U 329 does not depend on picking the
   right numbers.
3. **One counter for two protocols.** The capability class is charged inside
   `AgentProtocolInvoker`, which both REST and MCP already funnel through, so moving traffic between
   protocols cannot buy more capacity.
4. **Replay is an authorization event, not a cache read.** `AgentReplayAuthorization` re-runs the
   policy for the original target before a stored result is returned. Idempotency guarantees "no
   duplicate effect", never "permission granted earlier is permission forever".
5. **Process role isolation for the scheduler.** `AiPlatformCoreModule` holds AI services with no
   controllers, so the scheduler gains `AiModelSyncService` without mounting the External Agent or
   employee admin HTTP surface. `AiPlatformModule` stays the HTTP layer.
6. **The catalog runner lives outside `SchedulerService`.** `SchedulerAiService` keeps the already
   oversized scheduler service from growing, and holds the shared lease so a second instance skips
   instead of double-syncing.
7. **Expiry is not a soft state for a disabled agent.** Enabling an agent whose expiry has elapsed is
   refused rather than silently re-arming it. An agent that merely timed out was never disabled by a
   human decision, so extending its expiry returns it to service — documented explicitly in the
   runbook so an operator knows which of the two states they are in.
8. **Security items are tests, not review notes.** Every AL item is an assertion that fails if the
   behaviour regresses, including the "no such capability exists" items, which are asserted against
   the capability catalog and the published operation registry together.

## Canon / runtime conflicts

| ID                           | Classification | Resolution in Chat 7                                                       |
| ---------------------------- | -------------- | -------------------------------------------------------------------------- |
| `09` contract vs rate limits | OK             | Extended: `retryAfterSeconds` is additive and only on `AGENT_RATE_LIMITED` |
| Payload ceiling error code   | OK             | `09` has no payload code; `AGENT_VALIDATION_FAILED` + HTTP 413             |
| J 186 counters               | PARTIAL        | Section U shipped, but the limiter refuses before policy sees a verdict    |
| AA 420 Nest bind             | RESOLVED       | Cron registered with `rosterIntent: 'off'`                                 |
| B1 AI as Automation feature  | RESOLVED       | Architecture Layers rewritten                                              |
| K 205 / W 368, K 209, D 91   | PARTIAL        | Untouched by design                                                        |
| Audit backfill migration     | PARTIAL        | Documented as approval-gated; cannot be edited after apply                 |

## Decisions taken in this chat (no developer stop)

1. **Rate-limit numbers** were chosen from agent working patterns rather than a generic default, and
   are recorded above and in the checklist. Raising them is a code change, deliberately.
2. **Counters are in-process for Phase 1.** A shared Redis store is the follow-up; the service
   boundary is already the only place that changes. Recorded in the Cleanup Register.
3. **`AiPlatformCoreModule` split** instead of importing the full `AiPlatformModule` into the
   scheduler, so a background process never exposes agent HTTP routes.
4. **A DI wiring test** was added after the module split broke the API boot: it replays Nest's
   resolution rules over module metadata, so the next split fails in CI instead of at boot.
5. **`vitest.regression.config.ts` was repaired.** It lacked the `oxc.decorator` block that the main
   config gained during the vitest 4 upgrade, so `pnpm test:regression` had been failing to parse
   every Nest service since before this chat. Fixing a broken gate is not the same as changing it.
6. **Runbooks live in one file** (`25-AI-Platform-Operations-Runbooks.md`) rather than five, because
   the procedures share the same containment order and audit vocabulary.

## Known risks

1. **In-process rate-limit counters.** With N API instances the effective ceiling is N × the
   documented value, and a deploy resets the windows. Acceptable for a bounded set of trusted
   agents; not acceptable as a defence against a hostile one.
2. **The audit backfill migration needs a production window.** On a large `audit_logs` the `UPDATE`
   and the two index builds will hold locks.
3. **Worker readiness was not observed green.** The process boots and registers every queue, but no
   Redis was available to reach `ready: true`.
4. **No browser E2E.** Login, Tasks UI and the AI admin UI are covered by unit/HTTP tests only.
5. **K 205 / K 209 / D 91** remain from earlier chats.

## Chat 8 entry point

Chat 8 is **final acceptance**: AO (External Agent), AP (provider/model/Internal foundation) and AQ
(architecture review), plus the full walk of the 724-point checklist.

1. Create a real test External Agent scoped to one non-production Work Space and walk AO 657–685
   end to end over both protocols. The runbooks in `25-AI-Platform-Operations-Runbooks.md` describe
   the admin actions you will need.
2. AP 686–705 needs **real provider keys**. Do not invent them — ask the developer for test keys for
   OpenAI and Anthropic, or mark the items `[~]` with that reason.
3. Do not reshape REST/MCP routes, tool names, error codes or the envelope.
4. Re-verify this handoff before relying on it: run `pnpm test`, `pnpm lint`, `pnpm typecheck` and
   at least the API boot yourself.
5. AM 627/631 (`[~]`) can be closed by the live walk in AO. AM 636 needs a Redis-capable environment.
   AM 638 needs a decision from the developer about the production audit migration window.

| Debt                      | Why it is still open                                          |
| ------------------------- | ------------------------------------------------------------- |
| Shared rate-limit store   | Phase 1 ships per-process counters                            |
| K 205 `[~]` / W 368 `[~]` | Output schema validator                                       |
| K 209 `[~]`               | Domain commit and idempotency `complete()` split              |
| D 91 `[~]`                | Approval lifecycle emitters                                   |
| 584/585 candidate editor  | Create/activate UI only                                       |
| Audit migration window    | Needs explicit production approval per the migration standard |
| Live provider keys        | Required by AP; do not invent                                 |
| Browser E2E               | Still not click-tested                                        |

## Verification (Chat 7)

- Проверял: **GPT-5.6 Sol**, 2026-08-22.
- Вердикт: **FAIL**.
- Git:
  - ветка `sipan`, `HEAD 5fe73e50d2e3944531f7b0a36d8f66a8be3056d3`, совпадает с `origin/sipan`; Chat 7 не закоммичен;
  - staged-файлов и удалений нет; дерево грязное: 43 modified tracked + 20 untracked фактических файлов; `git diff --check 5fe73e50` чист;
  - все заявленные в handoff пути существуют; `ai-modul-steps.md` также входит в diff от baseline, но в таблице файлов не указан.
- Запущено:
  - `pnpm --filter @nbos/database exec prisma migrate status` → dev Neon `ep-late-frost-ag5aixzw`, **213 migrations**, `Database schema is up to date!`; `migrate dev/deploy` не запускались;
  - read-only transaction на dev Neon → `audit_logs`: **339** строк, **0** с `actor_type IS NULL`; `ai-model-catalog-sync` policy: `enabled=false`;
  - `pnpm vitest run apps/api/src/modules/ai-platform` → **80 passed + 2 skipped files**, **633 passed + 4 skipped tests**;
  - exact security/rate/replay subset → **8 files / 81 tests passed**;
  - `pnpm test:regression` → **22 files / 284 tests passed**;
  - `pnpm test` → **838 passed + 2 skipped files**, **4245 passed + 4 skipped tests**;
  - opt-in dev-DB suites → **2 files / 4 tests passed**;
  - `NODE_OPTIONS=--max-old-space-size=8192 pnpm exec turbo typecheck --force` → **5 successful / 5 total**, 0 cached; без увеличенного heap API typecheck завершился exit 137 (OOM), отдельный API `tsc --noEmit` с 8 GiB прошёл;
  - `pnpm lint` и отдельный API lint → exit 0, **13 warnings** (11 web + 2 API), не 11;
  - полный diff от `5fe73e50`, все untracked-файлы и четыре Phase 1 migration SQL прочитаны; новых миграций Chat 7 нет. Destructive `DROP TABLE/COLUMN/TYPE` нет; audit migration содержит backfill, `DROP NOT NULL` и два индекса без `CONCURRENTLY`, поэтому AM 638 `[~]` выставлен честно. Остальные non-concurrent индексы создаются на новых пустых таблицах.
- Расхождения с самоотчётом:
  - числа test/typecheck/migrate status и dev-DB evidence подтверждены;
  - lint фактически даёт 13 warnings, а не заявленные 11; один warning находится в изменённом `scheduler-job-catalog.types.ts`;
  - U 326 и U 329 нельзя считать `[x]`: 768 KiB проверяются только по доверенному `Content-Length`, а новый limiter выполняется после полной аутентификации и telemetry writes;
  - AL 626 `[x]` подменяет queued-before-commit revalidation проверкой уже завершённого idempotent replay; это разные lifecycle points;
  - runbook обещает ручной запуск AI sync через Scheduler Settings, но новый job отсутствует в manual runner allowlist;
  - утверждение, что production Neon не контактировался исполнителем, ретроспективно read-only проверкой не доказуемо; в этой проверке использовался только подтверждённый dev host.
- Найденные дефекты:
  - `apps/api/src/modules/ai-platform/protocol/agent-protocol.decorators.ts:44-46`, `auth/agent-auth.guard.ts:67-80`, `auth/agent-authenticator.service.ts:56-67,95-103,186-207` — `@SkipThrottle()` полностью снимает pre-auth global throttle, а `AgentRateLimitGuard` запускается только после DB lookup, Argon2 verification и двух usage writes. Неаутентифицированный клиент с syntactically valid random key ids и скомпрометированный агент после исчерпания 600 requests могут без лимита нагружать DB/Argon2/logging и общую API capacity. Это ослабление существующего security-control и прямое опровержение U 329 — **HIGH**.
  - `apps/api/src/modules/ai-platform/limits/agent-rate-limit.guard.ts:45-55`, `apps/api/src/main.ts:49-60` — 768 KiB ceiling доверяет `Content-Length` и проверяется после глобального 1 MiB JSON parser. Chunked/отсутствующий/заниженный header пропускает payload до 1 MiB; payload свыше 1 MiB отклоняется middleware до agent filter и не гарантирует `09` envelope. U 326 и часть AL 616 завышены — **MEDIUM**.
  - `apps/api/src/modules/ai-platform/limits/agent-rate-limit.http.int.test.ts:245-255`, `protocol/agent-protocol.http.harness.ts:130` — employee-capacity test проверяет лишь `status !== 429`; реальный прогон логирует `EmployeeGuard` TypeError из-за пустого Prisma mock и ответ может быть 500, но тест остаётся зелёным. Он не доказывает, что Employee API остаётся работоспособным — **MEDIUM**.
  - `apps/api/src/modules/scheduler/scheduler-job-runner.ts:6-30,37-45`, `docs/NBOS/02-Modules/21-AI-Platform/25-AI-Platform-Operations-Runbooks.md:245-253` — `ai-model-catalog-sync` не входит в `RUNNABLE_JOB_NAMES`, а `PlatformSchedulerJobsService` умеет dispatch только через `SchedulerService`; документированный `POST .../ai-model-catalog-sync/run` вернёт “cannot be run from Settings” — **MEDIUM**.
  - `docs/NBOS/02-Modules/21-AI-Platform/10-Phase-1-AI-Foundation-and-External-Agent-Implementation.md:819,831`, `apps/api/src/modules/ai-platform/gateway/agent-capability.gateway.ts:49-52` — replay re-authorization выполняется после первоначального domain commit и не является revalidation queued sensitive action непосредственно перед commit. AL 626 не имеет заявленного кода/теста — **MEDIUM (checklist honesty)**.
  - `apps/api/src/modules/scheduler/scheduler-job-catalog.entries.ts` — 308 строк после добавления AI entry; `apps/api/src/modules/ai-platform/agents/external-agent.service.test.ts` — 325 строк. Новых production-функций >50 строк и nesting >3 не найдено; новых `any`, feature default exports, `console.log`, прямых Tasks/Drive Prisma writes и удалённых тестов не найдено — **LOW**.
- Долги для следующего милстоуна (после FAIL-фиксов): shared Redis rate-limit store; K 205/W 368, K 209, D 91; browser AO; Redis-ready worker; production audit-migration approval/window; live provider keys.
- Не проверено: production Neon и production deployment; browser UI/login/Tasks; live OpenAI/Anthropic; multi-instance limiter; повторный самостоятельный boot API/worker/scheduler (компиляция и suites прошли, но процессы в этой проверке не поднимались).

### Точный список правок для исполнителя

1. Добавить отдельный bounded **pre-auth** limiter для agent namespace, не использующий employee bucket и работающий до DB/Argon2/logging; post-auth per-agent budget должен срабатывать до `recordUsage`. Tests: valid-format unknown keys перестают вызывать verifier/DB после ceiling; исчерпанный valid agent не продолжает usage writes; Employee endpoint при agent flood отвечает **200**, не просто “не 429”.
2. Ограничивать реальные body bytes до JSON parsing, а не доверять `Content-Length`. Покрыть chunked, отсутствующий и заниженный header, 768 KiB boundary и payload >1 MiB; все agent oversize ответы должны иметь 413 + `AGENT_VALIDATION_FAILED` в `09` envelope.
3. Либо подключить `SchedulerAiService.runAiModelCatalogSync` к Settings manual runner и добавить service/HTTP test, либо убрать обещание ручного запуска и корректно выставить `canRunNow=false` в UI/runbook.
4. Вернуть AL 626 в `[~]`, пока нет queued sensitive action, либо реализовать revalidation в worker непосредственно перед domain commit с тестом revoke между enqueue и execution. Replay hardening оставить, но описывать отдельно.
5. Исправить false-positive employee-capacity harness, расхождение lint, и разнести два файла >300 строк без удаления покрытия.

### Дополнение после параллельной независимой проверки

Дополнительные находки подтверждены повторным чтением runtime; вердикт **FAIL** не меняется:

- `apps/api/src/modules/ai-platform/providers/ai-provider-connection.validate-ops.ts:129-139`, `ai-provider-connection.lock.ts:17-23,41-51` — Chat 7 защищает обычный `validate()` от concurrent disable, но successful key rotation по-прежнему безусловно пишет `lastValidatedAt`. `status` не входит в snapshot revision, поэтому disable между provider preflight и rotation commit не вызывает conflict, а DISABLED connection получает свежий validation timestamp. Самоотчёт «`lastValidatedAt` only while ACTIVE» неверен — **MEDIUM**.
- `apps/api/src/modules/ai-platform/protocol/agent-protocol.invoker.ts:75-85`, `policy/agent-policy.service.ts:57-84` — runtime limiter бросает exception до gateway/policy и никогда не передаёт live `rateLimitExceeded` в Policy Evaluator. J 186 «Evaluate usage/rate limits» остаётся только поддерживаемым DTO/verdict с unit test, но не production integration; J 186 `[x]` завышен — **MEDIUM (checklist honesty)**.
- `apps/api/src/modules/scheduler/scheduler-ai.service.ts:32-48`, `scheduler-lease.service.ts:198-235` — abort signal проверяется только до всего multi-connection sync. При потере lease текущий provider/database цикл продолжает выполнять работу, пока следующий scheduler уже может получить lease; run record станет `TIMED_OUT`, но дублирование side effects не предотвращено. Утверждение handoff, что shared lease исключает double-sync, сильнее фактической гарантии — **MEDIUM**.
- `apps/api/src/modules/ai-platform/mcp/agent-mcp.server.ts:94-105`, `docs/NBOS/02-Modules/21-AI-Platform/21-External-Agent-Client-Setup.md:277,297-305` — MCP преобразует limiter exception в successful HTTP 200 JSON-RPC tool error, поэтому HTTP filter не выставляет `Retry-After`. `retryAfterSeconds` остаётся в structured body, но документация обещает header/429 без оговорки для MCP — **LOW documentation/contract mismatch**.
- `docs/NBOS/00-Technical-Decisions-By-Module.md:86` неверно говорит, что cron работает только при установленном env flag: после initial seed authoritative gate — `SchedulerJobPolicy`, что правильно описано в runbook. `25-AI-Platform-Operations-Runbooks.md:66-68` также обобщает «extend, then enable», хотя persisted `EXPIRED` (и elapsed persisted `ACTIVE`) reactivates при продлении expiry без отдельного `enable` — **LOW documentation mismatch**.

Дополнительные обязательные правки:

6. В `commitRotatedProviderKey` повторно проверять `current.locked.status === 'ACTIVE'` перед secret/timestamp write (либо не ставить `lastValidatedAt` для DISABLED) и добавить concurrent-disable rotation test.
7. Либо передавать реальный limiter verdict в `AgentPolicyService`, либо вернуть J 186 в `[~]`; unit-поддержка поля без production caller не является закрытием пункта.
8. Протянуть `AbortSignal`/fencing ownership внутрь scheduled model sync и проверять его перед каждым provider step и DB commit; добавить lease-loss test, который доказывает отсутствие post-loss writes.
9. Уточнить MCP retry contract и исправить scheduling/expiry формулировки в canonical docs и runbook.

## Remediation (after the FAIL verdict)

All nine required fixes are addressed. Nothing was committed; no migration was created or applied.

| #   | Fix                                                                                                                                                                | Where                                                                                                                                                                                                                                     | Proof                                                                                                                                                                                                                                                                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Bounded **pre-auth** limiter for the agent namespace, ahead of DB/Argon2/logging; the per-agent budget now refuses before the usage write                          | `limits/agent-preauth-throttle.service.ts`, `limits/agent-preauth.guard.ts`, `auth/agent-usage.interceptor.ts`, `auth/agent-auth.guard.ts`, `auth/agent-authenticator.service.ts`, `protocol/agent-protocol.decorators.ts`                | `limits/agent-preauth-throttle.test.ts`, `limits/agent-abuse-controls.http.int.test.ts`: unknown valid-format keys stop reaching the verifier after the ceiling, an exhausted agent writes no further usage rows, and the employee probe answers **200** during an agent flood |
| 2   | The 768 KiB ceiling is enforced on real socket bytes before JSON parsing, and every agent oversize answer is 413 + `AGENT_VALIDATION_FAILED` in the `09` envelope  | `limits/agent-body-limit.middleware.ts` mounted on the agent prefix in `main.ts`, ahead of the global parsers; the guard no longer checks payload size                                                                                    | `limits/agent-body-limit.test.ts`, `limits/agent-abuse-controls.http.int.test.ts` over raw sockets (`test-utils/raw-http-request.ts`): chunked with no `Content-Length`, understated header, the exact boundary, and >1 MiB                                                    |
| 3   | `ai-model-catalog-sync` is dispatchable from the Settings manual runner, as the runbook promises                                                                   | `scheduler/scheduler-job-runner.ts` (`SchedulerJobRunners`, `RUNNABLE_JOB_NAMES`), `scheduler/platform-scheduler-jobs.service.ts`                                                                                                         | `scheduler/scheduler-job-runner.test.ts`: the AI job dispatches to `SchedulerAiService` and reports `canRunNow=true`                                                                                                                                                           |
| 4   | AL 626 back to `[~]`; replay hardening described separately                                                                                                        | `10-Phase-1-…-Implementation.md` AL section                                                                                                                                                                                               | Phase 1 has no queued sensitive action, so there is no pre-commit revalidation point; `AgentReplayAuthorization` stays, documented as its own control                                                                                                                          |
| 5   | Employee-capacity assertion is no longer a false positive; the harness has a real employee Prisma fixture; both >300-line files were split without losing coverage | `limits/agent-rate-limit.http.int.test.ts` (`toBe(200)`), `protocol/agent-protocol.harness.employee.ts`, `agents/external-agent.fixtures.ts` + `agents/external-agent.lifecycle.test.ts`, `scheduler/scheduler-job-catalog.ai.entries.ts` | `pnpm lint` → 0 errors, 12 warnings, none in a file this work touched (the single API warning is pre-existing in `whatsapp-product-groups.worker.ts`)                                                                                                                          |
| 6   | A rotation no longer stamps `lastValidatedAt` on a connection disabled mid-flight                                                                                  | `providers/ai-provider-connection.validate-ops.ts` re-reads the locked status inside the transaction and records `statusAtCommit` in audit                                                                                                | `providers/ai-provider-connection.validate.test.ts` concurrent-disable rotation case                                                                                                                                                                                           |
| 7   | J 186 back to `[~]`                                                                                                                                                | `10-Phase-1-…-Implementation.md` J 186                                                                                                                                                                                                    | Enforcement is deliberately at the limiter, before policy touches the database; passing the verdict into `AgentPolicyService` belongs with the shared counter store, so a field with unit coverage only is not a closed item                                                   |
| 8   | Lease ownership is checked inside the sync, per connection and immediately before each DB commit                                                                   | `scheduler/scheduler-ai.service.ts` passes the lease `signal`; `models/ai-model-sync.service.ts` + `ai-model-sync.types.ts` (`assertSyncOwnership`, `ModelSyncLeaseLostError`)                                                            | `models/ai-model-sync.service.test.ts` lease-loss cases prove no post-loss provider step and no post-loss write; `scheduler/scheduler-ai.service.test.ts` proves the signal is threaded                                                                                        |
| 9   | MCP retry contract and the scheduling/expiry wording corrected                                                                                                     | `21-External-Agent-Client-Setup.md` §5.1, `25-AI-Platform-Operations-Runbooks.md` §1.3 and §4.2, `00-Technical-Decisions-By-Module.md` (Rate limits, Expiry, Scheduling)                                                                  | MCP per-message refusals are documented as a JSON-RPC tool error inside HTTP 200 carrying `retryAfterSeconds`; the cron gate is `SchedulerJobPolicy` after seed; a timed-out agent returns to service on expiry extension, only a disabled one needs extend-then-enable        |

Checks run for this remediation:

| Check                                             | Result                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vitest run` (default config)                     | 843 files, **4277 passed**, 4 skipped                                                                                                                                                                                                                                                                                                  |
| `vitest run --config vitest.regression.config.ts` | 22 files, **284 passed**                                                                                                                                                                                                                                                                                                               |
| `tsc --noEmit` (`apps/api`)                       | clean (needs `--max-old-space-size=8192`; the turbo task OOMs at the default heap on this machine)                                                                                                                                                                                                                                     |
| `pnpm lint`                                       | 0 errors, 12 warnings (11 web, 1 pre-existing API)                                                                                                                                                                                                                                                                                     |
| Process boot                                      | **Not obtained.** `dist/main.js` reaches Nest init and then fails on the dev database with Prisma `P1000` / `28P01` `password authentication failed for user 'neondb_owner'`. The local credential no longer authenticates; no credential was invented or changed. Boot evidence needs a working dev `DATABASE_URL` from the developer |

## Verification after remediation (Chat 7)

- Проверял: **GPT-5.6 Sol**, 2026-08-22.
- Вердикт: **FAIL** — пункты 1–7 и 9 фактически закрыты, но пункт 8 всё ещё не даёт заявленной fencing-гарантии.
- Git: ветка `sipan`, `HEAD 5fe73e50d2e3944531f7b0a36d8f66a8be3056d3`; remediation не закоммичен, staged/deleted файлов нет; `git diff --check 5fe73e50` чист.
- Запущено повторно и независимо:
  - `pnpm test` → **843 passed + 2 skipped files**, **4277 passed + 4 skipped tests**;
  - `pnpm test:regression` → **22 files / 284 tests passed**;
  - `NODE_OPTIONS=--max-old-space-size=8192 pnpm --filter @nbos/api typecheck` → exit 0;
  - `pnpm lint` → exit 0, **12 warnings** (11 web + 1 API в неизменённом `whatsapp-product-groups.worker.ts`);
  - `pnpm exec prisma migrate status` из `packages/database` → status не прочитан: **P1000**, локальный dev credential не проходит PostgreSQL authentication; миграции не применялись;
  - `git diff --check 5fe73e50` → exit 0;
  - размеры после split подтверждены: `scheduler-job-catalog.entries.ts` **292**, `external-agent.service.test.ts` **197**, `external-agent.lifecycle.test.ts` **127** строк.
- Подтверждено кодом и тестами:
  - pre-auth guard идёт до auth/Argon2, post-auth budget — до usage interceptor; employee probe теперь требует HTTP 200;
  - agent-scoped parser ограничивает фактически прочитанные bytes и raw-socket tests закрывают chunked/missing/understated length и boundary;
  - manual runner allowlist и dispatch в `SchedulerAiService` существуют;
  - AL 626 и J 186 честно возвращены в `[~]`;
  - concurrent-disable rotation не ставит `lastValidatedAt`;
  - MCP/scheduling/expiry документация приведена к runtime.
- Найденный блокирующий дефект:
  - `apps/api/src/modules/ai-platform/models/ai-model-sync.service.ts:64-70,87-95,98-131`, `models/ai-model-sync.service.test.ts:127-160` — `AbortSignal` проверяется перед connection loop и после provider call, но **не проверяется и не fencing-валидируется внутри Prisma transaction**. Lease может быть потерян после `assertSyncOwnership(signal)` на строке 94 либо во время `tx.aiModel.findMany()` на строках 105–109; после этого строки 111–119 всё равно выполняют model/connection/audit writes. Тест “lost during provider call” фактически вызывает `abort()` внутри `credentialsForActive`, до provider call, и проверяет только отсутствие самого `$transaction`; race после входа в transaction не покрыт. Поэтому доказательства «нет post-loss writes» и «shared lease исключает double-sync» нет — **MEDIUM**.
- Незакрытые LOW:
  - `scheduler-job-runner.test.ts` проверяет allowlist/dispatch, но первоначально требовавшегося service/HTTP test для `PlatformSchedulerJobsService.runJobNow` нет; runtime wiring читается корректным, однако database-backed путь не проверен;
  - `ai-provider-connection.service.ts:103-158` всё ещё содержит production-функцию на 56 строк, а `limits/agent-rate-limit.service.ts:87` — magic literal `now + 1`.
- Не проверено: API/worker/scheduler boot и database-backed manual-run HTTP path из-за P1000; актуальный migration status по той же причине; live providers, Redis-ready worker, browser E2E и multi-instance limiter.

### Оставшиеся обязательные правки

1. Сделать lease ownership настоящим DB fencing-control: перед model/connection/audit writes проверять `ownerId` + `fencingToken` в **той же transaction** с блокировкой lease row (либо эквивалентным атомарным условием), чтобы новый владелец не мог начать commit параллельно со старым.
2. Добавить race-test: ownership/abort меняется после начала `$transaction` и до первого write; ни `aiModel.create/update`, ни `markModelSync`, ни audit не вызываются.
3. Добавить service/HTTP test ручного `ai-model-catalog-sync` через `PlatformSchedulerJobsService.runJobNow`.
4. Разнести оставшуюся 56-строчную production-функцию и заменить `now + 1` именованной retry-константой.

## Remediation round 2 (lease fencing)

| #   | Fix                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Where                                                                                                                                                                                                          | Proof                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Lease ownership is a database fencing control, not an in-memory signal. The scheduler hands the sync a `ModelSyncOwnership` probe; the sync runs it as the **first statement of the write transaction**, and it selects the `scheduler_leases` row `FOR UPDATE` for this `owner_id` + `fencing_token` against `clock_timestamp()`. While that lock is held, `SchedulerLeaseService.acquire` cannot take the job over — its `ON CONFLICT DO UPDATE` waits for the same row — and a run whose lease was already taken matches nothing and aborts before any write | `scheduler/scheduler-lease.fence.ts` (new), `scheduler/scheduler-ai.service.ts`, `models/ai-model-sync.types.ts` (`ModelSyncOwnership`, `assertSyncOwnershipInTransaction`), `models/ai-model-sync.service.ts` | `scheduler/scheduler-lease.fence.test.ts`: matches on owner + token, locks the row, uses `clock_timestamp()` rather than `now()`; `scheduler-ai.service.test.ts`: the probe carries this run's job name, owner and token                                                                                                                                                                                                                            |
| 2   | Race test for a takeover **after** the transaction opened                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `models/ai-model-sync.service.test.ts`                                                                                                                                                                         | `abandons the transaction when ownership is lost after it opened`: the signal still reports the lease as held and only the transaction probe sees the takeover; no `aiModel.create`/`update`, no `markModelSync`, no audit, and not even the `findMany` read. A second case pins the ordering — the probe runs before any read or write. The old "lost during provider call" case now aborts inside `listModels`, so it really is the provider step |
| 3   | Manual run covered at service level                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | `scheduler/platform-scheduler-jobs.service.test.ts`                                                                                                                                                            | `runJobNow` dispatches `ai-model-catalog-sync` to `SchedulerAiService` with the `manual_admin` trigger, audits it with the acting employee, and refuses an unknown job before any dispatch or audit. Every catalog-visible job now has a runner, so the "cannot be run from Settings" branch is covered by `scheduler-job-runner.test.ts` instead                                                                                                   |
| 4   | Size and magic literal                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `providers/ai-provider-connection.rules.ts` (`resolveProviderConnectionUpdate`), `limits/agent-rate-limit.constants.ts` (`AGENT_CONCURRENCY_RETRY_HINT_MS`)                                                    | `update()` is now 22 lines; the field resolution is a pure function with its own reason for existing; the concurrency back-off hint is a named constant                                                                                                                                                                                                                                                                                             |

Employee-triggered sync passes no ownership probe on purpose: it is authorized by the request, not
by a lease, and has no successor to be fenced against. A test pins that too.

Checks after round 2:

| Check                                             | Result                                                                                                               |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `vitest run` (default config)                     | 844 files passed + 2 skipped, **4287 passed**, 4 skipped                                                             |
| `vitest run --config vitest.regression.config.ts` | 22 files, **284 passed**                                                                                             |
| `tsc --noEmit` (`apps/api`)                       | clean with `--max-old-space-size=8192`                                                                               |
| `pnpm lint`                                       | 0 errors, 12 warnings (11 web, 1 pre-existing API)                                                                   |
| Process boot and `migrate status`                 | Still blocked on the dev database credential (`P1000` / `28P01`). Unchanged from round 1: no credential was invented |

## Verification after remediation round 2 (Chat 7)

- Проверял: **GPT-5.6 Sol**, 2026-08-22.
- Вердикт: **PASS WITH DEBTS**.
- Запущено повторно и независимо:
  - `pnpm test` → **844 passed + 2 skipped files**, **4287 passed + 4 skipped tests**;
  - `pnpm test:regression` → **22 files / 284 tests passed**;
  - `NODE_OPTIONS=--max-old-space-size=8192 pnpm --filter @nbos/api typecheck` → exit 0;
  - `pnpm lint` → exit 0, прежние **12 warnings** (11 web + 1 API), в изменённых файлах warnings нет;
  - `pnpm exec prisma migrate status` → **P1000**, status не прочитан; миграции не применялись;
  - `git diff --check 5fe73e50` → exit 0.
- Подтверждено:
  - `isSchedulerLeaseHeld` параметризованно проверяет `job_name + owner_id + fencing_token + lease_until > clock_timestamp()` и берёт matched lease row `FOR UPDATE`;
  - probe вызывается первым statement внутри model write transaction; takeover либо уже виден и transaction завершается до catalog reads/writes, либо ждёт освобождения lease-row lock и не коммитит параллельно;
  - abort во время `listModels` и потеря ownership после открытия transaction покрыты отдельно; model/connection/audit writes при отказе probe отсутствуют;
  - manual Settings dispatch покрыт на уровне `PlatformSchedulerJobsService`, включая actor audit и отказ до dispatch;
  - production-функция `update()` сокращена, `now + 1` заменён именованной константой; документация синхронизирована.
- Расхождения с remediation-самоотчётом: **нет существенных**; заявленные test/lint/typecheck числа подтверждены.
- Найденные дефекты: **новых actionable-дефектов в проверенном scope не найдено**.
- Долги:
  - выполнить реальный PostgreSQL concurrency test `old fenced transaction ↔ successor acquire`, а не только unit-проверку SQL/порядка вызовов;
  - после выдачи рабочего dev `DATABASE_URL` снять boot-доказательство для API/worker/scheduler и повторить `prisma migrate status`.
- Не проверено: реальный database lock contention и process boot из-за P1000; production/Redis/multi-instance поведение, browser E2E и live providers.

## Debt work prepared (awaiting a database)

The first debt now has its test written and waiting for a database rather than waiting for someone
to write it: `scheduler/scheduler-lease.fence.int.test.ts` follows the existing opt-in convention
(`AI_PLATFORM_DB_TEST_URL`, the same switch `ai-platform/credentials/agent-credential.concurrency.int.test.ts`
uses) and skips without it, so it costs nothing in CI today.

It proves the contention itself, not the SQL: owner A acquires a short lease and opens a transaction
that fences on its lease row; the lease is allowed to expire while the transaction stays open; owner
B's `acquire` is then started and asserted to be **still pending** while A holds the row; after A
commits, B takes over with `fencingToken + 1`, and A's token no longer matches. A second case covers
an expired lease that nobody took over — the old owner is refused all the same.

To discharge the debt, point `AI_PLATFORM_DB_TEST_URL` at a disposable database with the migrations
applied and run the scheduler suite.

## Debts discharged against the dev database (2026-08-22)

The developer supplied a working dev `DATABASE_URL` (Neon dev branch), so the DB-dependent evidence
was collected. No migration was applied and no data was deleted.

| Debt                                                                     | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Real PostgreSQL contention, `old fenced transaction ↔ successor acquire` | `AI_PLATFORM_DB_TEST_URL=$DATABASE_URL vitest run scheduler-lease.fence.int.test.ts` → **2 passed**. Owner B's `acquire` was asserted **still pending** while owner A held the lease row in an open transaction with the lease already expired; after A committed, B took over with `fencingToken + 1` and A's token stopped matching. The test uses only `scheduler_leases`, generates its own job names and deletes them (verified: 0 leftover `fence-probe-%` rows) |
| The test is not vacuous                                                  | Negative control: `FOR UPDATE` was temporarily removed from `isSchedulerLeaseHeld`, the same run **failed** on `expected false to be true` at the pending assertion — the successor acquired the lease immediately. The line was restored and the suite re-run green                                                                                                                                                                                                   |
| `prisma migrate status`                                                  | Reachable now. The dev branch is **4 migrations behind** local history (`20260821150000_audit_actor_aware`, `20260821170000_ai_external_agent_foundation`, `20260821190000_ai_domain_capabilities`, `20260822010000_ai_provider_model_internal_agent`) and reports 4 database-side migrations absent locally, i.e. pre-existing drift on this branch. **Nothing was applied** — that decision is the developer's                                                       |
| API boot                                                                 | `PROCESS_ROLE=api node --import tsx dist/main.js` → `Nest application successfully started`; `GET /api/health` → 200. The agent surface answers in the `09` envelope: `GET /api/v1/agent/me` without a key and with a malformed key → **401 `AGENT_AUTH_INVALID`**; a 900 KB body → **413 `AGENT_VALIDATION_FAILED`** both with `Content-Length` and with `Transfer-Encoding: chunked`, which is the round-1 body-limit fix confirmed at runtime                       |
| Scheduler boot                                                           | `PROCESS_ROLE=scheduler SCHEDULER_ENABLED=true node --import tsx dist/scheduler.js` → `Registered cron ai-model-catalog-sync (0 */6 * * *)`, `Nest application successfully started`, and the job appears in `jobRegistry`/`nestCrons`. The runtime gate stays `SchedulerJobPolicy`, as documented                                                                                                                                                                     |
| Worker boot                                                              | **Not obtained.** The worker refuses to start without `REDIS_QUEUE_URL`/`REDIS_URL`, which this environment has not configured. That is the documented contract, not a defect, but the worker boot proof still needs a Redis endpoint                                                                                                                                                                                                                                  |

Both probe processes were stopped afterwards. Remaining: applying the 4 pending migrations to the dev
branch (developer decision, and the audit backfill among them is the C14 item that needs a window in
production), a Redis endpoint for the worker boot proof, and multi-instance limiter behaviour.

## Verification after dev-database evidence (Chat 7)

- Проверял: **GPT-5.6 Sol**, 2026-08-22.
- Вердикт: **PASS WITH DEBTS**; новых code defects не найдено.
- Запущено независимо:
  - `AI_PLATFORM_DB_TEST_URL=$DATABASE_URL pnpm vitest run apps/api/src/modules/scheduler/scheduler-lease.fence.int.test.ts` → **1 file / 2 tests passed**;
  - полный scheduler scope без opt-in env → **16 passed + 1 skipped files**, **91 passed + 2 skipped tests**;
  - `pnpm exec prisma migrate status` → база доступна, **213 local migrations**; четыре local migrations ещё не применены;
  - read-only запрос после fencing suite → `fence-probe-%` rows: **0**;
  - `pnpm --filter @nbos/api build` → **1816 files compiled**;
  - API boot → `Nest application successfully started`, `/api/health` → **200**, `/api/v1/agent/me` без ключа → **401 `AGENT_AUTH_INVALID`** в `09` envelope;
  - scheduler boot с `PROCESS_ROLE=scheduler SCHEDULER_ENABLED=true` → `ai-model-catalog-sync (0 */6 * * *)` зарегистрирован, Nest application started;
  - API и scheduler после проверки остановлены;
  - `git diff --check 5fe73e50` → exit 0.
- PostgreSQL fencing подтверждён фактически: successor `acquire` остаётся pending, пока предыдущая write transaction держит lease row; после commit получает следующий fencing token, предыдущий owner/token больше не проходит probe.
- Уточнение к самоотчёту о migration drift:
  - Prisma действительно выводит четыре database-side записи, отсутствующие локально;
  - это **четыре rolled-back migration attempts с `applied_steps_count=0`**, а не четыре успешно применённые schema migrations;
  - уникальных имён три; `20260331180000_restore_products_extensions` записана дважды с разными checksum;
  - следовательно, это drift migration history/metadata, но данная выборка не доказывает schema drift от этих четырёх попыток.
- Оставшиеся долги/решения:
  - worker boot не проверен без `REDIS_QUEUE_URL`/`REDIS_URL`;
  - решить отдельно, применять ли четыре pending Phase 1 migrations на dev; `audit_actor_aware` не применять автоматически;
  - аккуратно согласовать rolled-back remote-only records с canonical migration history; не удалять и не помечать их вручную без отдельного migration-reconciliation плана;
  - multi-instance limiter, browser E2E и live providers остаются за следующими этапами.

## Debts discharged with local Redis and migrate deploy (2026-08-22)

OrbStack was stopped; Redis was not listening and the existing `bos-postgres` container was exited. Both were started. A disposable `nbos-redis` was created on host `6379`. Local `.env.local` now points `REDIS_URL` at that instance (not committed).

| Debt | Evidence |
| ---- | -------- |
| Worker boot | `PROCESS_ROLE=worker` with local Redis → `/health` **200** `{ status: ok, role: worker }`; `/ready` **200** `{ ready: true, workers: [drive.zip-export-jobs, mail, reports.export-jobs, whatsapp.product-groups] }`. Process stopped afterwards |
| Four pending Phase 1 migrations on Neon **dev** | `prisma migrate deploy` applied `20260821150000_audit_actor_aware`, `20260821170000_ai_external_agent_foundation`, `20260821190000_ai_domain_capabilities`, `20260822010000_ai_provider_model_internal_agent`. Follow-up `prisma migrate status` → **Database schema is up to date**. Rolled-back remote-only rows were left as historical metadata; they did not block deploy |
| Local `bos-postgres` on host `5433` | Started so the machine has a local Postgres again. It is a two-week-old `bos` snapshot, **not** the Neon history, so it was not migrated and not used as the worker datasource |

Remaining out of Chat 7: multi-instance limiter, browser E2E, live providers, and a worker boot that uses a production-shaped Redis (TLS), which this local instance is not.
