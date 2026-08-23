# Phase 1 Chat 5 Handoff — Providers, Models and Internal-Agent Foundation

> Next chat must verify this evidence against the repository. Do not trust the summary blindly.

## Milestone

Chat 5 of `16-Phase-1-Execution-Strategy.md`. Independent recheck (GPT-5.6 Sol) returned **FAIL**. The eight listed remediations are now in the working tree (see `## Remediation after FAIL`). No product commit has been made.

Completed: the provider/model/Internal Agent foundation. OpenAI and Anthropic sit behind one adapter interface. Provider API keys use the existing AES-256-GCM stack (`crypto.ts` + `CREDENTIALS_ENCRYPTION_KEY`) in a dedicated `ai_provider_secrets` table. The model catalog syncs without auto-activation. FIXED and PRIMARY_FALLBACK Model Policies accept same- and cross-provider candidates. Internal Agents are a stable identity with lifecycle, grant/scope linkage, Model Policy assignment, and prompt/approval contracts.

This chat does **not** add Settings/Admin UI (Chat 6), does not reshape the Chat 4 REST/MCP contract, and does not implement adaptive routing, prompt-version runtime, context assembly, or production execution.

## Checklist

Y–AC after this chat, plus the Chat 2 audit emitters that belonged to these entities.

- Y 383–395 `[x]`. Generic `AiProviderConnection`; `OPENAI` and `ANTHROPIC`; multiple connections per provider (no unique on provider type); name/status/createdBy; optional organization/project/`baseUrl` (HTTPS + official host allowlist only); `lastValidatedAt` / `lastModelSyncAt`; enable/disable/revoke; `AiProviderAdapter` interface; business modules never import a provider SDK.
- Z 396–405 `[x]`. Secret store uses existing `encrypt`/`decrypt`. Views, validate results and Audit `changes` never contain `apiKey` / `encryptedApiKey`. Rotate replaces the ciphertext and resets `lastValidatedAt`. Revoke deletes the secret row. Isolation test proves REST/MCP/registry do not import the store.
- AA 406–429 `[x]`. Catalog entity with stable UUID + `providerModelId`. All five statuses. OpenAI + Anthropic list sync. Manual `syncConnection` uses an employee actor. Scheduled path is `runScheduledCatalogSync` (SYSTEM actor, machine audit, continue-on-error). Nest `SchedulerService` catalog registration is still deferred. New/returning models stay `DISCOVERED`. Disappeared `DISCOVERED`/`ACTIVE` become `UNAVAILABLE`; `DISABLED`/`DEPRECATED` are kept. Provider metadata and suitability tags are separate columns.
- AB 430–447 `[x]`. Policy + candidates. FIXED and PRIMARY_FALLBACK. Enabled PRIMARY must have the lowest enabled priority. Same- and cross-provider. Admin write rejects DISCOVERED enabled candidates. Runtime resolve skips temporarily unavailable fallbacks and does not call `requireActive` candidate assertion. Version increments on candidate replace. Resolver passes `operationKey` through unchanged. `TIERED`/`ADAPTIVE` exist on the enum and are rejected at the service. No learned router.
- AC 448–469 `[x]`. Internal Agent entity, owner, DRAFT/ACTIVE/PAUSED/DISABLED/ARCHIVED. Grants/scopes include `revokeScope`. Model Policy FK cannot be cleared while ACTIVE (checked after row lock). Opaque `promptPolicyId` / `approvalPolicyId`. Surface assignment with `messenger` as a first-class ActorContext channel. `onBehalfOf` on the execution context builder. Model-policy change does not write grant tables. Activation and policy replace revalidate a production-eligible PRIMARY. Pause/disable/archive block `assertInternalAgentCanExecute`. Archive keeps the row for Audit display names.

Chat 2 audit debts closed here:

- **D 86 `[~]` → `[x]`** — provider connection lifecycle (`PROVIDER_CONNECTION_*`, `PROVIDER_KEY_ROTATED`).
- **D 87 `[~]` → `[x]`** — model activate/disable/update.
- **D 88 `[~]` → `[x]`** — model policy create/update/activate/disable.
- **D 89 `[~]` → `[x]`** — Internal Agent lifecycle.

Still open, deliberately not touched: **J 186** `[~]`, **K 205** `[~]` / **W 368** `[~]`, **K 209** `[~]`, **D 91** `[~]` (approvals), AD–AJ, U, Admin UI.

No open `[!]` BUSINESS DECISION.

## Files / modules changed

New Prisma schema (additive):

| Area            | Path                                                                |
| --------------- | ------------------------------------------------------------------- |
| Providers       | `packages/database/prisma/schema/ai-providers.prisma`               |
| Internal Agents | `packages/database/prisma/schema/ai-internal-agents.prisma`         |
| Employee FKs    | `packages/database/prisma/schema/employees.prisma` (relations only) |

New under `apps/api/src/modules/ai-platform/`:

| Area        | Path                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------ |
| Adapters    | `providers/ai-provider.types.ts`, `openai.adapter.ts`, `anthropic.adapter.ts`, registry    |
| Secrets     | `providers/ai-provider-secret.store.ts`, `ai-provider-key.ts`                              |
| Connections | `providers/ai-provider-connection.service.ts` + rules/mapper/lock                          |
| Catalog     | `models/ai-model-sync.service.ts`, `ai-model-catalog.service.ts`, `ai-model-sync.rules.ts` |
| Schedule    | `models/ai-model-catalog.contract.ts`                                                      |
| Policies    | `policies/ai-model-policy.service.ts`, `ai-model-policy.resolver.ts`, rules/mapper         |
| Internal    | `internal-agents/internal-agent.service.ts`, grant service, execution, row-lock, mapper    |

Shared:

| Area  | Path                                                                                           |
| ----- | ---------------------------------------------------------------------------------------------- |
| Types | `packages/shared/src/ai/provider-types.ts`, `model-policy-types.ts`, `internal-agent-types.ts` |
| Actor | `actorContextFromInternalAgent`; `ACTOR_CHANNELS` gains `messenger`                            |

Modified: `ai-platform.module.ts` (providers + Internal Agent display-name lookup), `ai-platform.constants.ts`, `mock-prisma.ts`.

REST/MCP/protocol files were **not** changed. `21-External-Agent-Client-Setup.md` was **not** overwritten.

## Migrations

**One additive migration**, applied with `prisma migrate deploy` against dev Neon `ep-late-frost-ag5aixzw` only.

- Directory: `packages/database/prisma/migrations/20260822010000_ai_provider_model_internal_agent/`
- Risk: **LOW** — new empty tables and enums only. No existing table rewritten. No data deleted.
- `prisma migrate status` after deploy: **213** migrations, `Database schema is up to date!`
- `prisma migrate dev` was not run. Production (`ep-sweet-dew-ag7259wn`) was not contacted.

`prisma migrate diff --from-config-datasource` against the live DB also proposed unrelated enum/index drift (DealType, search vectors, renamed indexes). That drift is pre-existing and was **not** included. The checked-in SQL is hand-written additive-only.

## Tests run

```text
pnpm vitest run
→ 798 files passed + 2 skipped, 4036 tests passed + 4 skipped
  (Chat 4 verification baseline was 782 / 3978; first Chat 5 self-report was 796 / 4020)

pnpm vitest run apps/api/src/modules/ai-platform
→ 53 files passed + 2 skipped, 466 tests passed + 4 skipped
  (first Chat 5 self-report was 51 / 450)

pnpm vitest run (Chat 5 targeted suites after FAIL remediations)
→ 17 files passed, 68 tests passed

pnpm --filter @nbos/api exec tsc --noEmit
→ exit 0 (NODE_OPTIONS=--max-old-space-size=8192)
pnpm --filter @nbos/shared exec tsc --noEmit → exit 0
pnpm --filter @nbos/database exec tsc --noEmit → exit 0
pnpm --filter @nbos/database exec prisma validate → schemas valid

eslint on Chat 5 paths → 0 errors, 0 warnings
```

Per new suite (targeted run):

| Suite                                    | What it holds down                                                                                       |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `ai-provider-connection.service.test.ts` | create/rotate/validate/revoke; no key in view or audit                                                   |
| `ai-provider-key.test.ts`                | prefix ≠ raw key; secret-field redaction                                                                 |
| `openai.adapter.test.ts`                 | list/validate/401; redirect blocked; private baseUrl refused                                             |
| `anthropic.adapter.test.ts`              | pagination + bounded validate                                                                            |
| `ai-provider-isolation.test.ts`          | no provider capability; REST/MCP do not import the secret store                                          |
| `ai-model-sync.rules.test.ts`            | discover / refresh / disappear / no auto-activate                                                        |
| `ai-model-sync.service.test.ts`          | new rows DISCOVERED; SYSTEM runner continues after one failure                                           |
| `ai-model-catalog.service.test.ts`       | explicit activate; real `logAdminAction`; UNAVAILABLE refused                                            |
| `ai-model-policy.service.test.ts`        | FIXED, cross-provider PRIMARY_FALLBACK, inverted/disabled-primary deny, version++, real `logAdminAction` |
| `ai-model-policy.rules.test.ts`          | PRIMARY lowest enabled priority; inverted/duplicate/disabled-primary                                     |
| `ai-model-policy.resolver.test.ts`       | real policy service; unavailable/DISCOVERED fallback skipped; `requireActive` not called                 |
| `internal-agent.service.test.ts`         | DRAFT create; activate needs policy; ACTIVE cannot drop policy under lock; model change ≠ grants         |
| `internal-agent-grant.service.test.ts`   | grant/list/revoke/re-grant scopes; archived deny                                                         |
| `ai-provider-url.test.ts`                | HTTPS allowlist; http/userinfo/private/off-list deny                                                     |
| `internal-agent-execution.test.ts`       | pause/disable block; INTERNAL_AI + onBehalfOf; `userId` null                                             |
| `provider-types.test.ts` / actor helper  | production-assignable, Phase 1 modes, messenger channel                                                  |

Not run: production migration, Admin UI, live OpenAI/Anthropic keys, Nest scheduler catalog registration, opt-in real-DB suites.

## Architecture decisions

1. **One adapter interface, two HTTP adapters.** No official OpenAI/Anthropic SDK. `fetch` is injected so tests never hit the network. Business modules depend on `AiProviderAdapter`.
2. **Secrets are a separate table.** Mail already does this. A connection `findMany` cannot accidentally select ciphertext. Revoke deletes the secret row.
3. **Reuse `crypto.ts`.** Not a second stack. Same `CREDENTIALS_ENCRYPTION_KEY` / AES-256-GCM v2 as Credentials and Mail.
4. **Discovery is not activation.** Insert `DISCOVERED`. Returning from `UNAVAILABLE` goes back to `DISCOVERED`, never `ACTIVE`.
5. **Disappear does not delete.** `DISCOVERED`/`ACTIVE` → `UNAVAILABLE`. Admin `DISABLED`/`DEPRECATED` stay so operator intent is not overwritten.
6. **TIERED/ADAPTIVE are enum-only.** Service rejects them. No learned router.
7. **Internal grants are the same architecture, not the same table.** Changing External Agent grant FKs would be a breaking Chat 2 migration. Internal tables use the same capability keys, scope types, grant rules and policy vocabulary.
8. **Prompt/approval IDs are opaque strings.** AD/AF tables do not exist yet. Activation does not require them. It does require an active Model Policy with production-eligible candidates.
9. **Scheduled sync is a typed SYSTEM runner, not a Nest catalog entry.** `runScheduledCatalogSync` uses `actorContextFromMachine({ type: 'SYSTEM' })` and `logMachineAction`. One failed connection does not stop the others. Nest catalog registration is still deferred so `scheduler.service.ts` is not grown; Chat 7 binds `AI_MODEL_CATALOG_SYNC_CONTRACT.runnerMethod` with `rosterIntent=off`.
10. **`messenger` is an ActorChannelSource.** Mapping Messenger surface to `web` would have falsified provenance.

## Canon / runtime conflicts

| ID                                       | Classification | Resolution in Chat 5                                                                        |
| ---------------------------------------- | -------------- | ------------------------------------------------------------------------------------------- |
| Live DB vs repo schema drift             | OK             | Diff proposed DealType/search-vector/index churn. Not ours. Hand-written additive SQL only. |
| `09` / Chat 4 protocol                   | OK             | Untouched. No new external capability.                                                      |
| Scheduler catalog for AA 420             | PARTIAL        | SYSTEM runner + continue-on-error exist. Nest cron/catalog not registered.                  |
| AD Prompt Version / AE Context Assembler | OK             | Linkage contracts only, as scoped.                                                          |
| J 186 / K 205 / K 209                    | PARTIAL        | Unchanged.                                                                                  |

## Decisions taken in this chat (no developer stop)

1. **HTTP timeout 15s** (`AI_PROVIDER_HTTP_TIMEOUT_MS`) — same family as Mail R2 GET. Model-list is not a chat completion.
2. **Scheduled cadence `0 */6 * * *`** — catalogs change slowly; default remains disabled until env is set.
3. **No live provider validate on create** — create stores the key; Validate is an explicit action so tests and offline admin do not require a network call.
4. **Key never echoed on create/rotate** — admin already typed it; response is prefix-only.
5. **Internal grant tables instead of generalizing External ones** — expand-safe, same evaluator vocabulary.
6. **UNAVAILABLE → DISCOVERED on reappear** — never silent-promote to ACTIVE.

## Known risks

1. **Scheduled job is not in the Nest catalog.** Until Chat 7 binds it, only manual `syncConnection` or an explicit `runScheduledCatalogSync()` call run.
2. **No live OpenAI/Anthropic call** in CI. Adapters are tested with mocked `fetch`.
3. **K 209 / J 186 / K 205** remain from earlier chats.
4. **Live Neon has schema drift vs repo Prisma** outside this slice. Future `migrate diff --from-config-datasource` will keep proposing unrelated changes. Do not fold them into an AI migration.
5. **Admin UI is absent.** Services are callable; Chat 6 must not invent a second grant or secret path.
6. **Internal Agent execution is a gate, not a runtime.** No employee chat, no Messenger auto-reply, no RAG.

## Chat 6 entry point

Do **not** start Chat 6 until a verification chat re-reads the FAIL remediations and the product is committed.

| Debt                      | Why it is still open                                               |
| ------------------------- | ------------------------------------------------------------------ |
| J 186 `[~]`               | Rate-limit counters/windows are section U                          |
| K 205 `[~]` / W 368 `[~]` | Output schema validator                                            |
| K 209 `[~]`               | Domain commit and idempotency `complete()` split                   |
| D 91 `[~]`                | Approval lifecycle emitters                                        |
| AA 420 Nest catalog       | SYSTEM runner exists; Nest bind is Chat 7 with `rosterIntent=off`  |
| Admin UI                  | Entire Chat 6 scope                                                |
| Live provider keys        | Do not invent; ask for test keys if a real validate/sync is needed |

1. Read this handoff including `## Remediation after FAIL` and the GPT-5.6 Sol FAIL section, then `07-AI-Admin-and-Connections-UX.md` and checklist AJ–AK.
2. Chat 6 is **Settings → AI & Agents UI** plus contextual Workspace AI Access. Call the services in this chat. Do not add a second secret store or a second grant table.
3. Never redisplay a provider key or External Agent token after save.
4. Do not change REST/MCP routes, tool names, error codes or envelopes.
5. DISCOVERED models must render separately from ACTIVE. Sync must not auto-activate.
6. Internal Agent create starts in DRAFT. Activation must go through `InternalAgentService.activate`.
7. Reuse `revokeScope`, the ACTIVE-policy lock, and the HTTPS `baseUrl` allowlist — do not re-open those holes in the UI layer.

## Verification (Chat 5)

- Проверял: Cursor Grok 4.6, 2026-08-22. Код не менялся, коммита нет, миграции не применялись, прод Neon не открывался.
- Вердикт: **PASS WITH DEBTS**.
- Git:
  - ветка `sipan`;
  - `HEAD 532d4865a3938d20189a806a3ef091febca74f8b` (`docs(ai): update Phase 1 Chat 5 handoff and checklist`) — это **не** продукт Chat 5, а docs-коммит `ai-modul-steps.md` после Chat 4 (`7eebbe41`);
  - staged нет; дерево **не чистое**, как и заявлено («No commit was made» относится к продукту): 15 modified tracked + 48 untracked (providers/models/policies/internal-agents + Prisma + shared types + handoff);
  - все заявленные пути существуют; `git diff --diff-filter=D HEAD` пуст — тесты не удалялись;
  - REST/MCP/protocol/gateway, `package.json` / lock, `app.module.ts`, `21-External-Agent-Client-Setup.md` не менялись.
- Запущено (миграции не применялись; `migrate deploy` / `migrate dev` не вызывались):
  - `.env.local` `DATABASE_URL` / `DIRECT_URL` → host `ep-late-frost-ag5aixzw` (не прод `ep-sweet-dew-ag7259wn`);
  - `pnpm --filter @nbos/database exec prisma migrate status` → datasource `ep-late-frost-ag5aixzw.c-2.eu-central-1.aws.neon.tech`, **213** migrations, `Database schema is up to date!`;
  - `pnpm vitest run` (targeted Chat 5: providers + models + policies + internal-agents + `provider-types.test.ts` + `normalize-actor-context.test.ts`) → **15 passed**, **52 passed**;
  - `pnpm vitest run apps/api/src/modules/ai-platform` → **51 passed | 2 skipped**, **450 passed | 4 skipped**;
  - `pnpm vitest run` → **796 passed | 2 skipped**, **4020 passed | 4 skipped**;
  - `NODE_OPTIONS=--max-old-space-size=8192 pnpm --filter @nbos/api exec tsc --noEmit` → exit 0 (52.3s);
  - `pnpm --filter @nbos/shared exec tsc --noEmit` и `pnpm --filter @nbos/database exec tsc --noEmit` → exit 0;
  - targeted `eslint` по путям Chat 5 → 0 errors / 0 warnings.
- Расхождения с самоотчётом:
  - числа vitest (15/52, 51/450, 796/4020), isolated API tsc, eslint и migrate status (213, up to date) **подтверждены**;
  - «No commit was made» верно для продукта Chat 5; текущий HEAD — docs-коммит `532d4865`, не `7eebbe41`;
  - в секции Files не перечислены doc-sync (`00-Documentation-Hub.md`, `00-Implementation-Roadmap.md`, `00-Technical-Decisions-By-Module.md`, `99-AI-Cleanup-Register.md`) — это ожидаемый sync, не скрытый продукт;
  - turbo typecheck `--force` вместе с web **не перепроверялся** (handoff сам пишет OOM); независимо подтверждён isolated `tsc`.
- Найденные дефекты:
  - `apps/api/src/modules/ai-platform/internal-agents/internal-agent.service.ts:74-91` — `update` может записать `modelPolicyId: null` у **ACTIVE** агента (`if (input.modelPolicyId)` не проверяет снятие). `assertInternalAgentCanExecute` смотрит только статус. Инвариант «activation requires an active policy» держится только на `activate`, не на последующем update — **Medium**;
  - `apps/api/src/modules/ai-platform/internal-agents/internal-agent-grant.service.ts` — есть `grantScope` / `listScopes`, нет `revokeScope` (у External он есть). AC 456 `[x]` слегка завышен: capability revoke есть, scope revoke нет; `grantScope` без теста — **Medium**;
  - `apps/api/src/modules/ai-platform/providers/ai-provider-connection.rules.ts:61-63` — `baseUrl` принимает `http:` и любой host (loopback / link-local не режутся). Публичного HTTP ещё нет, но сервис экспортирован; до UI Chat 6 это SSRF-поверхность — **Medium**;
  - `apps/api/src/modules/ai-platform/models/ai-model-sync.service.ts:45-50` — `syncAllEnabledConnections` останавливается на первой ошибке, остальные ACTIVE-коннекты не синкаются. Nest cron ещё не привязан — **Low**;
  - `apps/api/src/modules/ai-platform/models/ai-model-catalog.service.test.ts:51` и `policies/ai-model-policy.service.test.ts:135` — D 87/88 в тестах проверяют строку константы, а не вызов `logAdminAction`. Код пишет audit; покрытие слабее, чем у provider create/rotate — **Low**.
- Честность чеклиста (independently):
  - Y 383–395, Z 396–405, AA 406–419/421–429, AB 430–440/443–447, AC 448–455/457–469 имеют сервис/схему **и** тесты (не DTO-only). Секреты: отдельная таблица, `encrypt`/`decrypt` из `crypto.ts`, view/audit без `apiKey` / `encryptedApiKey`, revoke удаляет secret row, REST/MCP/registry store не импортируют;
  - AA 420 `[x]` — контракт + общий runner есть; Nest catalog честно раскрыт как PARTIAL. Формулировка пункта («path/contract») `[x]` допускает;
  - AB 441/442 `[x]` — enum причин + `operationKey` passthrough, без execution runtime. Для этого милстоуна приемлемо;
  - AA 415 DEPRECATED и policy `ARCHIVED` — статусы в enum и preserve-правила есть, admin write-path нет. Тонко, но не DTO-only;
  - J 186 `[~]`, K 205 `[~]` / W 368 `[~]`, K 209 `[~]`, D 91 `[~]` оставлены честно;
  - `any` / default export / `console.log` в prod-путях Chat 5 нет; файлы ≤ 269 строк; функции ≤ 50; nesting в prod ≤ 3; прямых Prisma-записей в Tasks/Drive из AI-кода Chat 5 нет; SDK OpenAI/Anthropic в `package.json` не добавлялись;
  - вне scope (Admin UI, ломка REST/MCP, adaptive router, RAG, live execution) не сделано.
- Миграция `20260822010000_ai_provider_model_internal_agent`: additive-only, без DROP / ALTER существующих таблиц. `employees.prisma` — только relation-поля, SQL employees не переписывает. Индексы без `CONCURRENTLY` на пустых новых таблицах — обосновано. Обратная совместимость сохранена.
- Долги для следующего милстоуна:
  - J 186 `[~]`, K 205 `[~]` / W 368 `[~]`, K 209 `[~]`, D 91 `[~]` — не закрывать в Chat 6;
  - AA 420 Nest catalog — вязать в Chat 7 с `rosterIntent=off`;
  - закрыть `revokeScope` и запретить ACTIVE Internal Agent без production-eligible policy на update;
  - сузить `baseUrl` (https + не private) **до** Admin UI create/update;
  - не выставлять `credentialsForActive` / raw key в HTTP-ответе Chat 6; не заводить второй secret store / grant table;
  - Admin UI целиком; live OpenAI/Anthropic ключи не изобретать.
- Не проверено:
  - запись/чтение production Neon (намеренно не подключались);
  - живой OpenAI/Anthropic validate/sync;
  - что executor’s `migrate deploy` был именно тем, кто довёл status до 213 — независимо видно только текущее «up to date» на dev;
  - `turbo typecheck --force` вместе с `@nbos/web` (handoff: OOM);
  - браузерный UI (вне scope).

## Verification (Chat 5, GPT-5.6 Sol recheck)

- Проверял: GPT-5.6 Sol, 2026-08-22. Это независимая повторная проверка критичных
  инвариантов; она **заменяет предыдущий PASS WITH DEBTS как итоговый гейт**.
- Вердикт: **FAIL**.
- Запущено:
  - git: ветка `sipan`, HEAD `532d4865a3938d20189a806a3ef091febca74f8b`;
    дерево не чистое, удалённых файлов нет, `git diff --check HEAD` чисто;
  - `pnpm --filter @nbos/database exec prisma migrate status` → dev Neon
    `ep-late-frost-ag5aixzw`, **213 migrations**, `Database schema is up to date!`;
  - `pnpm --filter @nbos/database exec prisma validate` → schemas valid;
  - targeted Chat 5 vitest → **15 files / 52 tests passed**;
  - `pnpm vitest run apps/api/src/modules/ai-platform` →
    **51 passed | 2 skipped**, **450 passed | 4 skipped**;
  - `NODE_OPTIONS=--max-old-space-size=8192 pnpm --filter @nbos/api exec tsc --noEmit`
    → exit 0;
  - targeted eslint → 0 errors / 0 warnings;
  - forbidden-pattern scan → нет `any`, default exports, `console.log`,
    unsafe raw Prisma SQL или прямых Tasks/Drive writes в Chat 5 путях;
  - direct policy probes:
    - inverted `PRIMARY_FALLBACK` (`FALLBACK priority=0`, `PRIMARY priority=10`) →
      `INVERTED_ORDER_ACCEPTED`;
    - active primary + unavailable fallback through the real policy service/resolver →
      `ROUTE_FAILED_BEFORE_FILTER DISCOVERED or unavailable models cannot be production candidates`.
- Расхождения с самоотчётом:
  - AB 435/446/447 `[x]` не подтверждаются. Код разрешает fallback перед primary,
    поэтому `PRIMARY_FALLBACK` не гарантирует primary-first;
  - handoff утверждает, что resolver возвращает доступных кандидатов и пропускает
    недоступных. Реальный `requireActive()` падает на первом недоступном enabled
    fallback до фильтра resolver; unit test мокает `requireActive()` и скрывает дефект;
  - AA 420 `[x]` завышен: «contract» — строка с именем метода, нигде не потребляется.
    Сам runner требует `actingEmployeeId`, поэтому scheduler не может вызвать его
    как `SYSTEM` без фиктивного Employee;
  - AC 456/469 `[x]` завышены: Internal scope можно выдать и перечислить, но нельзя
    отозвать; `grantScope` также не покрыт тестом.
- Найденные дефекты:
  - `apps/api/src/modules/ai-platform/policies/ai-model-policy.service.ts:94-103`,
    `ai-model-policy.resolver.ts:39-46`,
    `ai-model-policy.resolver.test.ts:10-44` — недоступный fallback блокирует
    здоровый primary, а мок скрывает реальное поведение — **High**;
  - `apps/api/src/modules/ai-platform/policies/ai-model-policy.rules.ts:64-73` —
    роль PRIMARY не связана с наименьшим priority; fallback может выполняться первым —
    **High**;
  - `apps/api/src/modules/ai-platform/providers/ai-provider-connection.rules.ts:43-70`,
    `ai-provider-http.ts:27-55` — `baseUrl` разрешает `http:` и произвольные
    loopback/private/link-local destinations. Provider key может уйти без TLS либо
    на внутренний endpoint; redirect/destination policy отсутствует — **High security**;
  - `apps/api/src/modules/ai-platform/internal-agents/internal-agent.service.ts:66-100` —
    ACTIVE Agent может получить `modelPolicyId: null`; execution gate проверяет только
    status, поэтому обязательная зависимость обходится после activation — **High**;
  - `apps/api/src/modules/ai-platform/models/ai-model-catalog.contract.ts:8-20`,
    `ai-model-sync.service.ts:42-50` — scheduled path не исполним как SYSTEM actor;
    это metadata, не bindable runner contract — **Medium**;
  - `apps/api/src/modules/ai-platform/internal-agents/internal-agent-grant.service.ts:128-183` —
    нет `revokeScope`; выданный scope нельзя отозвать через Internal Agent service —
    **Medium**;
  - `apps/api/src/modules/ai-platform/models/ai-model-sync.service.ts:42-50` —
    bulk sync прекращается на первой ошибке и пропускает остальные ACTIVE connections —
    **Low**;
  - `apps/api/src/modules/ai-platform/models/ai-model-catalog.service.test.ts:51`,
    `policies/ai-model-policy.service.test.ts:135` — audit-проверки подтверждают
    константы, а не вызовы Audit service — **Low**.
- Миграция:
  - additive-only; DROP/destructive operations и изменения существующих таблиц отсутствуют;
  - plain indexes допустимы, потому что создаются на новых пустых таблицах;
  - Prisma schema valid; SQL, сгенерированный read-only diff из schema, подтверждает
    структуру новых таблиц;
  - миграции не применялись повторной проверкой.
- Точный список правок для исполнителя:
  1. Зафиксировать `PRIMARY_FALLBACK`: ровно один enabled PRIMARY должен иметь
     минимальный priority; все enabled FALLBACK идут после него. Добавить negative tests
     для inverted/duplicate/disabled-primary конфигураций.
  2. Переписать resolver так, чтобы он атомарно читал active policy + version +
     candidates/models/connections, пропускал временно недоступные fallback-кандидаты и
     возвращал здоровый primary. Тестировать связку с реальным `AiModelPolicyService`,
     без мока `requireActive`.
  3. Под row lock запретить итоговое состояние `ACTIVE + modelPolicyId=null` и
     revalidate production-eligible policy при смене policy/activation; добавить
     regression и concurrency tests.
  4. До подключения Chat 6 UI удалить произвольный `baseUrl` из Phase 1 либо разрешить
     только HTTPS destinations по явному provider allowlist. Запретить userinfo,
     localhost/private/link-local адреса и небезопасные redirects; добавить SSRF/TLS tests.
  5. Добавить Internal `revokeScope` с audit в той же transaction и тесты
     grant/list/revoke/re-grant.
  6. Либо реализовать typed scheduled runner с SYSTEM ActorContext и machine audit,
     либо вернуть AA 420 в `[~]`. Runner должен продолжать остальные connections после
     одной ошибки и выдавать per-connection result.
  7. Заменить проверки audit-констант на assertions реальных `logAdminAction` вызовов.
  8. После правок повторить targeted + ai-platform + full vitest, API/shared/database
     typecheck, eslint, Prisma validate/status и обновить числа handoff.
- До исправления вернуть как минимум AA 420, AB 435/446/447 и AC 456/469 из `[x]`
  в `[~]`; milestone нельзя коммитить как завершённый.
- Не проверено:
  - production Neon и любые production writes;
  - живые OpenAI/Anthropic credentials и network calls;
  - браузерный Admin UI (Chat 6);
  - полный workspace vitest повторно не запускался этой проверкой; подтверждены targeted
    и весь `ai-platform`, а предыдущий полный запуск остаётся 796/4020.

## Remediation after FAIL

Executor: Cursor Grok 4.6, 2026-08-22. Closed the eight GPT-5.6 Sol items. No commit. No new migration. Production Neon not contacted.

| #   | Fix                                                                                                                                                                                                                                                 |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `PRIMARY_FALLBACK` requires exactly one enabled PRIMARY with the lowest enabled priority. Negative tests: inverted, disabled PRIMARY, duplicate priority.                                                                                           |
| 2   | Resolver uses `loadActiveRouteSnapshot` (one read of active policy + version + candidates/models/connections). Unavailable/DISCOVERED fallbacks are skipped. Tests use the real `AiModelPolicyService`; `requireActive` is not on the resolve path. |
| 3   | After `FOR UPDATE`, `ACTIVE + modelPolicyId=null` is rejected. Policy replace and activation call `requireAssignableForProduction` (PRIMARY only) inside the transaction.                                                                           |
| 4   | `baseUrl` / request URL: HTTPS, no userinfo, port 443, official host allowlist, localhost/private/link-local blocked. Fetch uses `redirect: 'manual'` and treats 3xx as `PROVIDER_REDIRECT_BLOCKED`.                                                |
| 5   | Internal `revokeScope` writes audit in the same transaction. Tests cover grant / list / revoke / re-grant.                                                                                                                                          |
| 6   | `runScheduledCatalogSync` uses SYSTEM `ActorContext` + `logMachineAction`, continues after one connection error, returns per-connection outcomes. AA 420 stays `[x]` for the runner; Nest catalog remains PARTIAL.                                  |
| 7   | Catalog activate and policy candidate replace assert `logAdminAction`, not string constants.                                                                                                                                                        |
| 8   | Re-ran targeted + ai-platform + full vitest, API/shared/database `tsc`, eslint, Prisma validate.                                                                                                                                                    |

Post-remediation evidence:

```text
targeted Chat 5 → 17 files / 68 tests
ai-platform → 53 passed | 2 skipped, 466 passed | 4 skipped
pnpm vitest run → 798 passed | 2 skipped, 4036 passed | 4 skipped
tsc api/shared/database → exit 0
eslint Chat 5 paths → 0
prisma validate → valid
```

Still open after this remediation: Nest catalog bind (Chat 7), Admin UI (Chat 6), J 186 / K 205 / K 209 / D 91. No `[!]` BUSINESS DECISION.

## Verification (Chat 5, remediation recheck)

- Проверял: GPT-5.6 Sol, 2026-08-22.
- Вердикт: **PASS WITH DEBTS**.
- Git:
  - branch: `sipan`;
  - HEAD: `532d4865a3938d20189a806a3ef091febca74f8b`
    (`docs(ai): update Phase 1 Chat 5 handoff and checklist`);
  - HEAD не изменился после FAIL; новый commit отсутствует, как и заявлено;
  - working tree остаётся dirty: 14 tracked modified paths и 53 untracked files.
    Это ожидаемое pre-commit состояние, но продукт ещё не зафиксирован;
  - удалённых файлов/тестов нет; `git diff --check HEAD` — exit 0.
- Запущено:
  - targeted remediation suites:
    `pnpm vitest run apps/api/src/modules/ai-platform/{providers,models,policies,internal-agents}/*.test.ts packages/shared/src/ai/provider-types.test.ts packages/shared/src/actor/normalize-actor-context.test.ts`
    → **17 files / 68 tests passed**;
  - `pnpm vitest run apps/api/src/modules/ai-platform`
    → **53 files passed + 2 skipped / 466 tests passed + 4 skipped**;
  - `pnpm vitest run`
    → **798 files passed + 2 skipped / 4036 tests passed + 4 skipped**;
  - `NODE_OPTIONS=--max-old-space-size=8192 pnpm --filter @nbos/api exec tsc --noEmit`
    → exit 0;
  - `pnpm --filter @nbos/shared exec tsc --noEmit`
    → exit 0;
  - `pnpm --filter @nbos/database exec tsc --noEmit`
    → exit 0;
  - ESLint на Chat 5 provider/model/policy/internal-agent и shared actor/AI paths
    → exit 0, 0 errors/warnings;
  - `pnpm --filter @nbos/database exec prisma migrate status`
    → **213 migrations found; Database schema is up to date**;
  - `pnpm --filter @nbos/database exec prisma validate`
    → schemas valid.
- Повторно подтверждены исправления:
  1. `PRIMARY_FALLBACK` требует один enabled PRIMARY с минимальным enabled
     priority; inverted, disabled-primary и duplicate priority отклоняются.
  2. Resolver читает policy/version/candidates/models/connections одним Prisma
     query через `loadActiveRouteSnapshot`; unavailable/DISCOVERED fallback
     пропускается, healthy PRIMARY остаётся маршрутом; `requireActive` не
     участвует.
  3. Internal Agent читается после `FOR UPDATE`; `ACTIVE + null policy`
     отклоняется, replacement и activation вызывают
     `requireAssignableForProduction` в той же транзакции.
  4. Provider URL проверяется и при сохранении, и непосредственно до fetch:
     HTTPS, no userinfo, default 443, provider-specific official allowlist;
     private/local/off-list URL блокируются. Redirect mode — `manual`, 3xx
     отображается в `PROVIDER_REDIRECT_BLOCKED`.
  5. Internal `revokeScope` существует, пишет audit через тот же transaction
     client; grant/list/revoke/re-grant покрыты тестом.
  6. `runScheduledCatalogSync` использует SYSTEM `ActorContext`,
     `logMachineAction`, возвращает per-connection outcomes и продолжает после
     ошибки одного connection.
  7. Исправленные audit-тесты проверяют реальные вызовы
     `logAdminAction`/`logMachineAction`.
- Проверка запретов:
  - новых `any`, default exports, production `console.log`, unsafe raw SQL,
    прямых Prisma writes в Tasks/Drive и secret leakage не найдено;
  - Chat 5 source files не превышают 300 строк; проверенные функции не
    превышают 50 строк, запрещённой глубокой вложенности не найдено;
  - security controls не ослаблены, тесты не удалены.
- Миграция:
  - `DROP`/destructive statements отсутствуют;
  - migration остаётся additive-only;
  - обычные `CREATE INDEX` относятся только к создаваемым в этой же migration
    пустым таблицам, поэтому `CONCURRENTLY` не требуется и transaction safety
    не нарушена;
  - новых migration-файлов после FAIL не добавлено.
- Расхождения с remediation self-report: **нет**. Все заявленные числа и семь
  функциональных групп исправлений подтверждены.
- Найденные дефекты: **блокирующих/High/Medium дефектов в remediation не
  найдено**.
- Долги:
  - зафиксировать проверенный product diff отдельным commit перед Chat 6;
  - Nest scheduler catalog binding для AA 420 остаётся Chat 7;
  - Admin UI остаётся Chat 6;
  - J 186 / K 205 / K 209 / D 91 остаются открытыми по roadmap.
- Не проверено:
  - production writes и применение migration;
  - live OpenAI/Anthropic credentials и реальные network calls;
  - opt-in real-DB suites;
  - браузерный Admin UI;
  - фактический Nest cron/catalog запуск, поскольку binding ещё не
    реализован.
