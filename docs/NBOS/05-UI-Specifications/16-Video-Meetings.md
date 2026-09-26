# Video Meetings — top-level UI specification

**Status:** approved V1 direction; NOT IMPLEMENTED. Canon: [Module 22](../02-Modules/22-Video-Meetings/00-Video-Meetings-Overview.md).

New top-level **Video Meetings** (separate from Calls and Calendar) contains instant/unlinked creation, active/upcoming/history, meeting detail, revocable invites, room, manual recording status, restricted replay, and optional post-meeting links to accessible Deal/Project/Product/Contact.

Calendar is optional. Only explicitly calendar-linked scheduled meetings appear in the existing Calendar meetings layer and use existing reminders; free-standing video rooms must work without Calendar. The guest gets a meeting-only join/preflight/admission page with no NBOS menu. UI must show consent/active recording to everyone, and independent room vs recording/partial-output state.

V1 must capture composite video **and separate participant audio** for future AI, but transcript, summary and task proposal UI are **V2 only**.

Detailed UX: [Module 22 UI](../02-Modules/22-Video-Meetings/05-UI-and-Workflows.md); permissions: [consent/access](../02-Modules/22-Video-Meetings/04-Access-Consent-and-Recording-Policy.md).
