# Ճարտարապետություն — սկսնակի ուղեցույց (NBOS)

Այս փաստաթուղթը բացատրում է, թե **ինչ տեխնոլոգիաներով** է կառուցված NBOS-ը, և **ինչպես են տվյալները շարժվում** իրական ֆայլերի հիման վրա։

---

## 1. Ֆրեյմվորկ և ստեկ

| Շերտ               | Տեխնոլոգիա                                   | Պատասխանատու ֆայլեր / թղթապանակ                               |
| ------------------ | -------------------------------------------- | ------------------------------------------------------------- |
| Ֆրոնտ              | Next.js **16.2.3**, React **19**, App Router | `apps/web/`                                                   |
| Բեքենդ             | NestJS **11**                                | `apps/api/`                                                   |
| ՏԲ ORM             | Prisma **7**, PostgreSQL                     | `packages/database/prisma/schema.prisma`                      |
| Մոնորեպո           | pnpm workspaces + Turbo                      | `pnpm-workspace.yaml`, `turbo.json`, արմատային `package.json` |
| Համօգտագործվող կոդ | `@nbos/shared`                               | `packages/shared/src/`                                        |
| Ոճ                 | Tailwind CSS 4                               | `apps/web/package.json`, `apps/web/src/app/globals.css`       |

---

## 2. Ֆրոնտենդ ճարտարապետություն

### App Router

- Գլոբալ layout՝ `apps/web/src/app/layout.tsx` (ֆոնտեր, `SessionProvider` from `next-auth/react`, `globals.css`)։
- Հանրային լենդինգ՝ `apps/web/src/app/page.tsx`։
- Մուտքի էջեր՝ `apps/web/src/app/(auth)/sign-in/page.tsx`, `accept-invite/page.tsx`։
- Ներքին հավելված՝ `apps/web/src/app/(app)/layout.tsx` → `AppLayout` + `PermissionProvider`։

### Կլիենտ vs սերվեր

Շատ էջեր `'use client'` են (օրինակ՝ `apps/web/src/app/(app)/dashboard/page.tsx`)՝ բիզնես-լոգիկան React կոմպոնենտներում է (`apps/web/src/features/*`)։

### API կանչեր

- Axios ինստանս՝ `apps/web/src/lib/api.ts` (`baseURL: ''`, այսինքն նույն origin)։
- Interceptor-ը ավելացնում է `Authorization: Bearer <JWT>` (`resolveAuthToken`)։
- Բրաուզերում fallback՝ `getSession()` from `next-auth/react`։
- `PermissionProvider` (`apps/web/src/lib/permissions/PermissionContext.tsx`) կանչում է `GET /api/me`՝ թույլտվությունների քարտեզը բեռնելու համար։

---

## 3. Բեքենդ / սերվեր ճարտարապետություն

### Bootstrap

`apps/api/src/main.ts`.

- `app.setGlobalPrefix('api')` — բոլոր կոնտրոլերների ուղիները սկսվում են `/api/`-ով։
- Swagger՝ `/api/docs`։
- Helmet, CORS, `ValidationPipe` (whitelist, forbidNonWhitelisted)։
- Socket.IO adapter՝ `apps/api/src/socket-io.adapter.ts`։

### Գլոբալ guards (կարգը կարևոր է)

`apps/api/src/app.module.ts` մեջ `APP_GUARD` providers.

1. `AuthGuard` — JWT ստուգում, `@Public()` բացառություն (`apps/api/src/common/guards/auth.guard.ts`)։
2. `EmployeeGuard` — աշխատակցի տվյալներ + permissions cache (`apps/api/src/common/guards/employee.guard.ts`)։
3. `PermissionGuard` — fine-grained RBAC (`apps/api/src/common/guards/permission.guard.ts`)։

### Մոդուլներ

Բոլորը ներմուծված են `AppModule`-ում (CRM, Projects, Finance, Tasks, …) — ամբողջական ցուցակը տես նույն ֆայլը։

---

## 4. Routing կառուցվածք (Next)

| Խումբ    | Ճանապարհ                        | Նշանակություն               |
| -------- | ------------------------------- | --------------------------- |
| Հանրային | `/`                             | `apps/web/src/app/page.tsx` |
| Auth     | `/sign-in`, `/accept-invite`    | `apps/web/src/app/(auth)/`  |
| Հավելված | `/dashboard`, `/finance/...`, … | `apps/web/src/app/(app)/`   |

**Նշում.** Next.js `middleware.ts` **չի հայտնվել** `apps/web/` որոնման արդյունքում — սա ազդում է սերվերային route protection-ի վրա (մանրամասն՝ `06_AUTH_SECURITY_PERMISSIONS_HY.md`)։

---

## 5. API / տվյալների հոսք

### Proxy rewrite

`apps/web/next.config.ts`.

- `/api/auth/*` մնում է Next-ում (NextAuth)։
- `/api/:path` (որտեղ `path` չի սկսվում `auth`-ով) → `BACKEND_URL`-ի վրա նույն path-ով։

### Nest global prefix

`apps/api/src/main.ts` → `api` prefix, այսինքն բեքենդի ամբողջական URL-ը `http://host:4000/api/...`։

### NextAuth vs backend login path

`apps/web/src/auth.ts` կանչում է **`${BACKEND_URL}/api/v1/auth/login`** — այստեղ `v1` նախածանցը **ուղիղ է** backend-ին (Next rewrite-ը `/api/v1/...` նույնպես կարող է proxy անել, եթե BACKEND_URL դատարկ չէ)։

---

## 6. Տվյալների շերտ (database)

- Prisma սխեմա՝ `packages/database/prisma/schema.prisma`։
- Միգրացիաներ՝ `packages/database/prisma/migrations/`։
- Seed՝ `packages/database/prisma/seed.ts` և լրացուցիչ seed ֆայլեր (`seed-admin.ts`, `seed-rbac.ts`, …)։
- Package export՝ `packages/database/src/index.ts` → գեներացված `PrismaClient`։

---

## 7. Auth հոսք (կարճ)

1. Օգտվողը մուտք է գործում `sign-in` էջից (`apps/web/src/app/(auth)/sign-in/page.tsx`)՝ `signIn('credentials', …)`։
2. NextAuth `authorize` callback-ը POST է անում Nest login-ին (`apps/web/src/auth.ts`)։
3. Պատասխանից ստացված `accessToken` պահվում է JWT session-ում (NextAuth session strategy՝ `jwt`, `maxAge` 7 օր)։
4. Axios interceptor-ը Bearer token է կցում backend API կանչերին (`apps/web/src/lib/api.ts`)։
5. Nest `AuthGuard` վավերացնում է JWT `JWT_SECRET`-ով (`apps/api/src/common/guards/auth.guard.ts`, env՝ `.env.example`)։

---

## 8. Caching (եթե կա)

- **API մակարդակ.** `EmployeeGuard` ունի in-memory cache 60 վայրկյան TTL (`CACHE_TTL_MS` in `employee.guard.ts`)։
- **Redis / Upstash.** `.env.example` մեջ `UPSTASH_REDIS_REST_*` փոփոխականներն **նկարագրված են**, բայց այս փաստաթղթում **չենք քարտեզագրել** Redis-ի ճշգրիտ օգտագործման բոլոր կետերը առանց `apps/api/src` մեջ ioredis/upstash import-ների լրիվ սկանավորման — տես «Այս մասը հստակ չէ կոդից» նշումները `04_API_AND_DATA_FLOW_HY.md` կամ առանձին որոնում `grep` ioredis։

---

## 9. Ֆայլեր / մեդիա

`.env.example` նկարագրում է **Cloudflare R2** փոփոխականները (`R2_*`)։ Drive մոդուլը API-ում գտնվում է `apps/api/src/modules/drive/` (մանրամասն՝ `03_MODULES_DEEP_ANALYSIS_HY.md`)։

---

## 10. Build / deploy հոսք

- **Լոկալ dev.** `package.json` scripts՝ `pnpm dev` → `turbo dev` (երկու հավելված parallel)։
- **Web build.** `apps/web` → `next build`։
- **API build.** `apps/api` → `nest build`։
- **Արտադրություն.** `.env.example` մեկնաբանություններում նշված են Vercel (ֆրոնտ) և Render (API) որպես **նպատակային հոսթինգի օրինակներ** — սա փաստաթղթային է, ոչ թե CI ֆայլերից արդյունահանված։ Ռեպոյում `vercel.json` / `Dockerfile` **չի գտնվել** glob որոնմամբ։

---

## 11. Մոդուլների հաղորդակցում

```
features/*/components  →  lib/api/*.ts  →  axios /api/...
                              ↓
                    next.config rewrites
                              ↓
                    Nest Controller → Service → Prisma → DB
```

WebSocket (մեսենջեր)՝ `apps/web/src/features/messenger/useMessengerRealtime.ts` → `socket.io-client`։

---

## 12. Տեքստային «դիագրամ» (բարձր մակարդակ)

```
                    ┌─────────────────────┐
                    │   PostgreSQL (Neon) │
                    └──────────▲──────────┘
                               │ Prisma
                    ┌──────────┴──────────┐
                    │   NestJS API      │
                    │ Guards + Modules  │
                    └──────────▲──────────┘
                               │ HTTPS / WS
          ┌────────────────────┴────────────────────┐
          │            Next.js (Web)               │
          │  Pages + features + lib/api (axios)  │
          └────────────────────▲────────────────────┘
                               │
                          [Բրաուզեր]
```

---

## 13. Request lifecycle օրինակ

**Ենթադրություն.** Մուտք գործած օգտվողը բացում է «Tasks» էջը։

1. **Բրաուզերը** բեռնում է `/tasks` HTML/JS bundle-ը (`apps/web/src/app/(app)/tasks/page.tsx`)։
2. **React client** mount է լինում, `PermissionProvider` արդեն ունի session (NextAuth)։
3. **Ֆիչերի կոմպոնենտները** կանչում են API մեթոդներ `apps/web/src/lib/api/tasks.ts` (և հարակից) ֆայլերից։
4. **Axios** `GET /api/tasks` (կամ այլ endpoint)՝ `Authorization` header-ով (`apps/web/src/lib/api.ts`)։
5. **Next.js rewrite** forwards to `BACKEND_URL` (`apps/web/next.config.ts`)։
6. **Nest** `TasksController` (`apps/api/src/modules/tasks/tasks.controller.ts`) ստանում է հարցումը։
7. **AuthGuard** վավերացնում է JWT, **EmployeeGuard** բեռնում է permissions, **PermissionGuard** (եթե կա decorator) ստուգում է մոդուլը։
8. **TasksService** Prisma-ով կարդում է `Task` աղյուսակները։
9. **Պատասխանը** JSON է, `TransformInterceptor` ձևաչափում է envelope-ը (եթե կիրառվի) — տես `apps/api/src/common/interceptors/transform.interceptor.ts`։
10. **Axios response interceptor** `response.data.data`-ից դուրս է բերում `data` (`apps/web/src/lib/api.ts`)։
11. **UI** ցուցադրում է ցուցակը/տախտակը։

---

_Հիմք՝ վերը նշված ֆայլերի ուղիղ ընթերցում, 2026-05-01։_
