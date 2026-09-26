# Սկսնակ մշակողի onboarding (NBOS)

---

## 1. Ինչ գործիքներ են պետք

- **Node.js**՝ `>=22 <23` (արմատային `package.json` `engines`)։
- **pnpm**՝ `>=8` (`packageManager` field pnpm@8.15.0)։
- **Git**։
- (Խորհուրդ) **PostgreSQL** հասանելիություն Neon remote-ով, կամ տեղական instance Prisma migrate-ի համար։

---

## 2. Տեղադրում

```bash
pnpm install
```

Արմատից, monorepo workspace-ով։

---

## 3. Environment փոփոխականներ

1. Պատճենել `.env.example` → **monorepo արմատի** `.env.local` (նշված է `prisma.config.ts` dotenv path-ով `../../.env.local`)։
2. Լրացնել առնվազն.
   - `DATABASE_URL`, `DIRECT_URL`
   - `AUTH_SECRET`, `JWT_SECRET`
   - `CREDENTIALS_ENCRYPTION_KEY` (եթե աշխատում եք credentials-ով)
   - Cloudflare R2 / Resend keys ըստ անհրաժեշտության

Մանրամասն նկարագրություն՝ `d:\NBOS\.env.example`։

---

## 4. Տվյալների բազա

```bash
pnpm db:migrate
pnpm db:seed
# կամ ադմին seed
pnpm --filter @nbos/database run seed:admin
```

Սկրիպտները արմատային `package.json`-ից։

---

## 5. Լոկալ աշխատեցում

```bash
pnpm dev
```

Սա `turbo dev` հրամանով միաժամանակ աշխատացնում է **երկու** հավելված (web + api) parallel։ Web default՝ port **3000** (`apps/web/package.json`), API՝ **4000** (`apps/api/src/main.ts` default)։

---

## 6. Build

```bash
pnpm build
```

Turbo pipeline — կախված package scripts-ից։

---

## 7. Թեստեր

```bash
pnpm test
pnpm test:coverage
```

Ներառում է `apps/**/*.test.ts` և `packages/**/*.test.ts` (`vitest.config.ts`)։

---

## 8. Lint / format / typecheck

```bash
pnpm lint
pnpm typecheck
pnpm format
```

---

## 9. Նախագիծը քայլ առ քայլ ինչպես հասկանալ

1. Կարդալ `docs/me/00_PROJECT_OVERVIEW_HY.md` (այս փաթեթ)։
2. Կարդալ repo-ի `docs/IMPLEMENTATION_PROGRESS.md`։
3. Բացել Swagger `http://localhost:4000/api/docs` API-ի համար։
4. Ընտրել մեկ feature `apps/web/src/features/<x>` և համապատասխան `apps/api/src/modules/<x>`։

---

## 10. Որ ֆայլերը կարդալ **առաջինը**

| Հերթ | Ֆայլ                                                   |
| ---- | ------------------------------------------------------ |
| 1    | `package.json` (արմատ)                                 |
| 2    | `apps/web/next.config.ts`                              |
| 3    | `apps/web/src/auth.ts` + `apps/web/src/lib/api.ts`     |
| 4    | `apps/api/src/main.ts` + `app.module.ts`               |
| 5    | `packages/database/prisma/schema.prisma` (բաժին-բաժին) |

---

## 11. Որ մոդուլներին **չեզոք մոտենալ** առաջին շաբաթվա համար

- **Credentials encryption** — սխալ փոփոխում կարող է կորցնել գաղտնի տվյալներ։
- **Finance posting / invoices** — ֆինանսական consistency։
- **RBAC seed / permissions keys** — կարող է կողպել բոլորին։

---

## 12. Անվտանգ աշխատանքային հոսք

1. Ստեղծել feature branch։
2. Փոքր PR-ներ։
3. Թեստ + typecheck տեղական։
4. Սինխրոնացնել migrations-ը, եթե դիպել եք schema-ին։

---

## 13. Տարած սխալներ

- **Մոռանալ `.env.local` monorepo արմատում** — Prisma չի գտնի `DIRECT_URL`։
- **Խառնել** `BACKEND_URL` production vs local NextAuth server fetch։
- **Կարծել թե `/api/*` Next route է** — մեծ մասը proxy է Nest-ին։

---

## 14. Դեբագ

- API log՝ console `main.ts`։
- Web՝ browser network tab → տեսեք արդյոք `/api/...` 400/401։
- Prisma՝ `pnpm db:studio`։

---

## 15. Նոր ֆիչեր ավելացնելու անվտանգ քայլեր

1. Prisma schema + migration (եթե պետք է DB)։
2. Nest module service + controller + DTO + tests։
3. Web `lib/api/<x>.ts` + feature UI։
4. Sidebar nav entry + permission key համաձայնեցում։

---

## 16. Bug ուղղելու անվտանգ քայլեր

1. Վերարտադրել minimal case։
2. Գտնել controller/service line։
3. Ավելացնել regression test API package-ում (եթե հնարավոր է)։
4. Չփոխել Prisma schema առանց migration-ի։

---

_Հիմք՝ package scripts, config ֆայլեր, vitest config, 2026-05-01։_
