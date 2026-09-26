# Промпт для Cursor — полная последовательная реализация

Скопировать блок ниже в Cursor, открытый в репозитории NBOS. Это запрос на реализацию всего описанного пакета, а не на повторное обсуждение концепта.

```text
Ты работаешь в NBOS как senior developer и архитектор. Реализуй полностью Delivery Compensation v2: Каталог функций, Конфигуратор продукта, базовые нормативы/тарифы, плановые бонусы, изменения scope/команды, Wallet/Finance integration и отдельный From=Network.

Начни с AGENTS.md и docs/TECH_CARD.md. Прочитай полностью:
1. docs/implementation/delivery-compensation/README.md
2. docs/NBOS/03-Business-Logic/11-Delivery-Compensation-Configurator.md
3. docs/NBOS/05-UI-Specifications/15-Delivery-Function-Catalog-and-Configurator.md
4. docs/implementation/delivery-compensation/01-TECHNICAL-CONTRACT.md
5. docs/implementation/delivery-compensation/02-PHASES-AND-SLICES.md
6. docs/implementation/delivery-compensation/03-ACCEPTANCE-AND-ROLLOUT.md
7. docs/implementation/delivery-compensation/04-CATALOG-BOOTSTRAP.md
8. docs/implementation/delivery-compensation/06-CANON-RECONCILIATION.md

Затем изучи существующий код затрагиваемых модулей и применимые .cursor/rules. Новый бизнес-канон от 2026-09-18 заменяет старые правила delivery расчёта, developer split 70/30 и Bonus tab внутри Delivery. Остальная платформа сохраняется. Не запускай project-onboarding.

Работай последовательно S00 → S18, фаза за фазой, slice за slice. Не останавливайся после схемы, mock-экранов или промежуточного MVP. Конечная цель — работающий полный поток Product и Extension до фактической выплаты в существующем ledger.

После каждого slice:
- выполни подходящие проверки, targeted tests, typecheck/lint и Prettier на touched files;
- обнови статус/evidence/checkpoint в 02-PHASES-AND-SLICES.md;
- перечисли реальные ограничения, не выдавая непройденную проверку за успешную.

После каждой фазы проведи отдельный review диффа по .agents/skills/code-review/SKILL.md, исправь замечания и повтори нужные проверки. Используй verify-before-completion; для schema/migrations — safe-database-migration; для permissions, денежных mutations и uploads — security-review. Перед применением прочитай соответствующие skills. На фазах UI выполни browser verification реальных экранов, а не только component snapshots.

Сразу переходи к следующему этапу без вопросов «продолжать?». Обычные технические детали решай самостоятельно в рамках канона. Останавливай только работу, для которой действительно не хватает полномочий/необходимого бизнес-решения/инфраструктуры; независимые этапы продолжай. После compaction сначала прочитай checkpoint и продолжай с незавершённого slice, не начинай заново.

Непереговорные правила:
- Base units отдельны от extra-function units. Included-in-base функция видима, но повторно денег не добавляет.
- Units/rates только CEO/Owner; same-role rate одинаков для сотрудников. Команда не получает их в JSON, SSR, audit, exports или notifications.
- В Product/Delivery нет бонусных денег. Там scope/исполнители/инструкции. Личные суммы сотрудника — только Wallet; Finance остаётся финансовым рабочим местом разрешённых ролей.
- Не создавать обязательный R&D/unknown-task/automation-bonus workflow. Обычная задача может не давать отдельного бонуса. Draft функции без units не обязывают PM обращаться к Owner.
- Три design modes: AI, Concept, Full; AI с Designer требует явной роли Reviewer, иначе смены режима.
- План создаётся один раз при первом Development, атомарно со стадией. Starting не начисляет. Retry/возврат стадии не дублируют бонус.
- После старта новые функции обновляют только свои компоненты, старые rates/sums заморожены. Изменение инструкции не меняет деньги.
- При замене сотрудника после плана распределение обязательно вручную, поля пустые, никаких 0/100 или 50/50 defaults. Один backend command для всех entry points.
- Сохраняй принятую работу, releases, payroll и payments; нельзя пересчитывать уже выплаченное или удалять ledger.
- Новая модель не меняет Sales KPI, funding, cap/carry или monthly payroll policy. Проверь совместимость earnedPeriod, ранних releases и позднего funding; не подменяй даты ради прохождения фильтров.
- Network — новый From, 4%+1% Classic, 40%+10% первый subscription invoice, 0%+0% recurring. Старый Sales channel NETWORKING не мигрировать. Другие Sales rates не перетирать.
- Реальные units/rates владелец настроит после разработки. Не выдумывай production-цены; seed draft каталога + отдельные synthetic test fixtures. Отсутствие реальных чисел не блокирует реализацию/тесты, но блокирует включение неполной модели на реальных новых продуктах.
- Существующие продукты остаются legacy/skip, adoption только явно и с проверкой уже созданных бонусов.
- Не внедряй ежемесячный SEO/maintenance, калькулятор клиентской цены/себестоимости, credential links или новый стек: они вне текущего scope.

Сохраняй пользовательские изменения. Не делай commit/push/PR без отдельного прямого запроса. Не выполняй production migration, deployment, db push/reset или удаление данных. Миграции проверяй только на подтверждённой безопасной test/local БД; не считай любую найденную .env локальной. Не ослабляй проверки/permissions, чтобы получить зелёный результат.

В финале дай краткий отчёт: завершённые фазы, реальные проверки и review, что не проверено, какие миграции только подготовлены/проверены локально, какие нормативы Owner должен заполнить через готовый UI и где находится runbook. Обнови реализационный журнал, не помечая production запуск выполненным.
```
