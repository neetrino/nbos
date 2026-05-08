# NBOS Implementation Done

> **Архив закрытых вех и выполненных срезов.** Активный бэклог — [`IMPLEMENTATION_PROGRESS.md`](./IMPLEMENTATION_PROGRESS.md). Последовательность по продукту — [`NBOS/00-Implementation-Roadmap.md`](./NBOS/00-Implementation-Roadmap.md). Детальное поведение — в `docs/NBOS/02-Modules/*`, cleanup registers, тестах и git.

**Обновлено:** 2026-05-08

---

## Блок 1 — Закрыто ранее (P0 фаз 1–6)

Отметки для уже поставленного MVP по дорожной карте (при регрессии перенос строки — в бэклог `IMPLEMENTATION_PROGRESS`).

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

## Блок 2 — Выполненные срезы (перенесено из Progress)

- 🟢 [x] Сводная таблица переходов Lead → Deal → Order → Project в одном каноническом документе — M → `docs/NBOS/03-Business-Logic/00-Lead-Deal-Order-Project-Transition-Matrix.md`
- 🟢 [x] Пауза/штрафы подписки при задержке сдачи — правила в каноне и в runtime — M → `04-Subscription-Billing-Logic.md` § пауза; `billing-subscription-delivery-pause.ts` + `BillingService.runMonthlyBilling`
- 🟢 [x] Создание **Deal без Lead** — backend, UI, валидация, аудит — M → `deal-create-validation.ts`, `DealsService.create` + audit `DEAL_CREATED`, `CreateDealDialog`, матрица §8
- 🟢 [x] Воронка Lead: статус/колонка **On Hold** после New — M → `LeadStatusEnum.ON_HOLD`, миграция `20260505143000_lead_status_on_hold`, `LEAD_STAGES`, `leads.service`, `02-Lead-Pipeline.md`, матрица §2
- 🟢 [x] Поле «название обращения = продукт/услуга» на Lead — S → `Lead.name` / `Deal.name` при конверсии; гейт в `lead-conversion.service`, SQL в UI (`LeadTransitionInlineEditor`, `leads/page`, `CreateLeadDialog`, `LeadSheet`), `02-Lead-Pipeline.md`
- 🟢 [x] Двухуровневая атрибуция (верхний канал + зависимый список) + справочники в Marketing Settings — L → `MarketingCrmWhereOption` + seed; `GET/PATCH …/crm-where-options`; CRM UI через `useCrmMarketingWhereOptions`; блок в `marketing/settings`; **Pending:** отдельные каналы Instagram/Facebook вместо одного `META_ADS`, Sales Where из БД, Website/SEO подканоны из канона
- 🟢 [x] Deal: роль **ассистента продаж** (поля, борд, карточка) — M → `seller_assistant_id` + `DealSellerAssistant`; API create/update; `DealCard` / `DealContactTeamSection` / `CreateDealDialog`; валидация employee в `deal-create-validation`
- 🟢 [x] Бонус: движок **независимых ставок** Seller/Assistant по `From` + Classic/Subscription база + snapshot + UI/БД политики — по `03-Bonus-Payroll-Logic.md` — L → `sales_bonus_policies` + миграция `20260505201000_sales_bonus_policy_and_accrual`; `SalesBonusAccrualService` (хук из `PaymentsService` при `PAID`); `GET/PATCH /api/bonus/sales-policies` (+ `:id` на PATCH); UI `/my-company/sales-bonus-policies`; **Подписка 2+:** `SUBSCRIPTION_RECURRING` + миграция `20260505250000_sales_bonus_subscription_recurring`, начисление с каждого последующего оплаченного инвойса (база = сумма инвойса), идемпотентность `sales_accrual_invoice_id`, дефолт ставок 0% до настройки в UI
- 🟢 [x] Бонус: удалить legacy `HOLDBACK` / `holdbackPercent` / `holdbackReleaseDate` и заменить project-pools API/UI на **product-level roll-up** — M → миграция `20260505213000_bonus_remove_holdback_status_enum_trim`; `GET /api/bonus/products/pools` + `foldBonusProductPools` / `getProductPools`; UI `/finance/bonus-pools` + CSV `export-bonus-product-pools-csv`; таблица `**product_bonus_pools`** + sync; миграция `20260505230000_bonus_release_ledger` + `**bonus_releases`**; `GET/POST /api/bonus/entries/:entryId/releases`+`BonusReleaseService`; `totalReleasedAmount`из сумм релизов (APPROVED / INCLUDED_IN_PAYROLL / PAID);`POST /api/payroll-runs/:id/bonus-releases/attach`+`attachBonusReleasesToPayrollRun`(DRAFT/REVIEW →`SalaryLine.bonusesTotal`, статус релиза INCLUDED_IN_PAYROLL); `**availableFunding`/`overFundingAmount`из суммы`Payment`по инвойсам заказа; AUTO-релиз пропорционально по`DELIVERY`/`PM`/`DESIGN`при`Product`/`Extension` DONE (`tryCreateProportionalAutoReleases`, хуки `PaymentsService`create/delete,`ProductsService.complete`, `ExtensionsService.complete`); синк `**BonusEntry.status`** с counting-релизами (`refreshBonusEntryStatusAfterReleasesChange`, конец `syncProductBonusPoolForOrder`); `**POST /api/payroll-runs/:id/bonus-releases/detach` (откат INCLUDED→APPROVED + строки зарплаты); при полной оплате salary line из expense (`syncSalaryLinePaidFromExpenseLedger`) — `markPayrollBonusReleasesPaidForSalaryLine`: релизы INCLUDED_IN_PAYROLL→PAID, `BonusEntry`→PAID если сумма PAID-релизов ≥ planned, resync пула заказа; `**PATCH /api/bonus/entries/:entryId/releases/:releaseId**` (`patchForEntry`) — корректировка суммы **DRAFT**/**APPROVED** (AUTO→**CORRECTION** + reason, cap по entry); UI: bonus board → карточка → ledger (подпись SALES: classic / 1st invoice / month 2+ + CSV); **KPI к выплате:** `20260505240000_payroll_sales_kpi`— поля плана/факта на`PayrollRun`, `payroll_included_amount`на релизе,`PATCH /api/payroll-runs/:id`, коэффициент 100%/50%/0% для **SALES при attach (пороги 70%/50% по канону); UI sales KPI на `/finance/payroll/[id]`+`includedBonusReleaseCount`в деталке run; подсказка факта: сумма`Payment`по`paymentDate` в UTC-месяце run (`kpiSalesActualSuggestedAmount`в`GET /api/payroll-runs/:id`) + кнопка подстановки в UI
- 🟢 [x] Правило минимума первого платежа (10% classic / первый месяц subscription) — инвойс-логика — M → `assertFirstInvoiceMinimums` + `invoice-first-payment-minimums.constants.ts` в `InvoicesService.create`; тесты в `invoices-create.service.test.ts`
- 🟢 [x] Задачи: фильтр и контекст по **Order** внутри проекта — M → `GET /api/tasks?projectId&orderId`, `task-project-list-filter.ops.ts` / `task-find-all-paginated.op.ts`; карточка Tasks на `/projects/[id]`, query `taskOrder`, `TaskSheet` + `resolveTaskOrderContext`
- 🟢 [x] CRM: direct actions (вкладки/секции) + create invoice из gate popup; lead inline «Jump to» — M → `blocker-actions` (`resolveDealSheetIntentFromBlockerAction`, `resolveLeadSheetSectionFromErrors`), секции `crm-sheet-section-ids`, `DealSheet`/`LeadSheet` `blockerNavigation`, `TransitionBlockerDialog` inline-only кнопки, deals `Create invoice`
- 🟢 **Projects Hub (delivery):** не одна «магическая» задача, а **чеклист выравнивания** экранов продукта/борда/гейтов с каноном: например, система **не даёт** перевести продукт в **QA** или **Transfer**, пока по нему висят **открытые связанные задачи**; перед **Done** проверяются оплата, заказ, приёмка клиента и т.д. Полный перечень и статусы — в `[06-Projects-Hub-Cleanup-Register.md](NBOS/02-Modules/02-Projects-Hub/06-Projects-Hub-Cleanup-Register.md)` и closure gate Phase 4. **Срез:** deep links из панелей блокеров Product/Extension stage gate → вкладки продукта; **Delivery Board** при `STAGE_GATE_VALIDATION` показывает баннер с полями + те же shortcuts (`DeliveryBoardStageGateBanner`, `project-delivery-board-stage-gate.ts`). — M
- 🟢 [x] Clients: сверка `05-Clients-Process-Flow` с UI/API, закрыть разрывы — M → edit flows используют `PUT /api/clients/contacts/:id` и `PUT /api/clients/companies/:id` вместо создания дублей; API/UI фильтр Contact Type (`contactType`) мапится на runtime `role`; Companies `type` / `taxStatus` фильтры работают в API; неперсистентный Contact Source убран из Contacts UI
- 🟢 [x] Finance: **Operational Journal**, period close, связь агрегатов с журналом — L → `finance_posting_periods` + `operational_journal_entries`; append-only cash lines for `Payment` with idempotency key `payment:<id>`; closed posting periods reject new journal posts; `GET /api/finance/journal/cash-summary` exposes the journal-backed cash aggregate; existing Finance reports stay on legacy sources until backfill/cutover
- 🟢 [x] Finance: перестройка UI вокруг Invoice Card / планов расходов / досок канона — L → первый UI-срез Invoice Card: `InvoicesService.findAll/findById` отдаёт `project`; kanban card показывает project, type badge и overdue days; `InvoiceSheet` подписан как `Invoice Card`, показывает existing `govInvoiceId` / official invoice state и subscription link context. Expense Plans / Board глубина остаётся в следующих Finance строках
- 🟢 [x] Finance: summary + scheduler без «старых» семантик статусов — M → dashboard summary добавляет доменные `invoiceCards` / `expenseCards`: open/outstanding invoices считаются по остатку платежей и due date, expenses — по due soon / overdue / on hold / backlog через `backlogReason`; scheduler больше не переводит `ON_HOLD` invoice cards в `DELAYED`. Поле `invoiceStatusItems` в summary теперь агрегирует `moneyStatus` (ключ `status` в JSON — значение money enum); KPI по-прежнему из `invoiceCards` / платежей, не из legacy pipeline
- 🟢 [x] Finance: уведомления/напоминания по правилам invoice card, не по legacy board — M → `InvoiceCardRemindersService` создаёт idempotent `NotificationEvent`/`NotificationJob` для due Invoice Card rules (`official_request_due`, `payment_reminder_due`), scheduler endpoint `POST /api/scheduler/invoice-card-reminders`; `ON_HOLD`, `notificationsEnabled=false` и Tax без official invoice marker не уходят в payment reminder. Внешняя отправка клиенту остаётся за channel adapters/templates
- 🟢 [x] Finance: partial outgoing payments (expense/salary) если в каноне — M → канон подтверждён (`04-Expenses`, `05-Bonus-and-Payroll`): `POST /expenses/:id/payments` записывает частичные/полные `ExpensePayment` с лимитом по `remaining` (`expense-payment-create.ts`); ledger `UNPAID`/`PARTIAL`/`PAID`; для зарплаты связанный `SalaryLine` синхронизируется в `PARTIALLY_PAID`/`PAID` через `syncSalaryLinePaidFromExpenseLedger`. Полный split Expense Card vs workflow enum и UI канона остаётся в других строках 2A
- 🟢 [x] Finance: Employee Wallet read-модель до полноты канона — M → **частично, код сверён с** `08-Employee-Wallet`**:** `GET /me/wallet` + `EmployeeWalletService` — bonus pipeline по группам, Next Payroll с `partialPayments` из `ExpensePayment`, `salaryHistory`, `projectBreakdown`, `activity`; UI `/finance/wallet` + CSV export. **in-app** типы `finance.wallet.` в `notification-rules.ts`, хуки в bonus/payroll/expense/payments/products/extensions. **Не закрыто до полного канона:** отдельного `Compensation Profile` в Prisma нет — блок «текущие условия» = `Employee.baseSalary` + роль/уровень/должность, без KPI/bonus policy narrative и даты профиля из канона; push/Telegram/email по тем же событиям — вне scope
- 🟢 [x] Finance: Invoice Card `money_status` (колонка + backfill + синхронизация при платежах, ручной смене статуса, billing, overdue cron) + минимальный UI — M (**срез 1**)
- 🟢 [x] Finance: потребители `money_status` — фильтр `GET /finance/invoices?moneyStatus=`, канбан колонок по money + `PATCH …/money-status` (companion legacy для order/deal), `GET /finance/invoices/stats` и dashboard summary `groupBy` по money; web: FilterBar, drag→`updateMoneyStatus`, donut по money; scope stats CSV `by_money_status`; `resolveInvoiceMoneyStatus`: legacy `FAIL` → money `CANCELLED` — M (**срез 2**)
- 🟢 [x] Finance: поля coverage на Invoice Card подписок + **Subscription Grid** (`coverage_start_month` / `count`, billing/create, rollup; `GET /api/finance/subscriptions/grid`; UI: матрица года, paid/pending/overdue/forecast/missed, итоги; ссылка на Invoice Card через `openInvoice`) — M
- 🟢 [x] Finance: Expense Backlog — idempotent notification jobs по канону — M → `ExpenseBacklogRemindersService`: недельный дайджест открытого backlog (`DELAYED` + `backlogReason` + остаток по `ExpensePayment`) для `FINANCE_TEAM`; ежедневные напоминания по просроченному `dueDate`; `POST /api/scheduler/expense-backlog-reminders`; типы `finance.expense.backlog_weekly_digest` / `finance.expense.backlog_due_overdue` в `notification-rules.ts`. Внешняя доставка — по адаптерам; поля «дата пересмотра» On Hold — вне среза
- 🟢 [x] Finance: Client Service Record — связи invoice / expense plan / expense / task — M → `GET/PUT/POST …/client-services/:id` (detail) отдаёт `financeLinks` (до 100 строк на тип): инвойсы с `moneyStatus`, планы, расходы, задачи через `TaskLink` + `ClientServiceRecord`; список по-прежнему `_count` only; UI: блок «Connections» в диалоге редактирования с ссылками на invoices/expenses/plans/tasks. Авто-создание expense/task после оплаты — вне среза (см. cleanup C5)
- 🟢 [x] Payroll: полнота Salary Board / Payroll Run под `05-Bonus-and-Payroll` — M → `GET /api/payroll-runs/salary-board` (сотрудники не `TERMINATED` × месяцы `YYYY-MM`, ячейка = `SalaryLine` + статусы run/line); web `/finance/salary` (finance nav), ссылки: колонка → run, ячейка → `…/payroll/:id#salary-line-…`; деталь run: `id` на строке таблицы salary lines
- 🟢 [x] Partners: **UI ↔ API** выравнивание полей и DTO — M → wire JSON: `level` (Prisma `Partner.type`, REGULAR/PREMIUM), `defaultPercent` строкой `0.00`, ISO `createdAt`/`updatedAt`; `GET /api/partners` фильтр `level` + deprecated `type`; create/update принимают `level` или legacy `type`; валидация enum на API; web: константы `PARTNER_LEVELS`, колонка Level, CSV `level`/`updatedAt`, CRM partner search subtitle; Partner Card / commission policy / accruals — в следующих строках Partners
- 🟢 [x] Partners: **Commission Policy** по Deal Type — M → `PartnerCommissionPolicyRow` (`partner_id`, `deal_type` `DealTypeEnum`, `percent`); `GET/PUT /api/partners/:id/commission-policy` (ровно 4 типа; `percent: null` сбрасывает override → `Partner.defaultPercent`); валидация 0–100; web: карточка на `/partners/[id]`
- 🟢 [x] Partners: **Referral Terms** + фиксация % на сделке — M → `PartnerReferralTerms` (`deal_id` unique, snapshots `deal_type` / `payment_type`, `partner_percent`, `source_policy` POLICY | DEFAULT | OVERRIDE, `override_reason`); авто-sync при create/update сделки (OVERRIDE не пересчитывает %); pre-sync перед stage move если Partner; WON gate для всех типов; `PATCH /api/crm/deals/:id/partner-referral-terms` (`RESET` | `OVERRIDE` + reason ≥3); web: блок в Deal sheet (Marketing) + `dealsApi.patchPartnerReferralTerms`
- 🟢 [x] Partners: **Accrual / Balance / Payout Batch** + связь с Finance journal — L → **срез 1 (PAR-01 classic):**  
  `PartnerAccrual` + статусы; создание при `ORDER FULLY_PAID` + delivery DONE (product/extension) +  
  `Deal.source=PARTNER` + `PartnerReferralTerms`; строка журнала `PARTNER_ACCRUAL` (basis ACCRUAL);  
  триггеры: `PaymentsService`, `ProductsService.complete`, `ExtensionsService.complete`;  
  `GET /api/partners/:id/accruals`. **Срез 2 (PAR-02 subscription):** при `Invoice PAID` типа `SUBSCRIPTION`  
  с `subscriptionId`; база = сумма платежа; заказ `SUBSCRIPTION` + partner deal + terms; разрешение заказа  
  по `invoice.orderId` или `order.findFirst` по проекту (с `subscription.partnerId` при отсутствии order);  
  `PartnerAccrualSubscriptionService` из `PaymentsService`; идемпотентность `paymentId` @unique.  
  **Срез 3 (balance read):** `GET /api/partners/:id/balance` — `groupBy` по статусу, `unpaidTotal` /  
  `paidTotal`; web: сводка на карточке accruals. **Срез 4 (payout batch core):**  
  `PartnerPayoutBatch` + `payout_batch_id` на accruals; `GET/POST /api/partners/:id/payout-batches`;  
  `POST /api/partners/:id/payout-batches/:batchId/approve` создаёт Expense `PARTNER_PAYOUT`;  
  при полной оплате Expense batch и accruals переходят в `PAID`. **Срез 5 (web UI):** карточка партнёра:  
  выбор `ELIGIBLE` accruals → create batch, список batch и approve draft batch. **Срез 6 (manual cancel):**  
  `POST /api/partners/:id/payout-batches/:batchId/cancel` для draft с rollback `IN_BATCH` → `ELIGIBLE`;  
  web: кнопка Cancel в таблице batch. Дальше: hold reason / outbound terms
- 🟢 [x] Partners: outbound terms / service case разделение — M → **срез 1 (foundation):**  
  `PartnerServiceTerm` (partner/client/company/project links, service type, payment model, amount,  
  billing start date, status, optional invoice/subscription links); API:  
  `GET/POST /api/partners/:id/service-terms`, `PUT /api/partners/:id/service-terms/:termId`.  
  **Срез 2 (web + finance materialization):** карточка `Outbound services` на Partner page  
  (list/create terms + action `Create finance`); API:  
  `POST /api/partners/:id/service-terms/:termId/create-finance` (MONTHLY -> `Subscription` type  
  `PARTNER_SERVICE`, ONE_TIME/CUSTOM -> `Invoice` type `SERVICE`, link back to term + status ACTIVE)
- 🟢 [x] Reports: централизованные permissions на источники — M → API `reports` теперь permission-aware: `GET /api/reports/definitions|schedules|saved-views|data-quality-warnings` фильтруют выдачу по `requiredPermissions` каждого `ReportDefinition`; `POST /api/reports/export-jobs|schedules|saved-views` отклоняются с `403`, если нет source-module доступа; `ReportsController` защищён `DASHBOARDS.VIEW`; helper `reports-permissions.ts`
- 🟢 [x] Reports: XLSX/PDF экспорт, retry/cancel, история **экспортов** (без каналов доставки) — L → API: `POST /api/reports/export-jobs/:jobId/retry|cancel`; worker поддерживает `CSV/XLSX/PDF` и не пишет файл для `CANCELLED`; web `/reports` экспорт по форматам `CSV/XLSX/PDF` + кнопки retry/cancel в Export History; Drive history остаётся source-of-truth, каналы доставки вынесены в 2D
- 🟢 [x] Reports: data-quality предупреждения из Marketing и кросс-модульных проекций — M → `GET /api/reports/data-quality-warnings` теперь добавляет runtime warnings (не fake zero) для `marketing-source-performance`, `sales-pipeline-health`, `project-delivery-overview`, `specialist-workload-scorecard`; UI `/reports` Data quality показывает тип источника (definition/runtime) и affected records; выдача остаётся permission-aware через `requiredPermissions`
- 🟢 [x] Marketing: глубина Board / Attribution Review / popup polish из cleanup — M → `marketing/layout.tsx`, board `marketing/page`, `marketing/attribution`, `MarketingLaunchDialog`; CRM `openLeadId`/`openDealId` + `getById` если записи нет в первой странице списка; дашборд: query `dateFrom`/`dateTo` + UI период (week / month / prev / custom / all) по `04-Marketing-Analytics-and-KPI.md`
- 🟢 [x] Marketing: CPL/ROI виджеты только при наличии spend (без фейка) — S → `marketing-dashboard-summary.ts` (`isReliable`, null ROAS/CPL при дырах); web `marketing/dashboard`, `MarketingReportsTab`; `marketing.service.test.ts`
- 🟢 [x] Marketing: List.am ↔ Finance Expense Plan связь до UX канона — S → `MarketingAccountExpensePlanLink`, `load-expense-plans-for-marketing-accounts.ts`, `marketing/settings` (пикер плана + ссылки в Finance); модель линка была, UX доведён под `18-Marketing`
- 🟢 [x] CRM: Offer attachment и deal-required fields — глубина если не закрыта — M → stage-gate hardening (`deal-stage-gate.ts`: blank-proof guard), inline Deal blocker editor в popup (`DealTransitionInlineEditor`, `crm/deals/page.tsx`, `TransitionBlockerDialog`) с `Save / Save and move` для обязательных полей и offer proof
- 🟢 [x] Tasks: выравнивание статусов/enum под канон — M → канонизированы task workflow statuses (`OPEN/IN_PROGRESS/REVIEW/COMPLETED/DEFERRED/CANCELLED`) в shared/frontend/API; добавлена миграция `20260506150000_task_status_canon_alignment` (map `NEW→OPEN`, `DONE→COMPLETED`, default `OPEN`); task actions/kanban/deadline views и completion-rule checks обновлены с backward-compat на legacy `NEW/DONE`
- 🟢 [x] Tasks: шаблоны повторяющихся задач (не Reports) — M → `RecurringTasksService` углублён под канон: строгая валидация расписания (`frequency/interval/daysOfWeek/dayOfMonth/start/end/dueDateOffset`), предсказуемый `nextCreateAt` для `DAILY/WEEKLY/MONTHLY/YEARLY`, пересчёт `nextCreateAt` при update cadence-полей; добавлен unit test `recurring-tasks.service.test.ts`
- 🟢 [x] Projects Hub: linked orders block Transfer→Done — проверка гейтов — M → `Extension` Done gate выровнен с `Product`: при `TRANSFER -> DONE` блокирует не только open tasks, но и finance blockers (`Order.status != FULLY_PAID/CLOSED`, unpaid invoices); ошибки в structured stage-gate формате `EXTENSION_STAGE_GATE_VALIDATION` + тест `extensions.service.test.ts`
- 🟢 [x] Drive: массовые операции / lifecycle из cleanup — M → API: single `restore` + batch `archive/restore` (`/api/drive/files/:id/restore`, `/api/drive/files/archive-batch`, `/api/drive/files/restore-batch`), audit events per file; web `/drive`: multi-select list + bulk actions (`Archive selected` / `Restore selected`) + lifecycle button в detail drawer; tests: `drive.service.test.ts`
- 🟢 [x] Documents: политика retention/export cleanup согласована и внедрена — M → API: `GET /api/documents/:id/export?format=json|html|txt` (`DOCUMENTS.EXPORT`), экспорт логируется в `DocumentActivityEvent` (`action=exported`, metadata format); web activity detail показывает формат экспорта; tests: `documents.service.test.ts`
- 🟢 [x] Credentials: step-up на reveal/copy/export + high-risk уведомления — M → `POST /api/credentials/:id/secrets/reveal|copy` требуют `stepUpPassword` (проверка `Employee.passwordHash` + audit `credential.step_up_verified`), добавлен `POST /api/credentials/export` (step-up + audited `credential.exported`), high-risk in-app notifications `credentials.high_risk_action` для owner/admin/CEO при critical reveal/copy и export; web credential detail запрашивает пароль перед Reveal/Copy; tests: `credentials.service.test.ts`
- 🟢 [x] Credentials: довести list API / health metadata (cleanup PARTIAL) — S → `GET /api/credentials` теперь отдаёт `health` metadata (`status: HEALTHY|DUE_SOON|OVERDUE|UNKNOWN`, `dueInDays`, flags `MISSING_OWNER`/`BROAD_ACCESS` для high/critical рисков); web `/credentials` показывает health badge + flags в колонке Rotation; tests: `credentials.service.test.ts`
- 🟢 [x] Notifications: **пользовательские настройки** каналов/типов событий — M → API: `GET /api/notifications/preferences`, `PATCH /api/notifications/preferences/:eventType` (персональные overrides по `enabled/channels`); runtime `NotificationService.create` уважает user prefs и пропускает in-app delivery если тип отключён или `IN_APP` не выбран; web `/notifications`: блок `Your Notification Preferences` с toggle event type + channel chips (`IN_APP/EMAIL/TELEGRAM/WHATSAPP`)
- 🟢 [x] Notifications: **админ-UI правил** если остаётся в рамках низкой сложности — M → API: `GET /api/notifications/admin/rules`, `PATCH /api/notifications/admin/rules/:code` (enabled/priority/channels, без user overrides `user_pref:`); web `Settings -> Module Settings` показывает `Notification Rules` с inline toggles (enabled, priority, channels)
- 🟢 [x] My Company: Compensation / SOP / KPI Scorecard до глубины канона — L → убраны placeholders и добавлены runtime-страницы: `my-company/compensation` (live employee + base salary coverage + sales bonus policy coverage + links в payroll/policies), `my-company/kpi` (scorecard runtime через `dashboard/control-center` + KPI gate matrix 70/50/0 + module links), `my-company/sop` (SOP library runtime через Documents search `sop`, review queue, section coverage, links в Tasks/Team/Documents). **Граница:** seat-level versioned compensation/process-run persistence остаётся в следующих слоях канона, но экранов-заглушек больше нет.
- 🟢 [x] My Company / header: My Account вне Settings везде — S → `Topbar` получил явный quick action `My Account` (desktop) + dropdown entry; доступ к `/my-account` теперь стабильно из header на любых страницах, без привязки к `Settings`
- 🟢 [x] Technical Infrastructure: связи со Support и мониторинг baseline — M → `GET /api/technical/products/:productId/profile` теперь отдаёт `support` (open/critical incidents + recent incident list по product, category INCIDENT) и `monitoringBaseline` (warning/critical assets, missing owner/credential links, monitoring/backup status); UI Product → Technical (`ReadinessCard`) показывает support+baseline summary и shortcut в `/support`
- 🟢 [x] Technical: Deploy records + backup policies по канону — M → API расширен endpoint-ами `POST /api/technical/products/:productId/deploy-records` и `PATCH /api/technical/products/:productId/backup-policy`, profile response теперь отдаёт `deployment.records` и `backupPolicy` (audit-backed); UI Product → Technical получил блок `Deploy and Backup` для фиксации deploy событий и backup policy (status, policy name, RPO/RTO, restore cadence, notes)
- 🟢 [x] Settings: integration registry + системные списки для новых интеграций — M → `Settings -> Integrations` больше не placeholder: добавлен runtime registry на базе System Lists (`INTEGRATION_PROVIDER`, `INTEGRATION_REQUIRED_SETUP`, `INTEGRATION_REGISTRY_STATUS`) с bootstrap default providers/setup и ручным статусом readiness per provider; `Settings -> Lists` расширен этими ключами для админ-управления и масштабирования под новые интеграции без миграций
- 🟢 [x] RBAC: entity-level глубина где канон требует — M → Drive entity-level enforcement добавлен для DB-backed file APIs: `list/get/preview/link/version/unlink/archive/restore` теперь учитывают `request.permissionScope` (`OWN/DEPARTMENT/ALL`) через owner/creator и department коллег; batch archive/restore тоже scope-aware; закрыт баг where-builder (RBAC + search теперь через `AND`), тесты `drive.service.test.ts` обновлены и расширены
- 🟢 [x] Support: **reopen** как событие/переход, убрать `REOPENED` как постоянный enum при необходимости — M → добавлен `POST /api/support/:id/actions/reopen` (только `RESOLVED/CLOSED -> IN_PROGRESS`), `PATCH /api/support/:id/status` больше не принимает `REOPENED` (явная ошибка с направлением на reopen action), события `support.reopened` и `support.status_changed` пишутся в audit; UI `/support` получил `Reopen` action для закрытых тикетов
- 🟢 [x] Support: waiting overlay (client / third party / escalated) — M → см. срез SLA: `TicketWaitingStateEnum`, `PATCH …/waiting`, UI select + фильтр
- 🟢 [x] Support: change-control представление отдельно от основного потока — M → добавлен отдельный route `GET /support/change-control` (web view) с выделенной очередью `CHANGE_REQUEST`, фокусом на conversion в Extension Deal и отдельной таблицей; в основном `/support` добавлен переход в `Change Control View`, а в Sidebar у Support появились подпункты `Tickets` и `Change Control`
- 🟢 [x] Support: SLA pause / breach / escalation оркестрация — L → `TicketWaitingStateEnum` + `sla_paused_total_seconds` / `sla_pause_started_at`; overlay pauses SLA projection; `PATCH …/waiting`, `POST …/actions/escalate`; `SupportSlaOrchestrationService` + `POST /scheduler/support-sla-escalation` (resolve warning / response & resolve breach in-app); UI waiting select + escalate dialog
- 🟢 [x] Support: связь Ticket → Technical asset / environment — M → `technical_asset_id` / `technical_environment_id` + валидация project/product; `create`/`update`; include в API; UI диалог Context на `/support` (загрузка `GET /technical/products/:id/profile`)
- 🟢 [x] Support: resolution requirements + auto-close после Extension Done где канон — M → `resolution_summary` + `close_reason`; Resolved требует summary; Closed только из Resolved с reason; `PATCH …/complete` extension → `closeLinkedTicketsAfterExtensionDelivered`; audit `support.closed_extension_delivered`
- 🟢 [x] Support: product-context в UI create/filter — M → фильтры Project/Product на `/support` (загрузка продуктов по проекту); диалог New Ticket с project + optional product; API `productId` уже был в list
- 🟢 [x] Finance: убрать legacy `InvoiceStatusEnum` и колонку `Invoice.status` — единый `money_status` — L → миграция `20260506210000_drop_invoice_legacy_status` (backfill `FAIL`→`money_status` `CANCELLED`); API без `PATCH …/status` и без фильтра `status`; web/DTO на `moneyStatus`; после среза **web:** `StatusBadge` variants на credentials/KPI/SOP, `Link`+`buttonVariants` на support (Base UI `Button` без `asChild`), `TechnicalBackupPolicyDraft` + `emptyBackupPolicyDraft` в Product Technical; `pnpm --filter @nbos/api typecheck` и `pnpm --filter @nbos/web typecheck` зелёные
- 🟢 [x] Обновить cleanup registers статусами по мере закрытия срезов — S → **волна 1:** Finance, Support, Partners, Tasks, CRM, Projects Hub (`moneyStatus` cross-refs). **Волна 2 (2026-05-06):** Drive §1 snapshot, Documents B1 wording, Reports §C stale bullets, Marketing B2/B9/§C, Calendar scheduler note, Settings A2, UI Shell A2. **Что формально остаётся:** длинные Phase-backlog блоки в Drive/Documents/Projects Hub — это **план будущих работ**, а не «ошибка статуса»; обновлять при изменении кода. **Блокер «идеального нуля расхождений»:** нет автоматического doc↔code диффа в CI — дальше только ручная сверка после срезов или отдельная задача на doc-lint.
- 🟢 [x] Синхронизировать `docs/дожать до 100% описанного.md` или заменить ссылкой на этот файл — S → **архив** [`Progress Archive/дожать до 100% описанного.md`](Progress%20Archive/дожать%20до%20100%25%20описанного.md) — обзорная матрица (статусы не ведутся); источник задач — `IMPLEMENTATION_PROGRESS.md` / `IMPLEMENTATION_DONE.md` + `*-Cleanup-Register.md`; корневая заглушка **удалена** 2026-05-06 как дубль входных ссылок; в §04 Finance уточнена строка про summary/scheduler и срез `money_status`
- 🟢 [x] Производительность: тяжёлые отчёты только через очередь (контроль) — S → без `REDIS_URL` HTTP не создаёт «висящие» jobs (`503` + сообщение); при сбое `enqueue` job → `FAILED`; cron schedules не продвигаются без dispatch; локально опционально `REPORT_EXPORT_SYNC_FALLBACK=true`
- 🟢 [x] Messenger: поиск/история PostgreSQL — доработка UX при объёме — S → история: по умолчанию **последнее** окно (`before` cursor + `hasMoreOlder`, кнопка «Load older» + сохранение scroll); поиск: только по **видимым** каналам (`listMessengerVisibleChannelIds`, MVP = все каналы); GIN `pg_trgm` на `messenger_*_messages.content`; лимит `pageSize` с `BadRequest` при мусоре
- 🟢 [x] Production hardening: CORS/CSRF и security baseline по `docs/NBOS` / project rules — S → единый allowlist `CORS_ORIGIN` (HTTP + Socket.IO + Messenger WS), в `production` запрет `*` и пустого списка; Helmet без CSP на JSON API + `crossOriginResourcePolicy: cross-origin`; `trust proxy` в prod; глобальный `ThrottlerGuard` + `@SkipThrottle()` на `/health`; 500 в prod без деталей в теле; мутации API — Bearer JWT (cookie CSRF на Nest не применяется; NextAuth — по `TECH_CARD`)
- 🟢 [x] Регрессионные тесты на критичные гейты после крупных срезов — M → `pnpm test:regression` + `vitest.regression.config.ts` (15 файлов / ~223 теста); описание и правило расширения: `[regression-gates.md](./reference/Check/Quality/regression-gates.md)`; попутно починены моки `expenses.service` (addPayment + notify path) и `payroll-bonus-release-paid-mark`
- 🟢 [x] **Delivery Board P0 (реализация)** — L → глобальный маршрут `/delivery-board`, пункт меню и dashboard pin (`open-products` → `/delivery-board`), `DeliveryBoardView` + адаптеры list→board item, Active/Closed, Closed по умолчанию таблица и опциональный Board `Done|Cancelled`, фильтры Closed, drawer деталей с таймлайном stage gate, readiness ring с честным fallback, компактная страница проекта и deep link `?projectId=`; API: опциональное поле `currentStageReadiness` в projection lifecycle. Канон: [`07-Delivery-Board.md`](NBOS/02-Modules/02-Projects-Hub/07-Delivery-Board.md). Код: `apps/web/src/app/(app)/delivery-board`, `apps/web/src/features/projects/components/delivery-board/*`, `apps/api/src/modules/projects/delivery-lifecycle.ts`. Коммиты: `45d5a36e`, `933b9932` (seed для ручного QA).

- 🟢 [x] **Delivery Board P0 — UX дельты, перенесённые из бэклога:** Closed **без DnD** между колонками архива + подпись в UI (`DeliveryBoardClosedFiltersBar`); **MVP фильтра «клиент»** — поиск по имени элемента и проекту в Closed до появления поля компании в list API — S → часть того же среза P0.

- 🟢 [x] **Delivery Board list API — currentStageReadiness:** проекция `{ completed, total }` в `GET /api/projects/products` и `GET /api/projects/extensions` на основе stage-gate смыслов (STARTING поля, открытые tasks/tickets/extensions, TRANSFER/done-прокси); batch `groupBy` для открытых счётчиков — M → `batch-product-open-counts.ts`, `batch-extension-open-task-counts.ts`, `product-current-stage-readiness.ts`, `extension-current-stage-readiness.ts`; расширен `order.invoices` в list includes.

- 🟢 [x] **Delivery Board — фильтр компании (list + Closed):** query `companyId` на `GET /api/projects/products` и `GET /api/projects/extensions` (фильтр по `project.companyId`); в list DTO — `project.companyId` и `project.company { id, name }`; Closed board: селектор Company + клиентский фильтр (`delivery-board-closed-filters.ts`, `DeliveryBoardClosedFiltersBar`); типы web: `apps/web/src/lib/api/products.ts`, `extensions.ts`, `projects.ts` — M

- 🟢 [x] **Professional Delivery Card (UI design spec):** целевой wide drawer shell (паритет с Deal/Lead sheet), sticky header, first-screen working cockpit, focused tabs `Work Space / Calls / Bonus / History`, 2–3 колонки, conditional blocks, responsive и DoD перед кодом Opened Card — M → `docs/NBOS/05-UI-Specifications/07-Professional-Delivery-Card.md`; перекрёстная ссылка в `07-Delivery-Board.md` §8.1

---

## Legacy: снимок репозитория (2026-04-27, бывший DEVELOPMENT_PLAN §2)

Монорепо: `pnpm` + `turbo`, `apps/api` (NestJS), `apps/web` (Next.js App Router), пакеты `packages/database`, `packages/shared`.

**Backend (обзор):** Auth, Employees, Roles, Departments, Invitations; CRM; Projects; Clients; Finance; Tasks, Support, Expenses, Bonus; Credentials, Drive, Notifications, Audit; Automation, Scheduler, Messenger, Partners, System Lists.

**Frontend (обзор):** Dashboard, CRM, Projects, Clients, Finance, Tasks, Support, Bonus, Expenses, Credentials, Drive, Messenger, Calendar, Partners, Settings, auth.

**Вывод:** post-MVP, широкое покрытие модулей; дальнейшая работа — выравнивание поведения с каноном, интеграции, миграция (см. Progress и roadmap).

---

## Legacy: фазы P0–P4 (бывший DEVELOPMENT_PLAN §4)

- **P0** — baseline платформы (scaffold, API+web).
- **P1** — функциональная ширина (основные CRUD/борды).
- **P2** — корректность поведения (гейты, инварианты).
- **P3** — операционное ужесточение (observability, ошибки, автоматизация, аудит).
- **P4** — интеграции и готовность к миграции данных.

Актуальная нарезка по продукту — в `NBOS/00-Implementation-Roadmap.md`.

---

## Legacy: вехи M1–M3 (бывший DEVELOPMENT_PLAN §5, кратко)

- **M1 CRM → Product/Order:** идемпотентность `updateStatus`, `DealWonHandler` + тесты, гейты стадий, регрессия Deal → Order → Invoice.
- **M2 Projects Hub:** снимок проекта products/extensions, гейты продукт/доработка, связь задач, UI на едином снимке.
- **M3 Finance:** синхронизация Payment → Invoice → Order, налоги, биллинг, stats/summary, периоды, expenses, сверка paid/manual PAID.

Полные списки статусов и лог апреля — в [`archive/plans/DEVELOPMENT_PLAN.archived.md`](./archive/plans/DEVELOPMENT_PLAN.archived.md).

---

## Исторический лог (бывший DEVELOPMENT_PLAN §7)

### 2026-04-23

- Continued canonical documentation normalization before next implementation cycle.
- Expanded CRM documentation with stricter stage-gate business rules (marketing attribution mandatory, offer proof, MAINTENANCE deals, deadline semantics).
- Clarified CRM → Finance subscription boundary (first paid invoice, Pending subscription, lifecycle statuses).

### 2026-04-22

- Re-baselined roadmap from init/MVP to broad modules implemented; consolidated plan/progress; delivery artifacts under `docs/execution/`.
- CRM: duplicate WON side effects prevented; DealWonHandler tests; M1/M2 closed; M3 finance work started and advanced (sync, tax, billing, dashboard, stats, periods, reconciliation).

---

## См. также

- [`IMPLEMENTATION_PROGRESS.md`](./IMPLEMENTATION_PROGRESS.md) — активный бэклог
- [`AI-START-HERE.md`](./AI-START-HERE.md)
- [`NBOS/00-Implementation-Roadmap.md`](./NBOS/00-Implementation-Roadmap.md)
- [`PHASE_7_INTEGRATIONS.md`](./PHASE_7_INTEGRATIONS.md)
- [`archive/plans/DEVELOPMENT_PLAN.archived.md`](./archive/plans/DEVELOPMENT_PLAN.archived.md) — полный текст бывшего единого плана
