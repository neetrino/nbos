# NBOS Implementation Progress

> Compact tracker for implementation state. Detailed behavior belongs in `docs/NBOS/02-Modules/*`, cleanup registers, tests and git history.

## Current Focus

| Field           | Value                                   |
| --------------- | --------------------------------------- |
| Current phase   | **Phase 6 — Control layer**             |
| Current task    | Scheduled reports / export worker depth |
| Status          | Phase 6 in progress                     |
| Last updated    | 2026-04-30                              |
| Source of truth | Roadmap + module cleanup registers      |

## Phase Snapshot

| Phase                               | Status      | Progress | Current note                                                                                                                   |
| ----------------------------------- | ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Phase 1 — Platform shell            | Done        | 100%     | Navigation, RBAC shell, shared states, admin foundation                                                                        |
| Phase 2 — CRM / Marketing / Intake  | Done        | 100%     | Intake, CRM handoff, marketing spend links, project entry points                                                               |
| Phase 3 — Finance core              | Done        | 100%     | Finance runtime + Client Services + six report aggregates                                                                      |
| Phase 4 — Delivery ops              | Done        | 100%     | Product lifecycle, Work Space, Tasks and Support bridges                                                                       |
| Phase 5 — Collaboration / knowledge | Done        | 100%     | Calendar, Technical, Notifications, Drive, Credentials, Messenger, Mail and Documents P0 closure slices shipped                |
| Phase 6 — Control layer             | In progress | ~60%     | Reports catalog, export-job foundation and Dashboard Control Center/projection/preferences shipped; worker/schedule depth next |
| Phase 7 — Integrations / migration  | Not started | 0%       | WhatsApp, bank/gov, Bitrix migration                                                                                           |

## Closed Gates

- Phase 3 full closure: Finance core, Client Services and approved read-only report aggregates are complete.
- Phase 5 P0 closure: Collaboration/knowledge modules are usable at MVP depth.
- Control boundary: Dashboard is action center; Reports owns read-only catalog/export/schedule concerns.

## Recent Milestones

| Through    | Area                | Summary                                                                                                                                 |
| ---------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-04-29 | Phase 3–4           | Finance full closure; Delivery / Work Space / Support bridges; product lifecycle + Done readiness.                                      |
| 2026-04-30 | Phase 5 closure     | Calendar, Technical, Notifications, Drive, Credentials, Messenger, Mail and Documents P0 slices shipped from approved closure proposal. |
| 2026-04-30 | Reports / Analytics | `/reports` catalog shell surfaces Finance-owned definitions with search/category filters and honest scheduled/export empty states.      |
| 2026-04-30 | Dashboard           | Control Center shell, backend projection API and per-employee preferences shipped for pinned actions, priority cards and mini widgets.  |
| 2026-04-30 | Reports exports     | `ReportExportJob` foundation, audited create/list API and `/reports` export history shipped with Drive `FileAsset` output relation.     |

## Next Action

1. Continue Phase 6 control layer per `docs/NBOS/00-Implementation-Roadmap.md`.
2. Next slice: Reports export worker depth (real Drive/R2 file generation, failure handling and no fake report data).
3. Later Phase 6: scheduled reports, data-quality warnings, Dashboard role defaults/personal links and KPI/Scorecard depth.
4. Keep Google v2, AI, complex approval workflow, WAHA runtime and credentials secrets out unless explicitly approved.

## Slice DoD

- Behavior matches `docs/NBOS` and the Phase 3 gate.
- No fake financial, audit, credential or report data.
- Tests/typecheck/lint run for touched API/web/database areas.
- Docs updated only at milestone level.
- One end-of-slice commit bundles related code, tests and docs.
