# NBOS deployment (baseline)

This project targets a split deploy: **Next.js web** (e.g. Vercel) and **NestJS API** (e.g. Render). Adjust host names and env to your environment.

## Web (`apps/web`)

- Build: `pnpm --filter @nbos/web build`
- Runtime env (minimum): `AUTH_SECRET`, `BACKEND_URL` (origin of the API, no trailing slash), NextAuth URL vars as required by your host (`NEXTAUTH_URL` / provider-specific)
- The app proxies authenticated API traffic from the browser to the API via `next.config.ts` rewrites (`/api/*` except `/api/auth/*`)

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

After deploy, run the owner browser checklist in `docs/PHASE_7_PRECHECK_MANUAL_QA.md` (or your release checklist) against the staging/production URL.
