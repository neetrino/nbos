# Documentation Consistency Audit

> Final pre-development audit for NBOS canon docs.

## Purpose

This document records the last consistency pass before moving from documentation to implementation.

The goal is not to re-open module decisions. The goal is to make sure developers do not receive conflicting instructions from active canon files.

## Audit Status

```text
Status: READY FOR DEVELOPMENT
Date: 2026-04-27
Scope: docs/NBOS active canon
```

## What Was Checked

- module ownership and boundaries;
- old entity/stage names that could conflict with new canon;
- Dashboard vs Reports / Analytics ownership;
- CRM vs Delivery vs Finance boundaries;
- cleanup registers vs active canon;
- archived documents vs current source of truth;
- implementation roadmap alignment.

## Corrections Made

### Delivery terminology

Old active wording still referenced `Creating` as if it were a current board/stage.

Canonical wording now:

```text
Delivery Board
  Starting -> Development -> QA / Checking -> Transfer -> Done / Cancelled
```

`Done` and `Cancelled` are terminal outcomes shown in the `Closed` view. `On Hold` is a pause status over the current stage, not a separate stage.

CRM now clearly ends at:

```text
Deposit & Contract -> Deal Won / Failed
```

After `Deal Won`, work continues through:

- Order;
- Project;
- Product / Extension;
- Delivery Board;
- Finance;
- Subscription / Maintenance when applicable.

### Dashboard and Reports boundary

Dashboard is now treated as:

```text
Dashboard = personal control center / daily action surface.
Reports / Analytics = deep analytics, cross-module reports, exports, scheduled reports.
```

Module dashboards are allowed, but they must stay operational and lightweight. Deep reports belong to `Reports / Analytics`.

### Cleanup registers

Cleanup registers remain valid as implementation checklists. They may intentionally mention old terms like `Creating`, `Team`, or stale UI behavior because their purpose is to remove or migrate those things from the real product.

They are not sources of active business behavior.

## Non-Blocking Notes

- Some historic archive files still contain old concepts. They are preserved for audit/history only.
- Some module docs mention module-owned dashboards. This is valid if the screen is a working view, not a replacement for Reports / Analytics.
- Advanced V2 items may stay documented if they do not block MVP and are clearly marked as future/deferred.

## Development Entry Point

Implementation should start from:

```text
docs/NBOS/00-Implementation-Roadmap.md
```

Developers should use this source order:

1. `docs/NBOS/00-Documentation-Hub.md`
2. `docs/NBOS/00-Implementation-Roadmap.md`
3. module canon files in `docs/NBOS/02-Modules/*`
4. cross-module processes in `docs/NBOS/03-Business-Logic/*`
5. UI rules in `docs/NBOS/05-UI-Specifications/*`
6. cleanup registers as implementation checklists

## Engineering Rule To Preserve

Every module must work safely even when another module is incomplete, disabled, or not yet connected.

```text
Hard dependency -> block only the unsafe transition.
Soft dependency -> warn, show empty state, or allow linking later.
Missing module -> no crash.
Missing data -> show missing data, never fake numbers.
```

## Final Decision

Documentation is clean enough to start development.

The next step is not more documentation by default. The next step is implementation by roadmap phase, starting with the platform shell and foundations.
