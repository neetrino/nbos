# Video Meetings — implementation and reconciliation register

**Status:** canon approved; coding NOT STARTED. Classify verified runtime by the existing NBOS `OK / PARTIAL / MISSING / STALE / BUSINESS DECISION` rubric before implementation.

## Preliminary repo-to-canon comparison

| Area                                      | Observed baseline                                             | Classification                                          |
| ----------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------- |
| Calendar scheduled client Meeting         | Existing calendar service/schema/UI                           | OK adjacent system; **not** the VideoMeeting owner      |
| Drive R2 durable generated files          | Existing `FileArtifactOperation` and Drive lifecycle          | PARTIAL: Egress async producer adapter unverified       |
| Drive `MEETING_RECORDING`                 | Existing file-purpose enum                                    | OK adjacent foundation                                  |
| CRM ATS phone recordings                  | Existing phone-call storage/playback                          | OK separate workflow; do not reuse as video call entity |
| Standalone video rooms / LiveKit / Egress | No confirmed module in inspected branch                       | MISSING                                                 |
| AI meeting summary                        | Example idea in AI future docs, not runnable AI transcription | DEFER V2                                                |

These are **preliminary** code/doc observations, not evidence of live production deployment.

## V1 vertical slices

- [ ] **S00:** recheck current branch/runtime; resolve legal/capacity/RBAC/retention and async Drive Egress interface decisions.
- [ ] **S01:** meeting/session/participants/invite/consent/recording/link schema; domain permission negative tests, standalone list/detail.
- [ ] **S02:** self-hosted LiveKit and backend tokens, admission and employee/guest room UI; resilient join/rejoin.
- [ ] **S03:** manual consented **composite + per-participant audio** recording, identity/time mapping and Egress lifecycle.
- [ ] **S04:** private R2 → durable Drive finalize/reconciliation, restricted playback/audit/retention.
- [ ] **S05:** post-meeting links to business entities and optional Calendar bridge; E2E security, consent, concurrency and outage tests.
- [ ] **V1 gate:** live guest recording verified on target infrastructure with composite and separately attributable audio; no untested production rollout.

## V2 deferred

- [ ] Separately confirm AI Platform runtime entry gate and V2 owner go/no-go.
- [ ] Approve AI processing consent/privacy and model/language/cost quality thresholds.
- [ ] Build timestamped track transcript, human-reviewed summary and authorized Task proposals.
- [ ] Pass access isolation, corrections, source deletion propagation and hallucination/attribution negative tests.

When code starts, update `docs/IMPLEMENTATION_PROGRESS.md`; after independent verification update actual implemented canon and move closed slices to completion evidence. Documentation approval is **not** implementation completion.
