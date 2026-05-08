# NBOS Implementation Progress

> **Активный бэклог** до полного канона: что делаем и что отложено. Закрытые срезы и история — `[IMPLEMENTATION_DONE.md](./IMPLEMENTATION_DONE.md)`. Детальное поведение — в `docs/NBOS/02-Modules/*`, cleanup registers, тестах и git.

**Обновлено:** 2026-05-09

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

# Блок 2 — Бэклог до полного канона, разбитый по готовности

Каждая строка — отдельная задача. **Порядок глобальный:** сначала то, что закрывается без внешних поставщиков и кредов; затем внутренний фонд интеграций; потом внешние каналы и миграция. **Support (глубокий SLA/overlay)** — после основной массы, как договорено; **ручная приёмка** после каждого логического блока.

**Выполненные пункты** перенесены в `[IMPLEMENTATION_DONE.md](./IMPLEMENTATION_DONE.md)` (блок «Выполненные срезы»).

### Канон и технические решения (вне жёсткой привязки к 2A–2D)

- Закрыть открытые пункты `00-Technical-Decisions-By-Module.md` по мере срезов (FX, dedup notifications, Drive retention, …) — M

## Блок 2A — Реализуем сейчас: внутренний канон без внешних факторов

Это активная очередь. Здесь нет задач, которые требуют токенов, внешних аккаунтов, production cutover или отдельного бизнес-решения.

Закрытые срезы (Delivery Board P0+, Opened Card 1–3, CTB-1 foundation, фильтры board, readiness, спеки карточки) — в `[IMPLEMENTATION_DONE.md](./IMPLEMENTATION_DONE.md)`. Канон: `[07-Delivery-Board.md](NBOS/02-Modules/02-Projects-Hub/07-Delivery-Board.md)`, `[08-Checklist-Template-Builder.md](NBOS/02-Modules/07-My-Company/08-Checklist-Template-Builder.md)`, UI shell — `[07-Professional-Delivery-Card.md](NBOS/05-UI-Specifications/07-Professional-Delivery-Card.md)`. Лента звонков / ATS — **блок 2C**.

- Delivery Card §8: действия стадий в drawer (RBAC/API), если потребует продукт — M
- Delivery Card §8: опционально аудит при deprecated `PATCH …/status` product/extension → terminal — S
- CTB-3 Delivery Board: прогресс checklist requirement на карточке и в drawer рядом с readiness / stage gate — M–L
- CTB-1 дельта: granular permissions по канону §13 (не только COMPANY VIEW/EDIT) — M
- CTB-1 дельта: аудит событий шаблонов / версий / publish — M
- CTB-1 дельта: duplicate, preview, version history в builder UI — M

---

- Ручная приёмка блока «ядро домена» (CRM+Finance+Projects+Partners+Reports) — S
- Ручная приёмка блока «collaboration + credentials + notifications» — S
- Ручная приёмка блока «Support глубина» — S

## Блок 2B — Внутренний фонд интеграций: можно готовить сейчас, без внешних кредов

Эти задачи не подключают реальные внешние сервисы. Они создают безопасный каркас: реестр, статусы, аудит, адаптеры, required setup и документацию для владельца.

Детальный нарез Phase 7 (треки, P0/P1/P2, **таблица статусов срезов §9**) — `[PHASE_7_INTEGRATIONS.md](./PHASE_7_INTEGRATIONS.md)`. Ниже — операционная очередь в терминах продукта; при старте среза обновляйте §9 Phase 7 и по крупной вехе — этот файл.

- Integration foundation: `IntegrationProvider` реестр, статусы, аудит, контракт адаптера — L
- Admin UI: страница статусов интеграций и required setup — M
- Messenger: **ExternalChannelAdapter** контракт + очереди send/receive — L
- Mail: лимиты первичного импорта + retry policy — сначала зафиксировать лимиты, затем реализовать — M
- Mail: многопровайдерность и health dashboard без реального внешнего sync — M
- Settings: required setup / системные списки для интеграций — M
- Документировать для владельца: **какие env/ключи** нужны по каждой интеграции (кроме банка) — S
- Аудит: покрыть новые интеграционные события — M
- Документация runbook на отказ интеграции (fallback вручную) — M
- API: rate limits на публичные integration webhooks — S
- Ручная приёмка блока «интеграционный фонд» — S

## Блок 2C — Внешние факторы: делать только после кредов / аккаунтов / infra

Не держать эти строки в активной ежедневной очереди. Возвращать в работу, когда есть токены, доступы, тестовые аккаунты или подтверждённая инфраструктура.

- Telegram: internal notification channel по канону + явные env/токены — M
- **Телефония / ATS (звонки):** интеграция с внешним приложением звонков или ATS (webhook или API провайдера): приём событий о входящих/исходящих звонках, **нормализация номера** (E.164 / правила компании), **сохранение** записей в NBOS, **сопоставление** с Contact / Deal / Project по телефону и правилам приоритета; затем **лента звонков** в UI (Delivery Card канон §8, карточки CRM и связанные сущности). Требует выбора провайдера/модели, кредов, политики PII/записей; детальный подканон — при старте среза (сейчас в `docs/NBOS` нет отдельного закреплённого документа только под ATS) — **L**
- WhatsApp Gateway + WAHA (VPS): контракт Gateway↔NBOS, health/send/webhook на Gateway, вложения Gateway→NBOS Drive — L
- Support: связь с external messenger conversation — M
- Technical: webhooks GitHub / репозиторий links как интеграция — M
- Observability: связка инцидентов Sentry ↔ Support ticket — M
- Автоматизация сценариев по `docs/NBOS/06-Integrations/05-Automation-Scenarios.md` где зафиксировано в каноне — M
- ⚠️Google: OAuth link scope для Mail/Drive **как в каноне** (без банка) — M
- ⚠️Google Workspace Documents **v2 sync** по `20-Documents/05-` — только после отдельного решения и появления нужных доступов — L
- ⚠️Google Calendar integration (OAuth scope, внутренний foundation, sync) — только при отдельном решении о возврате в scope — L
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
- Marketing: внешние Ads API — только после отдельного решения и появления кредов; не активный срез текущего этапа — L
- Reports: каналы доставки расписаний и delivery-attempt history по получателям — после явного решения о реальной рассылке — M
- Reports: **кросс-модульный реестр** `ReportDefinition` (Phase 7 registry shape) — L
- Delivery Board Project-page filtered reuse: вернуть compact/project-level delivery block только как lazy-loaded reuse of `DeliveryBoardCore` с `projectId` filter, если после P0 станет нужно — M

---

# Блок 3 — Не делаем сейчас / переносим в будущее (≈20 строк)

Список без чекбоксов: это **не** активные задачи текущего этапа. При отмене навсегда — пометить в каноне «won't».

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
- Web: E2E smoke для критичных flow (замена разовому precheck) — L → **в 2D:** до стабилизации UI и критичных маршрутов; контроль сейчас — ручная приёмка (стр. ниже) + `pnpm test:regression`. Поднять после явного решения или когда flow перестанут часто ломаться редизайном.

---

## Текущий фокус (кратко)

| Поле           | Значение                                                  |
| -------------- | --------------------------------------------------------- |
| Режим          | Закрытие **2A → 2B**; 2C только после внешних готовностей |
| Исключения     | Банк; Bitrix mapping/import/cutover после core            |
| Активный 2A    | Список в **§2A** выше (8 строк задач); звонки — **2C**    |
| Архив precheck | `docs/Progress Archive/PHASE_7_PRECHECK_MANUAL_QA.md`     |

---

## Slice DoD (без изменений по смыслу)

- Поведение совпадает с `docs/NBOS` и gates Phase 3/Finance.
- Нет фейковых денег, аудита, кредов и отчётных данных.
- Тесты / typecheck / lint для затронутых областей.
- Доки — по крупным вехам; один коммит в конце среза по возможности.

---

## См. также

- `[IMPLEMENTATION_DONE.md](./IMPLEMENTATION_DONE.md)` — закрытые фазы и срезы
- `[AI-START-HERE.md](./AI-START-HERE.md)`
- `[NBOS/00-Implementation-Roadmap.md](./NBOS/00-Implementation-Roadmap.md)`
- `[Progress Archive/дожать до 100% описанного.md](./Progress%20Archive/дожать%20до%20100%25%20описанного.md)` (архивная матрица; чеклист — **Progress + Done**)
- `[PHASE_7_INTEGRATIONS.md](./PHASE_7_INTEGRATIONS.md)`
- `[archive/plans/DEVELOPMENT_PLAN.archived.md](./archive/plans/DEVELOPMENT_PLAN.archived.md)` — исторический unified plan
