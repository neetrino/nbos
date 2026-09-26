# 06 — Progress and handoff

## Branch / commit

| Item                  | Value                                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------------- |
| Branch                | `feature/video-meetings-v1` (based on docs S00 @ `465584f06`; **do not** merge/rebase onto diverged origin) |
| S00 commit            | `465584f06` — docs: add video meetings V1 gap analysis and implementation plan                              |
| S01 commit            | `04b6ec6eb` — feat(video-meetings): add meeting domain schema and permission flags                          |
| S02 commit            | `b28a49235` — feat(video-meetings): add flagged meeting metadata API                                        |
| S03 commit            | `ae7e43680` — feat(video-meetings): add LiveKit room tokens and guest admission                             |
| S04 commit            | `21c631722` — feat(web): add video meetings list, room, and guest prejoin                                   |
| S05 commit            | _(this commit)_ — feat(video-meetings): add consented composite and per-participant recording               |
| Push                  | **Not pushed** (origin diverged; remote deleted `todo.md`)                                                  |
| `todo.md` / `TODO.md` | Left **unstaged**; local wipe of prior checklist preserved dirty                                            |

## Slice status

| Slice | Status               | Notes                                                                                              |
| ----- | -------------------- | -------------------------------------------------------------------------------------------------- |
| S00   | **DONE** (docs only) | Gap analysis, ADRs, pins, recording feasibility, plan. LiveKit local: **NOT RUN** in S00           |
| S01   | **DONE**             | Prisma entities, VIDEO_MEETINGS RBAC (Owner/CEO only), feature flag default OFF, domain unit tests |
| S02   | **DONE**             | Nest metadata API behind flag; create/start/list/card/history/links; no LiveKit                    |
| S03   | **DONE**             | LiveKit compose + Nest tokens/invites/prejoin/admission/reconnect; see checks below                |
| S04   | **DONE**             | Web list/detail/room/guest UI; LiveKit components pinned; recording UI wired in S05                |
| S05   | **DONE** (code)      | Consent + orchestrated RoomComposite + TrackEgress; live object proof **NOT RUN**                  |
| S06   | TODO                 | Drive finalize — **can start** after this commit                                                   |
| S07   | TODO                 | V1 gate                                                                                            |

## What landed in S05

### Behavior

- Host with `VIDEO_MEETINGS` **EDIT** can `POST .../recording/start|stop` when feature flag is ON (flag off → 404).
- Consent gate: missing / UNKNOWN / DECLINED / REVOKED denies capture for that participant; **any** unknown among currently capturable room identities rejects the whole start (ADR-VM-003).
- Notice version `pending-legal-v0` + placeholder copy (pending legal approval) — not binding wording / no retention invented.
- Persist `VideoMeetingRecording` + expected `VideoMeetingRecordingAsset` rows (composite + consented published-audio tracks) **before** Egress calls; store intended `objectKey` + `egressId`; `fileAssetId` stays null (no Drive / FileArtifactOperation).
- Late join: audio egress only after GRANTED; withdrawal stops that participant’s egress and closes the segment.
- Stop/restart creates a **new** recording group; meeting ENDED never alone forces recording READY (ADR-VM-005).
- Asset READY only after HeadObject with non-zero size; otherwise PENDING/FAILED; honest PARTIAL when mixed.
- LiveKit egress webhooks verified with SDK `WebhookReceiver`; dedupe by egress id.
- Employee card may show recording group status + per-asset kind/status/participant id — never keys / signed URLs / egress ids.
- Guest consent + recording indicator status only (no CRM/Drive/playback).
- Egress/storage not configured → start-recording **503**; module still boots.

### Additive schema

- `VideoMeetingRecordingAsset.objectKey` (nullable) + index — migration `20260926190000_video_meetings_recording_object_key`.

### Endpoints (flag OFF → 404)

| Method | Path                      | Who                     | Notes                        |
| ------ | ------------------------- | ----------------------- | ---------------------------- |
| POST   | `/:id/recording/start`    | EDIT host/owner         | Consent + multi-egress start |
| POST   | `/:id/recording/stop`     | EDIT host/owner         | Stop + HeadObject verify     |
| GET    | `/:id/recording`          | VIEW                    | Latest group (safe fields)   |
| POST   | `/:id/consent`            | VIEW (self participant) | GRANTED / DECLINED / REVOKED |
| GET    | `/consent/notice`         | VIEW                    | Placeholder notice           |
| POST   | `/guest/consent`          | Public invite           | Self only                    |
| GET    | `/guest/consent/notice`   | Public                  | Placeholder notice           |
| POST   | `/guest/recording-status` | Public invite           | `{ status }` only            |
| POST   | `/livekit/webhook`        | Public + SDK auth       | egress/track events          |

Recording destination: dedicated `VIDEO_MEETINGS_RECORDING_S3_*` or fallback to existing `R2_*`.

## Checks run in S05

| Check                                                                                       | Result                                                                                                                                             |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prettier on touched TS/JSON/YAML/MD                                                         | **PASS**                                                                                                                                           |
| ESLint `apps/api/src/modules/video-meetings/**`                                             | **PASS** (0 errors)                                                                                                                                |
| ESLint web video-meetings feature + API client                                              | **PASS**                                                                                                                                           |
| Vitest `apps/api/src/modules/video-meetings` (47) from monorepo root                        | **PASS**                                                                                                                                           |
| Vitest `apps/web/src/features/video-meetings` (2)                                           | **PASS**                                                                                                                                           |
| `pnpm --filter @nbos/api typecheck`                                                         | **PASS**                                                                                                                                           |
| `pnpm --filter @nbos/web typecheck`                                                         | **PASS**                                                                                                                                           |
| `prisma migrate deploy` (additive object_key) on disposable/dev                             | **PASS**                                                                                                                                           |
| Live recording proof: composite MP4 + ≥2 distinct participant audio objects in R2/MinIO     | **NOT RUN** — blocker: `LIVEKIT_*` unset in `.env.local`, LiveKit Egress profile not running, API/web not up for a two-participant capture session |
| Browser: guest no sidebar; list honest empty/error; recording control live when flag+API on | **NOT RUN** — no listener on `:3000` / `:4000` in executor session                                                                                 |
| Production migrate / push / origin merge                                                    | **NOT RUN** (forbidden)                                                                                                                            |

## Handoff to S06

**S06 can start** on this branch without pulling origin.

S06 must:

- Drive `FileArtifactOperation` prepare → verify → COMPLETE for recording assets
- Write `FileAsset` / version / link with purpose `MEETING_RECORDING`
- Playback ACL + UI; keep honest PARTIAL/FAILED
- Do not broaden ACL via entity links alone

Still open (block production enablement later):

- Legal notice / retention wording
- Default RBAC role matrix beyond Owner/CEO
- Capacity numbers on real hardware
- Optional new `FileArtifactOperationSourceEnum` vs SYSTEM actor

## Files created / touched (S05)

```text
packages/database/prisma/schema/video-meetings.prisma  (+objectKey)
packages/database/prisma/migrations/20260926190000_video_meetings_recording_object_key/
apps/api/src/modules/video-meetings/video-meetings-recording*.ts
apps/api/src/modules/video-meetings/video-meetings-consent.service.ts
apps/api/src/modules/video-meetings/video-meetings-egress*.ts
apps/api/src/modules/video-meetings/video-meetings-access-query.ts
apps/web/src/features/video-meetings/VideoMeetingRecordingIndicator.tsx
apps/web/src/features/video-meetings/VideoMeetingConsentActions.tsx
apps/web/... guest/room/detail + messages + lib/api/video-meetings.ts
.env.example
docker/livekit/livekit.yaml (optional webhook comment)
docs/implementation/video-meetings-v1/03-PHASES-AND-SLICES.md
docs/implementation/video-meetings-v1/06-PROGRESS-AND-HANDOFF.md
```

## Prior slices

S01–S04 summaries remain valid; S04 recording controls are now wired to S05 APIs.
