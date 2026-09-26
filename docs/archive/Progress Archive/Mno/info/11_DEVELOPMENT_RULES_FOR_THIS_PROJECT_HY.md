# Մշակման կանոններ NBOS նախագծի համար (կոդի հիման վրա)

Այս կանոնները **չեն փոխարինում** `docs/reference/knowledge-base/NAMING_CONVENTIONS.md` և այլ reference փաստաթղթերը, այլ **կոնկրետացնում են** այն, ինչը երևում է repo-ում։

---

## 1. Monorepo և package-ներ

- Օգտագործել **pnpm workspace** protocol (`workspace:*`) dependency-ներ web/api-ում `@nbos/database`, `@nbos/shared` համար (`apps/web/package.json`, `apps/api/package.json`)։
- Հրամաններ запускել **արմատից** `pnpm <script>`՝ turbo cache-ի համար։

---

## 2. Ֆայլերի և թղթապանակների կոնվենցիա

- Next App Router երթուղիներ՝ `apps/web/src/app/(app)/.../page.tsx`։
- Դոմեյն UI + լոգիկա՝ `apps/web/src/features/<domain>/`։
- API client per domain՝ `apps/web/src/lib/api/<domain>.ts`։
- Nest domain՝ `apps/api/src/modules/<domain>/` (`*.module.ts`, `*.controller.ts`, `*.service.ts`)։

---

## 3. Կոմպոնենտների կանոններ

- Feature էջերը հաճախ `'use client'` են — նախքան server-only API ավելացնելը ստուգել `api.ts` token resolve-ը։
- Layout shell փոփոխելիս համոզվել, որ `PermissionProvider` չի կոտրվում (`apps/web/src/app/(app)/layout.tsx`)։

---

## 4. API կանոններ

- Global prefix Nest-ում՝ `api` (`main.ts`) — ֆրոնտի կանչերը `/api/...`։
- Auth public endpoint-ները նշել `@Public()` decorator-ով (`apps/api/src/common/decorators`)։
- DTO + `ValidationPipe` whitelist — **չուղարկել** ավելորդ դաշտեր client-ից։

---

## 5. Տվյալների բազայի կանոններ

- Սխեմա փոխելիս **միշտ** Prisma migration (`packages/database/prisma/migrations`)։
- `prisma generate` գործարկել փոփոխությունից հետո։
- `DIRECT_URL` / `DATABASE_URL` բաժինը հետևել `.env.example` բացատրություններին։

---

## 6. Auth և անվտանգություն

- **Երբեք** չcommit անել `.env.local` գաղտնաբառերով։
- JWT գաղտնաբառերը production-ում ուժեղ պատահական արժեքներ։
- **Չմոռանալ** middleware auth gate-ը Next-ում (ներկայումս **պակաս է** — տես ռիսկերի փաստաթուղթ, fix priority)։

---

## 7. Սխալների մշակում

- API errors՝ օգտագործել գոյություն ունեցող `GlobalExceptionFilter` pattern-ը։
- Web UI՝ `toApiError` (`apps/web/src/lib/api-errors.ts`) user message-ների համար, ոչ թե raw stack user-ին։

---

## 8. Caching

- Եթե փոխում եք RBAC structure-ը, հաշվի առնել `EmployeeGuard` 60 վայրկյան cache-ը (`employee.guard.ts`)։

---

## 9. Ոճավորում

- Tailwind utility classes, `cn()` helper pattern (տես `apps/web/src/lib/utils.ts` եթե գոյություն ունի — standard shadcn)։
- Prettier + tailwind plugin արմատային `package.json` devDeps։

---

## 10. Performance

- Մեծ list UI-ներում pagination/query limits backend-ում (Swagger contract)։
- Չավելացնել blocking sync heavy work React render-ում։

---

## 11. Code review checklist (NBOS-specific)

- [ ] Prisma migration included? (if schema touched)
- [ ] New API route has correct `@RequirePermission`?
- [ ] Web API client updated?
- [ ] Tests for service logic (`*.test.ts`)?
- [ ] No secrets in code?
- [ ] NextAuth / JWT unaffected unintentionally?

---

## 12. Ինչ **երբեք** չանել այս նախագծում

- Չխմբագրել `packages/database/src/generated/**` ձեռքով։
- Չփոխել finance state machine-ը առանց audit trail plan-ի։
- Չբացել `@Public()` wide admin endpoints առանց throttling/monitoring։
- Չավելացնել `any` TypeScript strict խախտումով (թիմի կանոն եթե enforced է ESLint-ով)։

---

_Հիմք՝ monorepo կառուցվածք, Nest/Next config, guards, 2026-05-01։_
