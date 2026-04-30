# NBOS Implementation Progress

> Compact tracker for actual implementation state. Detailed behavior belongs in module docs, tests and commits.

## Current Focus

| Field         | Value                       |
| ------------- | --------------------------- |
| Current phase | **Phase 6 — Control layer** |
| Current task  | Reports Catalog P0          |
| Status        | Phase 6 in progress         |
| Last updated  | 2026-04-30                  |

## Phase Snapshot

| Phase                               | Status      | Progress | Notes                                                                                                           |
| ----------------------------------- | ----------- | -------- | --------------------------------------------------------------------------------------------------------------- |
| Phase 1 — Platform shell            | Done        | 100%     | Navigation, RBAC shell, shared states, admin foundation                                                         |
| Phase 2 — CRM / Marketing / Intake  | Done        | 100%     | Intake, CRM handoff, marketing spend links, project entry points                                                |
| Phase 3 — Finance core              | Done        | 100%     | Client Services runtime + flows done; Finance report definitions v1 and all six aggregates                      |
| Phase 4 — Delivery ops              | Done        | 100%     | Delivery, Work Space, task blockers and Support runtime bridges closed as foundation                            |
| Phase 5 — Collaboration / knowledge | Done        | 100%     | Calendar, Technical, Notifications, Drive, Credentials, Messenger, Mail and Documents P0 closure slices shipped |
| Phase 6 — Control layer             | In progress | ~40%     | Reports catalog shell over Finance-owned definitions; Dashboard Control Center and scheduling/export depth next |
| Phase 7 — Integrations / migration  | Not started | 0%       | WhatsApp, bank/gov, Bitrix migration                                                                            |

## Phase 3 Full Closure Gate

Confirmed in scope:

- `Client Service Record` as first-class runtime entity.
- Client-paid and company-paid service flows to invoice, expense plan/card and task.
- Finance report definitions v1: Company P&L, Project P&L, Cash Flow, MRR / Subscription Revenue, Expense Plan vs Actual, Payroll Report.
- Read-only report aggregates where Phase 3 already has reliable source data.

Explicitly out of Phase 3 v1:

- Separate `NBOS pool` entity. Use canonical Project Bonus Pool only.
- Global Reports / Analytics catalog, scheduling, BI presentation, accrual depth and period close. These remain Phase 6/control work.

## Current Finance State

Shipped Finance foundations:

- Orders, invoices, payments, subscriptions, reconciliation and finance dashboard foundations.
- Expense ledger, partial payments, backlog/closed views, Expense Plan, Plan -> Card, due auto-generation and scheduler hook.
- Payroll runs, salary lines, payroll expense materialization, salary payment sync, payroll journal/audit and employee wallet.
- Bonus board and read-only Project Bonus Pool rollups.
- Partner commission preview and validation.
- Client Services runtime: Prisma model, API, UI, stats and linked flow actions.
- Finance reports: definitions shell, Company P&L v1, Project P&L v1, Cash Flow v1, Expense Plan vs Actual v1, MRR v1 and Payroll Report v1 snapshots.

Closed by the full-closure gate:

- `Client Service Record` runtime, UI, stats and linked flow actions.
- Finance report definitions v1 and read-only aggregates for all six approved reports.
- Separate `NBOS pool` intentionally not created; canonical Project Bonus Pool remains the v1 scope.

Future Finance depth:

- Global Reports / Analytics catalog, scheduled reports, advanced dashboards, accrual depth, period close and Operational Journal-backed reporting stay Phase 6/control work.
- Optional Client Services depth can be handled later: detail page, CSV, stronger payment-driven automation.

## Recent Milestones

Roll-up only. Per-feature detail: **`docs/NBOS/02-Modules/*`**, tests, and **git history**.

| Through       | Area                     | Summary                                                                                                                                                                                                                                                                                                 |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-04-29    | Phase 3–4                | Finance full closure (Client Services + six report aggregates); Delivery / Work Space / Support bridges; product lifecycle + Done readiness.                                                                                                                                                            |
| 2026-04-29    | Drive & Documents        | Upload session + library; Documents Prisma/API/RBAC/UI; TipTap; search/FTS/ACL; Drive attachments + scoped preview; activity pagination; archive/restore.                                                                                                                                               |
| 2026-04-29    | Credentials              | Row-level access, reveal/copy, URL-open audit, web CRUD + archive + permanent purge.                                                                                                                                                                                                                    |
| 2026-04-29–30 | Messenger                | Prisma + Socket.IO; typing, presence, read/unread + list sync; DM and channel read receipts; audits.                                                                                                                                                                                                    |
| 2026-04-29    | Mail & Notifications     | Mail MVP + **`q`**; **`GET …/threads`** `{ items, meta }` paging; **`GET …/accounts/health-summary`**; **`MailDeliveryLog`** + delivery-log UI; **`MailOutboundSendMutationService`**; in-app: stub sync, outbound, **needs-link patch**; **`in_app_notifications`** + Topbar API.                      |
| 2026-04-30    | Docs                     | Mail boundaries in canon: Notifications (**Email** vs inbox); **Credentials** (mailbox secrets); **Drive** (`FileAsset` / attachments); **Messenger** (vs inbox); **Calendar** (time surface vs inbox); **Technical Infrastructure** (product ops vs mailbox health) — cross-links + cleanup registers. |
| 2026-04-30    | Docs                     | `06-Integrations` (`05-Automation-Scenarios`, `04-External-Services`) aligned with Notification Engine + WhatsApp WAHA groups + Mail vs transactional Email; Notifications cleanup register §E; archive `00-Technical-Architecture-Brief` §7 WhatsApp row.                                              |
| 2026-04-30    | Phase 5 planning         | Drafted `docs/PHASE_5_MINIMAL_PRODUCT_CLOSURE_PROPOSAL.md`: practical P0/P1/P2 closure scope for Documents, Drive, Credentials, Messenger, Mail, Notifications, Calendar and Technical Infrastructure.                                                                                                  |
| 2026-04-30    | Calendar                 | P0 closure slice: `CalendarMeeting` + `PersonalCalendarEvent`, `GET /api/calendar/events`, Product/Extension delivery deadline projections, RBAC-scoped API, web Calendar replaced mock Billing/internal events with approved layers only.                                                              |
| 2026-04-30    | Technical Infrastructure | P0 closure slice: `ProductTechnicalProfile`, `TechnicalAsset`, `TechnicalEnvironment`, Product **Technical** tab, readiness blockers for Production environment / credentials / monitoring / backup; secrets remain links to Credentials only.                                                          |
| 2026-04-30    | Notifications            | P0 closure slice: `NotificationEvent`, `NotificationRule`, `NotificationJob`, `NotificationDelivery`, idempotent in-app delivery, category filters, archive/read actions and full Notification Center page.                                                                                             |
| 2026-04-30    | Drive                    | P0 closure slice: Drive page now lists DB-backed `FileAsset` records with detail drawer, active links, versions, audit, visibility/confidentiality badges, archive action and new version upload.                                                                                                       |
| 2026-04-30    | Credentials              | P0 closure slice: `credentialType`, criticality, environment/context fields, encrypted secure notes, public notes and rotation metadata added to vault API/UI.                                                                                                                                          |
| 2026-04-30    | Messenger                | P0 closure slice: internal messages support Drive `FileAsset` attachments, internal search, explicit Internal/External zone split and honest external adapter placeholder.                                                                                                                              |
| 2026-04-30    | Mail                     | P0 closure slice: `MailProviderConnection` boundary, credential references, Drive-backed `EmailAttachment` records, attachment-aware draft/detail API and provider state UI.                                                                                                                            |
| 2026-04-30    | Documents                | P0 closure slice: daily-use polish for create/editor save states, search empty states and attachment UX; existing search/access/Drive attachment paths confirmed and kept as shipped foundation.                                                                                                        |
| 2026-04-30    | Reports / Analytics      | Phase 6 first slice: `/reports` replaced placeholder with catalog shell that surfaces Finance-owned report definitions, search/category filters and honest scheduled/export empty states.                                                                                                               |

## Next Action

1. Continue Phase 6 control layer per `docs/NBOS/00-Implementation-Roadmap.md`.
2. Next slice: Dashboard Control Center P0 — pinned actions + priority feed shell without heavy analytics.
3. Keep Google v2, AI, complex approval workflow, WAHA runtime and credentials secrets out of closure unless explicitly approved.

## Slice DoD

- Behavior matches `docs/NBOS` and the Phase 3 gate.
- No fake financial, audit, credential or report data.
- Tests/typecheck/lint run for touched API/web/database areas.
- Docs updated only at milestone level.
- One end-of-slice commit bundles related code, tests and docs.
