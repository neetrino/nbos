# Reports Permissions and UX

> NBOS Reports / Analytics - доступы, интерфейс, favorites, saved reports и безопасность аналитики.

## Access principle

Reports must respect the same permissions as source modules.

```text
If user cannot see source data, user cannot see it in report.
```

Reports cannot be used to bypass module permissions.

## Permission examples

| Role             | Reports access                                         |
| ---------------- | ------------------------------------------------------ |
| Owner / CEO      | All company reports                                    |
| Finance Director | Finance, Subscription, Payroll, Partner payout reports |
| Head of Sales    | Sales, Marketing summary, own team reports             |
| Seller           | Own sales reports                                      |
| Head of Delivery | Delivery, Support, team workload                       |
| PM               | Own projects/products delivery reports                 |
| Marketing        | Marketing reports                                      |
| Developer        | Own task/workspace reports only                        |
| Support          | Support reports within scope                           |

## Report catalog UX

Main Reports screen:

- search reports;
- categories;
- favorites;
- recently opened;
- scheduled reports;
- export history;
- permissions-aware list.

## Report page UX

Every report page should have:

- title;
- description;
- period selector;
- filters;
- metric cards;
- chart/table;
- drill-down;
- export;
- schedule;
- definitions panel;
- data quality warnings.

## Favorites

Users can favorite reports.

Favorites appear:

- in Reports home;
- optionally in Dashboard pinned actions;
- maybe in sidebar personal links later.

## Saved report views

User can save filters:

```text
SavedReportView
  report_key
  name
  filters
  owner_user_id
  shared_with
```

MVP can skip sharing and only support personal saved views.

## Data quality UX

Reports should be honest.

Examples:

```text
Marketing ROI unavailable: 4 campaigns have no linked spend.
Finance period is open: numbers may change.
12 deals missing source attribution.
```

Warnings should be visible, not hidden in a tooltip.

## Drill-down UX

Clicking metric opens:

- side panel detail table for quick inspection;
- full source module page for deep work.

Example:

```text
Click "Overdue invoices"
  -> detail table
  -> open Invoice Card
```

## Mobile UX

Reports are secondary on mobile.

Mobile should support:

- summary cards;
- basic filters;
- saved reports;
- view export status.

Heavy tables/charts can be desktop-first.

## Security boundaries

Special care:

- payroll data;
- salary data;
- credentials audit;
- finance reports;
- partner payouts;
- client private data.

These reports need stricter permissions and audit for export.
