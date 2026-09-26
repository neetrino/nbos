# 05 — Deployment and runbook

**S03 status:** local LiveKit compose + Nest token/invite wiring landed. Production deploy still unauthorized.

## Local / dev LiveKit stack (S03)

Pins (ADR-VM-001): `livekit/livekit-server:v1.13.7`, dedicated Redis, optional `livekit/egress:v1.14.1` (profile, off by default).

### Start / stop

```bash
# From repo root — LiveKit Server + dedicated Redis only (Egress NOT started)
docker compose -f docker-compose.livekit.yml up -d

# Confirm server listens (HTTP API on 7880)
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:7880/

# Stop
docker compose -f docker-compose.livekit.yml down

# Optional Egress stub only (recording orchestration is S05 — do not enable for S03 proof)
docker compose -f docker-compose.livekit.yml --profile egress up -d
```

Compose file: `docker-compose.livekit.yml`  
Config: `docker/livekit/livekit.yaml` (INSECURE local-dev keys `devkey` / `secret_local_dev_only_not_for_prod_use` — never production)

Dedicated Redis publishes on host port **6380** → container 6379. Do **not** point this at Upstash/BullMQ app Redis.

### API env (`.env.local` — never commit secrets)

```bash
VIDEO_MEETINGS_V1_ENABLED=true
LIVEKIT_URL=http://127.0.0.1:7880
LIVEKIT_PUBLIC_URL=ws://127.0.0.1:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret_local_dev_only_not_for_prod_use
```

Commented placeholders also live in repo-root `.env.example`.

### Isolation checklist

- Feature flag default **off** (`VIDEO_MEETINGS_V1_ENABLED` unset/false → 404 on employee + guest video routes).
- Missing LiveKit env with flag on → **503** on token/room ensure calls; Nest still boots other modules (lazy LiveKit client).
- Separate Redis for LiveKit+Egress from Nest/BullMQ Redis.
- Web (S04): `NEXT_PUBLIC_LIVEKIT_URL` (wss/ws) only; tokens from Nest.

### Staging / production gates (owner list)

| Gate                                                                                           | Owner              | Why it blocks                                                         |
| ---------------------------------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------- |
| Hetzner (or equiv.) media hosts sized for concurrent rooms + composite Chrome + N track egress | Ops / platform     | WebRTC + Egress CPU; Cloudflare/Vercel HTTP proxy alone is incomplete |
| Public DNS + trusted TLS for LiveKit and TURN domains                                          | Ops                | SDKs require CA-signed certs; self-signed fails                       |
| UDP/TCP ICE port ranges + TURN/TLS fallback                                                    | Ops                | Corporate firewalls                                                   |
| LiveKit + Egress secrets in secret store (not git)                                             | Ops / security     | Key leak = room takeover                                              |
| Private R2 bucket, path-style, scoped credentials for Egress upload                            | Ops / Drive owner  | Public URLs forbidden                                                 |
| Legal: consent notice text, retention/deletion, jurisdictional basis                           | Legal + product    | Canon forbids inventing binding wording                               |
| Default RBAC matrix approval                                                                   | Product + security | Wrong defaults over-expose recordings                                 |
| Measured concurrency / quality thresholds                                                      | Ops + eng          | Avoid optimistic static numbers                                       |
| Feature-flag enablement change control + audit                                                 | Eng + owner        | Premature guest links                                                 |
| Load / cost sample on target hardware                                                          | Ops                | Egress is not free                                                    |
| Rollback plan (flag off, drain rooms, stop egress)                                             | Eng + ops          | Safe disable without DB wipe                                          |
| Security review of guest tokens, webhooks, Drive finalize                                      | Security           | External guest attack surface                                         |

### Rollback (actual flag-off path)

1. Set `VIDEO_MEETINGS_V1_ENABLED=false` (and `NEXT_PUBLIC_VIDEO_MEETINGS_V1_ENABLED=false` on web). Employee + guest video HTTP routes return **404** via `VideoMeetingsFeatureGuard`; nav item is hidden. No DB wipe required.
2. Stop admitting new rooms; revoke open invites (`POST .../invites/:id/revoke`) for any still-active meetings if needed.
3. Stop Egress workers accepting new jobs (compose profile / host process). In-flight recordings may finish FINALIZING/PARTIAL/FAILED honestly — do not force READY.
4. Leave historical Drive `MEETING_RECORDING` assets; follow approved retention (legal).
5. Do **not** hard-delete production media without policy.
6. Calendar cancel is **not** implied by flag-off or by video end/cancel — only the explicit `alsoCancelCalendarMeeting: true` confirm on end/cancel touches CalendarMeeting.

### Capacity note

`VIDEO_MEETINGS_MAX_CONCURRENT_RECORDING_GROUPS` (default **2**) is a **dev safety valve**. It is not a measured Hetzner or production concurrency budget. Over-limit recording start returns an honest 400 and leaves the meeting ACTIVE.

### Calendar reminders

Canon: CalendarMeeting reminders are owned by Scheduler → Notifications when linked. As of S07, **no runnable calendar reminder job exists** in this repo. Video Meetings does not invent a second notifier; linking alone does not enqueue notifications.

### Media resilience (A08 — documented, not live-proven)

- Local compose exposes LiveKit HTTP/WS on `127.0.0.1:7880` without production TURN.
- Staging/production require public DNS, trusted TLS, ICE UDP/TCP ranges, and TURN/TLS fallback (owner gates above).
- Poor-network and mobile browser proof remain **NOT RUN** until staging media host exists.

References:

- https://docs.livekit.io/transport/self-hosting/deployment/
- https://docs.livekit.io/transport/self-hosting/egress/
- https://docs.livekit.io/transport/media/ingress-egress/egress/outputs/
