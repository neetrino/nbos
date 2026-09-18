# Приёмка, regression matrix и запуск

Все сценарии ниже — требования к будущей реализации, НЕ выполненные тесты. [Фазы](02-PHASES-AND-SLICES.md), [контракт](01-TECHNICAL-CONTRACT.md).

## 1. Числовые fixtures

Только synthetic test data; никогда не публиковать эти суммы как коммерческие нормы.

Base: Backend 100 units × 1 000 AMD, Frontend 50 × 800, PM 20 × 900, Designer 30 × 700, QA 10 × 600, Tech 5 × 500. Итого база 187 500 AMD.

Extra Warehouse: Backend 10 × 1 000 = 10 000, Frontend 5 × 800 = 4 000, QA 2 × 600 = 1 200; остальные роли явно not-applicable. Итого 15 200; база + extra = 202 700.

Bank с собственными положительными units включён в base-profile A, не включён в B. Проверка inclusion не должна зависеть от величины его price vector.

Второй тариф Backend = 1 200 AMD/unit действует только на новые components. Новая функция Backend 10 units после изменения даёт +12 000; первоначальные 100 000 за базу не меняются.

## 2. Calculator

| ID | Сценарий | Ожидаемый результат |
| --- | --- | --- |
| C01 | Только база | 187 500, сумма по 6 ролям; не считать цену заказа |
| C02 | Bank included | 187 500; функция видима, добавка 0 |
| C03 | Extra Warehouse | 202 700, изменились только 3 роли |
| C04 | Bank extra для B | Добавляется по price vector ровно один раз |
| C05 | Один сотрудник Backend+Frontend | Свои 140 000 по базе, нет 70/30 и нет потери роли |
| C06 | null vs zero | null блокирует publish/Development; явный zero допустим, не создаёт положительное денежное обязательство |
| C07 | Backend тариф стал 1 200, add 10 units | +12 000; старый base остаётся 100 000 |
| C08 | AI/Concept/Full/AI Reviewer | Разные утверждённые base vectors; назначение Designer без выбора Reviewer/режима отклоняется |
| C09 | Decimal 10.01 разделить вручную 33/67 | Сумма сохранена 10.01; детерминированное округление, не float drift |
| C10 | Прежняя функция 50 → новая 5 units | Новый продукт получает 5; старый 50; дополнительный maturity multiplier отсутствует |

## 3. Lifecycle и scope

| ID | Сценарий | Ожидаемый результат |
| --- | --- | --- |
| L01 | Save Starting draft | Нет BonusEntry/кошелька/release |
| L02 | Первый Development | Один snapshot и один набор плановых allocations/entries; Wallet показывает прогноз |
| L03 | Два параллельных перехода / retry | Один initial plan, нет дублей; DB integration test |
| L04 | Fail между plan write и stage write | Полный rollback; ни частичной стадии, ни частичного бонуса |
| L05 | Back to Starting → Development; pause/resume | Исходный план не повторяется, financial dates не сбрасываются |
| L06 | Нет required employee/rate/profile/checked scope | Переход заблокирован безопасным сообщением, без hidden amounts |
| L07 | Legacy status PATCH / automation / Extension | Нельзя обойти те же gates или создать второй бонус |
| L08 | Добавить опубликованную функцию после выполнения работы в ACTIVE | Новая revision, бонус только затронутым получателям, без CEO запроса units |
| L09 | Два scope edits на одной версии | Один commit, второй 409; никакого lost update |
| L10 | Удалить невыполненную extra; затем повторно добавить | Без двойной оплаты принятого/сохранённого, история доступна |
| L11 | Отмена при частично принятой работе | Принятая часть сохранена, невыполненное убрано; не auto Done release |
| L12 | Done/Cancelled, archive function/profile | Scope read-only, historical content/snapshots существуют; денег не теряет |
| L13 | Reference product copy | Копируются scope parameters, используются текущие norms; нет копии денег, людей, notes/credentials |
| L14 | Небольшая уникальная Task вне каталога | Никакого обязательного units placeholder, бонус не создаётся автоматически |

## 4. Перераспределение

| ID | Сценарий | Ожидаемый результат |
| --- | --- | --- |
| H01 | Замена в Starting до плана | Обычный team update |
| H02 | Замена после плана из Delivery | Modal с пустыми обязательными долями по базе и extras |
| H03 | Та же замена из Product/Extension или direct PATCH | Один контракт; direct bypass отклонён |
| H04 | Empty/negative/>100/NaN/sum≠100 | 400/validation; ничего не записано |
| H05 | Вручную 40/60 у Backend базы 100 000 | 40 000 прежнему, 60 000 новому; общий итог тот же |
| H06 | Второй handover 50/50 от доли 60 000 | Первый сохраняет 40 000; второй 30 000, третий 30 000 |
| H07 | Уже оплачено/в payroll/carry зарезервировано | Нельзя передать protected amount, нет deletion/negative fake payment; безопасный error |
| H08 | Cancel modal/concurrent scope change | Old assignee не меняется; stale revision 409, без частичной смены |

## 5. Finance и Wallet

| ID | Сценарий | Ожидаемый результат |
| --- | --- | --- |
| F01 | Plan → pool → wallet | План посчитан один раз, не plan+entry вдвойне |
| F02 | Done funded | Existing proportional release и статусы, без выплаты напрямую |
| F03 | Done M, first funding M+1, rest M+2 | Остаток не теряется и не оплачивается дважды; earnedPeriod не переписан сегодняшней датой |
| F04 | Early/extra/over-funding | Сохраняются существующие actor/reason/funding checks |
| F05 | Cap и FIFO carry | Граница применяется существующим способом ко всему salary-line bonus; carry не сгорает |
| F06 | Approve payroll → Expense → partial/full ExpensePayment | paid/remaining и release paid marks соответствуют ledger |
| F07 | QA и Tech | Есть в pool, matrix linking, employee history, Wallet и reports; корректный role label |
| F08 | Generated entry + manual adjustment + scope change | Причина и исходный snapshot сохранены, adjustment не затёрт, дублей нет |
| F09 | Existing SALES + legacy/manual DELIVERY | Старые расчёты и KPI поведение неизменны, включая shared employee cap |
| F10 | Валюта профиля несовместима с AMD пути | Нет silent currency mixing; явная readiness error |
| F11 | Уже выдан manual bonus за ту же связанную работу | Нет автоматической повторной выплаты при добавлении каталожной функции; Finance разрешает overlap |
| F12 | Большая история / pagination / export | Итог Wallet не равен случайно только первой странице, приватные snapshots не экспортируются |

## 6. Security и UI

- A01: Owner/CEO меняет units; PM, Finance, Developer, content editor получают отказ даже прямым API и mass assignment.
- A02: разрешённый редактор меняет инструкцию, но не financial versions/base membership/rates.
- A03: команды и GET проверяют Product/Extension scope; чужой object id, source copy, feature assignment id не обходят ACL.
- A04: operational list/detail/config/history/errors/SSR/websocket/client cache не содержат units/rates/чужие суммы.
- A05: employee Wallet получает только own amounts; query employeeId не позволяет impersonation; Finance permissions не дают pricing-rule management автоматически.
- A06: attachment preview/download проверяет ACL; link не расширяет права; rich text XSS, javascript URL и HTML sanitization проверены.
- U01: Product и Delivery используют один конфигуратор; отсутствует Bonus tab/денежный summary и старый скрытый fetch этих данных.
- U02: included функции активны, extras добавляются через searchable icon cards; инструкция в sheet, dirty draft/focus сохраняются.
- U03: AI Designer conflict объяснён понятным текстом; только 3 design options.
- U04: ручное распределение не предзаполнено ни UI, ни server default, включая 0/100.
- U05: responsive desktop/mobile, keyboard navigation, loading/empty/error/forbidden/archive/409, EN/RU/HY.
- U06: Function catalog доступен разрешённому сотруднику без открытия чужого HR; pricing tab не запрашивается пользователем без прав.

## 7. Network

- N01: Network выбирается в Lead/Deal, проходит validation, conversion, persistence, filtering/report labels.
- N02: Classic invoice-trigger 1 000 000 AMD → Seller 40 000 + Assistant 10 000. Без частичной оплаты как нового trigger, если existing sales требует PAID invoice.
- N03: Subscription first invoice 100 000 → 40 000 + 10 000; recurring default 0+0. Повтор PAID event не дублирует.
- N04: один сотрудник Seller+Assistant сохраняет обе доли согласно существующему engine; остальные sources неизменны.
- N05: SALES channel NETWORKING не переименован/не мигрирован автоматически; seed Network повторяемый и не перетирает изменённые Owner rates.

## 8. Runbook локальной приёмки

1. Подтвердить disposable/test PostgreSQL target без вывода password/connection URI. Не применять migration к случайной `.env` базе.
2. Прогнать upgrade миграций с representative legacy records, validate/generate и backend checks.
3. Загрузить изолированные synthetic base/rate/function fixtures; авторизоваться отдельными Owner/PM/Developer/Finance тестовыми пользователями.
4. Owner настраивает каталог; PM в Starting собирает Product, Development создаёт план; проверить Wallet у нескольких людей.
5. Добавить extra, заменить получателя с пустыми полями, отменить невыполненную часть, проверить ревизии/отсутствие лишних денег в Delivery.
6. Выполнить Done, поступления тестового клиента, release/payroll approval, частичную и полную выплату; повторить с Extension, поздним funding и cap.
7. Повторить direct API негативные кейсы и concurrent writes.
8. Создать Network сделку и проверить обе модели Sales на test invoice.
9. Финальные checks/builds/browser review; отметить всё непройденное честно.

## 9. Readiness реального запуска (оператор, не автоматический Cursor deploy)

- Схема additive и SQL проверены; миграции с NETWORK корректно разделены, rollback/forward fix известен.
- Published AMD tariffs существуют для всех используемых ролей; base profiles и extras complete; draft seed не используется как реальный прайс.
- Owner проверил исходные коммерческие значения. Ещё не назначенные функции можно оставить draft, они не мешают опубликованным продуктам.
- Роли/permissions проверены реальными аккаунтами; инструкция не содержит credentials/личных зарплат.
- Новый cutover/enrollment включается только после backend+UI readiness; legacy products сохраняют прежний режим.
- Планы не создаются общей миграцией всех продуктов. Если нужен импорт, сначала dry-run selected ids, mapping и duplicate/released/paid checks, затем отдельное явно разрешённое применение.
- При отключении new enrollment существующие начисления/Wallet/выплаты остаются доступными.
- Настроены диагностика ошибок materialization и consistency report; нет silent catch для обязательного начисления.

## 10. Формат финального отчёта Cursor

Перечень завершённых фаз; ссылки на журнал/evidence; проверки и их результаты; migration status отдельно для local и production; роль-в-роль UI walkthrough; отсутствующие реальные business settings; известные ограничения; точные следующие operator actions. Не писать «всё готово», если ledger flow или authorization проверены только по мокам.
