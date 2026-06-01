# NBOS deployment (baseline)

This project targets a split deploy: **Next.js web** (e.g. Vercel) and **NestJS API** (e.g. Render). Adjust host names and env to your environment.

**Production runbook (security preflight + smoke tests):** [`docs/reference/platforms/nbos-production-deploy.md`](../reference/platforms/nbos-production-deploy.md)  
**Security gate checklist:** [`security.todo.md`](../../security.todo.md)

## Web (`apps/web`)

- Build: `pnpm --filter @nbos/web build`
- Runtime env (minimum): `AUTH_SECRET`, `BACKEND_URL` (origin of the API, no trailing slash), NextAuth URL vars as required by your host (`NEXTAUTH_URL` / provider-specific)
- Browser API traffic goes through the **BFF** (`/api/bff/*`): rewrites in `next.config.ts` inject the backend JWT from the httpOnly session cookie server-side

## API (`apps/api`)

- Build: `pnpm --filter @nbos/api build`
- Runtime env (minimum): `DATABASE_URL`, `JWT_SECRET`, CORS origins matching the web origin, file/R2 and mail keys if those modules are enabled (see root `.env.example`)

## Production secrets checklist

Never commit real values. Before go-live, confirm:

- Strong random `AUTH_SECRET` and `JWT_SECRET`
- `CREDENTIALS_ENCRYPTION_KEY` set and backed up if Credentials are used
- Database URLs: pooler vs direct (`DATABASE_URL` / `DIRECT_URL`) aligned with Prisma config
- R2 / Resend / Redis keys only if features are on

## Manual verification

After deploy, run the owner checklist from `docs/IMPLEMENTATION_PROGRESS.md` acceptance blocks (or archived `docs/Progress Archive/PHASE_7_PRECHECK_MANUAL_QA.md`) against the staging/production URL.
