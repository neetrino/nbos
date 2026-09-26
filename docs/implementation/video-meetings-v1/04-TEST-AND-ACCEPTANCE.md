# 04 — Test and acceptance (V1)

Derived from Module 22 operations canon and V1 product requirements. Execute in S03–S07 as noted. **None of these are claimed PASS by S00.**

## Acceptance scenarios

| ID  | Scenario                          | Pass condition                                                                                                           | Primary slice |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------- |
| A01 | Instant unlinked meeting + guest  | Employee creates meeting without Calendar/Deal; guest joins via invite; both converse                                    | S03–S04       |
| A02 | Composite + per-participant audio | After consent, stop yields watchable MP4 **and** distinct audio files mapped to opaque participant ids                   | S05–S06       |
| A03 | Post-meeting link                 | Attach completed meeting to permitted Project; single asset set; no ACL widen by link alone                              | S02, S06–S07  |
| A04 | Optional Calendar                 | Linked CalendarMeeting uses existing reminder/conflict rules; standalone still works if Calendar fails                   | S07           |
| A05 | Security negatives                | Forged/expired invite, wrong-room token, non-host record, guessed asset id, webhook replay, unauthorized playback denied | S03, S05–S07  |
| A06 | Consent                           | Decline, late join, withdrawal, mute, reconnect → no covert capture; unknown consent blocks start                        | S05           |
| A07 | Recovery                          | Egress fail, duplicate/out-of-order webhook, partial R2, crashed finalize → truthful PARTIAL/FAILED + reconcile          | S06           |
| A08 | Media resilience                  | Preflight, mobile browser, screen share, poor network, TURN path documented                                              | S03–S04, S07  |
| A09 | Capacity                          | Documented concurrency budget; over-limit recording rejected without lying about meeting success                         | S05, S07      |
| A10 | Audit                             | Correlated meeting/session/recording/Drive operation ids; secrets not in logs                                            | S06–S07       |
| A11 | Isolation                         | LiveKit/Egress down → other modules healthy; Video Meetings shows honest unavailable                                     | S03, S07      |
| A12 | ATS separation                    | Video meeting does not create/alter `AtsCallEvent` / CALLS journal rows                                                  | S02, S07      |

## Non-goals in V1 tests

- Transcription, AI summary, task proposals (V2).
- Diarizing two speakers on one mic.
- Proving guest display name equals a Contact.

## Environments

| Env        | Expectation                                                                    |
| ---------- | ------------------------------------------------------------------------------ |
| Local      | S03+ developer compose; disposable DB                                          |
| Staging    | Real DNS/TLS/TURN/R2; load sample; legal notice draft may still be watermarked |
| Production | Blocked until gates in `05-DEPLOYMENT-AND-RUNBOOK.md`                          |

## Definition of V1 release gate

All A01–A12 pass on staging (or designated non-prod media host), feature flag enablement approved, legal/RBAC/capacity DECISIONs closed. Documentation approval alone is not DONE.
