# NBOS Implementation Progress

> **Единый источник** прогресса: что закрыто, что делаем до полного канона, что отложено. Детальное поведение — в `docs/NBOS/02-Modules/*`, cleanup registers, тестах и git.

**Обновлено:** 2026-05-05 (Partners: commission policy + expense backlog type fix)

---

## Принципы работы (согласовано)

- Сначала **рабочая система по документам** `docs/NBOS` + последовательное закрытие **дельты** (`00-Delta-New-Description.md`) с фиксацией в каноне где нужно; затем **ручная приёмка** блоками.
- **Миграция с Bitrix** и production cutover — **последние**, после полноты функционала в NBOS.
- **Банк** (API, выписки, автосверка) — **не делаем на текущем этапе**; внешние интеграции в бэклоге с перечнем нужных данных/кредов (владелец подключает). Исключение: банк.
- Оценка в конце строки: **S** = маленький срез, **M** = средний, **L** = крупный.
- Нет запрета на миграции схемы; крупные темы режем на срезы с DoD из конца файла.

---

## Что значит «100%» и зачем это в файле

Это **не отдельный инструмент** и не то, что нужно «выбирать» каждый день. Это пояснение **какие документы считаем обязательными к закрытию**:

- **Основа:** всё, что описано в активном каноне `docs/NBOS` (модули, бизнес-логика, UI-спеки).
- **Плюс:** пункты из `00-Delta-New-Description.md` и устные решения **после того, как они перенесены в канон** — тогда они становятся такими же обязательными, как остальной NBOS.

**Как пользоваться:** работаем по чеклисту ниже (блок 2); если продукт решил новое правило — сначала **дописываем в `docs/NBOS`**, потом снимаем задачу в этом файле. Миграция Bitrix на это не влияет (она в конце).

---

## Бонус продаж (канон)

Один источник правды: `docs/NBOS/03-Business-Logic/03-Bonus-Payroll-Logic.md`. Там: **две независимые ставки** Seller % и Assistant % от базы (**Classic** = общая сумма заказа, **Subscription** = сумма 1-го месяца); строка политики выбирается по `**From`** на сделке; ставки **в БД и UI**, редактируемые; начисление с **первого `Paid`**, идемпотентно; **KPI — к выплате. Реализация в коде — задачи в блоке 2.

---

## Атрибуция (это не «вопрос», а подсказка для разработки)

Фраза «где живёт» означает **в каком месте продукта делать поля и справочники**, а не открытый вопрос к владельцу:

- Ввод и гейты на **Lead/Deal** (CRM).
- Справочники «откуда / второй уровень» — в **Marketing Settings** (`18-Marketing`), чтобы CRM только ссылался на согласованные значения.

Подробности — в каноне `01-CRM` и `18-Marketing`.

---

## Credentials: step-up и «сохранение пароля»

**Рекомендация:** сохранение/редактирование записи в vault — под **обычной сессией** + audit. **Повторный ввод пароля (step-up)** — на **reveal / copy / export** секретов и прочие **high-risk** действия по `12-Credentials/*`, а не на каждое сохранение полей. Так баланс удобства и безопасности совпадает с каноном «хранение ≠ показ секрета».

---

## Блок 1 — Закрыто ранее (P0 фаз 1–6)

Отметки для уже поставленного MVP по дорожной карте; при регрессии снять галочку и перенести строку в бэклог.

- Phase 1 — platform shell: навигация, RBAC shell, shared states, админ-фундамент — L
- Phase 2 — CRM / Marketing intake: гейты лида/сделки, handoff, маркетинговые поля, точки входа в проект — L
- Phase 3 — Finance core: деньги, Client Services, шесть отчётных агрегатов v1 — L
- Phase 4 — Delivery: Projects Hub, продукт/доработка, Work Space, задачи, мосты Support — L
- Phase 5 — Collaboration P0: Calendar, Technical, Notifications, Drive, Credentials, Messenger, Mail, Documents — L
- Phase 6 — Control layer P0: Dashboard Control Center, Reports каталог / export / schedule foundation — L
- Auth: NextAuth + JWT API + базовые guards — M
- Deal Won / override и критичные finance gates (P0) — M
- Product/Extension lifecycle gates (P0) — M
- Documents: TipTap, поиск, вложения Drive (P0) — L
- Drive: метаданные, загрузка, связи (P0) — M
- Credentials: шифрование, reveal, audit (P0) — M
- Mail/Messenger/Notifications базовые API и очереди (без полной внешней глубины) — L

---

## Блок 2 — Бэклог до полного канона, разбитый по готовности

Каждая строка — отдельная задача. **Порядок глобальный:** сначала делаем то, что можно закрывать сейчас без внешних поставщиков и кредов; затем внутренний фонд интеграций; после этого — внешние каналы и миграция. **Support (глубокий SLA/overlay)** — после основной массы, как договорено; **ручная приёмка** после каждого логического блока.

**🟢 Уже сделано:** у таких строк в начале стоит **🟢** (и чекбокс `[x]`) — быстро видно, что срез уже в репозитории/каноне.

- 🟢 [x] Сводная таблица переходов Lead → Deal → Order → Project в одном каноническом документе — M → `docs/NBOS/03-Business-Logic/00-Lead-Deal-Order-Project-Transition-Matrix.md`
- 🟢 [x] Пауза/штрафы подписки при задержке сдачи — правила в каноне и в runtime — M → `04-Subscription-Billing-Logic.md` § пауза; `billing-subscription-delivery-pause.ts` + `BillingService.runMonthlyBilling`
- 🟢 [x] Создание **Deal без Lead** — backend, UI, валидация, аудит — M → `deal-create-validation.ts`, `DealsService.create` + audit `DEAL_CREATED`, `CreateDealDialog`, матрица §8
- 🟢 [x] Воронка Lead: статус/колонка **On Hold** после New — M → `LeadStatusEnum.ON_HOLD`, миграция `20260505143000_lead_status_on_hold`, `LEAD_STAGES`, `leads.service`, `02-Lead-Pipeline.md`, матрица §2
- 🟢 [x] Поле «название обращения = продукт/услуга» на Lead — S → `Lead.name` / `Deal.name` при конверсии; гейт в `lead-conversion.service`, SQL в UI (`LeadTransitionInlineEditor`, `leads/page`, `CreateLeadDialog`, `LeadSheet`), `02-Lead-Pipeline.md`
- 🟢 [x] Двухуровневая атрибуция (верхний канал + зависимый список) + справочники в Marketing Settings — L → `MarketingCrmWhereOption` + seed; `GET/PATCH …/crm-where-options`; CRM UI через `useCrmMarketingWhereOptions`; блок в `marketing/settings`; **Pending:** отдельные каналы Instagram/Facebook вместо одного `META_ADS`, Sales Where из БД, Website/SEO подканоны из канона
- 🟢 [x] Deal: роль **ассистента продаж** (поля, борд, карточка) — M → `seller_assistant_id` + `DealSellerAssistant`; API create/update; `DealCard` / `DealContactTeamSection` / `CreateDealDialog`; валидация employee в `deal-create-validation`
- 🟢 [x] Бонус: движок **независимых ставок** Seller/Assistant по `From` + Classic/Subscription база + snapshot + UI/БД политики — по `03-Bonus-Payroll-Logic.md` — L → `sales_bonus_policies` + миграция `20260505201000_sales_bonus_policy_and_accrual`; `SalesBonusAccrualService` (хук из `PaymentsService` при `PAID`); `GET/PATCH /api/bonus/sales-policies` (+ `:id` на PATCH); UI `/my-company/sales-bonus-policies`; **Подписка 2+:** `SUBSCRIPTION_RECURRING` + миграция `20260505250000_sales_bonus_subscription_recurring`, начисление с каждого последующего оплаченного инвойса (база = сумма инвойса), идемпотентность `sales_accrual_invoice_id`, дефолт ставок 0% до настройки в UI
- 🟢 [x] Бонус: удалить legacy `HOLDBACK` / `holdbackPercent` / `holdbackReleaseDate` и заменить project-pools API/UI на **product-level roll-up** — M → миграция `20260505213000_bonus_remove_holdback_status_enum_trim`; `GET /api/bonus/products/pools` + `foldBonusProductPools` / `getProductPools`; UI `/finance/bonus-pools` + CSV `export-bonus-product-pools-csv`; таблица `**product_bonus_pools`** + sync; миграция `20260505230000_bonus_release_ledger` + `**bonus_releases`**; `GET/POST /api/bonus/entries/:entryId/releases`+`BonusReleaseService`; `totalReleasedAmount`из сумм релизов (APPROVED / INCLUDED_IN_PAYROLL / PAID);`POST /api/payroll-runs/:id/bonus-releases/attach`+`attachBonusReleasesToPayrollRun`(DRAFT/REVIEW →`SalaryLine.bonusesTotal`, статус релиза INCLUDED_IN_PAYROLL); `**availableFunding`/`overFundingAmount`из суммы`Payment`по инвойсам заказа; AUTO-релиз пропорционально по`DELIVERY`/`PM`/`DESIGN`при`Product`/`Extension` DONE (`tryCreateProportionalAutoReleases`, хуки `PaymentsService`create/delete,`ProductsService.complete`, `ExtensionsService.complete`); синк `**BonusEntry.status`** с counting-релизами (`refreshBonusEntryStatusAfterReleasesChange`, конец `syncProductBonusPoolForOrder`); `**POST /api/payroll-runs/:id/bonus-releases/detach` (откат INCLUDED→APPROVED + строки зарплаты); при полной оплате salary line из expense (`syncSalaryLinePaidFromExpenseLedger`) — `markPayrollBonusReleasesPaidForSalaryLine`: релизы INCLUDED_IN_PAYROLL→PAID, `BonusEntry`→PAID если сумма PAID-релизов ≥ planned, resync пула заказа; `**PATCH /api/bonus/entries/:entryId/releases/:releaseId**` (`patchForEntry`) — корректировка суммы **DRAFT**/**APPROVED** (AUTO→**CORRECTION** + reason, cap по entry); UI: bonus board → карточка → ledger (подпись SALES: classic / 1st invoice / month 2+ + CSV); **KPI к выплате:** `20260505240000_payroll_sales_kpi`— поля плана/факта на`PayrollRun`, `payroll_included_amount`на релизе,`PATCH /api/payroll-runs/:id`, коэффициент 100%/50%/0% для **SALES\*\* при attach (пороги 70%/50% по канону); UI sales KPI на `/finance/payroll/[id]`+`includedBonusReleaseCount`в деталке run; подсказка факта: сумма`Payment`по`paymentDate` в UTC-месяце run (`kpiSalesActualSuggestedAmount`в`GET /api/payroll-runs/:id`) + кнопка подстановки в UI
- 🟢 [x] Правило минимума первого платежа (10% classic / первый месяц subscription) — инвойс-логика — M → `assertFirstInvoiceMinimums` + `invoice-first-payment-minimums.constants.ts` в `InvoicesService.create`; тесты в `invoices-create.service.test.ts`
- 🟢 [x] Задачи: фильтр и контекст по **Order** внутри проекта — M → `GET /api/tasks?projectId&orderId`, `task-project-list-filter.ops.ts` / `task-find-all-paginated.op.ts`; карточка Tasks на `/projects/[id]`, query `taskOrder`, `TaskSheet` + `resolveTaskOrderContext`
- 🟢 [x] CRM: direct actions (вкладки/секции) + create invoice из gate popup; lead inline «Jump to» — M → `blocker-actions` (`resolveDealSheetIntentFromBlockerAction`, `resolveLeadSheetSectionFromErrors`), секции `crm-sheet-section-ids`, `DealSheet`/`LeadSheet` `blockerNavigation`, `TransitionBlockerDialog` inline-only кнопки, deals `Create invoice`
- 🟢 **Projects Hub (delivery):** не одна «магическая» задача, а **чеклист выравнивания** экранов продукта/борда/гейтов с каноном: например, система **не даёт** перевести продукт в **QA** или **Transfer**, пока по нему висят **открытые связанные задачи**; перед **Done** проверяются оплата, заказ, приёмка клиента и т.д. Полный перечень и статусы — в `[06-Projects-Hub-Cleanup-Register.md](NBOS/02-Modules/02-Projects-Hub/06-Projects-Hub-Cleanup-Register.md)` и closure gate Phase 4. **Срез:** deep links из панелей блокеров Product/Extension stage gate → вкладки продукта; **Delivery Board** при `STAGE_GATE_VALIDATION` показывает баннер с полями + те же shortcuts (`DeliveryBoardStageGateBanner`, `project-delivery-board-stage-gate.ts`). — M

### Блок 2A — Реализуем сейчас: внутренний канон без внешних факторов

Это активная очередь. Здесь нет задач, которые требуют токенов, внешних аккаунтов, production cutover или отдельного бизнес-решения.

- 🟢 [x] Clients: сверка `05-Clients-Process-Flow` с UI/API, закрыть разрывы — M → edit flows используют `PUT /api/clients/contacts/:id` и `PUT /api/clients/companies/:id` вместо создания дублей; API/UI фильтр Contact Type (`contactType`) мапится на runtime `role`; Companies `type` / `taxStatus` фильтры работают в API; неперсистентный Contact Source убран из Contacts UI
- 🟢 [x] Finance: **Operational Journal**, period close, связь агрегатов с журналом — L → `finance_posting_periods` + `operational_journal_entries`; append-only cash lines for `Payment` with idempotency key `payment:<id>`; closed posting periods reject new journal posts; `GET /api/finance/journal/cash-summary` exposes the journal-backed cash aggregate; existing Finance reports stay on legacy sources until backfill/cutover
- 🟢 [x] Finance: перестройка UI вокруг Invoice Card / планов расходов / досок канона — L → первый UI-срез Invoice Card: `InvoicesService.findAll/findById` отдаёт `project`; kanban card показывает project, type badge и overdue days; `InvoiceSheet` подписан как `Invoice Card`, показывает existing `govInvoiceId` / official invoice state и subscription link context. Expense Plans / Board глубина остаётся в следующих Finance строках
- 🟢 [x] Finance: summary + scheduler без «старых» семантик статусов — M → dashboard summary добавляет доменные `invoiceCards` / `expenseCards`: open/outstanding invoices считаются по остатку платежей и due date, expenses — по due soon / overdue / on hold / backlog через `backlogReason`; scheduler больше не переводит `ON_HOLD` invoice cards в `DELAYED`. Поле `invoiceStatusItems` в summary теперь агрегирует **`moneyStatus`** (ключ `status` в JSON — значение money enum); KPI по-прежнему из `invoiceCards` / платежей, не из legacy pipeline
- 🟢 [x] Finance: уведомления/напоминания по правилам invoice card, не по legacy board — M → `InvoiceCardRemindersService` создаёт idempotent `NotificationEvent`/`NotificationJob` для due Invoice Card rules (`official_request_due`, `payment_reminder_due`), scheduler endpoint `POST /api/scheduler/invoice-card-reminders`; `ON_HOLD`, `notificationsEnabled=false` и Tax без official invoice marker не уходят в payment reminder. Внешняя отправка клиенту остаётся за channel adapters/templates
- 🟢 [x] Finance: partial outgoing payments (expense/salary) если в каноне — M → канон подтверждён (`04-Expenses`, `05-Bonus-and-Payroll`): `POST /expenses/:id/payments` записывает частичные/полные `ExpensePayment` с лимитом по `remaining` (`expense-payment-create.ts`); ledger `UNPAID`/`PARTIAL`/`PAID`; для зарплаты связанный `SalaryLine` синхронизируется в `PARTIALLY_PAID`/`PAID` через `syncSalaryLinePaidFromExpenseLedger`. Полный split Expense Card vs workflow enum и UI канона остаётся в других строках 2A
- 🟢 [x] Finance: Employee Wallet read-модель до полноты канона — M → **частично, код сверён с `08-Employee-Wallet`:** `GET /me/wallet` + `EmployeeWalletService` — bonus pipeline по группам, Next Payroll с `partialPayments` из `ExpensePayment`, `salaryHistory`, `projectBreakdown`, `activity`; UI `/finance/wallet` + CSV export. **in-app** типы `finance.wallet.*` в `notification-rules.ts`, хуки в bonus/payroll/expense/payments/products/extensions. **Не закрыто до полного канона:** отдельного `Compensation Profile` в Prisma нет — блок «текущие условия» = `Employee.baseSalary` + роль/уровень/должность, без KPI/bonus policy narrative и даты профиля из канона; push/Telegram/email по тем же событиям — вне scope
- 🟢 [x] Finance: Invoice Card `money_status` (колонка + backfill + синхронизация при платежах, ручной смене статуса, billing, overdue cron) + минимальный UI — M (**срез 1**)
- 🟢 [x] Finance: потребители **`money_status`** — фильтр `GET /finance/invoices?moneyStatus=`, канбан колонок по money + `PATCH …/money-status` (companion legacy для order/deal), `GET /finance/invoices/stats` и dashboard summary `groupBy` по money; web: FilterBar, drag→`updateMoneyStatus`, donut по money; scope stats CSV `by_money_status`; `resolveInvoiceMoneyStatus`: legacy `FAIL` → money `CANCELLED` — M (**срез 2**)
- Finance: убрать legacy `InvoiceStatusEnum` из схемы и кода после полного отказа от companion-слоя — L (**финишер**)
- 🟢 [x] Finance: поля coverage на Invoice Card подписок + **Subscription Grid** (`coverage_start_month` / `count`, billing/create, rollup; `GET /api/finance/subscriptions/grid`; UI: матрица года, paid/pending/overdue/forecast/missed, итоги; ссылка на Invoice Card через `openInvoice`) — M
- 🟢 [x] Finance: Expense Backlog — idempotent notification jobs по канону — M → `ExpenseBacklogRemindersService`: недельный дайджест открытого backlog (`DELAYED` + `backlogReason` + остаток по `ExpensePayment`) для `FINANCE_TEAM`; ежедневные напоминания по просроченному `dueDate`; `POST /api/scheduler/expense-backlog-reminders`; типы `finance.expense.backlog_weekly_digest` / `finance.expense.backlog_due_overdue` в `notification-rules.ts`. Внешняя доставка — по адаптерам; поля «дата пересмотра» On Hold — вне среза
- 🟢 [x] Finance: Client Service Record — связи invoice / expense plan / expense / task — M → `GET/PUT/POST …/client-services/:id` (detail) отдаёт `financeLinks` (до 100 строк на тип): инвойсы с `moneyStatus`, планы, расходы, задачи через `TaskLink` + `ClientServiceRecord`; список по-прежнему `_count` only; UI: блок «Connections» в диалоге редактирования с ссылками на invoices/expenses/plans/tasks. Авто-создание expense/task после оплаты — вне среза (см. cleanup C5)
- 🟢 [x] Payroll: полнота Salary Board / Payroll Run под `05-Bonus-and-Payroll` — M → `GET /api/payroll-runs/salary-board` (сотрудники не `TERMINATED` × месяцы `YYYY-MM`, ячейка = `SalaryLine` + статусы run/line); web `/finance/salary` (finance nav), ссылки: колонка → run, ячейка → `…/payroll/:id#salary-line-…`; деталь run: `id` на строке таблицы salary lines
- 🟢 [x] Partners: **UI ↔ API** выравнивание полей и DTO — M → wire JSON: `level` (Prisma `Partner.type`, REGULAR/PREMIUM), `defaultPercent` строкой `0.00`, ISO `createdAt`/`updatedAt`; `GET /api/partners` фильтр `level` + deprecated `type`; create/update принимают `level` или legacy `type`; валидация enum на API; web: константы `PARTNER_LEVELS`, колонка Level, CSV `level`/`updatedAt`, CRM partner search subtitle; Partner Card / commission policy / accruals — в следующих строках Partners
- 🟢 [x] Partners: **Commission Policy** по Deal Type — M → `PartnerCommissionPolicyRow` (`partner_id`, `deal_type` `DealTypeEnum`, `percent`); `GET/PUT /api/partners/:id/commission-policy` (ровно 4 типа; `percent: null` сбрасывает override → `Partner.defaultPercent`); валидация 0–100; web: карточка на `/partners/[id]`
- 🟢 [x] Partners: **Referral Terms** + фиксация % на сделке — M → `PartnerReferralTerms` (`deal_id` unique, snapshots `deal_type` / `payment_type`, `partner_percent`, `source_policy` POLICY | DEFAULT | OVERRIDE, `override_reason`); авто-sync при create/update сделки (OVERRIDE не пересчитывает %); pre-sync перед stage move если Partner; WON gate для всех типов; `PATCH /api/crm/deals/:id/partner-referral-terms` (`RESET` | `OVERRIDE` + reason ≥3); web: блок в Deal sheet (Marketing) + `dealsApi.patchPartnerReferralTerms`
- Partners: **Accrual / Balance / Payout Batch** + связь с Finance journal — L
- Partners: outbound terms / service case разделение — M
- Reports: **кросс-модульный реестр** `ReportDefinition` (Phase 7 registry shape) — L
- Reports: централизованные permissions на источники — M
- Reports: XLSX/PDF экспорт, retry/cancel, история доставки расписаний — L
- Reports: data-quality предупреждения из Marketing и кросс-модульных проекций — M
- Marketing: глубина Board / Attribution Review / popup polish из cleanup — M
- Marketing: CPL/ROI виджеты только при наличии spend (без фейка) — S
- Marketing: List.am ↔ Finance Expense Plan связь до UX канона — S
- CRM: Offer attachment и deal-required fields — глубина если не закрыта — M
- Tasks: выравнивание статусов/enum под канон — M
- Tasks: шаблоны повторяющихся задач (не Reports) — M
- Projects Hub: linked orders block Transfer→Done — проверка гейтов — M
- Drive: массовые операции / lifecycle из cleanup — M
- Documents: политика retention/export cleanup согласована и внедрена — M
- Credentials: step-up на reveal/copy/export + high-risk уведомления — M
- Credentials: довести list API / health metadata (cleanup PARTIAL) — S
- Notifications: **пользовательские настройки** каналов/типов событий — M
- Notifications: **админ-UI правил** если остаётся в рамках низкой сложности — M
- My Company: Compensation / SOP / KPI Scorecard до глубины канона — L
- My Company / header: My Account вне Settings везде — S
- Technical Infrastructure: связи со Support и мониторинг baseline — M
- Technical: Deploy records + backup policies по канону — M
- Settings: integration registry + системные списки для новых интеграций — M
- RBAC: entity-level глубина где канон требует — M
- Закрыть открытые пункты `00-Technical-Decisions-By-Module.md` по мере срезов (FX, dedup notifications, Drive retention, …) — M
- Support: **reopen** как событие/переход, убрать `REOPENED` как постоянный enum при необходимости — M
- Support: waiting overlay (client / third party / escalated) — M
- Support: change-control представление отдельно от основного потока — M
- Support: SLA pause / breach / escalation оркестрация — L
- Support: связь Ticket → Technical asset / environment — M
- Support: resolution requirements + auto-close после Extension Done где канон — M
- Support: product-context в UI create/filter — M
- Ручная приёмка блока «ядро домена» (CRM+Finance+Projects+Partners+Reports) — S
- Ручная приёмка блока «collaboration + credentials + notifications» — S
- Ручная приёмка блока «Support глубина» — S
- Обновить cleanup registers статусами по мере закрытия срезов — S
- Синхронизировать `docs/дожать до 100% описанного.md` или заменить ссылкой на этот файл — S
- Регрессионные тесты на критичные гейты после крупных срезов — M
- Производительность: тяжёлые отчёты только через очередь (контроль) — S
- Messenger: поиск/история PostgreSQL — доработка UX при объёме — S
- Web: E2E smoke для критичных flow (замена разовому precheck) — L
- Production hardening: CORS/CSRF и security baseline по `docs/NBOS` / project rules — S

### Блок 2B — Внутренний фонд интеграций: можно готовить сейчас, без внешних кредов

Эти задачи не подключают реальные внешние сервисы. Они создают безопасный каркас: реестр, статусы, аудит, адаптеры, required setup и документацию для владельца.

- Integration foundation: `IntegrationProvider` реестр, статусы, аудит, контракт адаптера — L
- Admin UI: страница статусов интеграций и required setup — M
- Messenger: **ExternalChannelAdapter** контракт + очереди send/receive — L
- Mail: лимиты первичного импорта + retry policy — сначала зафиксировать лимиты, затем реализовать — M
- Mail: многопровайдерность и health dashboard без реального внешнего sync — M
- Calendar: внутренний sync-контракт и слои до внешнего Google sync — M
- Settings: required setup / системные списки для интеграций — M
- Документировать для владельца: **какие env/ключи** нужны по каждой интеграции (кроме банка) — S
- Аудит: покрыть новые интеграционные события — M
- Документация runbook на отказ интеграции (fallback вручную) — M
- API: rate limits на публичные integration webhooks — S
- Ручная приёмка блока «интеграционный фонд» — S

### Блок 2C — Внешние факторы: делать только после кредов / аккаунтов / infra

Не держать эти строки в активной ежедневной очереди. Возвращать в работу, когда есть токены, доступы, тестовые аккаунты или подтверждённая инфраструктура.

- Telegram: internal notification channel по канону + явные env/токены — M
- WAHA / WhatsApp Web path: health, send, webhook receive, вложения через Drive — L
- Google: OAuth link scope для Mail/Calendar/Drive **как в каноне** (без банка) — M
- Google Calendar **sync** — только если подтверждён как цель текущего этапа — L
- Google Workspace Documents **v2 sync** по `20-Documents/05-` — L
- Marketing: внешние Ads API только после кредов — отдельный срез после фонда — L
- Support: связь с external messenger conversation — M
- Technical: webhooks GitHub / репозиторий links как интеграция — M
- Observability: связка инцидентов Sentry ↔ Support ticket — M
- Автоматизация сценариев по `docs/NBOS/06-Integrations/05-Automation-Scenarios.md` где зафиксировано в каноне — M
- Ручная приёмка блока «внешние интеграции» — S

### Блок 2D — Не активная очередь сейчас: после core или только при явном решении

Эти пункты не удалены из продукта, но не должны мешать закрывать текущий канон. Поднимать их только после блока 2A/2B или когда владелец явно возвращает в scope.

- Bitrix: **только после** пунктов выше — mapping register + dry-run контракт — L
- Bitrix: импорт Contacts/Companies (CSV или API) — после mapping — L
- Bitrix: остальные сущности по `07-Migration/` — L
- Dashboard: production кэш/refresh виджетов при появлении требований — S
- Documents: избранное и расширенная RBAC секций при необходимости канона — M
- Drive: дедупликация/квоты если канон потребует — M
- i18n: глубина UI по `20-i18n` если вошло в scope продукта — L

### Блок 2P — Pending / временно заблокировано

**Назначение:** сюда переносятся только пункты, по которым работа **уже начата**, но срез **нельзя закрыть сейчас** — с явной причиной, блокером и условием возврата в работу. Обычные невыполненные строки из 2A/2B/2C/2D **не дублировать**: это просто «очередь ещё не дошла».

**Правило:** ни одна микро-задача из блока 2 не снимается «в никуда»: либо `[x]` в чеклисте, либо строка здесь до разблокировки.

| Пункт блока 2 (кратко) | Статус | Почему не закрыто сейчас | Что нужно, чтобы снять |
| ---------------------- | ------ | ------------------------ | ---------------------- |
| —                      | —      | Пока пусто               | —                      |

---

## Блок 3 — Не делаем сейчас / переносим в будущее (≈20 строк)

Список без чекбоксов: это **не** активные задачи текущего этапа. При отмене навсегда — пометить в каноне «won’t».

- **Банк:** API, импорт выписок, автосопоставление платежей — не текущий этап.
- **Production cutover Bitrix → NBOS** и параллельная эксплуатация — после готовности функционала.
- **Полный** encrypted migration credentials из Bitrix — поздний этап миграции.
- **Incremental sync** Bitrix во время переходного периода — после первого импорта.
- **Гос. электронный счёт-фактура / интеграция с государственными реестрами** — после отдельного решения.
- **AI writing assistant** в Documents — вне core.
- **Collaborative live cursors** в Documents — вне core.
- **Публичный анонимный шаринг** Documents/Drive — вне core.
- **Impersonation** админа — только с явным аудитом и решением.
- **Обязательная 2FA** для всех — опционально после step-up baseline.
- **Double-entry** бухгалтерия полного уровня — если шире operational journal; уточнять по `09-Finance-Core-Architecture`.
- **Meilisearch** для Messenger — только при необходимости объёма.
- **Partner self-service portal** (партнёр видит свои проекты/выплаты) — отдельное ТЗ после внутреннего Partners.
- **Клиентский личный кабинет** (клиент видит проекты/счета) — отдельное ТЗ.
- **Mobile-приложение** и публичные формы — отдельное ТЗ unless канон.
- **Глубокий marketplace интеграций** (per-tenant overrides, auto-provisioning) — P2 из Phase 7 plan.
- **Тяжёлая BI** (дашборды уровня отдельного DWH) — не смешивать с operational Reports.
- **Автоматический** provisioning WAHA без инфраструктуры — не обещать до хостинга.
- **Репозиторий-wide format:check** зелёный по архивам — низкий приоритет.
- Архивный чеклист: `docs/Progress Archive/PHASE_7_PRECHECK_MANUAL_QA.md` — история, не рабочий процесс.

---

## Текущий фокус (кратко)

| Поле           | Значение                                                  |
| -------------- | --------------------------------------------------------- |
| Режим          | Закрытие **2A → 2B**; 2C только после внешних готовностей |
| Исключения     | Банк; Bitrix mapping/import/cutover после core            |
| Архив precheck | `docs/Progress Archive/PHASE_7_PRECHECK_MANUAL_QA.md`     |

---

## Slice DoD (без изменений по смыслу)

- Поведение совпадает с `docs/NBOS` и gates Phase 3/Finance.
- Нет фейковых денег, аудита, кредов и отчётных данных.
- Тесты / typecheck / lint для затронутых областей.
- Доки — по крупным вехам; один коммит в конце среза по возможности.

---

## См. также

- `docs/AI-START-HERE.md`
- `docs/NBOS/00-Implementation-Roadmap.md`
- `docs/Progress Archive/дожать до 100% описанного.md` (архивная матрица пробелов; чеклист — **этот файл**)
- `docs/PHASE_7_INTEGRATIONS_MIGRATION_WORK_PLAN.md`
