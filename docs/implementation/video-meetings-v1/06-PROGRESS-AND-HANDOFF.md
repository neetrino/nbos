# 06 — Progress and handoff

## Branch / commit

| Item                  | Value                                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------------- |
| Branch                | `feature/video-meetings-v1` (based on docs S00 @ `465584f06`; **do not** merge/rebase onto diverged origin) |
| S00 commit            | `465584f06` — docs: add video meetings V1 gap analysis and implementation plan                              |
| S01 commit            | `04b6ec6eb` — feat(video-meetings): add meeting domain schema and permission flags                          |
| S02 commit            | `b28a49235` — feat(video-meetings): add flagged meeting metadata API                                        |
| S03 commit            | `ae7e43680` — feat(video-meetings): add LiveKit room tokens and guest admission                             |
| S04 commit            | `4c412a644` — feat(web): add video meetings list, room, and guest prejoin                                   |
| Push                  | **Not pushed** (origin diverged; remote deleted `todo.md`)                                                  |
| `todo.md` / `TODO.md` | Left **unstaged**; local wipe of prior checklist preserved dirty                                            |

## Slice status

| Slice | Status               | Notes                                                                                              |
| ----- | -------------------- | -------------------------------------------------------------------------------------------------- |
| S00   | **DONE** (docs only) | Gap analysis, ADRs, pins, recording feasibility, plan. LiveKit local: **NOT RUN** in S00           |
| S01   | **DONE**             | Prisma entities, VIDEO_MEETINGS RBAC (Owner/CEO only), feature flag default OFF, domain unit tests |
| S02   | **DONE**             | Nest metadata API behind flag; create/start/list/card/history/links; no LiveKit                    |
| S03   | **DONE**             | LiveKit compose + Nest tokens/invites/prejoin/admission/reconnect; see checks below                |
| S04   | **DONE**             | Web list/detail/room/guest UI; LiveKit components pinned; recording UI disabled until S05          |
| S05   | TODO                 | Prove multi-egress recording — **can start after S04**                                             |
| S06   | TODO                 | Drive finalize                                                                                     |
| S07   | TODO                 | V1 gate                                                                                            |

## What landed in S03

### Local infra

- `docker-compose.livekit.yml` — `livekit/livekit-server:v1.13.7` + dedicated Redis (`redis:7.4-alpine` on host **6380**).
- Optional Egress `livekit/egress:v1.14.1` under compose profile `egress` (**not** started by default; no recording orchestration).
- Config: `docker/livekit/livekit.yaml` with insecure local-dev keys `devkey`/`secret` (commented as local-only).
- npm pin: `livekit-server-sdk@2.19.1` in `@nbos/api` only (no `@livekit/components-react` / `livekit-client`).

### Additive schema

- `VideoMeetingAdmissionStatus` (`WAITING` | `ADMITTED` | `REJECTED`).
- `VideoMeetingParticipant.inviteId` (unique, nullable) + `admissionStatus` for guest↔invite reconnect identity.

### Endpoints (flag OFF → 404 on all; missing LiveKit env → 503 on token/ensure)

**Employee** (`/api/video-meetings`, auth + `VIDEO_MEETINGS_*`):

| Method | Path                                      | Permission | Behavior                                                 |
| ------ | ----------------------------------------- | ---------- | -------------------------------------------------------- |
| POST   | `/:id/start`                              | EDIT       | Session + opaque room; `CreateRoom` when LiveKit env set |
| POST   | `/:id/token`                              | VIEW       | Employee JWT after admitted participant upsert           |
| POST   | `/:id/invites`                            | EDIT       | Create invite; **raw token once**; digest persisted      |
| GET    | `/:id/invites`                            | EDIT       | List invites (no secrets)                                |
| POST   | `/:id/invites/:inviteId/revoke`           | EDIT       | Set `revokedAt`                                          |
| GET    | `/:id/waiting`                            | EDIT       | Waiting guests                                           |
| POST   | `/:id/participants/:participantId/admit`  | EDIT       | Admit guest                                              |
| POST   | `/:id/participants/:participantId/reject` | EDIT       | Reject guest                                             |

(Plus S02 metadata routes unchanged.)

**Guest** (`/api/video-meetings/guest`, `@Public`, no NBOS session):

| Method | Path       | Behavior                                                               |
| ------ | ---------- | ---------------------------------------------------------------------- |
| POST   | `/prejoin` | Invite secret + display name → waiting/admitted state; **no JWT**      |
| POST   | `/token`   | Same invite → LiveKit JWT only if `ADMITTED`; cam+mic, no screen/admin |

Guest responses: `admissionState`, `livekitUrl`, `token`, `roomName`, `participantId`, `displayName` only.

### Rate limit

- **DECISION:** guest prejoin/token inherit global `ThrottlerGuard` (ttl 60s / limit 100). No Video Meetings-specific limit number invented (aligned with S02).

### Token policy

- Single-room grants; no `roomCreate` / `roomAdmin` / `roomRecord` / `recorder`.
- Host/employee: cam+mic+screen. Guest: cam+mic only.
- Reconnect reuses `VideoMeetingParticipant.id` (employee by `employeeId`; guest by `inviteId`).

## Checks run in S03

| Check                                                                | Result                                                         |
| -------------------------------------------------------------------- | -------------------------------------------------------------- |
| Prettier on touched TS/MD/YAML/JSON                                  | **PASS**                                                       |
| `eslint` on `apps/api/src/modules/video-meetings/**`                 | **PASS**                                                       |
| Vitest `apps/api/src/modules/video-meetings` (39) from monorepo root | **PASS**                                                       |
| `pnpm --filter @nbos/api typecheck`                                  | **PASS**                                                       |
| `prisma validate` + generate                                         | **PASS**                                                       |
| Docker compose LiveKit listen on `:7880` (HTTP 200, server v1.13.7)  | **PASS**                                                       |
| Two browsers joined the same local room                              | **NOT RUN** (no interactive browser join; JWT unit tests only) |
| Production migrate / push / origin merge                             | **NOT RUN** (forbidden)                                        |

## What landed in S04

### Web routes (flag `NEXT_PUBLIC_VIDEO_MEETINGS_V1_ENABLED` + API `VIDEO_MEETINGS_V1_ENABLED`; default OFF)

| Route                              | Shell                                                                       |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `/video-meetings`                  | Authenticated app — list (active / upcoming / history)                      |
| `/video-meetings/[meetingId]`      | Detail — invites, entity links, start/end, recording status (not recording) |
| `/video-meetings/[meetingId]/room` | LiveKit room (`VideoConference`); host waiting panel                        |
| `/video-meetings/join?invite=`     | Guest-only page (`data-video-meeting-guest-shell`); no sidebar              |

Pins: `@livekit/components-react@2.9.24`, `livekit-client@2.22.3` in `@nbos/web`.

Recording start/stop buttons are visible but **disabled** with copy that S05 must wire egress APIs.

### Local verification (enable flags in running dev env only)

```bash
# API + web dev (separate terminals; do not commit .env)
VIDEO_MEETINGS_V1_ENABLED=true pnpm --filter @nbos/api dev
NEXT_PUBLIC_VIDEO_MEETINGS_V1_ENABLED=true pnpm --filter @nbos/web dev
```

## Checks run in S04

| Check                                                                  | Result                                                     |
| ---------------------------------------------------------------------- | ---------------------------------------------------------- |
| Prettier on touched web/i18n/docs                                      | **PASS**                                                   |
| `pnpm --filter @nbos/web typecheck`                                    | **PASS**                                                   |
| ESLint on video-meetings feature + routes                              | **PASS**                                                   |
| Vitest catalog parity + nav/guest gate tests (10)                      | **PASS**                                                   |
| Browser: list/404 flag off, guest no sidebar, room token/LiveKit state | **NOT RUN** (no dev server on `:3000` in executor session) |
| Two-browser media join on `:7880`                                      | **NOT RUN**                                                |

## Handoff to S05

**S05 can start** on this branch without pulling origin.

S05 must wire:

- Recording start/stop API + egress orchestration; enable room recording controls (currently disabled in `VideoMeetingRecordingIndicator`).
- Consent gate before capture; update recording status on detail/room when API returns real states.

Still open (block production enablement later):

- Legal notice / retention wording
- Default RBAC role matrix beyond Owner/CEO
- Capacity numbers on real hardware
- Optional new `FileArtifactOperationSourceEnum` vs SYSTEM actor (decide in S06)

## Files created / touched (S03)

```text
docker-compose.livekit.yml
docker/livekit/livekit.yaml
docker/livekit/egress.yaml
apps/api/src/modules/video-meetings/* (tokens, invites, admission, guest controller, tests)
apps/api/package.json (livekit-server-sdk@2.19.1)
packages/database/prisma/schema/video-meetings.prisma
packages/database/prisma/migrations/20260926180000_video_meetings_admission/
packages/shared/src/video-meetings/invite.ts
.env.example
docs/implementation/video-meetings-v1/03-PHASES-AND-SLICES.md
docs/implementation/video-meetings-v1/05-DEPLOYMENT-AND-RUNBOOK.md
docs/implementation/video-meetings-v1/06-PROGRESS-AND-HANDOFF.md
```

## Prior slices

S01–S02 summaries remain valid; S02 endpoints unchanged except `start` now ensures LiveKit room when configured.
