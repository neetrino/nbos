# Marketing Analytics and KPI

> NBOS Marketing - показатели эффективности, attribution analytics и связь с KPI.

## Назначение

Marketing analytics показывает не просто "сколько лидов", а какие источники реально работают.

Главный принцип:

```text
Count what is reliable now.
Calculate cost only where spend data exists.
```

Граница с `Reports / Analytics`:

```text
Marketing owns attribution logic, channel/account/activity meaning and marketing KPI facts.
Reports / Analytics exposes marketing reports in the global catalog, scheduled reports and exports.
```

Marketing Dashboard остаётся рабочим module-owned view для маркетолога. Cross-period reports, exports, saved report views и scheduled reports должны идти через `Reports / Analytics`.

## Dashboard blocks

Marketing Dashboard показывает:

- leads by channel;
- leads by account/activity;
- MQL count;
- SQL count;
- Deal Won count;
- revenue by channel;
- spend where available;
- CPL/ROI where available;
- attribution missing warnings.

## Funnel metrics

```text
Lead -> MQL -> SQL -> Deal -> Won
```

Metrics:

- lead count;
- MQL count;
- SQL count;
- Deal created count;
- Won count;
- Lead -> MQL conversion;
- MQL -> SQL conversion;
- SQL -> Won conversion.

## Source performance

By channel:

```text
Instagram
  leads
  MQL
  SQL
  Won
  revenue
  spend if available
```

By account/activity:

```text
List.am Account 3
  leads
  calls/leads if tracked manually
  won deals
  revenue
  weekly spend from Finance Expense Plan
```

```text
Instagram Spring Promo Reel
  budget
  leads
  deals
  revenue
```

## Cost metrics

Only when spend is known:

```text
CPL = Spend / Leads
Cost per MQL = Spend / MQL
Cost per SQL = Spend / SQL
CAC = Spend / Won Clients
ROI = Revenue / Spend
```

If spend is missing, show:

```text
Spend data missing
```

Do not show fake zero cost.

## Attribution quality

Marketing should show quality warnings:

- leads without source;
- deals without source;
- too many `Other`;
- too many `Organic / Not from ad` without review;
- List.am leads without account;
- active campaigns without leads;
- accounts with spend but no leads.

## KPI integration

Marketing module provides actual values for My Company KPI policies.

Possible KPI metrics:

- MQL per month;
- SQL per month;
- lead-to-MQL conversion;
- MQL-to-SQL conversion;
- attributed revenue;
- attribution completeness;
- campaign launch count;
- cost per qualified lead, where spend exists.

KPI policy lives in `My Company`.

Payroll/bonus calculation lives in `Finance`.

Marketing only provides measured facts.

## Time periods

Dashboard should support:

- this week;
- this month;
- previous month;
- custom period.

For cost/revenue metrics, period matching must be explicit:

```text
Spend period and lead attribution period should be visible.
```

## Reports later

Advanced reports can come later:

- channel trend;
- campaign cohort;
- revenue by first touch;
- revenue by last touch;
- lifetime value by channel;
- ad platform sync.

MVP should focus on reliable attribution and simple performance.
