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

### Rollback (planned)

1. Disable feature flag.
2. Stop admitting new rooms; revoke open invites.
3. Stop Egress workers accepting new jobs.
4. Leave historical Drive assets; follow approved retention (legal).
5. Do **not** hard-delete production media without policy.

References:

- https://docs.livekit.io/transport/self-hosting/deployment/
- https://docs.livekit.io/transport/self-hosting/egress/
- https://docs.livekit.io/transport/media/ingress-egress/egress/outputs/
