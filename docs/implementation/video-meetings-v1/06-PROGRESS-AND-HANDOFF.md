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
| S06 commit            | _(prior)_ — feat(video-meetings): finalize recordings through Drive artifact operations                     |
| S07 commit            | _(this commit)_ — feat(video-meetings): add optional calendar link and acceptance record                    |
| Push                  | **Not pushed** (origin diverged; remote deleted `todo.md`)                                                  |
| `todo.md` / `TODO.md` | Left **unstaged**; do not commit                                                                            |

## Slice status

| Slice | Status               | Notes                                                                                              |
| ----- | -------------------- | -------------------------------------------------------------------------------------------------- |
| S00   | **DONE** (docs only) | Gap analysis, ADRs, pins, recording feasibility, plan. LiveKit local: **NOT RUN** in S00           |
| S01   | **DONE**             | Prisma entities, VIDEO_MEETINGS RBAC (Owner/CEO only), feature flag default OFF, domain unit tests |
| S02   | **DONE**             | Nest metadata API behind flag; create/start/list/card/history/links; no LiveKit                    |
| S03   | **DONE**             | LiveKit compose + Nest tokens/invites/prejoin/admission/reconnect                                  |
| S04   | **DONE**             | Web list/detail/room/guest UI; LiveKit components pinned                                           |
| S05   | **DONE** (code)      | Consent + orchestrated RoomComposite + TrackEgress; live object proof **NOT RUN**                  |
| S06   | **DONE** (code)      | Drive finalize + playback ACL; live finalize **NOT RUN**                                           |
| S07   | **DONE** (code)      | Optional Calendar, cross-module actions, capacity env, honest acceptance; staging **NOT RUN**      |

## What landed in S07

### Behavior

- Optional Calendar: `calendarMeetingId` attach **or** explicit `createCalendarMeeting` via `CalendarService`. Standalone keeps `calendarMeetingId` null and never requires Calendar. Calendar create failure degrades to null (video meeting still created).
- End/cancel never cascade-cancel Calendar unless `alsoCancelCalendarMeeting: true`.
- Calendar reminders: **no runnable Scheduler→Notifications job found**; documented no-op; no second notifier invented.
- Cross-module `EntityVideoMeetingAction` on Deal, Contact, Project, Product cards (flag OFF or missing ADD/EDIT → hidden).
- Capacity: `VIDEO_MEETINGS_MAX_CONCURRENT_RECORDING_GROUPS` default **2** (dev safety valve). Over-limit recording start → honest 400; meeting stays ACTIVE.
- Feature flag remains default **OFF**.

### Schema

- None (reused nullable `calendarMeetingId` from S01).

## Acceptance A01–A12 (S07)

See `04-TEST-AND-ACCEPTANCE.md` results table. Summary:

| ID  | Result  |
| --- | ------- |
| A01 | NOT RUN |
| A02 | NOT RUN |
| A03 | PASS    |
| A04 | PASS    |
| A05 | PASS    |
| A06 | PASS    |
| A07 | NOT RUN |
| A08 | NOT RUN |
| A09 | PASS    |
| A10 | PASS    |
| A11 | PASS    |
| A12 | PASS    |

## Checks run in S07

| Check                                                          | Result                                              |
| -------------------------------------------------------------- | --------------------------------------------------- |
| Prettier on touched TS/JSON/MD                                 | **PASS**                                            |
| ESLint video-meetings + touched card/header files              | **PASS**                                            |
| Vitest `apps/api/src/modules/video-meetings` (70)              | **PASS**                                            |
| Vitest web video-meetings feature + entity action (9)          | **PASS**                                            |
| `pnpm --filter @nbos/api typecheck`                            | **PASS** (`NODE_OPTIONS=--max-old-space-size=8192`) |
| `pnpm --filter @nbos/web typecheck`                            | **PASS**                                            |
| Two-browser media / live MP4 / live Drive finalize / load/TURN | **NOT RUN**                                         |
| Production migrate / push / origin merge / PR                  | **NOT RUN** (forbidden)                             |

## Gate statuses (end of S07)

- **CODE COMPLETE** — V1 product code for S00–S07 is present. Remaining gaps are live proofs only (two-browser converse, real composite+audio objects, live Drive finalize, browser click-through, measured load, TURN). No missing V1 code slice known.
- **STAGING VERIFIED** — **no**. Staging media host not exercised in this session.
- **PRODUCTION BLOCKED** — owners from runbook: Hetzner/DNS/TURN, secrets store, legal notice, RBAC matrix beyond Owner/CEO, measured load/capacity, feature-flag enablement change control.

## Files created / touched (S07)

```text
apps/api/.../video-meetings-calendar-link.service.ts
apps/api/.../video-meetings-calendar-reminders.ts
apps/api/.../video-meetings-recording-capacity.ts
apps/api/.../video-meetings-includes.ts
apps/api/.../video-meetings-s07.service.test.ts
apps/api/.../video-meetings-s07-capacity-isolation.test.ts
apps/api/.../dto, service, module, controller, recording service/constants
apps/web/.../EntityVideoMeetingAction.tsx + gate + test
apps/web/.../DealSheetQuickActions, ContactSheetHeaderActions, ProductDetailHeader, use-project-detail-header
apps/web messages EN/RU/HY + .env.example
docs/implementation/video-meetings-v1/03–06
docs/NBOS/.../99-Video-Meetings-Cleanup-Register.md
```

## Prior slices

S01–S06 summaries remain valid.
