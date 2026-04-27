# Reports / Analytics Cleanup Register

> NBOS Reports / Analytics - что нужно реализовать и очистить после отделения Dashboard от глубоких отчётов.

## Назначение

Новый канон:

- Dashboard = Control Center / action center;
- Reports / Analytics = read-only analysis over periods;
- Reports не владеет source data;
- module reports use source-of-truth modules;
- exports and scheduled reports are first-class;
- sensitive exports require audit;
- Finance P&L remains Finance-owned but visible through Reports catalog;
- report definitions must be explicit.

---

## A. Already aligned / Уже совпадает с каноном

### A1. Dashboard docs already define Analytics boundary

Статус: `OK DOCS`

Dashboard canon уже говорит, что тяжёлая аналитика живёт в `Analytics / Reports`.

### A2. Finance P&L reports exist in Finance docs

Статус: `OK DOCS / NEEDS CATALOG LINK`

Finance уже описывает P&L, MRR, Payroll reports. Reports должен показывать их в общем catalog, но не переносить source-of-truth из Finance.

### A3. Marketing docs define analytics but not global reports

Статус: `OK DOCS / NEEDS CATALOG LINK`

Marketing analytics остаётся source-specific. Reports может агрегировать и сравнивать marketing metrics across periods.

---

## B. Runtime / UI missing

### B1. Reports / Analytics module is missing

Статус: `MISSING MODULE`

Нужно добавить:

```text
/reports
```

Sections:

- Report Catalog;
- Scheduled Reports;
- Export History;
- Saved Views.

### B2. Sidebar does not include Reports / Analytics

Статус: `MISSING UI`

Нужно добавить top-level module or make it available through Dashboard/More depending on UI decision.

Canonical default: top-level `Reports / Analytics`.

### B3. Report definitions are missing

Статус: `MISSING CODE`

Нужно добавить registry:

```text
ReportDefinition
  key
  category
  owner_module
  permissions
  filters
  exports
  definitions
```

### B4. Scheduled reports are missing

Статус: `MISSING CODE / MISSING UI`

Нужно добавить:

- schedule;
- recipients;
- format;
- next run;
- last run;
- failure state.

### B5. Export jobs are missing for reports

Статус: `MISSING CODE`

Нужно добавить async export jobs and Drive file output.

### B6. Data quality warnings are missing

Статус: `MISSING UI / MISSING DATA LAYER`

Reports должны показывать предупреждения о неполных данных.

### B7. Report permissions are not centralized

Статус: `NEEDS DESIGN`

Reports must enforce source permissions and cannot bypass module access.

---

## C. Implementation order

1. Add Reports / Analytics module route.
2. Add Report Catalog UI.
3. Add report definition registry.
4. Add basic reports links to existing module reports.
5. Add report period/filter shell.
6. Add export job model.
7. Link exports to Drive.
8. Add scheduled reports model.
9. Add data quality warnings.
10. Add sensitive report audit.
11. Add saved report views.

## D. Non-goals for MVP

В MVP не нужно:

- custom report builder;
- arbitrary SQL/report designer;
- complex BI dashboards;
- every chart type;
- full scheduled email engine if notification/export is enough;
- real-time report recalculation.

## E. Important safeguards

Do not duplicate business logic in Reports.

Correct:

```text
Finance calculates P&L facts.
Reports displays P&L report and links to Finance.
```

Do not show misleading metrics.

Correct:

```text
If data is incomplete, show warning.
If spend is missing, do not calculate ROI.
```
