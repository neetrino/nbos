# NBOS Implementation Progress

> Compact tracker for implementation state. Detailed behavior belongs in `docs/NBOS/02-Modules/*`, cleanup registers, tests and git history.

## Current Focus

| Field           | Value                                                        |
| --------------- | ------------------------------------------------------------ |
| Current phase   | **Phase 7 — Integrations / migration**                       |
| Current task    | Pre-Phase 7 consistency gate                                 |
| Status          | DB/RBAC synced; API smoke passes; browser owner pass pending |
| Last updated    | 2026-05-04                                                   |
| Source of truth | Roadmap + module cleanup registers                           |

## Phase Snapshot

| Phase                               | Status      | Progress | Current note                                                                                                                                                                |
| ----------------------------------- | ----------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phase 1 — Platform shell            | Done        | 100%     | Navigation, RBAC shell, shared states, admin foundation                                                                                                                     |
| Phase 2 — CRM / Marketing / Intake  | Done        | 100%     | Intake, CRM handoff, marketing spend links, project entry points                                                                                                            |
| Phase 3 — Finance core              | Done        | 100%     | Finance runtime + Client Services + six report aggregates                                                                                                                   |
| Phase 4 — Delivery ops              | Done        | 100%     | Product lifecycle, Work Space, Tasks and Support bridges                                                                                                                    |
| Phase 5 — Collaboration / knowledge | Done        | 100%     | Calendar, Technical, Notifications, Drive, Credentials, Messenger, Mail and Documents P0 closure slices shipped                                                             |
| Phase 6 — Control layer             | Done        | 100%     | P0 closed: Dashboard Control Center plus minimal working Reports catalog/filter/saved-view/export/schedule foundation shipped; deeper BI is later only with product clarity |
| Phase 7 — Integrations / migration  | In progress | 0%       | Pre-Phase 7 consistency gate synced dev DB/RBAC and API smoke passes; manual owner browser pass remains before first feature slice                                          |

## Closed Gates

- Phase 3 full closure: Finance core, Client Services and approved read-only report aggregates are complete.
- Phase 5 P0 closure: Collaboration/knowledge modules are usable at MVP depth.
- Control boundary: Dashboard is action center; Reports owns read-only catalog/export/schedule concerns.
- Phase 6 P0 closure: Dashboard is usable as a Control Center; Reports is minimal and working without deeper BI scope.
- Pre-Phase 7 stabilization automated gate: Prisma generate, database/API/web typecheck, lint, tests and build passed.
- Pre-Phase 7 consistency gate: dev DB migrations and owner RBAC are synced; API smoke passes for Dashboard, Notifications, Drive, Documents, Mail, Reports, Tasks and Deals.

## Recent Milestones

| Through    | Area                  | Summary                                                                                                                                                                                                       |
| ---------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-04-29 | Phase 3–4             | Finance core and Delivery ops closed: money state, Client Services, report aggregates, product lifecycle and Work Space/Support bridges.                                                                      |
| 2026-04-30 | Phase 5 closure       | Collaboration/knowledge P0 closed: Calendar, Technical, Notifications, Drive, Credentials, Messenger, Mail and Documents.                                                                                     |
| 2026-04-30 | Phase 6 closure       | Control layer P0 closed: Dashboard Control Center plus minimal working Reports catalog/export/schedule/filter/audit foundation.                                                                               |
| 2026-04-30 | Phase 7 precheck      | Automated checks pass; dev DB/RBAC is synced; owner API smoke passes; manual browser session pass remains.                                                                                                    |
| 2026-05-04 | Pre-Phase 7 hardening | Web: Next.js `proxy` (`src/proxy.ts`) auth gate; public `/sign-up` invite-only page; `/api/me` failures surface via toast + banner; unused web deps removed; baseline deploy + migration workflow docs added. |

## Next Action

1. Run the owner/browser smoke checklist from `docs/PHASE_7_PRECHECK_MANUAL_QA.md` in the logged-in browser session.
2. If smoke passes, start Phase 7 with `integration-registry-foundation`.
3. Keep Google v2, AI, complex approval workflow, WAHA runtime and credentials secrets out unless explicitly approved.

## Slice DoD

- Behavior matches `docs/NBOS` and the Phase 3 gate.
- No fake financial, audit, credential or report data.
- Tests/typecheck/lint run for touched API/web/database areas.
- Docs updated only at milestone level.
- One end-of-slice commit bundles related code, tests and docs.
