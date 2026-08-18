# NBOS — self-hosted prod Redis cutover

Living runbook. Inspected Coolify **read-only** on **2026-08-18**. No Redis start, no env flips, no deploys in that pass.

Do not paste passwords, `REDIS_URL`, tokens, or Coolify internal URLs into chat, git, or screenshots.

Related: [`docs/deploy.md`](../deploy.md) §4.1, [`scheduler-cron-roster.md`](./scheduler-cron-roster.md), [`todo.md`](../../todo.md).

---

## Current Coolify facts (no secrets)

Resource exists in **NBOS → production** (environment id 8).

| Field                 | Value                                                                                         |
| --------------------- | --------------------------------------------------------------------------------------------- |
| Display name          | `redis-database-h9duuzmfd24lqw8g6zf6z599` (target: `nbos-redis`)                              |
| UUID                  | `h9duuzmfd24lqw8g6zf6z599`                                                                    |
| Type / image          | `standalone-redis` / `redis:7.2`                                                              |
| Status                | `exited:unhealthy` — `started_at` is null (created, never started)                            |
| Destination           | Docker network **`coolify`** on server **NBOS**                                               |
| Public                | `is_public=false`, `public_port=null`, `ports_mappings=null`, `external_db_url` unset         |
| Volume                | named volume `redis-data-h9duuzmfd24lqw8g6zf6z599` → `/data`                                  |
| Password              | present (`REDIS_PASSWORD` set; internal URL has user + password)                              |
| TLS                   | `enable_ssl=false`. Internal URL scheme is **`redis`** (not `rediss`), port **6379**, db `/0` |
| Custom `redis_conf`   | empty                                                                                         |
| AOF                   | not set in UI conf. Coolify default start (empty conf) is `--appendonly yes`                  |
| `maxmemory`           | not set. Container memory limit is `0` (unlimited)                                            |
| Coolify API `version` | reports `4.0.0` (likely placeholder)                                                          |

**Keep 6379 unpublished.** Do not set `is_public` or a host `public_port`.

---

## App Redis env (names only)

Dedicated keys `REDIS_QUEUE_URL` / `REDIS_EVENTS_URL` / `REDIS_STATE_URL` are **unset** everywhere. Runtime falls back to `REDIS_URL` (see `queue-redis.ts`).

| App              | `REDIS_URL`   | Queue / events / state URLs |
| ---------------- | ------------- | --------------------------- |
| `nbos-api`       | set (runtime) | unset                       |
| `nbos-worker`    | set (runtime) | unset                       |
| `nbos-scheduler` | set (runtime) | unset                       |
| `nbos-web`       | absent        | absent                      |

**Preview copies:** `nbos-api`, `nbos-worker`, and `nbos-scheduler` each also have `REDIS_URL` with `is_preview=true`. Coolify prod+preview pair, not a second production key. When flipping prod, do **not** point preview at prod Redis.

**Out of this cutover:** `kovkasyanplennica` has `UPSTASH_REDIS_REST_*` (runtime + preview). `whatsapp-gateway` and `cursor-usage-tracker` have no NBOS Redis keys. Laptop `.env.local` `REDIS_URL` is commented and must stay off prod.

---

## TLS / `rediss://` (blocker if ignored)

Production API/worker/scheduler **throw** unless the Redis URL starts with `rediss://` (`redis-connection.ts`, `queue-redis.ts`; [`docs/deploy.md`](../deploy.md) ~L124).

Coolify internal URL today is `redis://…:6379`. Starting Redis and pointing apps at that URL **will crash** `NODE_ENV=production`.

Coolify Redis **does** support TLS: UI/API `enable_ssl`. Start path adds `--tls-port 6380` plus server cert + Coolify CA, `--tls-auth-clients optional`. Plain **6379 stays open inside Docker** unless we later disable it. Host publish stays off.

### Recommendation: Coolify native TLS

**Do this:** before any app `REDIS_URL` flip, set `enable_ssl=true` on this Redis, start it, then use Coolify’s TLS internal URL (`rediss://`, port **6380**) on the `coolify` network only.

| Option                                                    | Pros                                                                                        | Cons                                                                                                                                                                                                               |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Coolify `enable_ssl` (pick)**                           | Satisfies existing prod assert; no protocol exception; native certs; 6379 stays unpublished | Apps must use **6380**; Node may reject Coolify CA unless CA is mounted / `NODE_EXTRA_CA_CERTS`; Coolify healthcheck is `redis-cli ping` on plaintext — do **not** set `port 0` until healthcheck is proven on TLS |
| Sidecar stunnel/TLS terminator                            | Familiar if Coolify TLS is flaky                                                            | Extra container, another secret surface                                                                                                                                                                            |
| Documented exception + allow `redis://` on Docker network | Fastest start                                                                               | Weakens the written security baseline; job payloads in cleartext on the bridge; needs a code + `deploy.md` change — last resort only                                                                               |

**Verify TLS from a one-off on network `coolify`**, not from a laptop. Confirm ioredis accepts the cert (or mount `/data/coolify/ssl/coolify-ca.crt`). Do not put the URL in the runbook log.

---

## Desired end state

1. Display name **`nbos-redis`**. Docker DNS / UUID likely stays `h9duuzmfd24lqw8g6zf6z599` — use Coolify’s generated internal host, not the display name.
2. Volume `/data` kept. AOF on.
3. Password required (already generated — rotate only if it leaked).
4. **Do not publish 6379** to the host.
5. Custom `redis_conf` **must** include AOF if we leave Coolify’s empty-conf default, because a custom conf **replaces** `--appendonly yes`:

```
appendonly yes
maxmemory <size after VPS free-RAM check>
maxmemory-policy noeviction
```

Do not invent `maxmemory` blindly. `noeviction` is mandatory (BullMQ keys must not be evicted). If the conf includes `requirepass`, Coolify will not append one — keep password in sync.

6. Runtime `REDIS_URL` (`rediss://`) only on **api / worker / scheduler**, same queue Redis. Web never gets it.
7. Remove Upstash from **prod** those three apps after cutover is green. Leave preview and laptop on non-prod Redis.

---

## Cutover order (later — not today)

BullMQ jobs (mail, reports, Drive ZIP, **WhatsApp product groups**) live on current Upstash via `REDIS_URL`. Flipping **only** `nbos-worker` leaves producers on Upstash and consumers on an empty new Redis.

1. **Wait** until `nbos-scheduler` enable is green (see below).
2. Rename → `redis_conf` (AOF + maxmemory + noeviction) → confirm password → confirm unpublished → **enable Coolify TLS**.
3. **Start Redis.** Do not point apps yet.
4. **One-off on `coolify`:** PING over TLS:6380; confirm AOF / `maxmemory` / policy via `CONFIG GET` (no URL in logs).
5. **Drain plan, then worker:** either keep a consumer on Upstash until empty, or pause producers and drain, then point `nbos-worker` `REDIS_URL` to self-hosted `rediss://`. Deploy worker only.
6. **Point `nbos-api`** the same URL (producers + denylist + pub/sub). Deploy api.
7. **Point `nbos-scheduler`** last. Deploy scheduler only after 5–6 are healthy.
8. Watch queues and JWT denylist. Then **remove Upstash** from prod api/worker/scheduler (runtime keys). Do not wipe preview blindly.
9. **Client Services cron** (domains / hosting / licenses) stays **after** this cutover — see roster item 17 and `todo.md`.

WhatsApp BullMQ queue + worker **stay**. Do not disable `WhatsAppProductGroupsWorker`. Group **cron** stays off (`SCHEDULER_WHATSAPP_PRODUCT_GROUPS_RECONCILE_ENABLED=false`).

---

## Never

- Point laptop `.env.local` at prod Redis (even `rediss://` on an unpublished port).
- Publish 6379 / set `is_public`.
- Use Coolify `redis://…:6379` in production apps.
- Flip `REDIS_QUEUE_URL` separately (unset today; would split producers/consumers).
- Copy prod Redis URL into preview env keys.

---

## Do not do today

While scheduler enable is in progress on `nbos-scheduler` only:

- Do not start this Redis.
- Do not PATCH/deploy `nbos-scheduler`, `nbos-api`, `nbos-web`, or `nbos-worker`.
- Do not change any app `REDIS_*`.
- Do not enable Client Services cron.
- Do not remove Upstash.
- Do not attach a laptop to this instance.

Safe now: read Coolify, finish this runbook, wait for scheduler enable green.

---

## Recheck before execute

Re-GET Coolify database `h9duuzmfd24lqw8g6zf6z599` (status, `enable_ssl`, `is_public`, `public_port`, `redis_conf` set?, volume present, password still set). Re-list `REDIS_*` key **names** on api/worker/scheduler. If facts drifted, update this file before touching Coolify.
