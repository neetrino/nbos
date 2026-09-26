# Video Meetings — technical and release gates

**Status:** V1 implementation planning/acceptance; no deployment or migrations approved by this document alone.

## Deployment

Self-host LiveKit Server and **separate Egress service** on isolated media resources (Hetzner candidate; verify sizing). Use compatible pinned server/Egress/React SDK versions; trusted TLS, public ICE/UDP/TCP networking and TURN/TLS fallback. Cloudflare/Vercel HTTP proxy alone is **not** a complete WebRTC topology. Egress needs suitable Redis/network, R2 S3 endpoint and independently measured CPU/memory.

Capacity plan covers **simultaneous conferences + simultaneous composite recorders + every participant's audio recorder**. Benchmark on target hardware (not optimistic static numbers) and define admission limits; gracefully reject recording when over limit without misreporting meeting success. Monitor Egress errors, actual R2 object sizes, completeness, CPU/RAM, media/TURN traffic, join failures and object-storage costs.

## Decisions needed before production

- Concurrency caps, max room/recording length and measured quality thresholds.
- Exact consent notice, late join/revocation stop/hold behavior, legal basis, retention/deletion and export roles.
- Verified Drive machine-producer integration path for asynchronous Egress output; security review of object ownership and recovery.
- LiveKit/Egress version-specific track API, audio handling on reconnect/mute, timestamp alignment and compatibility.
- Default RBAC matrix, invited guest lifetime/revocation and recording-storage regional controls.
- Alert recipients, timeout/retry budgets, ops/runbook and safe rollback plan.

## Required acceptance tests

| Area | Pass condition |
| --- | --- |
| End-to-end | Unlinked employee + guest meeting, composite video **and per-participant audio** privately recorded, registered via Drive and playable |
| Links | Attach/unlink **completed** meeting to permitted Project/Product/Deal/Contact with no duplicated files or access escalation |
| Calendar | Optional linked event uses existing reminder/conflict logic; standalone call works if Calendar integration fails |
| Security | Forged/replayed invite, wrong-room token, non-host record, guessed asset ids, webhook replay, unauthorized playback/export denied |
| Consent | Decline, late join, withdrawal, mute, reconnect do not trigger covert capture |
| Recovery | Egress failure, duplicate/missing/out-of-order webhook, partial R2 output, missing audio and crashed finalize produce truthful statuses/reconciliation |
| Media | Device preflight, mobile browser, screen share, poor network, corporate firewall/TURN and parallel calls tested |
| Capacity | Test target concurrency and separate Egress CPU/RAM budgets; record actual cost rather than promise free operations |
| Audit | Correlation across meeting, session, recording job and Drive operation; secrets/media not dumped to logs |

Feature-flag V1 rollout; run negative/security tests before enabling public guest links. Recording failures must not crash CRM/Calendar/Finance/Tasks/Drive. Orphan cleanup must follow Drive's existing conservative durable-operation guarantees.

Official references: https://docs.livekit.io/transport/self-hosting/deployment/ ; https://docs.livekit.io/transport/self-hosting/egress/ ; https://docs.livekit.io/transport/media/ingress-egress/egress/outputs/ .
