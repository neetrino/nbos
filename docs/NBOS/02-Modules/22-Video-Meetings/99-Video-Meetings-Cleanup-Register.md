# Video Meetings — implementation and reconciliation register

**Status:** V1 code complete on `feature/video-meetings-v1` (S00–S07); **not** staging-verified; **not** production-ready. Feature flag default **OFF**.

Executable plan: [`docs/implementation/video-meetings-v1/`](../../../implementation/video-meetings-v1/) (authoritative S00–S07). This register maps product outline ↔ code state. Classifications below are code/doc observations unless marked with a live proof command.

## Repo-to-canon comparison (post-S07)

| Area                                      | Observed                                                                                  | Classification                                                           |
| ----------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Calendar scheduled client Meeting         | `CalendarService` + `CalendarMeeting`; optional nullable `VideoMeeting.calendarMeetingId` | OK adjacent; Video Meetings does not own schedule                        |
| Calendar → Notifications reminder job     | Canon describes Scheduler → Notifications; **no runnable calendar reminder job found**    | MISSING adjacent; Video Meetings does **not** invent a notifier (S07)    |
| Drive R2 durable generated files          | `VideoMeetingsRecordingFinalizeService` → `FileArtifactOperation`                         | PARTIAL (unit + HeadObject probe); live egress finalize **NOT RUN**      |
| Drive `MEETING_RECORDING`                 | Purpose enum + finalize path                                                              | OK                                                                       |
| CRM ATS phone recordings                  | Separate `AtsCallEvent` / CALLS; video create/start assert no writes                      | OK separate                                                              |
| Standalone video rooms / LiveKit / Egress | Nest module + compose pins; local LiveKit compose documented                              | PARTIAL: code OK; two-browser media + real composite objects **NOT RUN** |
| Cross-module card actions                 | Deal / Contact / Project / Product → `EntityVideoMeetingAction` (flag + RBAC gated)       | OK code; browser click-through **NOT RUN**                               |
| Recording concurrency cap                 | `VIDEO_MEETINGS_MAX_CONCURRENT_RECORDING_GROUPS` default **2** (dev safety valve)         | OK documented; not a measured production budget                          |
| AI meeting summary                        | Deferred V2                                                                               | DEFER V2                                                                 |

These are **not** evidence of staging or production deployment.

## V1 vertical slices (map to package S00–S07)

- [x] **S00 (docs):** gap analysis / ADR / pins — package docs. Local LiveKit **NOT RUN** in S00.
- [x] **Package S01:** schema + VIDEO_MEETINGS RBAC + flag default OFF + domain tests.
- [x] **Package S02:** Nest metadata API (create/list/card/history/links).
- [x] **Package S03:** LiveKit rooms/tokens/invites/admission (compose). Two-browser converse **NOT RUN** live.
- [x] **Package S04:** Next.js list/detail/room/guest UI.
- [x] **Package S05:** Consent + RoomComposite + TrackEgress orchestration (unit). Live MP4/audio objects **NOT RUN**.
- [x] **Package S06:** Drive finalize + playback ACL (unit). Live R2 finalize of real egress object **NOT RUN**.
- [x] **Package S07:** Optional Calendar link; reminder path documented as missing; cross-module actions; capacity env; acceptance record; runbook.
- [ ] **V1 gate (staging):** live guest recording on target infra with composite + attributable audio; measured load; legal/RBAC/flag enablement — **open**.

## V2 deferred

- [ ] Separately confirm AI Platform runtime entry gate and V2 owner go/no-go.
- [ ] Approve AI processing consent/privacy and model/language/cost quality thresholds.
- [ ] Build timestamped track transcript, human-reviewed summary and authorized Task proposals.
- [ ] Pass access isolation, corrections, source deletion propagation and hallucination/attribution negative tests.

Update `docs/IMPLEMENTATION_PROGRESS.md` when staging verification happens. Documentation approval is **not** implementation completion for production.
