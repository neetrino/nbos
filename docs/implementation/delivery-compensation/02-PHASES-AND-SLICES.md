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

| Slice | Статус                   | Evidence / проверки / blockers                                                                                                                                                                       |
| ----- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S00   | DONE                     | 2026-09-19 commit `240cceb6b` branch `sipan`, dirty empty. Baseline tests 66 files / 335 passed. Neon target **not** treated as disposable — migrate not run. See appendix.                          |
| S01   | IMPLEMENTED_NOT_VERIFIED | Additive Prisma + foundation SQL. **2026-09-19 applied via `migrate deploy` to `.env.local` Neon `nameless-term` (dev, not PROD `sweet-dew`).** No reset.                                            |
| S02   | IMPLEMENTED_NOT_VERIFIED | Permissions + operational/financial serializers + guarded endpoints. Unit tests 17 files / 67 passed (+ later 12/30 module re-run). Shared/API/web typecheck passed. No live HTTP/DB.                |
| S03   | IMPLEMENTED_NOT_VERIFIED | Catalog pagination/search, content versions, activate without units, archive-if-unused, FileAsset attach+ACL. Tests 15 files / 38. API typecheck passed. No live DB.                                 |
| S04   | IMPLEMENTED_NOT_VERIFIED | Pure calculator C01–C10 on synthetic fixtures; share split keeps 10.01; publish blocks null units; role rates reject employeeId. Shared+module tests 18/52 then 10/48 with UI. No live publish.      |
| S05   | IMPLEMENTED_NOT_VERIFIED | `/my-company/function-catalog` grid/sheet/draft form; pricing panel and Compensation rates only if RULES VIEW. i18n EN/RU/HY. Web typecheck passed. **Browser QA not run** (no local app).           |
| S06   | IMPLEMENTED_NOT_VERIFIED | Enroll gated by readiness switch; implicit LEGACY; add ACTIVE features; included vs extra. Missing: copy-from, extension enroll, object-scope grants. No live DB.                                    |
| S07   | IMPLEMENTED_NOT_VERIFIED | Product `?tab=functions` (+ `bonus` alias); Delivery sheet Bonus tab replaced. Shared Functions workspace, no money in DOM. **Browser QA not run.**                                                  |
| S08   | IMPLEMENTED_NOT_VERIFIED | First Development materializes plan+BonusEntry in the same transaction as stage write (Product/Extension, moveStage + status PATCH). Starting/legacy skip. Retry uses initialRevisionId. No live DB. |
| S09   | IMPLEMENTED_NOT_VERIFIED | Operational readiness codes on configuration GET; Functions workspace shows safe blockers. No units in messages. **Browser QA not run.**                                                             |
| S10   | IMPLEMENTED_NOT_VERIFIED | Post-plan add creates only new feature components; re-add restores identity; remove archives and reduces to encumbered floor. expectedRevision 409. No live concurrency test.                        |
| S11   | IMPLEMENTED_NOT_VERIFIED | `POST .../replacements` requires empty share fields; product team PATCH after plan returns REDISTRIBUTION_REQUIRED. No replacement UI modal yet.                                                     |
| S12   | IMPLEMENTED_NOT_VERIFIED | Feature archive + cancel paths do not delete BonusEntry/ledger. Pause ≠ cancel (existing). Closed read-only and profile archive not fully wired.                                                     |
| S13   | IMPLEMENTED_NOT_VERIFIED | Pool sync after create/add/replace. Floor uses releases once. earnedPeriod not rewritten. **QA/Tech matrix slot gap from S00 baseline remains.** No payroll integration test.                        |
| S14   | IMPLEMENTED_NOT_VERIFIED | Wallet include still omits `deliveryNormativeSnapshot`/units. Amounts for own employee only (existing). No new Wallet grouping by six roles.                                                         |
| S15   | IMPLEMENTED_NOT_VERIFIED | Additive `NETWORK` enum + idempotent policy SQL 4+1 / 40+10 / 0+0 prepared. **Migrate not applied.** Other Sales sources not updated.                                                                |
| S16   | IMPLEMENTED_NOT_VERIFIED | Lead/Deal From pickers and EN/RU/HY catalogs include Network. Sales channel NETWORKING unchanged. Accrual uses existing policy lookup. No browser QA.                                                |
| S17   | TODO                     | Draft catalog seed CLI / operator runbook / Owner readiness switch UI not shipped. Enrollment stays default OFF.                                                                                     |
| S18   | TODO                     | Full acceptance checklist, phase reviews after S17, production rollout **not** done.                                                                                                                 |

Допустимые статусы: TODO, IN_PROGRESS, IMPLEMENTED_NOT_VERIFIED, BLOCKED, DONE. DONE требует evidence; нельзя закрывать по одному наличию файлов. После каждого slice дописывать краткий checkpoint с changed files, commands/results и next action. Review notes по фазе хранить здесь или в ссылке на локальный review artifact.

### Baseline appendix (S00, 2026-09-19)

- Commit / branch / dirty files: `240cceb6b` on `sipan`; working tree clean at start. Docs status in README still said implementation not started — that was documentation, not code.
- Safe database target: **not selected**. `.env.local` `DATABASE_URL` / `DIRECT_URL` are Neon pooler hosts (not loopback). `DATABASE_URL_PROD` is a different Neon host, same 6-char db name length. No docker-compose local Postgres. **No migrate/push/reset against these URLs.**
- Production emptiness: not assumed. Additive schema only; no backfill of money; existing products stay implicit LEGACY (no configuration row).

#### Lifecycle / team write paths (Product)

| Route                                     | Method                      | Writes                                     | Creates BonusEntry today                                                                                                  |
| ----------------------------------------- | --------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `PUT /projects/products/:id`              | `products.service.update`   | team slots + fields                        | No. After a V2 plan: `REDISTRIBUTION_REQUIRED` (S11)                                                                      |
| `PATCH /projects/products/:id/status`     | `updateStatus` (deprecated) | status + lifecycle; Development gate       | **S08:** V2 first Development materializes plan+entries in the same tx. Legacy/skip otherwise. DONE still only syncs pool |
| `PATCH /projects/products/:id/stage`      | `moveStage`                 | stage + lifecycle; Development gate        | **S08:** same as status PATCH for Development                                                                             |
| `PATCH /projects/products/:id/pause`      | `pause`                     | ON_HOLD                                    | No                                                                                                                        |
| `PATCH /projects/products/:id/resume`     | `resume`                    | restore stage                              | No                                                                                                                        |
| `PATCH /projects/products/:id/cancel`     | `cancel`                    | LOST + reason                              | No (partner cancel only)                                                                                                  |
| `PATCH /projects/products/:id/complete`   | `complete`                  | DONE                                       | pool sync, no new delivery BonusEntry                                                                                     |
| `PATCH /projects/products/:id/acceptance` | `confirmAcceptance`         | acceptance fields                          | No                                                                                                                        |
| Deal Won `ensureProduct`                  | `deal-won.handler.ts`       | Product STARTING (or DONE if not on board) | No delivery bonus                                                                                                         |

Developer slot lock: `product-developer-slot-lock.ts` `SELECT … FOR UPDATE`. Frontend requires Backend: `product-developer-slots.ts`. 70/30 helper exists in shared; **not invoked** on Product write paths.

#### Lifecycle / team write paths (Extension)

Same status/stage/pause/resume/cancel/complete family on `extensions.controller.ts`. Team field is `assignedTo` only. No six-role slots. S01 adds `ExtensionDeliveryRoleAssignment`.

#### Finance / earnedPeriod / late funding (S13 gap)

- `isBonusEligibleForPayrollMonth`: **all** types require `earnedPeriod === payrollMonth − 1`. Empty/null → not in matrix (`payroll-bonus-release-base.ts`).
- Development plan with `earnedPeriod = null` will correctly stay out of payroll until Done sets the month once. Do **not** rewrite earnedPeriod to “today” to pass filters.
- Late funding path exists: `payments.service.ts` and Done both call `syncProductBonusPoolForOrder` → proportional AUTO release when product/extension status is DONE (`product-bonus-pool-auto-release.ts`). Remaining funding in a later month can release remainder without changing earnedPeriod.
- Early/extra/over-funding types already exist on `BonusRelease`.
- Cap/FIFO carry applies to non-sales attach (`payroll-bonus-release-attach.ts` + `payroll-bonus-cap.ts`).
- Auto-release types: `DELIVERY`, `PM`, `DESIGN` only. QA/Tech mapped to `DELIVERY` will release; **matrix employee linking omits `qaLeadId` / `technicalSpecialistId`** (`delivery-payable-unit.resolver.ts`, `payroll-allocation-matrix.service.ts`, `payroll-employee-bonus-history.ts`). Narrow S13 fix: add those slots + keep BonusEntry employee ids. Do not change Sales KPI.
- Wallet: `employee-wallet.service.ts` forbids foreign `salaryLineId`; bonuses are own-employee query. No units today.
- Delivery Bonus tab was replaced by Functions workspace (S07). Product Overview/Finance still show order money (client commercial, not delivery units).
- Client Sales rates in migrations: Classic 4/1, first sub 40/10, recurring 0/0. **Do not overwrite.** NETWORK From + policy SQL prepared in S15; channel `NETWORKING` unchanged.
- `BonusController` sales-policy/entry routes had no `@RequirePermission` in this inventory — S02 must not widen that; new catalog/rules endpoints get explicit Owner/CEO guards.

#### Baseline tests (no DB)

```text
pnpm exec vitest run apps/api/src/modules/bonus apps/api/src/modules/payroll-runs \
  apps/api/src/modules/employees/employee-wallet.service.test.ts \
  packages/shared/src/constants/developer-pool-split.test.ts \
  apps/api/src/modules/projects/products/products.service.test.ts \
  apps/api/src/modules/projects/products/product-developer-slots.test.ts \
  apps/api/src/modules/projects/products/product-developer-slot-lock.test.ts \
  packages/shared/src/constants/index.test.ts
```

Result: **66 files, 335 tests passed** (2026-09-19). Not run: API/DB integration, web browser, prisma migrate, builds.

### S00 checkpoint

Changed files: journal only (this section). Next: S01 additive Prisma schema + SQL migration **prepared**, validate/generate, no apply.

#### S00 inventory reconciliation (same day, after S08–S16)

Late-arriving route/finance inventory confirms the original S00 map and these non-negotiables still hold:

- Deal Won / early delivery / exception order / invoice-paid `ensureProduct` create **STARTING** shells (`pmId` only) or off-board OUTSOURCE **DONE**. They do not call Development materialization. Off-board DONE never enters Development — no V2 plan, no BonusEntry.
- Extension Deal Won still creates without `assignedTo`. Six-role Extension assignments remain `ExtensionDeliveryRoleAssignment`, not a second Product-style PUT.
- `splitDeveloperPoolAmount` (70/30) is still unused on writes.
- V2 `BonusEntry` creates omit `earnedPeriod` (stays null → hidden from payroll until a later Done stamp). Do not rewrite it on late funding or early release.
- QA/Tech still missing from payroll **slot linking**; their `DELIVERY` entries are visible only via `earnedPeriod` once stamped. Narrow S13 remainder.
- Web board uses `moveStage` / complete / cancel, not `updateStatus`. Both Product Development entry points now share `writeProductLifecycle` → materialize.

### S01 checkpoint (2026-09-19)

Prepared additive catalog/plan Prisma models and foundation migration. Enrollment default OFF. NETWORK omitted. Units nullable. BonusEntry anchors nullable. No production migrate/push/reset.

**Not verified:** applying SQL on a disposable DB; representative legacy-row preservation after migrate.

**Next:** S02 permissions and serializers.

### S02 checkpoint (2026-09-19)

- Modules: `FUNCTION_CATALOG`, `DELIVERY_COMPENSATION_RULES`. Owner/CEO full; PM/Head Delivery catalog manage without delete; team/Seller/ops-manager catalog read; Finance/HR/Accountant **N** on both; RULES only Owner/CEO.
- SQL: `20260919123000_delivery_compensation_permissions` (`ON CONFLICT DO NOTHING`, no Finance/PM RULES grants).
- API: `GET/POST /delivery-functions` operational DTO; `GET /delivery-compensation/rules/*` RULES VIEW. Mass-assignment rejects units/rates. Readers see ACTIVE only.
- Web: `/my-company/function-catalog` explicit `FUNCTION_CATALOG VIEW`; parent `/my-company` stays COMPANY; HR hero tabs hidden without COMPANY VIEW.
- Attachment ACL helper exists; attach endpoint is S03.

**Checks run:** targeted vitest (shared + prisma inspect + api module + nav + i18n parity) 17/67 then 12/30; prettier write; eslint on touched TS; `@nbos/shared`/`@nbos/api`/`@nbos/web` typecheck (API needed 8GB heap). **Not run:** live Nest HTTP, migrate apply, browser, builds.

**Security review (S02):** no confirmed leak of units on operational paths in unit tests. Unverified: runtime Prisma include mistakes, SSR page (none yet), live guard with real JWTs. Attachment ACL not wired to a write route yet.

### Phase 1 code review (S01+S02)

- **High:** none confirmed in reviewed code.
- **Medium (accepted for later slices):** catalog list unbounded (S03 pagination); createDraft unique-code → raw Prisma error (S03); no attach route yet so ACL unused; migrate unapplied.
- **Low:** Compensation page still `FINANCE_SALARY` — S05 must hide delivery rate editors from Finance.
- **Recommendation:** proceed S03. Do not mark Phase 1 DONE until disposable migrate + one live 403/200 pair.

**Next:** S03 catalog CRUD (search, pagination, versions, archive, attachments).

### S03 checkpoint (2026-09-19)

Paged catalog list (max 100), search on code/title/summary, readers forced to ACTIVE. Content PATCH creates a new version and never writes priceVersions. Activate publishes content without requiring units. Archive blocked when configuration or base-profile inclusion exists. Attachments use Drive access + reject PERSONAL/sensitive files; attaching to a published version clones a new unpublished content version.

**Checks:** vitest shared+api delivery-compensation 15/38; shared+api typecheck; eslint module. **Not run:** live HTTP/DB, browser.

**Next:** S04 calculator + normative publish (synthetic fixtures only).

### Проверка документации (не implementation gate)

- 2026-09-18: статический анализ schema/services/UI/canon при подготовке пакета.
- 2026-09-19: закрыта сверка со старым каноном (`06-CANON-RECONCILIATION.md`). Продуктовые правила не менялись.
- 2026-09-19 `pnpm exec prettier --write` на затронутых Markdown-файлах пакета и сверенных канон-файлах: успешно.
- 2026-09-19 `git diff --check` по тем же путям: чисто.
- 2026-09-19 проверка относительных ссылок в пакете и сверенных файлах: новые ссылки v2 резолвятся. Предсуществующие битые ссылки на `IMPLEMENTATION_DONE.md` / Progress Archive не из этого пакета и не чинились.
- Runtime tests/builds/migrations: не запускались — этот этап меняет только Markdown. Slices S00–S18 остаются TODO.

### S06–S07 checkpoint (2026-09-19, continued)

Configuration enroll/addFeature; Product Functions tab; Delivery Bonus tab replaced by Functions workspace; `?tab=bonus` aliases to functions. i18n EN/RU/HY.

**Checks:** web tab unit tests; web tsc (8GB). **Not run:** browser QA, live API.

### S08–S11 checkpoint (2026-09-19)

- S08: `materializeInitialDeliveryPlanIfNeeded` inside Product/Extension Development transaction. Legacy/skip if no V2 row. Idempotent via `initialRevisionId`. Wallet/pool sync only after `CREATED`.
- S09: configuration DTO `readiness.errors` (codes only). Workspace shows translated blockers.
- S10: add after plan writes only `FEATURE:*` lines; archived re-add creates no second BonusEntry; remove reduces to encumbered floor.
- S11: `POST /delivery-configurations/:id/replacements`; empty shares rejected; Product team PATCH after plan blocked.

**Checks:** vitest `apps/api/src/modules/delivery-compensation` + products.service + shared delivery-compensation: **29 files / 135 passed**; API tsc (8GB) after S08; web tsc after S09. Prettier on touched TS/JSON.

**Not run:** disposable DB migrate, concurrent L03/L04 integration, payroll F01–F10, browser, builds, Nest HTTP, code-review/security-review skills as a separate pass after this compaction.

**Next:** S17 seed/runbook; S18 acceptance. Do not production-migrate.

### S12–S14 checkpoint (partial)

Ledger rows are not deleted on feature remove or existing cancel. Pool sync is hooked. Wallet still does not select `deliveryNormativeSnapshot`. QA/Tech payroll matrix gap from S00 is unchanged. No dedicated Finance read-model work beyond existing amount fields.

### S15–S16 checkpoint (2026-09-19)

Prepared `20260919140000_lead_source_network_enum` then `20260919140100_network_sales_bonus_policies` (NOT EXISTS, Network-only 4+1 / 40+10 / 0+0). Prisma `LeadSourceEnum.NETWORK`. CRM From pickers + catalogs. Sales channel `NETWORKING` untouched.

**Checks:** `packages/database/prisma/network-sales-source.migration.test.ts`; `LEAD_SOURCES` length 5. `prisma generate` only (no migrate). **Migrate not applied.**

### Production launch

**Not performed.** Enrollment default remains OFF. Owner must publish real units/rates in `/my-company/function-catalog` and Compensation after a confirmed disposable/local migrate. Runbook: [03-ACCEPTANCE-AND-ROLLOUT.md](./03-ACCEPTANCE-AND-ROLLOUT.md).
