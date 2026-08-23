# Phase 1 Chat 6 Handoff — AI Administration UI

> Next chat must verify this evidence against the repository. Do not trust the summary blindly.

## Milestone

Chat 6 of `16-Phase-1-Execution-Strategy.md`. Branch `sipan`. Product HEAD at start was `e62d745b` (`feat(ai): add provider connections, model catalog and Internal Agent foundation`). This chat does **not** commit.

Completed: employee admin HTTP over Chat 2/5 services, Settings → AI & Agents, and contextual Work Space AI Access. External Agents, Providers, Models, Model Policies, Internal Agent foundation, Usage/Approvals shells, and AI Audit are reachable from the existing Settings hub. Human RBAC stays `COMPANY` + `EDIT`. REST/MCP Chat 4 contracts were not changed.

This chat does **not** implement adaptive routing, RAG, Messenger auto-reply, full internal chat, rate-limit counters (J 186), output schema validator (K 205), K 209, D 91, or Nest scheduler catalog bind (Chat 7).

## Checklist

AJ–AK after this chat.

- AJ 558–577 `[x]`. Central `Settings → AI & Agents` (`/settings/ai-agents`) with Overview, External Agents list/create/detail/edit, WHAT/WHERE grants, one-time issue/rotate/revoke, disable/re-enable, last-used, activity. REVOKED is terminal in UI. Providers distinguish Internal Provider Connections from External Agent credentials. OpenAI/Anthropic connect, Validate, Rotate/Replace key, Disable. Raw token/key never redisplayed after save.
- AJ 578–583 `[x]`. Models page. Sync does not auto-activate. DISCOVERED is grouped separately from ACTIVE. Activate/Disable. Provider metadata and internal tags/notes are shown, not mixed.
- AJ 584–585 `[~]`. FIXED and PRIMARY_FALLBACK create + activate/disable shipped. Cross-provider candidates allowed from ACTIVE models only. In-place candidate-replace editor is not in the UI; `POST /api/ai-admin/model-policies/:id/candidates` exists. TIERED/ADAPTIVE are not offered.
- AJ 586 `[x]`. Policy create lists ACTIVE models from any connected provider.
- AJ 587–591 `[x]`. Internal Agents list/create (DRAFT) / detail. Activate goes through `InternalAgentService.activate`. Model Policy assignment. Prompt/approval IDs are foundation placeholders. Pause/disable/archive. Grants/scopes reuse Internal `revokeScope`.
- AJ 592–594 `[x]`. Usage shell, Approvals shell, AI Audit/Activity.
- AJ 595 `[x]`. Employee with `COMPANY.EDIT` → 200. Other employee without that permission → 403. External Agent token on admin GET/POST → 401; create is not called.
- AK 596–602 `[x]`. Work Space Settings → AI Access. Same `AgentGrantService` WORKSPACE scopes. Grant existing non-REVOKED agent. Revoke. Link to central detail. No second permission table. Token rotation is not in the sheet.

Still open, deliberately not touched: **J 186** `[~]`, **K 205** `[~]` / **W 368** `[~]`, **K 209** `[~]`, **D 91** `[~]`, AL–AM, AA 420 Nest catalog bind.

No open `[!]` BUSINESS DECISION.

## Files / modules changed

Admin HTTP under `apps/api/src/modules/ai-platform/admin/`:

| Area        | Path                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------ |
| Constants   | `ai-admin.constants.ts`                                                                    |
| Query       | `ai-admin-query.service.ts`, overview/workspace mappers                                    |
| Secrets     | `ai-admin-secrets.ts`                                                                      |
| Controllers | overview, external agents, access, providers, models, policies, internal agents, workspace |
| Tests       | authorization, secrets, workspace HTTP, query/mapper/secrets unit, harness                 |

Service list methods (not a second store): `InternalAgentService.listAll`, `AiModelPolicyService.listAll`, `AiModelCatalogService.listAll`, `AgentGrantService.listActiveWorkspaceScopes`, `AuditService.findRecentByEntityTypes`.

Web:

| Area       | Path                                                                      |
| ---------- | ------------------------------------------------------------------------- |
| Client     | `apps/web/src/lib/api/ai-admin.ts`, `ai-admin-internal.ts`                |
| Feature    | `apps/web/src/features/ai-admin/*`                                        |
| Routes     | `apps/web/src/app/(app)/settings/ai-agents/**`                            |
| Nav / hub  | `nav-config.ts`, `settings/page.tsx`                                      |
| Contextual | `WorkSpaceDetailSettingsSheet.tsx` (+ Work Space / Product Tasks callers) |

REST/MCP/protocol files were **not** changed. `21-External-Agent-Client-Setup.md` and `22-Phase-1-Chat-5-Handoff.md` were **not** overwritten.

## Migrations

**None.** Chat 6 is HTTP + UI over Chat 2/5 tables.

- `prisma migrate dev` was not run.
- `prisma migrate deploy` was not run.
- Production Neon `ep-sweet-dew-ag7259wn` was not contacted.

## Tests run

```text
pnpm vitest run apps/api/src/modules/ai-platform/admin apps/web/src/features/ai-admin
→ 25 files passed, 67 tests passed

pnpm vitest run apps/api/src/modules/ai-platform
→ 71 files passed + 2 skipped, 540 tests passed + 4 skipped

pnpm vitest run
→ 828 files passed + 2 skipped, 4147 tests passed + 4 skipped

NODE_OPTIONS=--max-old-space-size=8192 pnpm --filter @nbos/api exec tsc --noEmit
→ exit 0
pnpm --filter @nbos/shared exec tsc --noEmit → exit 0
pnpm --filter @nbos/database exec tsc --noEmit → exit 0
NODE_OPTIONS=--max-old-space-size=8192 pnpm --filter @nbos/web exec tsc --noEmit
→ exit 0

pnpm --filter @nbos/web exec eslint src/features/ai-admin src/lib/api/ai-admin.ts src/lib/api/ai-admin-internal.ts src/lib/api/ai-admin-http.ts src/app/(app)/settings/ai-agents
→ exit 0, 0 errors, 0 warnings
```

Per new / Chat 6 suite:

| Suite                                     | What it holds down                                                                                                    |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `ai-admin.authorization.http.int.test.ts` | COMPANY EDIT 200; no permission 403; agent token 401 on GET and mutating POST                                         |
| `ai-admin.secrets.http.int.test.ts`       | Issue returns token once; later list has no token; provider create never echoes key                                   |
| `ai-admin.workspace.http.int.test.ts`     | Contextual grant uses `AgentGrantService.grantScope` with `WORKSPACE`                                                 |
| `ai-admin-query.service.test.ts`          | Same grant table; no `tasks.delete` / `tasks.force_complete` in catalog                                               |
| `external-agent-actions.test.ts`          | REVOKED cannot enable/issue/grant                                                                                     |
| `model-catalog-groups.test.ts`            | DISCOVERED ≠ ACTIVE; only ACTIVE is production-eligible; no TIERED/ADAPTIVE                                           |
| `grantable-agents.test.ts`                | REVOKED and already-granted ids excluded from contextual picker                                                       |
| `one-time-secret-flow.test.ts`            | Create host stays mounted; parent refresh waits until the raw token is closed                                         |
| `grant-current.test.ts`                   | `expiresAt <= now` is not counted as active                                                                           |
| `ai-admin.ownership.http.int.test.ts`     | Nested credential/scope mutations 404 when the parent URL does not own them                                           |
| `ai-admin-query.service.test.ts`          | Agent activity refs include credential, capability grant, and scope ids                                               |
| `ai-admin.providers.http.int.test.ts`     | Anthropic/OpenAI validate-draft keep the posted provider; replacement validate is key-only; disable-impact names deps |
| `ai-admin-disable-impact.test.ts`         | Model/policy/provider disable impact lists real policy and Internal Agent names                                       |
| `select-provider.test.ts`                 | Rotate uses stored provider and custom `baseUrl`                                                                      |
| `one-time-secret-host.test.ts`            | Parent refresh cannot drop a visible create/issue/rotate token                                                        |
| `disable-impact.test.ts`                  | Confirm copy lists policy/agent names and counts; confirm blocked while refetching                                    |
| `provider-draft-gate.test.ts`             | Validate A then edit to B keeps Save disabled when A succeeds late                                                    |
| `provider-request-generation.test.ts`     | Stale validate/save is ignored; dismiss blocked while busy; close/reopen cannot apply an older Save                   |

Not run: production migration, live OpenAI/Anthropic keys, browser click-through of Settings UI, Nest scheduler catalog registration, opt-in real-DB suites, turbo `typecheck --force` with all packages (web isolated `tsc` used instead).

## Architecture decisions

1. **One employee admin surface, one foundation.** `/api/ai-admin` wraps Chat 2/5 services. No second secret store, grant table, or `ResourceAccessGrant.employeeId`.
2. **Human RBAC, not AgentAuthGuard.** Class-level `@RequirePermission('COMPANY', 'EDIT')` matches Settings. An External Agent bearer fails JWT employee auth (401).
3. **Composition reads only.** `AiAdminQueryService` assembles overview/bundles/workspace rows. Mutations stay on domain services.
4. **Secrets are one-shot.** Issue/rotate return `{ credential, token }` once. Lists expose prefix/status. Provider create/rotate never echo `apiKey`.
5. **REVOKED is terminal in UI** the same way Chat 2 locked it in the service.
6. **Sync ≠ activate.** Models UI groups DISCOVERED separately. Policy create offers ACTIVE models only.
7. **Contextual AI Access is a projection.** Work Space sheet calls the same workspace access endpoints. It does not own tokens.
8. **Next.js page default exports** remain the App Router exception. New feature modules use named exports.

## Canon / runtime conflicts

| ID                        | Classification | Resolution in Chat 6                           |
| ------------------------- | -------------- | ---------------------------------------------- |
| Chat 4 REST/MCP contract  | OK             | Untouched                                      |
| TIERED/ADAPTIVE in UI     | OK             | Hidden; Phase 1 modes only                     |
| Usage / Approvals runtime | PARTIAL        | Shells only; D 91 / AH remain                  |
| Policy candidate edit UI  | PARTIAL        | Create + activate/disable; replace is API-only |
| AA 420 Nest catalog       | PARTIAL        | Still Chat 7                                   |
| J 186 / K 205 / K 209     | PARTIAL        | Unchanged                                      |

## Decisions taken in this chat (no developer stop)

1. **Admin route prefix `ai-admin`** under the global `api` prefix → `/api/ai-admin`.
2. **Permission = COMPANY EDIT** — same Settings pattern, no new RBAC module.
3. **Create owner = `user.id`** for External and Internal Agents.
4. **Workspace grant always `scopeType: 'WORKSPACE'`** even from the contextual sheet.
5. **403 without permission uses a different `employeeId`** because `EmployeeGuard` caches 60s by employee id.
6. **Select `onValueChange` accepts `string \| null`** — UI helpers ignore null/empty instead of widening state types.

## Known risks

1. **No browser E2E** of Settings → AI & Agents. HTTP and unit tests cover authorization and secret redaction; visual/flow bugs can remain.
2. **Several UI panels exceed the 50-line function guideline** while staying under the 300-line file limit. Split in a polish chat if required.
3. **Policy candidate replace has no dedicated editor.** Operators create a new policy or call the API.
4. **Usage/Approvals are empty shells.** Do not treat them as runtime.
5. **J 186 / K 205 / K 209 / D 91** remain from earlier chats.
6. **Nest catalog bind is still missing.** Manual sync works; scheduled catalog sync is not a Nest job yet.

## Chat 7 entry point

Chat 7 is **Security, Regression and Operational Hardening**, plus the leftover Nest bind:

1. Bind `AI_MODEL_CATALOG_SYNC_CONTRACT.runnerMethod` on `SchedulerService` with `rosterIntent=off`. Do not grow `scheduler.service.ts` past the file-size limit without splitting.
2. Do not change REST/MCP routes, tool names, error codes or envelopes.
3. Walk AL (security hardening) and AM (regression) from the Phase 1 checklist. Do not invent rate-limit counters (J 186), output schema validator (K 205), or the K 209 commit/`complete()` split unless the hardening chat explicitly absorbs them.
4. Never redisplay a provider key or External Agent token. Do not add a second secret store or grant table.
5. Do not open Credentials vault / client-password UI from AI admin.

| Debt                      | Why it is still open                                              |
| ------------------------- | ----------------------------------------------------------------- |
| J 186 `[~]`               | Rate-limit counters/windows are section U                         |
| K 205 `[~]` / W 368 `[~]` | Output schema validator                                           |
| K 209 `[~]`               | Domain commit and idempotency `complete()` split                  |
| D 91 `[~]`                | Approval lifecycle emitters                                       |
| AA 420 Nest catalog       | SYSTEM runner exists; Nest bind is Chat 7 with `rosterIntent=off` |
| 584/585 candidate editor  | Create/activate UI only                                           |
| Live provider keys        | Do not invent; ask if a real validate/sync is needed              |
| Browser Admin UI          | Not click-tested in this chat                                     |

## Verification (Chat 6)

- Проверял: **GPT-5.6 Sol**, 2026-08-22.
- Вердикт: **FAIL**.
- Git:
  - ветка `sipan`, `HEAD e62d745becc6c41f6adaaeba8a9ad6f35acde5c4`;
  - working tree не чистый: **20 tracked changes + 87 untracked files**; Chat 6 не закоммичен;
  - заявленные директории и файлы существуют; удалённых файлов/тестов нет;
  - `git diff --check HEAD` — exit 0;
  - миграций в diff нет, поэтому destructive/DROP/index/backward-compatibility review для Chat 6 неприменим.
- Запущено:
  - `pnpm --filter @nbos/database exec prisma migrate status` — exit 0; dev Neon `ep-late-frost-ag5aixzw`; **213 migrations found**; `Database schema is up to date!`;
  - `pnpm vitest run apps/api/src/modules/ai-platform/admin apps/web/src/features/ai-admin` — **13 files / 25 tests**, exit 0;
  - `pnpm vitest run apps/api/src/modules/ai-platform` — **61 passed + 2 skipped / 484 passed + 4 skipped**, exit 0;
  - `pnpm vitest run` — **811 passed + 2 skipped / 4064 passed + 4 skipped**, exit 0;
  - isolated `tsc --noEmit` for `@nbos/api`, `@nbos/web`, `@nbos/shared`, `@nbos/database` — все exit 0;
  - root-level eslint invocation по Chat 6 paths — exit 0, но она не загрузила package-local Next.js config;
  - корректный `pnpm --filter @nbos/web exec eslint <Chat 6 web paths>` — **exit 1: 1 error + 4 warnings**;
  - production scan: `any`, `console.log`, inline styles, `@ts-ignore`, lint bypasses и опасный HTML не найдены; default exports есть только в обязательных Next.js App Router page/layout entry points;
  - прямых Prisma writes в Tasks/Drive из AI-кода, raw secret persistence/response после issuance, ослабления guards и удалённых тестов не найдено.
- Расхождения с самоотчётом:
  - числа тестов, typecheck и migrate status совпали;
  - eslint self-report `0 errors / 0 warnings` ложен: package-aware запуск дал 1 error и 4 warnings;
  - AJ 565–566 помечены `[x]`, но create/issue/rotate теряют одноразовый токен до показа;
  - AJ 570 помечен `[x]`, но agent Activity не включает credential/grant/scope audit events;
  - AK 597 и effective-access counts помечены `[x]`, но истёкшие grants показываются как активные;
  - AJ 590–591 помечены `[x]`, но prompt/approval IDs только отображаются: assignment UI отсутствует;
  - handoff признаёт функции длиннее 50 строк как риск, хотя это явный запрет проекта; компонентных tests для критических UI flows нет;
  - AJ 582 завышен: `providerMetadata` не отображается, а API update tags/notes не выведен в UI.
- Найденные дефекты:
  - `apps/web/src/features/ai-admin/components/ExternalAgentCreateDialog.tsx:55-58`, `ExternalAgentListPanel.tsx:20-29,36-37,65-69` — `onCreated()` запускает parent loading/unmount до установки/показа one-time token; токен безвозвратно теряется — **critical**.
  - `apps/web/src/features/ai-admin/components/ExternalAgentCredentialsSection.tsx:28-38,103-109`, `ExternalAgentDetailPanel.tsx:33-47,54-55,170-174` — issue/rotate вызывают refresh, который размонтирует secret modal до показа токена — **critical**.
  - `apps/web/src/features/ai-admin/components/ExternalAgentCreateDialog.tsx:43-65` — create Agent и issue credential неатомарны; ошибка второго запроса показывается как общий create failure, повтор создаёт дубликат — **high**.
  - `apps/api/src/modules/ai-platform/grants/agent-grant.service.ts:230-235`, `apps/api/src/modules/ai-platform/admin/ai-admin-workspace-access.mapper.ts:22-26`, `apps/web/src/features/ai-admin/components/ExternalAgentListPanel.tsx:74-100` — active/current projection учитывает только `revokedAt`, игнорируя `expiresAt` — **high**.
  - `apps/api/src/modules/ai-platform/admin/ai-admin-external-agents.controller.ts:90-97` — agent Activity запрашивает только entity `EXTERNAL_AGENT`; credential/grant/scope mutations с дочерними entity IDs отсутствуют — **high**.
  - `apps/api/src/modules/ai-platform/admin/ai-admin-external-agent-access.controller.ts:50-73,136-139`, `ai-admin-internal-agent-access.controller.ts:81-84`, `ai-admin-workspace-access.controller.ts:47-50` — nested mutation routes не проверяют принадлежность credential/scope parent agent/workspace из URL — **medium**.
  - `apps/api/src/modules/ai-platform/admin/ai-admin-overview.controller.ts:37-41`, `apps/api/src/modules/audit/audit.service.ts:80-97` — `page/pageSize` не валидируются и не ограничиваются; malformed/negative/oversized input доходит до Prisma — **medium**.
  - `apps/web/src/features/ai-admin/components/InternalAgentAccessSection.tsx:35-42` — package-aware eslint: `react-hooks/set-state-in-effect`; ещё четыре `exhaustive-deps` warnings в External/Internal detail/access и Workspace panel — **quality gate failure**.
  - `apps/web/src/features/ai-admin/components/ProviderConnectDialog.tsx:38-50` — provider credential сохраняется до Validate, вопреки canonical connection flow Validate → Save — **medium**.
  - `apps/api/src/modules/ai-platform/providers/ai-provider-connection.service.ts:153-170` — provider validation проверяет ключ до row lock; параллельная rotate может пометить новый ключ validated результатом старого — **medium**.
  - `apps/web/src/features/ai-admin/components/ModelCatalogPanel.tsx:139-152` — отключение ACTIVE model происходит без confirmation/dependency preview, требуемых UX safety canon — **medium**.
  - `apps/web/src/features/ai-admin/components/ModelPolicyPanel.tsx:29-37,53` — candidate picker учитывает ACTIVE model, но не ACTIVE provider connection; UI предлагает заведомо отклоняемые кандидаты — **medium**.
  - `apps/web/src/features/ai-admin/components/InternalAgentDetailPanel.tsx:109-115` — prompt/approval policy assignment отсутствует, отображаются только текущие IDs — **medium**.
  - `apps/web/src/features/ai-admin/components/ExternalAgentAccessSection.tsx:27-33`, `InternalAgentAccessSection.tsx:35-42` — load errors молча превращаются в пустой access state — **medium**.
  - `apps/web/src/features/ai-admin/components/AiAdminOverviewPanel.tsx:67-80`, `apps/api/src/modules/ai-platform/admin/ai-admin-overview.mapper.ts:76-84` — Overview обещает failed connections, но считает только DISABLED/REVOKED — **low**.
  - `apps/api/src/modules/ai-platform/admin/ai-admin-models.controller.ts:24-28` — неизвестный `status` молча снимает фильтр вместо 400 — **low**.
  - `apps/api/src/modules/ai-platform/admin/dto/update-internal-agent.dto.ts:21-31` — пустые policy IDs проходят DTO boundary и доходят до FK write — **low**.
  - `apps/web/src/features/ai-admin/components/ProviderConnectDialog.tsx:46-50,59` — raw API key очищается только после success; Cancel сохраняет его в mounted state до следующего открытия — **low**.
  - `ExternalAgentDetailPanel.tsx:25-199`, `WorkspaceAiAccessPanel.tsx:25-144`, `ProviderListPanel.tsx:14-116`, `ModelPolicyPanel.tsx:23-123`, `InternalAgentDetailPanel.tsx:20-157`, `InternalAgentAccessSection.tsx:19-137` — функции превышают 50 строк и содержат глубокую JSX-вложенность; повторяется magic number `slice(0, 8)` — **quality violation**.
- Точные правки до повторной проверки:
  1. Сохранить one-time secret в стабильном owner-компоненте или откладывать refresh/unmount до закрытия modal; исправить create, issue и rotate.
  2. Добавить component tests, доказывающие, что raw token виден ровно один раз после create/issue/rotate и не теряется при refresh.
  3. Разделить partial create: после успешного Agent create не сообщать общий failure и не позволять повторно создать дубликат; дать безопасный retry issuance для уже созданного Agent.
  4. Исключать `expiresAt <= now` из active scopes/capabilities во всех admin projections/counts и покрыть boundary tests.
  5. Собрать полный agent Activity из agent + credential + capability + scope audit events либо записывать linkable `agentId`; добавить route/service test.
  6. Проверять parent ownership для nested credential/scope mutations и возвращать 404/409 при mismatch; добавить negative HTTP tests.
  7. Ввести validated pagination DTO с положительными границами и максимальным page size; invalid model status и пустые policy IDs должны возвращать 400.
  8. Привести provider connect к Validate-before-save либо явно согласовать и документировать безопасный альтернативный state flow; очищать raw key при любом закрытии.
  9. Защитить provider validation от concurrent key rotation через credential/config version check и concurrency-test.
  10. Добавить confirmation и реальный dependency disclosure для availability-impacting model/provider/policy actions.
  11. Фильтровать Model Policy candidates одновременно по ACTIVE model и ACTIVE provider connection.
  12. Реализовать prompt/approval foundation assignment UI либо вернуть AJ 590–591 в `[~]`.
  13. Не скрывать access-load failures: добавить error/retry state и блокировать mutations при неполной загрузке.
  14. Исправить package-aware eslint error/warnings и повторить lint из workspace `@nbos/web`.
  15. Честно вернуть незавершённые AJ/AK пункты в `[~]` до исправления и добавить component/route evidence вместо helper-only tests.
- Долги для следующего милстоуна после устранения FAIL:
  - 584/585 candidate editor; J 186; K 205/W 368; K 209; D 91; AA 420 Nest scheduler bind;
  - N+1 и отсутствие pagination в `AiAdminQueryService`;
  - split функций > 50 строк, устранение magic numbers и accessibility labels;
  - browser E2E для полного Settings → AI & Agents flow.
- Не проверено:
  - browser click-through и визуальная адаптивность — dev server/browser E2E не запускались;
  - live OpenAI/Anthropic validation/sync — реальные ключи не предоставлены;
  - opt-in real-DB suites и production writes — намеренно не запускались;
  - утверждение, что production Neon не контактировался ранее, невозможно доказать только текущим working tree.

## Remediation after FAIL

Independent Verification (Chat 6) remains FAIL evidence. This section records the implementer remediations applied afterward. Still not committed.

Critical / high:

1. One-time token: create/issue/rotate no longer refresh or remount the host while `OneTimeSecretModal` is open. `onCreated` / `onChanged` run after close. Partial create keeps the existing agent id and retries issuance only.
2. Expired grants: `isCurrentGrant` / `currentGrantWhere` exclude `expiresAt <= now` from workspace lists, capability projections, and UI counts.
3. Agent Activity: `AiAdminQueryService.getExternalAgentActivity` unions agent + credential + capability-grant + scope audit refs.
4. Nested ownership: rotate/revoke credential and revoke scope require the URL parent; mismatch is 404.

Medium / validation / UI:

5. `ActivityQueryDto` rejects non-positive / oversized pagination (max page size 100). Unknown model `status` is 400. Empty internal policy IDs fail DTO `@MinLength(1)`.
6. Provider connect is Validate-then-Save via `POST /api/ai-admin/providers/validate-draft`. Raw key is cleared on any close. Stored `validate` snapshots `keyPrefix` under row lock and conflicts if the key rotated mid-flight.
7. Disable of ACTIVE models/policies/providers uses confirm + dependency copy. Policy candidates require ACTIVE model **and** ACTIVE connection.
8. Prompt/approval foundation IDs are assignable on Internal Agent detail. Access catalog/grant loads surface errors and block mutations until ready.
9. Package-aware `@nbos/web` eslint on Chat 6 paths: 0 errors, 0 warnings after the remediations.

Still open (honest):

- AJ 584–585 in-place candidate-replace editor remains `[~]`.
- Several UI panels still have functions over 50 lines (known quality debt).
- No browser E2E. Live provider keys were not used.
- Overview attention still has no separate FAILED connection status (DISABLED/REVOKED/EXPIRED only).

## Reverification after remediation

- Проверял: **GPT-5.6 Sol**, 2026-08-22.
- Вердикт: **FAIL**. Critical one-time-token defect fixed, but provider rotation/concurrency and required dependency disclosure remain incomplete.
- Git:
  - branch `sipan`, `HEAD e62d745becc6c41f6adaaeba8a9ad6f35acde5c4`;
  - no remediation commit; working tree: **26 tracked changes + 101 untracked files**;
  - `git diff --check HEAD` — exit 0; deleted files/tests absent;
  - no migration files in the Chat 6 diff.
- Запущено:
  - `pnpm --filter @nbos/database exec prisma migrate status` — exit 0; dev Neon `ep-late-frost-ag5aixzw`; **213 migrations**; schema up to date;
  - `pnpm vitest run apps/api/src/modules/ai-platform/admin apps/web/src/features/ai-admin` — **18 files / 37 tests**, exit 0;
  - `pnpm vitest run apps/api/src/modules/ai-platform` — **65 passed + 2 skipped / 495 passed + 4 skipped**, exit 0;
  - `pnpm vitest run` — **817 passed + 2 skipped / 4082 passed + 4 skipped**, exit 0;
  - isolated `tsc --noEmit` for API, web, shared and database — all exit 0;
  - package-aware `@nbos/web` eslint on Chat 6 paths — exit 0, 0 errors / 0 warnings;
  - repeated production scan found no `any`, `console.log`, inline styles, lint bypasses, new files over 300 lines, direct Tasks/Drive Prisma writes, deleted tests or raw-secret projections.
- Подтверждённые исправления:
  - create/issue/rotate keep the one-time-secret host mounted; refresh runs after modal close;
  - partial create retains the created agent and retries issuance without a second create;
  - expired grants are excluded from active projections/counts;
  - agent Activity includes agent, credential, capability and scope audit refs;
  - parent mismatch returns 404 for nested credential/scope routes;
  - activity pagination DTO, model status and empty-string policy ID validation are wired;
  - provider create uses Validate → Save and clears the draft key on close;
  - ACTIVE model + ACTIVE connection candidate filtering works;
  - prompt/approval foundation assignment and visible access-load errors are present;
  - package-aware lint is clean.
- Расхождения с remediation self-report:
  - provider rotate mode does not receive the connection provider and keeps local provider at default `OPENAI`;
  - stored-provider validation does not lock a credential/config version: it compares only the non-unique display `keyPrefix`;
  - disable confirmations contain generic warnings, not the real dependency names/counts requested by the FAIL correction;
  - `one-time-secret-flow.test.ts` tests extracted pure helpers, not the mounted create/issue/rotate lifecycle; the required component-level regression evidence is still absent;
  - nested ownership returns 404, but check and mutation remain separate service calls rather than one transaction.
- Оставшиеся дефекты:
  - `apps/web/src/features/ai-admin/components/ProviderConnectDialog.tsx:32-35,52-56`, `ProviderListPanel.tsx:149,170-186` — rotate hides provider selection and never passes `row.provider`; an Anthropic replacement key is validated with the OpenAI adapter and cannot be reliably rotated — **high**.
  - `apps/api/src/modules/ai-platform/providers/ai-provider-connection.service.ts:165-199`, `ai-provider-connection.lock.ts:13-26` — validation snapshots/compares only `keyPrefix`; same-prefix key rotation or concurrent `baseUrl` update can mark changed configuration validated by a stale result — **medium**.
  - `apps/web/src/features/ai-admin/components/ProviderListPanel.tsx:100-104`, `ModelCatalogPanel.tsx:118-139`, `ModelPolicyPanel.tsx:126-145` — confirmation text is generic; actual dependent policies/Internal Agents are not queried or displayed — **medium**.
  - `apps/web/src/features/ai-admin/one-time-secret-flow.test.ts:8-37` — helper-only tests cannot regress the original remount/state-loss bug in React components — **medium evidence gap**.
  - `apps/web/src/features/ai-admin/components/ExternalAgentCredentialsSection.tsx:73-92` — expired credentials cannot be rotated in the UI although the service and client runbook support rotation as recovery — **medium**.
  - `apps/web/src/features/ai-admin/external-agent-actions.ts:8-13`, `ExternalAgentDetailPanel.tsx:169-177` — EXPIRED agents can receive tokens/grants but the UI cannot extend agent expiry; resulting credentials cannot authenticate — **medium**.
  - `apps/api/src/modules/ai-platform/admin/ai-admin-external-agents.controller.ts:87-90` — activity service supports pagination but the route does not accept/pass `ActivityQueryDto`, so only the default first page is reachable — **low**.
  - `apps/api/src/modules/ai-platform/admin/dto/update-internal-agent.dto.ts:21-34` — `@MinLength(1)` still accepts whitespace-only policy IDs — **low**.
- Точные правки до следующего recheck:
  1. Pass the immutable connection provider into rotate UI, validate Anthropic keys with the Anthropic adapter, and add OpenAI + Anthropic rotate tests.
  2. Introduce a real credential/config revision (`updatedAt`/version or equivalent), snapshot the exact key/config used for validation, and compare that revision under the final row lock. Test same-prefix rotation and concurrent base URL update.
  3. Add dependency-impact API projections and show actual policy/agent names or counts before model/policy/provider disable.
  4. Add a mounted UI regression test for create/issue/rotate modal lifecycle, or equivalent test infrastructure that can reproduce parent loading/unmount.
  5. Reconcile EXPIRED behavior: allow recovery rotation for expired credentials; do not issue/grant to an expired actor without an expiry-extension flow.
  6. Pass validated pagination to the per-agent Activity route and trim/reject whitespace-only policy IDs.
- Долги после устранения FAIL:
  - AJ 584–585 candidate editor;
  - functions over 50 lines and remaining accessibility/magic-number cleanup;
  - N+1/pagination work in admin list projections;
  - J 186, K 205/W 368, K 209, D 91 and AA 420 scheduler bind.
- Не проверено:
  - browser click-through/visual behavior;
  - live OpenAI/Anthropic calls;
  - opt-in real-DB suites and production writes.

## Remediation after reverification FAIL

Independent Reverification after remediation remains FAIL evidence. This section records the implementer remediations for the six numbered corrections. Still not committed. Verification and Reverification sections above are not rewritten.

1. **Anthropic rotate uses Anthropic.** `ProviderRotateButton` passes the immutable `row.provider` into `ProviderConnectDialog`. Draft validate calls `draftValidateProvider({ mode, selected, connectionProvider })`, which refuses rotate without the stored provider. `validateUnsavedProviderKey` and stored `validate()` both call `adapters.get(provider)` for that type. Tests: `select-provider.test.ts`, `ai-provider-draft-validate.test.ts`, `ai-admin.providers.http.int.test.ts`, stored Anthropic `validate()` in `ai-provider-connection.service.test.ts`.

2. **Config revision, not `keyPrefix`.** Validation snapshots `connection.updatedAt` + secret `updatedAt` + `baseUrl` under the row lock (`toProviderConfigRevision` / `providerConfigChanged`). A same-prefix rotate or a mid-flight `baseUrl` change throws `ConflictException` and does not write `lastValidatedAt`. No new migration.

3. **Named disable impact.** `GET /api/ai-admin/disable-impact?kind=&id=` projects dependent Model Policies and Internal Agents. Disable confirmations (`DisableImpactConfirm`) load that payload and stay blocked until names/counts are shown. Revoke remains a generic confirm.

4. **Remount model.** `reduceSecretHost` is the parent-loading/unmount state machine (no RTL in repo). `ExternalAgentListPanel` owns it: `PARENT_REFRESH_START` cannot drop a visible token; `CANCEL_CREATE` is a no-op while a secret is on screen; `CLOSE_SECRET` runs only after the modal closes.

5. **EXPIRED.** Issue/grant UI is ACTIVE|DISABLED only. Expired credentials can be rotated on a live agent. EXPIRED agents get an expiry-extension control; `ExternalAgentService.update` writes `status: ACTIVE` when a stored `EXPIRED` row receives a future `expiresAt`. Computed EXPIRED (`ACTIVE` + past `expiresAt`) recovers by the date write alone.

6. **Pagination + whitespace IDs.** Per-agent Activity accepts `ActivityQueryDto`. Internal policy IDs are trimmed; whitespace-only values fail `@MinLength(1)`.

Still open (honest):

- AJ 584–585 in-place candidate-replace editor remains `[~]`.
- Several UI panels still have functions over 50 lines.
- No React Testing Library and no browser E2E. The remount evidence is the host reducer plus the wired list panel, not a mounted RTL suite.
- Nested ownership check and mutation remain two service calls (404 is still returned).
- Credential/grant **services** still lock only against REVOKED. Computed EXPIRED is blocked in Chat 6 admin UI; a direct HTTP issue/grant on an `ACTIVE` row with a past `expiresAt` is still a Chat 2 lock-shape debt.
- Overview attention still has no separate FAILED connection status.
- Live OpenAI/Anthropic keys were not used.

Checks run after this pass: admin+web 23/56; `ai-platform` 68+2 / 508+4; full vitest 823+2 / 4106+4; isolated `tsc` for api/web/shared/database exit 0; package-aware `@nbos/web` eslint on Chat 6 paths exit 0.

## Reverification after second remediation

- Проверял: **GPT-5.6 Sol**, 2026-08-22.
- Вердикт: **FAIL**. The previous Anthropic adapter mismatch and generic dependency copy are fixed, but the Validate → Save guarantee is still bypassable by an in-flight UI race.
- Git:
  - branch `sipan`, `HEAD e62d745becc6c41f6adaaeba8a9ad6f35acde5c4`;
  - no commit; working tree: **28 tracked changes + 113 untracked files**;
  - `git diff --check HEAD` — exit 0; no deleted files/tests;
  - no migration files added or modified.
- Запущено:
  - `pnpm --filter @nbos/database exec prisma migrate status` — exit 0; dev Neon `ep-late-frost-ag5aixzw`; **213 migrations**; schema up to date;
  - targeted admin + web — **23 files / 56 tests**, exit 0;
  - `pnpm vitest run apps/api/src/modules/ai-platform` — **68 passed + 2 skipped / 508 passed + 4 skipped**, exit 0;
  - full `pnpm vitest run` — **823 passed + 2 skipped / 4106 passed + 4 skipped**, exit 0;
  - isolated API/web/shared/database `tsc --noEmit` — all exit 0;
  - package-aware `@nbos/web` eslint on Chat 6 paths — exit 0, 0 errors / 0 warnings;
  - prohibited-pattern scan remains clean; no direct Tasks/Drive Prisma writes or raw-secret projections found.
- Подтверждённые исправления:
  - provider rotate receives immutable `row.provider`; Anthropic draft/stored validation selects the Anthropic adapter;
  - same-prefix/baseUrl changes are compared through connection + secret revision data and tested;
  - disable-impact endpoint returns named policies/Internal Agents, and initial/error loading blocks confirmation;
  - create one-time-secret host reducer is wired; issue/rotate still delay refresh until secret close;
  - EXPIRED UI blocks issue/grant, allows expired-credential recovery rotation and exposes expiry extension;
  - per-agent Activity route accepts validated pagination;
  - whitespace-only internal policy IDs are trimmed and rejected.
- Расхождения с self-report / оставшиеся дефекты:
  - `apps/web/src/features/ai-admin/components/ProviderConnectDialog.tsx:54-78,121-160,167-178` — provider/key inputs stay editable during async validation. If key/provider A is validating, the user can enter B; the late success for A sets `validated=true` and Save persists unvalidated B — **high**.
  - `apps/web/src/features/ai-admin/components/ProviderListPanel.tsx:164-169,190-208`, `ProviderConnectDialog.tsx:57-64` — rotate draft validation passes provider + key but not the stored custom `baseUrl`; custom-endpoint connections validate the replacement against the default endpoint — **medium**.
  - `apps/api/src/modules/ai-platform/providers/ai-provider-connection.lock.ts:15-39` — revision identity is based on millisecond timestamps. It is substantially safer than `keyPrefix`, but two validation-relevant writes in the same `TIMESTAMP(3)` millisecond can still compare equal — **medium race debt**.
  - `apps/web/src/features/ai-admin/components/DisableImpactConfirm.tsx:18-27,37` — cached impact data keeps Confirm enabled while the same target is refetching; changed dependencies can be confirmed from stale names/counts — **medium**.
  - `apps/api/src/modules/ai-platform/credentials/agent-credential.locks.ts:14-16`, `agents/agent-row-lock.ts:29-60`, `grants/agent-grant.service.ts:65-67,149-151` — EXPIRED blocking exists only in the UI. Direct admin HTTP issue/grant still creates unusable access for an expired actor — **medium**, acknowledged by implementer.
  - `apps/web/src/features/ai-admin/one-time-secret-host.ts:11-12,36-37` — `ISSUE_WITH_TOKEN` / `ROTATE_WITH_TOKEN` are test-only reducer actions; production issue/rotate remain safe through local state but the reducer evidence covers create only — **low evidence discrepancy**.
  - `apps/api/src/modules/audit/audit.service.ts:84-96,108-120` — paginated audit ordering uses only `createdAt`; equal timestamps can produce unstable page boundaries — **low**.
  - `AiAdminActivityPanel.tsx:15-20`, `ExternalAgentDetailPanel.tsx:35-42` — API pagination is fixed, but current UI still exposes only page 1 — **low debt**.
- Точные правки до следующего recheck:
  1. Bind validation success to an immutable request snapshot/fingerprint and ignore stale responses, or disable all validation-relevant inputs while validating. Add a deferred-response test: validate A → edit to B → A succeeds → Save must stay disabled.
  2. Pass stored `baseUrl` and every validation-relevant connection field into rotate draft validation.
  3. Replace timestamp-only revision identity with a collision-free secret/config fingerprint or monotonic version. A no-migration option is to snapshot/compare the exact encrypted-secret fingerprint plus validation-relevant connection fields under both row locks.
  4. Disable impact confirmation while `isFetching`, forcing fresh dependency data before every confirm.
  5. Enforce actor expiry in the credential/grant service boundary, not only React UI, while preserving rotation of an expired credential owned by a non-expired agent.
  6. Add stable audit ordering (`createdAt`, then unique id) and expose pagination controls where historical Activity is claimed.
- Остаётся долгом:
  - ownership check + mutation are separate calls;
  - no RTL/browser E2E; functions over 50 lines;
  - AJ 584–585 candidate editor;
  - Overview FAILED-state projection;
  - J 186, K 205/W 368, K 209, D 91, AA 420 scheduler bind.
- Не проверено:
  - live OpenAI/Anthropic/custom-endpoint calls;
  - browser click-through/visual behavior;
  - opt-in real-DB suites and production writes.

## Remediation after second reverification FAIL

Independent Reverification after second remediation remains FAIL evidence. This section records the implementer remediations for its six numbered corrections. Still not committed. Earlier Verification / Reverification / remediation sections are not rewritten.

1. **Validate → Save is bound to a draft fingerprint.** `applyDraftValidationSuccess` ignores a late success for key A after the operator changed the draft to B. Save stays disabled unless the current provider/key/`baseUrl` matches the validated snapshot. Inputs that affect validation are also disabled while the request is in flight. Test: `provider-draft-gate.test.ts`.

2. **Rotate draft validate includes stored `baseUrl`.** `draftValidateRequest` in rotate mode sends `connectionProvider` + `connectionBaseUrl` with the replacement key. `ProviderRotateButton` passes `row.baseUrl`. HTTP validate-draft forwards `baseUrl`.

3. **Revision identity is the encrypted-secret fingerprint**, plus provider and `baseUrl`, compared under both row locks. Timestamp-only `updatedAt` is no longer used. Same-prefix rotate with a different ciphertext conflicts; a metadata-only `updatedAt` change does not.

4. **Disable-impact confirm is blocked while `isFetching`.** Cached names are not enough; `isDisableImpactConfirmReady` requires fresh data.

5. **EXPIRED is enforced at the credential/grant lock**, not only in React. `assertAgentNotExpired` rejects stored and computed expiry on issue/grant/rotate-into-agent. Rotating an expired credential owned by a live agent still works. Extending expiry via `update` still uses `lockLiveAgent` only.

6. **Audit pages order by `createdAt desc`, then `id desc`.** Overview and per-agent Activity expose `ListPagination` over the existing `ActivityQueryDto`.

Still open (honest):

- AJ 584–585 in-place candidate-replace editor remains `[~]`.
- Several UI panels still have functions over 50 lines.
- No RTL / browser E2E.
- Ownership check + mutation remain two service calls.
- Overview attention still has no separate FAILED connection status.
- Live OpenAI/Anthropic keys were not used.

Checks run after this pass: admin+web 24/61; `ai-platform` 69+2 / 517+4; full vitest 825+2 / 4119+4; isolated `tsc` for api/web/shared/database exit 0; package-aware `@nbos/web` eslint on Chat 6 paths exit 0.

## Reverification after third remediation

- Проверял: **GPT-5.6 Sol**, 2026-08-22.
- Вердикт: **FAIL**. The reported A→B draft race and stored `baseUrl` omission are fixed, but the provider snapshot still omits validation-relevant metadata and does not validate the exact locked snapshot.
- Git:
  - branch `sipan`, `HEAD e62d745becc6c41f6adaaeba8a9ad6f35acde5c4`;
  - no commit; working tree: **33 tracked changes + 118 untracked files**;
  - `git diff --check HEAD` — exit 0; no deleted files/tests;
  - no migration files added or changed.
- Запущено:
  - `pnpm --filter @nbos/database exec prisma migrate status` — exit 0; dev Neon `ep-late-frost-ag5aixzw`; **213 migrations**; schema up to date;
  - targeted admin + web — **24 files / 61 tests**, exit 0;
  - AI Platform — **69 passed + 2 skipped / 517 passed + 4 skipped**, exit 0;
  - full workspace — **825 passed + 2 skipped / 4119 passed + 4 skipped**, exit 0;
  - isolated API/web/shared/database `tsc --noEmit` — all exit 0;
  - package-aware `@nbos/web` eslint — exit 0, 0 errors / 0 warnings;
  - prohibited-pattern/direct Tasks/Drive write scans remain clean.
- Подтверждённые исправления:
  - draft validation success is fingerprint-bound to provider + key + base URL; stale A→B success cannot enable Save;
  - validation-relevant form fields are disabled while the request is in flight;
  - rotate draft validation receives stored provider and `baseUrl`;
  - ciphertext/provider/baseUrl comparison replaces timestamp-only revision;
  - disable-impact confirm blocks while refetching;
  - ACTIVE and stored/computed EXPIRED cases are enforced in the new issue/grant lock tests;
  - audit order is `createdAt desc, id desc`; Overview and per-agent Activity have pagination controls.
- Оставшиеся дефекты:
  - `apps/api/src/modules/ai-platform/providers/ai-provider-connection.lock.ts:15-40,55-63`, `ai-provider-connection.service.ts:167-205` — config revision omits `providerOrganizationId` and `providerProjectId`, although both are sent by the OpenAI adapter. A concurrent metadata update can stamp `lastValidatedAt` from stale headers — **medium**.
  - `apps/api/src/modules/ai-platform/providers/ai-provider-connection.service.ts:167-187` — the first transaction snapshots revision A, then credentials are reread outside that snapshot. A normal `baseUrl` A→B→A sequence can validate B while the final comparison sees A and accepts the stale result — **medium ABA race**.
  - `apps/api/src/modules/ai-platform/providers/ai-provider-connection.service.ts:98-130` — changing base URL / organization / project does not clear `lastValidatedAt`, so an edited, unvalidated config remains displayed as validated — **medium**.
  - `apps/web/src/features/ai-admin/components/ProviderListPanel.tsx:191-210`, `ProviderConnectDialog.tsx:48-55,75-79`, `validate-draft-provider.dto.ts:4-15` — rotate draft validation still omits stored OpenAI organization/project metadata — **medium**.
  - `apps/api/src/modules/ai-platform/agents/agent-issuable.ts:11-21`, `external-agent-state.ts:36-45` — expiry assertion uses effective state where `DISABLED` wins before elapsed `expiresAt`; a disabled-but-expired agent can still receive credentials/grants/rotation — **medium**.
  - `apps/api/src/modules/ai-platform/admin/dto/issue-credential.dto.ts:10-12`, `rotate-credential.dto.ts:8-10`, `grant-capability.dto.ts:14-16`, `grant-scope.dto.ts:24-26` — past expiry timestamps are accepted. Rotation can revoke a valid predecessor and create an immediately expired replacement — **medium**.
  - `apps/web/src/features/ai-admin/components/ExternalAgentActivitySection.tsx:13-28` — per-agent Activity ignores loading/error states; a failed page request renders `No activity yet` with no retry — **medium UX correctness**.
  - `apps/web/src/features/ai-admin/components/ProviderConnectDialog.tsx:58-100` — closing/reopening can overlap validation requests; an old completion may clear a newer successful fingerprint or release `busy` early. This is safe against unvalidated Save but causes stale request-state corruption — **low**.
  - `apps/web/src/features/ai-admin/components/OneTimeSecretModal.tsx:23,57-63` — `I have stored it` closes without resetting `copied`; a later secret can initially display `Copied` — **low**.
- Точные правки до следующего recheck:
  1. Snapshot encrypted key + provider + base URL + organization + project under the first lock, validate those exact snapshot values, then compare the same fields under the final lock. Do not reread a different credential/config for the network call.
  2. Clear `lastValidatedAt` whenever any validation-relevant provider config changes.
  3. Include stored organization/project in replacement-key validation, preferably through a server-side validate-and-rotate operation bound to the locked connection revision rather than client-supplied metadata.
  4. Make expiry rejection independent of display-state precedence: elapsed `expiresAt` must reject even when stored status is `DISABLED`.
  5. Reject past successor/grant expiry at the service boundary before mutating or revoking a predecessor.
  6. Add loading/error/retry handling to per-agent Activity; generation-guard overlapping draft validations; reset one-time modal copied state on every explicit close.
- Остаётся долгом:
  - ownership check + mutation remain separate calls;
  - no RTL/browser E2E; functions over 50 lines;
  - AJ 584–585 candidate editor;
  - Overview FAILED-state projection;
  - J 186, K 205/W 368, K 209, D 91, AA 420 scheduler bind.
- Не проверено:
  - live provider/custom-endpoint calls;
  - browser click-through/visual behavior;
  - opt-in real-DB suites and production writes.

## Remediation after third reverification FAIL

Independent Reverification after third remediation remains FAIL evidence. This section records the implementer remediations for its six numbered corrections. Still not committed. Earlier Verification / Reverification / remediation sections are not rewritten.

1. **Stored validate uses the locked snapshot, not a later reread.** Revision identity is encrypted key + provider + `baseUrl` + `providerOrganizationId` + `providerProjectId`. `validate()` decrypts that snapshotted ciphertext and sends those exact credentials to the adapter. The final lock compares the same fields. An A→B→A reread cannot substitute B for the network call. Org/project mid-flight changes `409`.

2. **`update()` clears `lastValidatedAt`** when organization, project, or `baseUrl` actually change. A name-only update leaves the timestamp in place. `rotateKey` already restamps it after a successful stored-config validation.

3. **Replacement keys are validated against stored metadata.** `POST /api/ai-admin/providers/:id/validate-replacement` accepts only `{ apiKey }`. `rotateKey` snapshots the locked config, validates the new key with stored provider/`baseUrl`/org/project, then re-locks and writes only if the revision is unchanged. A failed replacement is not stored. The rotate dialog no longer posts client-chosen org/project.

4. **Elapsed `expiresAt` rejects even when status is `DISABLED`.** `assertAgentNotExpired` no longer uses display-state precedence. Issue/grant/rotate-into-agent fail for a disabled row whose expiry has passed. Stored `EXPIRED` still fails.

5. **Past successor/grant `expiresAt` is rejected at the service boundary** (`assertFutureExpiry`) before `$transaction`, so issue/rotate/grant cannot revoke a predecessor or write an immediately expired successor. DTOs still accept an ISO timestamp; the service returns 400.

6. **Per-agent Activity shows loading/error/retry.** Overlapping provider validate/save uses a generation guard; close/reset bumps the generation so a stale `finally` cannot clear `busy` or a newer fingerprint. `OneTimeSecretModal` “I have stored it” and dialog dismiss both reset `copied`.

Still open (honest):

- AJ 584–585 in-place candidate-replace editor remains `[~]`.
- Several UI panels still have functions over 50 lines (`ProviderConnectDialog` is still one component function).
- No RTL / browser E2E. Generation-guard evidence is the helper unit test plus dialog wiring, not a mounted race.
- Ownership check + mutation remain two service calls.
- Overview attention still has no separate FAILED connection status.
- Rotate remains two HTTP calls (validate-replacement, then rotate). The write path itself is snapshot-bound; there is no single validate-and-rotate request.
- Live OpenAI/Anthropic keys were not used.

Checks run after this pass: admin+web 25/63; `ai-platform` 71+2 / 535+4; full vitest 828+2 / 4138+4; isolated `tsc` for api/web/shared/database exit 0; package-aware `@nbos/web` eslint on Chat 6 paths exit 0.

## Reverification after fourth remediation

- Проверял: GPT-5.6 Sol, 2026-08-22.
- Вердикт: **FAIL**.
- Git:
  - branch `sipan`, HEAD `e62d745becc6c41f6adaaeba8a9ad6f35acde5c4`;
  - working tree is not clean: 34 tracked changes + 124 untracked files (158 total);
  - `git diff --check HEAD` — exit 0;
  - deleted files and new migration files were not found.
- Запущено:
  - `pnpm --filter @nbos/database exec prisma migrate status` — 213 migrations; development Neon host `ep-late-frost-ag5aixzw`; `Database schema is up to date!`; migrations were not applied;
  - `pnpm vitest run apps/api/src/modules/ai-platform/admin apps/web/src/features/ai-admin` — 25 files / 63 tests passed;
  - `pnpm vitest run apps/api/src/modules/ai-platform` — 71 passed + 2 skipped files / 535 passed + 4 skipped tests;
  - `pnpm vitest run` — 828 passed + 2 skipped files / 4138 passed + 4 skipped tests;
  - isolated `tsc --noEmit` for api/web/shared/database — first concurrent run with the full suite exhausted the default Node heap; sequential retry with `NODE_OPTIONS=--max-old-space-size=8192` — all four exit 0;
  - package-aware `@nbos/web` eslint on Chat 6 paths — exit 0, 0 errors, 0 warnings;
  - prohibited-pattern recheck — no production `any`, `console.log`, non-Next default exports, direct Prisma Tasks/Drive writes, raw provider key in response/audit, deleted tests, or security-control weakening found.
- Расхождения с самоотчётом:
  - reported test, lint and successful isolated typecheck counts/status match the independent successful runs;
  - provider snapshot, replacement validation, `lastValidatedAt` reset, Activity states, validation generation helper and copied-state reset are present as reported;
  - “past expiry is rejected before transaction” is literally implemented, but this placement does not guarantee that the expiry is still future when the transaction mutates data.
- Найденные дефекты:
  - `apps/api/src/modules/ai-platform/credentials/agent-credential.service.ts:59-65,106-126` and `apps/api/src/modules/ai-platform/grants/agent-grant.service.ts:67-74,147-160` — `assertFutureExpiry` executes before Argon2 work and/or before waiting for row locks. A near-future timestamp can elapse before mutation; credential rotation can then revoke the valid predecessor and persist an already-expired successor. Recheck against a transaction-time `now` after locks and immediately before the first write — **medium**.
  - `apps/web/src/features/ai-admin/components/ProviderConnectDialog.tsx:60-72,113-135,139` — close/reopen is allowed while Save is in flight, and the success path does not verify its captured generation before `reset()`, `onCreated()` and `onOpenChange(false)`. A stale completion can erase/close a new draft; overlapping retries can create duplicate connections — **medium**.
  - `apps/api/src/modules/ai-platform/agents/external-agent-state.ts:36-46`, `apps/web/src/features/ai-admin/external-agent-actions.ts:4-24`, `apps/web/src/features/ai-admin/components/ExternalAgentDetailPanel.tsx:136-167` — effective state gives `DISABLED` precedence over elapsed `expiresAt`. The UI therefore offers issue/grant/rotate/re-enable, hides expiry extension, while the service correctly rejects those operations as expired — **medium**.
- Точные правки до следующего recheck:
  1. Revalidate successor/grant `expiresAt` under the same transaction and after required row locks, immediately before any predecessor revocation/upsert/create. Add a deterministic test where time advances or lock acquisition is delayed after the preliminary check.
  2. Make Provider Save completion generation-bound before every success side effect, and prevent or safely handle dismissal/reopen while the write outcome is pending. Add coverage for close → reopen → stale success and overlapping submissions.
  3. Represent disabled-but-expired agents consistently in the admin projection/actions: expose expiry extension and suppress issue/grant/rotate/enable until expiry is extended. Add API projection and UI action tests for `status=DISABLED` with elapsed `expiresAt`.
- Долги для следующего милстоуна:
  - ownership check + mutation remain separate calls;
  - no RTL/browser E2E; several UI functions exceed 50 lines;
  - AJ 584–585 candidate editor;
  - Overview FAILED-state projection;
  - J 186, K 205/W 368, K 209, D 91, AA 420 scheduler bind;
  - stored validation may finish after a concurrent disable and stamp `lastValidatedAt`;
  - replacement preflight failures are not durably audited.
- Не проверено:
  - live OpenAI/Anthropic/custom-endpoint calls;
  - browser click-through and visual behavior;
  - opt-in real-database/concurrency suites and production writes;
  - latest remediation is not isolated by a commit, so its exact delta cannot be mechanically separated from the accumulated uncommitted milestone; the affected implementation and tests were reviewed directly.

## Remediation after fourth reverification FAIL

Independent Reverification after fourth remediation remains FAIL evidence. This section records the implementer remediations for its three numbered corrections. Still not committed. Earlier Verification / Reverification / remediation sections are not rewritten.

1. **Successor/grant expiry is rechecked after locks, immediately before the first write.** The early `assertFutureExpiry` still fails fast before Argon2. Issue/rotate/grant then call it again under the transaction with transaction-time `now` after the required row locks and before predecessor revoke, create, or upsert. Rotate also uses that same `now` for the overlap window. Tests advance the clock only inside `$transaction` so a timestamp that was future at the preliminary check is past at write time; create/update/upsert do not run.

2. **Provider Save success is generation-bound, and dismiss is blocked while a write is pending.** `reset()` / `onCreated()` / close cannot run for a stale generation after close/reopen. Cancel, Escape/overlay, and inputs stay locked while `busy`. Helper coverage: close → reopen stale success, overlapping older Save, dismiss-while-busy.

3. **DISABLED + elapsed `expiresAt` projects as EXPIRED.** Revocation still wins. Admin `state` is therefore EXPIRED, so the existing action gates hide issue/grant/rotate/enable and show expiry extension. After a future `expiresAt` is stored the row can again project as DISABLED (status column unchanged) and re-enable becomes available. Chat 4 external auth codes are unchanged: `AGENT_EXPIRED` still maps to `AGENT_DISABLED`.

Still open (honest):

- AJ 584–585 in-place candidate-replace editor remains `[~]`.
- Several UI panels still have functions over 50 lines (`ProviderConnectDialog` is still one component function).
- No RTL / browser E2E. Dialog dismiss/save evidence is the generation helper plus wiring, not a mounted race.
- Ownership check + mutation remain two service calls.
- Overview attention still has no separate FAILED connection status.
- Direct `enable` HTTP on a stored `DISABLED` row with elapsed expiry is not newly rejected; the UI no longer offers it, and the resulting projection is still EXPIRED.
- Stored validation may finish after a concurrent disable and stamp `lastValidatedAt`.
- Replacement preflight failures are not durably audited.
- Live OpenAI/Anthropic keys were not used.

Checks run after this pass: admin+web 25/67; `ai-platform` 71+2 / 540+4; full vitest 828+2 / 4147+4; isolated `tsc` for api/web/shared/database exit 0; package-aware `@nbos/web` eslint on Chat 6 paths exit 0.

## Reverification after fifth remediation

- Проверял: GPT-5.6 Sol, 2026-08-22.
- Вердикт: **PASS WITH DEBTS**.
- Git:
  - branch `sipan`, HEAD `e62d745becc6c41f6adaaeba8a9ad6f35acde5c4`;
  - working tree is not clean: 36 tracked changes + 124 untracked files (160 total);
  - `git diff --check HEAD` — exit 0;
  - deleted files and new migration files were not found.
- Запущено:
  - `pnpm --filter @nbos/database exec prisma migrate status` — 213 migrations; development Neon host `ep-late-frost-ag5aixzw`; `Database schema is up to date!`; migrations were not applied;
  - `pnpm vitest run apps/api/src/modules/ai-platform/admin apps/web/src/features/ai-admin` — 25 files / 67 tests passed;
  - `pnpm vitest run apps/api/src/modules/ai-platform` — 71 passed + 2 skipped files / 540 passed + 4 skipped tests;
  - `pnpm vitest run` — 828 passed + 2 skipped files / 4147 passed + 4 skipped tests;
  - isolated `tsc --noEmit` for api/web/shared/database with `NODE_OPTIONS=--max-old-space-size=8192` — all four exit 0;
  - package-aware `@nbos/web` eslint on Chat 6 paths — exit 0, 0 errors, 0 warnings;
  - `git diff --check HEAD` and the latest affected implementation/tests were re-read; no new prohibited production `any`, `console.log`, default exports outside Next routes, raw secret exposure, direct Prisma Tasks/Drive writes, deleted tests, or weakened security controls were found.
- Расхождения с самоотчётом: нет по заявленным исправлениям и числам проверок.
- Подтверждено:
  - credential issue/rotate and capability/scope grant repeat the future-expiry check after required locks and immediately before the first write; deterministic clock-advance tests assert that create/update/upsert are not called;
  - credential rotation uses the same transaction-time `now` for expiry validation, overlap calculation and predecessor mutation;
  - Provider Save success checks the captured generation before reset/refresh/close; busy state blocks Cancel and dialog dismissal and disables provider/name/key inputs;
  - revocation still has precedence, while a `DISABLED` row with elapsed `expiresAt` projects as `EXPIRED`; existing UI action gates expose expiry extension and suppress issue/grant/rotate/enable until recovery.
- Блокирующие дефекты: не найдены.
- Долги для следующего милстоуна:
  - direct `enable` HTTP on stored `DISABLED` + elapsed expiry still writes/audits `ACTIVE`; effective state remains `EXPIRED`, so this does not immediately restore authorization, but a later expiry extension activates the row without a second enable. Reject the transition or define and test this desired-state behavior explicitly;
  - Provider dialog race evidence is helper-level rather than mounted RTL/browser coverage;
  - ownership check + nested mutation remain separate service calls;
  - several UI component functions exceed 50 lines;
  - AJ 584–585 in-place candidate-replace editor remains `[~]`;
  - Overview attention has no separate FAILED provider status;
  - stored provider validation can stamp `lastValidatedAt` after a concurrent disable;
  - replacement-key preflight failures are not durably audited;
  - J 186, K 205/W 368, K 209, D 91 and AA 420 scheduler bind remain outside this completed slice.
- Не проверено:
  - live OpenAI/Anthropic/custom-endpoint calls;
  - browser click-through, accessibility and visual behavior;
  - opt-in real-database/concurrency suites and production writes;
  - exact remediation delta as a standalone commit, because the milestone remains accumulated and uncommitted.
