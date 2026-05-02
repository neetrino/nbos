# Reports / Analytics Overview

> NBOS Platform - слой глубоких отчётов, трендов, сравнений периодов, exports и scheduled reports.

## Назначение

`Reports / Analytics` - это отдельный слой для анализа бизнеса за период.

Он отвечает на вопросы:

- что произошло за неделю/месяц/квартал;
- какие каналы/команды/проекты дают результат;
- где есть отклонения;
- какие тренды становятся лучше или хуже;
- что нужно выгрузить, отправить или обсудить на встрече.

Главный принцип:

```text
Dashboard = what needs attention now.
Reports / Analytics = what happened and what it means.
```

Reports не должен превращаться в операционную доску. Если карточка требует действия сейчас, она живёт в Dashboard / Priority Feed или в исходном модуле.

## Phase 7 target

`Reports / Analytics` больше не является catalog-only экраном. Начиная с Phase 7 это полноценный report center:

- направления отчётов: Finance, Sales, Marketing, Projects / Delivery, Specialists / KPI, Support, Partners, Security;
- реальные tab dashboards: KPI cards, Recharts charts, tables and data-quality warnings;
- report pages with period filters, dimensions, drill-down, definitions panel, export and schedule actions;
- saved views and recurring reports as first-class workflows;
- exports через Reports/Drive, source-of-truth расчёты через исходные модули.

Верхний слой страницы является command center: report type tabs, period/as-of filters, search, saved views, schedule/export/data-quality operations. Пользователь должен видеть не технические `sourceEndpoints` и phase notes, а понятные бизнес-отчёты и их состояние.

## Lazy loading baseline

Первое открытие `/reports` грузит только shell metadata:

- report definitions;
- schedules;
- export history;
- saved views;
- data-quality warnings.

Module-owned analytics data грузится только при открытии соответствующего tab:

- `Finance` calls Finance report endpoints;
- `Sales` calls CRM lead/deal stats;
- `Marketing` calls Marketing dashboard summary;
- `Projects` calls product/extension stats;
- `Specialists` calls task KPI stats.

Switching back to an already loaded tab should be instant. Filter changes invalidate active tab first; inactive tabs may stay stale until opened or refreshed.

## Граница модуля

### Reports отвечает за

- read-only отчёты;
- аналитические разрезы;
- сравнение периодов;
- drill-down до source records;
- export CSV/XLSX/PDF;
- scheduled reports;
- report permissions;
- report snapshots;
- report catalog.

### Reports не отвечает за

- создание invoices;
- оплату expenses;
- stage gates;
- payroll run;
- изменение CRM/Finance/Projects данных;
- хранение source-of-truth бизнес-сущностей.

## Source of truth rule

Reports не хранит бизнес-истину.

```text
CRM owns leads/deals.
Marketing owns activities/attribution.
Finance owns money facts.
Projects Hub owns products/extensions/lifecycle.
Tasks owns task facts.
Support owns ticket facts.
My Company owns KPI/people structure.
Reports owns calculated views and report snapshots.
```

## Module-owned analytics rule

Модульные analytics/report pages не нужно удалять.

Правильная граница:

```text
Module owns facts, formulas and context-specific views.
Reports / Analytics owns catalog, cross-module access, scheduled reports, exports and snapshots.
```

Примеры:

- Finance owns P&L formulas, Reports shows Finance P&L in catalog.
- Marketing owns attribution logic, Reports shows Marketing performance reports.
- CRM owns sales pipeline facts, Reports shows sales reports over periods.
- Support owns ticket/SLA facts, Reports shows support reports and scheduled SLA summaries.

Reports не должен копировать бизнес-логику из модулей. Он должен ссылаться на module-owned definitions and projections.

## Основные разделы

```text
Reports / Analytics
  Executive Reports
  Sales Reports
  Marketing Reports
  Finance Reports
  Projects / Delivery Reports
  Specialists / KPI Reports
  Delivery Reports
  Support Reports
  Subscription / MRR Reports
  KPI / Scorecard Reports
  Custom / Saved Reports later
  Scheduled Reports
  Export History
```

## UX concept

Главный экран Reports:

- top command bar with period, as-of, search and saved views;
- report type tabs: Finance, Sales, Marketing, Projects, Specialists, Scheduled, Exports, Data Quality;
- active-tab KPI strip and charts;
- report-context export and drill-down actions;
- scheduled reports status;
- export history;
- data-quality warnings.

Report page:

- title;
- period selector;
- filters;
- metric cards;
- charts/tables;
- drill-down links;
- export button;
- schedule button;
- definitions panel.

## Visualization baseline

Reports должен использовать ограниченный, понятный набор визуализаций:

- KPI cards for headline numbers;
- trend charts for period comparisons;
- bar/funnel charts for pipeline, source and stage distribution;
- table views for details and exports;
- data-quality banners when a metric is incomplete.

Arbitrary BI designer, free-form SQL reports and every possible chart type are not part of the standard module. If a report cannot be calculated honestly, it should show a warning instead of a misleading chart.

## Periods

Все отчёты должны явно показывать период.

Стандартные периоды:

- Today;
- This Week;
- This Month;
- Previous Month;
- This Quarter;
- This Year;
- Custom Range.

Financial reports can use closed accounting periods from Finance.

## Dimensions / Разрезы

Reports должны поддерживать разрезы:

- period;
- module;
- client;
- project;
- product;
- deal type;
- payment type;
- marketing channel;
- marketing account/activity;
- seller;
- PM;
- department;
- partner;
- subscription status.

Не каждый отчёт использует все разрезы. Разрезы должны быть только там, где данные корректны.

## Drill-down

Каждая цифра должна вести к детализации.

```text
Revenue by channel
  -> click Instagram
    -> list of leads/deals/invoices attributed to Instagram
      -> source Deal / Invoice / Marketing Activity
```

Drill-down должен вести в исходный модуль, а не создавать отдельную копию данных в Reports.

## Definitions panel

У каждого важного отчёта должна быть панель определения:

- что считается;
- какая формула;
- какие статусы включены;
- какие периоды используются;
- какие источники данных;
- ограничения точности.

Это особенно важно для Finance, Marketing и KPI.

## Sidebar placement

Reports / Analytics должен быть отдельным модулем, но может быть доступен только ролям, которым нужна аналитика.

Каноническое место:

```text
Dashboard
CRM
Marketing
...
...
Reports / Analytics
Settings / Admin
```

Dashboard может вести в Reports из mini analytics widgets.
