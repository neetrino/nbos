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

| Slice | Статус                   | Evidence / проверки / blockers                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S00   | DONE                     | 2026-09-19 commit `240cceb6b` branch `sipan`, dirty empty. Baseline tests 66 files / 335 passed. Neon target **not** treated as disposable — migrate not run. See appendix.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| S01   | IMPLEMENTED_NOT_VERIFIED | Additive Prisma + foundation SQL. **2026-09-19 applied via `migrate deploy` to `.env.local` Neon `nameless-term` (dev, not PROD `sweet-dew`).** No reset.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| S02   | IMPLEMENTED_NOT_VERIFIED | Permissions + operational/financial serializers + guarded endpoints. Unit tests 17 files / 67 passed (+ later 12/30 module re-run). Shared/API/web typecheck passed. No live HTTP/DB.                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| S03   | IMPLEMENTED_NOT_VERIFIED | Catalog pagination/search, content versions, activate without units, archive-if-unused, FileAsset attach+ACL. Tests 15 files / 38. API typecheck passed. No live DB.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| S04   | IMPLEMENTED_NOT_VERIFIED | Pure calculator C01–C10 on synthetic fixtures; share split keeps 10.01; publish blocks null units; role rates reject employeeId. Shared+module tests 18/52 then 10/48 with UI. No live publish.                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| S05   | IMPLEMENTED_NOT_VERIFIED | `/my-company/function-catalog` grid/sheet/draft form; pricing panel and Compensation rates only if RULES VIEW. i18n EN/RU/HY. Web typecheck passed. **Browser QA not run** (no local app).                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| S06   | IMPLEMENTED_NOT_VERIFIED | Enroll gated by readiness switch; implicit LEGACY; add ACTIVE features; included vs extra. 2026-09-20: extension enroll, `by-extension` read and extension role assignments added; assignments refused once the plan is materialized. 2026-09-21: object-scope closed — every configuration route now narrows to the caller's access to the underlying Product. Copy-from is not missing work: the Owner cancelled it on 2026-09-19 (07-OWNER-DISCUSSION §6). No live DB.                                                                                                                                                                                           |
| S07   | IMPLEMENTED_NOT_VERIFIED | Product `?tab=functions` (+ `bonus` alias); Delivery sheet Bonus tab replaced. Shared Functions workspace, no money in DOM. **Browser QA not run.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| S08   | IMPLEMENTED_NOT_VERIFIED | First Development materializes plan+BonusEntry in the same transaction as stage write (Product/Extension, moveStage + status PATCH). Starting/legacy skip. Retry uses initialRevisionId. No live DB.                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| S09   | IMPLEMENTED_NOT_VERIFIED | Operational readiness codes on configuration GET; Functions workspace shows safe blockers. No units in messages. **Browser QA not run.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| S10   | IMPLEMENTED_NOT_VERIFIED | Post-plan add creates only new feature components; re-add restores identity; remove archives and reduces to encumbered floor. expectedRevision 409. No live concurrency test.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| S11   | IMPLEMENTED_NOT_VERIFIED | 2026-09-20: operational `GET :id/replacement-plan?roleKey` (EDIT, no money) + replacement dialog on the Functions workspace; percents start empty, submit blocked until every pair is valid, 409 reloads the plan. **Fixed during review:** the server demanded percents for every component of the role, so a role split across people after an earlier replacement could not be replaced at all — now only components the outgoing employee holds are required, and holding none returns `ROLE_ASSIGNMENT_REQUIRED`. No browser QA.                                                                                                                               |
| S12   | IMPLEMENTED_NOT_VERIFIED | 2026-09-20: `assert-delivery-open.ts` locks addFeature / removeFeature / replaceEmployee / extension role assignments once the product or extension is DONE or LOST (`FINANCIAL_ALLOCATION_LOCKED`). **Fixed during review:** the check now runs inside the write transaction after the configuration row lock, and every terminal close (stage move, `complete`, `cancel`, for products and extensions) takes the same lock, so a close and a scope change cannot interleave. Archive paths still keep BonusEntry/ledger. Base profile archive still only via publishing a newer version.                                                                          |
| S13   | IMPLEMENTED_NOT_VERIFIED | 2026-09-20: QA/Tech gap closed — `DELIVERY_ROLE_PRODUCT_SELECT` + `linkedEmployeeIdsForUnit` / `holdsDeliveryRole` cover all six roles in matrix, resolver and employee bonus history; inline duplication removed. earnedPeriod stamped once at first Done (`stamp-delivery-earned-period.ts`). **Fixed during review:** stamping now runs inside the transaction that writes Done on every path, so a failure cannot leave a closed delivery without a payroll month; pool sync stays after commit. Done gate no longer re-checks a materialized plan against today's published norms, and checks only `EXTRA` features. No payroll integration test on a live DB. |
| S14   | IMPLEMENTED_NOT_VERIFIED | 2026-09-20: wallet rows carry `deliveryRoleKey` for V2 accruals only (`wallet-delivery-normative-label.ts`); pipeline shows the role. **Reverted during review:** `deliveryUnits` was removed from the DTO, serializer and UI — canon §11 keeps units and rates out of the employee API, and amount plus units reveals the role rate. Own-employee query unchanged. CSV export without units.                                                                                                                                                                                                                                                                       |
| S15   | IMPLEMENTED_NOT_VERIFIED | Additive `NETWORK` enum + idempotent policy SQL 4+1 / 40+10 / 0+0 prepared. **Migrate not applied.** Other Sales sources not updated.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| S16   | IMPLEMENTED_NOT_VERIFIED | Lead/Deal From pickers and EN/RU/HY catalogs include Network. Sales channel NETWORKING unchanged. Accrual uses existing policy lookup. No browser QA.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| S17   | IMPLEMENTED_NOT_VERIFIED | 2026-09-20: enrollment switch API (`GET`/`POST /delivery-compensation/rules/enrollment`, RULES VIEW/EDIT) + switch UI on the norms screen; idempotent dry-run-first seed `pnpm seed:delivery-catalog`; runbook `11-OPERATOR-RUNBOOK.md`. Default stays OFF. Seed **not** run against any database.                                                                                                                                                                                                                                                                                                                                                                  |
| S18   | TODO                     | Full acceptance checklist, phase reviews after S17, production rollout **not** done.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

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

### Review gate (2026-09-20)

Cross-family money-path review, then a bug review and a security review of the branch diff. Four
money findings and two lifecycle findings were fixed rather than accepted:

- earned-period stamping moved inside the Done transaction on all four close paths (product and
  extension stage move, `complete`, `cancel`); bonus-pool sync stays after commit.
- closed-delivery checks moved inside the write transactions, behind the configuration row lock, and
  every terminal close takes that same lock.
- the Done gate stopped blocking materialized plans whose frozen norm version was archived by a
  successor, and stopped demanding prices for included-in-base functions.
- `deliveryUnits` removed from the employee wallet DTO, serializer, UI and locales, per canon §11.

Security review found no medium-or-higher issue: every new endpoint carries an explicit permission,
operational serializers keep the financial-leak guard, and the wallet returns no units or rates.

**Checks:** vitest `apps/api/src/modules/{delivery-compensation,projects,employees,payroll-runs}`
(526 passed) plus web finance/account suites (485 passed); API and web `tsc --noEmit` (8GB); Prettier
on touched files. **Not run:** live database, migrations, browser QA.

**Known rule debt:** `products.service.ts` (994 lines) and `extensions.service.ts` (711 lines)
exceed the 300-line limit. Both were already over before this work; splitting them is a separate
refactor outside the delivery-compensation scope.

### S15–S16 checkpoint (2026-09-19)

Prepared `20260919140000_lead_source_network_enum` then `20260919140100_network_sales_bonus_policies` (NOT EXISTS, Network-only 4+1 / 40+10 / 0+0). Prisma `LeadSourceEnum.NETWORK`. CRM From pickers + catalogs. Sales channel `NETWORKING` untouched.

**Checks:** `packages/database/prisma/network-sales-source.migration.test.ts`; `LEAD_SOURCES` length 5. `prisma generate` only (no migrate). **Migrate not applied.**

### Dev database is live (2026-09-20)

Owner instruction: always migrate and work against the connected **dev** host; production is a
separate step at the end. Applied `20260920150000_delivery_core_items_and_size_presets` to dev
(`ep-nameless-term`, not PROD `ep-sweet-dew`) with `migrate deploy`; 275 migrations, schema up to
date. Seeded the catalog on dev: **209 draft functions in 18 categories, 209 draft price versions,
nothing ACTIVE and nothing PUBLISHED**, author = Owner employee id.

`pnpm seed:delivery-catalog` previously could not resolve `@nbos/database` from `scripts/`, because
`scripts/` is not a workspace package. Fixed by linking the two workspace packages into the root
dev dependencies.

### Scope freeze at first close (2026-09-21) — `IMPLEMENTED_NOT_VERIFIED`

Decision 1.11. A closed card may be reopened for work, but its scope and money stay frozen; paid
follow-up work goes through an Extension. The guard could not key off the current status, because a
reopened card is `DEVELOPMENT` again and would hand its money back to editing.

- `DeliveryConfiguration.scopeLockedAt`, stamped once on every product and extension close path
  (stage move, status write, `complete`, `cancel`) and never moved, so a second close cannot re-date
  the freeze. Migration `20260921100000_delivery_configuration_scope_lock` backfills cards that were
  already `DONE` or `LOST`, applied to **dev** (`ep-nameless-term`).
- `assertDeliveryOpenForConfiguration` and `assertDeliveryOpenForExtension` read the stamp, falling
  back to status only for an extension that is not enrolled and therefore has no configuration row.
- Enrollment now refuses a card that was ever closed. A card closed **before** it was enrolled has
  no configuration row to stamp, so the card's own closure markers are the only evidence — and no
  single marker survives every path: status and `deliveryResolution` are cleared by a reopen, while
  `closedAt` is written only by `complete` and `cancel`. All three are checked together. This also
  covers the off-board product `deal-won.handler.ts` creates already `DONE`.

Review by a second model found both gaps above before commit; the enrollment refusal is the fix.

**Known follow-up:** a future reopen path must preserve a permanent closure marker on the card. The
three-marker check is complete for every close this codebase performs today, but a close reached by
stage move alone writes no `closedAt`, so a reopen from that state would clear the only evidence.

**Checks:** vitest `apps/api/src/modules/{delivery-compensation,projects}` + `scripts/delivery-profiles`
(345 passed); API `tsc --noEmit` (8GB); Prettier on touched files; every file back under 300 lines
(`delivery-configuration.service.ts` was already at 304 before this slice — enrollment inserts moved
to `insert-delivery-enrollment.ts`). **Not run:** browser QA, live end-to-end close/reopen on dev.

### Draft core profiles for the first five product kinds (2026-09-21) — `IMPLEMENTED_NOT_VERIFIED`

Shop, company site, landing, CRM and mobile app: core composition, a per-role unit proposal, the
cards the core already pays for, and a module preset per size. 25 profile versions (five kinds ×
five sizes), all `DRAFT` — a draft pays nobody and cannot be selected, so the numbers stay a
proposal until the Owner publishes them in the norms screen. Applied to **dev**.

Review by a second model caught paid presets charging for work the core already promised, and all
of it was corrected before commit:

- analytics left the shop, company site and landing cores: `INT_WEB_ANALYTICS` starts at installing
  the counter, so a core line about "connecting analytics" meant paying twice for the same work;
- store publishing left the mobile core for the same reason — `MOB_STORE_PUBLISHING` covers accounts,
  signing and review for the first store too, so the core now promises a release build and says in
  its own note that publishing is a separate module;
- `INT_WEB_ANALYTICS` left the mobile presets: it is a browser card (GA, Tag Manager, cookies,
  e-commerce events), and mobile crash/product analytics stays unsold per decision 1.16.

A profile version and its size preset are written in one transaction. They are separate models and
a rerun matches on the profile key alone, so a version left behind without its preset would be
reported as already present and never repaired.

`--replace-drafts` corrects seeded content while it is still a proposal; the plan refuses any key
that is published or that a configuration has frozen, so it cannot reach a norm somebody is being
paid against. The 25 rows seeded earlier the same day carried the pre-review content and were
replaced through this path after confirming all of them were `DRAFT` and unreferenced.

**Checks:** vitest `scripts/delivery-profiles` (12 passed); dry run, apply and a second dry run
against dev, the last reporting 25 kept and nothing written; Prettier `--check`; every file under
300 lines. **Not run:** browser QA of the norms screen against the new profiles; the unit
proposals themselves are unvalidated by the Owner.

### Object-level access on configurations (2026-09-21) — `IMPLEMENTED_NOT_VERIFIED`

Canon §16: an actor "manages their configuration within the bounds of their access to the Product".
Until now only half of that was wired. `PermissionGuard` checks that `PROJECTS_VIEW` / `PROJECTS_EDIT`
is not `NONE` and treats `OWN`, `DEPARTMENT` and `ALL` alike, and no configuration route looked at
the record id. A developer or designer, whose seeded `PROJECTS_EDIT` is `OWN`, could therefore enroll
a card, add or remove paid features, confirm parameters and replace assignees on **any** delivery in
the company by supplying its UUID — the commands that decide who gets paid.

`delivery-configuration-access.ts` resolves the caller against the same product-participation graph
Tasks, Expenses, Client Services and Drive already use (`buildProductParticipationWhere`). All
eleven routes pass it: `ALL` keeps its company-wide meaning and skips the row filter, `DEPARTMENT`
widens to the colleagues of the departments that actually granted it, and anything narrower stays on
the caller's own cards. Denials answer `404`, as elsewhere, so a probe cannot confirm that an id
exists. An extension reaches its team through its assignee or its parent product.

The scope consulted is the scope of the action the route required, so a caller with `VIEW: ALL` and
`EDIT: OWN` is company-wide on reads and narrow on money commands.

**Follow-up, now closed:** the matrix half of this was settled the same day — see the next entry.

Security review found no medium-or-higher issue: all eleven routes are covered, the `ALL` bypass and
the grant-scoped `DEPARTMENT` expansion match the other modules, and denials do not leak existence.

**Checks:** vitest `apps/api/src/modules/{delivery-compensation,projects,common}` (458 passed, 6
skipped); API `tsc --noEmit` (8GB); Prettier on touched files; every file under 300 lines.
**Not run:** live HTTP probe on dev with a narrow-scope account, browser QA.

### The configurator gets a permission of its own (2026-09-21) — `IMPLEMENTED_NOT_VERIFIED`

Object scope answered _which cards_; this answers _whether at all_. The configurator rode on
`PROJECTS_EDIT`, which delivery specialists hold at `OWN` because that same permission carries
domains, technical data and the WhatsApp integration — 19 routes they need for ordinary work. So
narrowing them out of `PROJECTS` was never an option, and on their own cards they could still change
scope, name role holders and replace assignees. Canon §12 already speaks of "the configuration
right" apart from being a PM, so it becomes a module.

`DELIVERY_CONFIGURATION` is registered exactly the way `FUNCTION_CATALOG` and
`DELIVERY_COMPENSATION_RULES` were, through migration `20260921140000_delivery_configuration_permissions`
plus `MODULES` and the role matrices. Nothing bespoke: the Settings → Roles matrix is built from
`GET /permissions`, so the row and its NONE/OWN/DEPARTMENT/ALL selectors appear on their own. All
four actions exist as on every other module; only VIEW and EDIT gate an endpoint, ADD and DELETE are
reserved.

Defaults keep every existing read and remove only the edit. VIEW mirrors the `PROJECTS_VIEW` scope
each role already had — delivery specialists `OWN`, Finance Director, Head of Support and Operations
Manager `ALL`. EDIT goes to Owner, CEO, PM and Head of Delivery, and to nobody else. Verified on dev
after `migrate deploy`: four permission rows, EDIT on exactly those four roles, `VIEW: OWN` on the
six specialist roles. Grants use `ON CONFLICT DO NOTHING`, so a scope an administrator already tuned
is never overwritten.

**Deploy this migration before the code.** In that order the old `PROJECTS` gate stays live for a
moment; in the other order every configuration route denies everyone, including reads, until the
grants land. Neither order widens anything.

**Still open for the Owner:** a PM may name themselves as the PM role holder or take a share in a
replacement, and that is legitimate — PM is one of the six compensated roles, so a blanket refusal
would break the normal case. `applyEmployeeReplacement` refuses only `from === to`. Agreed direction
is to surface these in the audit trail for the Owner rather than block them; not built yet.

Review caught the role match being half dead: the fallback branch spelled slugs `'role-owner'`,
while `roles.slug` holds the bare `owner`. On dev the id branch carried every grant, so nothing was
mis-granted, but a database with generated role ids would have received none. Slugs now match the
column, and the migration test asserts it against the spelling `20260919123000` already used.

**Checks:** vitest `packages/database/prisma`, `packages/shared`,
`apps/api/src/modules/delivery-compensation` (651 passed, then 193 re-run after the slug fix); API
and web `tsc --noEmit` (8GB); Prettier on touched files; migration applied to **dev** and the
resulting grants read back; guard metadata asserted on all eleven routes, not a sample.
**Not run:** browser QA of the Settings → Roles row, live HTTP probe under a specialist account.

### Product platform axis WEB / APP / DESKTOP (2026-09-21) — `IMPLEMENTED_NOT_VERIFIED` `15dc34958`

`productType` mixed kind with where the product runs, so a deal could not say "online shop + app".
`productPlatform` is a new field on Deal and Product: WEB, APP, DESKTOP. The Owner named it APP, not
MOBILE_APP. It does not enter the base-profile key and does not change units. WordPress and Shopify
are WEB-only. Marketing later stores NULL (see 2026-09-21 platform-applies slice). Code may be any
of the three.

Migration `20260921163000_product_platform` adds the enum and columns, backfills legacy
`product_type = MOBILE_APP` to APP, and leaves other **typed** rows on WEB. Deals with no
`product_type` stay `NULL` — platform is only meaningful with taxonomy. Existing `MOBILE_APP` /
`WEB_APP` kinds are not rewritten — the Owner still sets a real kind by hand. Won copies the
platform onto the new product. SEND_OFFER requires it for PRODUCT/OUTSOURCE the same way it
requires type.

The type list itself is not expanded in this slice.

**Checks:** vitest 14 files / 129 passed (shared coerce, migration SQL, product create/update,
deal write, SEND_OFFER including OUTSOURCE, Won copy); shared + API + web `tsc --noEmit` (API/web
8GB after prisma generate); Prettier. Review: clearing only `productCategory` no longer keeps APP;
untyped legacy deals stay `NULL` on purpose.
**Not run:** browser QA of the deal sheet and product create dialog. Production migrate not run.

### Sale price: AMD per unit, no multiplier (2026-09-21) — `IMPLEMENTED_NOT_VERIFIED` `647d12b2e`

Decision 1.12 withdrawn the 2026-09-20 multiplier + fixed-amount pair. A card now carries one
AMD-per-unit sale rate; empty uses the global default 10 000. The client line is `units × that
rate`. Cost and the developer rate are not inputs.

- `DeliverySalePriceVersion.amountPerUnit`, `defaultSaleAmountPerUnit`. Migration
  `20260921180000_sale_amount_per_unit` backfills `multiplier * 1000` (1 development unit = 1 000
  AMD). Leftover fixed-only rows received 10 000 so the column can be required — Owner re-enters
  those rare drafts. Applied to **dev**. Production migrate not run.
- `GET`/`POST sale-prices/default-unit-price`. DTO: `amountPerUnit` only with RULES VIEW, so catalog
  VIEW cannot recover units by dividing `resolvedAmount`. `resolvedAmount` uses published units only.
- Norms editor: one AMD field. Catalog cards read `resolvedAmount`. Constructor still not built.

Review: catalog VIEW leaking units via rate ÷ amount — fixed before commit. Draft units no longer
price a published card. Validation on write routes now maps to 400.

**Checks:** vitest 6 files / 43 passed; shared + API + web `tsc --noEmit` (API/web 8GB after prisma
generate); Prettier on touched files; migrate deploy on **dev**.
**Not run:** browser QA of the norms screen (API process was down after generate); production migrate.

### Size off, named collections, deal constructor (2026-09-21) — `IMPLEMENTED_NOT_VERIFIED`

Decision 1.18. `configSize` is not a product and not a core price. One kind, one core (former
CLASSIC units). Size presets deleted. Named collections replace the extra-function selection
(replace, not union). Deal quote stores the draft until Won; sale-price quote does not overwrite
the deal amount. Public vitrine remains stage 3 — planned, not in this wave.

**Landed:** migration `20260921190000_delivery_size_off_collections`; matching without size;
collections + deal-quote API; norms UI without size chips; seed 5 cores + named kits; Deal
constructor block; extras copy on V2 enroll.

**Checks:** `pnpm --filter @nbos/database generate`; shared/API/web `tsc --noEmit` (API/web 8GB);
Prettier on touched TS/JSON; targeted vitest 19 files / 86 passed.
**Not run:** live migrate, seed against a live DB, browser QA, production.

### Cores leftover wipe + four enum kinds (2026-09-21) — `IMPLEMENTED_NOT_VERIFIED`

Dead `configSize` / `configSizes` keys removed from hr.json (en/ru/hy). Seed kits renamed
`BASE` / `EXTENDED` / `FULL` (Базовый / Расширенный / Полный). `classicUnits` → `units`.
Four DRAFT cores added for existing enum: `BUSINESS_CARD_WEBSITE`, `WEB_APP`, `ERP`, `SAAS`.
Nine kinds total. OTHER and marketing not seeded. `retiredSizedProfileKeys` kept for other envs.

Dev `ep-nameless-term` already had the five unsized cores and no size axis (other-chat evidence,
2026-09-21). **2026-09-21 later:** `pnpm seed:delivery-profiles -- --apply` created the four missing
DRAFT cores (`business-card-code`, `web-app-code`, `erp-code`, `saas-code`). Read-back: 9 keys.

**Checks:** targeted vitest profile seed + `base-profile-label`; Prettier on touched files;
`--apply` on live dev; 9 profile rows read back.
**Not run:** browser QA; production migrate.

### Extension.size three values (2026-09-21) — `IMPLEMENTED_NOT_VERIFIED`

`ExtensionSizeEnum` is `SMALL` / `STANDARD` / `LARGE`. Migration remaps `MICRO→SMALL`,
`MEDIUM→STANDARD` on `extensions` and checklist `filter_extension_size`. Demo seed and Won-deal
auto-create use the new values. Catalog `configSize` axis stays gone.

**Checks:** Prisma generate; migrate deploy on dev `ep-nameless-term` (`20260921200000_extension_three_sizes`);
enum is SMALL/STANDARD/LARGE; demo rows remapped.
**Not run:** production migrate; browser QA.

### Platform applies + hide Mobile App type (2026-09-21) — `IMPLEMENTED_NOT_VERIFIED`

Platform field only for Code (WEB/APP/DESKTOP) and WordPress/Shopify (WEB). Marketing and Other store
`NULL`; the UI hides the field; SEND_OFFER does not require it. Product.productPlatform is optional.
`MOBILE_APP` remains in `ProductTypeEnum` and in labels, but is not offered on new Code picks
(legacy current value still appears). App Store slot is added when `productPlatform === APP` (legacy
`MOBILE_APP` type still qualifies). Won copies null onto a marketing product instead of WEB.

Migration `20260921210000_product_platform_nullable_marketing` applied to **dev**
`ep-nameless-term` (2026-09-21). Column `products.product_platform` is nullable, default stays WEB.
Read-back: 9 MARKETING + 94 OTHER products `NULL`; CODE 30 WEB; WordPress 44 WEB; Shopify 2 WEB.
Marketing deals with a platform: 0.

**Checks:** vitest 14 files / 140 passed (shared coerce/gate/slots, migration SQL, product write,
Won, deal write, product create, SEND_OFFER); Prettier; `pnpm --filter @nbos/database generate`;
shared + database + API + web `tsc --noEmit` (API/web 8GB); migrate deploy on dev.
**Not run:** browser QA of deal sheet / create product / planning; production migrate.

### Sale price always stored, no implicit default (2026-09-21) — `IMPLEMENTED_NOT_VERIFIED` `2231f2ba6`

Decision 1.12 withdrawn the implicit “empty = 10 000” fallback. A card has a client amount only when
a sale version stores `amountPerUnit`. `resolveSalePrice` returns `CARD` or `UNKNOWN`. Column
`defaultSaleAmountPerUnit` dropped (`20260921220000_drop_default_sale_amount`). Default-unit-price
API and the norms form are gone. New drafts still require a number. Seed
`pnpm seed:delivery-sale-prices` publishes 10 000 (AI 20 000) per function, KEEP if any version
exists. Catalog still shows AMD only from `resolvedAmount` after **units** are published — this slice
does not publish units.

**Checks:** vitest 6 files / 28 passed (shared resolver, drop-migration SQL, sale-prices service,
default-endpoint removed, seed plan); Prettier; prisma generate + migrate deploy on **dev**;
shared + API + web `tsc --noEmit` (API/web 8GB). Review: no confirmed defects. Browser: Sale
prices tab has no default-10 000 block; empty amount on a selected function is refused.
Seed `--apply` on **dev** (2026-09-21): 205 PUBLISHED function rates (195 × 10 000, 10 AI × 20 000),
author Sipan / Owner. Re-run KEEP. Units stay DRAFT — catalog AMD still waits on published units.
**Not run:** production migrate.

### Code type list by platform (2026-09-21) — `IMPLEMENTED_NOT_VERIFIED`

Decision 1.22. New Code picks are filtered by `productPlatform`. Sites only on WEB. APP and DESKTOP
offer ECOMMERCE, CRM, ERP, SAAS, WEB_APP. `WEB_APP` remains a kind on all three platforms.
`MOBILE_APP` stays in the enum for legacy cards and is not offered; `mobile-app-code` is hidden on
the norms screen and retired from the profile seed when unused. WordPress/Shopify/Marketing type
lists are unchanged. One shared matrix in `@nbos/shared` (`listedProductTypesForPicker` /
`product-platform`); Deal, Create Product and delivery planning consume it. Duplicate
`PRODUCT_TYPES_BY_CATEGORY` copies in web constants were removed. Changing platform resets a type
that is not allowed. SEND_OFFER and Product/Deal create/update reject an illegal pair. No new
`ProductTypeEnum` values in this slice.

**Checks:** vitest 12 files / 114 passed (shared matrix/picker/gate, product create/update taxonomy,
deal write, SEND_OFFER, Deal form, CreateProduct field order, norms grouping, profile seed retire);
shared + API + web `tsc --noEmit` (API/web 8GB); Prettier on touched TS/MD. Independent review:
Code pickers no longer force-add `OTHER`. Planning save with a cleared type stays a no-op so the
server is not sent APP + leftover site (400).
**Not run:** browser QA of Deal Code WEB vs APP/DESKTOP (agent browser had a session but the deals
board did not load — `/api/me` 503 at the time); seed `--apply` not run (no new cores; unused
`mobile-app-code` draft retires on the next apply); production migrate.

### Code kinds 1.23 + extra functions (2026-09-21) — `IMPLEMENTED_NOT_VERIFIED`

Decision 1.23. `ProductTypeEnum` expanded with 21 Code directions (29 offered kinds total).
`MOBILE_APP` and `SAAS` stay in the enum for legacy cards and stay hidden from new picks. One
unsized core per offered kind. Extra catalog cards: LMS (5), marketplace (3), POS (3), ticketing
(2), plus category `learning`. `CNT_MULTILINGUAL` tiers remap onto the new kinds. Seed units are
the existing proposals (sale 10 000 / AI 20 000). Hover-help on the Deal picker is not in this
slice; Deal type labels use i18n so the new kinds are readable.

Migration `20260921230000_product_type_kinds` (ADD VALUE only). Seeds: catalog `--apply
--update-tiers`, profiles `--apply --replace-drafts`, sale prices `--apply`, then
`publish:delivery-dev --apply` on **dev** `ep-nameless-term` only. Scripts refuse `sweet-dew`.

**Checks:** targeted vitest (taxonomy, catalog, profile seed, grouping, assert-dev-host); Prisma
generate; Prettier on touched files.
**Live on `ep-nameless-term` (2026-09-21):** migrate `20260921230000_product_type_kinds`; catalog
`--apply --update-tiers` (13 extra cards, 22 tier mappings); profiles `--apply --replace-drafts`
(22 create, 7 replace, retire `mobile-app-code`/`saas-code`); sale prices 13 × 10 000; migrate
`20260921240000_price_one_published_per_tier` (one published vector per gradation); publish
activated remaining cards, published leftover unit drafts, **29 cores PUBLISHED**, upserted 38
`PRODUCT_TYPE` list options.
**Not run:** production migrate; browser QA of Deal picker and catalog rail.

### Production launch

**Not performed.** Enrollment default remains OFF. Owner must publish real units/rates in `/my-company/function-catalog` and Compensation after a confirmed disposable/local migrate. Runbook: [03-ACCEPTANCE-AND-ROLLOUT.md](./03-ACCEPTANCE-AND-ROLLOUT.md).
