# Бонусы, зарплата и payroll (Bonus, Salary & Payroll)

## Общая концепция

Этот контур отвечает за мотивацию сотрудников и выплаты:

- фиксированная зарплата;
- бонусы;
- KPI-влияние;
- месячный зарплатный расчёт;
- частичные и полные выплаты;
- read-only кошелёк сотрудника.

Главное разделение:

| Слой                   | Русское название            | Где живёт              |
| ---------------------- | --------------------------- | ---------------------- |
| `Compensation Profile` | Профиль оплаты сотрудника   | My Company / Team      |
| `Bonus Entry`          | Бонусная запись             | Finance                |
| `Payroll Run`          | Зарплатный расчёт за месяц  | Finance                |
| `Salary Line`          | Строка сотрудника в payroll | Finance                |
| `Expense Card`         | Карточка расхода на выплату | Expenses               |
| `Employee Wallet`      | Кошелёк сотрудника          | Read-only Finance view |

`Finance` не должен быть местом, где придумываются роли, уровни и правила мотивации. Эти настройки живут в `My Company`. Finance использует их для расчёта и выплаты.

---

## Policy Engine / Движок правил мотивации

Бонусы и KPI нельзя строить как набор жёстко прописанных процентов только для продавцов. В NBOS должна быть универсальная система правил, которая работает для всех отделов, ролей, уровней и конкретных сотрудников.

Правильное разделение:

| Слой                    | Русское название         | Смысл                                                               |
| ----------------------- | ------------------------ | ------------------------------------------------------------------- |
| `Bonus Policy Engine`   | Движок бонусных правил   | Кодовый механизм расчёта, проверки условий и audit                  |
| `Bonus Policy Template` | Шаблон бонусного правила | Безопасный тип правила: sales, delivery, marketing, support, manual |
| `Bonus Policy`          | Активное правило бонусов | Настройка для отдела, позиции, уровня или сотрудника                |
| `KPI Policy Template`   | Шаблон KPI               | Типовые KPI для роли или отдела                                     |
| `KPI Policy`            | Активное правило KPI     | Какие KPI применяются и как они влияют на выплату                   |
| `Compensation Profile`  | Профиль оплаты           | Фикс, валюта, активные bonus/kpi policies конкретного сотрудника    |
| `Bonus Entry`           | Бонусная запись          | Конкретный бонус по сотруднику, проекту, заказу или ручному решению |
| `Bonus Release`         | Выпуск бонуса к выплате  | Решение включить часть бонуса в конкретный payroll                  |

### Что должно быть в коде

В коде должны жить:

- типы правил и порядок расчёта;
- проверка условий: оплата, сдача проекта, KPI, holdback, clawback;
- защита от двойного начисления;
- расчёт доступного проектного фонда;
- audit и versioning правил;
- невозможность случайно выплатить больше без явного `override`.

### Что должно быть в интерфейсе

В админке / My Company должны настраиваться:

- проценты бонусов;
- KPI targets и thresholds;
- правила по department, seat/position, level и employee;
- effective dates: с какой даты правило действует;
- active/inactive status;
- individual override для конкретного сотрудника;
- reason/approval для исключений.

Не нужно строить в админке свободный конструктор любой логики как в Bitrix business processes. Это быстро превращается в хаос. Правильный подход: в коде есть безопасные `policy templates`, а в интерфейсе CEO/Finance/HR меняют параметры.

### Универсальность Bonus Policy

`Bonus Policy` относится не только к Seller. Она должна поддерживать разные правила по отделам:

| Отдел / роль | От чего может зависеть бонус                                       |
| ------------ | ------------------------------------------------------------------ |
| Seller       | Lead source, deal type, payment type, personal rate, KPI gate      |
| Developer    | Product Category, Product Type, роль в проекте, сложность, уровень |
| PM           | Сдача в срок, отсутствие эскалаций, project margin, acceptance     |
| Designer     | Product Type, объём дизайна, количество правок, срок сдачи         |
| Marketing    | MQL, SQL, CPL, revenue from marketing leads                        |
| Support      | SLA, закрытые tickets, reopen rate, maintenance quality            |

На старте можно реализовать только понятные правила, но модель должна позволять добавлять новые параметры без переписывания всей финансовой логики.

---

## Compensation Profile / Профиль оплаты сотрудника

`Compensation Profile / Профиль оплаты сотрудника` - это постоянные настройки оплаты конкретного сотрудника.

Он связан с `Employee / Сотрудником` и хранится в `My Company / Team`.

### Что хранится в профиле

| Поле              | Описание                             |
| ----------------- | ------------------------------------ |
| `base_salary`     | Минимальная / фиксированная зарплата |
| `role`            | Роль сотрудника                      |
| `level`           | Уровень сотрудника                   |
| `bonus_policy`    | Правила бонусов                      |
| `kpi_policy`      | Правила KPI                          |
| `payout_schedule` | График выплат                        |
| `currency`        | Валюта выплаты                       |
| `effective_from`  | С какой даты действует профиль       |
| `effective_to`    | Когда профиль перестал действовать   |
| `status`          | Active / Archived                    |

### Примеры

Seller:

- фиксированная зарплата;
- процент от оплаченных продаж;
- KPI по сумме продаж и количеству сделок.

Marketing:

- фиксированная зарплата;
- KPI по MQL / SQL;
- бонусы по маркетинговым результатам, если применимо.

Developer:

- фиксированная зарплата;
- бонусы по закрытым работам;
- KPI можно добавить позже, но структура должна быть готова сразу.

Compensation Profile не должен хранить только одну текущую зарплату. Он должен иметь историю версий, потому что условия сотрудника могут меняться: фикс, проценты, KPI, уровень, договорённости.

---

## Bonus Entry / Бонусная запись

`Bonus Entry / Бонусная запись` - это отдельное денежное событие мотивации.

Бонус может появиться из:

- оплаты заказа;
- сдачи проекта;
- оплаты месяца подписки;
- выполнения KPI;
- ручного решения CEO / Finance;
- другой утверждённой бизнес-логики.

### Полный lifecycle бонуса

| Статус                | Русское название      | Смысл                                           |
| --------------------- | --------------------- | ----------------------------------------------- |
| `Incoming`            | Прогноз               | Бонус возможен, но условия ещё не выполнены     |
| `Earned`              | Заработан             | Рабочее событие произошло                       |
| `Pending Eligibility` | Ждёт условия          | Ждёт оплату, KPI, acceptance или другое условие |
| `Vested`              | Разрешён к выплате    | Условия выполнены                               |
| `Holdback`            | Удержание             | Часть суммы удержана временно                   |
| `Active`              | В ближайший payroll   | Готов войти в зарплатный расчёт                 |
| `Paid`                | Выплачен              | Выплачен сотруднику                             |
| `Clawback`            | Отзыв / корректировка | Бонус отозван или скорректирован                |

`Bonus Board / Доска бонусов` может показывать упрощённые колонки, но карточка бонуса должна хранить полный статус.

---

## Project Bonus Pool / Бонусный фонд проекта

Для проектных бонусов, особенно при subscription-оплате, нужно отделить план бонуса от фактического выпуска денег.

`Project Bonus Pool / Бонусный фонд проекта` - это плановая сумма бонусов по проекту или order.

Пример:

```text
Project: Website Subscription
Seller:     100,000
PM:          30,000
Developer: 120,000
Designer:   50,000
Total:     300,000
```

Важные суммы:

| Поле                     | Русское название       | Смысл                                               |
| ------------------------ | ---------------------- | --------------------------------------------------- |
| `planned_bonus_amount`   | Плановый бонус         | Сколько всего положено сотруднику по проекту        |
| `released_bonus_amount`  | Выпущено к выплате     | Сколько уже разрешено включить в payroll            |
| `paid_bonus_amount`      | Выплачено              | Сколько реально выплачено через expense payments    |
| `remaining_bonus_amount` | Остаток                | Сколько ещё осталось по плановому бонусу            |
| `extra_bonus_amount`     | Дополнительный бонус   | Сумма сверх планового бонуса                        |
| `over_funding_amount`    | Сверх проектного фонда | Сумма, выпущенная сверх полученных денег по проекту |

### Available Project Bonus Funding / Доступный проектный фонд

`Available Project Bonus Funding / Доступный проектный фонд` показывает, сколько денег по проекту можно использовать на бонусы без кассового разрыва.

```text
Available Bonus Funding =
  Project Received Amount
  - already released bonuses
  - funding reserved for other project rules, if any
```

Для subscription-проектов это особенно важно: клиент может купить проект на 1,000,000 AMD и платить по 100,000 AMD в месяц. Сотрудники могут иметь плановый бонус 300,000 AMD, но компания не должна автоматически выплачивать весь delivery bonus до того, как получила деньги.

### Правило до сдачи проекта

До `Project Done / Acceptance` бонусы delivery не активируются автоматически.

До сдачи проекта возможен только ручной `Early Bonus Release / Ранний выпуск бонуса`:

- Finance/CEO сам выбирает сотрудника;
- сам вводит сумму;
- система показывает доступный проектный фонд;
- если сумма выше фонда, показывает `Over Funding`;
- reason обязателен для выплаты сверх фонда или сверх планового бонуса.

### Правило после сдачи проекта

После сдачи проекта система автоматически активирует бонусы на максимально возможную сумму из доступного проектного фонда.

```text
Project Done
-> calculate Project Received Amount
-> subtract already released bonuses
-> calculate Available Bonus Funding
-> auto-release remaining planned bonuses up to available funding
-> if funding is enough, release all remaining bonuses
-> if funding is not enough, release partial bonuses
```

По умолчанию частичный auto-release распределяется пропорционально между оставшимися плановыми бонусами сотрудников.

Пример:

```text
Remaining planned bonuses:
PM:         30,000
Developer:120,000
Designer:  50,000
Total:    200,000

Available funding: 100,000

Auto-release:
PM:         15,000
Developer: 60,000
Designer:  25,000
```

Если денег хватает на весь остаток, система активирует весь остаток сразу.

### После новых оплат клиента

Если после предыдущей частичной активации пришла новая оплата клиента, система снова проверяет остаток бонусов и автоматически активирует следующий доступный кусок.

```text
New client payment received
-> update Project Received Amount
-> update Available Bonus Funding
-> auto-release remaining bonuses, if project is Done
```

### Manual Override / Ручное изменение

Finance/CEO всегда может изменить автоматически предложенные суммы:

| Действие                        | Поведение системы                                     |
| ------------------------------- | ----------------------------------------------------- |
| Уменьшить release               | Остаток переносится на следующий месяц                |
| Увеличить release в рамках pool | Разрешается без warning, если хватает project funding |
| Выплатить сверх planned bonus   | Помечается как `Extra Bonus`, reason обязателен       |
| Выплатить сверх funding         | Помечается как `Over Funding`, approval обязателен    |
| Выпустить до сдачи проекта      | `Early Bonus Release`, reason обязателен              |

Система должна помогать платить бонусы максимально быстро, но не должна скрывать риск кассового разрыва.

---

### Bonus Board / Доска бонусов

Default view:

`Board / Доска`

Упрощённые колонки:

| Колонка                    | Что показывает                                |
| -------------------------- | --------------------------------------------- |
| `Incoming / Прогноз`       | Потенциальные бонусы                          |
| `In Progress / В процессе` | Earned, Pending Eligibility, Vested, Holdback |
| `Active / В payroll`       | Бонусы, которые войдут в ближайший payroll    |
| `Paid / Выплачено`         | История выплат                                |
| `Clawback / Корректировки` | Отозванные / скорректированные бонусы         |

Дополнительные виды:

- `List / Список`;
- `Board / Доска`;
- `Calendar/Grid / История по месяцам`.

Последний выбранный вид пользователя должен запоминаться.

### Bonus Board views / Виды доски бонусов

`Bonus Board` должен быть не только списком активных бонусов. Это рабочий экран, где CEO/Finance видит бонусную задолженность, план, release и выплаты.

Основные виды:

| Вид                                | Для чего нужен                                                    |
| ---------------------------------- | ----------------------------------------------------------------- |
| `Board / Доска`                    | Быстро видеть бонусы по статусам: Incoming, Pending, Active, Paid |
| `List / Список`                    | Фильтровать по сотруднику, проекту, месяцу, статусу, типу бонуса  |
| `Project Bonus Pool / По проектам` | Видеть project received, available funding, planned/released/paid |
| `Employee / По сотрудникам`        | Видеть все бонусы сотрудника по проектам и месяцам                |
| `Payroll Preview / К выплате`      | Видеть, что попадёт в ближайший payroll                           |
| `History Grid / История`           | Месяцы сверху, сотрудники или проекты слева                       |

### Project Bonus Pool view

Вид по проектам должен показывать:

```text
Project | Received | Released | Paid | Available | Planned Remaining | Over Funding
```

При раскрытии проекта:

```text
Employee | Role | Planned | Released | Paid | Remaining | Suggested | Release Now | Status
```

Где:

- `Suggested` - сумма, которую система предлагает выпустить автоматически;
- `Release Now` - сумма, которую Finance/CEO может изменить вручную;
- `Status` - Within Pool / Extra Bonus / Over Funding / Early Release.

---

## Payroll Run / Зарплатный расчёт за месяц

`Payroll Run / Зарплатный расчёт` - это месячный контейнер зарплат.

Пример:

`April 2026 Payroll Run / Зарплатный расчёт за апрель 2026`

Он содержит:

- всех сотрудников, которые входят в расчёт;
- фиксированную зарплату каждого;
- бонусы, которые входят в этот месяц;
- project bonus releases по каждому проекту;
- KPI adjustments, если есть;
- удержания / corrections, если есть;
- итог к выплате;
- статус по каждому сотруднику;
- связанные `Expense Cards`.

### Статусы Payroll Run

| Статус     | Русское название | Смысл                                  |
| ---------- | ---------------- | -------------------------------------- |
| `Draft`    | Черновик         | Система собрала предварительный расчёт |
| `Review`   | На проверке      | Finance проверяет суммы                |
| `Approved` | Утверждён        | Можно создавать расходы на выплату     |
| `Paying`   | Выплачивается    | Выплаты идут частями или полностью     |
| `Closed`   | Закрыт           | Все строки обработаны                  |

### Payroll Run Detail / Детальный экран месяца

Открывая конкретный месяц, Finance видит:

| Колонка           | Описание                                          |
| ----------------- | ------------------------------------------------- |
| Employee          | Сотрудник                                         |
| Base Salary       | Фикс                                              |
| Bonuses           | Бонусы месяца                                     |
| KPI / Adjustments | KPI и корректировки                               |
| Deductions        | Удержания                                         |
| Total             | Итог к выплате                                    |
| Paid              | Уже выплачено                                     |
| Remaining         | Осталось выплатить                                |
| Status            | Pending / Approved / Partially Paid / Paid / Held |
| Expense Card      | Связанная карточка расхода                        |

### Bonus Release Workspace / Рабочий экран выпуска бонусов

Внутри `Payroll Run Detail` должен быть отдельный рабочий экран для бонусов текущего месяца.

Цель: Finance/CEO должен открыть payroll и сразу увидеть, какие бонусы по каким проектам входят в зарплату, что система предлагает автоматически, и где нужна ручная правка.

Верхний уровень:

```text
Project | Client Payments Received | Bonus Released Before | Available Funding | Auto Suggested | Manual Changes | Final Release
```

Внутри проекта:

```text
Employee | Role | Planned Bonus | Paid Before | Remaining | Suggested This Month | Release This Month | Warning
```

Правила UX:

- `Release This Month` редактируется вручную до approval payroll;
- если сумма меньше suggested, остаток остаётся на следующий месяц;
- если сумма больше planned remaining, строка получает `Extra Bonus`;
- если сумма больше available funding, строка получает `Over Funding`;
- для `Extra Bonus`, `Over Funding` и `Early Release` нужен reason;
- после approval payroll суммы блокируются и дальше меняются только через correction/adjustment.

---

## Salary Line / Строка сотрудника в payroll

`Salary Line / Зарплатная строка` - это запись `employee + month` внутри `Payroll Run`.

Она нужна, чтобы по каждому сотруднику видеть:

- фикс;
- бонусы;
- бонусы по проектам;
- KPI;
- удержания;
- итог;
- сколько выплачено;
- сколько осталось;
- статус.

### Статусы Salary Line

| Статус           | Русское название   |
| ---------------- | ------------------ |
| `Pending`        | Ожидает            |
| `Approved`       | Утверждено         |
| `Partially Paid` | Частично выплачено |
| `Paid`           | Выплачено          |
| `Held`           | Удержано           |

---

## Salary Board / Доска зарплат

`Salary Board / Доска зарплат` - это главный визуальный экран зарплат.

Правильный основной вид:

`employees x months / сотрудники x месяцы`

```text
                Jan        Feb        Mar        Apr        May
Anna            300k       320k       300k       345k       ...
Aram            250k       250k       270k       250k       ...
Sipan           400k       430k       410k       400k       ...
```

Где:

- строка = сотрудник;
- колонка = месяц;
- ячейка = salary line сотрудника за месяц;
- цвет ячейки = статус выплаты.

### Клик по month header

Открывает:

`Payroll Run Detail / Зарплатный расчёт за месяц`

### Клик по ячейке employee + month

Открывает:

`Salary Detail / Зарплата сотрудника за месяц`

Внутри:

- фикс;
- бонусы;
- project bonuses breakdown;
- KPI;
- удержания;
- итог;
- paid amount;
- remaining amount;
- partial payments;
- linked expense card.

### Salary Detail / Детальная зарплата сотрудника

Внутри зарплатной карточки сотрудника за месяц бонусы должны быть видны по проектам.

Пример:

```text
Employee: Developer
Month: April 2026

Base Salary: 300,000

Project Bonuses:
Project A | Planned 120,000 | Paid before 60,000 | Release now 60,000 | Remaining 0 | Within Pool
Project B | Planned 80,000  | Paid before 0      | Release now 30,000 | Remaining 50,000 | Partial
Project C | Planned 100,000 | Paid before 0      | Release now 120,000 | Remaining 0 | Extra Bonus +20,000

Total bonuses this month: 210,000
Total payroll: 510,000
```

Ключевой принцип: в зарплате нельзя показывать бонус одной общей цифрой без расшифровки. Finance должен видеть, из каких проектов пришли деньги, что уже paid, что remaining и где есть exception.

---

## Как payroll создаёт расходы

Когда `Payroll Run` утверждён:

1. система создаёт `Expense Card` для каждой salary line или payout line;
2. категория расхода: `Salary` или `Bonus`, по правилам P&L;
3. выплаты фиксируются через `Expense Payment`;
4. частичная выплата обновляет `paid_amount` и `remaining_amount`;
5. когда сумма закрыта полностью, salary line становится `Paid`.

Важное правило:

`Salary Paid` не должен быть просто ручным статусом. Выплата должна подтверждаться через `Expense Payment`.

---

## Employee Wallet / Кошелёк сотрудника

`Employee Wallet / Кошелёк сотрудника` - read-only экран для сотрудника.

Он показывает:

- фиксированную зарплату;
- прогнозные бонусы;
- бонусы в процессе;
- бонусы в ближайшем payroll;
- историю выплат;
- частичные выплаты;
- проекты и заказы, из которых пришли бонусы.

Wallet не хранит отдельный баланс.

Источник данных:

```text
Compensation Profile
Bonus Entries
Project Bonus Pools
Bonus Releases
Payroll Runs
Salary Lines
Expense Payments
```

---

## Payroll cycle / Цикл выплаты зарплат

### 1. Подготовка

В начале месяца система создаёт `Payroll Run` за предыдущий месяц.

Она подтягивает:

- сотрудников;
- active compensation profiles;
- active bonus releases;
- project bonus pool suggestions;
- KPI / adjustments;
- holdbacks / corrections.

### 2. Проверка

Finance проверяет:

- фиксированные зарплаты;
- бонусы;
- KPI;
- удержания;
- итоговые суммы.

Статус payroll:

`Draft -> Review`

### 3. Утверждение

CEO / Finance утверждает payroll:

`Review -> Approved`

После этого система создаёт связанные `Expense Cards`.

### 4. Выплата

Finance оплачивает полностью или частями.

Каждая оплата создаёт `Expense Payment`.

Payroll status:

`Approved -> Paying`

### 5. Закрытие

Когда все salary lines закрыты:

`Paying -> Closed`

Все связанные бонусы получают статус `Paid`, если они были включены в этот payroll.

---

## Связь с P&L

Зарплаты и бонусы должны попадать в P&L через `Expense Cards`.

Правила:

- salary без проектной привязки идёт в Company P&L;
- delivery bonus может относиться к Order / Project P&L;
- sales bonus может относиться к Order / Project P&L;
- marketing bonus обычно относится к Company P&L, если не привязан к конкретной кампании / проекту.

---

## Доступы

| Роль             | Что видит                                              |
| ---------------- | ------------------------------------------------------ |
| CEO              | Все зарплаты, бонусы, payroll, wallet всех сотрудников |
| Finance Director | Все зарплаты, бонусы, payroll и выплаты                |
| Employee         | Только свой wallet и свои бонусы                       |
| Department Head  | Бонусы и payroll summary своего отдела, если разрешено |

---

## Уведомления

| Событие                   | Получатель    | Описание                              |
| ------------------------- | ------------- | ------------------------------------- |
| Бонус стал Active         | Сотрудник     | Бонус готов войти в payroll           |
| Payroll создан            | Finance       | Зарплатный расчёт готов к проверке    |
| Payroll утверждён         | Finance / CEO | Можно начинать выплаты                |
| Частичная выплата сделана | Сотрудник     | Выплачена часть зарплаты              |
| Salary line закрыта       | Сотрудник     | Зарплата за месяц полностью выплачена |
| Payroll закрыт            | CEO           | Месячный payroll завершён             |

---

## Связи с другими модулями

```text
My Company -> Compensation Profile
CRM / Orders / Payments -> Bonus Entry
Projects Hub -> Delivery Bonus Events
Subscriptions -> Subscription Bonus Events
Compensation Profile + Bonus Entries + Bonus Releases -> Payroll Run
Payroll Run -> Salary Lines -> Expense Cards -> Expense Payments
Employee Wallet -> read-only projection
P&L Reports -> payroll costs
```
