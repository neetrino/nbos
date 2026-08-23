# NBOS — следующие технические этапы после AI Platform Phase 1

Этот файл — единственный рабочий orchestration-файл для трёх согласованных post-Phase-1 исправлений.

Старые Chat 1–12 здесь больше не используются. Их история остаётся в handoff/acceptance документах `docs/NBOS/02-Modules/21-AI-Platform/`.

Главный технический план:

- `docs/NBOS/02-Modules/21-AI-Platform/32-Post-Phase-1-Technical-Debt-Plan.md`

Source-of-truth debts:

- NEW CHAT 1 → Tasks Cleanup C9;
- NEW CHAT 2 → AI Cleanup C25;
- NEW CHAT 3 → AI K209 / Cleanup C24.

---

# Как работать

Каждый этап выполняется отдельно:

```text
fresh executor chat
→ implementation
→ handoff
→ fresh verifier chat другой модели
→ FAIL: findings вернуть в тот же executor chat
→ executor исправляет
→ тот же verifier перепроверяет
→ PASS / PASS WITH DEBTS
→ commit
→ следующий этап
```

| Этап       | Работа                                   | Executor                        | Verifier         |
| ---------- | ---------------------------------------- | ------------------------------- | ---------------- |
| NEW CHAT 1 | Tasks Domain Ownership                   | Cursor Grok 4.6 Extra High Fast | GPT-5.6 Sol High |
| NEW CHAT 2 | Atomic Human-Readable Codes              | Cursor Grok 4.6 Extra High Fast | GPT-5.6 Sol High |
| NEW CHAT 3 | Unified Durable Drive Artifact Lifecycle | Claude Opus 5 High              | GPT-5.6 Sol High |

Не объединять этапы в один чат.

## Общие правила

- Сначала проверить branch, HEAD, `git status` и фактический runtime.
- Handoff/docs — claims, не evidence.
- Проверять реальный код, schema, migrations, tests и call paths.
- Не делать drive-by refactor вне scope.
- Не ломать human RBAC, Tasks, Drive, Support, Automation, External Agent REST/MCP.
- Tasks владеет Task invariants; Drive владеет FileAsset/FileVersion/FileLink/storage lifecycle.
- Не добавлять direct Prisma domain writes из protocol/controller adapters.
- `prisma migrate dev` не использовать на inherited dev/prod-like DB.
- Production DB/migrations не трогать.
- Concurrency/transaction/crash bugs не закрывать только моками: нужен real non-production DB evidence там, где это materially важно.
- Security-sensitive изменения проверять negative tests.
- Cleanup item закрывать только при реальном evidence.

---

# NEW CHAT 1 — Tasks Domain Ownership

## Executor prompt

```text
Реализуй NEW CHAT 1 — Tasks Domain Ownership.

Это отдельный post-Phase-1 remediation milestone. Не начинай NEW CHAT 2 или 3.

ОБЯЗАТЕЛЬНО ПРОЧИТАЙ:
- ai-modul-steps.md
- docs/NBOS/02-Modules/21-AI-Platform/32-Post-Phase-1-Technical-Debt-Plan.md
- docs/NBOS/02-Modules/05-Tasks/01-Task-System-Overview.md
- docs/NBOS/02-Modules/05-Tasks/04-Tasks-Cleanup-Register.md, особенно C8/C9
- apps/api/src/modules/tasks/**
- production Support paths, которые создают Task
- production Automation/AutoTasks paths, которые создают Task
- apps/api/src/modules/tasks/task-code-generation.ts
- apps/api/src/common/utils/entity-code-counter.ts

ПРОБЛЕМА:
Tasks должен быть единственным владельцем правил создания Task, но некоторые internal flows всё ещё создают Task напрямую через Prisma.
Task code allocator уже общий; здесь исправляется именно domain ownership.

СНАЧАЛА INVENTORY:
repository-wide найди все production writers создания Task вне Tasks-owned слоя:
- `prisma.task.create`;
- transaction-client `.task.create`;
- createMany/upsert или эквивалент.

Классифицируй каждый result: production Task creation, migration/test fixture или допустимый Tasks-owned low-level helper.
Не предполагай, что writers только два.

ЦЕЛЬ:
один узкий Tasks-owned application/domain creation contract для Human/API, Support, Automation и trusted internal/system producers.

ТРЕБОВАНИЯ:
1. Tasks остаётся владельцем Task invariants.
2. Support/Automation и все применимые production callers перестают напрямую вставлять Task rows.
3. Не создавай второй параллельный Tasks service для system callers.
4. Сохрани source/provenance, creator/assignee semantics, links, Work Space resolution, status/priority/defaults, code allocation, audit/events и transaction behavior.
5. Trusted internal/system callers не надо проводить через External Agent REST/MCP authorization.
6. Actor/source context должен быть явным; не подделывать Employee.
7. Не создавать circular Nest dependency; при необходимости экспортировать narrow Tasks application service/port.
8. Existing human Tasks/API behavior не ломать.
9. Task lifecycle/status semantics не менять без необходимости этого refactor.
10. Не делать code-series cleanup или Drive lifecycle в этом чате.

TESTS / EVIDENCE:
- Tasks-owned create operation tests;
- Support flow regression;
- Automation flow regression;
- provenance/source assertions;
- общий `T-...` allocator остаётся authoritative;
- repository-wide search подтверждает отсутствие применимых direct Task writers вне Tasks-owned boundary;
- relevant lint/typecheck/tests;
- real-DB test, если transaction semantics materially меняются.

DOCS:
- C9 в `docs/NBOS/02-Modules/05-Tasks/04-Tasks-Cleanup-Register.md` обновлять только если gap реально закрыт;
- обновить статус/evidence Workstream 3 в `32-Post-Phase-1-Technical-Debt-Plan.md`;
- создать `docs/NBOS/02-Modules/21-AI-Platform/33-Post-Phase-1-Chat-1-Tasks-Ownership-Handoff.md`.

Handoff должен содержать writer inventory, architecture decision, changed files, migrations, tests, remaining debts и exact verifier scope.
Не коммить без отдельного указания разработчика.
```

## Verifier prompt — NEW CHAT 1

```text
Ты независимый verifier NEW CHAT 1 — Tasks Domain Ownership.
Ты НЕ исправляешь product code.

Прочитай:
- ai-modul-steps.md
- docs/NBOS/02-Modules/21-AI-Platform/32-Post-Phase-1-Technical-Debt-Plan.md
- docs/NBOS/02-Modules/05-Tasks/01-Task-System-Overview.md
- docs/NBOS/02-Modules/05-Tasks/04-Tasks-Cleanup-Register.md, особенно C8/C9
- docs/NBOS/02-Modules/21-AI-Platform/33-Post-Phase-1-Chat-1-Tasks-Ownership-Handoff.md
- полный diff и фактический runtime.

Handoff — claim, не evidence.

ПРОВЕРЬ САМОСТОЯТЕЛЬНО:
1. branch/HEAD/worktree и полный diff;
2. repository-wide inventory всех production Task creation writers;
3. Support/Automation действительно больше не создают Task напрямую через Prisma;
4. все применимые internal/system writers используют Tasks-owned operation;
5. Tasks-owned operation не дублирует существующую creation logic параллельным service;
6. source/provenance, creator/assignee, links, workspace, defaults, status/priority, code allocation и audit behavior не потеряны;
7. trusted internal callers не были ошибочно протянуты через External Agent auth/grants;
8. actor/source не маскируется под Employee;
9. нет circular Nest dependency или service-locator обхода;
10. human/API Task creation regression не сломан;
11. transaction boundaries корректны;
12. C9 можно реально закрыть.

ЗАПУСТИ:
- targeted Tasks/Support/Automation tests;
- relevant regression;
- typecheck/lint;
- real-DB integration, если transaction behavior изменён;
- independent repository search direct Task writers.

Вердикт:
- PASS
- PASS WITH DEBTS — только если C9 закрыт, а debt реально вне scope
- FAIL — если domain ownership gap остаётся или появился regression.

Если FAIL — дай точные defects: path, behavior, impact, required fix. Ничего не исправляй. Findings вернуть executor chat.
В конце добавь Verification section в `33-Post-Phase-1-Chat-1-Tasks-Ownership-Handoff.md`.
Не коммить, не пушить, production migrations не применять.
```

---

# NEW CHAT 2 — Atomic Human-Readable Codes

## Executor prompt

```text
Реализуй NEW CHAT 2 — Atomic Human-Readable Codes.

Начинай только после committed + independently verified NEW CHAT 1.
Не начинай NEW CHAT 3.

ОБЯЗАТЕЛЬНО ПРОЧИТАЙ:
- ai-modul-steps.md
- docs/NBOS/02-Modules/21-AI-Platform/32-Post-Phase-1-Technical-Debt-Plan.md
- docs/NBOS/02-Modules/21-AI-Platform/99-AI-Cleanup-Register.md, C23/C25/C26
- docs/NBOS/02-Modules/05-Tasks/04-Tasks-Cleanup-Register.md
- apps/api/src/common/utils/entity-code-counter.ts
- apps/api/src/modules/tasks/task-code-generation.ts
- packages/database/prisma/migrations/20260823000000_entity_code_counters/migration.sql
- handoff NEW CHAT 1 для актуального runtime context.

ПРОБЛЕМА:
в нескольких независимых business code series ещё используется non-atomic `read MAX/latest → +1 → INSERT` или эквивалент.
Tasks `T-...` уже исправлен.

СНАЧАЛА INVENTORY:
repository-wide найди каждый production human-readable code generator, использующий:
- MAX/latest + 1;
- orderBy code desc + parse + 1;
- count + 1;
- любой эквивалентный application-side next-number calculation.

Для каждой series зафиксируй:
- format/prefix;
- year/global reset;
- unique constraint;
- все writers;
- текущий generator;
- rollout risk.

Known candidates: Invoice, Support Ticket `TKT-`, Deal, Lead, Order, Subscription, Project. Это не закрытый список.

ЦЕЛЬ:
все подтверждённые affected series используют один authoritative PostgreSQL allocator `entity_code_counters`.

ТРЕБОВАНИЯ:
1. Named `ENTITY_CODE_SCOPE` на каждую независимую series.
2. DB — единственный source of truth следующего номера.
3. Seed existing data вычисляется numerically, не lexicographically.
4. Malformed historical codes обрабатывать явно и безопасно.
5. Year reset сохранять только там, где он реально есть.
6. Все writers одной series переходят вместе.
7. Не оставлять mixed authority `counter + MAX(table)`.
8. Gaps допустимы; duplicates недопустимы.
9. Проверить mixed-version rollout. Если старые/новые writers нельзя безопасно смешивать — документировать write pause/deploy order.
10. Не менять entity ownership/business semantics.
11. Tasks ownership уже закрыт в NEW CHAT 1 — не переделывать его.
12. Drive lifecycle не трогать.

TESTS / EVIDENCE:
- parser/formatter tests;
- real-DB concurrent allocation для критичных series или reusable table-driven production-path suite;
- parallel service/API creates для representative modules;
- 9999→10000 boundary;
- migration seed validation на non-production data;
- relevant lint/typecheck/regression.

DOCS:
- C25 в `99-AI-Cleanup-Register.md` закрывать только после полного inventory + evidence;
- обновить связанные module cleanup registers при наличии;
- обновить status/evidence Workstream 2 в `32-Post-Phase-1-Technical-Debt-Plan.md`;
- создать `docs/NBOS/02-Modules/21-AI-Platform/34-Post-Phase-1-Chat-2-Code-Allocator-Handoff.md`.

Не коммить без отдельного указания разработчика.
```

## Verifier prompt — NEW CHAT 2

```text
Ты независимый verifier NEW CHAT 2 — Atomic Human-Readable Codes.
Ты НЕ исправляешь product code.

Прочитай:
- ai-modul-steps.md
- docs/NBOS/02-Modules/21-AI-Platform/32-Post-Phase-1-Technical-Debt-Plan.md
- docs/NBOS/02-Modules/21-AI-Platform/99-AI-Cleanup-Register.md, C23/C25/C26
- docs/NBOS/02-Modules/21-AI-Platform/34-Post-Phase-1-Chat-2-Code-Allocator-Handoff.md
- allocator code/migrations и полный diff.

Handoff — claim, не evidence.

ПРОВЕРЬ САМОСТОЯТЕЛЬНО:
1. branch/HEAD/worktree и полный diff;
2. repository-wide inventory code generators действительно полный;
3. каждый найденный production `MAX/latest/count + 1` writer классифицирован;
4. у каждой affected series один authoritative `ENTITY_CODE_SCOPE`/allocator;
5. не осталось mixed authority counter + table MAX для одной series;
6. все writers одной series переведены вместе;
7. seed existing data вычисляется numerically и безопасно обрабатывает malformed rows;
8. 9999→10000 не ломается;
9. concurrent creates реально дают уникальные codes;
10. gaps допустимы, duplicates невозможны;
11. rollout analysis честный: mixed old/new writer safety не выдумана;
12. existing business behavior/prefix/reset rules сохранены;
13. C25 можно реально закрыть.

ЗАПУСТИ:
- targeted tests;
- independent repository search generators;
- real non-production DB concurrency tests;
- boundary 9999→10000;
- migration seed validation;
- relevant regression/typecheck/lint.

Вердикт:
- PASS
- PASS WITH DEBTS — только если C25 закрыт, а debt вне scope
- FAIL — если хотя бы одна affected production series осталась race-prone/mixed-authority или rollout unsafe.

Если FAIL — path/behavior/impact/required fix. Ничего не исправляй. Findings вернуть executor chat.
В конце добавь Verification section в `34-Post-Phase-1-Chat-2-Code-Allocator-Handoff.md`.
Не коммить, не пушить, production migrations не применять.
```

---

# NEW CHAT 3 — Unified Durable Drive Artifact Lifecycle

## Executor prompt

```text
Реализуй NEW CHAT 3 — Unified Durable Drive Artifact Lifecycle.

Начинай только после committed + independently verified NEW CHAT 1 и NEW CHAT 2.
Это самый глубокий remediation этап. Сначала architecture/runtime reconciliation, потом implementation.

ОБЯЗАТЕЛЬНО ПРОЧИТАЙ:
- ai-modul-steps.md
- docs/NBOS/02-Modules/21-AI-Platform/32-Post-Phase-1-Technical-Debt-Plan.md
- docs/NBOS/02-Modules/21-AI-Platform/10-Phase-1-AI-Foundation-and-External-Agent-Implementation.md, K209
- docs/NBOS/02-Modules/21-AI-Platform/99-AI-Cleanup-Register.md, C8/C24
- Drive canon/cleanup docs
- apps/api/src/modules/drive/**
- DriveTaskArtifactService
- AgentCapabilityGateway / AgentIdempotencyService / replay authorization
- External Agent REST/MCP artifact contracts
- current human UI upload/presigned URL flow
- current worker/queue infrastructure
- handoff NEW CHAT 1 и 2 для актуального runtime.

РЕШЕНИЕ УЖЕ ПРИНЯТО:
не создавать отдельный Human upload lifecycle и отдельный AI lifecycle.
Нужен ONE Drive-owned durable Artifact Operation lifecycle + source-specific ingress adapters.

ЦЕЛЕВАЯ СХЕМА:

Human UI ────────────┐
Internal AI ─────────┼──> Drive Artifact Operation / Finalization / Recovery
External AI ─────────┘                      │
                                           ├─ R2/object storage
                                           └─ PostgreSQL FileAsset/FileVersion/FileLink

A. HUMAN UI
- Browser получает prepare/upload contract от Drive.
- Browser сохраняет direct-to-R2 presigned upload для обычных/больших файлов.
- После upload вызывается общий verify/finalize.

B. INTERNAL AI
- Internal AI/tool runtime создаёт ту же durable operation.
- Generated bytes идут через backend/worker machine ingress.
- Никаких отдельных AI FileAsset/FileLink rules.

C. EXTERNAL AI
- REST/MCP сохраняют Actor → Policy → Capability → Domain Action path.
- `tasks.attach_artifact` использует ту же durable operation.
- protocol parity сохранить.

COMMON CORE ДОЛЖЕН ВЛАДЕТЬ:
- durable operation identity;
- target/link intent;
- persisted storage/staging key;
- file metadata/size/MIME/checksum where available;
- source/actor/provenance;
- lifecycle state;
- retry/recovery state;
- FileAsset/FileVersion/FileLink finalization;
- audit/correlation;
- orphan/reconciliation rules;
- cancellation/expiry cleanup where safe;
- idempotency semantics.

Не навязывай exact enum names до runtime reconciliation, но lifecycle должен различать минимум:
prepared → upload pending → object uploaded/verified → DB finalization pending → completed,
с failed/retryable/cancelled/recovery semantics где нужны.

CORRECTNESS:
1. R2 + PostgreSQL не изображать как одну ACID transaction.
2. Persist operation/storage identity до irreversible upload, когда требуется.
3. Crash после object upload до DB finalization — recoverable.
4. Crash после DB linkage до operation completion — recoverable/idempotent.
5. Retry не создаёт второй object/FileAsset/FileVersion/FileLink.
6. Нельзя blind reclaim stale IN_PROGRESS и повторять mutation.
7. Recovery опирается на durable state + реальный R2/DB state.
8. Human/Internal/External используют один finalization engine.
9. Authorization различается по source:
   - Human: employee/Drive permissions;
   - Internal AI: Internal Agent/onBehalfOf policy/grants;
   - External AI: External Agent grants/scopes REST/MCP.
10. Deferred/resumed sensitive finalization revalidates authorization.
11. Revoked actor/grant не получает новую mutation после resume.
12. Object existence не становится authorization bypass.
13. Drive остаётся owner FileAsset/FileVersion/FileLink/storage lifecycle.
14. Не строить generic distributed transaction framework для всего NBOS.
15. Existing human upload/version flows должны быть reconciled в common core без необоснованного performance regression.
16. Object cleanup conservative: удалять orphan только при доказуемом ownership/state.

ОБЯЗАТЕЛЬНО RECONCILE:
- `createGeneratedFileAsset` сейчас делает PutObject до DB create;
- human presigned upload/version staging path;
- External Agent `tasks.attach_artifact` K209/C24.

TEST MATRIX:
- crash before upload;
- failed/during upload;
- object uploaded → crash before DB finalization;
- DB finalization → crash before operation completion;
- exact retry at every boundary;
- changed payload/reused operation key;
- concurrent retries;
- duplicate finalize;
- missing object;
- size/checksum/MIME mismatch where enforced;
- orphan reconciliation;
- revoked External Agent before resume;
- disabled/paused Internal Agent before resumed sensitive action where applicable;
- Human permission revoked before deferred finalization where policy requires;
- cross-Task/cross-Workspace target substitution;
- REST/MCP parity;
- no storage-key/secret leakage;
- no duplicate object/FileAsset/FileLink.

REAL EVIDENCE:
- state-machine/unit tests;
- Prisma integration;
- controlled storage/R2 adapter integration;
- crash/recovery simulation;
- live External Agent REST+MCP attach;
- human UI upload regression;
- Internal AI adapter contract test even if full employee AI runtime ещё не включён;
- worker/recovery boot/retry if queue используется;
- relevant full regression, lint, typecheck, build.

MIGRATIONS:
- additive where possible;
- production не применять;
- rollout order и compatibility со старыми upload writers документировать;
- unsafe mixed writers → explicit deployment/write-pause strategy.

DOCS:
- Drive canon обновлять только по реально implemented behavior;
- K209/C24 закрывать только если crash window реально устранён;
- обновить status/evidence Workstream 1 в `32-Post-Phase-1-Technical-Debt-Plan.md`;
- создать `docs/NBOS/02-Modules/21-AI-Platform/35-Post-Phase-1-Chat-3-Drive-Artifact-Lifecycle-Handoff.md`.

Не начинать Messenger AI, employee AI chat, production RAG или другие Phase 2 product features.
Не коммить без отдельного указания разработчика.
```

## Verifier prompt — NEW CHAT 3

```text
Ты независимый verifier NEW CHAT 3 — Unified Durable Drive Artifact Lifecycle.
Ты НЕ исправляешь product code.

Это security/reliability-critical review. Не доверяй handoff и happy-path tests.

Прочитай:
- ai-modul-steps.md
- docs/NBOS/02-Modules/21-AI-Platform/32-Post-Phase-1-Technical-Debt-Plan.md
- docs/NBOS/02-Modules/21-AI-Platform/10-Phase-1-AI-Foundation-and-External-Agent-Implementation.md, K209
- docs/NBOS/02-Modules/21-AI-Platform/99-AI-Cleanup-Register.md, C8/C24
- Drive canon/cleanup docs
- docs/NBOS/02-Modules/21-AI-Platform/35-Post-Phase-1-Chat-3-Drive-Artifact-Lifecycle-Handoff.md
- полный implementation diff и runtime paths Human/Internal/External.

ПРОВЕРЬ САМОСТОЯТЕЛЬНО:
1. branch/HEAD/worktree и полный diff;
2. существует ONE Drive-owned durable artifact lifecycle, а не три скрыто разных lifecycle;
3. Human, Internal AI и External AI сходятся в одном finalization/recovery engine;
4. различаются только ingress/auth semantics, где это правильно;
5. Human browser по-прежнему может эффективно грузить напрямую в R2 по presigned URL;
6. machine upload не создаёт отдельные FileAsset/FileLink rules;
7. durable operation/storage identity сохраняется до irreversible boundary;
8. object-upload-before-DB crash реально recoverable;
9. DB-link-before-completion crash реально recoverable;
10. exact retry на каждом boundary не создаёт duplicate object/FileAsset/FileVersion/FileLink;
11. changed payload/reused operation key fail safe;
12. concurrent retries/finalize корректны;
13. recovery сверяет durable state с фактическим R2/DB state;
14. orphan cleanup не удаляет объект без доказуемого ownership;
15. External Agent revocation/grant revocation revalidated перед resumed sensitive finalization;
16. Internal Agent disabled/paused semantics проверены на deferred/resumed action где применимо;
17. Human permission recheck соответствует Drive policy и не обходится через operation existence;
18. cross-Task/cross-Workspace target substitution невозможен;
19. REST/MCP parity сохранён;
20. internal storage key/secrets не протекают наружу;
21. current human upload/version flows не получили regression;
22. `createGeneratedFileAsset` больше не оставляет старый unsafe parallel lifecycle;
23. K209/C24 для `tasks.attach_artifact` реально можно перевести из `[~]` в closed;
24. решение не превратилось в generic distributed-transaction framework для всего NBOS;
25. migrations/rollout/mixed writer behavior production-safe по документированному plan.

ОБЯЗАТЕЛЬНО ВОСПРОИЗВЕДИ CRASH/RETRY MATRIX:
- before upload;
- upload failure;
- after object upload before DB finalization;
- after DB finalization before completion;
- exact retry каждого состояния;
- duplicate/concurrent retry;
- missing object;
- mismatch metadata where enforced;
- revoked authorization before resume.

EVIDENCE:
- targeted/state-machine tests;
- Prisma integration;
- controlled storage adapter/non-prod evidence;
- live External Agent REST + MCP attach;
- human upload regression;
- Internal AI adapter contract;
- worker/recovery behavior if used;
- relevant full tests/typecheck/lint/build.

Вердикт:
- PASS
- PASS WITH DEBTS — только если K209/C24 закрыт и debt действительно вне milestone
- FAIL — если остаётся crash window, duplicate risk, auth bypass, parallel lifecycle или human regression.

Если FAIL — exact path/behavior/impact/required fix. Ничего не исправляй. Findings вернуть executor chat.
В конце добавь Verification section в `35-Post-Phase-1-Chat-3-Drive-Artifact-Lifecycle-Handoff.md`.
Не коммить, не пушить, production migrations не применять.
```

---

# После трёх этапов

После independent PASS всех трёх:

1. проверить, что Tasks C9, AI C25 и K209/C24 честно обновлены в source cleanup registers;
2. выполнить короткий cross-regression Tasks + Drive + Support + Automation + External Agent REST/MCP;
3. после этого начинать следующий функциональный этап AI Platform.

**2026-08-23:** пункты 1–2 выполнены. Evidence:
`docs/NBOS/02-Modules/21-AI-Platform/36-Post-Phase-1-Cross-Regression.md`.
Пункт 3 ещё не начат. Messenger AI / employee AI chat / production RAG / Phase 2
не стартовать из этого файла.
