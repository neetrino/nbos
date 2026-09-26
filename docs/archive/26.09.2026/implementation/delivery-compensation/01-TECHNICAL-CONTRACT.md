# Delivery Compensation v2 — технический контракт

Статус: целевая архитектура для реализации в существующем modular monolith. [Бизнес-правила](../../NBOS/03-Business-Logic/11-Delivery-Compensation-Configurator.md) имеют приоритет над примерными именами новых классов/таблиц в этом документе.

## 1. Проверенная исходная реализация

Пути ниже относятся к корню репозитория и проверены при подготовке 2026-09-18. Перед правками перечитать текущую ветку.

| Область           | Реализация и значение                                                                                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product/Extension | `packages/database/prisma/schema/project-product.prisma`: Product имеет 6 delivery slots + seller, Extension только `assignedTo`; оба имеют `deliveryStage`, work status и resolution |
| Development       | `apps/api/src/modules/projects/products/products.service.ts`: `updateStatus` и `moveStage`, development gate; аналогичный сервис Extensions                                           |
| Developer slots   | `product-developer-slots.ts`, `product-developer-slot-lock.ts`: есть проверка Frontend requires Backend и row lock                                                                    |
| Старый split      | `packages/shared/src/constants/developer-pool-split.ts`: helper 70/30; его наличие не доказывает, что все delivery-entry уже создаются автоматически                                  |
| Finance schema    | `packages/database/prisma/schema/finance.prisma`: BonusEntry, BonusRelease, pool, SalaryLine, PayrollRun, Expenses                                                                    |
| Compensation      | `packages/database/prisma/schema/compensation.prisma`: base salary, KPI policy; не превращать этот профиль в каталог функций                                                          |
| Pool              | `apps/api/src/modules/bonus/product-bonus-pool-sync.ts`, `product-bonus-pool-auto-release.ts`: Done + полученные деньги, пропорциональный release                                     |
| Bonus types       | `product-bonus-pool.constants.ts`: auto-release для DELIVERY, PM, DESIGN; отдельного типа TECH/QA сейчас нет                                                                          |
| Payroll attach    | `apps/api/src/modules/payroll-runs/payroll-bonus-release-attach.ts`: cap и carry применяются также к non-sales; нельзя утверждать, что cap существует только для Seller               |
| Earned month      | `payroll-bonus-release-base.ts`: сейчас требует `earnedPeriod = payrollMonth − 1` для всех типов; null не виден в матрице                                                             |
| Wallet            | `apps/api/src/modules/employees/employee-wallet.service.ts` и helpers: read-only projection существующих начислений/выплат                                                            |
| Delivery UI       | `apps/web/src/features/projects/components/delivery-board/DeliveryItemDetailSheet.tsx`, `build-delivery-detail-sheet-tabs.ts`, `DeliveryItemDetailBonusPanel.tsx`                     |
| Product UI        | `apps/web/src/app/(app)/projects/[id]/products/[productId]/page.tsx`                                                                                                                  |
| CRM source        | `crm.prisma`, `packages/shared/src/constants/index.ts`, `apps/web/src/features/crm/constants/leadPipeline.ts`: четыре From; NETWORKING уже есть как Sales channel                     |
| Rates Sales       | `apps/api/src/modules/bonus/sales-bonus-policy.service.ts`, `sales-bonus-accrual.service.ts`; таблица `SalesBonusPolicy`                                                              |

Документы 2026-05 описывают более раннюю модель и не заменяют анализ кода. Особое внимание: optimistic UI и несколько endpoint смены lifecycle/состава команды.

## 2. Границы модулей

- Каталог/базовые профили/тарифы принадлежат My Company / Compensation domain.
- Scope и назначения принадлежат Product/Extension; shared configurator service обслуживает оба.
- Чистый calculator не имеет Prisma/UI зависимостей и принимает уже разрешённые snapshots.
- Материализатор соединяет калькулятор с существующим Bonus domain, не реализует свои releases/payments.
- Finance/Wallet читают BonusEntry/Release/SalaryLine/ExpensePayment, обогащённые ссылкой на источник конфигуратора.
- Использовать существующие auth, effective permissions, audit, Drive и notifications. Новые микросервисы, очереди, облачные сервисы и зависимости не нужны.

## 3. Предлагаемая модель данных

Имена новых таблиц можно адаптировать к соглашениям репозитория; инварианты обязательны. Финансовые версии immutable после публикации. Базовые scalar связи/unique keys не прятать в непрозрачный JSON.

| Сущность                        | Минимальные поля / ограничения                                                                                                                                                                       |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DeliveryFunction                | id, stable unique code, category, iconKey из allowlist, status, author, timestamps; archive вместо удаления используемой функции                                                                     |
| DeliveryFunctionContentVersion  | functionId, version, title, summary, scope boundaries, instructions rich text, acceptance criteria, author, publishedAt; unique(functionId, version)                                                 |
| DeliveryFunctionAttachment      | contentVersionId, existing FileAsset id, caption/order; FK + существующий file ACL                                                                                                                   |
| DeliveryFunctionPriceVersion    | functionId, version, role-unit rows, effectiveFrom, status, publishedBy; единая complete matrix ролей, null запрещён при publish                                                                     |
| DeliveryBaseProfileVersion      | stable profile key, version, entityKind, productType/category, implementationBase, designMode, aiDesignerReview, role-unit rows, description, effectiveFrom/status. `configSize` removed 2026-09-21. |
| DeliveryFunctionCollection      | named extra-function kit per productType; not money; apply replaces the deal quote selection                                                                                                         |
| DeliveryDealQuote               | one draft composition per Deal until Won; sale-price quote is computed, does not overwrite deal amount                                                                                               |
| DeliveryBaseIncludedFunction    | baseProfileVersionId, functionId; unique пары; включённость snapshot-ится, не является формулой baseUnits                                                                                            |
| DeliveryRoleRateVersion         | roleKey, currency=AMD, Decimal rate, effectiveFrom, version/status; единственная опубликованная действующая ставка роли на дату, без employeeId                                                      |
| DeliveryConfiguration           | unique orderId, derived Product/Extension owner, modelVersion/mode, current revision, classification, checkedBy/At, draftVersion; CHECK на корректный owner                                          |
| DeliveryConfigurationFeature    | configurationId, functionId, selected price version для extra, origin INCLUDED/EXTRA, local note, work state; stable identity, архивирование вместо потери истории                                   |
| DeliveryConfigurationRevision   | configurationId, sequence, reason, actor, immutable scope/team/source snapshots, financial effectiveAt; unique(configurationId, sequence)                                                            |
| DeliveryBonusComponent          | stable component key BASE или feature instance + roleKey; normative/rate snapshot, exact amount, originating revision; отдельная роль даже при одном employee                                        |
| DeliveryBonusAllocation         | componentId, employeeId, share, retained/accepted amount, current planned amount, history refs; stable anchor для BonusEntry                                                                         |
| ExtensionDeliveryRoleAssignment | extensionId, roleKey, employeeId; unique(extensionId, roleKey), draft/live API с теми же правилами замены                                                                                            |

Role keys: BACKEND, FRONTEND, PM, DESIGNER, QA, TECHNICAL_SPECIALIST. Product slots остаются source of truth: `developerId`, `frontendDeveloperId`, `pmId`, `designerId`, `qaLeadId`, `technicalSpecialistId`. Не создавать второй независимо редактируемый live-team Product. Snapshot хранит назначения на момент расчёта.

Extension: `assignedTo` сохраняется как existing accountable assignee, не означает автоматически получателя всех бонусов. Создание конфигурации может предложить команду родительского Product, но PM подтверждает её; дальше assignments независимы. Сохранить связанные access/team-sync механизмы и проверку прав, не выдавать роль в проекте одним денежным назначением без существующего разрешённого процесса.

Расширение BonusEntry — additive nullable поля:

- источник `DELIVERY_CONFIGURATOR_V2` против existing legacy/manual/sales;
- FK/unique на delivery allocation anchor (null для старых записей);
- отдельный `deliveryRoleKey` для отображения/группировок, link на configuration/component/revision;
- private calculation snapshot с units, rate, effectiveAt и версиями.

Начальная совместимость типов: Backend/Frontend/QA/Tech → `DELIVERY`, PM → `PM`, Designer → `DESIGN`; роли различаются дополнительным roleKey. Это позволяет сохранить existing release-type allowlist. Не добавлять SALES entry для delivery Seller-slot; Seller остаётся отдельным engine. При необходимости новых enum типов сначала обновить все downstream consumers и тесты; это не обязательная часть v1.

`percent = 0` для units-расчёта, UI не должен показывать фиктивный «0% от заказа». Формула определяется source, не заполнением percent.

## 4. Версии, округление и калькулятор

Calculator input: entity classification, baseProfileVersion, selected features со статусом included/extra, price versions, role rates, role assignments, прежние принятые allocations для изменений. Output: компонентные суммы и диагностические ошибки, не persistence side effects.

Правила:

- all math через Decimal; единая currency; суммы сериализовать строками;
- units/rates допускают дробную точность по утверждённому масштабу (рекомендуется Decimal(14,4)); суммы совместимы с существующими денежными Decimal(12,2), проверять overflow;
- округлять каждую component/role сумму до копеек; totals только сумма округлённых компонент;
- отсутствующие настройки — ошибка, а не default;
- base inclusion не добавляет feature units и не умножается на role rate повторно;
- same-employee roles суммируются только в read projection, не теряют индивидуальных source keys;
- financial effectiveAt задаётся сервером; дата создания первого Development и дата scope-change отдельно;
- опубликованные версии не редактировать на месте, не пересчитывать прошлые проекты;
- запрет overlapping effective versions/однозначный resolver; публикация атомарна и конфликтная при одновременном publish;
- новая функция использует актуальные units/rate, прежние components сохраняют свои цены.

Нормативная роль «не требуется» отличается от неназначенного исполнителя. AI-reviewer меняет выбранный pricing variant явно. Existing frontend/backend assignment constraint не удалять скрытно: сохранить для v1; catalog profiles должны быть совместимы с ним. Если нужен frontend-only продукт без Backend, это отдельное изменение канона, не побочный эффект новой оплаты.

## 5. Транзакционные команды

Все денежно значимые команды используют optimistic expectedRevision, idempotency key и блокировку одного order/configuration (и затронутых allocations/ledger) в согласованном порядке. SQL и isolation подобрать под PostgreSQL/Prisma с concurrent integration tests. Один HTTP retry не создаёт дополнительную ревизию.

### 5.1. Первый Development

В общей транзакции:

1. Authorize actor + object, lock owner/configuration, перечитать актуальные slots/scope/stage.
2. Проверить существующие stage gates и новые setup gates.
3. Если исходный plan уже materialized, не создавать повторно.
4. Разрешить published versions, рассчитать полный snapshot, записать revision/components/allocations.
5. Создать BonusEntry по положительным allocations: amount, originalAmount, source, role, links; `INCOMING`, без release/payroll/payment.
6. Записать новый delivery stage и audit в той же транзакции.
7. Commit; уведомления, query invalidation, существующие дополнительные side effects — после commit, с retry/idempotency по существующему паттерну.

Нужна DB uniqueness на initial materialization и allocation BonusEntry. Catch/log после успешного stage update недостаточен: это оставит Development без плана. Нельзя рассчитывать на клиентскую последовательность двух API calls.

Route inventory обязателен: `moveStage`, legacy `updateStatus`, ordinary Product update, Extension paths, reactivation, Deal Won creation, импорт/automation commands. Все пути входа новой карточки в Development используют одну команду или запрещают обход. Initial Deal Won по-прежнему создаёт Starting и не начисляет delivery.

### 5.2. Изменение scope

Lock → expectedRevision → validate published additions/actor → создать immutable revision → diff компонентов → обновить/создать только изменившиеся allocations/BonusEntry → sync pool → audit → commit → notifications.

Одна функция/роль/получатель materializes один source allocation. Сохранение всей configuration не пересоздаёт все BonusEntry. Re-add удалённой функции использует историю source identity: не порождает вторую оплату уже принятой части. Новая независимая работа оформляется отдельным scope component, а не повтором кнопки Add.

Добавление после фактического исполнения разрешено в ACTIVE/ON_HOLD открытого цикла. PM выбирает готовую published функцию; accepted work fact не делает план мгновенно PAID/VESTED и не обходит Done/funding.

### 5.3. Замена и отмена

Изменение назначения и денежное распределение — одна команда/транзакция. Прямой PATCH team fields после плана требует redistribution payload либо возвращает безопасный conflict; все UI используют эту команду. До плана обычные team fields работают как раньше.

Payload распределения относится к конкретной текущей allocation и component; все значения обязательны, default отсутствует. Проверить sum=100%, finite bounds, component принадлежность, actor permissions, current recipient и employee eligibility. Старые retained allocations других сотрудников не делятся заново.

Нельзя снизить planned amount ниже принятой сохранённой части и уже финансово связанного обязательства. Для каждого BonusEntry прочитать authoritative releases, payroll allocations, carry и payments. Не суммировать один release дважды как release+payment; вычислять encumbered floor по существующему ledger. Отмена непроведённого draft release возможна только действующим финансовым процессом, не побочным delete из смены сотрудника.

Если операция затрагивает защищённый floor, отклонить её атомарно. PM может отдельно выполнить допустимое распределение незарезервированного остатка. Исправление уже оплаченного — существующий Finance correction, без отрицательных fake payments/удаления факта. При отмене продукта сохранить принятую часть и audit; не требовать default 0% от PM.

## 6. Контракт с Finance — обязательный compatibility gate

Новая модель заменяет способ определения planned amount, но не существующий payout policy.

- `BonusEntry.amount/originalAmount` и source allocation дают план; `BonusRelease` — release; `ExpensePayment` — деньги. Не суммировать plan record + BonusEntry как два бонуса.
- Pool sync должен учитывать QA/Tech как DELIVERY; отдельно расширить employee linking/resolver/matrix/history, которые сейчас выбирают только PM/Backend/Frontend/Designer.
- Generated entries должны распознаваться Finance planned-amount/reassign handlers. Финансовая ручная коррекция сохраняет исходный calculator snapshot и отдельный adjustment/reason; последующий scope-change не затирает её. Нельзя разрешать прямой edit units через общий Bonus patch.
- Cap в текущем attach применяется к non-sales тоже; новая функция не обнуляет consumed cap, carry идёт existing FIFO. Не вводить дополнительное сгорание delivery KPI.
- Development — `earnedPeriod = null`, план не доступен к автоматической выплате. Первичная приёмка/Done фиксирует earned month один раз, до downstream eligibility; это отдельное поле от plannedAt.
- `payroll-bonus-release-base.ts` сейчас ограничивает матрицу месяцем M−1. Проверить весь existing путь: Done в M, release в M+1, частичное финансирование в M+2, уже существующий early release, carry после cap. Нельзя решать невидимость переносом earnedPeriod в сегодняшний месяц при каждом платеже.
- Совместимость достигается адаптацией нового источника к существующему release-ledger: уже approved releases и законный остаток должны оставаться доступными через действующий release/attach flow. Если baseline этого не поддерживает, зафиксировать узкий дефект в S00/S13 и исправить соответствующий consumer с регрессией, сохраняя sales earned-month/KPI и факты уже выплаченного. Не расширять все старые бонусы в matrix без проверки дубликатов.
- Состояния Wallet использовать существующие mappings. Planned/earned/released/in payroll/paid — разные показатели, не один флаг.
- Отменённый Product не подменять статусом Done ради auto-release. Сохранённая принятая часть требует existing manual Finance eligibility/release.
- Входные money-currency контракты старого payroll ограничены: при несовместимости AMD/new allocation и currency профиля не суммировать currencies молча. Нужен setup error, не внедрение нового FX engine.

Существующие legacy/manual entries не переписывать. Точное место адаптера и подтверждённые baseline ограничения записать в журнал до реализации финансового bridge.

## 7. API surface

Ниже целевые routes относительно действующего API prefix (`/api/v1` или BFF `/api` — использовать repo convention). Не менять старые URL ради консистентности с этими примерами.

| Route family                                                                         | Назначение / контракт                                                                                         |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `GET /delivery-functions`, `GET /delivery-functions/:id`                             | Operational DTO: code/title/content/attachments/safe status; без financial fields                             |
| `POST /delivery-functions`, `PATCH /delivery-functions/:id/content`, content history | Content editor; не принимать prices/status finance в mass assignment                                          |
| `GET/POST /delivery-functions/:id/pricing-versions`, publish/archive                 | Owner/CEO-only financial DTO/command                                                                          |
| `/delivery-base-profiles`, versions/publish                                          | Owner/CEO; отдельный operational selector возвращает labels/availability, не units                            |
| `/delivery-role-rates`, versions/publish                                             | Owner/CEO, effective dates, audit                                                                             |
| `GET/PUT /projects/products/:id/configuration`                                       | Scoped draft/work configuration, expectedRevision, без денег                                                  |
| `GET/PUT /projects/extensions/:id/configuration`                                     | Тот же контракт, независимый owner/order                                                                      |
| configuration features add/remove, scope preview/commit                              | Working diff без денег; changes после старта с reason; atomic commit                                          |
| configuration `copy-from`                                                            | Authorize source+target, копировать только разрешённый scope; current pricing, no employee/client secret copy |
| configuration `reassign`                                                             | Slot + required distribution + expectedRevision, idempotent                                                   |
| configuration `adopt`                                                                | Owner-only legacy adoption, explicit preview и проверка дублей                                                |
| existing lifecycle endpoints                                                         | Общий Development hook; не отдельная клиентская команда создания бонусов                                      |
| existing `/me/wallet` и details                                                      | Own money projection; серверный employee context, не employeeId из body                                       |
| existing Finance endpoints                                                           | Денежные результаты по текущим правам, private normative detail отдельным Owner endpoint                      |

Commands должны выдавать structured codes: `CONFIGURATION_INCOMPLETE`, `ROLE_ASSIGNMENT_REQUIRED`, `NORMATIVE_NOT_CONFIGURED`, `CONFIGURATION_CONFLICT`, `REDISTRIBUTION_REQUIRED`, `FINANCIAL_ALLOCATION_LOCKED`, `FUNCTION_ALREADY_SELECTED`, `LEGACY_ADOPTION_REQUIRED`. Не включать hidden units/rates/чужие суммы в message/details для PM.

Список paginated и bounded; проверки scope в query, не после загрузки всех projects. Operational и financial TanStack Query keys/DTO не смешивать, очищать sensitive cache при смене сессии/прав. Никакого client-side authoritative calculation.

## 8. Права и защищённые данные

Использовать effective authorization NBOS, включая role assignments и object scope. Не проверять право по тексту должности, email, frontend boolean или единичному legacy Employee.role без существующего resolver.

Нужны отдельные capabilities:

- `FUNCTION_CATALOG_READ`;
- `FUNCTION_CONTENT_EDIT`;
- `DELIVERY_COMPENSATION_RULES_MANAGE` (Owner/CEO only);
- `DELIVERY_CONFIGURATION_EDIT` (PM/явно разрешённые scoped users);
- существующие self Wallet и Finance read/edit rights.

Это смысловые имена: технический module/action mapping интегрировать в текущую матрицу. Не выдавать Finance/HR/PM весь Compensation admin из-за права читать инструкции. Доступ к Product не выдаёт финансовый доступ; право редактировать проценты участия не даёт право редактировать rate.

Threat surfaces: operational JSON и SSR/RSC payload, nested sheet fetches, BonusEntry snapshots, Wallet exports, global/project audit, websocket/notifications, file preview URLs, client cache, error details, прямые запросы редактирования/публикации. Общая инструкция не должна содержать секреты/чужие персональные договорённости. Content editor не может привязать чужой private FileAsset и открыть его всей компании.

Проверить защиту сервера негативными тестами, а не только hidden tabs. План проверки составлен с учётом `security-review`; это требования к новой реализации, не утверждение о найденной уязвимости production.

## 9. Миграции и rollout

Фреймворк: Prisma 7 + PostgreSQL 17. Плановый риск **MEDIUM**: новые таблицы additive, но уникальность materialization, payroll связи и NETWORK enum требуют согласованного rollout. Фактический объём/traffic production не измерялся.

1. Additive таблицы/nullable source fields и FK; legacy mode существующим rows, без начислений/backfill денег.
2. Новые indexes/uniqueness только после read-only preflight на existing duplicate risks; SQL inspect, locks/timeouts и объём определить в безопасной среде.
3. NETWORK enum addition отдельно от использования нового значения, если транзакционный режим PostgreSQL/runner требует commit перед INSERT. Следующая миграция/seed добавляет policy rows идемпотентно.
4. Deploy совместимого backend/read DTO, потом UI; включение создания V2 конфигураций через единый rollout switch/cutover, default OFF до readiness. Не ломать старые клиенты/продукты.
5. Seed draft каталог; Owner публикует реальные нормативы. Feature enable не превращает уже существующие legacy-продукты в V2.
6. При rollback выключить новые enrollment/mutations, сохранить данные, возможность читать и выплатить уже созданные obligations. Нельзя просто откатить БД/drop tables или удалить NETWORK enum после использования. Предпочесть forward fix.

Нельзя выполнять production migration/deploy из Cursor prompt. Локальная миграция разрешена только на подтверждённой disposable/test БД; перед любым migrate вывести безопасную идентификацию target без credentials. Не использовать `db push`, reset или root seed как shortcut.

## 10. Наблюдаемость

Структурированные события с operationId, configuration/revision/order ids, source и actor; без units/сумм в рабочих уведомлениях. Метрики/диагностика: failed materialization, duplicate attempt, revision conflict, missing rate, financial floor rejection, notification retry. Авторизованный Owner audit содержит финансовый diff; обычная project history — только рабочий diff.

Подготовить read-only reconciliation: V2 Development с отсутствующим initial plan; allocations без BonusEntry; несоответствие sums; orphan assignments; incomplete rates; повторные source keys; inconsistent pool totals. Repair — отдельная идемпотентная административная операция, не фоновый бесконтрольный перерасчёт цен.
