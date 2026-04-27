# NBOS Implementation Roadmap

> Developer roadmap for implementing the NBOS canon module by module without breaking already working areas.

## Purpose

This document tells developers:

- what to implement first;
- what is MVP and what is later;
- how modules should depend on each other;
- what must not be implemented "quick and wrong";
- how to use cleanup registers as delivery checklists.

This roadmap is based on the current NBOS canon in:

```text
docs/NBOS/00-Documentation-Hub.md
docs/NBOS/02-Modules/*
docs/NBOS/05-UI-Specifications/*
```

Actual implementation status is tracked in:

```text
docs/IMPLEMENTATION_PROGRESS.md
```

## Primary implementation rule

```text
Build module by module.
Close behavior before adding depth.
Prefer safe incomplete workflows over broken cross-module dependencies.
```

UI rule: all UI work must use the existing Tailwind + shadcn/ui stack and be implemented with polished NBOS visual quality: clean spacing, clear hierarchy, responsive layout, consistent cards/forms/tables, and subtle interaction states.

## Module independence / graceful degradation

Every module must continue working even when another related module is missing, disabled, incomplete, or temporarily unavailable.

This is a platform rule, not a nice-to-have.

Correct behavior:

```text
Linked module missing -> show Not available / Not linked / Coming later.
Required link missing -> allow save when safe, show warning, allow linking later.
Critical stage gate missing -> block transition with missing-fields popup, not a crash.
Analytics dependency missing -> hide metric or show "No data", not fake zero.
```

Examples:

- CRM Lead can be created before Marketing module is complete, but missing marketing fields block later meaningful movement.
- Marketing Activity can work without Finance Expense link; attribution works, spend analytics shows missing finance link.
- Product page can work before Drive/Credentials/Messenger are complete; related tabs show empty/coming-later states.
- Dashboard can render pinned actions even if Finance widget fails.
- Reports can show data-quality warnings if Marketing attribution is missing.
- Finance invoice/payment process must not depend on Reports being implemented.

## Dependency rules

### Hard dependency

Hard dependency blocks an operation because the business rule requires it.

Examples:

- Deal Won for paid project cannot happen without required invoice/payment rules, except approved override.
- Product/Extension successful Done requires required delivery fields.
- Credentials reveal requires permission and audit.

### Soft dependency

Soft dependency enriches data but must not block basic operation.

Examples:

- Marketing Activity -> Finance Expense link;
- Product -> Drive folder;
- Task -> Messenger thread;
- Reports -> module projections;
- Dashboard -> optional widgets.

### Deferred link

If a linked entity is not ready, store a deferred link state:

```text
link_status = NOT_LINKED | PENDING | LINKED | UNAVAILABLE
```

UI should let users complete the link later.

## MVP rules

### Must be correct in MVP

- Auth/RBAC basics;
- module navigation and visibility;
- CRM Lead/Deal required fields and stage gates;
- Deal Won rules and override flow;
- Product/Extension lifecycle gates;
- Finance Invoice/Payment/Subscription basics;
- Expense basics;
- Task basics;
- Drive file metadata/link basics;
- Credentials permission/audit basics;
- Notifications for critical finance/delivery events;
- Audit for sensitive actions.

### Can be simple in MVP

- Dashboard widgets;
- Reports catalog;
- Marketing analytics;
- Messenger integrations;
- Calendar layers;
- advanced exports;
- scheduled reports;
- feature flags;
- custom dashboard layout;
- right rail.

### Must not be faked

- payment status;
- invoice paid status;
- payroll totals;
- bonus release;
- partner payouts;
- credential access;
- audit logs;
- report formulas;
- marketing CPL/ROI without spend.

If data is missing, show missing data. Do not calculate misleading values.

## Phase 1 - Platform shell and foundations

Goal: make NBOS navigable, permission-aware and safe to extend.

Scope:

- UI Shell canon;
- sidebar cleanup;
- remove global header Create;
- My Company skeleton;
- Settings/Admin skeleton;
- RBAC separation: business seat vs permission role;
- audit foundation;
- shared empty/loading/error states.

Exit criteria:

- navigation matches canon;
- modules can be hidden by RBAC;
- My Account is outside Settings;
- Team/Departments are under My Company;
- Settings contains system admin only;
- modules fail gracefully when linked data is missing.

Key docs:

- `05-UI-Specifications/01-Navigation-Structure.md`
- `05-UI-Specifications/06-UI-Shell-Cleanup-Register.md`
- `02-Modules/07-My-Company/*`
- `02-Modules/16-Settings-Admin/*`

## Phase 2 - CRM, Marketing and Lead-to-Cash intake

Goal: lead/deal intake becomes reliable and source attribution is not lost.

Scope:

- CRM Lead/Deal stage gates;
- From / Where / Which one;
- Marketing module skeleton;
- Marketing Board;
- Marketing Accounts;
- List.am account tracking;
- Attribution Review;
- Offer attachment and deal-required fields;
- Deal Won override workflow.

Exit criteria:

- no Lead/Deal can progress without required source fields;
- `Which one` depends on `Where`;
- List.am accounts can be manually linked to Finance Expense Plans;
- Marketing Activity can create/propose Expense Card;
- Deal Won rules are deterministic.

Key docs:

- `02-Modules/01-CRM/*`
- `02-Modules/18-Marketing/*`
- `03-Business-Logic/01-Lead-to-Cash-Process.md`

## Phase 3 - Finance core

Goal: money state is trustworthy.

Scope:

- Invoice Card lifecycle;
- Official Invoice / tax status workflow;
- payments;
- subscriptions;
- expenses;
- client services;
- salary board;
- bonus board;
- partner payouts;
- Finance report definitions.

Exit criteria:

- invoice status cannot lie;
- subscription billing rules are deterministic;
- partial expenses/payments are supported;
- salary/payroll views are clear;
- bonus release and project bonus pool logic are safe;
- partner payout rules respect Deal Type and Payment Type.

Key docs:

- `02-Modules/04-Finance/*`
- `02-Modules/08-Partners/*`
- `02-Modules/07-My-Company/07-Compensation-and-Policies.md`

## Phase 4 - Delivery operations

Goal: sold work becomes controlled product delivery.

Scope:

- Projects Hub;
- Product/Extension delivery board;
- lifecycle gates;
- On Hold status and pause date;
- Closed / Done / Cancelled logic;
- Work Spaces;
- Tasks;
- Scrum/Sprint support;
- Support tickets and SLA.

Exit criteria:

- Product and Extension cards are product-centric;
- Done requires gates, Cancelled does not require completion fields;
- On Hold pauses work and highlights expired pause;
- Work Space supports Scrum/Task workflows;
- Support tickets can create tasks/extension deals safely.

Key docs:

- `02-Modules/02-Projects-Hub/*`
- `02-Modules/05-Tasks/*`
- `02-Modules/06-Support/*`

## Phase 5 - Collaboration and knowledge

Goal: files, chats, credentials and notifications become integrated but not blocking.

Scope:

- Drive;
- Credentials;
- Messenger;
- Mail;
- Notifications;
- Calendar;
- Technical Infrastructure.

Exit criteria:

- files are stored once and linked logically;
- credentials are secure and auditable;
- internal/external messenger boundaries are clear;
- WhatsApp Web adapter path is documented;
- notifications are deduplicated and actionable;
- Calendar shows only agreed layers: Meet, Delivery Deadlines, Personal;
- technical assets are tracked.

Key docs:

- `02-Modules/11-Drive/*`
- `02-Modules/12-Credentials/*`
- `02-Modules/09-Messenger/*`
- `02-Modules/17-Mail/*`
- `02-Modules/13-Notifications/*`
- `02-Modules/10-Calendar/*`
- `02-Modules/15-Technical-Infrastructure/*`

## Phase 6 - Control layer

Goal: management sees the business without polluting operational modules.

Scope:

- Dashboard Control Center;
- pinned actions;
- priority feed;
- Reports / Analytics catalog;
- export jobs;
- scheduled reports;
- KPI/Scorecard reports;
- data quality warnings.

Exit criteria:

- Dashboard is action center, not heavy analytics;
- Reports is read-only catalog over module-owned report definitions;
- exports use Drive;
- scheduled reports have owner, status and failure handling;
- module analytics boundaries are respected.

Key docs:

- `02-Modules/14-Dashboards/*`
- `02-Modules/19-Reports-Analytics/*`
- `02-Modules/07-My-Company/04-KPI-Scorecard.md`

## Phase 7 - Integrations and migration

Goal: replace old workflows safely and prepare external integrations.

Scope:

- Bitrix migration mapping;
- WhatsApp/Web adapter;
- finance/accounting message flow;
- bank integration later;
- external ad/call tracking later;
- data import/export runbooks.

Exit criteria:

- existing business data can be migrated or manually mapped;
- external integration failure does not break core modules;
- manual fallback exists for critical processes.

Key docs:

- `06-Integrations/*`
- `07-Migration/*`
- module cleanup registers.

## How to use cleanup registers

Every module cleanup register is a developer checklist.

Before implementing a module:

1. Read module overview.
2. Read module cleanup register.
3. Identify stale runtime behavior.
4. Implement only one coherent slice.
5. Add tests for gates/negative paths.
6. Update cleanup register status if needed.

Do not use cleanup registers as vague backlog. They are there to prevent old wrong behavior from surviving.

## Implementation slice template

Each implementation slice should define:

```text
Goal
Touched modules
Hard dependencies
Soft dependencies
Fallback behavior
Stage gates / validation
Audit requirements
Tests
Docs updated
```

## Final rule

```text
Do not make one module unusable because another module is unfinished.
Do not fake data to hide missing links.
Show honest state and allow safe continuation.
```
