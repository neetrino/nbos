# Video Meetings V1 — product requirements

**Status:** approved for first implementation; currently NOT IMPLEMENTED.

## Definition of done

An authorized NBOS employee can conduct a real **instant unlinked** meeting with external guest(s), voluntarily start recording after confirmed notice/consent, then see (1) a playable private composite video **and** (2) independently captured audio for each identifiable participant. An authorized employee can link the completed meeting to an accessible Project/Product/Deal/Contact later. No AI or mandatory Calendar is needed.

## Required journeys

| Entry point               | V1 experience                                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Video Meetings → New room | Creates one durable room and a revocable join link. Later calls start that same room                               |
| Authorized business card  | Opens the latest linked room when one exists; creates a room only when none does                                   |
| Calendar (opt in only)    | Schedules/launches linked conference; existing conflict and reminder rules stay in Calendar                        |
| Guest link                | Browser name entry, mic/camera preflight, recording notice, host admission, no NBOS login                          |
| Meeting room              | Video/mic, screen share, participant tiles, host moderation, visible recording state                               |
| Completion                | Session ends, room stays. Thread shows that run's messages and recording card                                      |
| History/detail            | One thread per room: every session, message and recording. Change valid business links after a call; secure replay |

## Status separation

Room: `CREATED` or `WAITING` → `ACTIVE` → `IDLE`, and back to `ACTIVE` on the next start. `CANCELLED` only if no session was ever held. Each session has its own LiveKit room reference. Each recording group and individual output has its **own** state such as `PENDING`, `RECORDING`, `FINALIZING`, `READY`, `PARTIAL` or `FAILED`.

A room may be `IDLE` while storage is still processing. Failed output cannot be called `READY`. Stop/retry/reconcile must avoid duplicate files and track loss. Full rules: [Durable room and thread](07-Durable-Room-and-Thread.md).

## Required recording behavior

- Manual host start/stop and visible on-screen notice. No silent automatic capture.
- Composite video + separate participant **audio** during consented capture; join/leave, mute, audio republish and reconnect create truthful segments with explicit gaps.
- Late participant must accept the active recording notice **before** their media is recorded; revocation stops/suspends capture immediately per [security rules](04-Access-Consent-and-Recording-Policy.md).
- R2 files are private and registered through Drive as `MEETING_RECORDING`; independently verify each output and use current permission-gated player.
- Individual audio and identity metadata are preserved for later V2; transcription/diarization/model decisions are explicitly **not V1**.

## Graceful degradation

Calendar down → instant meeting still works. AI down → no impact. Egress/Drive unavailable → show recording unavailable/partial truthfully; only allow nonrecorded conferencing with explicit host acknowledgement and consent policy preserved. Reconnects, host departure and egress webhook delay cannot corrupt history.

## V1 acceptance examples

1. Two staff + one guest record both composite and **distinct audio** files, accessible only to authorized personnel.
2. Meeting created without Calendar or business link; linked to Project after end; only one recording asset set exists.
3. Existing CalendarMeeting can link to VideoMeeting without becoming universal mandatory storage.
4. A revoked/expired guest invite, unauthorized employee, replayed webhook and client-side forged recording request are rejected.
5. Late join, consent withdrawal, absent audio publication, R2 upload failure and browser disconnect produce honest status with audit/reconciliation evidence.
6. The same room is started twice. Both chats and both composite recordings are in one thread. The Contact action reopens that room instead of creating a second one. Rules: [Durable room and thread](07-Durable-Room-and-Thread.md).

See [operations/negative tests](06-Technical-Validation-and-Operations.md).
