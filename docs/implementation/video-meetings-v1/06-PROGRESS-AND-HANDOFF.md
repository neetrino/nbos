# 06 — Progress and handoff

## Branch / commit

| Item                  | Value                                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------------- |
| Branch                | `feature/video-meetings-v1` (based on docs S00 @ `465584f06`; **do not** merge/rebase onto diverged origin) |
| S00 commit            | `465584f06` — docs: add video meetings V1 gap analysis and implementation plan                              |
| S01 commit            | `04b6ec6eb` — feat(video-meetings): add meeting domain schema and permission flags                          |
| S02 commit            | `b28a49235` — feat(video-meetings): add flagged meeting metadata API                                        |
| S03 commit            | this branch HEAD after S03 (`feat(video-meetings): add LiveKit room tokens and guest admission`)            |
| Push                  | **Not pushed** (origin diverged; remote deleted `todo.md`)                                                  |
| `todo.md` / `TODO.md` | Left **unstaged**; local wipe of prior checklist preserved dirty                                            |

## Slice status

| Slice | Status               | Notes                                                                                              |
| ----- | -------------------- | -------------------------------------------------------------------------------------------------- |
| S00   | **DONE** (docs only) | Gap analysis, ADRs, pins, recording feasibility, plan. LiveKit local: **NOT RUN** in S00           |
| S01   | **DONE**             | Prisma entities, VIDEO_MEETINGS RBAC (Owner/CEO only), feature flag default OFF, domain unit tests |
| S02   | **DONE**             | Nest metadata API behind flag; create/start/list/card/history/links; no LiveKit                    |
| S03   | **DONE**             | LiveKit compose + Nest tokens/invites/prejoin/admission/reconnect; see checks below                |
| S04   | TODO                 | Next.js room UI (`@livekit/components-react` / `livekit-client`) — **can start immediately**       |
| S05   | TODO                 | Prove multi-egress recording                                                                       |
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

## Handoff to S04

**S04 can start immediately** on this branch without pulling origin.

S04 notes:

- Add `@livekit/components-react@2.9.24` + `livekit-client@2.22.3` in web only; wire to S02/S03 APIs.
- Sidebar Video Meetings + guest page without app chrome; EN/RU/HY.
- Do not enable feature flag by default; do not start S05 recording.

Still open (do **not** block S04; block production enablement later):

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
