# Նախագծի ֆայլային կառուցվածք (NBOS) — սկսնակի համար

Այս փաստաթուղթը **չի կրկնում** ամբողջական `tree` ելքը (այն շատ մեծ կլինի `.next` և `node_modules` պատճառով), այլ բացատրում է **ինչ ինչի համար է**։

---

## Արմատային մակարդակ (`d:\NBOS\`)

| Ֆայլ / թղթապանակ      | Նպատակ                                                                  |
| --------------------- | ----------------------------------------------------------------------- |
| `package.json`        | Monorepo սկրիպտեր (`turbo dev/build`, `vitest`, db հրամաններ)։          |
| `pnpm-workspace.yaml` | Workspace packages՝ `apps/*`, `packages/*`։                             |
| `turbo.json`          | Turbo cache, build outputs (`.next/**`, `dist/**`)։                     |
| `vitest.config.ts`    | Թեստերի include patterns, coverage include/exclude։                     |
| `.env.example`        | Բոլոր կարևոր env փոփոխականների նկարագրություն (պատճենել `.env.local`)։  |
| `apps/`               | Ռանթայմ հավելվածներ (web, api)։                                         |
| `packages/`           | Համօգտագործվող գրադարաններ (database, shared, tsconfig, eslint-config)։ |
| `docs/`               | Նախագծի փաստաթղթեր (ռուս/անգլերեն հանրագիտարան + phase plans)։          |
| `docs/me/`            | **Այս հայերեն փաթեթը** (սկսնակի onboarding)։                            |

**Մաքրություն.** Կառուցվածքը **տրամաբանական monorepo** է։ Անհամապատասխանություններ՝ օր. Next-ում `proxy.ts` առանց `middleware.ts` կապի (մանրամասն՝ այլ փաստաթուղթ)։

---

## `apps/web/` — Next.js ֆրոնտ

| Ենթաթղթապանակ                             | Նպատակ                                                    |
| ----------------------------------------- | --------------------------------------------------------- |
| `src/app/`                                | App Router երթուղիներ, layout-ներ, `page.tsx`։            |
| `src/app/api/auth/[...nextauth]/route.ts` | NextAuth HTTP handlers export։                            |
| `src/features/`                           | Դոմեյն-կենտրոնացված UI + լոգիկա (crm, finance, tasks, …)։ |
| `src/components/`                         | Կիսել layout, ui primitives, shared widgets։              |
| `src/lib/`                                | `api.ts`, permissions, utils, API client մոդուլներ։       |
| `public/`                                 | Ստատիկ ակտիվներ (օր. `logo/`)։                            |
| `next.config.ts`                          | Rewrites/proxy դեպի backend։                              |
| `.next/`                                  | Build artifact (git-ում սովորաբար ignore)։                |

**Անունների նշումներ.** Երթուղին `work-spaces` (defis), API path-ը `tasks/work-spaces` — տարբեր delimiter-ների օրինակ է, պետք է չշփոթել։

---

## `apps/api/` — NestJS բեքենդ

| Ենթաթղթապանակ            | Նպատակ                                                 |
| ------------------------ | ------------------------------------------------------ |
| `src/main.ts`            | Bootstrap, global prefix, swagger, pipes։              |
| `src/app.module.ts`      | Բոլոր domain module-ների գրանցում, global guards։      |
| `src/modules/*`          | Յուրաքանչյուր բիզնես տիրույթ (crm, finance, tasks, …)։ |
| `src/common/`            | Guards, decorators, filters, interceptors։             |
| `src/database.module.ts` | Prisma client provider (նշված է import-ներից)։         |
| `dist/`                  | `nest build` արդյունք (եթե առկա է)։                    |

---

## `packages/database/` — Prisma + DB

| Ֆայլ / թղթապանակ        | Նպատակ                                            |
| ----------------------- | ------------------------------------------------- |
| `prisma/schema.prisma`  | Մոդելներ, enums, կապեր։                           |
| `prisma/migrations/`    | SQL միգրացիաների պատմություն։                     |
| `prisma/seed*.ts`       | Սկզբնական տվյալներ, RBAC, ադմին։                  |
| `src/index.ts`          | Package public exports (`PrismaClient`, types)։   |
| `src/generated/prisma/` | `prisma generate` արդյունք (մեծ, auto-generated)։ |

---

## `packages/shared/` — համօգտագործվող TypeScript

`packages/shared/src/` — `constants`, `schemas` (Zod), `types`, `partner-deal-finance` և այլն։ Օգտագործվում է web և api package.json workspace dependency-ներով։

---

## `packages/tsconfig/` և `packages/eslint-config/`

Համաձայնեցված TypeScript և ESLint կոնֆիգներ monorepo package-ների համար։

---

## `docs/` — փաստաթղթային արբանյութ

- `docs/NBOS/` — ակտիվ բիզնես/պլատֆորմ կանոն (ռուսերեն/խառը)։
- `docs/01-ARCHITECTURE.md` — տեխնիկական ճարտարապետության ամփոփում։
- `docs/IMPLEMENTATION_PROGRESS.md` — ֆազերի կարգավիճակ։
- `docs/reference/` — վճարային ինտեգրացիաների reference, security checklist-ներ։
- `docs/archive/` — արխիվ, **ոչ միայնակ ճշմարտության աղբյուր**։

---

## Թղթապանակների «մաքրության» գնահատում

| Տարածք                  | Գնահատում                                                           |
| ----------------------- | ------------------------------------------------------------------- |
| `apps/api/src/modules`  | Կարգավորված domain-driven։                                          |
| `apps/web/src/features` | Մեծ, բայց feature-based, ընդունելի monolith-frontend pattern։       |
| Գեներացված Prisma       | Մեծ ֆայլեր — նորմալ, չխմբագրել ձեռքով։                              |
| `apps/web/src/proxy.ts` | **Կասկածելի**՝ առանց Next middleware կապի (տես ռիսկերի փաստաթուղթ)։ |

---

## Կրկնված / սխալ տեղադրված լոգիկա

Այս վերլուծության ընթացքում **կոդ չենք refactor անելու**, միայն նկատառումներ.

- API client-ի նման ֆայլեր բազմաթիվ են `apps/web/src/lib/api/*.ts` — սա **կանխամտածված բաժանում է**, ոչ թե անպետան dupe։
- **Կիսատ իրականացում**՝ `apps/web/src/proxy.ts` auth wrapper, որը **չի միացվել** Next middleware-ին (որոնում `middleware.ts`՝ արդյունք չկա)։

---

_Հիմք՝ ֆայլային համակարգի ուղիղ դիտարկում, 2026-05-01։_
