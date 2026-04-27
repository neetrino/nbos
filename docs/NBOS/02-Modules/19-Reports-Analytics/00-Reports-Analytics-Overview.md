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

## Основные разделы

```text
Reports / Analytics
  Executive Reports
  Sales Reports
  Marketing Reports
  Finance Reports
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

- report catalog;
- search;
- filters by module/category;
- favorite reports;
- recent reports;
- scheduled reports status;
- export history.

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
Reports / Analytics
CRM
Marketing
...
```

Dashboard может вести в Reports из mini analytics widgets.
