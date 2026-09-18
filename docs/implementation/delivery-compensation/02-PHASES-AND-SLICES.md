# Фазы, slices и журнал исполнения

**2026-09-18: только документация. Все implementation slices ниже TODO.**

Порядок последовательный. Весь scope реализуется за один рабочий цикл Cursor с сохранением checkpoint после каждого slice. Не оставлять финальный результат на уровне schema-only, mock UI или «готово к подключению payroll».

## 1. Правила исполнения

Перед началом: AGENTS.md → TECH_CARD → [бизнес-канон](../../NBOS/03-Business-Logic/11-Delivery-Compensation-Configurator.md) → [UI](../../NBOS/05-UI-Specifications/15-Delivery-Function-Catalog-and-Configurator.md) → технический контракт → этот план → приёмка/seed.

Для каждого slice:

1. Отметить IN_PROGRESS, записать исходный commit и dirty-state; сохранить пользовательские изменения.
2. Уточнить затрагиваемые entry points, реализовать backend/UI/контракт согласно границе slice.
3. Запустить соответствующие targeted tests, lint/typecheck и Prettier на затронутых файлах.
4. Проверить git diff, обновить журнал: что сделано, команды, результаты и оставшиеся ограничения.
5. На границе фазы провести отдельный review по `code-review` skill; после sensitive slices также `security-review`. Исправить actionable findings и перепроверить изменённое.
6. Перейти к следующему slice без запроса «продолжать?». Если есть реальный blocker, продолжать независимую разрешённую работу и точно записать блокирующее условие.

Постоянные skills/rules: `verify-before-completion`, `safe-database-migration` для схемы, security для прав/денег/файлов. Прочитать их перед применением. Не использовать project-onboarding. Commits/push/PR/deploy не входят в этот prompt без отдельного прямого запроса пользователя.

## 2. Фаза 0 — baseline и совместимость

### S00. Инвентаризация и regressions

**Работа:** перечитать integration map; перечислить все write paths lifecycle/team, legacy finance edits, функции earnedPeriod/cap/carry, auth/Drive/i18n. Зафиксировать существующие тесты, route paths, release semantics. Проверить старую Delivery Bonus-вкладку и Product money surfaces. Проверить отсутствие предположения, что production пуста.

**Результат:** заполненный baseline appendix журнала с exact paths; existing tests запущены на безопасном окружении. Подтверждён путь для partial funding в позднем месяце и early release либо описан конкретный узкий gap для S13.

**Gate:** никакой новой модели на неподтверждённой схеме lifecycle; никакого изменения Seller/KPI policy ради удобства. Baseline failures не скрываются и не обнуляются.

## 3. Фаза 1 — данные и server permissions

### S01. Additive schema и enum-контракты

Новые catalog/content/price/base/rate/config/revision/component/allocation entities; nullable BonusEntry source anchors; Extension role assignments; constraints/indexes. План SQL по `safe-database-migration`, отдельные NETWORK enum/data шаги оставить до соответствующей фазы либо заранее подготовить без включения UI. Legacy mode по умолчанию для существующих records.

**Gate:** Prisma validate/generate/typecheck, migration inspect и применение к disposable DB, сохранность representative legacy rows, DB uniqueness для materialization, nullable vs zero fixtures. Нет production операций.

### S02. Permissions и safe serializers

Capabilities content-read/edit, rules-manage Owner/CEO, scoped configuration edit; запрет расширенного Compensation доступа PM/Finance. Раздельные operational/financial DTO; attachment ACL. Parent My Company layout не блокирует разрешённый каталог и не открывает HR.

**Gate:** role/object negative tests, direct endpoint calls, mass-assignment, SSR/API response assertions no units/rates; review security boundary до UI.

## 4. Фаза 2 — каталог и нормы

### S03. Каталог и инструкции backend

CRUD контента, draft/active/archive, content versions, поиск/пагинация, ссылки/изображения через FileAsset. Общая инструкция отдельно от product notes; используемую функцию не удалять. Возможность создать неоплаченную draft функцию без навязывания workflow PM.

**Gate:** draft не попадает в оплачиваемый picker; архив читается в старом продукте; content edit не меняет финансовую версию; файлы не обходят ACL.

### S04. Нормативы и чистый calculator

Versioned base profiles, included-in-base links, price vectors, role tariffs, effective resolver, три design modes + AI Reviewer. Independent Back/Front; Decimal и split rounding; current pricing только для новых компонентов. Reference-product copy переносит только разрешённый scope.

**Gate:** числовые сценарии C01–C10 из приёмки; concurrency publish; no old 70/30, no double base charge, no null→zero, no role/employee salary dependent rate.

### S05. Admin UI

Полный `/my-company/function-catalog`, function sheet content/Owner-only pricing; Compensation base/rate editors, published versions и history. Form validation, rich text, uploads, EN/RU/HY, read-only role view. Начальный draft seed из отдельного документа.

**Gate:** Owner способен настроить новый профиль/функцию/ставку без кода. PM способен читать/редактировать разрешённые инструкции, но не получать pricing. Browser QA desktop/mobile и private DTO review.

## 5. Фаза 3 — конфигуратор и Starting

### S06. Configuration backend

Product/Extension configuration, base inclusion resolution, feature picker, local notes, team binding, checked revision, operational preview. Scope expectedRevision и conflict handling. Не дублировать source team Product; Extension assignments фиксируются самостоятельно.

**Gate:** draft не создаёт BonusEntry; included функции активны/не платятся дважды; permissions scoped; копия старого продукта использует актуальную норму и не копирует secrets/recipient/amount; legacy карточки не получают автоматический gate.

### S07. Product/Delivery UI

Один reusable «Функции» workspace в Product page и Product/Extension Delivery sheet. Визуальные карточки с иконками, «+ Добавить», included badges, инструкция, Save/Cancel, подтверждение scope. Удалить Bonus tab/money summary из рабочих entry points, безопасно обработать старый query-tab без утечки. Финансовые экраны не удалять.

**Gate:** одинаковое состояние в обоих entry points после reload; никаких чисел units/bonus в DOM/Network/общей history; контент, focus, dirty draft, mobile исправны.

## 6. Фаза 4 — Development и плановые бонусы

### S08. Транзакционная материализация

Общий hook первого Development: stage gates + normative readiness + assignments + immutable plan + BonusEntry в одной транзакции. DB idempotency и concurrent tests; все legacy/status/move/automation пути. Кошелёк получает плановые записи после commit.

**Gate:** L01–L07; при ошибке нет ни половинчатой стадии, ни половины начислений. Retry/back-forward/On Hold не дублируют. New source помечен, old entries не переписываются.

### S09. Обратная связь о готовности

Stage blockers/deep links, подтверждение scope, notifications только адресату; new vs legacy enrollment и Owner adoption preview. Обычный PM не должен видеть units в blocker message.

**Gate:** end-to-end Starting → Development для Product и Extension, все 6 ролей, AI Reviewer, same employee 2 roles, отсутствующая required роль; нет фиктивной платёжной операции.

## 7. Фаза 5 — изменения scope и команды

### S10. Добавление, удаление, переклассификация

Incremental component diff; новые версии для новых функций; late-added completed work в активном цикле; removal сохраняет принятую/encumbered часть; ручной бонус за ту же работу требует разрешить duplicate risk. Смена базовых параметров — отдельная явная revision, не автоматический reprice.

**Gate:** C07, L08–L12; add/remove/re-add/retry; конфликт параллельных изменений; незатронутые суммы побайтно/Decimal неизменны; Wallet own delta.

### S11. Замена исполнителя

Один command для Product/Delivery/Extension, обязательные пустые поля распределения, sum validation, repeated handovers, reason, защищённый financial floor. Закрыть direct team PATCH обход. В Starting обычное назначение без handover dialog.

**Gate:** H01–H08; база распределяется одним введённым человеком соотношением, допфункции отдельными строками; нет defaults/autofill 0/100; общий бонус сохраняется; no paid transfer; no exposure чужих денег.

### S12. Отмена и архив

Active cancellation/removal accepted share; closed read-only; архивы функций/профилей/сотрудников; отсутствие hard delete financial history. Временная pause не равна cancellation. Cancelled accepted bonus не auto-releases как Done.

**Gate:** L10–L12 и H07, negative tests ledger mutation; review business correctness на границе фазы.

## 8. Фаза 6 — Finance, Wallet и полная выплата

### S13. Finance bridge

Pool totals, QA/Tech resolver/matrix/history, earnedPeriod на факте приёмки, existing auto/manual release, cap/FIFO carry, corrections/detach, generated-entry manual adjustment contract. Проверить позднее финансирование и existing early release. Узкие несовместимости baseline исправлять с регрессионным тестом, без изменения Sales policy.

**Gate:** F01–F10; отсутствие duplicate plan+entry totals; payroll approval/partial/full payments; same-employee multi-role, case mixed SALES+delivery, old manual entries. Нельзя объявить эту фазу готовой только по planner unit tests.

### S14. Wallet и разрешённые Finance read models

Own forecasts с Development, readable role/source names, revision delta/reason, release/payment distinctions; query pagination/rollups/export не теряют старые бонусы. Full private calculation доступен только Owner/CEO; Finance получает allowed monetary facts без автоматически раскрытых units.

**Gate:** Wallet sum соответствует authoritative ledger, own-only; financial JSON snapshot/exports/audit/notifications не раскрывают units или других сотрудников. Старые UI компоненты не предполагают только 3 delivery роли.

## 9. Фаза 7 — Network

### S15. Source enum и ставки

Additive `NETWORK`, stable migration sequence, idempotent own policy rows, canonical 4+1 / 40+10 / 0+0. Если текущие Client rates отличаются — показать конфигурационную разницу, не менять их. Historic SALES+NETWORKING оставить.

**Gate:** fresh DB + existing data, enum commit before seed, no duplicate rows on rerun, no rewrite existing sources/policies/BonusEntry.

### S16. CRM/UI и accrual regression

Shared validators/types, Lead/Deal pickers, conversion, фильтры/grouping, labels EN/RU/HY, Sales policy UI, serializers/report grouping. Network полноценный From, не channel alias.

**Gate:** N01–N05; Classic/first recurring/idempotency/same Seller Assistant; все прежние sources дают прежние результаты.

## 10. Фаза 8 — end-to-end, readiness, handoff

### S17. Reconciliation и безопасный запуск

Read-only consistency report, idempotent draft seed CLI с dry-run, явный dev/demo fixture, setup readiness, legacy skip/adopt, feature switch и operator runbook. Не создавать коммерческие цены из примеров. Не прогонять общий production seed.

**Gate:** duplicate seed сохраняет Owner edits; выключение new enrollment не скрывает долги; ссылки на инструкции/файлы после archive; test data cleanup только собственного disposable fixture.

### S18. Полная приёмка и финальный review

Пройти весь checklist `03-ACCEPTANCE-AND-ROLLOUT.md`, relevant regressions API/shared/web, typecheck/lint, Prettier, builds, browser walkthrough, database migration upgrade test, final code/security review. Обновить Hub/implementation status с реальными результатами и handoff владельцу.

**Gate:** все scoped фазы реализованы; нет незавершённых критических контрактов «потом подключим»; blockers и не выполненные проверки явно названы. Production rollout и внесение реальных финансовых нормативов не выдавать за выполненные автоматически.

## 11. Команды проверки

Проверить актуальные package scripts/Node version перед запуском. Примеры существующих команд:

```bash
pnpm exec vitest run apps/api/src/modules/bonus apps/api/src/modules/payroll-runs apps/api/src/modules/employees/employee-wallet.service.test.ts packages/shared/src/constants/developer-pool-split.test.ts
pnpm --filter @nbos/api typecheck
pnpm --filter @nbos/web typecheck
pnpm --filter @nbos/api lint
pnpm --filter @nbos/web lint
pnpm --filter @nbos/database exec prisma validate
pnpm db:generate
pnpm run build:api
pnpm run build:web
```

После появления новых modules добавить их тесты. Для каждого slice использовать минимальный meaningful набор, на S18 — весь затронутый поток. `pnpm exec prettier --check` запускать с конкретными touched paths; сначала `--write` при необходимости. Не форматировать весь репозиторий. Не использовать network/DB mocks как доказательство реальных транзакционных/авторизационных сценариев: для них нужен local test DB/API.

## 12. Журнал исполнения

| Slice | Статус | Evidence / проверки / blockers |
| --- | --- | --- |
| S00 | TODO | — |
| S01 | TODO | — |
| S02 | TODO | — |
| S03 | TODO | — |
| S04 | TODO | — |
| S05 | TODO | — |
| S06 | TODO | — |
| S07 | TODO | — |
| S08 | TODO | — |
| S09 | TODO | — |
| S10 | TODO | — |
| S11 | TODO | — |
| S12 | TODO | — |
| S13 | TODO | — |
| S14 | TODO | — |
| S15 | TODO | — |
| S16 | TODO | — |
| S17 | TODO | — |
| S18 | TODO | — |

Допустимые статусы: TODO, IN_PROGRESS, IMPLEMENTED_NOT_VERIFIED, BLOCKED, DONE. DONE требует evidence; нельзя закрывать по одному наличию файлов. После каждого slice дописывать краткий checkpoint с changed files, commands/results и next action. Review notes по фазе хранить здесь или в ссылке на локальный review artifact.

### Baseline appendix (заполнить в S00)

- Commit / branch / dirty files: не проверено исполнителем.
- Все lifecycle/team routes: не проверено исполнителем.
- Existing payout month / late funding behavior: не проверено исполнителем.
- Baseline tests / failures: не запущено исполнителем.
- Safe database target: не выбран.

### Проверка документации (не implementation gate)

- Статический анализ schema/services/UI/canon выполнен при подготовке.
- Prettier, internal links и `git diff --check`: результаты будут записаны после завершения подготовки.
- Runtime tests/builds/migrations: не запускались, поскольку этот этап изменяет только Markdown.
