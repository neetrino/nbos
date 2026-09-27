# Video Meetings — durable room and thread

**Status:** approved product behavior (2026-09-27). **Not implemented.** Conferencing V1 still ends the room (`ENDED` rejects a new start) and keeps chat only inside the live LiveKit session. This file is the contract for the next implementation. It does not add a company messenger or V2 AI.

## What a room is

`VideoMeeting` is a long-lived room for one ongoing conversation (one client, one deal, or one topic). `VideoMeetingSession` is a single run of that room. Ending a call ends the open session. The room, its people, its messages and its recordings stay, and the same room can be started again without a limit.

Create a new room only for a new conversation. Do not create a new room for the next call with the same people.

Each session keeps its own LiveKit room name, participants, consent and recording groups. Reconnect inside one session is still the same participant. Consent from a previous session never authorizes recording in the next one.

## Room lifecycle

| Status      | Meaning                                                    | Start another session       |
| ----------- | ---------------------------------------------------------- | --------------------------- |
| `CREATED`   | Room exists; no session has started                        | Yes                         |
| `WAITING`   | Scheduled or held before the first session                 | Yes                         |
| `ACTIVE`    | A session is open                                          | No, until that session ends |
| `IDLE`      | The last session has ended. Messages and recordings remain | Yes                         |
| `CANCELLED` | Closed on purpose before any session was held              | No                          |

Ending a call sets the room to `IDLE`, not to a terminal state. `CANCELLED` stays limited to a room that was never held (`CREATED` or `WAITING`).

`ENDED` is the previous terminal status. Implementation adds `IDLE`, backfills existing `ENDED` rows to `IDLE`, and stops writing `ENDED`. Recording state stays independent: a room may already be `IDLE` while a recording is still `FINALIZING`. `READY` still means the file was verified.

Guest invites and colleague membership belong to the room. Ending a session does not remove them. A later guest join still needs a valid invite and host admission. New people can be added later; older messages and recordings stay in the same room.

## Chat

Persist plain-text messages on the room. LiveKit chat is only the live transport. The database is the record. No file attachments in this slice.

| Field                 | Rule                                                                                               |
| --------------------- | -------------------------------------------------------------------------------------------------- |
| `VideoMeetingMessage` | Room id, optional session id, author, text, created time                                           |
| In a live session     | Admitted employees and guests may send. `sessionId` is the open session                            |
| Between sessions      | Employees who can view the room may read and send. `sessionId` is null. Guests cannot              |
| Author                | Participant id when sent in-call, plus employee id or the guest display name captured at send time |

While a guest is admitted to the live session, they see the room's message thread, including earlier sessions. They do not get recording playback, Drive, business links or any NBOS list. Outside the live session a guest has no access to the thread.

## Review thread

The room sheet is one chronological thread, newest at the bottom. It is a merge of stored messages, session rows and recording groups. Session bounds are not copied into the message table.

- A session marker shows when that run started and ended (date, duration).
- Each recording group appears once, at the time capture stopped, or at session end if the session closed while capture was still open. A second recording in the same session is a second card, in time order.
- Employees who may play the recording see the private player on that card. Status on the card follows the recording (`Recording`, `Processing`, `Ready`, `Partial`, `Failed`). Processing updates the same card in place.
- Guests do not receive a player. A non-playable note that a recording exists is enough.
- Participant-audio files stay host diagnostics. They are not a second player in the thread.
- Messages written after the session appear under that session's recording card. The next session continues below.

Opening the sheet scrolls to the latest item.

## List and business cards

The module list is rooms the caller can access: title, live / idle / not started, last activity, recording count, linked record. The primary action on a `CREATED`, `WAITING` or `IDLE` room is **Start**, which opens a new session in that room. **New room** is a separate explicit action.

Past calls are not a second list of dead meetings. Their messages and recordings are inside the room.

From an authorized Deal, Project, Product or Contact, the default action opens the latest non-cancelled room already linked to that record and visible to the actor. If none exists, create one and link it. Another room for the same record is an explicit choice, not the default.

An unlinked room can still be attached to an authorized record later. Links do not copy media and do not widen playback rights.

## Out of scope

Company-wide messenger, email of the thread, guest access after the call, public recording URLs, transcript, summary and suggested tasks.

## Acceptance

1. Two calls with the same client create one room and two sessions. Messages and both composite recordings appear in one thread, in time order.
2. After the first call the room is `IDLE` and **Start** opens another session. People already on the room are still there. A new guest can be invited into the same room.
3. A guest message sent during a call is visible to an authorized employee after the call. The guest cannot open that thread or play the recording outside the live session.
4. Starting from a Contact that already has a room opens that room. A second room appears only when the employee explicitly creates one.
5. Recording still processing after the session ends shows `Processing` on that session's card, then `Ready` or `Partial` / `Failed` on the same card. An `IDLE` room is not described as a finished recording.
