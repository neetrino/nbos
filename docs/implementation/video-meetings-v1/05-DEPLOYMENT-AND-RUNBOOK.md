# 05 — Deployment and runbook (planning)

**S00 status:** planning only. Local LiveKit bring-up **NOT RUN**. No production deploy authorized by this document.

## Local / dev (owned by S03)

1. Pin images: `livekit/livekit-server:v1.13.7`, `livekit/egress:v1.14.1` (ADR-VM-001).
2. Dedicated Redis for LiveKit+Egress (do not assume Upstash app Redis).
3. Example env only in `.env.example` patterns — never commit secrets (`LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, R2 keys).
4. Egress docker: `--cap-add=SYS_ADMIN` (or Chrome sandbox seccomp) per https://docs.livekit.io/transport/self-hosting/egress/.
5. Web: `NEXT_PUBLIC_LIVEKIT_URL` (wss) only; tokens from Nest.

References:

- https://docs.livekit.io/transport/self-hosting/deployment/
- https://docs.livekit.io/transport/self-hosting/egress/
- https://docs.livekit.io/transport/media/ingress-egress/egress/outputs/

## Staging / production gates (owner list)

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

## Isolation checklist

- Feature flag default **off**.
- Nest Video Meetings module failure must not prevent API boot for other modules.
- Separate process/hosts for LiveKit/Egress from Nest/Next where practical.
- Alerts: egress errors, R2 size anomalies, join failures — recipients TBD with ops.

## Rollback (planned)

1. Disable feature flag.
2. Stop admitting new rooms; revoke open invites.
3. Stop Egress workers accepting new jobs.
4. Leave historical Drive assets; follow approved retention (legal).
5. Do **not** hard-delete production media without policy.
