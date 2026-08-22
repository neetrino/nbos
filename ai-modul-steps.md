# AI Platform Phase 1 — план исполнения

Рабочий файл: как ведём текущую Phase 1 модуля `docs/NBOS/02-Modules/21-AI-Platform/`, какие модели используем и какими промтами запускаем новые чаты.

Канон задачи:

- `docs/NBOS/02-Modules/21-AI-Platform/10-Phase-1-AI-Foundation-and-External-Agent-Implementation.md` — executable checklist;
- `docs/NBOS/02-Modules/21-AI-Platform/16-Phase-1-Execution-Strategy.md` — стратегия исполнения;
- `docs/NBOS/02-Modules/21-AI-Platform/26-Phase-1-Chat-8-Acceptance.md` — фактический acceptance Chat 8;
- `docs/NBOS/02-Modules/21-AI-Platform/27-Phase-1-Continuation-After-Chat-8.md` — решение продолжить текущую Phase 1 до полного exit criterion.

## Метод работы

Один implementation milestone = исполнитель → независимая проверка → исправление найденного → повторная проверка → commit.

Эстафета между чатами передаётся handoff-файлом в репозитории, а не памятью старого чата.

Правила:

- новый milestone всегда начинается в свежем чате;
- verifier всегда новый и другого семейства моделей, чем исполнитель;
- verifier читает handoff, но не принимает его как доказательство;
- FAIL возвращается в тот же executor chat для исправления, после чего тот же verifier перепроверяет;
- `[x]` допустим только при реальном code/test/live evidence;
- не создавать второй AI architecture/runtime рядом с существующим Actor → Policy → Capability → Domain Action → Audit;
- foundation реализуется минимально, но реально: не превращать future contract в ненужную enterprise-подсистему;
- production-only credentials/windows не подделывать моками как live acceptance.

## Милстоуны и модели

| Chat | Содержание                               | Исполнитель                    | Проверка           | Статус                           |
| ---- | ---------------------------------------- | ------------------------------ | ------------------ | -------------------------------- |
| 1    | Foundation + Audit                       | Cursor Grok 4.6                | Claude Opus 5 High | DONE                             |
| 2    | Credentials + Auth + Policy              | Claude Opus 5 High             | GPT-5.6 Sol High   | PASS WITH DEBTS                  |
| 3    | Capabilities + Tasks                     | Cursor Grok 4.6                | GPT-5.6 Sol High   | PASS WITH DEBTS                  |
| 4    | REST + MCP                               | Claude Opus 5 High             | Cursor Grok 4.6    | PASS WITH DEBTS                  |
| 5    | Providers + Models                       | Cursor Grok 4.6                | GPT-5.6 Sol High   | PASS WITH DEBTS                  |
| 6    | AI Admin UI                              | Cursor Grok 4.6 + Composer 2.5 | GPT-5.6 Sol High   | PASS WITH DEBTS                  |
| 7    | Security + regression                    | Claude Opus 5 High             | GPT-5.6 Sol High   | PASS WITH DEBTS                  |
| 8    | Intermediate acceptance                  | Claude Opus 5 High             | GPT-5.6 Sol High   | DONE — found missing AD–AI slice |
| 9    | Prompt + Context/Memory/Knowledge        | Cursor Grok 4.6                | GPT-5.6 Sol High   | PASS WITH DEBTS                  |
| 10   | Approvals + Customer-facing safety       | Cursor Grok 4.6                | GPT-5.6 Sol High   | PASS WITH DEBTS                  |
| 11   | Usage/Cost/Evaluation + actionable debts | Cursor Grok 4.6                | GPT-5.6 Sol High   | PASS WITH DEBTS                  |
| 12   | Final Phase 1 re-acceptance              | Claude Opus 5 High             | GPT-5.6 Sol High   | PLANNED                          |

## Текущее состояние

Chat 8 подтвердил:

- External Agent реально работает по REST и MCP;
- Workspace/Task/Drive isolation работает;
- create/update выдаются отдельными grants;
- delete/force-complete отсутствуют;
- revoke credential и disable Agent блокируют доступ;
- OpenAI connect/validate/sync работает;
- новые модели остаются `DISCOVERED`;
- FIXED и PRIMARY_FALLBACK foundation работают;
- Internal Agent foundation работает;
- human NBOS regression зелёный.

Но canonical Phase 1 exit criterion 9 не выполнен полностью до Chat 12. Chat 9 закрыл AD/AE; Chat 10 закрыл AF/AG; Chat 11 закрыл AH/AI и actionable Chat 8 product-code debts. Решение принято: **не переносить их в новую Phase 2, а закончить текущую Phase 1 через Chats 9–12**.

## Правила БД — критично

- Разработка ведётся только на designated non-production Neon branch; перед любым DB действием сверяй фактический host из `.env.local`.
- Production DB не использовать для implementation/acceptance.
- `prisma migrate dev` запрещён на унаследованной dev/prod-like базе из-за migration-history drift и риска reset.
- Разрешённый deployment path для dev migrations — repository-approved `prisma migrate deploy` с `DIRECT_URL` после проверки target DB.
- Production migrations выполняет только разработчик.
- Не применять production actor-aware Audit migration без согласованного окна.
- Большие production indexes должны соответствовать migration/rollout standard репозитория.

## Мастер-промт Phase 1

Этот блок вставляется в начало каждого нового executor chat.

```text
Продолжай текущую Phase 1 AI Platform NBOS.

Сначала изучи:
- docs/NBOS/02-Modules/21-AI-Platform/00-AI-Platform-Overview.md
- docs/NBOS/02-Modules/21-AI-Platform/10-Phase-1-AI-Foundation-and-External-Agent-Implementation.md
- docs/NBOS/02-Modules/21-AI-Platform/16-Phase-1-Execution-Strategy.md
- docs/NBOS/02-Modules/21-AI-Platform/26-Phase-1-Chat-8-Acceptance.md
- docs/NBOS/02-Modules/21-AI-Platform/27-Phase-1-Continuation-After-Chat-8.md
- docs/NBOS/02-Modules/21-AI-Platform/99-AI-Cleanup-Register.md
- handoff предыдущего milestone
- связанный canon/runtime затронутых NBOS modules.

Handoff и старые [x] — это claims, а не доказательство. Проверяй реальный runtime/code/tests.

Архитектурные правила:
- не создавай параллельную AI architecture;
- используй существующий Actor → Policy → Capability → Domain Action → Audit foundation;
- не обходи module-owned domain services прямыми Prisma domain writes;
- сохраняй human RBAC и существующие Tasks/Drive/Audit/API/worker/scheduler flows;
- не расширяй prompt/context/memory в capability/authorization source;
- secrets никогда не должны попадать в AI context, API reads, logs или Audit;
- не ослабляй isolation/idempotency/negative tests;
- foundation делай минимально достаточным и расширяемым, не строй заранее полноценную enterprise-подсистему, которой canon пока не требует.

Checklist:
- применимые пункты отмечай [x] только после implementation + tests/evidence;
- [~] оставляй честно, если есть реальная неполнота;
- [!] BUSINESS DECISION только если canon/runtime не дают безопасного решения;
- не объявляй Phase 1 complete до Chat 12 final re-acceptance.

DB safety:
- убедись, что работаешь не с production DB;
- prisma migrate dev не использовать;
- production migrations не применять;
- не выдумывать provider keys или production environment evidence.
```

## Chat 9 — executor prompt

Рекомендуемая модель: **Cursor Grok 4.6 Extra High Fast**.

В новый чат вставить мастер-промт выше, затем этот блок.

```text
Это Chat 9 — Prompt Policy + Context/Memory/Knowledge Foundation.
Работай в текущей ветке `sipan` поверх фактического результата Chat 8.

PRIMARY SCOPE:
- AD 470–481
- AE 482–496
из `10-Phase-1-AI-Foundation-and-External-Agent-Implementation.md`.

ОБЯЗАТЕЛЬНО ПРОЧИТАЙ:
- 12-AI-Prompts-Context-Memory-and-Knowledge.md
- 04-Internal-AI-Runtime.md
- 11-Internal-Agent-Lifecycle-and-Assignments.md
- 05-AI-Data-Security-and-Audit.md
- 26-Phase-1-Chat-8-Acceptance.md
- 27-Phase-1-Continuation-After-Chat-8.md
и реальный runtime Internal Agent/provider/model/policy foundation.

ЦЕЛЬ CHAT 9:
1. Реализовать Prompt Policy persistence/config foundation.
2. Реализовать Prompt Version lifecycle: DRAFT / TESTING / PUBLISHED / RETIRED.
3. Internal Agent должен ссылаться только на допустимую опубликованную prompt policy/version согласно canon.
4. Сохранять prompt-version identity для будущего execution attribution.
5. Реализовать publish/rollback/config audit там, где это уже требуется canon.
6. Prompt никогда не должен давать capabilities/scopes или изменять authorization.
7. Реализовать Context Assembler contract/interface поверх существующей authorization foundation.
8. Context retrieval всегда после authorization и через purpose-built projections.
9. Зафиксировать source/provenance, freshness, classification/redaction и token/size budget contracts.
10. Реализовать session-context contract.
11. Реализовать persistent-memory interface/contract с обязательными owner/scope/purpose/retention/provenance, но persistent memory по умолчанию не запускать как полноценный runtime.
12. Реализовать future Knowledge/RAG source contract так, чтобы retrieval физически не мог обходить authorization.
13. Secrets в AI memory/context запрещены.
14. Добавить migrations/tests/admin wiring только там, где это реально нужно AD/AE.
15. Обновить checklist и Cleanup Register честно.

НЕ ДЕЛАТЬ:
- production RAG/vector store;
- embeddings platform;
- unrestricted persistent memory;
- full internal employee chat;
- Messenger auto-reply;
- новый authorization engine;
- абстракции “на всякий случай”, которых AD/AE не требуют.

Перед завершением:
- targeted tests для нового prompt/context foundation;
- relevant integration/security tests;
- typecheck;
- Prisma validate/status без production migration;
- regression по Internal Agent/model policy linkage.

НА ВЫХОДЕ:
создай `docs/NBOS/02-Modules/21-AI-Platform/28-Phase-1-Chat-9-Handoff.md`.
В нём: completed checklist items, files/migrations, tests с фактическими результатами,
remaining [~]/[!], security decisions, exact entry point для Chat 10.
Не объявляй Phase 1 complete.
```

## Chat 10 — executor prompt

Рекомендуемая модель: **Claude Opus 5 High**.

```text
Это Chat 10 — Approval + Customer-Facing Safety Foundation.
Продолжай только после независимого PASS/PASS WITH DEBTS Chat 9.

PRIMARY SCOPE:
- AF 497–517
- AG 518–531

Прочитай 13-AI-Risk-and-Approval-Policy.md, 15-Customer-Facing-AI-Policy.md,
28-Phase-1-Chat-9-Handoff.md и реальный policy/capability/audit runtime.

Реализуй:
- capability risk integration;
- ALLOW / DENY / REQUIRE_APPROVAL runtime contract;
- Approval Request persistence;
- actor/capability/resource attribution;
- safe payload summary + canonical payload digest;
- PENDING / APPROVED / REJECTED / EXPIRED / CANCELLED / CONSUMED lifecycle;
- one-time approval + expiry;
- AI self-approval prohibition;
- material payload change invalidates approval;
- actor/grant/domain-state revalidation immediately before approved commit;
- approval lifecycle Audit;
- customer/conversation scope classification;
- DRAFT_ONLY / APPROVAL_REQUIRED / AUTO_SEND_ALLOWED contracts;
- draft и send как разные permissions/capabilities;
- escalation contract;
- internal-only vs customer-visible data boundary;
- customer isolation / prompt-injection negative tests.

НЕ СТРОЙ production Messenger auto-reply и не добавляй широкие autonomous customer actions.

Handoff: `29-Phase-1-Chat-10-Handoff.md`.
```

## Chat 11 — executor prompt

Рекомендуемая модель: **Cursor Grok 4.6 Extra High Fast**.

```text
Это Chat 11 — Usage/Cost/Evaluation Foundation + actionable Phase 1 debts.
Продолжай после независимого review Chat 10.

PRIMARY SCOPE:
- AH 532–548
- AI 549–557
- actionable debts из 26-Phase-1-Chat-8-Acceptance.md и последних handoff.

Реализуй минимальный production-usable foundation:
- AI execution/usage record;
- actor/Internal Agent/provider/model/Model Policy/capability/channel attribution;
- correlation/status/latency/retry/fallback attribution;
- provider usage/tokens и historical cost metadata где возможно;
- basic budget/usage-limit contracts;
- Evaluation Suite/Run foundation;
- model/model-policy/prompt-version/dataset attribution;
- aggregate quality/latency/cost results;
- deterministic/human/model-based grading должны оставаться раздельными.

Также закрой применимые product-code debts:
- shared Redis-backed rate-limit state для multi-instance API;
- K209 idempotency crash/recovery gap;
- K205/W368 declared output/projection validation, если checklist всё ещё требует это после reconciliation;
- AJ 584/585 Model Policy candidate ordering/edit UI, если остаётся partial;
- critical AI Admin browser E2E, если текущий test stack позволяет сделать это чисто и стабильно.

Не подделывай environment evidence:
- Anthropic live требует настоящий key;
- live cross-provider fallback требует два реальных provider credentials;
- production rediss:// evidence требует соответствующий endpoint;
- production audit migration требует developer-controlled rollout window.

Handoff: `30-Phase-1-Chat-11-Handoff.md`.
```

## Chat 12 — final acceptance prompt

Рекомендуемая модель: **Claude Opus 5 High**. После отчёта — независимый review GPT-5.6 Sol High.

```text
Это Chat 12 — Final Phase 1 Re-Acceptance.
Ты прежде всего verifier, а не архитектор нового функционала.

Прочитай весь canonical Phase 1 checklist, Chats 8–11 handoffs/reviews и Cleanup Register,
но не доверяй им без проверки.

ПРОВЕРЬ:
1. A–AQ по фактическому runtime/code/tests.
2. AD–AI first-hand, особенно prompt authorization boundary, context isolation,
   approval digest/revalidation, customer isolation, usage attribution и eval persistence.
3. AO External Agent live REST+MCP acceptance повторно.
4. AP provider/model/Internal Agent live acceptance со всеми реальными keys, которые дал разработчик.
5. AQ architecture review повторно.
6. Все 11 Phase 1 exit criteria.
7. Full tests, lint, typecheck, build, Prisma validate/status, relevant browser/integration checks.
8. Regression human RBAC/Tasks/Drive/Audit/API/worker/scheduler.
9. Нет ли product-code gap, спрятанного под словом environment/debt.

Допустимый [~] после финала — только если implementation complete, а отсутствующее доказательство
реально требует unavailable provider credential, production-like external environment или
developer-controlled production maintenance window.

Создай `31-Phase-1-Final-Acceptance.md` с honest PASS / PASS WITH OPERATIONAL CONDITIONS / FAIL.
Phase 1 можно объявить complete только если нет unresolved product-code requirement.
```

## Универсальный промт независимой проверки Chats 9–11

Рекомендуемая модель: **GPT-5.6 Sol High**.

```text
Ты независимый verifier Chat N текущей Phase 1 AI Platform. Ты НЕ реализуешь и НЕ правишь product code.

Прочитай handoff Chat N, canonical docs и checklist scope milestone, но handoff не считай доказательством.

ПРОВЕРЬ ФАКТИЧЕСКИ:
1. git branch/HEAD/diff и заявленные файлы;
2. Prisma schema/migrations/status — только read/validate, production migration не применять;
3. targeted tests и typecheck;
4. relevant integration/security tests;
5. diff milestone целиком;
6. каждый новый [x] против реального code/test evidence;
7. authorization/data isolation/secret handling;
8. отсутствие прямых domain Prisma writes в обход module services;
9. migration safety и backward compatibility;
10. отсутствие лишней enterprise-подсистемы вне canon milestone;
11. regression существующего External Agent/provider/model/Internal Agent foundation.

Если нашёл дефект — VERDICT FAIL и точный список исправлений file/path/behavior/test.
Код не правь. Исправляет исходный executor chat. После исправления перепроверь в этом же verifier chat.

В handoff добавь:
## Verification (Chat N)
- model/date;
- PASS / PASS WITH DEBTS / FAIL;
- команды и реальные результаты;
- discrepancies;
- defects;
- remaining debts;
- not verified и почему.
```

## Следующее действие

Chat 11 independently re-verified: **PASS WITH DEBTS**. First-pass FAIL remains on record. See `docs/NBOS/02-Modules/21-AI-Platform/30-Phase-1-Chat-11-Handoff.md` § Re-verification.

Открыть **новый Cursor chat** с моделью **Claude Opus 5 High** и вставить мастер-промпт + Chat 12 block (`31-Phase-1-Final-Acceptance.md`). После отчёта — независимый review GPT-5.6 Sol High.

Не объявлять Phase 1 complete до Chat 12 final re-acceptance.
