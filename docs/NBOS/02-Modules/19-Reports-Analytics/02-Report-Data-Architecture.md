# Report Data Architecture

> NBOS Reports / Analytics - архитектура данных для отчётов, projections, snapshots и drill-down.

## Core principle

Reports читают данные из модулей, но не становятся владельцем этих данных.

```text
Source Module -> Report Projection -> Report View -> Drill-down to Source
```

## Source modules

| Module       | Source facts                                     |
| ------------ | ------------------------------------------------ |
| CRM          | leads, deals, stages, offers, won/lost           |
| Marketing    | channels, accounts, activities, attribution      |
| Finance      | invoices, payments, expenses, journal, payroll   |
| Projects Hub | projects, products, extensions, lifecycle stages |
| Tasks        | tasks, work spaces, sprints, close conditions    |
| Support      | tickets, SLA, priorities, resolution             |
| My Company   | employees, seats, KPI policies/results           |
| Partners     | partner rules, payouts, balances                 |
| Credentials  | audit/access metadata                            |

## Report projections

Модули могут предоставлять report projections:

```text
FinanceReportProjection
MarketingReportProjection
DeliveryReportProjection
SupportReportProjection
```

Projection должен быть read-only и иметь clear period/filter inputs.

## Live vs snapshot

Есть два типа отчётов:

### Live report

Всегда пересчитывается по текущим данным.

Подходит для:

- current pipeline;
- active risks;
- current subscription status;
- open tickets.

### Snapshot report

Фиксирует состояние на момент формирования.

Подходит для:

- monthly finance close;
- payroll report;
- KPI period result;
- board/CEO monthly report;
- exported formal report.

## Snapshot model

```text
ReportSnapshot
  report_key
  period_start
  period_end
  filters
  generated_by
  generated_at
  data_hash
  file_asset_id
  status
```

Snapshot file should be stored in Drive.

## Data freshness

Каждый отчёт должен показывать:

- generated at;
- last source update if available;
- whether data is live or snapshot;
- whether period is closed/open.

Finance reports must show whether the period is closed.

## Drill-down architecture

Reports must keep source links:

```text
Metric -> detail rows -> source entity id -> source module page
```

Example:

```text
Marketing Revenue by List.am Account
  -> detail deals
    -> Deal Card
    -> Invoice / Payment
    -> Marketing Account
```

## Metric definitions

Metrics need stable definitions.

Example:

```text
Revenue Received
  source = Finance Payments
  includes = PAID invoices in period
  excludes = unpaid invoices
```

```text
Marketing CPL
  source = Marketing spend from linked Finance expenses
  formula = spend / leads
  only shown if spend exists
```

## Data quality warnings

Reports should show warnings when data is incomplete:

- missing marketing attribution;
- spend missing;
- unclosed finance period;
- tasks without owner;
- deals without required fields;
- subscriptions without next billing date;
- duplicate contacts/companies;
- missing product link.

Reports should not silently calculate misleading results.

## Performance

Heavy reports should not load like Dashboard widgets.

Rules:

- use filters before loading huge tables;
- cache expensive aggregations;
- paginate details;
- export asynchronously;
- show loading/progress;
- never block Dashboard on report calculations.
