# Seats / multi-role access: completion record

Date: 2026-09-14. Scope: local implementation on `sipan`, not a production rollout.

## Decision

Keep the additive seats / permission-role architecture. Do not roll back the separate department canvas work. Remove the migration's inferred seats and department restructuring: those contradicted the approved plan. Legacy employee roles and memberships remain authoritative compatibility data until an explicitly approved cutover.

## Completed corrections

- Migration adds schema and backfills only legacy role history. It does not infer seats, appoint heads, change roots, or rewrite memberships. Terminated employees receive revoked history with valid date intervals.
- Primary-role department permissions retain all existing memberships. Additional seat role scopes stay attached to their own departments. Access is a union, not a replacement.
- Active additional grants exclude legacy history, expired grants, ended seats and terminated employees. Guard cache checks detect temporal expiry as well as access-version changes.
- Assignment writes lock employee and seat rows. Closing a seat revokes only its sourced grant, transfers membership cleanup responsibility between seats, and restores prior primary membership. Explicitly maintained legacy memberships survive.
- Clearing a seat's mapped permission role requires RBAC edit permission. Mapping/kind changes and archival are blocked while occupied. Assignment and revocation enforce primary-role governance authority; an additional CEO permission role does not change the actor's governance identity.
- CRM call parent scopes remain separated by permission/module; department-shared resources retain their independent sharing checks.
- Repeated legacy-role seed reconciliation preserves history and does not resurrect revoked rows.
- Roles & Seats includes assignment history, access-change preview and confirmation for mapped-role operations. Employee cards expose current seats and effective access. Department canvas/list/detail use explicit head-seat assignments consistently and retain seat-less members.
- Read models and translations remain within the existing React architecture; loading, failed requests and confirmation are handled without adding a new state-management layer.

## Verification

The opt-in PostgreSQL suite lives in `apps/api/src/modules/org-seats/org-seats.integration.test.ts`. It requires an explicit `NBOS_SEATS_TEST_DATABASE_URL` pointing to a local `seats_*` database, never the application database URL.

Twelve real-PostgreSQL scenarios passed: migration preservation/terminated dates, both membership cleanup orders, existing memberships, two primary handover chains, competing seat assignments, archive/history lifecycle, mapping authorization, repeatable role seed, terminated access, and guard/preview/scope/expiry integration.

Final full Vitest run: **1,358 files passed, 6,840 tests passed; 12 files / 40 tests skipped**, no failures. The opt-in PostgreSQL suite was also run separately: **12 passed**. A follow-up focused ownership/org-chart run passed (19 tests).

Prisma validation and client generation, API and web production builds, API/web/database typechecking, ESLint on the changed API/web files, Prettier on the touched supported files and `git diff --check` passed. The first broad test run exposed a missing-array guard regression in older fixtures; it was fixed and the complete run repeated successfully. The first web build exposed strict undefined indexing in the drawer integration; that was fixed and the production build repeated successfully. No failing checks were bypassed.

## Rollout boundaries and remaining verification

1. No production database was contacted for migrations. No deployment, commit or push was performed.
2. A clean full migration replay on disposable PostgreSQL failed before this migration, at historical `20260314150000_tasks_system_refactor`: PostgreSQL rejects use of the new enum value `NEW` in the same transaction (`55P04`). That historical migration was not modified. Therefore a fresh-database replay is not certified. The new SQL was separately applied to a pre-change fixture; runtime integration used the current schema plus the migration's partial indexes.
3. Full demo seed was not executed because it contains existing destructive cleanup. Only the new repeatable role-history helper was exercised twice against isolated fixtures.
4. Authenticated browser end-to-end verification has not been performed. Build/typecheck and backend integration do not substitute for a staging UI smoke test.
5. Temporary/manual-role management, legacy-model removal and a full employee-profile information-architecture rewrite remain out of scope. History currently returns the latest 100 entries; no history is deleted.

Before rollout, inspect the target's migration status, rehearse on a recent sanitized database copy, back up data, apply the additive migration before starting the new API, and smoke-test as ordinary employee, department-scoped role and administrator. Assign head seats explicitly; the migration deliberately makes no personnel decisions. Once seat-derived access is in use, do not roll back application code to a version that ignores these grants without a separately reviewed access-continuity plan. Do not drop the additive tables as a routine rollback.
