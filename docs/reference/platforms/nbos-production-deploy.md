# NBOS — Production deploy runbook

> **Security gate:** complete [`security.todo.md`](../../security.todo.md) §0 (Preflight) before first production traffic.

## Hosting target

| Component              | Production choice                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Compute**            | **Hetzner VPS + [Coolify](https://coolify.io)** — see [`nbos-coolify-hetzner.md`](./nbos-coolify-hetzner.md) |
| **Database**           | Neon Postgres (`sslmode=require`)                                                                            |
| **Object storage**     | Cloudflare R2 (private bucket)                                                                               |
| **Cache / queues**     | Redis (`REDIS_URL`, `rediss://` in prod) — Coolify on VPS or Upstash                                         |
| **Edge (recommended)** | Cloudflare proxy + WAF in front of VPS                                                                       |
| **Email**              | Resend                                                                                                       |

Legacy references to Vercel/Render in older docs are **not** the current deploy path.

---

## 1. Pre-deploy checklist (owner)

| Step                                                                                            | Where                   | Verify                                                 |
| ----------------------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------ |
| Strong secrets (`AUTH_SECRET`, `JWT_SECRET`, `CREDENTIALS_ENCRYPTION_KEY`, `SCHEDULER_API_KEY`) | Coolify env (web + api) | ≥32 chars; `openssl rand -base64 32`                   |
| `NODE_ENV=production` on API                                                                    | Coolify `nbos-api`      | Boot logs, no Swagger                                  |
| `CORS_ORIGIN` = exact web origin                                                                | Coolify `nbos-api`      | e.g. `https://app.example.com`                         |
| `BACKEND_URL` = API reachable from web container                                                | Coolify `nbos-web`      | Internal `http://<api-service>:4000` or public API URL |
| `NEXT_PUBLIC_BACKEND_URL` = public API URL                                                      | Coolify `nbos-web`      | Browser WS (messenger)                                 |
| `DATABASE_URL` with `sslmode=require`                                                           | Neon → Coolify api      | TLS enforced                                           |
| DB role least privilege                                                                         | Neon                    | Migrations via separate job, not owner at runtime      |
| Redis `rediss://` in prod                                                                       | Coolify / Upstash → api | API boot + denylist log                                |
| R2 bucket private                                                                               | Cloudflare R2           | Keys only on api service                               |
| `REPORT_EXPORT_SYNC_FALLBACK` unset/false                                                       | Coolify api             | Worker-only exports                                    |
| Cloudflare proxy ON (if used)                                                                   | DNS                     | Origin not exposed raw                                 |
| Hetzner firewall                                                                                | VPS                     | 80/443 (+22 SSH); no public 3000/4000                  |
| Branch protection on `main`                                                                     | GitHub                  | CI green                                               |
| CI green on release commit                                                                      | GitHub Actions          | lint, typecheck, test, audit, gitleaks                 |

Full item list: [`security.todo.md` §0](../../security.todo.md).

---

## 2. Build & deploy order

Detailed Coolify UI settings: [`nbos-coolify-hetzner.md`](./nbos-coolify-hetzner.md).

1. **Database:** migrations once — never from every API instance on each deploy.

   ```bash
   pnpm db:migrate:deploy
   ```

2. **API (`nbos-api`):** deploy after CI passes; health `GET /api/health`.

   ```bash
   pnpm --filter @nbos/api build
   # Start: node --import tsx dist/main.js  (from apps/api)
   ```

3. **Web (`nbos-web`):** deploy after API is healthy.

   ```bash
   pnpm --filter @nbos/web build
   # Start: pnpm --filter @nbos/web start
   ```

---

## 3. Environment variables

See root [`.env.example`](../../.env.example).

**Coolify `nbos-web`:** `AUTH_SECRET`, `AUTH_URL`, `NEXTAUTH_URL`, `APP_URL`, `BACKEND_URL`, `NEXT_PUBLIC_BACKEND_URL`.  
**Never** API secrets or `DATABASE_URL` on web — BFF uses httpOnly session.

**Coolify `nbos-api`:** `DATABASE_URL`, `JWT_SECRET`, `CREDENTIALS_ENCRYPTION_KEY`, `CORS_ORIGIN`, `REDIS_URL`, `SCHEDULER_API_KEY`, R2, Resend, tenant UUID, etc.

---

## 4. Architecture notes (security)

- Browser HTTP: `/api/*` → Next.js **BFF** → Nest; JWT in **httpOnly** cookie only.
- Messenger WebSocket: `/api/auth/realtime-token` + `NEXT_PUBLIC_BACKEND_URL`.
- JWT logout: `POST /api/v1/auth/logout` + Redis/in-memory `jti` denylist.
- Scheduler: `ServiceApiKeyGuard` on `/api/scheduler/*`.

---

## 5. Post-deploy smoke test

1. `GET https://api.example.com/api/health` → 200
2. Sign in at web URL; DevTools: session cookie `httpOnly` + `Secure`; no `accessToken` in session JSON
3. Sign out → old token → 401
4. `curl -I https://app.example.com` → CSP, HSTS, X-Frame-Options
5. RBAC: one CRM/Finance read/write as permitted role
6. Drive upload: blocked extension rejected

---

## 6. Rollback

1. Coolify → redeploy previous successful deployment (web and/or api).
2. DB: Neon PITR restore if migration failed (§4.4 security.todo).
3. Log deployment record in Technical module.

---

## 7. Related docs

- [`nbos-coolify-hetzner.md`](./nbos-coolify-hetzner.md) — Coolify step-by-step
- [`security.todo.md`](../../security.todo.md)
- [`docs/TECH_CARD.md`](../TECH_CARD.md)
- [`Check/Security/WAF Cloudflare.md`](../Check/Security/WAF%20Cloudflare.md)
