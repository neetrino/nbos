# 01 — Gap analysis (code evidence)

**Audit date:** 2026-09-26  
**Branch audited:** `feature/video-meetings-v1` @ `db7191cda` (from `sipan`; Module 22 canon present via PR #344).  
**Method:** narrow path reads + ripgrep over `apps/`, `packages/`, Prisma schemas. Docs alone are never treated as implementation.

Rubric: **OK** | **PARTIAL** | **MISSING** | **STALE** | **DECISION**.

## Summary counts

| Classification | Count |
| -------------- | ----- |
| OK             | 8     |
| PARTIAL        | 5     |
| MISSING        | 14    |
| STALE          | 1     |
| DECISION       | 6     |

## Gap table

| #   | V1 requirement                                                                                              | Status        | Evidence                                                                                                                                                                                                                                        |
| --- | ----------------------------------------------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Module 22 product canon (V1/V2 docs)                                                                        | OK            | `docs/NBOS/02-Modules/22-Video-Meetings/*.md` (8 files); UI spec `docs/NBOS/05-UI-Specifications/16-Video-Meetings.md`; roadmap + technical decisions entries present                                                                           |
| 2   | Standalone `VideoMeeting` domain models (meeting/session/participant/invite/consent/recording/assets/links) | MISSING       | No Prisma model `VideoMeeting*` under `packages/database/prisma/schema/`; no schema file for video meetings                                                                                                                                     |
| 3   | NestJS Video Meetings module (API)                                                                          | MISSING       | `apps/api/src/modules/` has no `video-meetings` (or similar); modules list ends at existing domains (calendar, drive, crm, …)                                                                                                                   |
| 4   | Next.js Video Meetings UI / nav                                                                             | MISSING       | No `apps/web/src/features/video-*`; `apps/web/src/lib/navigation/nav-config.ts` has no Video Meetings entry (rg: no matches)                                                                                                                    |
| 5   | LiveKit Server / Egress / SDK dependencies                                                                  | MISSING       | No `livekit` / `@livekit` in root or `apps/*/package.json` / `packages/*/package.json`; no docker compose for LiveKit in repo                                                                                                                   |
| 6   | Self-hosted LiveKit local/dev infra                                                                         | MISSING       | No LiveKit config, Helm values, or run scripts for media stack in repo                                                                                                                                                                          |
| 7   | Backend-minted LiveKit tokens + guest invites                                                               | MISSING       | No token minting code; no invite digest model                                                                                                                                                                                                   |
| 8   | Recording orchestration (consent + composite + per-participant audio)                                       | MISSING       | No egress client usage in `apps/api`                                                                                                                                                                                                            |
| 9   | Drive `MEETING_RECORDING` purpose enum                                                                      | OK            | `packages/database/prisma/schema/drive.prisma` enum `FilePurposeEnum` includes `MEETING_RECORDING`; web options `apps/web/src/features/drive/drive-options.ts`; API home purpose map `apps/api/src/modules/drive/drive-storage-home-purpose.ts` |
| 10  | Drive durable `FileArtifactOperation` lifecycle                                                             | OK            | Model + enums in `drive.prisma`; services under `apps/api/src/modules/drive/artifact-operation/`; canon `docs/NBOS/02-Modules/11-Drive/04-Upload-Versioning-and-Lifecycle.md` §2.1                                                              |
| 11  | Egress → private R2 → Drive finalize adapter for meetings                                                   | PARTIAL       | Foundation OK (`SYSTEM` + `MACHINE_PUT` paths exist, e.g. int tests in `drive-artifact-operation.int.test.ts`). No Video Meetings producer, webhook reconciliation, or Egress-keyed prepare→verify→COMPLETE flow                                |
| 12  | `FileArtifactOperationSourceEnum` / kind / ingress for Egress                                               | PARTIAL       | Sources: `HUMAN`, `INTERNAL_AI`, `EXTERNAL_AI`, `SYSTEM` (`drive.prisma`). Meeting Egress can use `SYSTEM` + `MACHINE_PUT` without new enum **if** actor/idempotency contract is explicit; optional additive source remains a DECISION          |
| 13  | Calendar `CalendarMeeting` (scheduling)                                                                     | OK            | `packages/database/prisma/schema/calendar.prisma` model `CalendarMeeting`; API `apps/api/src/modules/calendar/`; UI `apps/web/src/features/calendar/`                                                                                           |
| 14  | Optional CalendarMeeting ↔ VideoMeeting link                                                                | MISSING       | `CalendarMeeting` has Deal/Project/Product/Contact FKs but **no** `videoMeetingId` (or reverse). Canon requires nullable validated connection when opted in                                                                                     |
| 15  | ATS Calls / CALLS journal (must stay separate)                                                              | OK            | `AtsCallEvent` in `integrations.prisma`; CALLS RBAC migration `20260916120000_calls_permissions`; UI `apps/web/src/features/crm/calls/CallsCenterPage.tsx` — do not reuse as VideoMeeting                                                       |
| 16  | Dedicated Video Meetings RBAC                                                                               | MISSING       | No `VIDEO_MEETINGS` (or similar) permission module; CALLS permissions are separate and must not be reused                                                                                                                                       |
| 17  | Feature flag for Video Meetings V1                                                                          | PARTIAL       | Settings Feature Flags page exists as placeholder (`apps/web/src/app/(app)/settings/feature-flags/page.tsx` — “not configured yet”); notifications have their own flags. No `VIDEO_MEETINGS` flag constant or gate                              |
| 18  | Notifications for calendar-linked reminders only                                                            | PARTIAL       | Notifications module exists (`apps/api/src/modules/notifications/`); Calendar reminders path exists as adjacent. Standalone VideoMeeting must not invent a second reminder pipeline — wiring is future S07                                      |
| 19  | Guest join page (no NBOS shell)                                                                             | MISSING       | No guest route under `apps/web/src/app`                                                                                                                                                                                                         |
| 20  | Recording consent / notice persistence                                                                      | MISSING       | No consent tables or APIs                                                                                                                                                                                                                       |
| 21  | Private playback gated by Video Meetings + Drive ACL                                                        | PARTIAL       | Drive playback/ACL exists for files; meeting-specific restriction layer absent                                                                                                                                                                  |
| 22  | Isolation: media outage must not break CRM/Drive/etc.                                                       | DECISION      | Pattern exists elsewhere (feature flags, module boundaries); must be enforced in S03+ module loading and failure handling — design in ADR                                                                                                       |
| 23  | Cleanup register preliminary “standalone rooms MISSING”                                                     | OK (verified) | Re-audited 2026-09-26: still **MISSING** (no LiveKit packages, no video-meetings module). Claim in `99-Video-Meetings-Cleanup-Register.md` is accurate, not stale                                                                               |
| 24  | Cleanup register slice numbering (S00–S05) vs this package (S00–S07)                                        | STALE         | Register compresses work into fewer slices; this package is the executable plan. Register updated with pointer only (no pretend-implementation)                                                                                                 |
| 25  | Legal notice wording + retention windows                                                                    | DECISION      | Canon forbids inventing binding periods; owner/legal before production                                                                                                                                                                          |
| 26  | Default RBAC role matrix for Video Meetings                                                                 | DECISION      | Canon lists capabilities; exact role defaults need approval before production enable                                                                                                                                                            |
| 27  | LiveKit/Egress version pin + recording design                                                               | DECISION      | Resolved for planning in `02-ARCHITECTURE-AND-ADRS.md` (pins + multi-egress ADR); local runtime validation **NOT RUN** in S00                                                                                                                   |
| 28  | Capacity / Hetzner / TURN / DNS for staging+prod                                                            | DECISION      | External ops gates; see `05-DEPLOYMENT-AND-RUNBOOK.md`                                                                                                                                                                                          |
| 29  | Concurrent room-composite + per-participant TrackEgress under consent                                       | DECISION      | Feasible with orchestrated egress (not AutoEgress-at-create); must be proven in S05 — see ADR-VM-003                                                                                                                                            |
| 30  | AI Meeting Intelligence (V2)                                                                                | OK (defer)    | Future docs only; intentionally not in V1 gap as implementable work                                                                                                                                                                             |

## Five most important MISSING items

1. **Prisma Video Meetings domain** — no models under `packages/database/prisma/schema/` for meeting/session/participant/invite/consent/recording/assets/links.
2. **NestJS module** — absent from `apps/api/src/modules/` (create/list/card/history/tokens/recording).
3. **LiveKit stack** — no Server/Egress/SDK dependencies or local infra.
4. **Web UI + nav** — no sidebar section, room, guest page, or history surfaces.
5. **Dedicated RBAC + feature flag** — no `VIDEO_MEETINGS` permissions; feature-flag surface is placeholder only.

## Adjacent foundations to reuse (do not rebuild)

| Foundation                  | Path                                                                                |
| --------------------------- | ----------------------------------------------------------------------------------- |
| Drive artifact operation    | `apps/api/src/modules/drive/artifact-operation/`                                    |
| R2 storage / purposes       | `packages/database/prisma/schema/drive.prisma`                                      |
| Calendar meetings           | `packages/database/prisma/schema/calendar.prisma`, `apps/api/src/modules/calendar/` |
| RBAC upsert pattern         | e.g. `packages/database/scripts/upsert-calls-permissions.ts`, CALLS migration       |
| i18n EN/RU/HY               | `apps/web/src/messages/{en,ru,hy}/`                                                 |
| Feature-flag settings shell | `apps/web/src/app/(app)/settings/feature-flags/page.tsx`                            |

## Explicit non-goals for this audit

- Did not run LiveKit Docker locally (**NOT RUN**).
- Did not query production databases.
- Did not treat Module 22 markdown as “already implemented.”
