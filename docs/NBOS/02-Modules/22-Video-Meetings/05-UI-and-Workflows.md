# Video Meetings — V1 UI and journeys

**Status:** approved V1 UI direction, not implemented. Reuse existing NBOS Tailwind/shadcn, module shell, responsive and i18n conventions.

## Dedicated navigation

```text
Sidebar → Video Meetings
           ├─ Active / Upcoming / History
           ├─ New meeting (instant; optional entity)
           ├─ Meeting detail / session timeline / recording history
           └─ Room (employee or scoped external guest page)
```

Top-level **Video Meetings** is separate from Calendar and Calls. An Upcoming video meeting can be planned here without Calendar; Calendar entry appears only when explicitly requested. Don't create duplicate reminder pipelines.

## Three primary workflows

**Instant / unlinked:** Create → share short-lived invite → prejoin check → host admits → conference → optional manual consented recording → end → private replay → optional post-call business link.

**Contextual:** Create from authorized Deal, Project, Product or Contact → prefill valid link → same room and history → link may be edited later if new target access is validated.

**Planned:** Employee may set upcoming time, optionally create/link existing CalendarMeeting for Calendar conflict check/reminder. Calendar cancellation and ending an active room are **separate actions**; offer explicit confirmation rather than hidden cross-module cascades.

## Required screens

| Surface            | Must show                                                                                                                              |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| List               | New/Join, accessible meetings only, active/upcoming/history, date/status/entity filters and honest empty states                        |
| Meeting detail     | Title/host/time, invite revoke, session history, participants, optional entity links, recording status, restricted player              |
| Room               | Mic/camera/screen share, responsive tiles, participant moderation, explicit record start/stop and **visible notice for everyone**      |
| External guest     | Meeting-only branded join with display name, device preview, recording disclosure/consent and waiting-room status; **no NBOS sidebar** |
| Source-card action | Lightweight Start/Link video meeting on permitted business cards; no independent per-module conference system                          |

Show recording state separately from meeting completion (`Recording`, `Processing`, `Ready`, `Partial`, `Failed`), clearly signal absent audio tracks and provide support diagnostics to authorized hosts. Individual raw audio is V2-ready secure media, not public download.

No V1 transcript, AI action button promising a live model, forced calendar sync or email integration requirement. Details: [V1](02-V1-Core-Meetings.md), [security](04-Access-Consent-and-Recording-Policy.md).
