# P&L, Cash Flow и финансовые отчёты

## Общая концепция

`P&L / Profit & Loss / Отчёт о прибыли и убытках` показывает:

- сколько компания заработала;
- сколько потратила;
- какая маржа получилась.

Отчёты не должны быть отдельной доской, где вручную живут суммы. Они должны быть read-only витриной над финансовыми фактами.

Источник правды:

```text
Invoice Card
Payment
Subscription
Expense Card
Expense Payment
Payroll Run
Salary Line
Client Service Record
Operational Journal
```

Доски (`Invoice Board`, `Expense Board`, `Bonus Board`, `Salary Board`) являются рабочими интерфейсами. Они не должны быть источником истины для отчётов.

---

## P&L vs Cash Flow

Нужно разделять два вида финансовой картины.

| Вид         | Русское название | Главный вопрос                                      |
| ----------- | ---------------- | --------------------------------------------------- |
| `P&L`       | Прибыль и убытки | Сколько заработали и сколько потратили за период    |
| `Cash Flow` | Денежный поток   | Сколько денег реально пришло, ушло и будет доступно |

### Cash view / Денежный вид

Показывает реальные движения денег:

- клиент оплатил;
- компания оплатила расход;
- зарплата выплачена;
- поставщик получил оплату.

Источники:

- `Payment`;
- `Expense Payment`;
- банковский баланс, пока вручную или через интеграцию позже.

### Accrual view / Начисленный вид

Показывает экономическую принадлежность дохода или расхода к периоду.

Примеры:

- подписка оплачена за 12 месяцев, но revenue может распределяться по месяцам;
- payroll относится к месяцу работы, даже если часть выплаты ушла позже;
- expense может относиться к проекту или периоду, даже если оплачен частями.

NBOS v1 может начинать с cash-driven отчётов, но канон должен сохранять место для accrual.

---

## Основные уровни P&L

NBOS должен поддерживать четыре уровня:

| Уровень       | Русское название | Что показывает                        |
| ------------- | ---------------- | ------------------------------------- |
| `Company P&L` | P&L компании     | Общая прибыльность компании           |
| `Project P&L` | P&L проекта      | Прибыльность бизнеса / бренда клиента |
| `Product P&L` | P&L продукта     | Прибыльность конкретного продукта     |
| `Order P&L`   | P&L заказа       | Маржа конкретной продажи              |

`Product P&L` нужен потому, что `Product` является центральной delivery-сущностью NBOS.

---

## Company P&L / P&L компании

Company P&L агрегирует все доходы и расходы компании за период.

### Revenue / Доходы

Источники:

| Строка                  | Источник                                                |
| ----------------------- | ------------------------------------------------------- |
| Development Revenue     | Payments по Invoice Cards, связанным с product/orders   |
| Extension Revenue       | Payments по Invoice Cards, связанным с extension/orders |
| Subscription Revenue    | Payments по Invoice Cards, созданным subscriptions      |
| Maintenance Revenue     | Payments по maintenance subscriptions                   |
| Client Services Revenue | Payments по client-paid services                        |
| Pass-through Margin     | Payment от клиента минус связанный Expense Payment      |

### Costs / Расходы

Источники:

| Строка                   | Источник                                                         |
| ------------------------ | ---------------------------------------------------------------- |
| Salaries                 | Payroll Run -> Salary Lines -> Expense Cards -> Expense Payments |
| Bonuses                  | Bonus Entries included in Payroll Run and related Expense Cards  |
| Partner Payouts          | Expense Cards category Partner Payout                            |
| Client Services Costs    | Expense Payments from Client Service Records                     |
| Tools & Licenses         | Expense Cards category Tools / Service                           |
| Hosting & Infrastructure | Expense Cards category Hosting / Service                         |
| Marketing                | Expense Cards category Marketing                                 |
| Office                   | Expense Cards category Office                                    |
| Other                    | Expense Cards category Other                                     |

### Основные формулы

| Показатель        | Формула                                                  |
| ----------------- | -------------------------------------------------------- |
| `Total Revenue`   | Sum revenue lines                                        |
| `Direct Costs`    | Costs directly tied to orders, products, client services |
| `Gross Margin`    | Total Revenue - Direct Costs                             |
| `Operating Costs` | Salaries, tools, office, overhead                        |
| `Net Margin`      | Gross Margin - Operating Costs                           |
| `Net Margin %`    | Net Margin / Total Revenue                               |

---

## Project P&L / P&L проекта

Project P&L показывает прибыльность проекта как бизнеса / бренда клиента.

Доходы:

- payments по orders проекта;
- payments по extensions проекта;
- payments по subscriptions проекта;
- payments по client services проекта;
- pass-through margin, если есть.

Расходы:

- delivery bonuses по orders проекта;
- sales bonuses по orders проекта;
- partner payouts проекта;
- domains / hosting / services проекта;
- другие expense cards с project_id.

Project P&L агрегирует:

```text
Project
    ->
Products
    ->
Extensions
    ->
Subscriptions
    ->
Client Services
    ->
Orders / Invoice Cards / Payments / Expenses
```

---

## Product P&L / P&L продукта

Product P&L показывает, сколько принёс и сколько стоил конкретный продукт.

Доходы:

- initial product order;
- product subscription payments;
- product-related client services;
- extension revenue, если extension привязан к продукту.

Расходы:

- delivery bonuses;
- product-related services;
- hosting;
- infrastructure;
- support / maintenance costs, если они распределяются на product.

Product P&L особенно важен для:

- понимания прибыльности конкретного продукта;
- сравнения продуктов внутри одного проекта;
- решения, нужно ли повышать подписку или service fee.

---

## Order P&L / P&L заказа

Order P&L показывает маржу конкретной продажи.

Доходы:

- payments по invoice cards заказа.

Расходы:

- sales bonus;
- delivery bonus;
- partner payout;
- прямые costs, если они относятся именно к order.

Order P&L нужен для:

- контроля маржи сделки;
- проверки бонусной политики;
- анализа партнёрских продаж.

---

## Cash Flow / Денежный поток

`Cash Flow / Денежный поток` отвечает на вопрос:

сколько денег реально есть и сколько будет доступно через 30 / 60 / 90 дней.

### Источники

| Блок              | Источник                                              |
| ----------------- | ----------------------------------------------------- |
| Current balance   | Ручной ввод или банковская интеграция позже           |
| Expected incoming | Open Invoice Cards, future subscription invoice cards |
| Expected outgoing | Expense Cards, Expense Plans, Payroll Runs            |
| Real incoming     | Payments                                              |
| Real outgoing     | Expense Payments                                      |
| Backlog debt      | Expense Backlog, отдельно от текущего прогноза        |

### Важное правило

`Expense Backlog / Долги и отложенные расходы` должен показываться отдельным блоком.

Он не должен смешиваться с текущим cash forecast, иначе команда потеряет понимание, сколько денег нужно именно на ближайший платёжный цикл.

---

## Operational Journal / Операционный журнал

`Operational Journal / Операционный журнал` - внутренний слой финансовых фактов.

Он нужен, чтобы:

- строить отчёты из одного места;
- иметь audit;
- поддерживать cash/accrual;
- позже перейти к double-entry без потери истории.

Обычные сотрудники не работают с журналом. CEO и Finance могут иметь `Journal View / Журнал операций`.

Поля журнала:

- дата;
- сумма;
- валюта;
- cash/accrual basis;
- source type;
- source id;
- project;
- product;
- order;
- employee;
- period;
- description.

---

## Period Close / Закрытие периода

Месяц нельзя закрывать, пока:

- payroll run не закрыт или не перенесён осознанно;
- важные payments и expense payments сверены;
- открытые invoice cards и expense cards проверены;
- manual adjustments, если есть, внесены;
- Finance / CEO подтвердил закрытие.

После закрытия периода:

- нельзя тихо менять суммы в прошлом месяце;
- исправления делаются корректирующими записями в открытом периоде;
- отчёты прошлого периода остаются воспроизводимыми.

---

## Operational reports / Операционные отчёты

### MRR Report / Отчёт подписочной выручки

Показывает:

- active MRR;
- yearly/custom coverage;
- new MRR;
- expansion / contraction;
- churned MRR;
- paid coverage by month.

Источники:

- `Subscription`;
- `Invoice Card coverage_start_month / coverage_month_count`;
- `Payment`.

### DSO Report / Скорость оплаты клиентами

Показывает, как быстро клиенты платят.

Источники:

- `Invoice Card issue/due date`;
- `Payment paid_at`;
- overdue status.

### Expense Plan vs Actual / План-факт расходов

Показывает:

- сколько планировали;
- сколько создали карточек;
- сколько реально оплатили;
- отклонение по категориям.

Источники:

- `Expense Plan`;
- `Expense Card`;
- `Expense Payment`.

### Payroll Report / Отчёт зарплат и бонусов

Показывает:

- total base salary;
- total bonuses;
- total payable;
- paid;
- remaining;
- payroll as % of revenue.

Источники:

- `Payroll Run`;
- `Salary Line`;
- `Bonus Entry`;
- `Expense Card`;
- `Expense Payment`.

---

## Drill-down / Расшифровка сумм

Любая сумма в отчёте должна открываться до источника.

Примеры:

- Revenue -> список payments;
- Outstanding receivables -> список invoice cards;
- Salaries -> payroll run / salary lines;
- Expenses -> expense cards / expense payments;
- Client services margin -> invoice card + expense card pair.

Это обязательное правило для доверия к финансовым отчётам.

---

## Доступы

| Отчёт          | CEO | Finance Director | Seller  | PM      | Employee        |
| -------------- | --- | ---------------- | ------- | ------- | --------------- |
| Company P&L    | Yes | Yes              | No      | No      | No              |
| Project P&L    | Yes | Yes              | Limited | Limited | No              |
| Product P&L    | Yes | Yes              | Limited | Limited | No              |
| Order P&L      | Yes | Yes              | Limited | No      | No              |
| Cash Flow      | Yes | Yes              | No      | No      | No              |
| MRR Report     | Yes | Yes              | No      | No      | No              |
| Payroll Report | Yes | Yes              | No      | No      | Own wallet only |
| Journal View   | Yes | Yes              | No      | No      | No              |

---

## Автоматизация

| Событие                             | Действие                                         |
| ----------------------------------- | ------------------------------------------------ |
| Payment created                     | Update cash view and revenue reports             |
| Expense Payment created             | Update cash view and cost reports                |
| Payroll Run approved                | Create expense cards and update payroll forecast |
| Subscription invoice card generated | Update expected incoming                         |
| Expense Plan creates card           | Update expected outgoing                         |
| Period close requested              | Run close checklist                              |
| Closed period correction needed     | Create adjustment entry in open period           |
