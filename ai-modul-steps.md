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
| 2    | Credentials + Auth + Policy  | Claude Opus 5 High             | GPT-5.6 Sol High   | следующий                   |
| 3    | Capabilities + Tasks         | Cursor Grok 4.6                | GPT-5.6 Sol High   | —                           |
| 4    | REST + MCP                   | Claude Opus 5 High             | Cursor Grok 4.6    | —                           |
| 5    | Providers + Models           | Cursor Grok 4.6                | GPT-5.6 Sol High   | —                           |
| 6    | Admin UI                     | Cursor Grok 4.6 + Composer 2.5 | Cursor Grok 4.6    | —                           |
| 7    | Security + regression        | Claude Opus 5 High             | GPT-5.6 Sol High   | —                           |
| 8    | Final 700-point verification | Claude Opus 5 High             | —                  | —                           |

Логика распределения:

- **Claude Opus 5 High** — там, где ошибка означает тихую дыру в авторизации или потерю данных: credentials/auth/policy (2), authorization parity REST и MCP (4), изоляция и security-регрессия (7), финальная приёмка 724 пунктов (8).
- **Cursor Grok 4.6** — там, где он уже дал результат на Chat 1: domain capabilities (3), провайдеры и каталог моделей (5), Admin UI (6).
- **Composer 2.5 Fast** — рутина внутри Chat 6: независимые экраны, формы, адаптив.
- **Проверка всегда другого семейства, чем исполнитель.** Работу Anthropic проверяет OpenAI-модель, работу Grok — OpenAI, работу OpenAI — Grok. Одинаковая модель повторяет собственную слепую зону, а родственная — склонна к тем же архитектурным привычкам. Ротация трёх семейств даёт настоящую независимость гейта.
- **GPT-5.6 Sol High** как основной проверяющий: сильная модель, но дешевле держать её на коротком read-only гейте, чем на реализации.
- **Claude Sonnet 4.6 Medium, GPT-5.4 Medium, Codex 5.3 Medium, Grok 4.5 High Fast** — резерв под мелкие правки после проверки, когда запускать сильную модель незачем.

`16-Phase-1-Execution-Strategy.md` прямо требует независимого ревью сильной моделью для миграций, credentials/auth, Policy Evaluator, cross-workspace изоляции и REST/MCP authorization parity — это и есть Chat 2, 4, 7.

## Состояние на 2026-08-21

Chat 1 сделан и проверен независимо.

- Ветка **`sipan`**, коммит `66ebd5e3 feat(ai): add actor-aware Audit and shared ActorContext`. Не запушена — запушить до продолжения.
- Подтверждено: `vitest` 6 файлов / 34 теста passed; typecheck чистый в `@nbos/shared`, `@nbos/database`, `api`, `web`.
- Чеклист отмечен честно: 88 `[x]`, 9 `[~]`, 1 `[!]`.
- Handoff: `17-Phase-1-Chat-1-Handoff.md`.

### Правила БД (критично)

- Единственный `DATABASE_URL` в `.env.local` указывает на **продовый** Neon `neondb` (`ep-sweet-dew-ag7259wn`).
- Миграция `20260821150000_audit_actor_aware` **не применена**. Пока не применена, любой `AuditService.log()` из кода `sipan` упадёт с ошибкой 42703 — Prisma-клиент уже содержит `actor_type`/`actor_id`, а колонок в БД нет. Ломаться будут бизнес-операции, а не только аудит.
- Решение: отдельная **Neon-ветка как dev-БД** для всего Phase 1. Нужны её `DATABASE_URL` / `DIRECT_URL`.
- **`prisma migrate dev` на продовом URL запрещён.** В истории миграций дрейф: в БД записаны `20260331180000_add_product_category_cascade`, `20260331180000_restore_products_extensions`, `20260430132500_mail_p0_provider_attachments`, локально их нет (аналоги переименованы). При таком дрейфе `migrate dev` предлагает **reset**, то есть удаление данных.
- Безопасный путь — `prisma migrate deploy` с `DIRECT_URL`.
- Новые индексы на больших таблицах — `CREATE INDEX CONCURRENTLY` отдельной миграцией.

### Долги Chat 1 (закрыть в Chat 2)

- `ActorChannel.source: ActorChannelSource | string` — юнион со `string` обнуляет типизацию каналов (`packages/shared/src/actor/actor-context.ts`).
- `isMachineActorType` реализован как `type !== 'USER'`, объявленный рядом `MACHINE_ACTOR_TYPES` не используется.
- `params.userId as string` в `resolveAuditWriteContext` (`apps/api/src/modules/audit/audit-log-write.mapper.ts`).
- `AuditService` никогда не передаёт `AuditActorLookups` в `attachActorsToAuditLogs` — имена агентов в аудите не появятся.
- Там же машинные имена резолвятся `await` внутри `map` → N+1 запросов на страницу.
- Два `CREATE INDEX` в миграции Chat 1 без `CONCURRENTLY`.

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

## Промт исполнителя — Chat 2

```text
Продолжи Phase 1 AI Platform. Это Chat 2 — Credentials + Auth + Policy.

ВЕТКА. Работай в sipan. Chat 1 = коммит 66ebd5e3. Перед любыми изменениями проверь наличие
packages/shared/src/actor/*, packages/database/prisma/migrations/20260821150000_audit_actor_aware/
и apps/api/src/modules/audit/audit-log-write.mapper.ts. Если их нет — ты не на той ветке,
остановись и сообщи.

ЧИТАЙ И СВЕРЯЙ С РЕПОЗИТОРИЕМ:
- docs/NBOS/02-Modules/21-AI-Platform/17-Phase-1-Chat-1-Handoff.md
- docs/NBOS/02-Modules/21-AI-Platform/10-Phase-1-AI-Foundation-and-External-Agent-Implementation.md (E–J)
- docs/NBOS/02-Modules/21-AI-Platform/01-AI-Actors-Identity-and-Access.md
- docs/NBOS/02-Modules/21-AI-Platform/03-External-Agent-Access.md
- docs/NBOS/02-Modules/21-AI-Platform/05-AI-Data-Security-and-Audit.md
Handoff Chat 1 не является доказательством: сам прогони vitest и typecheck до начала работы.

SCOPE CHAT 2:
- External Agent persistence;
- credential generation + hashing (argon2, существующий security baseline), rotation, revoke;
- identity агента стабильна при rotation;
- отдельный machine auth guard — НЕ EmployeeGuard, токены агентов через него не проходят;
- capability registry;
- capability grants + resource scopes (agent grants, НЕ ResourceAccessGrant.employeeId);
- deny-by-default Policy Evaluator;
- isolation и negative тесты (cross-workspace, revoked credential, disabled agent, unknown capability).

ДОЛГИ CHAT 1 — закрыть здесь:
- сузить ActorChannel.source до ActorChannelSource (убрать | string);
- задействовать MACHINE_ACTOR_TYPES в isMachineActorType;
- убрать `params.userId as string` в resolveAuditWriteContext;
- передать AuditActorLookups из AuditService (resolveExternalAgentDisplayName) и сделать
  батч-резолв машинных имён вместо await внутри map;
- индексы новых таблиц — CREATE INDEX CONCURRENTLY отдельной миграцией.

БАЗА ДАННЫХ:
- работай только на dev Neon-ветке, URL даст разработчик;
- prisma migrate dev на продовом URL запрещён (дрейф истории → reset → потеря данных);
- применение только через prisma migrate deploy с DIRECT_URL;
- продовые миграции не выполняй.

ЗАПРЕЩЕНО:
- REST/MCP контроллеры (это Chat 4);
- прямые Prisma-записи в Tasks/Drive из AI-кода;
- вставка AI-акторов в ResourceAccessGrant.employeeId;
- второй crypto-стек (используй существующий AES-256-GCM / CREDENTIALS_ENCRYPTION_KEY);
- сырой секрет в БД, в логах и в audit clientMetadata;
- any, default exports, console.log, магические числа;
- удаление тестов и обход lint ради прохождения проверок.

AUDIT: пиши через AuditService.log({ actor }). Машинный актор не пишет userId.

НА ВЫХОДЕ:
- обнови чеклист [x]/[~]/[!] честно;
- напиши docs/NBOS/02-Modules/21-AI-Platform/18-Phase-1-Chat-2-Handoff.md по формату Chat 1
  (milestone, чеклист, изменённые файлы, миграции, прогнанные тесты с реальными числами,
  архитектурные решения, конфликты canon/runtime, риски, долги, entry point Chat 3);
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
