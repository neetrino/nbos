# Bugs, ռիսկեր և ուղղման պլան (NBOS)

Յուրաքանչյուր տողը հիմնված է **ստուգված ֆայլերի** վրա։ «Հնարավոր bug» = բարձր հավանականություն, բայց runtime թեստ չի արվել այս սեսիայում։

---

## R1. Next.js middleware բացակայում, `proxy.ts` չի միացված

|                            |                                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Ֆայլեր**                 | `apps/web/src/proxy.ts`, **բացակայում**՝ `apps/web/middleware.ts`                                       |
| **Ինչ է սխալ**             | Auth-based route gating Next middleware layer-ով **չի ակտիվացված** repo-ում։                            |
| **Ինչու է ռիսկային**       | Չմուտք գործած օգտվողը կարող է հասնել client-heavy route-ներին, bundle բեռնել, callbackUrl manipulation։ |
| **Ինչպես կոտրվի նախագիծը** | Տվյալների գաղտնիությունը հիմնականում backend guard-ներով է պահվում, բայց **security posture** թուլ է։   |
| **Վերարտադրում**           | Բացել `/dashboard` առանց session (կախված Next caching / client navigation-ից) և դիտարկել վարքը։         |
| **Ուղղում**                | Ստեղծել `apps/web/middleware.ts` export `proxy` կամ ներմուծել auth wrapper-ը Next docs-ի համաձայն։      |
| **Ինչ չփոխել**             | Չջնջել `auth.ts` session callbacks-ը միանգամից — փոքր քայլերով։                                         |
| **Առաջնահերթություն**      | **Critical**                                                                                            |

---

## R2. `/sign-up` հղում առանց route

|                       |                                                                                               |
| --------------------- | --------------------------------------------------------------------------------------------- |
| **Ֆայլեր**            | `apps/web/src/app/page.tsx` (link to `/sign-up`), `apps/web/src/app/` (**sign-up route չկա**) |
| **Ինչ է սխալ**        | 404 / վատ first impression։                                                                   |
| **Ռիսկ**              | Onboarding funnel կոտրված է։                                                                  |
| **Ուղղում**           | Ավելացնել sign-up flow կամ redirect դեպի `accept-invite` / contact sales։                     |
| **Չփոխել**            | Auth backend contract-ը առանց անհրաժեշտության։                                                |
| **Առաջնահերթություն** | **Medium**                                                                                    |

---

## R3. `PermissionContext` լուռ սխալներ `/api/me`-ում

|                       |                                                                               |
| --------------------- | ----------------------------------------------------------------------------- |
| **Ֆայլեր**            | `apps/web/src/lib/permissions/PermissionContext.tsx` (`catch { /* noop */ }`) |
| **Ինչ է սխալ**        | API failure դեպքում permissions դատարկ են, առանց user-visible error։          |
| **Ռիսկ**              | Օգտվողը մտածում է, որ պարզապես «չունի իրավունք», իրականում network/500 է։     |
| **Ուղղում**           | Սահմանել error state + toast (`sonner` dependency կա)։                        |
| **Չփոխել**            | Backend permission key format-ը։                                              |
| **Առաջնահերթություն** | **Medium**                                                                    |

---

## R4. SSR / axios token բացակայություն

|                       |                                                                                   |
| --------------------- | --------------------------------------------------------------------------------- |
| **Ֆայլեր**            | `apps/web/src/lib/api.ts` (`typeof window === 'undefined' return null`)           |
| **Ռիսկ**              | Եթե ապագայում server component-ներ direct axios կանչեն, դրանք **անանուն** կլինեն։ |
| **Ուղղում**           | Pass server session token explicit կամ օգտագործել `auth()` helper Next-ից։        |
| **Առաջնահերթություն** | **Medium** (future)                                                               |

---

## R5. Unused dependencies (web)

|                       |                                                              |
| --------------------- | ------------------------------------------------------------ |
| **Ֆայլեր**            | `apps/web/package.json` (`@tanstack/react-query`, `zustand`) |
| **Ռիսկ**              | Bundle bloat / confusion / supply chain surface։             |
| **Ուղղում**           | Հեռացնել կամ իրականում ինտեգրել։                             |
| **Առաջնահերթություն** | **Low**                                                      |

---

## R6. Build / env ռիսկեր

|                       |                                                                  |
| --------------------- | ---------------------------------------------------------------- |
| **Ֆայլեր**            | `.env.example`, `turbo.json` globalDependencies `**/.env.*local` |
| **Ռիսկ**              | Սխալ `JWT_SECRET` / `AUTH_SECRET` production deploy-ում։         |
| **Ուղղում**           | Secret scanning CI, required env checklist pre-deploy։           |
| **Առաջնահերթություն** | **High** production-ի համար                                      |

---

## R7. Hydration ռիսկ (ընդհանուր)

|                       |                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------ |
| **Նշում**             | `layout.tsx` ունի `suppressHydrationWarning` on `<html>` — հաճախ theme/font related։ |
| **Ռիսկ**              | Եթե ապագայում client-only data mixed SSR-ով, hydration mismatch։                     |
| **Ուղղում**           | Թեմայի provider pattern Next docs։                                                   |
| **Առաջնահերթություն** | **Low** մինչև ապացուցված խնդիր                                                       |

---

## R8. Caching / permission delay

|                       |                                                                      |
| --------------------- | -------------------------------------------------------------------- |
| **Ֆայլեր**            | `apps/api/src/common/guards/employee.guard.ts` (60s cache)           |
| **Ռիսկ**              | Role permission փոփոխությունից հետո մինչև 1 րոպե stale access։       |
| **Ուղղում**           | Invalidation hook admin UI-ում կամ կրճատել TTL / redis shared cache։ |
| **Առաջնահերթություն** | **Low/Medium**                                                       |

---

## R9. Database migration conflict

|                       |                                                      |
| --------------------- | ---------------------------------------------------- |
| **Ֆայլեր**            | `packages/database/prisma/migrations/*` (մեծ թվով)   |
| **Ռիսկ**              | Թիմային parallel migration-ներ conflict։             |
| **Ուղղում**           | Migration ownership կանոն, `migrate dev` discipline։ |
| **Առաջնահերթություն** | **Medium**                                           |

---

## R10. Deployment config բացակայում repo-ում

|                       |                                                                 |
| --------------------- | --------------------------------------------------------------- |
| **Ֆայլեր**            | `vercel.json`, `Dockerfile` չեն գտնվել glob-ով                  |
| **Ռիսկ**              | Նոր DevOps-ը չգիտի ինչպես deploy անի առանց արտաքին փաստաթղթերի։ |
| **Ուղղում**           | Ավելացնել IaC կամ README deploy բաժին (առանձին task)։           |
| **Առաջնահերթություն** | **Medium**                                                      |

---

_Հիմք՝ ֆայլային ստուգումներ և կարդացված կոդ, 2026-05-01։_
