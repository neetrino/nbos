# Video Meetings — architecture and integrations

**Status:** approved architecture target; code and deployments NOT STARTED.

## Selected implementation

Self-hosted **LiveKit Server** for rooms; ready-made **LiveKit React Components** adapted to NBOS; independently deployed **LiveKit Egress** for recording; **private Cloudflare R2 via existing Drive** for files. NBOS Next.js renders UI; NestJS owns business logic/tokens/recording orchestration; PostgreSQL owns metadata.

```text
Employee / guest browser
  │                          ┌── media / WebRTC ── LiveKit Server
  ├── NBOS Web UI ────────────┘                             │
  └── NBOS API: Video Meetings                         LiveKit Egress
           ├── PostgreSQL: meetings/consents/recordings     │
           ├── token, host access and webhook validation   ▼
           ├── recording job reconciliation             private R2
           └── existing Drive durable artifact finalization
                      └── FileAsset/FileVersion/FileLink → private playback
```

Media must **not** pass through ordinary NBOS API HTTP handlers. Treat media Redis/TURN and Egress capacity as separate operational concerns; don't assume existing Upstash/BullMQ queues satisfy LiveKit requirements.

## Proposed domain entities (schema contract to reconcile before coding)

| Concept | Purpose |
| --- | --- |
| `VideoMeeting` | Logical identity, title, host/owner, lifecycle, optional schedule and optional external business links |
| `VideoMeetingSession` | Actual room run, start/end, LiveKit room reference; one logical meeting may have several sessions |
| `VideoMeetingParticipant` | Stable opaque session identity, employee **or unverified guest**, join/leave, track timeline |
| `VideoMeetingInvite` | Single-room, expiring/revocable guest invitation; store token **digest**, never plaintext |
| `VideoMeetingConsent` | Notice version and affirmative consent/revocation by participant/session |
| `VideoMeetingRecording` | Recording group, composite job, start/stop and reconciliation/status |
| `VideoMeetingRecordingAsset` | Individual video/audio output, participant/track/time range, Egress id, Drive FileAsset id and independent status |
| `VideoMeetingEntityLink` | Optional validated references to Deal/Project/Product/Contact, editable **after** the meeting |
| `CalendarMeeting` | Existing scheduling record only where the user explicitly enables Calendar integration |

Avoid representing session reconnect as a different person. A guest's display name is not a stable track key; backend mints opaque identities and persists participant/track mappings. Never infer verified Contact association just because a guest typed their name.

**Source of truth:** Video Meetings owns room status; Calendar owns schedule for explicitly linked Calendar events; Drive owns files; linked modules own business objects. Avoid reciprocal automatic updates/duplicate calendar events.

## Reliable recording pipeline

1. Host requests record. Backend checks rights, available recording capacity, displayed notice and **affirmative consent by every participant who would be recorded**.
2. Persist deterministic recording id, expected outputs and intended object keys before requesting Egress. Start/stop and webhooks are idempotent.
3. Use a **watchable room-composite video** and **separate audio recording per LiveKit participant**, retaining exact identity, track, timestamps, mute/unpublish gaps and reconnect segments. At implementation pin compatible LiveKit/SDK/Egress versions and use supported current API (not a blindly copied deprecated request).
4. Egress uploads privately to R2 S3-compatible endpoint (path-style enabled). Scope service credentials, never expose in browser.
5. Signed webhooks and background reconciliation drive independent output statuses; an `egress_ended` event alone **does not** prove every requested track was uploaded. Validate actual objects.
6. Adapt **existing Drive `FileArtifactOperation`** (prepare key → external upload → HeadObject/size/type verify → transactional `FileAsset + FileVersion + FileLink + operation COMPLETE`). Inspect existing trusted machine-producer contract first; **never** bypass Drive with ad hoc metadata writes. Orphan cleanup remains conservative.
7. Store separate states for meeting, actual session, composite and each participant-audio artifact. `READY` means verified; `PARTIAL` is visible when some tracks fail.
8. Playback checks current **Video Meetings authorization and Drive authorization**, streams private media and audits access. Multiple entity links must not silently broaden recording access.

## Operational integration

- Dedicated module RBAC, guest prejoin/admission, short-lived single-room media tokens and invite revocation.
- New module feature flags; no media-side outage may break existing CRM, Calendar, Drive, Finance or Tasks.
- Scheduled calendar meetings keep existing Scheduler/Notifications route; standalone VideoMeeting without Calendar still works.
- AI integration is deferred to V2, not a V1 hard dependency.

## Vendor documentation (verify against pinned release)

- https://docs.livekit.io/transport/self-hosting/deployment/
- https://docs.livekit.io/transport/media/ingress-egress/egress/
- https://docs.livekit.io/reference/other/egress/api/
- https://docs.livekit.io/transport/media/ingress-egress/egress/outputs/
- NBOS Drive: [durable generated file lifecycle](../11-Drive/04-Upload-Versioning-and-Lifecycle.md).
