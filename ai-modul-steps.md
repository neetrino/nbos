# AI Platform Phase 1 — план исполнения

Рабочий файл: как ведём Phase 1 модуля `docs/NBOS/02-Modules/21-AI-Platform/`, какие модели на каком милстоуне и какими промтами запускаем чаты.

Канон задачи — `10-Phase-1-AI-Foundation-and-External-Agent-Implementation.md` (executable checklist, ~724 пункта). Стратегия разбиения — `16-Phase-1-Execution-Strategy.md`.

## Метод работы

Один милстоун = три шага и два промта. Эстафета между чатами передаётся **файлом в репозитории**, а не копированием текста из чата в чат.

1. **Новый чат, промт исполнителя.** Делает милстоун целиком. В конце пишет `docs/NBOS/02-Modules/21-AI-Platform/1X-Phase-1-Chat-N-Handoff.md` по формату Chat 1.
2. **Новый чат, промт проверки.** Handoff читает, но не верит: проверяет ветку/коммит, `prisma migrate status`, гоняет тесты и typecheck, читает diff. Дописывает в тот же handoff секцию проверки. Код не пишет.
3. Проверка прошла → commit → милстоун N+1 стартует с чтения этого handoff.

Правила, которые держат схему рабочей:

- Милстоун не режем между дешёвыми субагентами: швы возникают там, где живут инварианты безопасности.
- Чат проверки **всегда новый** и **другой модели**, чем исполнитель. Долгоживущий проверяющий начинает сверяться со своей памятью вместо репозитория.
- Перепроверка после правок — в том же чате проверки (он уже знает, что искать). Закрывается вместе с милстоуном.
- Знание накапливаем в handoff-файлах, а не в контексте чата.
- Где секция проверки противоречит самоотчёту исполнителя — **верна проверка**.

## Милстоуны и модели

Доступные в Cursor модели: Cursor Grok 4.6, Composer 2.5 Fast, Cursor Grok 4.5 High Fast, Claude Opus 5 High, GPT-5.6 Sol High, Claude Sonnet 4.6 Medium, Codex 5.3 Medium, GPT-5.4 Medium.

| Chat | Содержание                   | Исполнитель                    | Проверка           | Статус                      |
| ---- | ---------------------------- | ------------------------------ | ------------------ | --------------------------- |
| 1    | Foundation + Audit           | Cursor Grok 4.6                | Claude Opus 5 High | сделан, проверен 2026-08-21 |
| 2    | Credentials + Auth + Policy  | Claude Opus 5 High             | GPT-5.6 Sol High   | PASS WITH DEBTS, 2026-08-21 |
| 3    | Capabilities + Tasks         | Cursor Grok 4.6                | GPT-5.6 Sol High   | PASS WITH DEBTS, 2026-08-21 |
| 4    | REST + MCP                   | Claude Opus 5 High             | Cursor Grok 4.6    | PASS WITH DEBTS, 2026-08-21 |
| 5    | Providers + Models           | Cursor Grok 4.6                | GPT-5.6 Sol High   | следующий                   |
| 6    | Admin UI                     | Cursor Grok 4.6 + Composer 2.5 | Cursor Grok 4.6    | —                           |
| 7    | Security + regression        | Claude Opus 5 High             | GPT-5.6 Sol High   | —                           |
| 8    | Final 700-point verification | Claude Opus 5 High             | —                  | —                           |

Критерий выбора: **функционал дороже стоимости модели**. Сильная модель ставится туда, где отказ **тихий** — зелёные тесты при реально незакрытой проверке доступа. Где отказ громкий (сломанный экран, упавший провайдер, красный тест), достаточно Grok. Экономия на исполнителе не является аргументом.

Логика распределения:

- **Claude Opus 5 High** — там, где ошибка означает тихую дыру в авторизации или потерю данных: credentials/auth/policy (2), authorization parity REST и MCP (4), изоляция и security-регрессия (7), финальная приёмка 724 пунктов (8).
- **Cursor Grok 4.6** — там, где он уже дал результат на Chat 1: domain capabilities (3), провайдеры и каталог моделей (5), Admin UI (6).
- **Composer 2.5 Fast** — рутина внутри Chat 6: независимые экраны, формы, адаптив.
- **Проверка всегда другого семейства, чем исполнитель.** Работу Anthropic проверяет OpenAI-модель, работу Grok — OpenAI, работу OpenAI — Grok. Одинаковая модель повторяет собственную слепую зону, а родственная — склонна к тем же архитектурным привычкам. Ротация трёх семейств даёт настоящую независимость гейта.
- **GPT-5.6 Sol High** как основной проверяющий: сильная модель, но дешевле держать её на коротком read-only гейте, чем на реализации.
- **Claude Sonnet 4.6 Medium, GPT-5.4 Medium, Codex 5.3 Medium, Grok 4.5 High Fast** — резерв под мелкие правки после проверки, когда запускать сильную модель незачем.

`16-Phase-1-Execution-Strategy.md` прямо требует независимого ревью сильной моделью для миграций, credentials/auth, Policy Evaluator, cross-workspace изоляции и REST/MCP authorization parity — это и есть Chat 2, 4, 7.

## Состояние на 2026-08-21

Chat 1 сделан и проверен независимо. Handoff: `17-Phase-1-Chat-1-Handoff.md`.

Chat 2 закрыт **PASS WITH DEBTS**. Handoff: `18-Phase-1-Chat-2-Handoff.md`.

Chat 3 закрыт **PASS WITH DEBTS**. Handoff: `19-Phase-1-Chat-3-Handoff.md`.

Chat 4 закрыт **PASS WITH DEBTS**. Handoff: `20-Phase-1-Chat-4-Handoff.md`. Ветка **`sipan`**, последний коммит `7eebbe41`. Следующий — Chat 5.

Долги, которые Chat 5 **не** закрывает: J 186 `[~]` (section U), K 205 `[~]` / W 368 `[~]`, K 209 `[~]` (теперь достижим с провода), live handshake Cursor/Codex/Claude Code. Протокол `/api/v1/agent` — контракт: не ломать routes/tools/error codes.

### Правила БД (критично)

- `.env.local` переключён на **dev Neon-ветку** `ep-late-frost-ag5aixzw` (прод — `ep-sweet-dew-ag7259wn`, в разработке не используем). Перед миграциями всегда сверяй хост.
- Миграция `20260821150000_audit_actor_aware` **применена на dev** 2026-08-21, `Database schema is up to date!`. На проде ещё нет — до её применения там любой `AuditService.log()` из кода `sipan` упадёт с ошибкой 42703, потому что Prisma-клиент содержит `actor_type`/`actor_id`, а колонок в БД нет. Ломаться будут бизнес-операции, а не только аудит.
- **`prisma migrate dev` запрещён на обеих ветках.** В истории миграций дрейф: в БД записаны `20260331180000_add_product_category_cascade`, `20260331180000_restore_products_extensions`, `20260430132500_mail_p0_provider_attachments`, локально их нет (аналоги переименованы). При таком дрейфе `migrate dev` предлагает **reset**, то есть удаление данных. Dev-ветка унаследовала копию продовых данных — её тоже терять не надо.
- Единственный разрешённый способ применения — `prisma migrate deploy` с `DIRECT_URL`.
- Новые индексы на больших таблицах — `CREATE INDEX CONCURRENTLY` отдельной миграцией.
- Продовые миграции выполняет только разработчик, не агент.

## Мастер-промт Phase 1 (общая преамбула всех милстоунов)

```text
Изучи новую каноническую документацию модуля: docs/NBOS/02-Modules/21-AI-Platform/
Мы спроектировали новый AI Platform для NBOS с нуля: External Agents, REST + MCP, безопасные
capabilities/scopes, actor-aware Audit, Workspace/Tasks access, OpenAI/Anthropic providers,
model catalog/routing, Internal Agent foundation, approvals, prompts/context/memory boundaries,
usage/evaluation и AI administration UI.

Твоя задача — реализовать Phase 1 по документации, используя как основной executable checklist:
docs/NBOS/02-Modules/21-AI-Platform/10-Phase-1-AI-Foundation-and-External-Agent-Implementation.md

Правила работы:
- Сначала внимательно изучи документы 21-AI-Platform, связанные NBOS docs и реальный runtime/code.
- Не считай старую реализацию автоматически правильной: при расхождении docs/runtime сначала
  проведи reconciliation согласно checklist.
- Выполняй пункты checklist последовательно и отмечай статус каждого: [x], [~], [!].
- Не создавай параллельную архитектуру и не обходи domain services прямыми Prisma writes.
- External REST и MCP используют один Actor → Policy → Capability → Domain Action → Audit foundation.
- Сохраняй полную обратную совместимость human RBAC, Tasks, Drive, Audit, API/worker/scheduler.
- Не упрощай security/isolation/idempotency/negative tests.
- tasks.create и ограниченный tasks.update управляются отдельными permissions; tasks.delete и
  force-complete в Phase 1 запрещены.
- Не останавливайся после структуры/DTO/API: доводи слайс до tests, UI, migrations и docs sync.
- Реальное противоречие, которое нельзя безопасно решить по canon/runtime, фиксируй как
  [!] BUSINESS DECISION с объяснением, что именно требуется решить. В остальных случаях принимай
  senior-level техническое решение самостоятельно.

Definition of Done Phase 1: все применимые пункты checklist реализованы, протестированы и
подтверждены evidence; существующий NBOS не сломан; External Agent реально может подключиться
по REST/MCP и безопасно работать с разрешёнными Workspace/Tasks.
```

## Промт исполнителя — Chat 5

Модель: **Cursor Grok 4.6**. В новый чат вставляй два блока: мастер-промт Phase 1, затем этот. Проверка после — GPT-5.6 Sol High.

```text
Продолжи Phase 1 AI Platform. Это Chat 5 — Providers, Models and Internal-Agent Foundation.

ВЕТКА. Работай в sipan. Chat 4 закрыт PASS WITH DEBTS (последний коммит 7eebbe41,
handoff 20-Phase-1-Chat-4-Handoff.md). Перед изменениями проверь наличие
apps/api/src/modules/ai-platform/protocol/agent-operation.registry.ts,
apps/api/src/modules/ai-platform/rest/,
apps/api/src/modules/ai-platform/mcp/ и
apps/api/src/common/utils/crypto.ts.
Если их нет — ты не на той ветке, остановись и сообщи.

ЧИТАЙ И СВЕРЯЙ С РЕПОЗИТОРИЕМ:
- docs/NBOS/02-Modules/21-AI-Platform/20-Phase-1-Chat-4-Handoff.md (секция Chat 5 entry point)
- docs/NBOS/02-Modules/21-AI-Platform/10-Phase-1-AI-Foundation-and-External-Agent-Implementation.md (Y–AC)
- docs/NBOS/02-Modules/21-AI-Platform/06-AI-Providers-Models-and-Routing.md
- docs/NBOS/02-Modules/21-AI-Platform/11-Internal-Agent-Lifecycle-and-Assignments.md
- docs/NBOS/02-Modules/21-AI-Platform/05-AI-Data-Security-and-Audit.md
Handoff не является доказательством: сам прогони vitest и typecheck до начала работы.

SCOPE CHAT 5 (чеклист Y–AC):
- Provider connection foundation: OPENAI и ANTHROPIC за одним adapter interface.
  Несколько connections на провайдера структурно возможны. Enable/disable,
  lastValidatedAt, lastModelSyncAt, createdBy/audit. Бизнес-модули не зависят от провайдера.
- Provider keys: существующий AES-256-GCM (apps/api/src/common/utils/crypto.ts,
  CREDENTIALS_ENCRYPTION_KEY). Не второй crypto-стек. Ключ виден один раз при save/rotate,
  после save не возвращается, не логируется, не пишется в Audit changes, не попадает
  в AI-контекст и не становится input любой External Agent capability.
- Validate connection without exposing secret. Rotate/replace и disable/revoke.
- Model catalog: stable internal id + provider external id, DISCOVERED/ACTIVE/DISABLED/
  DEPRECATED/UNAVAILABLE. Sync OpenAI и Anthropic. Manual Sync + scheduled path/contract.
  Новые модели остаются DISCOVERED — auto-activate запрещён. Исчезнувшие не удалять,
  помечать UNAVAILABLE/DEPRECATED. Provider metadata отдельно от internal suitability.
- Model Policy: FIXED и PRIMARY_FALLBACK, ordered candidates, same- и cross-provider.
  Кандидат в production assignment только enabled/available. Не silent-promote DISCOVERED.
  TIERED/ADAPTIVE держать структурно возможным, learned/adaptive router НЕ реализовывать.
- Internal Agent foundation: стабильная identity (не имя модели). DRAFT/ACTIVE/PAUSED/
  DISABLED/ARCHIVED. Owner employee, linkage на capability grants/scopes, Model Policy,
  prompt-policy и approval-policy contracts. Model change не меняет permissions агента.
  Pause/disable блокирует новые execution. Archive сохраняет attribution. Audit lifecycle.
- Audit через AuditService.log({ actor }). INTERNAL_AI не пишет userId.

ЗАПРЕЩЕНО:
- Settings / Admin UI (Chat 6);
- ломать REST/MCP контракт Chat 4 (routes, tool names, error codes, envelope) —
  только extend через agent-operation.registry.ts, если capability должна быть внешней;
- adaptive/learned routing, полный internal employee chat, RAG/vector store,
  Messenger auto-reply, production customer-facing execution;
- полный Prompt Version runtime (AD) и Context Assembler (AE) — только linkage contracts;
- rate-limit counters (J 186 / section U), output schema validator (K 205),
  слияние domain commit + idempotency complete (K 209);
- доступ AI к модулю Credentials / vault / паролям / сырым provider keys;
- any, default exports, console.log, магические числа;
- удаление тестов и обход lint.

БАЗА ДАННЫХ:
- .env.local = dev Neon ep-late-frost-ag5aixzw; прод ep-sweet-dew-ag7259wn не трогать;
- prisma migrate dev запрещён (дрейф истории → reset);
- свои миграции только prisma migrate deploy с DIRECT_URL;
- продовые миграции не выполняй.

НА ВЫХОДЕ:
- обнови чеклист [x]/[~]/[!] честно;
- напиши docs/NBOS/02-Modules/21-AI-Platform/22-Phase-1-Chat-5-Handoff.md по формату Chat 4
  (milestone, чеклист, файлы, миграции, реальные числа тестов, решения, конфликты,
  риски, долги, entry point Chat 6);
  номер 21 занят setup-доком Chat 4 — не перезаписывай 21-External-Agent-Client-Setup.md;
- коммит не делай — его сделаем после чата проверки.
```

## Промт проверки (универсальный)

Меняется только номер милстоуна и путь к handoff.

```text
Ты чат проверки милстоуна Chat N модуля AI Platform Phase 1. Ты НЕ реализуешь и НЕ правишь код.
Твоя задача — независимо подтвердить или опровергнуть работу исполнителя.

Прочитай docs/NBOS/02-Modules/21-AI-Platform/1X-Phase-1-Chat-N-Handoff.md, но НЕ считай его
доказательством. Самоотчёт исполнителя проверяется, а не принимается.

ПРОВЕРЬ ФАКТИЧЕСКИ:
1. git: текущая ветка, коммит, чистота дерева. Все ли заявленные файлы реально существуют.
2. prisma migrate status — только чтение. Миграции НЕ применяй.
3. Прогони тесты затронутых пакетов и сравни числа с заявленными в handoff.
4. Прогони typecheck затронутых пакетов.
5. Прочитай diff милстоуна целиком. Ищи то, о чём handoff молчит.
6. Проверь запреты: any, default exports, console.log в prod-путях, магические числа, файлы > 300
   строк, функции > 50 строк, вложенность > 3, прямые Prisma-записи в Tasks/Drive из AI-кода,
   сырые секреты в БД/логах/audit, ослабленные security-контроли, удалённые тесты.
7. Проверь честность отметок чеклиста: [x] должен иметь код и тест, а не только DTO.
8. Проверь, не сделано ли лишнего вне scope милстоуна.
9. Проверь миграции: destructive-операции, DROP, индексы без CONCURRENTLY, обратная совместимость.

НА ВЫХОДЕ допиши в тот же handoff секцию:

## Verification (Chat N)

- Проверял: <модель>, дата.
- Вердикт: PASS / PASS WITH DEBTS / FAIL.
- Запущено: <команды и реальный вывод: сколько файлов/тестов, статус typecheck, migrate status>.
- Расхождения с самоотчётом: <список или «нет»>.
- Найденные дефекты: <файл:строка — описание — критичность>.
- Долги для следующего милстоуна: <список>.
- Не проверено: <что и почему>.

ЗАПРЕЩЕНО: править код, коммитить, пушить, применять миграции, писать в продовую БД.
Если вердикт FAIL — сформулируй точный список правок для исполнителя и остановись.
```
