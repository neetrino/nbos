# Ընթացիկ կարգավիճակի հաշվետվություն (NBOS)

Աղբյուրներ՝ `docs/IMPLEMENTATION_PROGRESS.md` (վերջին թարմացում **2026-04-30**), monorepo կոդի կառուցվածք, արագ ֆայլային ստուգումներ։

---

## Ավարտված ֆիչերներ (փաստաթղթային gate)

| Վերնագիր               | Կարգավիճակ | Կապված ֆայլեր / տեղեր                                                              | Բացատրություն                       | Ծանրություն |
| ---------------------- | ---------- | ---------------------------------------------------------------------------------- | ----------------------------------- | ----------- |
| Պլատֆորմի shell + RBAC | Done       | `apps/web` layout, `apps/api` guards, Prisma RBAC models                           | Նավիգացիա և թույլտվությունների հիմք | —           |
| CRM / Marketing        | Done       | `apps/api/src/modules/crm`, `marketing`, web routes                                | Progress Phase 2                    | —           |
| Finance core           | Done       | `apps/api/src/modules/finance`, `expenses`, web `finance/*`                        | Phase 3 gate                        | —           |
| Delivery ops           | Done       | projects/products/extensions/tasks/support                                         | Phase 4                             | —           |
| Collaboration P0       | Done       | drive, documents, mail, messenger, calendar, notifications, credentials, technical | Phase 5                             | —           |
| Control layer P0       | Done       | dashboard, reports foundation                                                      | Phase 6                             | —           |

---

## Կիսատ իրականացում

| Վերնագիր                   | Կարգավիճակ     | Ֆայլեր                                             | Ինչու կիսատ                           | Ծանրություն |
| -------------------------- | -------------- | -------------------------------------------------- | ------------------------------------- | ----------- |
| Phase 7 integrations       | In progress 0% | `docs/IMPLEMENTATION_PROGRESS.md`                  | Միգրացիայի/ինտեգրացիաների հաջորդ փուլ | Medium      |
| Next auth route middleware | Partial        | `apps/web/src/proxy.ts` առանց `middleware.ts`      | Dead / unconnected protection         | **High**    |
| Sign up CTA                | Partial        | `apps/web/src/app/page.tsx` → `/sign-up` route չկա | Տարօրինակ UX                          | Medium      |
| TanStack Query / Zustand   | Partial        | `apps/web/package.json` deps, grep չկա `src`-ում   | Հավանաբար չօգտագործված                | Low         |

---

## Բացակայող ֆիչերներ (կոդից երևացող)

| Վերնագիր            | Կարգավիճակ | Ֆայլեր                           | Բացատրություն       | Ծանրություն |
| ------------------- | ---------- | -------------------------------- | ------------------- | ----------- |
| Public sign-up page | Not done   | `apps/web/src/app` (չկա sign-up) | Հղում կա, route չկա | Medium      |

---

## Կոտրված կամ կասկածելի

| Վերնագիր                 | Կարգավիճակ | Ֆայլեր                  | Բացատրություն                       | Ծանրություն |
| ------------------------ | ---------- | ----------------------- | ----------------------------------- | ----------- |
| Silent `/api/me` failure | Suspicious | `PermissionContext.tsx` | Permissions fallback առանց error UX | Medium      |

---

## Տեխնիկական պարտք

| Վերնագիր              | Ֆայլեր                            | Խորհուրդ                       |
| --------------------- | --------------------------------- | ------------------------------ |
| Մեծ Sidebar           | `Sidebar.tsx`                     | Refactor config split          |
| Unused deps           | `apps/web/package.json`           | Audit remove                   |
| Prisma generated size | `packages/database/src/generated` | Նորմալ, բայց CI cache strategy |

---

## Performance ռիսկեր

- Մեծ client bundles feature-heavy էջերում։
- EmployeeGuard cache 60s — permission փոփոխությունները delay կարող են ունենալ մինչև TTL։

---

## Security ռիսկեր

- Տես `06_AUTH_SECURITY_PERMISSIONS_HY.md` — middleware բացակայություն, secrets hygiene։

---

## Architecture ռիսկեր

- Monolith API — մեկ deploy, մեկ failure domain — ընդունելի է, բայց observability պարտադիր։

---

## Փաստաթղթերի բացեր

- Հայերեն onboarding **լրացվել է** `docs/me/*` (այս փաթեթով)։
- Ակտիվ ռուսերեն կանոն՝ `docs/NBOS/` — պետք է cross-check անել feature փոփոխությունների ժամանակ։

---

## Առաջնահերթություններ (առաջարկ)

1. `docs/IMPLEMENTATION_PROGRESS.md` ընդունման բլոկներ (կամ արխիվ `docs/Progress Archive/PHASE_7_PRECHECK_MANUAL_QA.md`)։
2. Next `middleware.ts` + auth gate։
3. Fix `/sign-up` (ստեղծել էջ կամ հանել link)։
4. Dependency cleanup web package։

---

_Հիմք՝ `docs/IMPLEMENTATION_PROGRESS.md`, կոդային արագ ստուգումներ, 2026-05-01։_
