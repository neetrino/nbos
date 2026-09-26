# 02 — Architecture and ADRs

**Status:** planning decisions for V1. Product code not started.  
**Stack:** NestJS API + Next.js web + Prisma/PostgreSQL + pnpm monorepo (`docs/TECH_CARD.md`). Media plane is self-hosted LiveKit Server + separate LiveKit Egress; durable files remain Drive-owned private R2.

## Target architecture (canon-aligned)

```text
Employee / guest browser
  │                          ┌── media / WebRTC ── LiveKit Server (pinned)
  ├── NBOS Web UI ────────────┘                             │
  └── NBOS API: Video Meetings                         LiveKit Egress
           ├── PostgreSQL: meetings/consents/recordings     │
           ├── token, host admission, webhook validation   ▼
           ├── recording job reconciliation             private R2
           └── Drive FileArtifactOperation finalize
                      └── FileAsset / FileVersion / FileLink → gated playback
```

Media bytes must not transit ordinary Nest HTTP handlers. Existing Upstash/BullMQ Redis is **not** assumed sufficient for LiveKit; Egress requires its own Redis shared with LiveKit Server.

---

## ADR-VM-001 — LiveKit version pin (S00)

### Context

Canon requires pinned compatible LiveKit Server, Egress, and React Components. Pins must cite official sources read on 2026-09-26, not memory.

### Decision — pin set for V1 implementation

| Component        | Pinned version                       | Image / package                  | Source URL (read 2026-09-26)                                                                                                                                                                        |
| ---------------- | ------------------------------------ | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LiveKit Server   | **v1.13.7**                          | `livekit/livekit-server:v1.13.7` | https://github.com/livekit/livekit/releases/tag/v1.13.7 · changelog https://releases.sh/livekit/livekit-server/changelog · deploy docs https://docs.livekit.io/transport/self-hosting/deployment/   |
| LiveKit Egress   | **v1.14.1**                          | `livekit/egress:v1.14.1`         | https://github.com/livekit/egress/releases/tag/v1.14.1 · self-host https://docs.livekit.io/transport/self-hosting/egress/ · overview https://docs.livekit.io/transport/media/ingress-egress/egress/ |
| Node server SDK  | **livekit-server-sdk@2.19.1**        | npm                              | https://www.npmjs.com/package/livekit-server-sdk                                                                                                                                                    |
| React Components | **@livekit/components-react@2.9.24** | npm                              | https://www.npmjs.com/package/@livekit/components-react (peer `livekit-client` ^2.20.1)                                                                                                             |
| React Styles     | **@livekit/components-styles@1.2.0** | npm                              | https://www.npmjs.com/package/@livekit/components-styles (import `@livekit/components-styles`; no `styles.css` export on components-react 2.9)                                                      |
| Client SDK       | **livekit-client@2.22.3**            | npm                              | https://www.npmjs.com/package/livekit-client                                                                                                                                                        |

### Compatibility notes

- Server **v1.13.x** includes Egress V2 API support (server changelog notes egress v2 around 1.13.2). Egress **v1.14.1** is the latest GitHub release as of audit and is the worker image to pair with this server line.
- Prefer **deprecated-compatible** source-specific APIs (`StartRoomCompositeEgress`, `StartTrackEgress`) **or** unified `StartEgress` with `TemplateSource` / `MediaSource` — both documented at https://docs.livekit.io/reference/other/egress/api/ and https://docs.livekit.io/transport/media/ingress-egress/egress/. Implementation slice S05 chooses one path and locks tests to it; do not mix blindly.
- R2 uploads: S3-compatible config with `force_path_style: true` per https://docs.livekit.io/transport/media/ingress-egress/egress/outputs/.
- Egress Docker requires `--cap-add=SYS_ADMIN` (or Chrome sandbox seccomp profile) per self-hosting egress docs (sandbox note since v1.7.6).

### Local validation

**NOT RUN** in S00. No docker pull/start of LiveKit Server or Egress was executed in this slice. S03 owns first local bring-up.

### Consequences

S03+ must use these pins (or a later consciously re-pinned set with a new ADR note). Do not float `latest` tags in compose/Helm.

---

## ADR-VM-002 — Domain ownership and isolation

### Decision

- **Video Meetings** owns logical meeting, session, opaque participant identity, invites, consent, recording jobs/assets metadata, and entity links.
- **Drive** owns bytes, `FileArtifactOperation`, `FileAsset` / `FileVersion` / `FileLink`, R2 keys, retention mechanics.
- **Calendar** owns schedule/conflicts/reminders only when an explicit link exists.
- **CALLS / AtsCallEvent** remain telephony; no shared entities with Video Meetings.
- Nest module loads behind a feature flag; LiveKit client calls are isolated so media failures return honest Video Meetings errors without crashing CRM/Drive/Finance boot paths.

### Schema direction (S01)

Proposed entities match canon `01-Architecture-and-Integrations.md`: `VideoMeeting`, `VideoMeetingSession`, `VideoMeetingParticipant`, `VideoMeetingInvite`, `VideoMeetingConsent`, `VideoMeetingRecording`, `VideoMeetingRecordingAsset`, `VideoMeetingEntityLink`, plus optional nullable Calendar link. Exact Prisma enum names are a coding decision within canon status sets.

### Drive extension (S06)

Prefer **`source: SYSTEM` + `ingress: MACHINE_PUT`** with a dedicated `actorId` / `sourceModule: 'VIDEO_MEETINGS'` and strong `idempotencyKey` (recording-asset id). Add a new `FileArtifactOperationSourceEnum` value only if SYSTEM auth ports cannot safely scope Egress producers — decide in S06 with security review; default is extend minimally, no parallel store.

---

## ADR-VM-003 — Recording feasibility (composite + per-participant audio)

### Requirement (non-negotiable)

On manual host start after affirmative consent: one **watchable room-composite MP4** and **separate audio file(s) per LiveKit participant**, with stable server-generated participant IDs, employee vs unverified guest mapping, truthful timeline for mute/unpublish/reconnect segments. Do not promise diarization of two speakers on one mic. Guest display name ≠ verified identity.

### What official docs support (read 2026-09-26)

1. **Room composite (TemplateSource / RoomComposite):** Chrome-rendered layout → MP4 via `file_outputs` — https://docs.livekit.io/transport/media/ingress-egress/egress/ · outputs https://docs.livekit.io/transport/media/ingress-egress/egress/outputs/
2. **Per-track / MediaSource:** Track egress or MediaSource can export individual tracks (pass-through audio without full Chrome cost for TrackEgress) — same overview + API reference.
3. **Simultaneous composite + tracks:** Auto egress on `CreateRoom` can configure both `egress.room` and `egress.tracks` — https://docs.livekit.io/transport/media/ingress-egress/egress/autoegress/. Multiple egress workers load-balance concurrent jobs — https://docs.livekit.io/transport/self-hosting/egress/.
4. **Dynamic tracks:** Track egress is bound to a **track id**. New publish (including after reconnect) yields a new track id; a new egress (or auto-tracks) must start. Mute/unpublish creates natural gaps.
5. **Timestamps:** EgressInfo exposes `started_at` / `ended_at`; NBOS must own a recording-relative timeline keyed by opaque participant id + track segments.

### Naive method that does **not** satisfy V1 as-is

- **AutoEgress at CreateRoom** records from room creation, which conflicts with **manual consented start/stop**, late-join consent, and consent withdrawal.
- **Single multi-channel MediaSource AudioConfig** can route participants into channels of one file — that is **not** “separate audio file per participant” unless we still emit one file per participant.
- Trusting `egress_ended` webhook alone without HeadObject/size verify — forbidden by Drive + Video Meetings canon.

### Compatible design (ADR decision)

**Orchestrated multi-egress under NBOS control (preferred V1 design):**

1. Host requests record → API checks host permission, capacity, and **known affirmative consent for every currently capturable participant**; unknown consent → reject.
2. Persist `VideoMeetingRecording` + expected `VideoMeetingRecordingAsset` rows (composite + one expected audio asset per consented participant with published audio) and intended R2 keys **before** calling Egress.
3. Start **one** RoomComposite egress → private R2 MP4 (`force_path_style`).
4. For each consented participant with an active audio track, start **TrackEgress** (or MediaSource single-track) → private R2 audio object. Map egress id ↔ asset row.
5. Subscribe to LiveKit room/webhook events while recording is active: on new audio track publish for a consented participant, start another TrackEgress segment; on unpublish/mute policy, stop that egress and close the segment with gap metadata. Reconnect with same opaque identity → new segment(s), not a new person.
6. On stop or consent withdrawal: stop all active egresses for the recording group; finalize independently; mark group `PARTIAL` if any asset fails verification.
7. Webhooks + BullMQ reconciliation: verify object bytes via Drive prepare→verify→COMPLETE; never mark `READY` without verification; idempotent on egress id / asset id.

**Verdict:** **Supported as specified** on pinned Server v1.13.7 + Egress v1.14.1 **via the orchestrated multi-egress design above**, not via AutoEgress-at-create. Local/end-to-end proof is **NOT RUN** in S00; S05 must demonstrate composite + distinct audio files with reconnect/mute/late-consent scenarios before claiming PASS.

### Explicit non-claims

- No speaker diarization inside one microphone.
- No treating guest display name as Contact identity.
- No silent automatic recording.

---

## ADR-VM-004 — Guests, tokens, and playback

- Invites: unpredictable secret, store **digest** only, expiry + revoke, rate-limit.
- LiveKit JWT: minted only after admission; grant single room; guests cannot hit NBOS business APIs.
- Playback: Video Meetings permission **and** Drive authorization; entity links never widen media ACL by themselves.

---

## ADR-VM-005 — Status separation

Keep independent state machines:

| Layer           | Examples                                                    |
| --------------- | ----------------------------------------------------------- |
| Logical meeting | CREATED → WAITING → ACTIVE → ENDED / CANCELLED              |
| Session         | room ref, start/end                                         |
| Recording job   | PENDING → RECORDING → FINALIZING → READY / PARTIAL / FAILED |
| Each asset      | independent READY / FAILED / missing                        |

Meeting ENDED does not imply recording READY.

---

## Open decisions (do not block S01 schema)

These block **staging/production enablement**, not additive schema work:

- Legal notice text, retention/deletion windows, late-join decline policy wording.
- Default RBAC role matrix values.
- Measured concurrency caps on target Hetzner hardware.
- Whether to add a dedicated `FileArtifactOperationSourceEnum` value vs SYSTEM actor scoping (S06).
