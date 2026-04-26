# Dashboards Cleanup Register

> NBOS Dashboards - что нужно привести к новому канону Dashboard Control Center.

## Назначение

Этот файл фиксирует расхождения между текущей реализацией / старой документацией и новым каноном.

Новый канон:

- `Dashboard` = персональный Control Center / пульт управления;
- `Analytics / Reports` = глубокие отчёты и графики;
- Dashboard начинается с pinned actions;
- пользователь может настраивать кнопки и виджеты;
- Priority Feed показывает только важные action cards;
- header не содержит постоянную глобальную кнопку `Create`;
- тяжёлая аналитика не грузится на Dashboard;
- новые модули могут добавлять actions/widgets в Widget Library;
- Dashboard не владеет бизнес-данными, а использует projections из модулей.

---

## A. Already aligned / Уже совпадает с каноном

### A1. Dashboard route exists

Статус: `PARTIAL UI`

В runtime уже есть `/dashboard`.

Остаток: привести его к control-center логике вместо статического набора KPI cards.

### A2. Finance and CRM dashboards exist as module dashboards

Статус: `PARTIAL UI`

Есть отдельные dashboard routes внутри CRM и Finance. Это нормально: module dashboards могут существовать, но главная `/dashboard` должна быть персональным пультом.

---

## B. Runtime / UI stale

### B1. Current Dashboard is mostly static KPI summary

Статус: `STALE UI`

Текущий `/dashboard` показывает сводные карточки по revenue/projects/deals/tasks/tickets/team.

Нужно заменить концепцию на:

- pinned actions;
- priority feed;
- role widgets;
- mini analytics;
- customization.

### B2. Header contains global Create button

Статус: `STALE UI`

По новому канону header не должен содержать постоянную глобальную кнопку `Create`.

Future implementation:

- убрать `Create` из header;
- перенести часто используемые create/open actions в Dashboard pinned actions;
- оставить module-level create buttons внутри конкретных модулей.

### B3. Dashboard does not support user preferences

Статус: `MISSING CODE / MISSING UI`

Нужно добавить:

- pinned actions preferences;
- visible/hidden widgets;
- widget order;
- role default layout;
- reset to default.

### B4. Priority Feed is missing

Статус: `MISSING CODE / MISSING UI`

Нужно добавить action-first feed:

- overdue invoices;
- blocked deals;
- product deadline risks;
- task review requests;
- support SLA risks;
- approvals;
- important announcements.

### B5. Analytics and Dashboard are not separated enough

Статус: `STALE DOCS / NEEDS IA`

Старый документ смешивал Dashboard и Analytics.

Нужно:

- Dashboard = рабочий пульт;
- Analytics/Reports = отчёты, графики, exports, period comparison.

---

## C. Runtime missing / Needs implementation

### C1. Widget Library is missing

Статус: `MISSING CODE`

Нужно добавить декларативную регистрацию:

- dashboard actions;
- dashboard widgets;
- module owner;
- required permission;
- feature flag;
- default roles.

### C2. Dashboard projections are missing

Статус: `MISSING CODE`

Модули должны отдавать лёгкие dashboard projections, а не заставлять `/dashboard` самому тянуть полные списки entities.

### C3. Announcement confirmations are missing

Статус: `MISSING CODE / MISSING UI`

Нужно добавить возможность показывать важное сообщение и требовать confirmation.

### C4. Role-based dashboard defaults are missing

Статус: `MISSING CODE / MISSING UI`

Нужно определить default layout для:

- Owner;
- Seller;
- PM;
- Developer;
- Finance;
- Support.

### C5. Lazy loading and widget failure isolation are missing

Статус: `NEEDS HARDENING`

Dashboard не должен падать, если один модуль недоступен.

Нужно:

- widget-level loading;
- widget-level error;
- widget-level empty state;
- independent refresh.

---

## D. Implementation order

1. Remove global `Create` from header.
2. Add DashboardPreference model.
3. Add Pinned Actions UI.
4. Add default actions by role.
5. Add Priority Feed MVP.
6. Convert current KPI cards into optional widgets.
7. Add Widget Library registry.
8. Add module projections.
9. Add Analytics/Reports separation.
10. Add announcements/confirmations.

## E. Non-goals for MVP

В MVP не нужно:

- custom chart builder;
- full analytics designer;
- scheduled reports;
- advanced cohort analysis;
- real-time websocket for every widget;
- drag-and-drop dashboard grid if it delays MVP too much.
