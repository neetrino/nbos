# NBOS — Production deploy runbook

> **Security gate:** complete [`security.todo.md`](../../security.todo.md) §0 (Preflight) before first production traffic.  
> **Stack:** Hetzner VPS + [Coolify](https://coolify.io) + **Cloudflare** (DNS/TLS/WAF) → Neon, R2, Resend, Redis.

Legacy references to Vercel/Render in older docs are **not** the current deploy path.

---

## Architecture

```text
Browser
  → Cloudflare (DNS proxied, TLS, WAF)
  → Hetzner VPS :443/:80
  → Coolify reverse proxy (Traefik/Caddy, origin cert or LE)
  → nbos-web   (Next.js, :3000)
  → nbos-api   (NestJS, :4000)
  → redis      (Coolify or Upstash — REDIS_URL)
Neon Postgres / R2 / Resend — external SaaS
```

| Component          | Production choice                               |
| ------------------ | ----------------------------------------------- |
| **Compute**        | Hetzner VPS + Coolify (`nbos-web` + `nbos-api`) |
| **Edge / domains** | Cloudflare proxied, SSL Full (strict), WAF      |
| **Database**       | Neon Postgres (`sslmode=require`)               |
| **Object storage** | Cloudflare R2 (private bucket)                  |
| **Cache / queues** | Redis (`rediss://` in prod)                     |
| **Email**          | Resend                                          |

**Public URLs (via Cloudflare):**

| Host           | Coolify app | Example                   |
| -------------- | ----------- | ------------------------- |
| `app.<domain>` | `nbos-web`  | `https://app.example.com` |
| `api.<domain>` | `nbos-api`  | `https://api.example.com` |

Both DNS records **Proxied ON**. WebSocket (messenger) uses `api.<domain>` through Cloudflare.  
Use internal Docker URL for `BACKEND_URL` on web when both apps share one Coolify server.

**Security (runtime):**

- Browser HTTP: `/api/*` → Next.js **BFF** → Nest; JWT in **httpOnly** cookie only.
- Messenger: `/api/auth/realtime-token` + `NEXT_PUBLIC_BACKEND_URL`.
- JWT logout: `POST /api/v1/auth/logout` + Redis `jti` denylist.
- Scheduler: `ServiceApiKeyGuard` on `/api/scheduler/*`.

---

## 1. Security preflight (before first deploy)

| Step                                                                                            | Where                   | Verify                                   |
| ----------------------------------------------------------------------------------------------- | ----------------------- | ---------------------------------------- |
| Strong secrets (`AUTH_SECRET`, `JWT_SECRET`, `CREDENTIALS_ENCRYPTION_KEY`, `SCHEDULER_API_KEY`) | Coolify env (web + api) | ≥32 chars; `openssl rand -base64 32`     |
| `NODE_ENV=production` on API                                                                    | Coolify `nbos-api`      | Boot logs, no Swagger                    |
| `CORS_ORIGIN` = exact web origin                                                                | Coolify `nbos-api`      | `https://app.example.com`                |
| `BACKEND_URL` reachable from web container                                                      | Coolify `nbos-web`      | `http://nbos-api:4000` or public API URL |
| `NEXT_PUBLIC_BACKEND_URL` = public API URL                                                      | Coolify `nbos-web`      | `https://api.example.com`                |
| `DATABASE_URL` with `sslmode=require`                                                           | Neon → api              | TLS enforced                             |
| DB role least privilege                                                                         | Neon                    | Migrations via separate job              |
| Redis `rediss://` in prod                                                                       | Coolify / Upstash → api | Log: `JWT denylist backed by Redis`      |
| R2 bucket private                                                                               | Cloudflare R2           | Keys only on api service                 |
| `REPORT_EXPORT_SYNC_FALLBACK` unset/false                                                       | Coolify api             | Worker-only exports                      |
| Cloudflare `app` + `api` proxied, SSL Full (strict)                                             | Cloudflare → Hetzner    | §2 below; `cf-ray` in response headers   |
| Hetzner firewall                                                                                | VPS                     | 80/443 (+22 SSH); no public 3000/4000    |
| Branch protection + CI green on release commit                                                  | GitHub                  | lint, typecheck, test, audit, gitleaks   |

Full checklist: [`security.todo.md` §0](../../security.todo.md).

---

## 2. Cloudflare DNS & SSL

### 2.1 DNS records

**Cloudflare → DNS:**

| Type | Name          | Content                     | Proxy       |
| ---- | ------------- | --------------------------- | ----------- |
| A    | `app`         | `<Hetzner VPS public IPv4>` | **Proxied** |
| A    | `api`         | `<same VPS IP>`             | **Proxied** |
| AAAA | `app` / `api` | `<VPS IPv6>` if used        | **Proxied** |

Optional: `www` CNAME → `app.<domain>`, proxied. Users must not hit raw VPS IP directly.

### 2.2 SSL/TLS

**Cloudflare → SSL/TLS:** **Full (strict)**. Origin on Coolify: Let's Encrypt or [Cloudflare Origin Certificate](https://developers.cloudflare.com/ssl/origin-configuration/origin-ca/).

After smoke test: enable **HSTS** (short `max-age` first).

### 2.3 Coolify domains

- `nbos-web`: `https://app.example.com`
- `nbos-api`: `https://api.example.com`

### 2.4 WAF

[`WAF Cloudflare.md`](../Check/Security/WAF%20Cloudflare.md) — Managed Rules, OWASP CRS, rate rules (§18 `security.todo.md`).

---

## 3. Hetzner server prep

| Step     | Action                                                                         |
| -------- | ------------------------------------------------------------------------------ |
| VPS      | Ubuntu 22.04/24.04 LTS, ≥4 GB RAM (8 GB comfortable)                           |
| Firewall | 22 (SSH), 80, 443 only                                                         |
| Coolify  | [Install Coolify](https://coolify.io/docs/get-started/installation) on the VPS |

---

## 4. Coolify applications

### 4.1 Redis

Coolify → **Resources → Database → Redis** (or Upstash `rediss://`).

Production API requires `rediss://` when `NODE_ENV=production`. Self-hosted Redis on Docker without TLS → use Upstash or add TLS (stunnel) before prod.

### 4.2 API — `nbos-api`

| Setting       | Value                                                                                 |
| ------------- | ------------------------------------------------------------------------------------- |
| Build command | `pnpm install --frozen-lockfile && pnpm db:generate && pnpm --filter @nbos/api build` |
| Start command | `cd apps/api && node --import tsx dist/main.js`                                       |
| Port          | `4000`                                                                                |
| Health check  | `GET /api/health` → 200                                                               |
| Domain        | `https://api.example.com`                                                             |

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

Do **not** enable in-process scheduler cron in prod unless intentional; use external cron + `SCHEDULER_API_KEY`.

### 4.3 Web — `nbos-web`

| Setting       | Value                                                                                 |
| ------------- | ------------------------------------------------------------------------------------- |
| Build command | `pnpm install --frozen-lockfile && pnpm db:generate && pnpm --filter @nbos/web build` |
| Start command | `pnpm --filter @nbos/web start`                                                       |
| Port          | `3000`                                                                                |
| Domain        | `https://app.example.com`                                                             |

```env
NODE_ENV=production
AUTH_SECRET=<openssl rand -base64 32>
AUTH_URL=https://app.example.com
NEXTAUTH_URL=https://app.example.com
APP_URL=https://app.example.com
BACKEND_URL=http://nbos-api:4000
NEXT_PUBLIC_BACKEND_URL=https://api.example.com
```

**Never** put `JWT_SECRET`, `DATABASE_URL`, or `CREDENTIALS_ENCRYPTION_KEY` on web — BFF injects auth server-side.

See also [`.env.example`](../../.env.example).

---

## 5. Deploy order

1. Cloudflare DNS + SSL Full (strict) (§2).
2. Neon migrations **once** (not on every API replica):

   ```bash
   pnpm db:migrate:deploy
   ```

3. Deploy **API** → `https://api.example.com/api/health` → 200.
4. Deploy **Web** → sign-in smoke at `https://app.example.com`.
5. Cloudflare WAF rules (§2.4).

---

## 6. Scheduler / external cron

```bash
curl -fsS -X POST "https://api.example.com/api/scheduler/expense-plan-auto-due" \
  -H "x-scheduler-key: $SCHEDULER_API_KEY"
```

Details: [`expense-plan-auto-due-external-cron.md`](./expense-plan-auto-due-external-cron.md).

---

## 7. Optional Dockerfiles (if Nixpacks fails)

**API** (`apps/api/Dockerfile`):

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

**Web:** same pattern with `pnpm --filter @nbos/web build` + `next start`.

---

## 8. Post-deploy smoke test

1. `GET https://api.example.com/api/health` → 200
2. Sign in; DevTools: session cookie `httpOnly` + `Secure`; **no** `accessToken` in session JSON
3. Sign out → old token → 401
4. `curl -I https://app.example.com` → CSP, security headers, **`cf-ray`** (Cloudflare path)
5. RBAC: one CRM/Finance action as permitted role
6. Drive upload: blocked extension rejected
7. Coolify UI: both apps healthy; API log shows Redis denylist if `REDIS_URL` set

---

## 9. Rollback

1. Coolify → **Deployments** → redeploy previous green build (web and/or api).
2. DB: Neon PITR restore if migration failed (`security.todo` §4.4).
3. Log deployment in Technical module deployment record.

---

## Related

- [`security.todo.md`](../../security.todo.md)
- [`WAF Cloudflare.md`](../Check/Security/WAF%20Cloudflare.md)
- [`TECH_CARD.md`](../../TECH_CARD.md)
