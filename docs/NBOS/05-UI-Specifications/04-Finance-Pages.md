# Страницы Finance модуля

## 1. Общее описание

Finance-модуль NBOS обеспечивает полное управление финансами IT-компании: счета, платежи, подписки, расходы, бонусы, зарплаты и отчёты P&L. Модуль построен вокруг визуальных досок и гридов для максимальной наглядности финансового состояния.

**Доступ:**

- CEO, Finance Director — полный доступ ко всем разделам
- PM — просмотр счетов и расходов по своим проектам
- Seller — просмотр бонусной доски (только свои бонусы)
- Остальные роли — нет доступа

### 1.1. Навигация модуля (IA)

- **Сайдбар:** **4 зоны** — Overview, Revenue, Expenses, Payroll (без плоского списка всех URL). Клик по зоне открывает **последнюю** страницу зоны (`localStorage`, как Board/List); первый заход — default (Overview → Dashboard, Revenue → Orders, …).
- **Page hero (как CRM):** карточка `Finance` + pill-tabs **внутри текущей зоны**:
  - Overview: Dashboard | **Unit economics** | Reports | Journal — hero: поиск + Settings; период (Dashboard/Reports) в фильтрах; Journal — month filter + поиск записей; **Dashboard** — блок «Finance zones» (4 карточки зон + ссылки, last-visited)
  - Revenue: Orders | Invoices | Payments | Subscriptions
  - Expenses: Pay Now | Expenses Plan | Client services
  - Payroll: Payroll | Salary | Bonus | Bonus pools
- **Employee Wallet:** не в Finance sidebar; маршрут `/my-account/wallet`, пункт в account menu (данные только текущего пользователя, `/api/me/wallet`).
- **Поиск / фильтры / Board|List:** в hero через `useModuleHeroSlots` (эталон — CRM Leads). **Поиск** — по центру карточки hero (`PageHero` middle column, `max-w-3xl`), слева title + zone tabs, справа view/actions. Суммы по колонкам Kanban — под заголовком колонки (как Deals), не отдельная аналитическая полоса на странице.

---

## 2. Страница счетов (Invoices)

**Путь:** `/finance/invoices`

### 2.1. Основной вид — Kanban-доска

Колонки соответствуют стадиям жизненного цикла счёта:

| Колонка       | Описание                                      | Цвет        |
| ------------- | --------------------------------------------- | ----------- |
| New           | Счёт создан, ещё не оформлен                  | Серый       |
| Create in Gov | Создать в государственной системе (e-invoice) | Синий       |
| Sent          | Счёт отправлен клиенту                        | Голубой     |
| Overdue       | Просрочен (дата оплаты прошла)                | Красный     |
| On Hold       | На паузе (по договорённости с клиентом)       | Жёлтый      |
| Paid          | Оплачен полностью                             | Зелёный     |
| Unpaid        | Отменён / не будет оплачен                    | Тёмно-серый |

### 2.2. Карточка счёта на доске

| Элемент             | Описание                                                  |
| ------------------- | --------------------------------------------------------- |
| Сумма               | Крупный шрифт, основной элемент карточки                  |
| Клиент              | Имя компании или контакта                                 |
| Проект              | Название связанного проекта                               |
| Тип бейдж           | Product / Extension / Subscription (цветная метка)        |
| Дата оплаты         | Due date                                                  |
| Индикатор просрочки | Красная метка с количеством дней просрочки (если overdue) |

### 2.3. Табличный вид

Переключатель: `Kanban | List`

Сортируемые колонки: номер счёта, сумма, клиент, проект, тип, стадия, дата выставления, дата оплаты, дней просрочки.

### 2.4. Фильтры

- **По проекту:** выпадающий список проектов
- **По клиенту:** поиск по компании/контакту
- **По типу:** Product / Extension / Subscription
- **По статусу:** мультивыбор стадий
- **По дате:** диапазон дат выставления или оплаты

### 2.5. Автоматизация (Run Automation)

Кнопка `Run Automation` доступна Finance Director и CEO. Запускает цикл напоминаний для неоплаченных счетов:

- Формирует список просроченных счетов
- Генерирует напоминания (email/messenger) по шаблону
- Устанавливает follow-up таймеры
- Логирует все действия в аудит

### 2.6. Массовые действия

При выборе нескольких счетов:

- **Mark as Paid** — отметить как оплаченные (массово)
- **Send Reminder** — отправить напоминание
- **Export** — экспорт выбранных в CSV/PDF

### 2.7. Карточка счёта (Invoice Detail)

Клик по карточке → полная информация:

- Номер, дата, сумма, статус
- Связанный заказ (Order) и подписка (Subscription)
- Информация об оплате: дата оплаты, способ, подтверждение
- Клиент: контакт и компания (ссылки)
- Проект (ссылка)
- История стадий
- Прикреплённые документы

---

## 3. Страница подписок (Subscription Grid)

**Путь:** `/finance/subscriptions`

### 3.1. Матричный вид (Grid)

Основной и **единственный** вид списка — одна матрица (отдельная таблица-список под гридом не используется).

**Структура строки:**

- **Subscription (левая колонка, две строки)** — сверху название **проекта** (клик → sheet); снизу ряд иконок (тип, billing day, partner, overdue/pending). Справа — кнопка **статуса** (меню смены; без «Open details»). Цвет полосы слева = status
- **Jan … Dec** — `150,000֏` + цвет ячейки (полный `AMD` в tooltip при наведении)
- **Annual** — тот же формат `150,000֏`

**В Sheet:** type label, partner, company, /mo, coverage, start/end, invoices, полное редактирование billing.

**Канон строки:** одна запись = одна подписка (`subscription_id`) с одним `type`; у проекта может быть несколько подписок разных типов (отдельные строки). `DEV_AND_MAINTENANCE` — один тип договора, не «две подписки в одной».

**Цветовая кодировка ячеек:**
| Цвет | Значение |
|------|----------|
| Зелёный | Оплачено |
| Красный | Не оплачено (просрочено) |
| Жёлтый | Ожидает оплаты (счёт выставлен) |
| Серый | Не применимо (подписка не активна в этом месяце) |

### 3.2. Навигация по гриду

- **Клик по строке (кроме ячейки-счёта):** Subscription Detail Sheet
- **Правая колонка Annual:** годовой итог по подписке
- **Нижняя строка Total:** месячные итоги по всем подпискам
- **Клик по ячейке месяца с invoice:** переход к Invoice Card (deep link)

### 3.3. Верхняя сводная панель (Summary Bar)

| Метрика           | Описание                                     |
| ----------------- | -------------------------------------------- |
| Total MRR         | Общий месячный рекуррентный доход            |
| Paid this month % | Процент оплаченных подписок за текущий месяц |
| Total Outstanding | Общая сумма неоплаченных подписок            |

### 3.4. Редактирование и прогноз

- **Изменение суммы:** клик по ячейке будущего месяца позволяет изменить сумму подписки. Все изменения логируются в истории.
- **Прогноз:** будущие месяцы показываются с пунктирной рамкой и прогнозируемой суммой на основе текущей подписки.
- **История изменений:** доступна по наведению на ячейку (tooltip) или через отдельную панель.

### 3.5. Фильтры

- **По типу подписки:** Monthly / Quarterly / Annual
- **По статусу оплаты:** Paid / Unpaid / Pending / All

---

## 4. Страница расходов (Expenses)

Раздел расходов должен разделять `Expense Plans / Планы расходов`, `Expense Cards / Карточки расходов`, `Expense Payments / Оплаты расходов` и `Expense Backlog / Долги и отложенные расходы`.

Для финансовых экранов с датами должны быть доступны виды:

- `List / Список`;
- `Board / Доска`;
- `Calendar/Grid / Календарная сетка`.

Последний выбранный пользователем вид должен запоминаться и открываться снова.

### 4.1. Expense Plans / Плановые расходы

**Путь:** `/finance/expenses/plans` (Finance top tab **Expense plans**, отдельно от доски карточек)

Default view: `Calendar Grid / Календарная сетка`.

- строки: планы расходов;
- колонки: месяцы;
- ячейки: ожидаемая сумма, статус и цвет;
- клик по ячейке открывает карточку плана или список созданных карточек за месяц.

Дополнительные виды:

- `List / Список`;
- `Board / Доска` (колонки по частоте: Monthly, Quarterly, Yearly, …);
- `Calendar/Grid / Календарная сетка`.

Web: переключатель **Grid | Board | List**; выбор сохраняется в `localStorage`.

### 4.2. Expense Board / Доска расходов

**Путь:** `/finance/expenses` (Finance top tab **Expense board**; sub-nav: Active / Backlog / Closed)

Default view: `Board / Доска` (kanban; переключатель Board/List, выбор в `localStorage`).

Колонки:

| Колонка  | Описание                       |
| -------- | ------------------------------ |
| Planned  | Запланировано                  |
| Due Soon | Скоро оплатить                 |
| Due Now  | Нужно оплатить                 |
| Overdue  | Просрочено                     |
| On Hold  | На паузе внутри текущего цикла |

`Paid` и `Cancelled` должны уходить в `Closed / Закрытые`, чтобы не перегружать текущую доску.

### 4.3. Expense Backlog / Долги и отложенные

**Путь:** `/finance/expenses/backlog`

Это отдельный список расходов, которые вышли из текущего цикла оплаты.

Причины:

- `Debt to Pay Later / Долг, оплатить позже`;
- `Waiting for Decision / Ждём решение`;
- `Waiting for Client / Ждём клиента`;
- `Waiting for Provider / Ждём поставщика`;
- `Other / Другое`.

Backlog должен показывать отдельную сумму накопленного долга и не смешиваться с текущим месячным планом.

### 4.4. Карточка расхода

| Элемент                  | Описание                                             |
| ------------------------ | ---------------------------------------------------- |
| Название                 | Описание расхода                                     |
| Original Amount          | Исходная сумма                                       |
| Paid Amount              | Уже оплачено                                         |
| Remaining Amount         | Осталось оплатить                                    |
| Payment Status           | Unpaid / Partially Paid / Paid                       |
| Категория бейдж          | Salary / Service / Domain / Hosting / Office / Other |
| Ссылка на проект         | Если расход привязан к проекту                       |
| Ссылка на Client Service | Если расход создан из сервиса клиента                |
| Ссылка на Invoice Card   | Если это pass-through                                |
| Дата оплаты              | Плановая дата                                        |
| Payments                 | Список частичных оплат                               |

Действие `Add Payment / Добавить оплату` создаёт частичную или полную оплату расхода.

### 4.5. Быстрое добавление

Кнопка `+ New Expense` открывает компактное модальное окно для ручного внепланового расхода:

- **название**;
- **сумма**;
- **дата оплаты** — по умолчанию следующий рабочий день (пн–пт), пользователь может изменить.

После создания карточка сразу открывается в **detail sheet**; остальные поля (категория, тип, частота, статус, проект, налог, pass-through, заметки и т.д.) заполняются там. При открытии из drill-down `?projectId=` проект подставляется на сервере без отдельного поля в модалке; при создании из backlog — статус по контексту экрана.

---

## 5. Бонусная доска (Bonus Board)

**Путь:** `/finance/bonuses`

### 5.1. Виды отображения

Доступные виды (реализовано, `localStorage`):

- `Board` — kanban по статусу бонуса;
- `List` — плоская таблица;
- `Employee` — группировка по сотруднику;
- `Product` — группировка по проекту;
- `Payroll` — preview по `payoutMonth` (месяц payroll / «No payroll month»).

Legacy URL `/bonus` редиректит на `/finance/bonuses` с сохранением query.

Сверху фильтрованного набора — счётчики: visible entries, pipeline total.

### 5.2. Kanban-доска

Переключатель scope в фильтрах hero: **Active** (default) | **All statuses** | **Closed** — меняет набор данных, не отдельный UI.

**Active board** — упрощённые колонки (общий `KanbanBoard`, суммы под заголовком колонки):

| Колонка     | Full statuses                         |
| ----------- | ------------------------------------- |
| Incoming    | Incoming                              |
| In Progress | Earned / Pending Eligibility / Vested |
| Active      | Войдут в ближайший payroll            |

**Closed board** — терминальные исходы (288px колонки):

| Колонка  | Описание               |
| -------- | ---------------------- |
| Paid     | Выплачены              |
| Clawback | Отзывы и корректировки |

На карточке показывается **full status** badge (Incoming / Earned / …), тип бонуса, сумма, процент (если есть), проект, payroll month.

### 5.3. Карточка бонуса

| Элемент        | Описание                                                                    |
| -------------- | --------------------------------------------------------------------------- |
| Имя сотрудника | Кому начислен бонус                                                         |
| Проект / заказ | За какой проект или заказ                                                   |
| Сумма          | Размер бонуса                                                               |
| Процент        | От какой суммы рассчитан, если процентный                                   |
| Тип бейдж      | Sales / Delivery / Marketing / PM / Design                                  |
| Full status    | Incoming / Earned / Pending Eligibility / Vested / Active / Paid / Clawback |
| Payroll month  | В какой payroll попадёт                                                     |

### 5.4. Фильтры

- **По сотруднику:** выпадающий список
- **По проекту:** выпадающий список
- **По типу:** Sales / Delivery / Marketing
- **По месяцу:** выбор месяца

### 5.5. Персональный вид

Переключатель `All | My Bonuses` — при активации «My Bonuses» показываются только бонусы текущего пользователя. Для роли Seller включён по умолчанию.

### 5.6. Сводная панель (Summary Bar)

| Метрика            | Описание                      |
| ------------------ | ----------------------------- |
| Total Incoming     | Общая сумма ожидающих бонусов |
| Total Active       | Общая сумма активных бонусов  |
| Total Paid (month) | Выплачено за текущий месяц    |

---

## 6. Зарплатная ведомость (Salary Board)

**Путь:** `/finance/salary`

### 6.1. Основной вид

Default view: `Calendar` (сотрудники × месяцы). Переключатель видов (`localStorage`):

- `Calendar` — матрица employee × month (карточка с годом, цветные ячейки по **line status**, итог по сотруднику справа);
- `List` — плоская таблица с footer totals;
- `Board` — kanban по payout phase (`Fully paid` / `Active payout` / `Accumulating`).

- строки: сотрудники;
- колонки: месяцы;
- ячейка calendar: статус line + payable в цвете статуса;
- панель totals над видом: visible lines, payable, paid, remaining (по активным фильтрам).

**Список payroll runs** (`/finance/payroll`): виды `List` (строка целиком в цвете статуса run) и `Calendar` (год × 12 месяцев, ячейка в цвете статуса).

Клик по заголовку месяца открывает:

`Payroll Run Detail / Зарплатный расчёт за месяц`

Клик по ячейке открывает:

`Salary Detail / Зарплата сотрудника за месяц`

### 6.2. Payroll Run Detail

**Путь:** `/finance/payroll/[id]`

Главный рабочий экран месяца. Сверху — статус run, KPI (collapsible), **Allocation Matrix** (основная зона), ниже — salary lines, bonus releases (collapsible), audit/journal.

#### Allocation Matrix

Переключатель вида:

| View        | Строки             | Колонки                |
| ----------- | ------------------ | ---------------------- |
| By employee | Сотрудники (+ fix) | Delivery payable units |
| By order    | Delivery units     | Сотрудники             |

**Delivery payable unit** — заказ `PRODUCT` / `EXTENSION` с delivery-бонусами (не domain/hosting/license).

Поведение UI:

- sticky header + sticky первый столбец;
- горизонтальный/вертикальный scroll при большом числе колонок;
- drag колонок (grip на заголовке) + стрелки reorder row/column;
- pin delivery unit (закрытые unit для extra bonus позже);
- **Reset layout** — сброс порядка и pin для текущего view;
- клик по заголовку row/column — панель funding/bonus breakdown;
- клик по ячейке — диалог: release this month, edit planned bonus, reassign recipient (до оплаты).

Цвета ячеек: gray unlinked, blue linked empty, green release, orange manual, extra/over funding с reason.

Layout (row/column order, pins) — в БД per user, per payroll run, per view mode.

#### Salary lines (ниже матрицы)

| Колонка           | Описание                                          |
| ----------------- | ------------------------------------------------- |
| Employee          | Сотрудник                                         |
| Base Salary       | Фикс                                              |
| Bonuses           | Бонусы месяца                                     |
| KPI / Adjustments | KPI и корректировки                               |
| Deductions        | Удержания                                         |
| Total             | Итого к выплате                                   |
| Paid              | Уже выплачено                                     |
| Remaining         | Осталось                                          |
| Status            | Pending / Approved / Partially Paid / Paid / Held |
| Expense Card      | Связанная карточка расхода                        |

Статусы Payroll Run:

- Draft;
- Review;
- Approved;
- Paying;
- Closed.

### 6.3. Salary Detail

Карточка `employee + month`:

- fix salary;
- bonuses;
- KPI;
- deductions;
- total;
- paid amount;
- remaining amount;
- partial payments;
- linked expense card;
- linked bonus entries.

### 6.4. Действия Finance Director

- перевести payroll в review;
- утвердить payroll;
- создать expense cards;
- добавить частичную или полную выплату через linked expense card;
- закрыть payroll после полного завершения.

### 6.5. Сводная панель

| Метрика           | Описание                          |
| ----------------- | --------------------------------- |
| Total Base Salary | Общая сумма фиксированных зарплат |
| Total Bonuses     | Общая сумма бонусов               |
| Total Payable     | Итого к выплате                   |
| Total Paid        | Уже выплачено                     |
| Remaining         | Осталось выплатить                |

### 6.6. Unit Economics Board

**Путь:** `/finance/unit-economics` (зона Finance Overview).

Операционный hub денег по delivery unit (Product / Extension): **In** (received + receivable), **Out** (spent + bonus to pay + committed), **Balance** (cash, margin). Bonuses — часть Out, не отдельный продукт.

Вкладки:

| Tab           | Содержание                                    |
| ------------- | --------------------------------------------- |
| By unit       | Таблица delivery units + итоги                |
| By project    | Roll-up In/Out/Balance по проекту (с API)     |
| By product    | Roll-up по product / extension внутри проекта |
| Cash          | Received, cash balance, margin                |
| Outflows      | Spent + bonus columns по unit                 |
| Profitability | Margin, received, expenses, bonus commitments |

Drill-down: клик по суммам In/Out открывает sheet (**Invoices**, **Payments**, **Expenses**, **Bonuses**); кнопка **Bonus breakdown** — order-scoped pool (`ProductBonusPoolSheet`, данные из order detail, не `GET /api/bonus/products/pools`). `/finance/bonus-pools` редиректит сюда.

API: `GET /api/unit-economics` (items + `projects` + `products` roll-ups + totals), `GET /api/unit-economics/orders/:orderId` (drill-down + `bonusBreakdown`).

Связь с P&L: те же факты; Unit Economics — для работы Finance, P&L — read-only аналитика.

---

## 7. Отчёты P&L (P&L Reports)

**Путь:** `/finance/pnl`

### 7.1. Вкладки отчётов

```
Company P&L | Project P&L | Product P&L | Order P&L | Cash Flow | MRR | Journal
```

### 7.2. Company P&L (P&L компании)

**Верхний блок — ключевые метрики:**
| Метрика | Описание |
|---------|----------|
| Total Revenue | Доходы из Payment / journal entries |
| Direct Costs | Прямые расходы из Expense Cards / Expense Payments |
| Gross Margin | Валовая маржа |
| Operating Costs | Операционные расходы |
| Net Margin | Чистая маржа |

**Графики:**

- Столбчатая диаграмма: Revenue vs Expenses по месяцам
- Линейный график: тренд чистой прибыли
- Круговая диаграмма: структура расходов по категориям

**Таблица детализации:**

- Строки: статьи доходов и расходов
- Колонки: месяцы
- Итоговые строки: Revenue, Expenses, Profit

**Сравнение периодов:**

- Переключатель: Month-over-Month / Quarter-over-Quarter / Year-over-Year
- Процент изменения с цветовым индикатором (рост = зелёный, падение = красный)

### 7.3. Project P&L (P&L проекта)

**Селектор проекта:** выпадающий список или поиск по названию проекта.

После выбора проекта отображается:

- Revenue: все оплаченные счета по проекту
- Expenses: все расходы, привязанные к проекту
- Margin: маржа проекта
- Детализация по продуктам и расширениям
- Сравнение Plan vs Actual (если бюджет задан)

### 7.4. Product P&L (P&L продукта)

Показывает доходы и расходы конкретного продукта.

Источники:

- product orders;
- product subscription payments;
- extension revenue;
- product-related client services;
- product-linked expense cards.

### 7.5. Order P&L (P&L заказа)

Показывает маржу конкретного заказа:

- payments по invoice cards заказа;
- sales / delivery bonuses;
- partner payouts;
- прямые expense cards, если они относятся к order.

### 7.6. Cash Flow (Денежный поток)

Показывает:

- текущий баланс;
- ожидаемые поступления из open invoice cards;
- будущие subscription invoice cards;
- upcoming expense cards;
- payroll runs;
- expense backlog отдельным блоком.

`Expense Backlog` не должен смешиваться с текущим платёжным циклом.

### 7.7. MRR Report (отчёт по рекуррентной выручке)

**Тренд MRR:**

- Линейный график MRR по месяцам
- Разбивка: New MRR (новые подписки) / Expansion MRR (увеличение) / Churn MRR (отток)

**Разбивка по подпискам:**

- Таблица: проект, сумма подписки, дата начала, статус (Pending / Active / On Hold / Cancelled / Completed)
- Сортировка по сумме (убывание)

**Анализ оттока (Churn Analysis):**

- Churn Rate за период (% потерянного MRR)
- Список отменённых/приостановленных подписок
- Причины оттока (если указаны)

### 7.8. Journal View (Журнал операций)

Доступен только CEO / Finance.

Показывает:

- дату;
- source type;
- source id;
- amount;
- currency;
- cash/accrual basis;
- project;
- product;
- order;
- employee;
- period.

### 7.9. Drill-down

Любая сумма в отчётах должна открываться до источника:

- revenue -> payments;
- receivables -> invoice cards;
- salaries -> payroll run / salary lines;
- expenses -> expense cards / expense payments;
- pass-through margin -> invoice card + expense card pair.

---

## 8. Страница платежей (Payments)

**Путь:** `/finance/payments`

### 8.1. Реестр платежей

Табличный вид всех входящих платежей:

| Колонка       | Описание                             |
| ------------- | ------------------------------------ |
| Дата          | Дата получения платежа               |
| Сумма         | Размер платежа                       |
| Клиент        | Компания / контакт                   |
| Проект        | Связанный проект                     |
| Счёт          | Связанный Invoice                    |
| Способ оплаты | Bank Transfer / Card / Cash / Crypto |
| Подтверждение | Статус подтверждения                 |

### 8.2. Фильтры

- По клиенту, по проекту, по дате, по способу оплаты, по сумме (диапазон)

---

## 9. Страница доменов (Domains)

**Путь:** `/finance/domains`

### 9.1. Табличный вид

| Колонка        | Описание                         |
| -------------- | -------------------------------- |
| Домен          | Доменное имя                     |
| Регистратор    | Где зарегистрирован              |
| Проект         | Связанный проект                 |
| Дата истечения | Когда нужно продлить             |
| Стоимость      | Стоимость продления              |
| Статус         | Active / Expiring Soon / Expired |
| Автопродление  | Вкл/Выкл                         |

### 9.2. Уведомления

Домены с приближающимся сроком истечения (< 30 дней) выделяются жёлтым. Просроченные — красным. Система генерирует уведомления Finance Director заблаговременно.

---

## 10. UX-паттерны Finance модуля

| Паттерн          | Реализация                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| Color Coding     | Единая цветовая схема статусов: зелёный (paid), красный (overdue), жёлтый (pending), серый (N/A) |
| Grid Navigation  | Ctrl+Click по ячейке грида → открытие в новой вкладке                                            |
| Inline Editing   | Суммы в гридах редактируются прямо в ячейке (double-click)                                       |
| Export           | Каждая страница поддерживает экспорт в CSV, Excel, PDF                                           |
| Currency         | Все суммы отображаются в основной валюте компании с возможностью конвертации                     |
| Drill-down       | Клик по любой сумме в отчётах раскрывает детализацию                                             |
| Real-time Totals | Итоговые строки пересчитываются при применении фильтров                                          |
