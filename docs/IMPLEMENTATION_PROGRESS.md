# NBOS Implementation Progress

> **Единый источник** прогресса: что закрыто, что делаем до полного канона, что отложено. Детальное поведение — в `docs/NBOS/02-Modules/*`, cleanup registers, тестах и git.

**Обновлено:** 2026-05-05 (Tasks: фильтр/контекст по Order на проекте; Wallet in-app)

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

Один источник правды: `docs/NBOS/03-Business-Logic/03-Bonus-Payroll-Logic.md`. Там: **две независимые ставки** Seller % и Assistant % от базы (**Classic** = общая сумма заказа, **Subscription** = сумма 1-го месяца); строка политики выбирается по `**From`** на сделке; ставки **в БД и UI**, редактируемые; начисление с **первого `Paid`**, идемпотентно; **KPI\*\* — к выплате. Реализация в коде — задачи в блоке 2.

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

## Блок 2 — Бэклог: делаем до полного канона + дельта (~99 строк)

Каждая строка — отдельная задача. **Порядок глобальный:** сначала целостность домена и канона, затем интеграционный фонд (без банка), затем углубление модулей; **Support (глубокий SLA/overlay)** — после основной массы, как договорено; **ручная приёмка** после каждого логического блока.

**🟢 Уже сделано:** у таких строк в начале стоит **🟢** (и чекбокс `[x]`) — быстро видно, что срез уже в репозитории/каноне.

- 🟢 [x] Сводная таблица переходов Lead → Deal → Order → Project в одном каноническом документе — M → `docs/NBOS/03-Business-Logic/00-Lead-Deal-Order-Project-Transition-Matrix.md`
- 🟢 [x] Пауза/штрафы подписки при задержке сдачи — правила в каноне и в runtime — M → `04-Subscription-Billing-Logic.md` § пауза; `billing-subscription-delivery-pause.ts` + `BillingService.runMonthlyBilling`
- 🟢 [x] Создание **Deal без Lead** — backend, UI, валидация, аудит — M → `deal-create-validation.ts`, `DealsService.create` + audit `DEAL_CREATED`, `CreateDealDialog`, матрица §8
- 🟢 [x] Воронка Lead: статус/колонка **On Hold** после New — M → `LeadStatusEnum.ON_HOLD`, миграция `20260505143000_lead_status_on_hold`, `LEAD_STAGES`, `leads.service`, `02-Lead-Pipeline.md`, матрица §2
- 🟢 [x] Поле «название обращения = продукт/услуга» на Lead — S → `Lead.name` / `Deal.name` при конверсии; гейт в `lead-conversion.service`, SQL в UI (`LeadTransitionInlineEditor`, `leads/page`, `CreateLeadDialog`, `LeadSheet`), `02-Lead-Pipeline.md`
- 🟢 [x] Двухуровневая атрибуция (верхний канал + зависимый список) + справочники в Marketing Settings — L → `MarketingCrmWhereOption` + seed; `GET/PATCH …/crm-where-options`; CRM UI через `useCrmMarketingWhereOptions`; блок в `marketing/settings`; **Pending:** отдельные каналы Instagram/Facebook вместо одного `META_ADS`, Sales Where из БД, Website/SEO подканоны из канона
- 🟢 [x] Deal: роль **ассистента продаж** (поля, борд, карточка) — M → `seller_assistant_id` + `DealSellerAssistant`; API create/update; `DealCard` / `DealContactTeamSection` / `CreateDealDialog`; валидация employee в `deal-create-validation`
- 🟢 [x] Бонус: движок **независимых ставок** Seller/Assistant по `From` + Classic/Subscription база + snapshot + UI/БД политики — по `03-Bonus-Payroll-Logic.md` — L → `sales_bonus_policies` + миграция `20260505201000_sales_bonus_policy_and_accrual`; `SalesBonusAccrualService` (хук из `PaymentsService` при `PAID`); `GET/PATCH /api/bonus/sales-policies` (+ `:id` на PATCH); UI `/my-company/sales-bonus-policies`; **Подписка 2+:** `SUBSCRIPTION_RECURRING` + миграция `20260505250000_sales_bonus_subscription_recurring`, начисление с каждого последующего оплаченного инвойса (база = сумма инвойса), идемпотентность `sales_accrual_invoice_id`, дефолт ставок 0% до настройки в UI
- 🟢 [x] Бонус: удалить legacy `HOLDBACK` / `holdbackPercent` / `holdbackReleaseDate` и заменить project-pools API/UI на **product-level roll-up** — M → миграция `20260505213000_bonus_remove_holdback_status_enum_trim`; `GET /api/bonus/products/pools` + `foldBonusProductPools` / `getProductPools`; UI `/finance/bonus-pools` + CSV `export-bonus-product-pools-csv`; таблица `**product_bonus_pools`** + sync; миграция `20260505230000_bonus_release_ledger` + `**bonus_releases**`; `GET/POST /api/bonus/entries/:entryId/releases`+`BonusReleaseService`; `totalReleasedAmount`из сумм релизов (APPROVED / INCLUDED_IN_PAYROLL / PAID);`POST /api/payroll-runs/:id/bonus-releases/attach`+`attachBonusReleasesToPayrollRun`(DRAFT/REVIEW →`SalaryLine.bonusesTotal`, статус релиза INCLUDED_IN_PAYROLL); `**availableFunding`/`overFundingAmount**`из суммы`Payment` по инвойсам заказа; **AUTO-релиз** пропорционально по `DELIVERY`/`PM`/`DESIGN` при `Product`/`Extension` **DONE** (`tryCreateProportionalAutoReleases`, хуки `PaymentsService` create/delete, `ProductsService.complete`, `ExtensionsService.complete`); синк `**BonusEntry.status`** с counting-релизами (`refreshBonusEntryStatusAfterReleasesChange`, конец `syncProductBonusPoolForOrder`); `**POST /api/payroll-runs/:id/bonus-releases/detach**` (откат INCLUDED→APPROVED + строки зарплаты); при **полной оплате** salary line из expense (`syncSalaryLinePaidFromExpenseLedger`) — `markPayrollBonusReleasesPaidForSalaryLine`: релизы **INCLUDED_IN_PAYROLL→PAID**, `BonusEntry`→**PAID** если сумма PAID-релизов ≥ planned, resync пула заказа; `**PATCH /api/bonus/entries/:entryId/releases/:releaseId`** (`patchForEntry`) — корректировка суммы **DRAFT**/**APPROVED** (AUTO→**CORRECTION** + reason, cap по entry); UI: bonus board → карточка → ledger (подпись SALES: classic / 1st invoice / month 2+ + CSV); **KPI к выплате:** `20260505240000_payroll_sales_kpi` — поля плана/факта на `PayrollRun`, `payroll_included_amount` на релизе, `PATCH /api/payroll-runs/:id`, коэффициент 100%/50%/0% для **SALES** при attach (пороги 70%/50% по канону); UI sales KPI на `/finance/payroll/[id]` + `includedBonusReleaseCount` в деталке run; подсказка факта: сумма `Payment` по `paymentDate` в UTC-месяце run (`kpiSalesActualSuggestedAmount` в `GET /api/payroll-runs/:id`) + кнопка подстановки в UI
- 🟢 [x] Правило минимума первого платежа (10% classic / первый месяц subscription) — инвойс-логика — M → `assertFirstInvoiceMinimums` + `invoice-first-payment-minimums.constants.ts` в `InvoicesService.create`; тесты в `invoices-create.service.test.ts`
- 🟢 [x] Задачи: фильтр и контекст по **Order** внутри проекта — M → `GET /api/tasks?projectId&orderId`, `task-project-list-filter.ops.ts` / `task-find-all-paginated.op.ts`; карточка Tasks на `/projects/[id]`, query `taskOrder`, `TaskSheet` + `resolveTaskOrderContext`
- CRM: довести direct actions и create-flows где сейчас только «open target» — M
- [🔴](https://emojinarium.com/ru/red-color/) Projects Hub: закрыть оставшиеся пункты cleanup (гейты QA/Transfer по задачам и др.) — M
- Clients: сверка `05-Clients-Process-Flow` с UI/API, закрыть разрывы — M
- Finance: **Operational Journal**, period close, связь агрегатов с журналом — L
- Finance: перестройка UI вокруг Invoice Card / планов расходов / досок канона — L
- Finance: summary + scheduler без «старых» семантик статусов — M
- Finance: уведомления/напоминания по правилам invoice card, не по legacy board — M
- Finance: partial outgoing payments (expense/salary) если в каноне — M
- Finance: Employee Wallet read-модель до полноты канона — M → частично: wallet API/UI — rollups, Next Payroll, project breakdown, **Recent activity** (релизы/выплаты/closed payroll); **in-app** по событиям кошелька (`finance.wallet.*`, `notification-rules.ts` + хуки bonus/payroll/expense/payments/products/extensions); push/внешние каналы по тем же событиям — отдельно, если понадобятся
- Partners: **UI ↔ API** выравнивание полей и DTO — M
- Partners: **Commission Policy** по Deal Type — M
- Partners: **Referral Terms** + фиксация % на сделке — M
- Partners: **Accrual / Balance / Payout Batch** + связь с Finance journal — L
- Reports: **кросс-модульный реестр** `ReportDefinition` (Phase 7 registry shape) — L
- Reports: централизованные permissions на источники — M
- Reports: XLSX/PDF экспорт, retry/cancel, история доставки расписаний — L
- Reports: data-quality предупреждения из Marketing и кросс-модульных проекций — M
- Integration foundation: `IntegrationProvider` реестр, статусы, аудит, контракт адаптера — L
- Admin UI: страница статусов интеграций и required setup — M
- Telegram: internal notification channel по канону + явные env/токены — M
- Messenger: **ExternalChannelAdapter** контракт + очереди send/receive — L
- WAHA / WhatsApp Web path: health, send, webhook receive, вложения через Drive — L
- Google: OAuth link scope для Mail/Calendar/Drive **как в каноне** (без банка) — M
- Google Calendar **sync** (если остаётся в каноне как цель этапа) — L
- Google Workspace Documents **v2 sync** по `20-Documents/05-`\* — L
- Mail: лимиты первичного импорта + retry policy (зафиксировать и реализовать) — M
- Marketing: глубина Board / Attribution Review / popup polish из cleanup — M
- Marketing: внешние Ads API только после кредов — отдельный срез после фонда — L
- Tasks: выравнивание статусов/enum под канон — M
- Tasks: шаблоны повторяющихся задач (не Reports) — M
- Drive: массовые операции / lifecycle из cleanup — M
- Documents: избранное и расширенная RBAC секций при необходимости канона — M
- Credentials: step-up на reveal/copy/export + high-risk уведомления — M
- Credentials: довести list API / health metadata (cleanup PARTIAL) — S
- Notifications: **пользовательские настройки** каналов/типов событий — M
- Notifications: **админ-UI правил** если остаётся в рамках низкой сложности — M
- My Company: Compensation / SOP / KPI Scorecard до глубины канона — L
- My Company / header: My Account вне Settings везде — S
- Technical Infrastructure: связи со Support и мониторинг baseline — M
- Settings: integration registry + системные списки для новых интеграций — M
- Dashboard: production кэш/refresh виджетов при появлении требований — S
- RBAC: entity-level глубина где канон требует — M
- Документировать для владельца: **какие env/ключи** нужны по каждой интеграции (кроме банка) — S
- Закрыть открытые пункты `00-Technical-Decisions-By-Module.md` по мере срезов (FX, dedup notifications, Drive retention, …) — M
- Support: **reopen** как событие/переход, убрать `REOPENED` как постоянный enum при необходимости — M
- Support: waiting overlay (client / third party / escalated) — M
- Support: change-control представление отдельно от основного потока — M
- Support: SLA pause / breach / escalation оркестрация — L
- Support: связь Ticket → Technical asset / environment — M
- Support: связь с external messenger conversation — M
- Support: resolution requirements + auto-close после Extension Done где канон — M
- Support: product-context в UI create/filter — M
- Ручная приёмка блока «ядро домена» (CRM+Finance+Projects+Partners+Reports) — S
- Ручная приёмка блока «интеграции» — S
- Ручная приёмка блока «collaboration + credentials + notifications» — S
- Ручная приёмка блока «Support глубина» — S
- Обновить cleanup registers статусами по мере закрытия срезов — S
- Синхронизировать `docs/дожать до 100% описанного.md` или заменить ссылкой на этот файл — S
- Bitrix: **только после** пунктов выше — mapping register + dry-run контракт — L
- Bitrix: импорт Contacts/Companies (CSV или API) — после mapping — L
- Bitrix: остальные сущности по `07-Migration/`\* — L
- Регрессионные тесты на критичные гейты после крупных срезов — M
- Производительность: тяжёлые отчёты только через очередь (контроль) — S
- Аудит: покрыть новые интеграционные события — M
- Документация runbook на отказ интеграции (fallback вручную) — M
- Finance: заменить legacy `InvoiceStatusEnum` на модель Invoice Card целиком — L
- Finance: поля coverage подписок и сетка под канон — M
- Finance: автоматический bonus release после Done продукта + override — M
- Finance: Expense Backlog автоматизация и уведомления по канону — M
- Finance: Client Service Record — полнота связей invoice/expense/task — M
- Marketing: CPL/ROI виджеты только при наличии spend (без фейка) — S
- Marketing: List.am ↔ Finance Expense Plan связь до UX канона — S
- CRM: Offer attachment и deal-required fields — глубина если не закрыта — M
- Projects Hub: linked orders block Transfer→Done — проверка гейтов — M
- Calendar: внешние слои после внутреннего sync-контракта — M
- Messenger: поиск/история PostgreSQL — доработка UX при объёме — S
- Mail: многопровайдерность и health dashboard — M
- Technical: Deploy records + backup policies по канону — M
- Technical: webhooks GitHub / репозиторий links как интеграция — M
- API: rate limits на публичные integration webhooks — S
- Web: E2E smoke для критичных flow (замена разовому precheck) — L
- i18n: глубина UI по `20-i18n` если вошло в scope продукта — L
- Observability: связка инцидентов Sentry ↔ Support ticket — M
- Documents: политика retention/export cleanup согласована и внедрена — M
- Drive: дедупликация/квоты если канон потребует — M
- Partners: outbound terms / service case разделение — M
- Payroll: полнота Salary Board / Payroll Run под `05-Bonus-and-Payroll` — M
- Автоматизация сценариев по `docs/NBOS/06-Integrations/05-Automation-Scenarios.md` где зафиксировано в каноне — M
- Production hardening: CORS/CSRF и security baseline по `docs/NBOS` / project rules — S

### Блок 2 — Pending (очередь сразу после закрытия чеклиста блока 2)

**Назначение:** сюда переносятся только пункты, по которым работа **уже начата**, но срез **нельзя закрыть сейчас** — с явной причиной, блокером и условием возврата в работу. Обычные невыполненные строки выше **не дублировать**: это просто «очередь ещё не дошла».

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
- **Meta / Facebook / Instagram** lead ads API без утверждённых business-кредов — позже.
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

| Поле           | Значение                                              |
| -------------- | ----------------------------------------------------- |
| Режим          | Закрытие **блока 2** сверху вниз + приёмка            |
| Исключения     | Банк; Bitrix cutover последним                        |
| Архив precheck | `docs/Progress Archive/PHASE_7_PRECHECK_MANUAL_QA.md` |

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
