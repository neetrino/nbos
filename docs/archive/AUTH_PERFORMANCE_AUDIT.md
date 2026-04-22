# Auth performance audit (Clerk → NextAuth / custom flow)

**Date:** 2026-04-16  
**Scope:** `apps/web` (Next.js 16 + Auth.js / `next-auth` v5 beta) + `apps/api` (NestJS + JWT + Prisma).  
**Method:** Static code tracing (no production APM traces in this pass).

---

## Auth architecture map

### Identity & session (browser → Next.js)

| Layer                                    | Role                                                                                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **HTTP-only session cookie**             | Auth.js session cookie (JWT strategy in `auth.ts`).                                                                                  |
| **`middleware.ts`**                      | Wraps requests with `auth()` from `@/auth`; redirects unauthenticated users away from non-public routes.                             |
| **`/api/auth/*`**                        | Route handlers from `handlers` (`apps/web/src/app/api/auth/[...nextauth]/route.ts`).                                                 |
| **`SessionProvider`** (`app/layout.tsx`) | Client-side session sync via `GET /api/auth/session` on mount (and on visibility / events — see below).                              |
| **`useSession()`**                       | Sidebar, `PermissionProvider`, `SessionGate` — read the same context; multiple subscribers = multiple re-renders on session updates. |

### Application profile & permissions (browser → Nest)

| Layer                          | Role                                                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| **Axios `api`** (`lib/api.ts`) | Injects `Authorization: Bearer <accessToken>` from `setAuthTokenGetter`.                                            |
| **`PermissionProvider`**       | After session is ready, `GET /api/me` (rewritten to Nest `GET /api/me`) to load `MeResponse` + permission map.      |
| **Nest `AuthGuard`**           | Verifies JWT (`jsonwebtoken`).                                                                                      |
| **Nest `EmployeeGuard`**       | Loads employee + role + permissions (+ departments) into `request.user` (with **60s in-memory cache per process**). |
| **`MeController.getMe`**       | Calls `employeesService.findById` again and merges `permissions` from `request.user`.                               |

### Public paths (middleware)

`PUBLIC_PATHS`: `/`, `/sign-in`, `/accept-invite`, `/api/auth` (and subpaths). Everything else requires `req.auth`.

---

## Files involved (auth + session + “me”)

| File                                                  | Responsibility                                                                               |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `apps/web/src/auth.ts`                                | NextAuth config: Credentials → Nest login; JWT session; `jwt` / `session` callbacks (no DB). |
| `apps/web/src/middleware.ts`                          | `auth()` middleware; matcher excludes static assets.                                         |
| `apps/web/src/app/api/auth/[...nextauth]/route.ts`    | Auth.js HTTP handlers.                                                                       |
| `apps/web/src/app/layout.tsx`                         | Root `SessionProvider` (default options).                                                    |
| `apps/web/src/app/(app)/layout.tsx`                   | Wraps app shell with `PermissionProvider`.                                                   |
| `apps/web/src/lib/permissions/PermissionContext.tsx`  | `useSession` ×2, `SessionGate` loader, `/api/me` fetch.                                      |
| `apps/web/src/lib/api.ts`                             | Bearer token injection for proxied API.                                                      |
| `apps/web/src/app/(auth)/sign-in/page.tsx`            | `signIn('credentials')`, `router.push`, `router.refresh()`.                                  |
| `apps/web/src/app/page.tsx`                           | Server `auth()` for landing CTA when logged in.                                              |
| `apps/web/src/components/layout/Sidebar.tsx`          | `useSession`, `signOut`, permissions from `usePermission()`.                                 |
| `apps/web/next.config.ts`                             | Rewrites `/api/*` (except `/api/auth/*`) to `BACKEND_URL`.                                   |
| `apps/api/src/common/guards/auth.guard.ts`            | JWT verification.                                                                            |
| `apps/api/src/common/guards/employee.guard.ts`        | DB load + permission map; 60s cache.                                                         |
| `apps/api/src/modules/employees/me.controller.ts`     | `GET /me` → `findById`.                                                                      |
| `apps/api/src/modules/employees/employees.service.ts` | `findById` with `EMPLOYEE_INCLUDE` (+ `_count`).                                             |

---

## Suspected bottlenecks (pre-verification)

1. ~~NextAuth `session` callback hitting DB every request~~ — **ruled out** for this repo: `session` strategy is **JWT**; callbacks only copy fields from token.
2. Redundant `/api/me` refetches when client session object updates — **likely** (see confirmed).
3. Full-screen gate until client session resolves — **likely** UX latency.
4. Duplicate employee loading on `GET /me` — **confirmed** (EmployeeGuard + `findById`).
5. Parallel dashboard API calls × `EmployeeGuard` — **confirmed risk** (cache stampede on cold miss).

---

## Confirmed bottlenecks (code-backed)

### 1. `/api/me` performs duplicate employee work (high)

**Flow:** `GET /api/me` → `AuthGuard` → `EmployeeGuard` runs `prisma.employee.findUnique` with `role.permissions` + `departments` → `MeController.getMe` calls `employeesService.findById` → **second** `findUnique` with `EMPLOYEE_INCLUDE` (including `_count` aggregates).

**Why it matters:** Same route pays **two heavy Prisma reads** (plus permission merge) on cache miss / first load.

**Files:** `employee.guard.ts`, `me.controller.ts`, `employees.service.ts` (`findById`).

**Status update (2026-04-22):** ✅ Resolved. `MeController.getMe` now returns profile from `request.user.meProfile` populated by `EmployeeGuard`; no second `findUnique` remains in `/me` handler.

### 2. `PermissionProvider` can refetch `/api/me` whenever `session` reference changes (high)

**Code:** `useEffect(..., [session, status])` runs `api.get('/api/me')` when dependencies change.

**Interaction:** `SessionProvider` (next-auth `react.js`) defaults to **`refetchOnWindowFocus = true`**. On tab focus, `_getSession` refetches `GET /api/auth/session`, updates React `session` state (typically **new object** even if payload unchanged), which can **retrigger** the effect and **another** `GET /api/me`.

**Files:** `PermissionContext.tsx`; `next-auth` `SessionProvider` implementation (`refetchOnWindowFocus` default).

**Status update (2026-04-22):** ✅ Mitigated. `SessionProvider` is configured with `refetchOnWindowFocus={false}` and `PermissionProvider` effect uses stable deps (`userId`, `status`) instead of full `session`.

### 3. Authenticated shell blocked on client session + sequential “me” load (medium–high)

**Code:** `SessionGate` returns a **full-screen** `<Loader2 />` while `useSession().status === 'loading'`. Only after that does `AppLayout` (and children) render.

**Why it matters:** Time-to-interactive for the app shell includes **client session round-trip** before any route UI appears, in addition to any `/api/me` latency for permissions.

**Files:** `PermissionContext.tsx` (`SessionGate`).

### 4. Multiple `useSession()` subscribers (low–medium)

**Code:** `SessionGate` and `PermissionProvider` each call `useSession()`; `Sidebar` also calls `useSession()`. Context is shared, but **each update propagates** to all three — extra re-renders on session sync.

**Files:** `PermissionContext.tsx`, `Sidebar.tsx`.

### 5. `EmployeeGuard` in-memory cache: concurrent “cold” requests can duplicate DB work (medium)

**Code:** `EmployeeGuard` checks `Map` cache; on miss, awaits `findUnique`. Concurrent requests before the first completes **do not share an in-flight promise** — multiple parallel API calls can trigger **parallel identical Prisma loads** for the same `employeeId`.

**Observed consumer:** Dashboard page fires **6 parallel** `api.get` calls on load — amplifies this on cold cache.

**Files:** `employee.guard.ts`; `apps/web/.../dashboard/page.tsx` (`Promise.allSettled`).

**Status update (2026-04-22):** ✅ Resolved for concurrent cache misses via in-flight promise dedupe map in `EmployeeGuard`.

### 6. Landing page forces dynamic work via server `auth()` (low–medium)

**Code:** `app/page.tsx` calls `await auth()` to decide CTA. That ties the route to **authenticated session resolution on the server** (dynamic rendering / request-time work vs fully static marketing page).

**Files:** `app/page.tsx`.

### 7. Login path: backend login + Auth.js callback + explicit `router.refresh()` (medium)

**Code:** `authorize` → `POST ${BACKEND_URL}/api/v1/auth/login`; then client `signIn`; then `router.push(callbackUrl)` and **`router.refresh()`**.

**Why it matters:** `router.refresh()` **invalidates and refetches** Server Components for the current RSC tree — extra work after login beyond navigation.

**Files:** `auth.ts` (`authorize`), `sign-in/page.tsx`.

### 8. Middleware runs on almost all non-static paths (low–expected)

**Code:** Broad `matcher`; each navigation runs `auth()` wrapper. Necessary for protection; cost is JWT/session resolution at the edge — usually small vs duplicate DB + `/api/me` issues.

**Files:** `middleware.ts`.

---

## Clerk vs this codebase (concrete differences)

| Before (Clerk, inferred)                                      | Now (this repo)                                                                                                                          |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Hosted session + often edge-optimized client SDK              | **Auth.js** session cookie + `GET /api/auth/session` client sync + **custom** `PermissionProvider` + **`GET /api/me`** for RBAC payload. |
| App may not have needed a second “profile” round-trip for nav | **Every** app load after session sync may hit **`/api/me`** (and duplicates Nest employee load — see above).                             |
| Fewer moving parts in _this_ codebase                         | **Stacked** checks: middleware `auth()` + client session + Nest JWT + `EmployeeGuard` + `findById`.                                      |

---

## Proposed fixes (priority order)

### Quick wins (low risk)

1. **`SessionProvider`:** set `refetchOnWindowFocus={false}` (or `true` with longer stale strategy elsewhere) to reduce spurious session sync + downstream `/api/me` refetches.
2. **`PermissionProvider`:** depend on a **stable key** (e.g. `session?.accessToken` or `session?.user?.id`) instead of the whole `session` object for `useEffect`; optionally **`useMemo`** / **React Query** with `staleTime` for `/api/me`.
3. **Sign-in:** test removing **`router.refresh()`** or replacing with targeted invalidation if something breaks without it.

### Medium fixes

4. **Nest `GET /me`:** return employee from **`EmployeeGuard`-enriched user** or a **single** service method; avoid **second** `findById` when the handler only needs fields already loaded (still return `_count` only if required).
5. **`EmployeeGuard`:** **dedupe in-flight** loads per `employeeId` (shared `Promise` map) to prevent parallel duplicate queries.

### Structural (higher effort; align with product)

6. **SSR session for shell:** pass **`session` prop** into `SessionProvider` from a server layout to reduce initial client “loading” gap (pattern suggested in Auth.js docs for App Router).
7. **Separate “identity” vs “heavy profile”:** keep JWT small; lazy-load non-critical profile fields.

---

## Implementation status (2026-04-22)

- ✅ `app/layout.tsx`: `SessionProvider` now uses `refetchOnWindowFocus={false}`.
- ✅ `PermissionContext.tsx`: `/api/me` fetch effect depends on stable auth identity (`userId`) and status.
- ✅ `sign-in/page.tsx`: redundant `router.refresh()` removed.
- ✅ `employee.guard.ts`: in-flight dedupe implemented for concurrent cold requests.
- ✅ `me.controller.ts`: duplicate employee read removed; `/me` now reuses guard-enriched profile payload.

### Code-backed before/after metrics (`GET /api/me`)

| Metric                                                                | Before   | After                                | Delta     |
| --------------------------------------------------------------------- | -------- | ------------------------------------ | --------- |
| Employee DB reads per request path (`EmployeeGuard` + `MeController`) | 2        | 1                                    | **-50%**  |
| `findUnique` calls inside `me.controller.ts`                          | 1        | 0                                    | **-100%** |
| Parallel cold-start duplicate work in `EmployeeGuard`                 | possible | deduped via shared in-flight Promise | reduced   |

**Temporary profiling (if added later):** mark any `console.time` / custom spans with `// PERF-AUDIT-TEMP` for easy removal.

---

## Not verified / needs runtime measurement

- Exact **ms** breakdown (middleware vs RSC vs `/api/auth/session` vs `/api/me` vs dashboard parallel APIs).
- Whether **Link prefetch** triggers middleware + RSC in this Next.js version for in-app navigation.
- **Production** DB latency, connection pool, and cold starts vs local dev.
- Whether **`signOut` redirect** vs SPA behavior matches expectations (default `redirect: true` → full navigation).

---

## Conclusion

**Is the auth migration the main cause of slowness?**  
**Partially yes — with high confidence** that **custom client + API layering** (`SessionProvider` + **`/api/me`** + **duplicate Nest queries** + **session refetch side effects**) explains a large share of perceived regression. **NextAuth JWT callbacks themselves are not doing DB work** in `auth.ts`.

**Non-auth caveat:** Heavy **parallel Nest API** calls (e.g. dashboard) amplify **`EmployeeGuard`** cache behavior; that can feel like “auth is slow” because **every** API request pays guard + (on miss) DB.

---

## Appendix: Request / render chains (reference)

### Initial load (authenticated user hits `/dashboard`)

1. Browser request → **middleware** `auth()` (session/JWT for edge).
2. RSC payload for route segments.
3. Client hydrates → **`SessionProvider`** fetches **`GET /api/auth/session`**.
4. **`SessionGate`**: blocks with spinner until `status !== 'loading'`.
5. **`PermissionProvider`**: **`GET /api/me`** (Nest: JWT + EmployeeGuard-enriched profile payload; no second controller `findUnique`).
6. Page components (e.g. dashboard) fire **additional** parallel `api.get` calls → each authenticated request runs **AuthGuard + EmployeeGuard** again.

### Login

1. `POST /api/auth/callback/credentials` → `authorize` → **`POST` Nest `/api/v1/auth/login`** (argon2 + DB + JWT).
2. Client session refresh (`_getSession`).
3. **`router.push`** + **`router.refresh()`** → extra RSC invalidation.

### Logout

1. `signOut({ callbackUrl: '/sign-in' })` → **`getCsrfToken`** + **`POST /api/auth/signout`** → default **`redirect: true`** → browser navigates to sign-in (full load unless changed).

### In-app navigation (e.g. `/dashboard` → `/tasks`)

- **`(app)/layout`** stays mounted: **no remount** of `PermissionProvider` from layout alone.
- Session tab-focus refetch is now disabled in `SessionProvider`; primary remaining risk for “navigation feels slow” is **RSC + page data fetching**, not layout remount.
