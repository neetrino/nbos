# Phase 1 Chat 4 Handoff — External Protocols: REST and MCP

> Next chat must verify this evidence against the repository. Do not trust the summary blindly.

## Milestone

Chat 4 of `16-Phase-1-Execution-Strategy.md`. Self-reported **COMPLETE, pending independent verification**. No commit was made.

Completed: the wire. `POST/GET /api/v1/agent/*` REST namespace and a stateless MCP Streamable HTTP endpoint at `POST /api/v1/agent/mcp`, both authenticated by `AgentAuthGuard`, both `@Public()` so the employee JWT chain never runs beside them, both calling **only** `AgentCapabilityGateway.invoke`. 14 MCP tools and the equivalent REST routes share one operation registry, one invoker, one error envelope and one idempotency binding.

An External Agent can now **connect**: present a bearer credential to a running NBOS host and execute granted Workspace/Tasks/Drive capabilities over REST or MCP. This closes the "no wire" gap Chat 3 declared. What it does not prove is a live round-trip against a deployed host — every test here runs in-process.

## Checklist

V–W and X after this chat, plus the Chat 2/3 debts this milestone was scoped to close.

- V 331–349 `[x]`. Artifact read (341) is routed under the owning task (`GET /tasks/:taskId/artifacts[/:fileAssetId]`) instead of the bare `/artifacts/:id/download` sketched in `09` §2, so the Task link that authorizes the file is part of the request; `09` §2 permits adapting route mechanics. Attach (342) takes base64 `contentBase64` capped at 512 KiB. 348 is asserted against the generated OpenAPI document, not hand-written.
- W 350–367, 369–373 `[x]`; W 368 `[~]` — input schemas are published and generated from the capability catalog, but no `outputSchema` is advertised, because that depends on the catalog output validator still open as K 205.
- X 374–382 `[x]` — [`21-External-Agent-Client-Setup.md`](21-External-Agent-Client-Setup.md). 378–382 are enforced by the protocol, not only documented: one credential form (`Authorization: Bearer`), `@Public()` agent routes, no capability that reaches Credentials/vault/provider keys.

Chat 2/3 debts:

- **G 140 `[~]` → `[x]`** — `protocol/agent-protocol.http.int.test.ts` boots Nest with the production guard chain, pipe, interceptor and filter, mounts real agent controllers next to an employee route, and drives real HTTP.
- **T 314–315 `[~]` → `[x]`** — HTTP `Idempotency-Key` and MCP `clientOperationId` both reach `invoke({ idempotencyKey })`; attach bytes reach `invocation.payload`.
- **K 197–198 `[~]` → `[x]`** — controllers now exist and are Prisma-free; the parity suite asserts the gateway is the only collaborator.
- **Chat 3 risk 7 (`ActorContext.correlationId`)** — closed. `AgentAuthGuard` resolves or mints it before authentication, so even a rejected request answers with one.

Still open, deliberately not touched here: **J 186** `[~]` (rate-limit counters, section U), **K 205** `[~]` (output schema validator), **K 209** `[~]` (domain commit + idempotency `complete()` not one transaction).

No open `[!]` BUSINESS DECISION.

## Files / modules changed

New, all under `apps/api/src/modules/ai-platform/`:

| Area                | Path                                                                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Operation registry  | `protocol/agent-operation.registry.ts` — single source for capability ↔ MCP tool ↔ REST route                                                |
| Invoker             | `protocol/agent-protocol.invoker.ts` — the one path from either protocol into the gateway                                                    |
| Envelopes           | `protocol/agent-response.envelope.ts`, `protocol/agent-error.envelope.ts`                                                                    |
| Error filter        | `protocol/agent-protocol.filter.ts`                                                                                                          |
| Correlation         | `protocol/agent-correlation.ts`, `protocol/agent-correlation.interceptor.ts`                                                                 |
| Route decorators    | `protocol/agent-protocol.decorators.ts` (`@AgentProtocolEndpoints`, `@CurrentAgent`, `@CurrentCorrelationId`)                                |
| Identity projection | `protocol/agent-identity.projection.ts` — no capabilities, no secrets                                                                        |
| Artifact bytes      | `protocol/agent-artifact-content.ts` — base64 decode + 512 KiB cap                                                                           |
| Request type        | `protocol/agent-protocol.request.ts`                                                                                                         |
| REST                | `rest/agent-identity.controller.ts`, `rest/agent-tasks.controller.ts`, `rest/agent-artifacts.controller.ts`, `rest/agent-rest.input.ts`      |
| MCP                 | `mcp/agent-mcp.controller.ts`, `mcp/agent-mcp.server.ts`, `mcp/agent-mcp.tools.ts`, `mcp/agent-mcp.jsonrpc.ts`, `mcp/agent-mcp.constants.ts` |
| HTTP test harness   | `protocol/agent-protocol.http.harness.ts` — boots the production guard chain for both integration specs                                      |

Modified:

| Area          | Path                                                                                                             |
| ------------- | ---------------------------------------------------------------------------------------------------------------- |
| Module wiring | `ai-platform.module.ts` — 4 controllers, invoker, MCP server, filter, interceptor                                |
| Auth          | `auth/agent-auth.guard.ts` — resolve/mint correlation id before the token is even read                           |
| Catalog       | `gateway/agent-capability.constants.ts` — export `AGENT_TASK_STATUSES` / `AGENT_TASK_PRIORITIES` for MCP schemas |
| Validators    | `gateway/agent-capability.validators.ts` — consume those exports instead of re-listing them                      |
| Shared errors | `packages/shared/src/ai/policy-error-mapping.ts` — add `AGENT_INTERNAL_ERROR`                                    |
| Test fixture  | `apps/api/src/test-utils/authenticated-agent.ts`                                                                 |
| Docs          | `10-Phase-1-…` (G, K, T, V, W, X), `00-Documentation-Hub.md`, new `21-External-Agent-Client-Setup.md`            |

The protocol layer is 3513 lines including its specs and harness; every file is under the 300-line limit and every function under 50. No controller or MCP handler imports Prisma, `TasksService` or Drive. `ai-modul-steps.md` is a pre-existing dirty file and not part of this milestone.

## Migrations

**None.** Chat 4 is protocol-only; no Prisma schema change, no new migration directory. `prisma migrate status` against dev Neon `ep-late-frost-ag5aixzw` reports **212** migrations and "Database schema is up to date!" — the same 212 Chat 3 left. `prisma migrate deploy` and `prisma migrate dev` were not run. Production (`ep-sweet-dew-ag7259wn`) was not contacted.

## Tests run

Final numbers, after the round-1 verification fixes recorded at the end of this document.

```text
pnpm vitest run
→ 782 files passed + 2 skipped, 3978 tests passed + 4 skipped
  (Chat 3 baseline was 767 / 3793 — this chat adds 15 files and 185 tests)

pnpm vitest run apps/api/src/modules/ai-platform
→ 38 files passed + 2 skipped, 413 tests passed + 4 skipped

pnpm typecheck → 5 tasks successful / 5 total, 0 cached
                 (a repeat run hits the turbo cache; use --force for uncached evidence)
pnpm lint      → 0 errors, 13 warnings — 11 apps/web + 2 apps/api
                 (all pre-existing unused-vars in whatsapp/scheduler files, none in this diff)
```

Per new suite:

| Suite                                                             | Tests | What it holds down                                                        |
| ----------------------------------------------------------------- | ----- | ------------------------------------------------------------------------- |
| `agent-protocol.parity.test.ts`                                   | 35    | REST and MCP produce identical `invoke` calls, deny codes, keys           |
| `agent-protocol.http.int.test.ts` + `…http.transport.int.test.ts` | 28    | G 140 — real guard chain over real HTTP, on the shared `…http.harness.ts` |
| `agent-openapi.test.ts`                                           | 20    | generated document: paths, bearer, no delete                              |
| `agent-mcp.server.test.ts`                                        | 15    | initialize / ping / tools\:list / tools\:call, in-band errors             |
| `agent-error.envelope.test.ts`                                    | 13    | contract codes, no leakage, internal-fault mapping                        |
| `agent-rest.controllers.test.ts`                                  | 13    | route → operation, path override, idempotency header                      |
| `agent-operation.registry.test.ts`                                | 10    | 14 tools, no forbidden capability reachable                               |
| `agent-mcp.tools.test.ts`                                         | 10    | catalog-derived schemas, no delete tool                                   |
| `agent-protocol.invoker.test.ts`                                  | 9     | key binding, binary payload, envelope mapping                             |
| `agent-mcp.jsonrpc.test.ts`                                       | 9     | JSON-RPC 2.0 framing, notifications, batch                                |
| `agent-response.envelope.test.ts`                                 | 7     | `{ data }` / `{ data, meta }`                                             |
| `agent-correlation.test.ts`                                       | 6     | resolve, mint, sanitize, bound                                            |
| `agent-artifact-content.test.ts`                                  | 6     | base64 validation, 512 KiB cap                                            |
| `agent-identity.projection.test.ts`                               | 4     | capabilities are never projected                                          |

Not run: production migration, deployment, a live agent token against a running host, a real MCP client (Cursor/Claude Code/Codex) completing a handshake, browser UI. Opt-in real-DB suites were not re-run — this diff touches no schema, grant or credential persistence.

## Architecture decisions

1. **One registry, two protocols.** `agent-operation.registry.ts` is the single declaration of every external operation: capability key, MCP tool name, REST method/path, whether it carries binary content. REST controllers and the MCP tool catalog are both derived from it, so parity is structural rather than maintained by hand. A capability that is not in the registry has no wire.
2. **MCP is hand-written, not the SDK.** The Phase 1 surface is `initialize`, `ping`, `tools/list`, `tools/call` — small. Taking `@modelcontextprotocol/sdk` would add it and `zod` as production dependencies and put a second opinion between the transport and `AgentAuthGuard`/the error envelope. A 524-line adapter (five files, transport through tool catalog) keeps auth, deny codes and idempotency byte-identical to REST, which is exactly what the parity suite asserts. Revisit if Phase 2 needs resources, prompts or server-initiated streams.
3. **Both protocols reach the gateway through one invoker.** `AgentProtocolInvoker.invoke` is the only place either adapter can call. It resolves the operation, binds the idempotency key, decodes binary content and wraps the result. A controller cannot construct an invocation of its own.
4. **Binary bytes are base64 in JSON, decoded at the adapter.** REST could have used multipart, but that needs `multer` and would give MCP no equivalent. Both protocols take `contentBase64`; the adapter decodes to `Uint8Array` and puts it in `invocation.payload`, never in the JSON input the catalog validates. Cap is 512 KiB at the protocol, above whatever Drive enforces.
5. **Correlation id is minted in the guard, before the token is parsed.** A caller that fails authentication still gets a correlation id it can quote in a support request. The interceptor echoes it on success, the filter echoes it on failure.
6. **Agent responses skip the employee transform.** `@SkipTransform()` plus `AgentProtocolExceptionFilter` keeps the `{ data, timestamp }` employee wrapper and the employee error shape off the agent namespace, so `09` §3 is the literal response shape.
7. **MCP denials are tool results, not JSON-RPC errors.** An authorization denial is a legitimate answer to a well-formed call, so it returns `isError: true` with the same stable code REST returns. JSON-RPC error codes are reserved for protocol faults (unparseable, unknown method).
8. **Identity is a projection, not a serialization.** `toAgentIdentityProjection` builds an explicit object. A field added to `AuthenticatedAgent` later cannot leak into `/agent/me` by accident, and capabilities are structurally absent rather than deleted.
9. **`GET`/`DELETE` on the MCP route answer 405.** Phase 1 is stateless and has no server-initiated stream; advertising SSE we do not implement would make clients wait on a channel that never speaks.

## Canon / runtime conflicts

| ID                                    | Classification | Resolution in Chat 4                                                                                       |
| ------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------- |
| `09` §2 artifact route shape          | PARTIAL        | Artifact read is nested under its task so the authorizing link is in the URL. Same capability, same codes. |
| `09` §12 `tasks.read_links`           | OK             | Capability exists in the gateway; `09` lists no tool and no route, so it has no wire in Phase 1.           |
| G 140 Employee-vs-Agent HTTP boundary | CLOSED         | Integration-tested against the production guard chain.                                                     |
| C8 / T 314–315 idempotency            | CLOSED         | `Idempotency-Key` and `clientOperationId` both bind to `invoke({ idempotencyKey })`.                       |
| K 205 output schema                   | PARTIAL        | Blocks MCP `outputSchema` (W 368 `[~]`). Unchanged here by instruction.                                    |
| J 186 rate limits                     | PARTIAL        | Unchanged. Section U.                                                                                      |
| K 209 split transaction               | PARTIAL        | Unchanged. Inherited risk, now reachable from the wire.                                                    |

## Decisions taken in this chat (no developer stop)

1. **Artifact read nested under the task** rather than a flat `/artifacts/:id` — the Task link is what authorizes the file, so it belongs in the request rather than being re-derived.
2. **512 KiB attach cap** as a protocol-level constant. A named constant, not a magic number; it is a protocol guard, not a Drive policy, and Drive's own limits still apply underneath.
3. **`AGENT_INTERNAL_ERROR` added to the shared code list.** An unmapped server fault previously had no external code and would have fallen through to the employee error shape. It carries a fixed message and never the underlying exception.
4. **`tasks.read_links` gets no wire.** `09` §12 does not list a tool and §2 does not list a route. Adding one would be inventing contract surface; the capability stays gateway-only until canon names it.
5. **MCP batch requests are supported** because JSON-RPC 2.0 requires it; an all-notification batch answers 202 with no body.

## Known risks

1. **No live round-trip.** Every test is in-process. No Cursor/Claude Code/Codex client has completed an `initialize` handshake against a deployed NBOS, and the setup guide is written against the implemented endpoints rather than a walked-through session. This is the largest unverified claim in this milestone.
2. **K 209 is now reachable.** The split between domain commit and idempotency `complete()` was theoretical while there was no wire. An external client can now hit it. Unchanged by instruction; still `[~]`.
3. **No rate limiting on the agent namespace.** `@Public()` routes with a bearer credential and no J 186 counters. `ThrottlerGuard` still applies its global default, which was not tuned for machine callers. Section U.
4. **MCP `outputSchema` is absent.** Clients that plan against declared output shapes get nothing to plan on. Follows K 205.
5. **Base64 inflates request bodies ~33%.** A 512 KiB artifact is ~700 KiB of JSON, which must stay under the body-parser limit on every deployment tier.
6. **Idempotency keys are client-chosen strings.** Two agents cannot collide (the key is scoped by agent and capability), but one agent reusing a key across semantically different payloads gets a fingerprint conflict rather than a fresh execution — correct, and a client that generates keys carelessly will find it surprising.
7. **`@Res()` in the MCP controller bypasses the interceptor**, so it sets the correlation header itself. The interceptor and filter both check `headersSent`. A future controller that adopts `@Res()` must remember the same.

## Chat 5 entry point

Chat 4 self-reports complete. Entry conditions:

| Debt            | Why it is still open                                               |
| --------------- | ------------------------------------------------------------------ |
| J 186 `[~]`     | Rate-limit counters/windows are section U                          |
| K 205 `[~]`     | Output schema validator; blocks MCP `outputSchema` (W 368)         |
| K 209 `[~]`     | Domain commit and idempotency `complete()` are not one transaction |
| W 368 `[~]`     | Follows K 205                                                      |
| Opt-in DB tests | Still not in default CI                                            |
| Live client     | No deployed-host handshake with Cursor/Claude Code/Codex           |

1. Read this handoff, then `10-Phase-1-…` sections Y onward and the provider/model canon in `02-Modules/21-AI-Platform/`.
2. Chat 5 is **providers and model catalog** — OpenAI/Anthropic adapters, model routing, usage accounting. Not protocols; the wire is done.
3. Provider credentials go through the approved secret path. Do not read them into any agent-reachable capability, and do not let a provider key become a capability input.
4. The external protocol surface is now contract. Changing a route, tool name, error code or envelope is a breaking change for a client that may already be configured; extend rather than reshape.
5. Any new capability that should be externally reachable must be added to `protocol/agent-operation.registry.ts` — the parity and OpenAPI suites will fail if REST and MCP disagree, which is the intended pressure.
6. Still no Settings/Admin UI (Chat 6).

## Verification (Chat 4)

- Проверял: Cursor Grok 4.6, 2026-08-21.
- Вердикт: **PASS WITH DEBTS**.
- Git:
  - ветка `sipan`, up to date with `origin/sipan`;
  - `HEAD ae13381078aa2a50aee6fce90339f32d3878d8c6` (`docs(ai): update Phase 1 Chat 4 handoff and checklist`) — это **не** коммит продукта Chat 4, а последующий docs-коммит после Chat 3 (`c2bbe1c0`): `ai-modul-steps.md` + `docs/deployment/AUTOMATED-PRODUCTION-DATABASE-MIGRATIONS-STANDARD.md`;
  - staged нет; дерево **не чистое**, как и заявлено («No commit was made» относится к коду Chat 4): 7 modified tracked + 36 untracked (mcp/protocol/rest + fixture + два docs);
  - все заявленные пути существуют; `git diff --diff-filter=D HEAD` пуст — тесты не удалялись;
  - `package.json` / `apps/api/src/app.module.ts` не менялись; `AiPlatformModule` уже импортирован в `AppModule`.
- Запущено (миграции не применялись; `migrate deploy` / `migrate dev` не вызывались):
  - `.env.local` `DATABASE_URL` / `DIRECT_URL` → host `ep-late-frost-ag5aixzw` (не прод `ep-sweet-dew-ag7259wn`);
  - `pnpm --filter @nbos/database exec prisma migrate status` → datasource `ep-late-frost-ag5aixzw.c-2.eu-central-1.aws.neon.tech`, **212** migrations, `Database schema is up to date!`; новых каталогов миграций нет;
  - `pnpm vitest run apps/api/src/modules/ai-platform` → **37 passed | 2 skipped**, **411 passed | 4 skipped**;
  - `pnpm vitest run` → **781 passed | 2 skipped**, **3976 passed | 4 skipped**;
  - таблица per-suite совпала после раскрытия `it.each` (parity 35, http.int 26, openapi 20, mcp.server 15, error.envelope 13, rest.controllers 13, registry 10, mcp.tools 10, invoker 9, jsonrpc 9, response.envelope 7, correlation 6, artifact-content 6, identity 4);
  - `pnpm typecheck` сначала FULL TURBO cache hit; повтор `turbo typecheck --force --filter=@nbos/api --filter=@nbos/shared --filter=@nbos/database --filter=@nbos/web` → **5 successful / 5 total, 0 cached**, 66.1s;
  - targeted `eslint` по файлам Chat 4 → 0 errors / 0 warnings;
  - `pnpm lint` (turbo, cache replay) → 0 errors, **13** warnings (11 web + 2 api вне diff);
  - `git diff --check HEAD` → чисто.
- Расхождения с самоотчётом:
  - числа vitest (781/3976 и 37/411), migrate status (212, up to date), per-suite counts и «нет миграций» **подтверждены**;
  - `pnpm typecheck → 0 cached` подтверждено только после `--force`; первый прогон этой проверки был cache hit;
  - lint: заявлено «11 warnings, all apps/web»; фактически 11 web + 2 api (те же pre-existing, что фиксировал Chat 3). В diff Chat 4 предупреждений нет;
  - «No commit was made» верно для продукта Chat 4; текущий HEAD — docs-коммит `ae133810`, не `c2bbe1c0`;
  - «Production protocol code is 3328 lines including its specs» совпало (`wc` по `mcp/`+`protocol/`+`rest/`).
- Найденные дефекты:
  - `apps/api/src/modules/ai-platform/protocol/agent-protocol.http.int.test.ts:1` — файл **395** строк (> 300). Это spec, не prod-путь; лимит нарушен — **LOW**;
  - `apps/api/src/modules/ai-platform/protocol/agent-protocol.parity.test.ts:184-196` — кейс `identity.read` не зовёт gateway, поэтому `expect(mcpCall).toEqual(restCall)` сравнивает `undefined === undefined`. Identity закрыта отдельными тестами (`invoker`, `identity.projection`, HTTP `/me`); сам parity-кейс пустой — **LOW**;
  - `apps/api/src/modules/ai-platform/protocol/agent-protocol.http.int.test.ts` — G 140 крутит реальную цепочку гард, но `authenticate` замокан: employee JWT на `/api/v1/agent/*` на HTTP-слое не гоняется. Формат JWT отвергает `agent-authenticator.service.test.ts` («employee JWT»). Отметка G 140 `[x]` за проводку `@Public()` + `AgentAuthGuard` + global guards — честная; дыра только в HTTP-покрытии второй стороны границы — **LOW**.
- Честность чеклиста ( independently ):
  - G 140, K 197–198, T 314–315, V 331–349, W 350–367/369–373, X 374–382 имеют код **и** тесты (или setup-doc для X 374–377). Не DTO-only;
  - W 368 `[~]`, J 186 `[~]`, K 205 `[~]`, K 209 `[~]` оставлены честно;
  - REST/MCP не импортируют Prisma / `TasksService` / Drive; единственный collaborator — `AgentProtocolInvoker` → `AgentCapabilityGateway.invoke`;
  - identity-проекция без capabilities; query-string token отвергается; missing vs out-of-scope → один `AGENT_RESOURCE_NOT_AVAILABLE`; Authorization не логируется;
  - `any` / default export / `console.log` в prod-путях Chat 4 нет; функции > 50 нет; Nesting в prod-файлах в пределах лимита;
  - вне scope (Y providers, Admin UI, `tasks.delete` / force-complete, Credentials/vault) не сделано.
- Долги для следующего милстоуна (Chat 5 их не закрывает — провайдеры):
  - J 186 `[~]` — rate-limit counters/windows, section U; `@Public()` agent namespace сейчас под глобальным `ThrottlerGuard` с employee-default;
  - K 205 `[~]` / W 368 `[~]` — нет `outputSchema`;
  - K 209 `[~]` — split domain commit vs idempotency `complete()`; **теперь достижим с провода**;
  - live handshake Cursor / Claude Code / Codex против задеплоенного хоста;
  - opt-in real-DB suites всё ещё не в default CI;
  - `09` §11 канонический URL `https://<nbos-host>/mcp` реализован как `POST /api/v1/agent/mcp` (тот же credential boundary; задокументировано в setup). Не ломает Phase 1, но канон стоит поправить позже;
  - если MCP-клиент пришлёт `Origin` вне CORS allowlist, глобальный `OriginGuard` ответит 403 (клиенты без Origin проходят — так устроен guard).
- Не проверено:
  - запись/чтение production Neon (намеренно не подключались);
  - live agent token против running host и реальный MCP handshake;
  - что executor’s `pnpm typecheck` был именно uncached — независимо подтверждён только `--force`;
  - браузерный UI (вне scope).

## Remediation after Chat 4 verification round 1 (same chat)

Verification returned **PASS WITH DEBTS** with three LOW defects and no fix list required. All three were in this chat's own new test code, so they were fixed rather than carried. No production code changed; no commit.

1. **Oversized spec.** The 395-line `agent-protocol.http.int.test.ts` was split along its own seam. The Nest bootstrap moved to `protocol/agent-protocol.http.harness.ts` (193 lines after the round-2 split below) and is shared by two specs: `agent-protocol.http.int.test.ts` (162 lines — credential boundary and correlation, the G 140 core) and `agent-protocol.http.transport.int.test.ts` (201 lines — REST capability routing and MCP). Every protocol file is now under the 300-line limit.
2. **Vacuous parity case.** `identity.read` carries no capability key and never reaches the gateway, so the shared `it.each` compared `undefined` to `undefined`. Gateway-parity cases are now `GATEWAY_CASES` (the 13 operations that do reach it, filtered explicitly and documented), and identity gets a real assertion: both transports return the same projection body, neither touches the gateway, and the serialized body matches no `capabilit|grant|secret|hash`.
3. **Employee JWT not exercised over HTTP.** The harness authenticator now applies the real `parseAgentToken` canonical parse instead of accepting any string, and `signEmployeeAccessToken()` mints a genuine v2 access token that `AuthGuard` would honour elsewhere. Two new tests assert that this valid employee token is refused on `/api/v1/agent/me` with `AGENT_AUTH_INVALID` and never reaches the gateway. This also fixed a latent weakness: the previous `AGENT_TOKEN` fixture (`nbosa_…`) was not a well-formed agent token at all, and only passed because the mock accepted everything.

Also corrected in this document: lint is **13** warnings (11 `apps/web` + 2 `apps/api`), not 11 web-only, and the `pnpm typecheck` line now notes that a repeat run replays the turbo cache.

Re-run after remediations (this chat, no commit):

```text
pnpm vitest run                                  → 782 files / 3978 tests passed (+2/+4 skipped)
pnpm vitest run …/ai-platform                    → 38 files / 413 tests passed (+2/+4 skipped)
pnpm typecheck --force                           → 5 successful / 5 total, 0 cached
eslint protocol/ rest/ mcp/                      → 0 errors, 0 warnings
```

The two integration specs total 28 tests, up from 26. Parity stays at 35 (one vacuous case removed, one real case added). Open debts are unchanged: J 186, K 205 / W 368, K 209, live handshake, opt-in DB suites outside default CI.

## Verification (Chat 4, round 2)

- Проверял: Cursor Grok 4.6, 2026-08-21 (повтор после remediation).
- Вердикт: **PASS WITH DEBTS**. Три LOW из round 1 закрыты. Новых HIGH/MEDIUM нет. Прод-код не менялся.
- Запущено:
  - git: ветка `sipan`, `HEAD ae133810`, коммита Chat 4 нет, дерево грязное (uncommitted remediations + исходный продукт Chat 4);
  - `wc -l`: harness 176, `http.int.test.ts` 162, `http.transport.int.test.ts` 201, `parity.test.ts` 296; все файлы `protocol/` / `mcp/` / `rest/` ≤ 296;
  - `pnpm vitest run apps/api/src/modules/ai-platform` → **38 passed | 2 skipped**, **413 passed | 4 skipped**;
  - `pnpm vitest run` → **782 passed | 2 skipped**, **3978 passed | 4 skipped**;
  - `turbo typecheck --force --filter=@nbos/api --filter=@nbos/shared --filter=@nbos/database --filter=@nbos/web` → **5 successful / 5 total, 0 cached**, 74.2s;
  - `eslint` protocol/ rest/ mcp/ → 0 errors, 0 warnings.
- Расхождения с самоотчётом: нет по числам vitest (38/413, 782/3978), typecheck `--force` и eslint. Поправки lint=13 и оговорка про turbo cache в секции Tests run подтверждены. HTTP-спеки 13 + 15 = 28; parity 35 = 1 cover + 13 gateway + 1 identity + 13 deny + 4 reasons + 3 standalone.
- Закрытие дефектов round 1:
  - файл 395 строк → split по шву, лимит 300 соблюдён;
  - `GATEWAY_CASES` (13) требует `restCall` defined; identity — отдельный тест: одинаковая проекция, `gatewayInvoke` не звался, тело не матчит `capabilit|grant|secret|hash`;
  - `AGENT_TOKEN` = `nbos_agt_<18 hex>_<64 hex>`, мок зовёт настоящий `parseAgentToken`; `signEmployeeAccessToken()` несёт `typ/ver/sid/authVersion`, что проходит `isV2AccessPayload`; HTTP: employee JWT на `/v1/agent/me` → `AGENT_AUTH_INVALID`, gateway не звался.
- Найденные дефекты: новых блокирующих нет. Остаточный **LOW**: `agent-protocol.http.harness.ts:100-176` — `startAgentProtocolHarness` ~77 строк (лимит 50), это wiring бутстрапа, не прод-путь. Не требует нового круга.
- Долги без изменений: J 186 `[~]`, K 205 `[~]` / W 368 `[~]`, K 209 `[~]` (wire-reachable), live handshake, opt-in DB вне CI, `09` §11 `/mcp` vs `/api/v1/agent/mcp`, Origin вне CORS allowlist.
- Не проверено: production Neon; live MCP handshake; полный `pnpm lint` в этом проходе (targeted eslint зелёный).

## Remediation after Chat 4 verification round 2 (same chat)

Round 2 returned **PASS WITH DEBTS** with one residual LOW and no required fix list. It was in this chat's own harness, so it was fixed. No production code changed; no commit.

**Oversized harness bootstrap.** `startAgentProtocolHarness` was 77 lines against the 50-line limit. Split along what the function actually does: `harnessProviders()` returns the production cross-cutting stack in production order, `listenOnEphemeralPort()` compiles the module and applies the global pipe and prefix, `applyDefaultMockBehaviour()` holds the canonical-parse authenticator default. The exported entry point is now 25 lines and reads as boot → base url → reset → handle; every helper is under 50. The file is 193 lines.

Re-run after remediation (this chat, no commit):

```text
pnpm vitest run                             → 782 files / 3978 tests passed (+2/+4 skipped)
…/protocol/agent-protocol.http*.int.test.ts → 2 files / 28 tests passed
pnpm typecheck --force                      → 5 successful / 5 total, 0 cached
eslint protocol/ rest/ mcp/                 → 0 errors, 0 warnings
```

Totals are unchanged from round 2, which is the point: this was a structural split with no behavioural change. Open debts are unchanged: J 186, K 205 / W 368, K 209, live handshake, opt-in DB suites outside default CI, the `09` §11 `/mcp` path note, and the CORS `Origin` note.
