# NBOS — Production deploy runbook

> **Security gate:** complete [`security.todo.md`](../../security.todo.md) §0 (Preflight) before first production traffic.  
> **Stack:** Vercel (web) + Render (API) + Neon (Postgres) + Cloudflare (edge) + Redis + R2.

## 1. Pre-deploy checklist (owner)

| Step                                                                                            | Where           | Verify                                                 |
| ----------------------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------ |
| Strong secrets (`AUTH_SECRET`, `JWT_SECRET`, `CREDENTIALS_ENCRYPTION_KEY`, `SCHEDULER_API_KEY`) | Vercel + Render | ≥32 chars, not placeholders; `openssl rand -base64 32` |
| `NODE_ENV=production` on API                                                                    | Render          | Boot logs, no Swagger                                  |
| `CORS_ORIGIN` = exact web origin(s)                                                             | Render          | Comma-separated, no `*`                                |
| `BACKEND_URL` = API origin (no trailing slash)                                                  | Vercel          | Matches Render URL                                     |
| `DATABASE_URL` with `sslmode=require`                                                           | Neon → Render   | TLS enforced                                           |
| DB role least privilege (not owner)                                                             | Neon            | Migrations via separate role/job                       |
| Redis `rediss://` in prod                                                                       | Render          | API boot OK                                            |
| R2 bucket private; keys in Render only                                                          | Cloudflare R2   | No public bucket ACL                                   |
| `REPORT_EXPORT_SYNC_FALLBACK` unset/false                                                       | Render          | Worker-only exports                                    |
| Cloudflare proxy ON for `@`, `www`, `api`                                                       | Cloudflare DNS  | Origin not exposed                                     |
| Branch protection on `main`                                                                     | GitHub          | Required CI checks green                               |
| CI green on release commit                                                                      | GitHub Actions  | lint, typecheck, test, audit, gitleaks                 |

Full item list: [`security.todo.md` §0](../../security.todo.md).

## 2. Build & deploy order

1. **Database:** run migrations once (CI job or manual — never from every API instance).
   ```bash
   pnpm db:migrate:deploy
   ```
2. **API (Render):** deploy from `main` after CI passes.
   ```bash
   pnpm --filter @nbos/api build
   # Render start command: node --import tsx dist/main
   ```
3. **Web (Vercel):** deploy after API is healthy.
   ```bash
   pnpm --filter @nbos/web build
   ```

## 3. Environment variables

See root [`.env.example`](../../.env.example). Minimum:

**Vercel (web):** `AUTH_SECRET`, `BACKEND_URL`, `NEXTAUTH_URL` / Auth.js URL vars, `APP_URL`.  
**Never** put API secrets in `NEXT_PUBLIC_*`.

**Render (API):** `DATABASE_URL`, `JWT_SECRET`, `CREDENTIALS_ENCRYPTION_KEY`, `CORS_ORIGIN`, `REDIS_URL`, `SCHEDULER_API_KEY`, R2 + mail keys as needed.

## 4. Architecture notes (post security pass)

- Browser HTTP API calls: `/api/*` → Next.js **BFF** (`/api/bff/*`) → Nest. Backend JWT stays in the **httpOnly** Auth.js cookie; not exposed via `getSession()`.
- Messenger WebSocket: client fetches `/api/auth/realtime-token` (session cookie) then connects to API with Bearer token.
- Auth routes (`/api/v1/auth/login`, invite) are public; BFF forwards without token when unauthenticated.
- JWT logout revokes token via `POST /api/v1/auth/logout` (jti denylist).

## 5. Post-deploy smoke test

Run against production URL (or staging first):

1. `GET /api/health` → 200
2. Sign in → dashboard loads; DevTools: session cookie `httpOnly` + `Secure`; **no** `accessToken` in session JSON
3. Sign out → subsequent API call with old token → 401
4. `curl -I https://<web-host>` → security headers (CSP, HSTS, X-Frame-Options)
5. Create/read one record in a core module (CRM or Finance) — RBAC OK
6. Upload to Drive (if enabled) — blocked extensions rejected

## 6. Rollback

1. Revert deploy in Vercel / Render to previous green release.
2. If migration broke schema: restore Neon branch from PITR (test restore before prod — §4.4 in security.todo).
3. Record incident + deployment status in Technical module deployment record.

## 7. Related docs

- [`security.todo.md`](../../security.todo.md) — full security gate
- [`docs/TECH_CARD.md`](../TECH_CARD.md) — stack decisions
- [`docs/reference/Check/Security/0 Security List.md`](../reference/Check/Security/0%20Security%20List.md) — P0 checklist
- [`docs/reference/Check/Security/WAF Cloudflare.md`](../reference/Check/Security/WAF%20Cloudflare.md) — edge rules
