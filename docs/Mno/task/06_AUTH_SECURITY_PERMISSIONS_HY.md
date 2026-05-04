# Աուտենտիֆիկացիա, անվտանգություն, թույլտվություններ (NBOS)

> **Խիստ վերլուծություն**՝ ըստ ֆայլերի։ Եթե ինչ-որ մասը չի ապացուցված runtime թեստով, նշված է որպես ռիսկ, ոչ թե որպես «CVE»։

---

## 1. Աուտենտիֆիկացիայի մեխանիզմ

### Web (NextAuth / Auth.js v5 beta)

- Կոնֆիգ՝ `apps/web/src/auth.ts`։
- Provider՝ **Credentials** (email/password)։
- `authorize` callback-ը **server-side** `fetch` է անում `POST ${BACKEND_URL}/api/v1/auth/login`։
- Session strategy՝ **JWT** (`session: { strategy: 'jwt', maxAge: 7 օր }`)։
- NextAuth route՝ `apps/web/src/app/api/auth/[...nextauth]/route.ts`։

### Backend (NestJS JWT)

- `AuthGuard` (`apps/api/src/common/guards/auth.guard.ts`) ստուգում է `Authorization: Bearer` header-ը և `jwt.verify(token, JWT_SECRET)`։
- JWT payload-ում `sub` → որպես `employeeId` է օգտագործվում (`AuthGuard` մեջ `request.user`)։

---

## 2. Session vs access token սահմանում

- **NextAuth session JWT** — գաղտնաբառը `AUTH_SECRET` (`.env.example`)։
- **Backend access JWT** — `JWT_SECRET`, `JWT_EXPIRES_IN` (`.env.example`)։

**Ռիսկային հատված**՝ երկու տարբեր գաղտնաբառ — production deploy-ում **պետք է երկուսն էլ** ուժեղ պատահական արժեքներ լինեն։ Եթե `JWT_SECRET` թույլ լինի, token forge-ը հնարավոր է։

---

## 3. Middleware և route protection

### Ինչ է գտնվել

- `apps/web/src/proxy.ts` export-ում է `proxy = auth((req) => { ... })` NextAuth middleware pattern-ով **public paths** whitelist-ով։
- **Սակայն** `apps/web/middleware.ts` **չի գտնվել** repo որոնմամբ, և `proxy.ts` **ոչ մի import չունի** այլ ֆայլերից (grep արդյունք՝ միայն self + next.config մեկնաբանություն)։

### Արդյունք

- **Ռիսկային հատված**՝ Next.js App Router-ի **սերվերային route protection** default middleware-ով **ակտիվ չէ** այնպես, ինչպես սպասվում է `proxy.ts` ֆայլից։
- Ֆրոնտի պաշտպանությունը հիմնականում ապավինում է **կլիենտային session** + API guard-ներին։
- **Հետևանք**՝ չմուտք գործած օգտվողը կարող է բեռնել հավելվածի client bundle-ը և նվազագույն UI shell-ը (եթե էջերը չեն կանչում `auth()` server-side)։ **Տվյալների լուրջ արտահոսքը** կանխվում է backend permission-ներով, բայց **attack surface**-ը մեծ է (enumeration, UX confusion)։

---

## 4. RBAC

- Backend՝ `EmployeeGuard` լրացնում է `permissions` map, `PermissionGuard` ստուգում է `@RequirePermission` (`apps/api/src/common/guards/permission.guard.ts`)։
- Frontend՝ `PermissionProvider` + `usePermission()` (`apps/web/src/lib/permissions/PermissionContext.tsx`, `Sidebar.tsx`)։

**Ռիսկ**՝ frontend-ը միշտ կարող է շրջանցվել — **ճշմարտության աղբյուրը backend-ն է**։ Սա ճիշտ է, բայց պետք է **ոչ մի public endpoint** չտա զգայուն տվյալ առանց auth։

---

## 5. Admin / հրավերներ

- Admin bootstrap seed՝ `.env.example` մեջ `ADMIN_EMAIL` / `ADMIN_PASSWORD` + հրաման `pnpm --filter @nbos/database run seed:admin`։
- Invite API՝ `auth.controller.ts` public endpoints։

**Ռիսկային հատված**՝ invite token-ների կյանքի տևողություն/try rate — **պետք է ստուգել** `auth.service.ts` implementation (այս փաստաթղթում չենք ընթերցել ամբողջ service-ը)։

---

## 6. API protection

- Գլոբալ guards `app.module.ts`։
- `@Public()` decorator-ով endpoint-ներ բաց են (`health`, `auth`, …)։

---

## 7. Environment գաղտնիքներ

`.env.example` ցուցակում.

- `AUTH_SECRET`, `JWT_SECRET`, `DATABASE_URL`, `DIRECT_URL`, `CREDENTIALS_ENCRYPTION_KEY`, `R2_*`, `RESEND_API_KEY`, …

**Ռիսկ**՝ default placeholder արժեքներ production-ում → **կրիտիկալ**։

---

## 8. Client/server boundary

- `apps/web/src/lib/api.ts` server-side token resolve-ը limited է (տես `04_API_AND_DATA_FLOW_HY.md`)։

---

## 9. Եզրակացություն և խիստ առաջարկներ

1. **Ավելացնել** `apps/web/middleware.ts`, որը re-export անի `proxy`-ի լոգիկան **կամ** ջնջել/փաստաթղթավորել `proxy.ts`-ը որպես dead code։
2. **Ստուգել** բոլոր `@Public()` controller-ների ցանկը Swagger-ով։
3. **Ավելացնել** `/sign-up` route կամ հանել հղումը լենդինգից։
4. **Սերտ password policy** և account lockout (եթե չկա)՝ `auth` service audit։
5. **Observability** (Sentry optional env)՝ production-ում։

---

_Հիմք՝ `auth.ts`, `app.module.ts`, guards, `proxy.ts`, middleware absence search, `.env.example`, 2026-05-01։_
