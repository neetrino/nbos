# NBOS Implementation Progress

> Compact tracker for implementation state. Detailed behavior belongs in `docs/NBOS/02-Modules/*`, cleanup registers, tests and git history.

## Current Focus

| Field           | Value                              |
| --------------- | ---------------------------------- |
| Current phase   | **Phase 6 — Control layer**        |
| Current task    | Saved report views                 |
| Status          | Phase 6 in progress                |
| Last updated    | 2026-04-30                         |
| Source of truth | Roadmap + module cleanup registers |

## Phase Snapshot

| Phase                               | Status      | Progress | Current note                                                                                                                                                      |
| ----------------------------------- | ----------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phase 1 — Platform shell            | Done        | 100%     | Navigation, RBAC shell, shared states, admin foundation                                                                                                           |
| Phase 2 — CRM / Marketing / Intake  | Done        | 100%     | Intake, CRM handoff, marketing spend links, project entry points                                                                                                  |
| Phase 3 — Finance core              | Done        | 100%     | Finance runtime + Client Services + six report aggregates                                                                                                         |
| Phase 4 — Delivery ops              | Done        | 100%     | Product lifecycle, Work Space, Tasks and Support bridges                                                                                                          |
| Phase 5 — Collaboration / knowledge | Done        | 100%     | Calendar, Technical, Notifications, Drive, Credentials, Messenger, Mail and Documents P0 closure slices shipped                                                   |
| Phase 6 — Control layer             | In progress | ~94%     | Reports catalog/filter/export/audit/schedule/navigation foundation, simple recurrence, due runner, schedule actions and Dashboard Control Center/defaults shipped |
| Phase 7 — Integrations / migration  | Not started | 0%       | WhatsApp, bank/gov, Bitrix migration                                                                                                                              |

## Closed Gates

- Phase 3 full closure: Finance core, Client Services and approved read-only report aggregates are complete.
- Phase 5 P0 closure: Collaboration/knowledge modules are usable at MVP depth.
- Control boundary: Dashboard is action center; Reports owns read-only catalog/export/schedule concerns.

## Recent Milestones

| Through    | Area                 | Summary                                                                                                                                 |
| ---------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-04-29 | Phase 3–4            | Finance full closure; Delivery / Work Space / Support bridges; product lifecycle + Done readiness.                                      |
| 2026-04-30 | Phase 5 closure      | Calendar, Technical, Notifications, Drive, Credentials, Messenger, Mail and Documents P0 slices shipped from approved closure proposal. |
| 2026-04-30 | Reports / Analytics  | `/reports` catalog shell surfaces Finance-owned definitions with search/category filters and honest scheduled/export empty states.      |
| 2026-04-30 | Dashboard            | Control Center shell, backend projection API and per-employee preferences shipped for pinned actions, priority cards and mini widgets.  |
| 2026-04-30 | Reports exports      | `ReportExportJob` foundation, audited create/list API and `/reports` export history shipped with Drive `FileAsset` output relation.     |
| 2026-04-30 | Reports export files | CSV writer uses Finance-owned aggregate services, writes real Drive/R2 `FileAsset` outputs and records failure/completion audit.        |
| 2026-04-30 | Scheduled reports    | `ReportSchedule` model, create/list API, scheduled tab UI and audit foundation shipped without fake delivery attempts.                  |
| 2026-04-30 | Reports data quality | Data-quality warning API and `/reports` tab expose Finance-owned source endpoints and deferred limitations without fake zero values.    |
| 2026-04-30 | Dashboard defaults   | Role-based pinned action defaults and personal links as Dashboard pinned actions shipped with external-link handling.                   |
| 2026-04-30 | Reports worker       | BullMQ export queue/worker wiring added; export requests stay queued in DB and write Drive files asynchronously when Redis is present.  |
| 2026-04-30 | Reports recurrence   | Scheduled Reports use simple `DAILY/WEEKLY/MONTHLY` recurrence with monthly days limited to `1-28`; recurring Tasks stay separate.      |
| 2026-04-30 | Reports due runner   | Due schedules create queued export jobs, enqueue them through Reports worker wiring and advance `nextRunAt`.                            |
| 2026-04-30 | Reports schedules    | Pause, resume and archive actions shipped for owned scheduled reports with audit and UI controls.                                       |
| 2026-04-30 | Reports navigation   | Main sidebar already exposes top-level Reports / Analytics at `/reports`; cleanup register reconciled.                                  |
| 2026-04-30 | Reports filters      | Basic `dateFrom` / `dateTo` / `asOf` filter shell now feeds export jobs and new scheduled reports.                                      |
| 2026-04-30 | Reports audit        | Finance-sensitive audit context is explicit on export request/completion/failure and scheduled export queue events.                     |

## Next Action

1. Continue Phase 6 control layer per `docs/NBOS/00-Implementation-Roadmap.md`.
2. Next slice: saved report views foundation.
3. Later Phase 6: recurring Tasks as a separate Tasks-module feature, KPI/Scorecard depth and cross-module report permission centralization.
4. Keep Google v2, AI, complex approval workflow, WAHA runtime and credentials secrets out unless explicitly approved.

## Slice DoD

- Behavior matches `docs/NBOS` and the Phase 3 gate.
- No fake financial, audit, credential or report data.
- Tests/typecheck/lint run for touched API/web/database areas.
- Docs updated only at milestone level.
- One end-of-slice commit bundles related code, tests and docs.
