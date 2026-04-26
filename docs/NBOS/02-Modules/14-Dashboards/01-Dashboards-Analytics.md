# Dashboard Control Center and Analytics

> NBOS Platform - персональный пульт управления, priority feed, role widgets и отдельный слой аналитики.

## Назначение

`Dashboard / Главная` - это не просто набор графиков. Это персональный **Control Center / Пульт управления**, который открывается первым и помогает сотруднику быстро понять:

- что требует внимания сейчас;
- куда нужно перейти чаще всего;
- какие действия нужно сделать сегодня;
- какие важные уведомления нельзя пропустить;
- какие показатели коротко показывают здоровье его зоны ответственности.

Главный принцип:

```text
Dashboard = action center / пульт управления.
Analytics = reports / глубокая аналитика.
```

Dashboard должен быть быстрым, персональным и полезным каждый день. Глубокие отчёты, сравнения периодов и большие графики живут в `Analytics / Reports`, а не перегружают главную.

---

## Основные зоны Dashboard

```text
Dashboard
  Pinned Actions
  Priority Feed
  Role Widgets
  Mini Analytics
  Announcements / Confirmations
  Customize Panel
```

### 1. Pinned Actions / Быстрые закреплённые действия

Верхняя зона Dashboard.

Пользователь сам собирает из доступных ему действий свой рабочий пульт:

- закрепить кнопку;
- убрать кнопку;
- изменить порядок drag-and-drop;
- открыть список всех доступных действий;
- вернуть default layout по роли.

Примеры действий:

- `New Lead`;
- `New Task`;
- `Open My Work Space`;
- `Open Product Board`;
- `Open Invoices`;
- `Open Salary Board`;
- `Open Messenger`;
- `Open Calendar`;
- `Open Credentials Vault`;
- `Create Support Ticket`;
- `Open Client Services`;
- `Open Partner Payouts`.

Доступные действия фильтруются RBAC и feature flags.

Важно: глобальная кнопка `Create` в header не нужна. Создание сущностей должно жить:

- в pinned actions Dashboard;
- в контексте конкретного модуля;
- в quick command/search, если будет реализован.

### 2. Priority Feed / Важное сейчас

Лента карточек, которые требуют реакции.

Примеры:

- invoice overdue;
- deal stage blocked;
- product deadline risk;
- task waiting for review;
- support ticket SLA risk;
- credential access review required;
- payroll approval pending;
- partner payout ready;
- on-hold pause expired;
- important announcement needs confirmation.

Priority Feed не должен быть обычным списком уведомлений. Это отфильтрованная рабочая очередь: меньше шума, больше действий.

### 3. Role Widgets / Рабочие виджеты

Виджеты зависят от роли, seats и permissions.

Пользователь может:

- показать/скрыть виджет;
- поменять порядок;
- закрепить наверху;
- оставить только важные блоки;
- добавить новый виджет из Widget Library.

### 4. Mini Analytics / Короткая аналитика

Dashboard показывает только короткие показатели:

- 3-5 KPI по роли;
- без тяжёлых графиков;
- без больших исторических отчётов;
- с переходом в Analytics/Reports для детализации.

### 5. Announcements / Confirmations

Dashboard может показывать важные объявления, которые нужно подтвердить:

- company announcement;
- process change;
- security warning;
- policy update;
- incident notice;
- release note;
- required acknowledgment.

Если confirmation обязателен, карточка остаётся в Priority Feed до подтверждения.

---

## Header boundary

Header должен оставаться лёгким и глобальным.

В header входят:

- global search / quick switcher;
- notifications;
- messenger shortcut, если понадобится;
- my account;
- user/session menu.

В header не должна жить постоянная глобальная кнопка `Create`.

Причина: `Create` почти всегда контекстный. Создание lead, task, invoice, ticket, expense или credential требует разных прав и разных полей. Если держать это в header, он быстро станет шумным и начнёт дублировать Dashboard и модули.

Правильное место:

```text
Dashboard pinned actions
Module page action button
Command palette / search later
```

---

## Role-based Dashboard

### Owner / CEO Dashboard

Цель: здоровье бизнеса и риски.

Показывает:

- cash / receivables summary;
- overdue invoices;
- high-risk products by deadline;
- blocked deals;
- payroll/bonus approvals;
- partner payout risk;
- support SLA risk;
- team capacity summary;
- important announcements.

### Personal Dashboard

Цель: личная работа на сегодня.

Показывает:

- my pinned actions;
- my tasks today / overdue;
- my task review requests;
- my meetings;
- my unread important messages;
- my notifications requiring action;
- my active Work Spaces;
- my wallet/bonus summary, если есть доступ.

### Sales Dashboard

Цель: продажи без потери лидов и сделок.

Показывает:

- leads needing response;
- deals blocked by missing required fields;
- offers pending confirmation;
- expected deposits;
- won-ready deals blocked by invoice/payment rules;
- seller KPI summary;
- pinned sales actions.

### Delivery / PM Dashboard

Цель: сдать Product/Extension вовремя.

Показывает:

- products at deadline risk;
- extensions at deadline risk;
- on-hold products with expired pause;
- QA/Transfer waiting items;
- tasks waiting for review;
- active Work Spaces;
- support tickets linked to active products.

### Finance Dashboard

Цель: деньги, платежи и обязательства.

Показывает:

- invoices overdue / due soon;
- subscription billing issues;
- expenses due soon;
- salary/payroll approvals;
- bonus release pending;
- partner payouts;
- client service payments to collect/pay;
- finance pinned actions.

### Support Dashboard

Цель: не пропустить SLA и критичные обращения.

Показывает:

- P1/P2 tickets;
- SLA risk;
- tickets waiting client/team;
- reopened tickets;
- tickets linked to VIP/important clients;
- support workload.

---

## Analytics / Reports

`Analytics / Reports` - отдельный слой для глубокого анализа.

Туда уходят:

- CEO analytics;
- Sales analytics;
- Marketing analytics;
- Delivery analytics;
- Finance analytics;
- Support analytics;
- Subscription/MRR analytics;
- KPI/Scorecard analytics;
- exports;
- scheduled reports;
- period comparison.

Dashboard может показывать маленький summary и вести в Analytics.

Пример:

```text
Dashboard widget: MRR this month + change
Click -> Analytics / Subscription report
```

---

## Widget Library

Любой новый модуль может добавлять actions и widgets в Dashboard.

### Action definition

```text
DashboardAction
  key
  label
  description
  target_url
  icon
  module
  required_permission
  feature_flag
  default_roles
```

### Widget definition

```text
DashboardWidget
  key
  title
  module
  size
  data_source
  required_permission
  feature_flag
  default_roles
  refresh_policy
```

### User preference

```text
DashboardPreference
  user_id
  pinned_actions
  visible_widgets
  widget_order
  hidden_widgets
  default_tab
```

---

## Performance rule

Dashboard должен открываться быстро.

Правила:

- сначала загружаются pinned actions и shell;
- затем Priority Feed;
- затем role widgets lazy-loaded;
- тяжёлая аналитика не грузится на Dashboard;
- каждый виджет имеет loading/error/empty state;
- данные виджетов могут кэшироваться;
- Dashboard не должен ждать все модули, чтобы отрисоваться.

Цель:

```text
First useful view < 1 second
Full dashboard widgets < 3 seconds
Heavy analytics only in Analytics / Reports
```

---

## Drill-down

Каждая карточка должна вести к действию или сущности.

```text
3 overdue invoices
  -> click
    -> filtered Invoice Board
      -> Invoice Card
```

```text
2 products at risk
  -> click
    -> filtered Delivery Board
      -> Product Card
```

Если карточка не ведёт к действию, её нужно пересмотреть: возможно, это analytics, а не dashboard.

---

## Access and privacy

Dashboard respect:

- RBAC;
- entity ownership;
- department scope;
- feature flags;
- module permissions;
- sensitive finance/credentials restrictions.

Пример:

- Seller видит свои deals и свой bonus summary;
- Developer не видит finance totals;
- Finance видит invoices/payroll, но не secrets;
- Owner видит company-wide summary.

---

## Implementation phases

### MVP

- pinned actions;
- user preferences;
- personal dashboard;
- priority feed basic;
- role-based widget visibility;
- hide global header `Create`.

### v1

- Owner/CEO dashboard;
- Sales/Delivery/Finance role dashboards;
- widget library;
- announcements with confirmations.

### v2

- Analytics / Reports area;
- scheduled reports;
- custom dashboards;
- advanced widgets;
- cross-module insights.

---

## Canonical rule

```text
Dashboard is the first working screen, not a reporting archive.
If it requires action, it belongs on Dashboard.
If it explains performance over time, it belongs in Analytics / Reports.
```
