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

Статус: `PARTIAL DONE` (2026-04-30)

`/dashboard` P0 now uses the Control Center shape instead of the old heavy KPI summary.

Shipped:

- permission-filtered pinned actions;
- priority feed cards for current lightweight risk signals;
- mini analytics with links to source modules / Reports.

Remaining:

- user preferences;
- role default layouts;
- module-owned projection endpoints instead of client-side lightweight aggregation;
- widget library/customization.
- customization.

### B2. Header contains global Create button

Статус: `STALE UI`

По новому канону header не должен содержать постоянную глобальную кнопку `Create`.

Future implementation:

- убрать `Create` из header;
- перенести часто используемые create/open actions в Dashboard pinned actions;
- оставить module-level create buttons внутри конкретных модулей.

### B3. Dashboard does not support user preferences

Статус: `PARTIAL DONE` (2026-04-30)

Shipped P0:

- `DashboardPreference` per employee;
- pinned action order / hidden pinned actions;
- visible / hidden / compact widget arrays;
- `PATCH /api/dashboard/preferences` with known-key validation;
- web hide controls for pinned actions and mini widgets;
- reset layout action.

Remaining:

- drag-and-drop ordering UI;
- role default layout depth;
- personal links integration;
- full widget library UI.

### B4. Priority Feed is missing

Статус: `PARTIAL DONE` (2026-04-30)

Shipped P0 action-first feed:

- critical support tickets;
- tasks due today;
- pending invoices.

Future feed sources:

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

Статус: `PARTIAL` (2026-04-30)

Shipped: local declarative registry for P0 pinned actions and mini metrics.

Future platform registry still needed:

- dashboard actions;
- dashboard widgets;
- module owner;
- required permission;
- feature flag;
- default roles.

### C1a. Personal links are not available as pinned actions

Статус: `MISSING CODE / MISSING UI`

Нужно добавить единый механизм:

```text
PersonalLink -> Sidebar My Links
PersonalLink -> Dashboard Pinned Actions
```

Dashboard должен уметь показывать personal links вместе с другими pinned actions, но с явным external badge для внешних URL и открытием внешних ссылок в новой вкладке по умолчанию.

### C2. Dashboard projections are missing

Статус: `PARTIAL DONE` (2026-04-30)

Shipped P0:

- `GET /api/dashboard/control-center`;
- lightweight counts for tasks, deals, invoices and support tickets;
- backend-generated priority cards for support/tasks/finance signals;
- web `/dashboard` consumes this projection instead of fetching full source lists.

Remaining:

- module-owned projection adapters instead of a central service querying all sources directly;
- role-based source filtering beyond route-level Dashboard permission;
- richer delivery/product risk projections.

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
2. ~~Add DashboardPreference model.~~ Done P0 (2026-04-30): per-employee preferences.
3. ~~Add Pinned Actions UI.~~ Done P0 (2026-04-30): permission-filtered default actions.
4. Add default actions by role.
5. Add PersonalLink support inside Dashboard pinned actions.
6. ~~Add Priority Feed MVP.~~ Done P0 (2026-04-30): support/tasks/invoices signals.
7. ~~Convert current KPI cards into optional widgets.~~ Done P0 (2026-04-30): lightweight mini analytics, no heavy charts.
8. Add Widget Library registry.
9. ~~Add module projections.~~ Partial P0 (2026-04-30): central lightweight Dashboard projection endpoint.
10. Add Analytics/Reports separation.
11. Add announcements/confirmations.

## E. Non-goals for MVP

В MVP не нужно:

- custom chart builder;
- full analytics designer;
- scheduled reports;
- advanced cohort analysis;
- real-time websocket for every widget;
- drag-and-drop dashboard grid if it delays MVP too much.
