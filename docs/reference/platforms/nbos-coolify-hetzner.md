# NBOS — Deploy on Hetzner via Coolify

> **Target:** self-hosted on a Hetzner VPS managed by [Coolify](https://coolify.io).  
> **External services (unchanged):** Neon Postgres, Cloudflare R2, Resend, optional Cloudflare proxy/WAF in front of the VPS.

## Architecture on one VPS

```text
Internet
  → (optional) Cloudflare proxy + WAF
  → Coolify reverse proxy (Traefik/Caddy, TLS)
  → nbos-web   (Next.js, port 3000)
  → nbos-api   (NestJS, port 4000)
  → redis      (Coolify one-click or Upstash — REDIS_URL)
Neon Postgres / R2 / Resend — external SaaS
```

**Two Coolify applications** (recommended): `nbos-web` + `nbos-api`. Same Coolify server = internal Docker network between them.

---

## 1. Server prep (Hetzner)

| Step     | Action                                                                                         |
| -------- | ---------------------------------------------------------------------------------------------- |
| VPS      | Ubuntu 22.04/24.04 LTS, ≥4 GB RAM for web+api+redis (8 GB comfortable)                         |
| Firewall | Hetzner: 22 (SSH), 80, 443 only; block direct public access to 3000/4000                       |
| Coolify  | Install per [Coolify docs](https://coolify.io/docs/get-started/installation); attach domain(s) |
| DNS      | `app.example.com` → VPS (proxied via Cloudflare if used), `api.example.com` → VPS              |

---

## 2. Coolify services to create

### 2.1 Redis (on VPS)

Coolify → **Resources → Database → Redis** (or deploy Redis container).

- Note **internal URL** for API, e.g. `redis://redis:6379` or managed `rediss://` if TLS enabled.
- Production API enforces `rediss://` when `NODE_ENV=production` — use TLS-enabled Redis or Coolify Redis with TLS, or run Redis on private network only (see ops note below).

**Ops note:** Code requires `rediss://` in production (`redis-connection.ts`). Options:

1. Upstash / external TLS Redis → paste `rediss://…` into API env.
2. Self-hosted Redis on private Docker network: use `rediss://` with stunnel/redis TLS, **or** temporarily use Upstash until TLS is configured on self-hosted Redis.

### 2.2 API — `nbos-api`

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

### 2.3 Web — `nbos-web`

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

## 3. Deploy order

1. **Neon:** migrations once (Coolify **Pre-deployment command** or local/CI):

   ```bash
   pnpm db:migrate:deploy
   ```

   Run from a machine with `DATABASE_URL` — not from every API replica on each deploy.

2. **Deploy API** → wait for `/api/health` green.

3. **Deploy Web** → sign-in smoke test.

4. **Optional Cloudflare:** proxy ON, SSL Full (strict), WAF — see [`WAF Cloudflare.md`](../Check/Security/WAF%20Cloudflare.md) (replace Vercel/Render origin sections with Hetzner IP/domain).

---

## 4. Optional Dockerfile snippets (if Nixpacks struggles with monorepo)

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

## 5. Scheduler / cron on Coolify

External cron (server cron or Coolify scheduled task):

```bash
curl -fsS -X POST "https://api.example.com/api/scheduler/expense-plan-auto-due" \
  -H "x-scheduler-key: $SCHEDULER_API_KEY"
```

Recipe: [`expense-plan-auto-due-external-cron.md`](./expense-plan-auto-due-external-cron.md).

---

## 6. Smoke test

Same as [`nbos-production-deploy.md`](./nbos-production-deploy.md) §5, using your domains.

Extra Coolify checks:

- API health green in Coolify UI
- Web logs: no `BACKEND_URL` connection errors
- Redis: API log `JWT denylist backed by Redis`

---

## 7. Rollback

Coolify → application → **Deployments** → redeploy previous successful image/commit.

DB rollback: Neon PITR branch restore (see security.todo §4.4).

---

## Related

- [`nbos-production-deploy.md`](./nbos-production-deploy.md) — security preflight (platform-agnostic)
- [`security.todo.md`](../../security.todo.md) §0
- [`../../TECH_CARD.md`](../../TECH_CARD.md) — update §8 hosting when team confirms Coolify as canonical
