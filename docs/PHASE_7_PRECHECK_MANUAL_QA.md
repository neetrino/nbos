# Phase 7 Precheck Manual QA

> Stabilization gate before Phase 7 integrations. This document records the automated gate, module verification matrix, runtime blockers and owner QA checklist.

## Stabilization Result

| Area                  | Result                   | Notes                                                                                                                                                                                |
| --------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Prisma generate       | `PASS`                   | `pnpm --filter @nbos/database generate` completed successfully.                                                                                                                      |
| Migration target      | `BLOCKED`                | Current `.env.local` points to a remote Neon database, not a local/dev database.                                                                                                     |
| Migration status      | `BLOCKED`                | Remote DB has migration drift: local migrations after `20260331193000_project_shell_remove_type_pm_seller_deadline` are unapplied, while DB contains migrations not present locally. |
| Seed workflow         | `BLOCKED UNTIL LOCAL DB` | `packages/database/prisma/seed.ts` is destructive by design (`deleteMany` cleanup). It must not run against the current remote DB.                                                   |
| Seed coverage         | `IMPROVED`               | Seed now includes P0 smoke data for Drive/Documents, Dashboard/Reports, Notifications, Calendar and Technical Infrastructure.                                                        |
| Typecheck/lint        | `PASS`                   | Database, API and Web typecheck/lint passed.                                                                                                                                         |
| Tests                 | `PASS`                   | `pnpm test`: 177 files, 919 tests passed.                                                                                                                                            |
| Build                 | `PASS`                   | `pnpm build` completed successfully for API and Web.                                                                                                                                 |
| Formatting            | `PARTIAL`                | Touched files pass Prettier. Repository-wide `format:check` still reports pre-existing drift in archives/generated files and unrelated files.                                        |
| Runtime browser smoke | `BLOCKED`                | Needs approved local/test DB with migrations and seed applied. No dev server/browser smoke was run against the unsafe remote DB.                                                     |

## Module Verification Matrix

| Module group                                      | Status                                   | Stabilization note                                                                                                                                                                |
| ------------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Platform/Auth/RBAC/Settings                       | `OK P0`                                  | Navigation/RBAC/admin shell are usable at P0. Entity-level RBAC depth and full Settings metadata remain deferred.                                                                 |
| CRM and Marketing                                 | `OK P0`                                  | CRM lead/deal gates and Marketing foundation are covered by tests/build. Marketing dashboard/API integrations remain later depth.                                                 |
| Projects Hub, Products/Extensions, Tasks, Support | `OK P0`                                  | Delivery lifecycle, Work Space, task basics and support bridges have passing tests. Support waiting overlays/SLA depth and recurring Tasks depth remain deferred.                 |
| Finance, Partners, Client Services, Payroll/Bonus | `OK P0`                                  | Finance core checks pass. Known stale invoice/subscription enum refactors are documented later-depth items, not Phase 7 blockers.                                                 |
| Documents, Drive, Credentials                     | `OK P0`                                  | Documents/Drive/Credentials tests pass; seed now covers a document + Drive asset + audited file. Advanced Drive permissions/export/cleanup and credential grants remain deferred. |
| Messenger, Mail, Notifications, Calendar          | `OK P0 / provider integrations deferred` | Internal Messenger, Mail P0, persisted Notifications and Calendar projections are stable. External WAHA/Telegram/email provider jobs remain Phase 7+ work.                        |
| Technical Infrastructure                          | `OK P0`                                  | Product technical profile/assets/environments exist and are now seeded. Deploy records, monitoring checks and backup policies remain later depth.                                 |
| Dashboard and Reports                             | `OK P0`                                  | Dashboard Control Center and minimal Reports catalog/export/schedule/saved-view foundation are stable. Deep BI/report permissions/advanced exports remain deferred.               |

## Owner Manual QA Checklist

Run this after a safe local/test DB is provided, migrations are applied and seed is executed.

1. Sign in as the seeded owner/admin user and confirm the session loads without redirect loops.
2. Open all top-level sidebar modules: Dashboard, CRM, Marketing, Projects, Tasks, Support, Finance, Documents, Drive, Credentials, Messenger, Mail, Notifications, Calendar, Technical/Project product tabs, Reports and Settings.
3. Confirm role visibility: admin can see admin/system pages; non-admin users do not see unsafe actions.
4. CRM smoke: create or edit a lead, convert or update a deal stage, and verify required marketing/source fields do not crash the flow.
5. Project/Delivery smoke: open a project, product and extension; verify lifecycle actions display correctly and invalid transitions are blocked with clear feedback.
6. Task/Support smoke: create/edit a task, create a support ticket, and verify task/support links render where available.
7. Finance smoke: open invoices, payments, subscriptions, expenses, payroll and bonus pages; verify totals load and no fake money state is shown.
8. Sensitive audit smoke: reveal/copy a credential secret, request a report export, and confirm audit-oriented UI/state is visible.
9. Documents/Drive smoke: open the seeded document, verify attachment metadata, open Drive library/file detail, and confirm no base64 image or fake file data is used.
10. Messenger/Mail/Notifications/Calendar smoke: open each page, mark/read archive a notification, inspect a mail thread and verify calendar layers render.
11. Dashboard/Reports smoke: verify Dashboard Control Center cards load, Reports catalog opens, saved report views are listed, and scheduled reports show honest state.
12. Record any route crash, missing seed data or browser console/runtime error as `Needs fix before Phase 7`.

## Known Deferrals

- No real external providers are connected during this gate: WAHA, Telegram, Google, Meta, bank API and GitHub runtime remain disabled.
- Full browser smoke is deferred until a local/test DB target is approved.
- Repository-wide format drift is not fixed in this gate because it includes archives/generated files and unrelated files.
- Advanced Phase 7 work should still start with `integration-registry-foundation` unless manual QA finds a higher-priority blocker.
