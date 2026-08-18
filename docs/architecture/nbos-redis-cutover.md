# NBOS — self-hosted prod Redis cutover

Living runbook. **Cutover executed 2026-08-18.** Prod api / worker / scheduler now use Coolify Redis over `rediss://:6380`.

Do not paste passwords, `REDIS_URL`, tokens, or Coolify internal URLs into chat, git, or screenshots.

Related: [`docs/deploy.md`](../deploy.md) §4.1, [`scheduler-cron-roster.md`](./scheduler-cron-roster.md), [`todo.md`](../../todo.md).

---

## Current Coolify facts (no secrets)

Resource in **NBOS → production** (environment id 8).

| Field                 | Value                                                                          |
| --------------------- | ------------------------------------------------------------------------------ |
| Display name          | `nbos-redis`                                                                   |
| UUID                  | `h9duuzmfd24lqw8g6zf6z599`                                                     |
| Type / image          | `standalone-redis` / `redis:7.2`                                               |
| Status                | `running:healthy`                                                              |
| Destination           | Docker network **`coolify`** on server **NBOS**                                |
| Public                | `is_public=false`, `public_port=null`, host publish empty                      |
| Volume                | named volume `redis-data-h9duuzmfd24lqw8g6zf6z599` → `/data`                   |
| Password              | present (`REDIS_PASSWORD` set; internal URL has user + password)               |
| TLS                   | `enable_ssl=true`. Internal URL scheme **`rediss`**, port **6380**, db `/0`    |
| Custom `redis_conf`   | set: `appendonly yes`, `maxmemory 256mb`, `maxmemory-policy noeviction`        |
| Verified in Redis     | `CONFIG GET`: appendonly=yes, maxmemory=268435456, maxmemory-policy=noeviction |
| Coolify API `version` | reports `4.0.0`                                                                |

**Keep 6379 unpublished.** Plain 6379 stays open **inside** Docker (Coolify healthcheck pings it). Do not set `is_public` or a host `public_port`. Do not set healthcheck `port 0`.

`enable_ssl` is **not** an allowed Coolify API PATCH field (422). It was set on the Coolify control-plane DB (`standalone_redis.enable_ssl`) then the instance was started via `GET /databases/{uuid}/start`. Internal URL flipped to `rediss://…:6380` after that. `name` + `redis_conf` (base64) **are** valid PATCH fields.

---

## App Redis env (names only)

Dedicated keys `REDIS_QUEUE_URL` / `REDIS_EVENTS_URL` / `REDIS_STATE_URL` remain **unset**. Runtime falls back to `REDIS_URL`.

| App              | Prod runtime `REDIS_URL`      | Preview `REDIS_URL`       | `NODE_EXTRA_CA_CERTS` (runtime) |
| ---------------- | ----------------------------- | ------------------------- | ------------------------------- |
| `nbos-api`       | self-hosted `rediss://` :6380 | still Upstash (untouched) | `/etc/coolify/coolify-ca.crt`   |
| `nbos-worker`    | same                          | still Upstash (untouched) | `/etc/coolify/coolify-ca.crt`   |
| `nbos-scheduler` | same                          | still Upstash (untouched) | `/etc/coolify/coolify-ca.crt`   |
| `nbos-web`       | absent (not deployed)         | absent                    | absent                          |

Coolify file storage mounts CA PEM into api/worker/scheduler at `/etc/coolify/coolify-ca.crt` (host file `/data/coolify/ssl/coolify-ca.crt` exists on the NBOS VPS). Node without that CA fails `SELF_SIGNED_CERT_IN_CHAIN`; with CA, TLS verify is OK.

Coolify `POST` env also cloned `NODE_EXTRA_CA_CERTS` onto preview; those preview copies were deleted. Do not put the prod Redis URL on preview.

**Out of this cutover:** `kovkasyanplennica` still has `UPSTASH_REDIS_REST_*`. Laptop `.env.local` `REDIS_URL` stays commented.

---

## Cutover that ran (2026-08-18)

VPS RAM at decide time: 3.7Gi total, ~1.4Gi used, ~2.3Gi available, **1.1Gi swap in use**. Live containers: scheduler ~321MiB, api ~45MiB, worker ~34MiB, web ~60MiB. Chose **`maxmemory 256mb`** (not 512mb) because the box was already swapping.

1. Confirmed unpublished, password set, volume present, type `standalone-redis`.
2. Renamed to `nbos-redis`. Set `redis_conf`. Set `enable_ssl=true` (control-plane DB). Started Redis. Healthcheck on 6379 passed; TLS accepted connections.
3. One-off on network `coolify`: TLS PING :6380 with Coolify CA, OpenSSL verify 0, CONFIG GET as above.
4. Upstash BullMQ depths (mail, reports.export-jobs, drive.zip-export-jobs, whatsapp.product-groups wait/active/delayed/paused) were **0**. Worker-first flip was safe.
5. Runtime `REDIS_URL` only (not preview), then one deploy each:
   - worker `l4o4jq9dcg3gl1341m73xhdn` → healthy
   - api `wbd3y71478z8dhvg2mmdlz6e` → healthy
   - scheduler `h21n1tyjgulgvvfxys6q8u96` → healthy
6. Scheduler after flip: `SCHEDULER_ENABLED=true`, seven nest crons registered (billing, overdue-invoices, sales-kpi-month-close, expense-plan-auto-due, recurring-tasks-due, notification-inbox-reconcile, notification-enqueue-reconcile). WhatsApp **reconcile cron stayed off**. WhatsApp BullMQ worker stayed.
7. Prod runtime Upstash replaced (no leftover Upstash on those three prod keys). Preview still Upstash. Web not deployed.

---

## Still later

- **Client Services cron** (domains / hosting / licenses) stays after this cutover — roster item 17 and `todo.md`.
- WhatsApp group **cron** stays off. Queue + worker stay.
- Do not rotate the Redis password unless it leaked (it appeared in `docker inspect` Cmd on the VPS; treat as need-to-know, rotate if that log left the host).

---

## Never

- Point laptop `.env.local` at prod Redis (even `rediss://` on an unpublished port).
- Publish 6379 / set `is_public`.
- Use Coolify `redis://…:6379` in production apps.
- Flip `REDIS_QUEUE_URL` separately (unset; would split producers/consumers).
- Copy prod Redis URL into preview env keys.
- `docker system prune -a` or volume prune.
- Deploy `nbos-web` for Redis.
