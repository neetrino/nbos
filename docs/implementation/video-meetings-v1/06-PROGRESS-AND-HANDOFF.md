# 06 — Progress and handoff

## Branch / commit

| Item                  | Value                                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------------- |
| Branch                | `feature/video-meetings-v1` (based on docs S00 @ `465584f06`; **do not** merge/rebase onto diverged origin) |
| S00 commit            | `465584f06` — docs: add video meetings V1 gap analysis and implementation plan                              |
| S01 commit            | this branch HEAD after S01 (`feat(video-meetings): add meeting domain schema and permission flags`)         |
| Push                  | **Not pushed** (origin diverged; remote deleted `todo.md`)                                                  |
| `todo.md` / `TODO.md` | Left **unstaged**; local wipe of prior checklist preserved dirty                                            |

## Slice status

| Slice | Status               | Notes                                                                                                |
| ----- | -------------------- | ---------------------------------------------------------------------------------------------------- |
| S00   | **DONE** (docs only) | Gap analysis, ADRs, pins, recording feasibility, plan. LiveKit local: **NOT RUN** — do not mark PASS |
| S01   | **DONE**             | Prisma entities, VIDEO_MEETINGS RBAC (Owner/CEO only), feature flag default OFF, domain unit tests   |
| S02   | TODO                 | Nest API next                                                                                        |
| S03   | TODO                 | First LiveKit local bring-up                                                                         |
| S04   | TODO                 |                                                                                                      |
| S05   | TODO                 | Prove multi-egress recording                                                                         |
| S06   | TODO                 | Drive finalize                                                                                       |
| S07   | TODO                 | V1 gate                                                                                              |

## What landed in S01

- Additive Prisma schema `packages/database/prisma/schema/video-meetings.prisma` (meeting, session, participant, invite digest, consent, recording, asset, entity link; optional nullable `calendarMeetingId` string — no CalendarMeeting auto-create).
- Migration `20260926170000_video_meetings_v1_schema` (enums + tables + FKs within module + permission rows).
- Shared constants: `VIDEO_MEETINGS` VIEW/EDIT/ADD/DELETE; feature flag key `video_meetings_v1` default `false`.
- Domain rules module `packages/shared/src/video-meetings/*` + vitest coverage.
- `seed-rbac` MODULES includes `VIDEO_MEETINGS` (Owner/CEO via `Object.fromEntries` → F). Upsert script for catch-up DBs.
- **Default RBAC beyond Owner/CEO:** documented as open Product+Security **DECISION** — not invented.

### Schema decisions vs ADR (non-blocking)

- Cross-module refs (`hostEmployeeId`, `ownerEmployeeId`, `calendarMeetingId`, `fileAssetId`, entity `entityId`) are **string ids without Prisma FK** to Employee/Calendar/Drive/CRM models — matches CalendarMeeting soft-ref style and keeps Module 22 isolated. Application validates in S02+.
- Canon fine-grained verbs (JOIN/HOST/RECORD/…) map to platform **VIEW/EDIT/ADD/DELETE** for Settings → Roles catalog consistency; finer gates stay for later API slices.
- Feature Flags Settings page is still a placeholder → code constant default OFF (not DB-backed).

## Checks run in S01

| Check                                                                           | Result                                      |
| ------------------------------------------------------------------------------- | ------------------------------------------- |
| Migration risk classification                                                   | **LOW** (additive tables/enums/permissions) |
| Generated/hand-written SQL inspected                                            | **Yes** — no DROP/ALTER of existing tables  |
| `prisma validate`                                                               | **PASS**                                    |
| `prisma generate`                                                               | **PASS**                                    |
| `prisma migrate deploy` on non-prod Neon (`DATABASE_URL` ≠ `DATABASE_URL_PROD`) | **PASS**                                    |
| Production migrate / `DATABASE_URL_PROD`                                        | **NOT RUN** (forbidden)                     |
| Vitest domain + migration tests (14)                                            | **PASS**                                    |
| `pnpm --filter @nbos/database typecheck`                                        | **PASS**                                    |
| `pnpm --filter @nbos/shared typecheck`                                          | **PASS**                                    |
| Prettier on touched files                                                       | **PASS** (run before commit)                |
| LiveKit / Nest API / Next UI                                                    | **NOT RUN** (out of S01 scope)              |

## Handoff to S02

**S02 can start immediately** on this branch without pulling origin.

S02 notes:

- Nest module behind `isVideoMeetingsFeatureEnabled` / `VIDEO_MEETINGS_FEATURE_ENABLED_DEFAULT === false`.
- Create instant meeting, list/filter, detail/card, history, attach/detach Deal/Project/Product/Contact with auth re-check.
- Serializers must never leak recording URLs.
- Permission negatives: CALLS must not open Video Meetings; entity links must not widen media ACL.
- Do not force-create CalendarMeeting; do not start LiveKit yet (S03).

Still open (do **not** block S02; block production enablement later):

- Legal notice / retention wording
- Default RBAC role matrix beyond Owner/CEO
- Capacity numbers on real hardware
- Optional new `FileArtifactOperationSourceEnum` vs SYSTEM actor (decide in S06)

## Files created / touched (S01)

```text
packages/database/prisma/schema/video-meetings.prisma
packages/database/prisma/migrations/20260926170000_video_meetings_v1_schema/migration.sql
packages/database/prisma/video-meetings-v1.migration.test.ts
packages/database/prisma/seed-rbac.ts
packages/database/scripts/upsert-video-meetings-permissions.ts
packages/shared/src/constants/video-meetings-permissions.ts
packages/shared/src/constants/video-meetings-feature-flag.ts
packages/shared/src/constants/index.ts
packages/shared/src/video-meetings/*
packages/shared/src/index.ts
docs/implementation/video-meetings-v1/03-PHASES-AND-SLICES.md
docs/implementation/video-meetings-v1/06-PROGRESS-AND-HANDOFF.md
```
