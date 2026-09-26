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
| S05 commit            | `7e15d481c` — feat(video-meetings): add consented composite and per-participant recording                   |
| S06 commit            | _(this commit)_ — feat(video-meetings): finalize recordings through Drive artifact operations               |
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
| S06   | **DONE** (code)      | Drive finalize + playback ACL; live R2 HeadObject probe **PASS**; live finalize **NOT RUN**        |
| S07   | TODO                 | V1 gate — **can start** after this commit                                                          |

## What landed in S06

### Behavior

- On egress webhook / stop / reconcile: HeadObject via Drive storage adapter → require non-zero size → `FileArtifactOperation` **prepare → finalizeAfterObjectPresent**.
- Drive producer: `source: SYSTEM`, `ingress: MACHINE_PUT`, actorId `video-meetings-recording-system`, `sourceModule: VIDEO_MEETINGS`, `idempotencyKey = recording asset id`. No new `FileArtifactOperationSourceEnum` value (`systemArtifactAuth` scopes the producer).
- Purpose: `FileAsset.purpose` / operation `purpose` = `MEETING_RECORDING`. FileLink uses `entityType=VIDEO_MEETING` + meeting id (no second purpose taxonomy invented).
- `fileAssetId` written on `VideoMeetingRecordingAsset` only after Drive **COMPLETED**. Asset **READY** only then. Group **READY** only when every asset is READY; **PARTIAL** when some READY and some FAILED/MISSING; meeting ENDED never implies READY.
- Missing webhook: `VideoMeetingsRecordingReconcileService` retries PENDING assets (60s interval when feature flag on); idempotent.
- Playback: `GET /:id/recording/playback` — short-lived Drive-signed URL for **composite only**. Requires VIDEO_MEETINGS VIEW **and** host/owner/participant. Entity link alone → 403. Guests never get playback URLs. Flag off → 404.
- Missing Drive R2: finalize returns retryable PENDING (API still boots). No FileAsset / FileVersion / FileLink inserts outside the Drive finalizer.

### Schema

- **None** for S06 (reused existing `fileAssetId`, `MEETING_RECORDING` purpose, `sourceModule` column).

### Endpoints added (flag OFF → 404)

| Method | Path                      | Who                           | Notes                          |
| ------ | ------------------------- | ----------------------------- | ------------------------------ |
| GET    | `/:id/recording/playback` | VIEW + host/owner/participant | Composite signed URL; 300s TTL |

## Checks run in S06

| Check                                                               | Result                                                                                           |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Prettier on touched TS/JSON/MD                                      | **PASS**                                                                                         |
| ESLint `apps/api/src/modules/video-meetings/**` + `drive.module.ts` | **PASS**                                                                                         |
| ESLint web video-meetings feature + API client                      | **PASS**                                                                                         |
| Vitest `apps/api/src/modules/video-meetings` (55)                   | **PASS**                                                                                         |
| Vitest web video-meetings + i18n catalog parity (6)                 | **PASS**                                                                                         |
| `pnpm --filter @nbos/web typecheck`                                 | **PASS**                                                                                         |
| `pnpm --filter @nbos/api typecheck`                                 | **PASS** (`NODE_OPTIONS=--max-old-space-size=8192`; default heap OOM'd once in this environment) |
| Live R2 HeadObject against disposable probe key                     | **PASS** (authenticated; object not found — expected)                                            |
| Live R2 Drive finalize of a real egress object                      | **NOT RUN** — no verified egress object in bucket                                                |
| Production migrate / push / origin merge                            | **NOT RUN** (forbidden)                                                                          |

## Handoff to S07

**S07 can start** on this branch without pulling origin.

S07 must:

- Optional CalendarMeeting link + reminder path only when linked
- Cross-module “start video meeting” actions
- E2E / security / reliability notes; rollback
- Update IMPLEMENTATION_PROGRESS when verified
- Feature flag still default off for production until explicit owner enable

Still open (block production enablement later):

- Legal notice / retention wording
- Default RBAC role matrix beyond Owner/CEO
- Capacity numbers on real hardware
- Live composite+audio egress proof into R2 then Drive finalize

## Files created / touched (S06)

```text
apps/api/src/modules/video-meetings/video-meetings-recording-finalize.service.ts
apps/api/src/modules/video-meetings/video-meetings-recording-finalize.service.test.ts
apps/api/src/modules/video-meetings/video-meetings-recording-reconcile.service.ts
apps/api/src/modules/video-meetings/video-meetings-recording-playback.service.ts
apps/api/src/modules/video-meetings/video-meetings-recording-lifecycle.service.ts
apps/api/src/modules/video-meetings/video-meetings-recording-status.ts
apps/api/src/modules/video-meetings/video-meetings-recording.constants.ts
apps/api/src/modules/video-meetings/video-meetings.module.ts
apps/api/src/modules/video-meetings/video-meetings.controller.ts
apps/api/src/modules/drive/drive.module.ts  (+export DriveArtifactStorageAdapter)
apps/web/src/features/video-meetings/VideoMeetingRecordingPlayback.tsx
apps/web/... detail + messages EN/RU/HY + lib/api/video-meetings.ts
docs/implementation/video-meetings-v1/03-PHASES-AND-SLICES.md
docs/implementation/video-meetings-v1/06-PROGRESS-AND-HANDOFF.md
```

## Prior slices

S01–S05 summaries remain valid; S05 HeadObject-only READY is superseded by Drive COMPLETED in S06.
