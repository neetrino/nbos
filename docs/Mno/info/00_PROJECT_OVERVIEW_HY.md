# NBOS — Նախագծի ընդհանուր պատկեր (սկսնակի համար)

> Այս փաստաթուղթը հիմնված է **օբյեկտիվորեն ստուգված** ֆայլերի վրա (`package.json`, `apps/*`, `packages/*`, `docs/IMPLEMENTATION_PROGRESS.md`, `.env.example`)։ Այն **չի փոխարինում** `docs/NBOS/` կամ `docs/01-ARCHITECTURE.md` մեջ եղած ռուսերեն/անգլերեն ավելի մանրամասն բիզնես-կանոնը, այլ տալիս է **նոր միացած մշակողի** համար հայերեն մուտքի կետ։

---

## Ինչ է այս նախագիծը

**NBOS (Neetrino Business Operation System)** — ներքին գործառնական համակարգ է IT-ընկերության համար. Մոնորեպոյի անունը և նկարագրությունը տրված են արմատային `package.json` ֆայլում՝ `"NBOS Platform — Business Operation System"`։

Ընդհանուր նպատակը (կոդի կառուցվածքից և գոյություն ունեցող `docs/01-ARCHITECTURE.md` նկարագրությունից)՝ **միավորել** CRM, նախագծեր, ֆինանսներ, առաջադրանքներ, աջակցություն, ֆայլեր, հավատարմագրեր, հաղորդակցություն, հաշվետվություններ և այլն **մեկ платфорմայում**, որտեղ կենտրոնական հասկացությունը **Project (նախագիծ)** է։

---

## Ինչ բիզնես/դոմեյն խնդիր է լուծում

- **Վաճառքից մինչև առաքում**՝ լիդեր, գործարքներ, հաճախորդներ, պայմանագրային հոսքեր (`packages/database/prisma/schema.prisma` մեջ `Lead`, `Deal`, `Contact`, `Company`, `Project`)։
- **Գումարային հոսք**՝ պատվերներ, հաշիվներ, վճարումներ, բաժանորդագրություններ, ծախսեր, բոնուսներ, աշխատավարձի գործարկումներ (`Order`, `Invoice`, `Payment`, `Subscription`, `Expense`, `BonusEntry`, `PayrollRun` և այլն)։
- **Առաքման օպերացիա**՝ արտադրանքներ, ընդլայնումներ, առաջադրանքների տախտակներ, աջակցության տոմսեր (`Product`, `Extension`, `Task`, `SupportTicket`)։
- **Գիտելիք և ֆայլեր**՝ փաստաթղթեր, Drive, հավատարմագրեր (`Document`, `FileAsset`, `Credential`)։
- **Հաղորդակցություն**՝ մեսենջեր, փոստ, ծանուցումներ (`Messenger*`, `Mail*`, `InAppNotification`)։

---

## Հիմնական օգտվողի դերեր (RBAC)

Դերերը և թույլտվությունները **կոդում** արտահայտված են Prisma մոդելներով՝ `Employee`, `Role`, `Permission`, `RolePermission`, `Department`, `EmployeeDepartment` (`packages/database/prisma/schema.prisma`)։ NestJS API-ում `EmployeeGuard` լրացնում է `request.user` թույլտվությունների քարտեզով (`apps/api/src/common/guards/employee.guard.ts`), իսկ `PermissionGuard` ստուգում է `@RequirePermission` դեկորատորով նշված գործողությունները (`apps/api/src/common/guards/permission.guard.ts`)։

Ֆրոնտում նավիգացիան ֆիլտրվում է `usePermission()`-ով (`apps/web/src/components/layout/Sidebar.tsx`, `apps/web/src/lib/permissions/PermissionContext.tsx`)։

---

## Հիմնական ֆունկցիաներ (ըստ UI երթուղիների)

Next.js App Router երթուղիները գտնվում են `apps/web/src/app/(app)/` ներքո. Օրինակներ՝

- `dashboard`, `reports`, `crm/*`, `marketing/*`, `projects`, `tasks`, `work-spaces`
- `finance/*` (ինվոյսներ, վճարումներ, բաժանորդագրություններ, ծախսեր, աշխատավարձ և այլն)
- `clients`, `partners`, `support`, `credentials`, `drive`, `documents`, `messenger`, `mail`, `calendar`, `notifications`, `settings/*`, `my-company/*`, `my-account`, `team`, `bonus`, `expenses`

Ամբողջական ցուցակը տես `apps/web/src/app/(app)/` թղթապանակի ֆայլային ծառում։

---

## Նախագծի հասունության մակարդակ

`docs/IMPLEMENTATION_PROGRESS.md` (վերջին թարմացում՝ **2026-04-30**) նշում է.

- Փուլեր 1–6՝ **ավարտված** որպես P0/MVP շրջանակ։
- **Phase 7 — Integrations / migration**՝ **ընթացքում**, նախնական gate-ը ավտոմատ ստուգումներն անցել են, **ձեռքով browser smoke** դեռ պահանջվում է։

Այսինքն՝ **արտադրական միջավայրում** շարունակելուց առաջ պետք է հաստատել QA չեկլիստը (`docs/PHASE_7_PRECHECK_MANUAL_QA.md`՝ նշված է progress ֆայլում)։

---

## Ինչը կարծես պատրաստ է արտադրության համար

- **API շերտ**՝ NestJS մոդուլային կառուցվածք, գլոբալ `ValidationPipe`, Helmet, CORS, Throttler, Swagger (`apps/api/src/main.ts`, `apps/api/src/app.module.ts`)։
- **Տվյալների շերտ**՝ Prisma սխեմա + մեծ թվով միգրացիաներ `packages/database/prisma/migrations/`։
- **Աուդիտ և անվտանգության հիմք**՝ JWT + guards, RBAC, seed սկրիպտեր (`packages/database/prisma/seed*.ts`)։
- **Թեստերի ենթակառուցվածք**՝ Vitest արմատային `vitest.config.ts` (ներառում է `apps/**/*.test.ts`, `packages/**/*.test.ts`)։

---

## Ինչը կարծես անավարտ կամ ռիսկային է

- **Next.js middleware բացակայում է** `apps/web/` մեջ (`middleware.ts` չի գտնվել), մինչդեռ `apps/web/src/proxy.ts` ֆայլը սահմանում է auth proxy, բայց **ոչ մի import չի գտնվել** այդ ֆայլից — տես `09_BUGS_RISKS_AND_FIX_PLAN_HY.md`։
- **Լենդինգի `/sign-up` հղում** առկա է `apps/web/src/app/page.tsx` մեջ, սակայն **`sign-up` երթուղու ֆայլ չկա** `apps/web/src/app/` մեջ — կիսատ/կոտրված UX։
- **Ֆրոնտի package.json**-ում `@tanstack/react-query` և `zustand` կախվածություններ կան, բայց `apps/web/src` մեջ **import չի գտնվել** — հավանաբար չօգտագործված կամ ապագայի համար։

---

## Ինչ պետք է հասկանա նոր մշակողը առաջին հերթին

1. **Մոնորեպո**՝ `pnpm` + `turbo` (`package.json`, `pnpm-workspace.yaml`, `turbo.json`)։
2. **Երկու ռանթայմ**՝ Next.js (`apps/web`) + NestJS (`apps/api`)։
3. **API proxy**՝ `apps/web/next.config.ts` rewrite-ը `/api/*` (բացառությամբ `/api/auth/*`) ուղարկում է `BACKEND_URL` Nest սերվերին։
4. **Մուտք**՝ NextAuth (`apps/web/src/auth.ts`) → Nest `POST /api/v1/auth/login` (`apps/api/src/modules/auth/auth.controller.ts`)։
5. **Տվյալների բազա**՝ PostgreSQL + Prisma (`packages/database/prisma/schema.prisma`)։

---

## Բարձր մակարդակով քարտեզ

```
[Բրաուզեր] → Next.js (apps/web, պորտ 3000)
                 ├─ /api/auth/*  → NextAuth route (apps/web/src/app/api/auth/[...nextauth]/route.ts)
                 └─ /api/*       → rewrite → Nest (apps/api, պորտ 4000, global prefix "api")
                                      └─ Prisma → PostgreSQL (Neon, DATABASE_URL)
```

---

## Ինչ հերթականությամբ ուսումնասել նախագիծը

1. `package.json` (արմատ) + `apps/web/package.json` + `apps/api/package.json` + `packages/database/package.json`
2. `docs/IMPLEMENTATION_PROGRESS.md` + `docs/01-ARCHITECTURE.md` (տեխնիկական մանրամասնություն)
3. `apps/web/next.config.ts` + `apps/web/src/auth.ts` + `apps/web/src/lib/api.ts`
4. `apps/api/src/main.ts` + `apps/api/src/app.module.ts`
5. `packages/database/prisma/schema.prisma` (ընտրովի՝ բաժին-բաժին, ֆայլը մեծ է)
6. `apps/web/src/app/(app)/` երթուղիներ + `apps/web/src/features/` մոդուլներ
7. `apps/api/src/modules/*` համապատասխան կոնտրոլերներ

---

## Կապ այլ փաստաթղթերի հետ

| Ֆայլ                                         | Նպատակ                        |
| -------------------------------------------- | ----------------------------- |
| `docs/me/01_ARCHITECTURE_FOR_BEGINNER_HY.md` | Ստեկ, հոսք, request lifecycle |
| `docs/me/02_PROJECT_STRUCTURE_HY.md`         | Թղթապանակների բացատրություն   |
| `docs/me/03_MODULES_DEEP_ANALYSIS_HY.md`     | Մոդուլ-մոդուլ վերլուծություն  |

---

_Ստեղծվել է 2026-05-01-ին՝ NBOS ռեպոզիտորիայի ֆայլերի ուղիղ ստուգման հիման վրա։_
