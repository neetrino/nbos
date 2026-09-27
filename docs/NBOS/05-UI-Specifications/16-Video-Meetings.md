# Video Meetings — top-level UI specification

**Status:** approved V1 direction; NOT IMPLEMENTED. Canon: [Module 22](../02-Modules/22-Video-Meetings/00-Video-Meetings-Overview.md).

New top-level **Video Meetings** (separate from Calls and Calendar) is a list of durable rooms: explicit new room, start again on an existing room, revocable invites, live room, and a room sheet whose thread holds persisted chat plus a restricted player card for each recording. Optional links to an accessible Deal/Project/Product/Contact reopen the latest linked room instead of creating another by default. Contract: [Durable room and thread](../02-Modules/22-Video-Meetings/07-Durable-Room-and-Thread.md).

Calendar is optional. Only explicitly calendar-linked scheduled meetings appear in the existing Calendar meetings layer and use existing reminders; free-standing video rooms must work without Calendar. The guest gets a meeting-only join/preflight/admission page with no NBOS menu. UI must show consent/active recording to everyone, and independent room vs recording/partial-output state.

V1 must capture composite video **and separate participant audio** for future AI, but transcript, summary and task proposal UI are **V2 only**.

Detailed UX: [Module 22 UI](../02-Modules/22-Video-Meetings/05-UI-and-Workflows.md); permissions: [consent/access](../02-Modules/22-Video-Meetings/04-Access-Consent-and-Recording-Policy.md).
