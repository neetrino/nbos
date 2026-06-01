# NBOS — Deploy on Hetzner via Coolify

> **Target:** self-hosted on a Hetzner VPS managed by [Coolify](https://coolify.io).  
> **Domains & TLS:** **Cloudflare** (DNS proxied, SSL, WAF) → Hetzner origin.  
> **External SaaS:** Neon Postgres, Cloudflare R2, Resend, Redis (Coolify or Upstash).

## Architecture

```text
Browser
  → Cloudflare (DNS proxied, TLS, WAF, optional rate rules)
  → Hetzner VPS :443/:80
  → Coolify reverse proxy (Traefik/Caddy, origin cert or LE)
  → nbos-web   (Next.js, :3000)
  → nbos-api   (NestJS, :4000)
  → redis      (Coolify or Upstash — REDIS_URL)
Neon Postgres / R2 / Resend — external
```

**Public URLs (via Cloudflare):**

| Host           | Coolify app | Example                   |
| -------------- | ----------- | ------------------------- |
| `app.<domain>` | `nbos-web`  | `https://app.example.com` |
| `api.<domain>` | `nbos-api`  | `https://api.example.com` |

Both records **Proxied ON** (orange cloud). WebSocket (messenger) goes through Cloudflare on `api.<domain>` — no separate bypass needed.

**Two Coolify applications** on one server; use internal Docker URL for `BACKEND_URL` on web.

---

## 1. Cloudflare DNS & SSL (do this first)

### 1.1 DNS records

In **Cloudflare → DNS** for your zone:

| Type | Name          | Content                     | Proxy       |
| ---- | ------------- | --------------------------- | ----------- |
| A    | `app`         | `<Hetzner VPS public IPv4>` | **Proxied** |
| A    | `api`         | `<same VPS IP>`             | **Proxied** |
| AAAA | `app` / `api` | `<VPS IPv6>` if used        | **Proxied** |

Optional: `www` CNAME → `app.<domain>`, proxied.

Do **not** publish raw VPS IP as unproxied hostname for users — visitors should only hit Cloudflare.

### 1.2 SSL/TLS mode

**Cloudflare → SSL/TLS → Overview:** **Full (strict)**

- Cloudflare terminates HTTPS for browsers.
- Coolify on the VPS must present a **valid origin certificate** (Let's Encrypt via Coolify **or** [Cloudflare Origin Certificate](https://developers.cloudflare.com/ssl/origin-configuration/origin-ca/) installed in Coolify/Traefik).

After smoke test passes: enable **HSTS** (Cloudflare → SSL/TLS → Edge Certificates). Start with short `max-age`, then increase.

### 1.3 Coolify domain binding

In each Coolify app → **Domains**:

- `nbos-web`: `https://app.example.com`
- `nbos-api`: `https://api.example.com`

Coolify requests/renews certs for these hostnames. With **Full (strict)**, ensure the origin cert matches what Cloudflare expects (LE or Origin CA).

### 1.4 Security (WAF)

Follow [`WAF Cloudflare.md`](../Check/Security/WAF%20Cloudflare.md) — origin is **Hetzner IP**, not Vercel/Render:

- Managed Rules + OWASP CRS
- Rate rules for auth/scheduler groups (§18 in `security.todo.md`)
- Bot Fight Mode / Super Bot Fight (as needed)

### 1.5 Env URLs must match public Cloudflare hostnames

```env
# nbos-api
CORS_ORIGIN=https://app.example.com

# nbos-web
AUTH_URL=https://app.example.com
NEXTAUTH_URL=https://app.example.com
APP_URL=https://app.example.com
NEXT_PUBLIC_BACKEND_URL=https://api.example.com
```

Use `https://` and the **same hostnames** users see in the browser (Cloudflare URLs), not the raw IP.

---

## 2. Server prep (Hetzner)

| Step     | Action                                                                       |
| -------- | ---------------------------------------------------------------------------- |
| VPS      | Ubuntu 22.04/24.04 LTS, ≥4 GB RAM for web+api+redis (8 GB comfortable)       |
| Firewall | Hetzner: 22 (SSH), 80, 443 only; block direct public access to 3000/4000     |
| Coolify  | Install per [Coolify docs](https://coolify.io/docs/get-started/installation) |
| DNS      | **Cloudflare** A/AAAA → VPS IP, **Proxied ON** for `app` + `api` (see §1)    |

---

## 3. Coolify services to create

### 3.1 Redis (on VPS)

Coolify → **Resources → Database → Redis** (or deploy Redis container).

- Note **internal URL** for API, e.g. `redis://redis:6379` or managed `rediss://` if TLS enabled.
- Production API enforces `rediss://` when `NODE_ENV=production` — use TLS-enabled Redis or Coolify Redis with TLS, or run Redis on private network only (see ops note below).

**Ops note:** Code requires `rediss://` in production (`redis-connection.ts`). Options:

1. Upstash / external TLS Redis → paste `rediss://…` into API env.
2. Self-hosted Redis on private Docker network: use `rediss://` with stunnel/redis TLS, **or** temporarily use Upstash until TLS is configured on self-hosted Redis.

### 3.2 API — `nbos-api`

| Setting        | Value                                                                                 |
| -------------- | ------------------------------------------------------------------------------------- |
| Type           | GitHub repo / monorepo                                                                |
| Build pack     | Nixpacks or Dockerfile (see §4)                                                       |
| Root directory | repository root                                                                       |
| Build command  | `pnpm install --frozen-lockfile && pnpm db:generate && pnpm --filter @nbos/api build` |
| Start command  | `cd apps/api && node --import tsx dist/main.js`                                       |
| Port           | `4000`                                                                                |
| Health check   | `GET /api/health` → 200                                                               |
| Domain         | `https://api.example.com`                                                             |

**Environment (minimum):**

```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://...?sslmode=require
JWT_SECRET=<openssl rand -base64 32>
CREDENTIALS_ENCRYPTION_KEY=<openssl rand -base64 32>
CORS_ORIGIN=https://app.example.com
REDIS_URL=rediss://...
SCHEDULER_API_KEY=<openssl rand -base64 32>
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=nbos
NBOS_TENANT_ORGANIZATION_ID=<uuid>
RESEND_API_KEY=...
RESEND_FROM_EMAIL=...
REPORT_EXPORT_SYNC_FALLBACK=false
```

Do **not** set `SCHEDULER_EXPENSE_PLAN_AUTO_DUE_ENABLED=true` in prod unless you intentionally run in-process cron; prefer external cron hitting `/api/scheduler/*` with `SCHEDULER_API_KEY`.

### 3.3 Web — `nbos-web`

| Setting       | Value                                                                                 |
| ------------- | ------------------------------------------------------------------------------------- |
| Build command | `pnpm install --frozen-lockfile && pnpm db:generate && pnpm --filter @nbos/web build` |
| Start command | `pnpm --filter @nbos/web start`                                                       |
| Port          | `3000`                                                                                |
| Domain        | `https://app.example.com`                                                             |

**Environment (minimum):**

```env
NODE_ENV=production
AUTH_SECRET=<openssl rand -base64 32>
AUTH_URL=https://app.example.com
NEXTAUTH_URL=https://app.example.com
APP_URL=https://app.example.com
# Server-side BFF → API (internal Docker URL if same Coolify server):
BACKEND_URL=http://nbos-api:4000
# Browser WebSocket (must be public URL):
NEXT_PUBLIC_BACKEND_URL=https://api.example.com
```

Replace `nbos-api` with the **Coolify internal service name** if different. If internal DNS fails, use public `BACKEND_URL=https://api.example.com`.

**Never** put `JWT_SECRET`, `DATABASE_URL`, or `CREDENTIALS_ENCRYPTION_KEY` on the web service — BFF injects auth server-side.

---

## 4. Deploy order

1. **Cloudflare:** DNS proxied + SSL Full (strict) (§1).
2. **Neon:** migrations once (Coolify pre-deploy or local/CI):

   ```bash
   pnpm db:migrate:deploy
   ```

   Run from a machine with `DATABASE_URL` — not from every API replica on each deploy.

3. **Deploy API** → wait for `/api/health` green (via `https://api.example.com/api/health` through Cloudflare).
4. **Deploy Web** → sign-in smoke test at `https://app.example.com`.
5. **Cloudflare WAF** rules per [`WAF Cloudflare.md`](../Check/Security/WAF%20Cloudflare.md).

---

## 5. Optional Dockerfile snippets (if Nixpacks struggles with monorepo)

**API** (`apps/api/Dockerfile` — create only if needed):

```dockerfile
FROM node:22-bookworm-slim AS base
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/ packages/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm db:generate && pnpm --filter @nbos/api build
WORKDIR /app/apps/api
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "--import", "tsx", "dist/main.js"]
```

**Web:** similar pattern with `pnpm --filter @nbos/web build` + `next start`.

Prefer Coolify **monorepo** settings first; add Dockerfiles only when build fails.

---

## 6. Scheduler / cron on Coolify

External cron (server cron or Coolify scheduled task):

```bash
curl -fsS -X POST "https://api.example.com/api/scheduler/expense-plan-auto-due" \
  -H "x-scheduler-key: $SCHEDULER_API_KEY"
```

Recipe: [`expense-plan-auto-due-external-cron.md`](./expense-plan-auto-due-external-cron.md).

---

## 7. Smoke test

Same as [`nbos-production-deploy.md`](./nbos-production-deploy.md) §5, using your domains.

Extra Coolify checks:

- API health green in Coolify UI
- Web logs: no `BACKEND_URL` connection errors
- Redis: API log `JWT denylist backed by Redis`

- `curl -I https://app.example.com` — CSP + security headers; `cf-ray` header confirms Cloudflare path

---

## 8. Rollback

Coolify → application → **Deployments** → redeploy previous successful image/commit.

DB rollback: Neon PITR branch restore (see security.todo §4.4).

---

## Related

- [`nbos-production-deploy.md`](./nbos-production-deploy.md) — security preflight (platform-agnostic)
- [`security.todo.md`](../../security.todo.md) §0
- [`../../TECH_CARD.md`](../../TECH_CARD.md) — update §8 hosting when team confirms Coolify as canonical
