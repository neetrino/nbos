# NBOS — следующие технические этапы после AI Platform Phase 1

Этот файл теперь используется только как рабочий orchestration-файл для трёх согласованных post-Phase-1 исправлений.

Старые промпты Chat 1–12 удалены: их работа завершена и хранится в handoff/acceptance документах `docs/NBOS/02-Modules/21-AI-Platform/`.

Главный план долгов:

- `docs/NBOS/02-Modules/21-AI-Platform/32-Post-Phase-1-Technical-Debt-Plan.md`

Связанные source-of-truth реестры:

- AI Platform K209 / C24 — `docs/NBOS/02-Modules/21-AI-Platform/10-Phase-1-AI-Foundation-and-External-Agent-Implementation.md` и `99-AI-Cleanup-Register.md`;
- code allocation C25 — `99-AI-Cleanup-Register.md`;
- Tasks ownership C9 — `docs/NBOS/02-Modules/05-Tasks/04-Tasks-Cleanup-Register.md`.

---

# Порядок исполнения

Исполнять строго отдельными свежими чатами:

| Новый чат | Работа | Рекомендуемый исполнитель | Независимая проверка |
| --- | --- | --- | --- |
| 1 | Tasks domain ownership — Support/Automation через Tasks-owned create operation | Cursor Grok 4.6 Extra High Fast | GPT-5.6 Sol High |
| 2 | Atomic human-readable codes — все оставшиеся серии через `entity_code_counters` | Cursor Grok 4.6 Extra High Fast | GPT-5.6 Sol High |
| 3 | Unified Durable Drive Artifact Lifecycle — Human + Internal AI + External AI | Claude Opus 5 High | GPT-5.6 Sol High |

Каждый этап:

```text
fresh executor chat
→ implementation
→ handoff
→ fresh independent verifier chat
→ FAIL: исправление в том же executor chat
→ re-verification тем же verifier
→ PASS / PASS WITH DEBTS
→ commit
→ следующий этап
```

Не объединять эти три работы в один большой implementation-chat.

---

# Общие правила для всех трёх новых чатов

- Работай в текущей рабочей ветке и сначала проверь `git status`, HEAD и фактический runtime.
- Handoff/docs — claims, а не evidence. Проверяй код, DB schema, tests и реальные call paths.
- Не делать drive-by refactor вне scope этапа.
- Не ломать existing human RBAC, Tasks, Drive, Support, Automation, External Agent REST/MCP.
- Module ownership сохраняется: Tasks владеет Task invariants; Drive владеет FileAsset/FileVersion/FileLink/storage lifecycle.
- Не добавлять прямые Prisma domain writes из protocol/controller adapters.
- Не использовать `prisma migrate dev` на inherited dev/prod-like DB.
- Production DB и production migrations не трогать.
- Для новых migrations: validate, rollout analysis, backward/forward compatibility и real non-production evidence где возможно.
- Concurrency/crash/idempotency проблемы нельзя закрывать только unit-моками: где риск связан с PostgreSQL locks/transactions, нужен opt-in real-DB integration test.
- Security-sensitive behavior проверять negative tests: unauthorized actor, revoked grant, duplicate retry, changed payload, cross-resource isolation.
- Не объявлять долг закрытым, пока source cleanup register и tests не подтверждают реальное закрытие.

---

# NEW CHAT 1 — Tasks Domain Ownership

## Цель

Закрыть Tasks Cleanup C9: Tasks должен быть единственным владельцем правил создания Task.

Сегодня некоторые internal flows, прежде всего Support и Automation, всё ещё создают `Task` напрямую через Prisma. Общий allocator `T-...` уже используется, поэтому code race закрыт, но domain ownership всё ещё нарушен.

Целевая схема:

```text
Human/API ───────┐
Support ─────────┤
Automation ──────┼──> Tasks-owned application/domain create operation ──> Task
System producers ┘
```

Trusted internal/system callers не должны проходить через External Agent REST/MCP authorization. Но они должны использовать Tasks-owned operation и одни и те же Task invariants.

## Executor prompt

```text
Реализуй NEW CHAT 1 — Tasks Domain Ownership.

Это post-Phase-1 remediation. Не начинай другие workstreams.

ОБЯЗАТЕЛЬНО ПРОЧИТАЙ:
- ai-modul-steps.md
- docs/NBOS/02-Modules/21-AI-Platform/32-Post-Phase-1-Technical-Debt-Plan.md
- docs/NBOS/02-Modules/05-Tasks/01-Task-System-Overview.md
- docs/NBOS/02-Modules/05-Tasks/04-Tasks-Cleanup-Register.md, особенно C8/C9
- apps/api/src/modules/tasks/**
- Support paths, которые создают Task
- Automation/AutoTasks paths, которые создают Task
- apps/api/src/modules/tasks/task-code-generation.ts
- apps/api/src/common/utils/entity-code-counter.ts

Сначала сделай repository-wide inventory всех прямых записей создания Task вне Tasks-owned слоя:
- `prisma.task.create`;
- transaction-client `.task.create`;
- createMany/upsert или эквивалентные обходные writers.

Для каждого writer определи: это действительно Task creation, migration/test fixture или допустимый низкоуровневый Tasks-owned helper.

ЦЕЛЬ:
создать один узкий Tasks-owned application/domain creation contract для human/internal/system producers и перевести Support/Automation и все применимые production writers на него.

ОБЯЗАТЕЛЬНЫЕ ТРЕБОВАНИЯ:
1. Tasks остаётся владельцем Task invariants.
2. Support/Automation после refactor не вставляют Task rows напрямую.
3. Не создавай второй параллельный Tasks service только для system callers.
4. Сохрани существующие:
   - source/provenance;
   - creator/assignee semantics;
   - links;
   - Work Space resolution;
   - priority/status/defaults;
   - Task code allocation;
   - audit/events;
   - transaction behavior.
5. Trusted internal/system caller не должен проходить External Agent token/grant path.
6. Actor/source context должен быть явным, а не поддельным Employee.
7. Избеги circular Nest module dependency. При необходимости экспортируй узкий Tasks application service/port.
8. Existing human Tasks/API behavior не ломать.
9. Не меняй Task lifecycle/status semantics вне необходимости этого refactor.
10. Не делай Workstream code-series cleanup и Drive artifact lifecycle в этом чате.

TESTS / EVIDENCE:
- unit/regression для Tasks-owned create operation;
- Support create flow;
- Automation create flow;
- provenance/source сохранены;
- code allocator по-прежнему общий;
- repository search доказывает отсутствие применимых direct Task create writers вне Tasks-owned boundary;
- typecheck/lint;
- relevant full/regression tests;
- если затронуты transaction semantics — real-DB integration evidence.

DOCS:
- обнови `docs/NBOS/02-Modules/05-Tasks/04-Tasks-Cleanup-Register.md` C9 только если gap реально закрыт;
- обнови `32-Post-Phase-1-Technical-Debt-Plan.md` status/evidence для соответствующего workstream;
- создай handoff `docs/NBOS/02-Modules/21-AI-Platform/33-Post-Phase-1-Chat-1-Tasks-Ownership-Handoff.md`.

В handoff укажи inventory writers, architecture decision, files, migrations, tests, remaining debts и точный verifier scope.
Не начинай NEW CHAT 2.
Не коммить без отдельного указания разработчика.
```

---

# NEW CHAT 2 — Atomic Human-Readable Codes

## Цель

Закрыть C25: убрать старый `read MAX/sort → +1 → INSERT` из всех оставшихся production code series и перевести их на общий atomic allocator `entity_code_counters`.

Task `T-...` уже исправлен. Здесь речь о независимых сериях других модулей.

Known candidates не являются окончательным списком:

- Invoice;
- Support Ticket (`TKT-`, не Task `T-`);
- Deal;
- Lead;
- Order;
- Subscription;
- Project;
- любые другие series, найденные repository-wide audit.

## Executor prompt

```text
Реализуй NEW CHAT 2 — Atomic Human-Readable Codes.

Начинай только после committed + independently verified NEW CHAT 1.
Не начинай Unified Drive Artifact Lifecycle.

ОБЯЗАТЕЛЬНО ПРОЧИТАЙ:
- ai-modul-steps.md
- docs/NBOS/02-Modules/21-AI-Platform/32-Post-Phase-1-Technical-Debt-Plan.md
- docs/NBOS/02-Modules/21-AI-Platform/99-AI-Cleanup-Register.md, C23/C25/C26
- docs/NBOS/02-Modules/05-Tasks/04-Tasks-Cleanup-Register.md, Task allocator history
- apps/api/src/common/utils/entity-code-counter.ts
- apps/api/src/modules/tasks/task-code-generation.ts
- packages/database/prisma/migrations/20260823000000_entity_code_counters/migration.sql

СНАЧАЛА INVENTORY:
repository-wide найди каждый production generator human-readable business code, который делает:
- MAX/read latest + 1;
- orderBy code desc + parse + 1;
- count + 1;
- любой эквивалентный non-atomic next-number calculation.

Не ограничивайся заранее известными модулями. Для каждого результата укажи series format, reset rule (year/global), unique constraint и все writers этой серии.

ЦЕЛЬ:
каждая подтверждённая affected series получает один authoritative PostgreSQL atomic counter через `entity_code_counters`.

ТРЕБОВАНИЯ:
1. Один named `ENTITY_CODE_SCOPE` на независимую серию.
2. DB — единственный authoritative allocator следующего номера.
3. Seed из существующих данных вычисляется NUMERICALLY, не lexicographically.
4. Malformed historical codes не угадывать: явно report/handle безопасным правилом.
5. Year reset сохранить только для серий, где он реально существует.
6. Все writers одной серии должны одновременно перейти на один allocator.
7. Нельзя оставлять mixed authority `counter + MAX(table)`.
8. Gaps после зарезервированного, но не использованного номера допустимы; duplicate codes недопустимы.
9. Проанализируй rollout: если old/new writers нельзя безопасно смешивать, документируй write pause/deploy order.
10. Не менять entity ownership или бизнес-правила модулей.
11. Не рефактори Tasks ownership — NEW CHAT 1 уже должен быть закрыт.
12. Не трогай Drive artifact lifecycle.

TESTS / EVIDENCE:
- targeted unit tests для parsing/format;
- real-DB concurrent allocation tests для каждой критичной series или table-driven reusable suite, которая реально вызывает production allocator paths;
- несколько API/service parallel creates для representative high-risk modules;
- доказательство unique codes under concurrency;
- boundary test вокруг 9999 → 10000, чтобы исключить lexicographic bug;
- migration seed validation на representative non-production data;
- lint/typecheck/relevant regression.

DOCS:
- обнови `99-AI-Cleanup-Register.md` C25 только после полного inventory + evidence;
- обнови связанные module cleanup registers, если в них есть соответствующие debts;
- обнови `32-Post-Phase-1-Technical-Debt-Plan.md` status/evidence;
- создай handoff `docs/NBOS/02-Modules/21-AI-Platform/34-Post-Phase-1-Chat-2-Code-Allocator-Handoff.md`.

Не начинай NEW CHAT 3.
Не коммить без отдельного указания разработчика.
```

---

# NEW CHAT 3 — Unified Durable Drive Artifact Lifecycle

## Цель

Построить один профессиональный Drive-owned durable artifact lifecycle для всех трёх источников:

```text
Human UI ────────────┐
Internal AI ─────────┼──> Drive Artifact Operation / Finalization / Recovery
External AI ─────────┘                      │
                                           ├─ R2/object storage
                                           └─ PostgreSQL FileAsset/FileVersion/FileLink
```

Это расширяет исходный K209/C24 fix. Мы не строим отдельный AI-only upload subsystem.

Принцип:

- **один общий lifecycle/finalization/recovery engine принадлежит Drive**;
- ingress различается по источнику;
- Human browser сохраняет эффективный direct-to-R2 presigned upload;
- Internal AI использует trusted server/worker machine ingress;
- External AI использует authorized REST/MCP ingress;
- все три сходятся в одной durable operation state machine и одном Drive domain finalization path.

## Архитектурная цель

Не навязывай exact enum names до reconciliation с runtime, но operation должна уметь однозначно различать как минимум:

```text
prepared
→ upload/object pending
→ object uploaded/verified
→ DB finalization/link pending
→ completed

+ failed/retryable/cancelled/recovery semantics где реально нужны
```

Критично: operation/storage key должен быть durable и повторно используемым при retry. Нельзя на каждом retry генерировать новый случайный object key и надеяться на cleanup.

## Executor prompt

```text
Реализуй NEW CHAT 3 — Unified Durable Drive Artifact Lifecycle.

Начинай только после committed + independently verified NEW CHAT 1 и NEW CHAT 2.
Это самый глубокий из трёх remediation этапов. Сначала сделай architecture/runtime reconciliation, затем implementation.

ОБЯЗАТЕЛЬНО ПРОЧИТАЙ:
- ai-modul-steps.md
- docs/NBOS/02-Modules/21-AI-Platform/32-Post-Phase-1-Technical-Debt-Plan.md
- docs/NBOS/02-Modules/21-AI-Platform/10-Phase-1-AI-Foundation-and-External-Agent-Implementation.md, K209
- docs/NBOS/02-Modules/21-AI-Platform/99-AI-Cleanup-Register.md, C8/C24
- Drive canon/cleanup docs
- apps/api/src/modules/drive/**, особенно upload/version/FileAsset/FileLink paths
- DriveTaskArtifactService
- AgentCapabilityGateway / AgentIdempotencyService / replay authorization
- External Agent REST/MCP artifact contracts
- current human UI upload/presigned URL flow
- current worker/queue infrastructure that may be reused for recovery

BUSINESS/ARCHITECTURE DECISION ALREADY MADE:
не создавай Human upload system отдельно от AI upload system.
Нужен ONE Drive-owned durable Artifact Operation lifecycle + source-specific ingress adapters.

TARGET:

A. HUMAN UI
- Browser получает prepare/upload contract от Drive.
- Для больших/обычных user files browser грузит напрямую в R2 по presigned URL; bytes не должны зря проксироваться через API.
- После upload вызывается общий verify/finalize operation.

B. INTERNAL AI
- Internal AI/tool runtime создаёт ту же Drive Artifact Operation.
- Generated bytes/content загружаются backend/worker machine adapter либо другим оптимальным machine ingress.
- Internal AI не создаёт отдельные FileAsset/FileLink правила.

C. EXTERNAL AI
- REST/MCP сохраняют Actor → Policy → Capability → Domain Action path.
- `tasks.attach_artifact` должен использовать тот же Drive Artifact Operation.
- Сохрани protocol parity и существующий безопасный contract; если для больших machine files нужен prepare/presigned path, добавляй его только как adapter над общей operation, не как второй lifecycle.

COMMON CORE ДОЛЖЕН ВЛАДЕТЬ:
- durable operation identity;
- target entity/link intent;
- persisted storage key/staging key;
- file metadata, size, MIME, checksum where available;
- source/actor/provenance;
- status/state transitions;
- retry/recovery state;
- FileAsset/FileVersion/FileLink finalization;
- audit/correlation;
- orphan/reconciliation rules;
- cancellation/expiry cleanup where safe;
- idempotency semantics.

CORRECTNESS REQUIREMENTS:
1. Object storage + PostgreSQL не притворяются одной ACID transaction.
2. Crash после object upload до DB finalization должен быть recoverable.
3. Crash после DB linkage до final operation completion должен быть recoverable/idempotent.
4. Retry не создаёт второй object, FileAsset, FileVersion или FileLink.
5. Нельзя просто reclaim stale `IN_PROGRESS` и повторить domain mutation вслепую.
6. Persist operation/storage identity BEFORE irreversible upload where necessary.
7. Recovery worker/process должен принимать решение из durable state + фактического R2/DB state.
8. Human/Internal/External используют один finalization engine.
9. Authorization semantics не смешивать:
   - Human — existing employee/Drive permissions;
   - Internal AI — Internal Agent/onBehalfOf policy/grants;
   - External AI — External Agent grants/scopes REST/MCP.
10. Revalidate authorization на lifecycle point, где deferred/resumed operation собирается сделать чувствительный final commit/link. Revoked actor/grant не должен получить новую чувствительную mutation после resume.
11. Recovery system не должен превращать storage object existence в authorization bypass.
12. Drive остаётся owner FileAsset/FileVersion/FileLink и storage lifecycle.
13. Не создавай generic distributed transaction framework для всего NBOS. Решение должно быть reusable внутри Drive/artifact operations, но не enterprise abstraction без необходимости.
14. Existing human upload/version flows должны либо использовать новый common core, либо быть явно reconciled в него без regression.
15. Object cleanup должен быть conservative: не удаляй объект, если ownership/state нельзя доказать.

ОТДЕЛЬНО ПРОВЕРЬ:
- current `createGeneratedFileAsset` делает R2 PutObject до DB create — этот path должен быть reconciled в durable operation;
- current human presigned upload/version staging path — сохранить direct upload efficiency и свести finalization к common core;
- External Agent `tasks.attach_artifact` K209/C24 — после implementation crash window должен быть реально закрыт, не только переименован.

TEST MATRIX — ОБЯЗАТЕЛЬНО:
- crash before upload;
- crash during/failed upload;
- object uploaded, crash before DB finalization;
- DB finalization succeeds, crash before operation completion;
- exact retry at every boundary;
- changed payload / reused operation key;
- two concurrent retries;
- duplicate finalize request;
- missing object at finalize;
- mismatched size/checksum/MIME where enforced;
- orphan object reconciliation;
- revoked External Agent before resumed finalization;
- disabled/paused Internal Agent before resumed sensitive action where applicable;
- Human permission revoked before deferred finalization where policy requires recheck;
- cross-Task/cross-Workspace target substitution attempt;
- REST/MCP parity;
- no secret/internal storage key leakage;
- no duplicate FileAsset/FileLink/object.

REAL EVIDENCE:
- unit/state-machine tests;
- integration tests with Prisma;
- R2/storage adapter tests or controlled non-production storage integration;
- crash/recovery simulation;
- live External Agent REST+MCP artifact attach;
- human UI upload regression;
- Internal AI adapter contract test even if full production Internal AI chat is not yet enabled;
- worker/recovery boot and retry behavior if queue is introduced/reused;
- lint/typecheck/build/relevant full regression.

MIGRATIONS:
- additive where possible;
- no production migration;
- document rollout order and compatibility with old upload writers;
- if mixed old/new writers are unsafe, require explicit deployment/write-pause strategy rather than claiming rolling safety.

DOCS:
- update Drive canon only for behavior that is actually implemented;
- update AI Platform K209/C24 only if `tasks.attach_artifact` gap is genuinely closed;
- update `32-Post-Phase-1-Technical-Debt-Plan.md` with final architecture/evidence;
- create handoff `docs/NBOS/02-Modules/21-AI-Platform/35-Post-Phase-1-Chat-3-Drive-Artifact-Lifecycle-Handoff.md`.

Do not start unrelated Phase 2 AI product features such as Messenger AI, employee chat or production RAG.
Не коммить без отдельного указания разработчика.
```

---

# Универсальный независимый verifier prompt

Для каждого из трёх этапов открывай свежий verifier-chat другой модели.

```text
Ты независимый verifier post-Phase-1 remediation milestone NBOS.
Ты НЕ реализуешь и НЕ исправляешь product code.

Сначала прочитай:
- ai-modul-steps.md
- docs/NBOS/02-Modules/21-AI-Platform/32-Post-Phase-1-Technical-Debt-Plan.md
- handoff проверяемого NEW CHAT
- source cleanup register соответствующего долга
- реальный diff/runtime.

Handoff — claim, не evidence.

ПРОВЕРЬ:
1. branch/HEAD/worktree и полный diff;
2. scope: нет ли лишнего redesign;
3. source-of-truth module ownership;
4. migrations: safety, rollout, mixed-version behavior, no destructive surprises;
5. targeted tests;
6. relevant regression tests;
7. lint/typecheck/build where affected;
8. real-DB concurrency/transaction tests, если milestone про concurrency/atomicity;
9. negative/security tests;
10. заявленный cleanup item действительно закрыт, а не переименован.

Для NEW CHAT 1 дополнительно:
- repository-wide direct Task writer inventory;
- Support/Automation действительно используют Tasks-owned operation;
- нет circular dependency/parallel task-creation logic.

Для NEW CHAT 2 дополнительно:
- repository-wide code-generator inventory;
- все writers каждой series имеют один allocator;
- numeric 9999→10000 и concurrency;
- seed/rollout safety.

Для NEW CHAT 3 дополнительно:
- Human/Internal AI/External AI реально сходятся в ONE Drive finalization/recovery engine;
- ingress может отличаться, lifecycle не дублируется;
- все crash boundaries воспроизводимы;
- retries не создают duplicate object/FileAsset/FileLink;
- recovery после object-upload-before-DB работает;
- authorization revalidation на resumed/deferred sensitive commit;
- K209/C24 действительно закрыт для `tasks.attach_artifact`;
- human presigned upload efficiency не ухудшена без причины.

Вердикт только:
- PASS
- PASS WITH DEBTS — если milestone закрыт, а оставшиеся долги реально вне его scope
- FAIL — если основной correctness/ownership/reliability gap остаётся.

Если FAIL:
- дай точный список defects: path/behavior/impact/required fix;
- ничего не исправляй;
- верни работу executor chat.

В конце допиши verification section в handoff.
Не коммить, не пушить, не применять production migrations.
```

---

# После трёх этапов

После independent PASS всех трёх:

1. проверить, что C9, C25 и K209/C24 обновлены в source cleanup registers честно;
2. сделать один короткий cross-regression по Tasks + Drive + Support + Automation + External Agent REST/MCP;
3. только после этого начинать следующий функциональный AI Platform этап.
