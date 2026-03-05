# Дашборды и аналитика (Dashboards & Analytics)

> NBOS Platform — аналитический модуль для принятия решений на основе данных

## Назначение

Модуль **Dashboards & Analytics** предоставляет руководителям и сотрудникам Neetrino визуальную аналитику по всем направлениям бизнеса. Каждый дашборд строится на **реальных данных** из системы — без ручного ввода, без Excel-таблиц.

**Ключевой принцип:** дашборды не дублируют данные — они **агрегируют и визуализируют** информацию из других модулей (CRM, Finance, Projects, Tasks, Support). Если данные корректно заведены в систему, аналитика формируется автоматически.

---

## Типы дашбордов

NBOS предоставляет **8 специализированных дашбордов** + персональный дашборд для каждого сотрудника:

| # | Дашборд | Основная аудитория | Источники данных |
|---|---------|-------------------|-----------------|
| 1 | CEO Dashboard | CEO | Все модули |
| 2 | Sales Dashboard | Head of Sales, Sellers | CRM, Finance |
| 3 | Marketing Dashboard | Marketing, CEO | CRM (Leads), Finance |
| 4 | Delivery Dashboard | Head of Delivery, PMs | Projects, Tasks |
| 5 | Finance Dashboard | Finance Director, CEO | Finance, Subscriptions |
| 6 | Support Dashboard | PMs, Support, CEO | Support, Projects |
| 7 | Subscription/MRR Dashboard | Finance Director, CEO | Subscriptions, Finance |
| 8 | Personal Dashboard | Каждый сотрудник | Tasks, Projects, Finance, Calendar |

---

## 1. CEO Dashboard (обзор компании)

Стратегический дашборд для CEO — «здоровье компании» на одном экране.

### Виджеты

| Виджет | Тип визуализации | Описание |
|--------|-----------------|----------|
| **Revenue vs Target** | Прогресс-бар / Gauge | Выручка текущего месяца относительно плана |
| **MRR Trend** | Line chart (12 мес.) | Динамика Monthly Recurring Revenue |
| **Cash Balance** | Число с индикатором | Текущий остаток на счёте компании |
| **Outstanding Receivables** | Число + список | Сумма неоплаченных счетов с детализацией |
| **Active Projects** | Число + Status breakdown | Количество проектов по статусам (Dev / QA / Transfer) |
| **Team Size & Capacity** | Число + Индикатор загрузки | Размер команды и средняя загрузка |
| **Top Issues (L10)** | Список | Ключевые нерешённые вопросы из Issues List |
| **Rocks Status** | Progress bars | Статус квартальных приоритетов (Rocks / OKRs) |
| **Churn Rate** | Line chart + число | Тренд оттока клиентов (%) |
| **Project Margin Summary** | Bar chart | Маржинальность по проектам (топ-10) |

### Layout CEO Dashboard

```
┌────────────────────┬────────────────────┬────────────────────┐
│   Revenue vs Target│     Cash Balance   │ Outstanding AR     │
│   ████████░░ 78%   │     $124,500       │    $45,200         │
│   $78K / $100K     │     ▲ +12% vs prev │    12 invoices     │
├────────────────────┴────────────────────┴────────────────────┤
│                    MRR Trend (12 months)                      │
│   $85K ─────────────────────────────╱──── $92K               │
│   ───────────────────────────────╱─────                      │
│   Jan  Feb  Mar  Apr  May  Jun  Jul  Aug                     │
├────────────────────┬────────────────────┬────────────────────┤
│  Active Projects   │  Team Capacity     │  Churn Rate        │
│  ■ Dev: 8          │  ████████░░ 82%    │  2.1% ↓            │
│  ■ QA: 3           │  22/27 allocated   │  Trend: improving  │
│  ■ Transfer: 2     │                    │                    │
├────────────────────┴────────────────────┴────────────────────┤
│  Top Issues (L10)              │  Rocks Status (Q1 2025)     │
│  1. Hire senior backend dev    │  Rock 1: ████████░░ 80%     │
│  2. Client X payment delay     │  Rock 2: ████░░░░░░ 40%     │
│  3. QA process bottleneck      │  Rock 3: ██████░░░░ 60%     │
└────────────────────────────────┴─────────────────────────────┘
```

### Drill-down

Клик по любому числу открывает детализацию:
- Revenue → список оплаченных счетов за период
- Outstanding Receivables → список неоплаченных счетов с датами и клиентами
- Active Projects → список проектов с фильтрами
- Churn Rate → список отменённых подписок с причинами

---

## 2. Sales Dashboard (продажи)

Операционный дашборд для отдела продаж.

### Виджеты

| Виджет | Тип визуализации | Описание |
|--------|-----------------|----------|
| **Pipeline Value by Stage** | Funnel chart | Сумма сделок на каждой стадии воронки |
| **Conversion Rate** | Funnel с % | Lead → MQL → SQL → Deal → Won |
| **Revenue Trend** | Bar chart (week/month) | Выручка по периодам |
| **Average Deal Size** | Число + тренд | Средний чек сделки |
| **Sales Cycle Duration** | Число (дни) | Среднее время от лида до закрытия |
| **Deals by Source** | Pie chart | Распределение сделок по источникам |
| **Extension vs New Ratio** | Donut chart | Соотношение доработок и новых сделок |
| **Seller Performance** | Leaderboard / Bar chart | Сравнение продавцов по ключевым метрикам |
| **Forecast (30/60/90)** | Stacked bar | Прогноз закрытий на ближайшие 1–3 месяца |

### Ключевые метрики

| Метрика | Формула | Цель |
|---------|---------|------|
| **Win Rate** | Won Deals / Total Closed Deals × 100% | > 50% |
| **Conversion (Lead → Won)** | Won Deals / Total Leads × 100% | > 5% |
| **Average Deal Size** | Σ Won Deal Amount / Count Won Deals | Рост MoM |
| **Sales Cycle** | AVG(Deal Won Date - Lead Created Date) | < 30 дней |
| **Pipeline Coverage** | Pipeline Value / Revenue Target | > 3x |
| **Forecast Accuracy** | Actual Revenue / Forecasted Revenue × 100% | > 80% |

### Seller Performance (сравнение продавцов)

Таблица с ранжированием:

| Seller | Deals Won | Revenue | Win Rate | Avg Cycle | Active Deals |
|--------|-----------|---------|----------|-----------|-------------|
| Seller A | 12 | $145K | 62% | 24 дня | 8 |
| Seller B | 9 | $98K | 48% | 31 день | 11 |
| Seller C | 7 | $72K | 55% | 28 дней | 6 |

### Forecast (прогноз)

Прогноз строится на основе:
- Текущих сделок в pipeline
- Вероятности закрытия по стадии (стадия «Proposal» = 40%, «Deposit» = 80%)
- Исторической конверсии

```
Forecast 30 дней:  $85K  (высокая уверенность)
Forecast 60 дней: $142K  (средняя уверенность)
Forecast 90 дней: $210K  (низкая уверенность)
```

---

## 3. Marketing Dashboard (маркетинг)

Аналитика эффективности маркетинговых каналов и ROI.

### Виджеты

| Виджет | Тип визуализации | Описание |
|--------|-----------------|----------|
| **Leads by Source** | Bar chart / Pie | Количество лидов по источникам |
| **Cost per Lead (CPL)** | Bar chart с числами | CPL по каждому источнику |
| **MQL → SQL Conversion** | Funnel по источникам | Качество лидов по каналам |
| **Revenue Attribution** | Stacked bar | Выручка, атрибутированная к каналу привлечения |
| **ROI by Channel** | Bar chart | Возврат инвестиций по маркетинговым каналам |
| **Lead Volume Trend** | Line chart (weekly/monthly) | Динамика количества лидов |
| **Campaign Performance** | Table | Результаты по конкретным кампаниям |

### Ключевые метрики

| Метрика | Формула | Описание |
|---------|---------|----------|
| **CPL (Cost per Lead)** | Marketing Spend / Leads Generated | Стоимость привлечения одного лида |
| **CAC (Customer Acquisition Cost)** | Total Sales & Marketing Cost / New Clients Won | Полная стоимость привлечения клиента |
| **MQL → SQL Rate** | SQL Count / MQL Count × 100% | Качество квалификации лидов |
| **Revenue per Lead** | Total Revenue / Total Leads | Средняя ценность одного лида |
| **Marketing ROI** | (Revenue from Marketing - Marketing Cost) / Marketing Cost × 100% | Окупаемость маркетинга |
| **LTV:CAC Ratio** | Avg Client Lifetime Value / CAC | Здоровье юнит-экономики (цель: > 3:1) |

### Leads by Source — детализация

| Источник | Лидов | MQL | SQL | Won | Revenue | CPL | ROI |
|----------|-------|-----|-----|-----|---------|-----|-----|
| Instagram | 120 | 45 | 18 | 6 | $72K | $8 | 520% |
| Facebook | 85 | 30 | 12 | 4 | $48K | $12 | 340% |
| Website (SEO) | 40 | 20 | 10 | 5 | $65K | $15 | 290% |
| Cold Call | 30 | 15 | 8 | 3 | $35K | $0 | — |
| Partner Referral | 25 | 20 | 15 | 8 | $120K | $0* | — |
| Existing Client | 15 | 15 | 12 | 10 | $85K | $0 | — |

*Partner Referral: расходы учитываются как партнёрские выплаты (30% от сделки), а не как CPL.

---

## 4. Delivery Dashboard (доставка проектов)

Операционный дашборд для отслеживания проектов и загрузки команды.

### Виджеты

| Виджет | Тип визуализации | Описание |
|--------|-----------------|----------|
| **Active Projects by Status** | Stacked bar / Kanban summary | Проекты по стадиям (Development / QA / Transfer) |
| **On-Time Delivery %** | Gauge / Число | Процент проектов, сданных вовремя |
| **Planned vs Actual** | Grouped bar chart | Плановый vs фактический срок по проектам |
| **Active Work Packages** | Число | Количество активных Work Package |
| **Team Workload** | Heatmap / Bar chart | Задачи на сотрудника (загрузка) |
| **Sprint Velocity** | Line chart | Скорость команды (story points / задачи за спринт) |
| **Bugs to Production** | Line chart (weekly) | Количество багов, дошедших до production |
| **Projects at Risk** | Alert list | Проекты с приближающимся дедлайном и нерешёнными задачами |

### Ключевые метрики

| Метрика | Формула | Цель |
|---------|---------|------|
| **On-Time Delivery** | Projects Delivered on Time / Total Delivered × 100% | > 85% |
| **Schedule Variance** | (Actual End - Planned End) в днях | < 5 дней |
| **Task Completion Rate** | Completed Tasks / Total Tasks × 100% | > 90% в спринте |
| **Team Utilization** | Assigned Tasks Hours / Available Hours × 100% | 70–85% |
| **Bug Escape Rate** | Production Bugs / Total Bugs Found × 100% | < 10% |
| **Avg Cycle Time** | AVG(Task Done Date - Task Start Date) | Тренд ↓ |

### Projects at Risk (проекты под угрозой)

Автоматически формируемый список проектов, требующих внимания:

| Проект | Дедлайн | Осталось дней | Открытых задач | Риск |
|--------|---------|--------------|---------------|------|
| Client A — Mobile App | 15 Mar | 5 | 23 | 🔴 Высокий |
| Client B — Website | 20 Mar | 10 | 8 | 🟡 Средний |
| Client C — CRM | 30 Mar | 20 | 42 | 🟡 Средний |

**Критерии риска:**
- 🔴 Высокий: дедлайн < 7 дней И > 15 открытых задач
- 🟡 Средний: дедлайн < 14 дней И > 10 открытых задач ИЛИ дедлайн < 7 дней
- 🟢 Низкий: все остальные

---

## 5. Finance Dashboard (финансы)

Финансовый дашборд для Finance Director и CEO.

### Виджеты

| Виджет | Тип визуализации | Описание |
|--------|-----------------|----------|
| **Revenue: Invoiced vs Received** | Grouped bar | Выставлено vs получено за текущий месяц |
| **Expenses: Planned vs Actual** | Grouped bar | Плановые vs фактические расходы |
| **P&L Summary** | Waterfall chart / Таблица | Revenue − Costs = Margin |
| **Outstanding Invoices** | Table с сортировкой | Кто и сколько должен, дни просрочки |
| **DSO (Days Sales Outstanding)** | Число + тренд | Среднее число дней до получения оплаты |
| **Subscription Summary** | Число + мини-grid | MRR, % оплаченных, прогноз |
| **Upcoming Expenses** | Timeline / List | Расходы на ближайшие 30 дней |
| **Bonus Payroll** | Число | Общая сумма бонусов к выплате в следующем цикле |
| **Cash Flow Forecast** | Line chart (3 мес.) | Прогноз движения денежных средств |

### P&L Summary (на одном экране)

```
┌──────────────────────────────────────────────────────┐
│  P&L Summary — March 2025                            │
│──────────────────────────────────────────────────────│
│                                                      │
│  Revenue (received)         $92,400                  │
│    ├─ Orders                $45,000                  │
│    ├─ Subscriptions         $38,200                  │
│    ├─ Extensions            $7,200                   │
│    └─ Pass-through          $2,000                   │
│                                                      │
│  Costs                      $68,300                  │
│    ├─ Salaries              $42,000                  │
│    ├─ Bonuses               $8,500                   │
│    ├─ Planned Expenses      $6,200                   │
│    ├─ Unplanned Expenses    $3,100                   │
│    ├─ Partner Payouts       $6,500                   │
│    └─ Pass-through Costs    $2,000                   │
│                                                      │
│  ─────────────────────────────────────               │
│  Gross Margin               $24,100  (26.1%)         │
│  Net Margin (excl. tax)     $22,100  (23.9%)         │
└──────────────────────────────────────────────────────┘
```

### Outstanding Invoices (должники)

| Клиент | Счёт | Сумма | Дата выставления | Due Date | Дни просрочки | Статус |
|--------|------|-------|-----------------|----------|--------------|--------|
| Client A | #456 | $5,200 | 01 Mar | 10 Mar | 5 | 🔴 Overdue |
| Client B | #461 | $3,800 | 05 Mar | 15 Mar | 0 | 🟡 Due Soon |
| Client C | #448 | $12,000 | 15 Feb | 01 Mar | 14 | 🔴 Overdue |

### Cash Flow Forecast

Прогноз строится на основе:
- **Входящие**: ожидаемые оплаты по выставленным счетам + подписки (по billing day)
- **Исходящие**: зарплаты (фиксированная дата) + плановые расходы + бонусы
- **Дельта**: разница между входящими и исходящими

```
             Mar        Apr        May
Inflow:    $95,000    $98,000    $101,000
Outflow:   $72,000    $74,000    $73,500
Net:       +$23,000   +$24,000   +$27,500
Balance:   $124,500   $148,500   $176,000
```

---

## 6. Support Dashboard (поддержка)

Аналитика качества поддержки клиентов.

### Виджеты

| Виджет | Тип визуализации | Описание |
|--------|-----------------|----------|
| **SLA Compliance %** | Gauge | Процент тикетов, обработанных в рамках SLA |
| **Avg First Response Time** | Число + тренд | Среднее время первого ответа |
| **Tickets: Created vs Closed** | Line chart (dual) | Динамика создания и закрытия тикетов |
| **Open Tickets by Priority** | Stacked bar | Открытые тикеты по приоритету (P1–P4) |
| **Tickets by Category** | Pie chart | Распределение по типам (Incident / Request / Change / Problem) |
| **Reopen Rate** | Число + тренд | Процент переоткрытых тикетов |
| **Top Projects by Volume** | Bar chart | Проекты с наибольшим количеством тикетов |

### Ключевые метрики

| Метрика | Формула | Цель |
|---------|---------|------|
| **SLA Compliance** | Tickets within SLA / Total Tickets × 100% | > 95% |
| **Avg First Response** | AVG(First Response Time - Ticket Created Time) | < 2 часа (P1), < 8 часов (P2) |
| **Resolution Rate** | Resolved Tickets / Created Tickets × 100% | > 90% |
| **Reopen Rate** | Reopened Tickets / Resolved Tickets × 100% | < 5% |
| **MTTR (Mean Time to Resolve)** | AVG(Resolution Time - Ticket Created Time) | Тренд ↓ |
| **Backlog** | Open Tickets (not resolved) | Тренд ↓ |

### Top Projects by Ticket Volume

Выявляет проблемные проекты, требующие системного решения:

| Проект | Тикетов (мес.) | SLA % | Основной тип | Действие |
|--------|---------------|-------|--------------|----------|
| Client A — E-commerce | 34 | 88% | Incident | Провести аудит |
| Client B — Mobile App | 22 | 95% | Request | Норма |
| Client C — Website | 18 | 72% | Incident | 🔴 Критично |

---

## 7. Subscription / MRR Dashboard

Специализированный дашборд для управления рекуррентной выручкой.

### Виджеты

| Виджет | Тип визуализации | Описание |
|--------|-----------------|----------|
| **Total MRR** | Число + тренд | Текущий Monthly Recurring Revenue |
| **MRR Growth Trend** | Line chart (12 мес.) | Динамика MRR |
| **New Subscriptions** | Число (this month) | Новые подписки за текущий месяц |
| **Cancelled Subscriptions** | Число (this month) | Отменённые подписки (churn) |
| **Churn Rate** | Число + тренд | Процент оттока |
| **Revenue Concentration** | Pareto chart | Топ-10 клиентов и их доля в MRR |
| **Subscription by Type** | Donut chart | Распределение по типам подписок |
| **Revenue Forecast** | Line chart (3/6/12 мес.) | Прогноз MRR на основе текущих подписок |

### MRR Breakdown

| Компонент MRR | Описание | Этот месяц |
|---------------|----------|-----------|
| **Existing MRR** | MRR от подписок, существующих с прошлого месяца | $82,000 |
| **New MRR** | MRR от новых подписок этого месяца | $6,500 |
| **Expansion MRR** | Увеличение MRR от существующих клиентов (апгрейд) | $3,200 |
| **Churned MRR** | Потерянный MRR от отменённых подписок | -$1,800 |
| **Contraction MRR** | Снижение MRR от даунгрейдов | -$500 |
| **Net New MRR** | New + Expansion − Churned − Contraction | +$7,400 |
| **Total MRR** | Existing + Net New | $89,400 |

### Churn Analysis

| Метрика | Формула | Значение | Цель |
|---------|---------|----------|------|
| **Gross Churn Rate** | Churned MRR / Previous MRR × 100% | 2.2% | < 3% |
| **Net Churn Rate** | (Churned − Expansion) / Previous MRR × 100% | -1.7% | Отрицательный (рост) |
| **Logo Churn** | Cancelled Clients / Total Clients × 100% | 1.5% | < 2% |
| **Avg Revenue per Client** | Total MRR / Active Subscriptions | $2,850 | Рост MoM |

### Revenue Concentration (риск зависимости)

| Клиент | MRR | Доля | Cumulative |
|--------|-----|------|-----------|
| Client A | $12,000 | 13.4% | 13.4% |
| Client B | $8,500 | 9.5% | 22.9% |
| Client C | $7,200 | 8.1% | 31.0% |
| ... | ... | ... | ... |
| **Топ-10** | **$58,000** | **64.9%** | **64.9%** |

**Правило здоровья:** если один клиент > 15% MRR — высокий риск. Если топ-3 > 40% — средний риск.

### Subscription by Type

| Тип подписки | Количество | MRR | Доля |
|-------------|-----------|-----|------|
| Maintenance | 18 | $36,000 | 40.3% |
| Development (подписка на разработку) | 8 | $32,000 | 35.8% |
| Dev + Maintenance | 5 | $15,400 | 17.2% |
| Partner (партнёрские сервисы) | 4 | $6,000 | 6.7% |

---

## 8. Personal Dashboard (персональный)

Каждый сотрудник видит свой персональный дашборд при входе в NBOS.

### Виджеты

| Виджет | Описание |
|--------|----------|
| **Мои задачи: просроченные** | Список задач с пропущенным дедлайном (красный) |
| **Мои задачи: на сегодня** | Задачи с дедлайном сегодня |
| **Мои задачи: на этой неделе** | Задачи с дедлайном до конца недели |
| **Мои проекты** | Статусы проектов, в которых я участвую |
| **Мои бонусы** | Incoming (ожидают условий), Active (к выплате), Total Earned (всего) |
| **Мои KPI** | Персональные метрики, релевантные роли |
| **Мои встречи** | Ближайшие встречи из Calendar |
| **Мои уведомления** | Последние непрочитанные уведомления |

### KPI по ролям

| Роль | Персональные KPI |
|------|-----------------|
| **Seller** | Deals Won, Revenue, Win Rate, Active Deals |
| **PM** | On-Time Delivery %, Open Tasks, SLA Compliance |
| **Developer** | Tasks Completed, Bugs Reported, Cycle Time |
| **Finance Director** | DSO, Outstanding AR, On-Time Payments % |
| **Support** | SLA %, Avg Response Time, Reopen Rate |

---

## Общие принципы аналитики

### Реальное время (Real-Time Data)

Все данные на дашбордах вычисляются из актуальных данных системы:

- Оплата отмечена → мгновенно отражается на Revenue
- Задача закрыта → обновляется Delivery Dashboard
- Тикет создан → обновляется Support Dashboard
- Без кэша с большой задержкой: максимум 5 минут для тяжёлых агрегаций

### Drill-Down (погружение в данные)

Каждое число на дашборде — это ссылка на детализацию:

```
$92,400 (Revenue)
  → клик → список всех платежей за период
    → клик на платёж → карточка Invoice
      → клик на клиента → карточка Client
```

Принцип: от агрегата к конкретной записи за **не более 3 кликов**.

### Фильтрация по периодам

Все дашборды поддерживают выбор периода:

| Быстрый фильтр | Описание |
|-----------------|----------|
| This Week | Текущая неделя (Пн–Вс) |
| This Month | Текущий календарный месяц |
| This Quarter | Текущий квартал (Q1/Q2/Q3/Q4) |
| This Year | С начала текущего года |
| Last Month | Предыдущий месяц |
| Last Quarter | Предыдущий квартал |
| Custom Range | Произвольный диапазон дат |

По умолчанию: **This Month** для операционных дашбордов, **This Quarter** для стратегических.

### Сравнение периодов

Для ключевых метрик доступно сравнение с предыдущим периодом:
- **MoM (Month over Month)**: текущий месяц vs прошлый
- **QoQ (Quarter over Quarter)**: текущий квартал vs прошлый
- **YoY (Year over Year)**: текущий год vs прошлый

Отображается как дельта: `$92,400 (▲ +8.2% vs prev month)`.

---

## Экспорт и отчёты

### Форматы экспорта

| Формат | Назначение | Содержание |
|--------|-----------|-----------|
| **PDF** | Формальные отчёты для руководства | Дашборд в виде документа с графиками |
| **CSV** | Выгрузка данных для анализа | Табличные данные из виджетов |
| **Scheduled Email** | Автоматическая рассылка | Еженедельный / ежемесячный дайджест |

### Scheduled Reports (регулярные отчёты)

| Отчёт | Получатель | Периодичность | Содержание |
|-------|-----------|--------------|-----------|
| Company Weekly Summary | CEO | Еженедельно (Пн) | Revenue, New Deals, Projects Status, Issues |
| Sales Weekly Report | Head of Sales | Еженедельно (Пн) | Pipeline, Closed Deals, Forecast |
| Finance Monthly Report | CEO + Finance Director | Ежемесячно (1-е число) | P&L, Cash Flow, Outstanding AR |
| Support SLA Report | CEO + PMs | Еженедельно (Пн) | SLA %, Top Issues, Reopen Rate |
| MRR Monthly Report | CEO + Finance Director | Ежемесячно (1-е число) | MRR Changes, Churn, Forecast |

---

## Права доступа к дашбордам

| Роль | Доступные дашборды |
|------|--------------------|
| **CEO** | Все дашборды, все данные |
| **Head of Sales** | Sales + Marketing + Personal |
| **Head of Delivery** | Delivery + Personal |
| **Finance Director** | Finance + Subscription/MRR + Personal |
| **PM** | Delivery (свои проекты) + Support (свои проекты) + Personal |
| **Seller** | Sales (свои показатели) + Personal |
| **Marketing** | Marketing + Personal |
| **Developer** | Personal only |
| **Support** | Support (свои тикеты) + Personal |

**Принцип наименьших привилегий:** каждый видит только то, что нужно для его работы. Seller не видит финансовый дашборд, разработчик не видит продажи.

---

## Связи с другими модулями

Dashboards агрегируют данные из всех модулей NBOS:

```
CRM ──────────→ Sales Dashboard, Marketing Dashboard
Finance ──────→ Finance Dashboard, CEO Dashboard
Subscriptions → Subscription/MRR Dashboard, Finance Dashboard
Projects Hub ─→ Delivery Dashboard, CEO Dashboard
Tasks ────────→ Delivery Dashboard, Personal Dashboard
Support ──────→ Support Dashboard
Calendar ─────→ Personal Dashboard
My Company ───→ CEO Dashboard (Team), Personal Dashboard
```

---

## Этапы внедрения

Дашборды строятся **инкрементально** — от самых критичных к второстепенным:

| Этап | Дашборды | Приоритет | Зависимости |
|------|----------|-----------|-------------|
| **MVP** | Personal Dashboard (задачи) | Критичный | Tasks Module |
| **v1.0** | CEO Dashboard (базовый) + Finance Dashboard | Критичный | Finance Module |
| **v1.1** | Sales Dashboard + Marketing Dashboard | Высокий | CRM Module |
| **v1.2** | Delivery Dashboard | Высокий | Projects + Tasks |
| **v2.0** | Support Dashboard + Subscription/MRR | Средний | Support + Subscriptions |
| **v2.1** | Scheduled Reports + Export | Средний | Email интеграция |
| **v3.0** | Custom Dashboards (пользователь создаёт свои) | Низкий | — |

---

## Принципы проектирования

1. **Данные, а не мнения** — все метрики вычисляются из реальных данных системы, без ручного ввода
2. **Drill-down** — каждое число ведёт к детализации, от агрегата до конкретной записи
3. **Инкрементальность** — начинаем с малого, расширяем по мере роста потребностей
4. **Ролевой доступ** — каждый видит только свои дашборды, без информационного шума
5. **Actionable** — дашборды не просто показывают числа, а подсказывают действия (красные зоны, алерты, ссылки)
6. **Быстрая загрузка** — дашборд должен открываться за < 3 секунды, тяжёлые расчёты кэшируются
7. **Мобильная адаптация** — ключевые виджеты доступны с мобильного устройства
