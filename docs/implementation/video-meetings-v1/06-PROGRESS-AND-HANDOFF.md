# 06 — Progress and handoff

## Branch / commit

| Item                  | Value                                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------------- |
| Branch                | `feature/video-meetings-v1` (based on docs S00 @ `465584f06`; **do not** merge/rebase onto diverged origin) |
| S00 commit            | `465584f06` — docs: add video meetings V1 gap analysis and implementation plan                              |
| S01 commit            | `04b6ec6eb` — feat(video-meetings): add meeting domain schema and permission flags                          |
| S02 commit            | this branch HEAD after S02 (`feat(video-meetings): add flagged meeting metadata API`)                       |
| Push                  | **Not pushed** (origin diverged; remote deleted `todo.md`)                                                  |
| `todo.md` / `TODO.md` | Left **unstaged**; local wipe of prior checklist preserved dirty                                            |

## Slice status

| Slice | Status               | Notes                                                                                                |
| ----- | -------------------- | ---------------------------------------------------------------------------------------------------- |
| S00   | **DONE** (docs only) | Gap analysis, ADRs, pins, recording feasibility, plan. LiveKit local: **NOT RUN** — do not mark PASS |
| S01   | **DONE**             | Prisma entities, VIDEO_MEETINGS RBAC (Owner/CEO only), feature flag default OFF, domain unit tests   |
| S02   | **DONE**             | Nest metadata API behind flag; create/start/list/card/history/links; no LiveKit                      |
| S03   | TODO                 | First LiveKit local bring-up                                                                         |
| S04   | TODO                 |                                                                                                      |
| S05   | TODO                 | Prove multi-egress recording                                                                         |
| S06   | TODO                 | Drive finalize                                                                                       |
| S07   | TODO                 | V1 gate                                                                                              |

## What landed in S02

### Endpoints (all under `/api/video-meetings`, auth + `VIDEO_MEETINGS_*` required)

| Method | Path                        | Permission | Behavior                                                                         |
| ------ | --------------------------- | ---------- | -------------------------------------------------------------------------------- |
| POST   | `/`                         | ADD        | Instant standalone meeting; host=owner=caller; `calendarMeetingId=null`          |
| GET    | `/`                         | VIEW       | List meetings caller may access (host/owner/participant); optional status filter |
| GET    | `/history`                  | VIEW       | Same as list with `status=ENDED`                                                 |
| GET    | `/:id`                      | VIEW       | Card/detail (sessions + entity links; no recordings/invites)                     |
| POST   | `/:id/start`                | EDIT       | Metadata session + opaque `livekitRoomName` placeholder; **no LiveKit**          |
| POST   | `/:id/end`                  | EDIT       | Soft-end active meeting                                                          |
| POST   | `/:id/cancel`               | EDIT       | Soft-cancel CREATED/WAITING                                                      |
| POST   | `/:id/entity-links`         | EDIT       | Attach Deal/Project/Product/Contact after entity VIEW re-check                   |
| DELETE | `/:id/entity-links/:linkId` | EDIT       | Detach link (not meeting delete)                                                 |

### Feature flag

- Gate: `VideoMeetingsFeatureGuard` → **404** when `isVideoMeetingsFeatureEnabled(VIDEO_MEETINGS_V1_ENABLED)` is false.
- Default remains **OFF** (`VIDEO_MEETINGS_FEATURE_ENABLED_DEFAULT === false`).
- Tests inject `VIDEO_MEETINGS_FEATURE_ENABLED_TOKEN = true`; production wiring must omit the override.

### Rate limit

- **DECISION:** no new per-module limiter. Platform `ThrottlerGuard` (global APP_GUARD, ttl 60s / limit 100) already applies. Do not invent a Video Meetings-specific number.

### Serializers / negatives

- Responses omit recording assets, R2 keys, invite digests/plaintext, playback URLs.
- Entity links never widen media ACL (`entityLinkGrantsVideoMeetingsAccess` still false without VIDEO_MEETINGS).
- CALLS permissions do not open Video Meetings routes.
- No guest/`@Public` routes in this module.

## Checks run in S02

| Check                                                                      | Result                                        |
| -------------------------------------------------------------------------- | --------------------------------------------- |
| Prettier on touched files                                                  | **PASS**                                      |
| `eslint` on `src/modules/video-meetings/**` + `app.module.ts`              | **PASS**                                      |
| Vitest `apps/api/src/modules/video-meetings` (15)                          | **PASS**                                      |
| `pnpm --filter @nbos/api typecheck` (`tsc --noEmit`, NODE_OPTIONS heap 8G) | **PASS**                                      |
| Integration DB / e2e against real Postgres                                 | **NOT RUN** (unit + HTTP contract with mocks) |
| LiveKit SDK / room create / JWT mint                                       | **NOT RUN** (S03)                             |
| Full monorepo build                                                        | **NOT RUN**                                   |
| Production migrate / push / origin merge                                   | **NOT RUN** (forbidden)                       |

## Handoff to S03

**S03 can start immediately** on this branch without pulling origin.

S03 notes:

- Wire self-hosted LiveKit (pinned versions from ADR-VM-001); replace opaque room placeholder with real `CreateRoom`.
- Mint AccessTokens only after admission; guest invite routes start here (digest-only storage).
- Do not change S02 link/auth semantics; do not enable feature flag by default.
- Keep serializers free of playback URLs until S05/S06.

Still open (do **not** block S03; block production enablement later):

- Legal notice / retention wording
- Default RBAC role matrix beyond Owner/CEO
- Capacity numbers on real hardware
- Optional new `FileArtifactOperationSourceEnum` vs SYSTEM actor (decide in S06)

## Files created / touched (S02)

```text
apps/api/src/modules/video-meetings/*
apps/api/src/app.module.ts
apps/api/src/test-utils/mock-prisma.ts
docs/implementation/video-meetings-v1/03-PHASES-AND-SLICES.md
docs/implementation/video-meetings-v1/06-PROGRESS-AND-HANDOFF.md
```

## What landed in S01 (summary)

- Additive Prisma schema + migration; VIDEO_MEETINGS RBAC; feature flag default OFF; domain unit tests.
- See prior handoff section history / S01 commit for details.
