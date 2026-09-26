# Module 22 — Video Meetings

**Status:** APPROVED CANON; NOT IMPLEMENTED.  
**Scope:** V1 first (working meetings + recording); V2 later (AI).  
**Owner:** standalone Video Meetings module, not Calendar or Calls.

## Why it exists

An employee can immediately hold a customer video meeting, invite an external guest, record it and review the result in NBOS. The meeting can start **without any Deal, Project, Product, Contact or Calendar event**, and an authorized user can add/change business links after the meeting.

Calendar remains an **optional** planning/reminder integration. CRM Calls/ATS telephony remains unrelated.

## Release boundaries

| V1 — required to launch | V2 — separate rollout |
| --- | --- |
| Own sidebar section, instant creation, room and history | Speech-to-text of the meeting |
| Optional create-from Deal/Project/Product/Contact | Speaker-attributed transcript with timestamps |
| Guest invitation without NBOS registration; host admission | AI summary, decisions, unresolved issues |
| Camera, microphone, screen sharing and participant controls | Suggested follow-up Tasks requiring employee approval |
| **Manual consented recording:** composite video **and per-participant audio** | Permission-filtered search/context across recordings |
| Private R2 storage via Drive and integrated player | Human corrections and governance |
| Post-meeting linking; optional Calendar scheduling | |

Per-participant audio and the participant/track identity timeline are **V1 requirements**, even though automatic transcription is postponed. A claimed guest name is **not** proof of real-world identity; recordings cannot resolve two people talking into one microphone.

## Ownership across NBOS

- **Video Meetings:** meeting/session/room, guest invitations, participants, consent, recording jobs, media/participant mapping and entity links.
- **Drive:** durable file operations, private Cloudflare R2, `FileAsset`, `FileVersion`, `FileLink`, storage retention and playback infrastructure. Reuse existing `MEETING_RECORDING` purpose.
- **Calendar:** optional, explicit schedule association only. Existing `CalendarMeeting` records keep calendar-specific scheduling/conflicts/reminders.
- **CRM/Projects/Clients:** authoritative business objects, unchanged ownership/permissions.
- **Notifications:** only existing schedule reminders when the meeting is calendar-linked.
- **AI Platform:** governed processing for V2 only; V1 cannot depend on unfinished AI runtime.

## Primary use cases

1. **Instant:** Video Meetings → New → invite → admit → meet → consent → record → end → watch.
2. **Contextual:** create a meeting from an authorized Deal, Product, Project or Contact.
3. **Afterwards:** attach an initially unlinked, **completed** meeting to authorized business records, without copying recording files.
4. **Optional planned meeting:** schedule in Video Meetings and opt into Calendar, or create a linked conference from an existing CalendarMeeting.

## Guardrails

V1 is a usable final conferencing/recording product, **not** an AI demo. No mandatory calendar entry, public video recording URL, SIP/ATS integration, automatic AI decisions, paid meeting-provider subscription or promise of zero infrastructure cost. Future internal quick calls may reuse the engine but are not required for V1.

Read: [Architecture](01-Architecture-and-Integrations.md) · [V1](02-V1-Core-Meetings.md) · [V2](03-V2-AI-Meeting-Intelligence.md) · [Security](04-Access-Consent-and-Recording-Policy.md) · [UI](05-UI-and-Workflows.md) · [Operations](06-Technical-Validation-and-Operations.md) · [Register](99-Video-Meetings-Cleanup-Register.md).
