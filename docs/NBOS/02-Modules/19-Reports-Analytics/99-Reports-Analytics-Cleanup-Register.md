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
- module analytics stays module-owned and is exposed through Reports catalog;
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

### A4. Module-owned analytics boundary is accepted

Статус: `OK DOCS`

Модульные analytics pages не удаляются. Они очищаются формулировочно:

```text
Module = facts, formulas, context view.
Reports = catalog, exports, scheduled reports, snapshots.
```

---

## B. Runtime / UI missing

### B1. Reports / Analytics module is missing

Статус: `DONE` (2026-04-30)

Runtime route:

```text
/reports
```

Shipped P0 catalog shell:

- Report Catalog over module-owned Finance definitions;
- search and category filters;
- basic period/as-of filter shell passed into export jobs and new schedules;
- scheduled reports honest empty state;
- export history honest empty state.

### B2. Sidebar does not include Reports / Analytics

Статус: `DONE` (2026-04-30)

Top-level `Reports / Analytics` is available in the main sidebar at `/reports`.
CRM also links sales analytics to `/reports?module=crm`.

Canonical default: top-level `Reports / Analytics`.

### B3. Report definitions are missing

Статус: `PARTIAL` (2026-04-30)

Shipped: `/reports` consumes the existing Finance-owned report definition registry and does not copy Finance formulas.

Future registry shape still needed for cross-module reports:

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

Статус: `PARTIAL` (2026-04-30)

Shipped model:

- `ReportSchedule` model with owner, recipients, format, explicit schedule label, next run, last run and failure state;
- `GET /api/reports/schedules` and `POST /api/reports/schedules`;
- `/reports` scheduled tab list/create UI with explicit next run time;
- schedule creation audit.
- simple Reports recurrence model: `DAILY`, `WEEKLY`, `MONTHLY`, `timeOfDay`, `timezone`, weekly day and monthly day `1-28`;
- monthly days are intentionally limited to `1-28` for Reports so February and short months are never skipped.
- due schedule runner creates queued `ReportExportJob` records, enqueues them through the Reports export queue and advances `nextRunAt`;
- `POST /scheduler/report-schedules-due` plus optional in-process cron when `REPORT_SCHEDULES_DUE_CRON_ENABLED=true`.
- schedule management actions: pause, resume and archive for owned schedules, with audit and UI controls.

Still needed:

- delivery attempts and recipient channel integration;
- link last run to real export job execution.
- richer run history beyond `lastRunAt` / `lastExportJobId`.

Note: Bitrix-like recurring task templates belong to the Tasks module, not Reports. Reports scheduled exports use the simpler recurrence above.

### B5. Export jobs are missing for reports

Статус: `PARTIAL` (2026-04-30)

Shipped foundation:

- `ReportExportJob` model with status, format, filters, requester and Drive `FileAsset` output link;
- `POST /api/reports/export-jobs` and `GET /api/reports/export-jobs`;
- audit event when an export job is requested;
- `/reports` export history and CSV export request action over Finance-owned definitions.
- real CSV writer over Finance-owned aggregate services, stored as Drive/R2 `FileAsset`;
- failure state and audit event when export writing fails.
- BullMQ export queue/worker wiring when `REDIS_URL` is configured; HTTP requests no longer write export files inline.
- finance-sensitive audit context is explicit on export request/completion/failure and scheduled export queue events.

Still needed:

- approved retry/backoff and queue retention policy;
- XLSX/PDF generators;
- retry/cancellation flow;
- source-permission centralization before cross-module exports.

### B6. Data quality warnings are missing

Статус: `PARTIAL` (2026-04-30)

Shipped:

- `GET /api/reports/data-quality-warnings`;
- `/reports` Data quality tab;
- warning/info projection over Finance-owned report definitions, source endpoints and deferred limitations.

Still needed:

- runtime missing-data warnings from Marketing attribution, cross-module projections and scheduled runs;
- source-permission-aware warnings when centralized report permissions are added.

### B7. Report permissions are not centralized

Статус: `NEEDS DESIGN`

Reports must enforce source permissions and cannot bypass module access.

---

## C. Implementation order

1. ~~Add Reports / Analytics module route.~~ Done (2026-04-30): `/reports`.
2. ~~Add Report Catalog UI.~~ Done (2026-04-30): Finance definitions catalog shell.
3. Add cross-module report definition registry.
4. ~~Add basic reports links to existing module reports.~~ Done for Finance reports (2026-04-30).
5. ~~Add report period/filter shell.~~ Done foundation (2026-04-30): `dateFrom`, `dateTo` and `asOf` are passed to export jobs and schedules.
6. ~~Add export job model.~~ Done foundation (2026-04-30).
7. ~~Link exports to Drive.~~ Done as `FileAsset` output relation; real writer worker still needed.
8. ~~Add scheduled reports model.~~ Done foundation (2026-04-30); runner still needed.
9. ~~Add data quality warnings.~~ Done foundation (2026-04-30); cross-module/runtime depth still needed.
10. ~~Add sensitive report audit.~~ Done foundation (2026-04-30): finance-sensitive audit markers are explicit on export and scheduled-run events.
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
