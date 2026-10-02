# Video Meetings — V1 UI and journeys

**Status:** approved V1 UI direction, not implemented. Reuse existing NBOS Tailwind/shadcn, module shell, responsive and i18n conventions.

## Dedicated navigation

```text
Sidebar → Video Meetings
           ├─ Rooms (live / not started / idle)
           ├─ New room (explicit; optional entity)
           ├─ Room sheet: one thread of messages, sessions and recording cards
           └─ Live room (employee or scoped external guest page)
```

Top-level **Video Meetings** is separate from Calendar and Calls. An upcoming room can be planned here without Calendar; Calendar entry appears only when explicitly requested. Don't create duplicate reminder pipelines. The list is rooms, not an archive of finished calls. Past calls stay inside the room thread. Contract: [Durable room and thread](07-Durable-Room-and-Thread.md).

## Three primary workflows

**Instant / unlinked:** Create a room → share short-lived invite → prejoin check → host admits → conference → optional manual consented recording → end the session → private thread (messages and recording card) → start the same room again.

**Contextual:** From an authorized Deal, Project, Product or Contact, open the latest linked room when one exists. Create and prefill a link only when none exists. A second room for the same record is explicit. The link may be edited later if new target access is validated.

**Planned:** Employee may set upcoming time, optionally create/link existing CalendarMeeting for Calendar conflict check/reminder. Calendar cancellation and ending an active room are **separate actions**; offer explicit confirmation rather than hidden cross-module cascades.

## Required screens

| Surface            | Must show                                                                                                                                           |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| List               | New room, Start on an existing room, accessible rooms only, live/upcoming/idle, last activity, recording count, entity filters, honest empty states |
| Room sheet         | Title/host, invite revoke, people who stay on the room, optional entity links, one thread: messages, session markers, restricted recording cards    |
| Room               | Mic/camera/screen share, responsive tiles, participant moderation, explicit record start/stop and **visible notice for everyone**                   |
| External guest     | Meeting-only branded join with display name, device preview, recording disclosure/consent and waiting-room status; **no NBOS sidebar**              |
| Source-card action | Opens the latest linked room, or creates one when none exists. No independent per-module conference system                                          |

Show recording state separately from the room being idle (`Recording`, `Processing`, `Ready`, `Partial`, `Failed`), on the session's card inside the thread. Clearly signal absent audio tracks and provide support diagnostics to authorized hosts. Individual raw audio is V2-ready secure media, not a second player in the thread and not a public download.

No V1 transcript, AI action button promising a live model, forced calendar sync or email integration requirement. Details: [V1](02-V1-Core-Meetings.md), [security](04-Access-Consent-and-Recording-Policy.md).
