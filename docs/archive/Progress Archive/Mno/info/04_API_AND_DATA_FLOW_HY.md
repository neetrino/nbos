# API և տվյալների հոսք (NBOS)

---

## 1. Ընդհանուր պատկեր

NBOS-ում **բիզնես API-ի հիմնական մուտքը** NestJS REST-ն է `apps/api/src/` մեջ։ Next.js **չի օգտագործում** `use server` server actions (`apps/web/src` մեջ `use server` **չի գտնվել** `grep`-ով)։

**Next.js API routes** (ֆայլային համակարգի մակարդակով) գտնվել է միայն.

- `apps/web/src/app/api/auth/[...nextauth]/route.ts` — NextAuth։

**Բոլոր մնացած «API» կանչերը** ֆրոնտից գնում են **`/api/...` relative path-ով**, որոնք Next.js-ը **rewrite**-ով ուղարկում է backend-ին (`apps/web/next.config.ts`)։

---

## 2. URL-ների կանոններ

| Տեսակ                     | Օրինակ                                 | Ուր է հասնում                                                                   |
| ------------------------- | -------------------------------------- | ------------------------------------------------------------------------------- |
| NextAuth                  | `/api/auth/*`                          | Next route handler                                                              |
| Backend REST              | `/api/me`, `/api/tasks`, …             | Nest `globalPrefix` + controller path → `http://<BACKEND_URL>/api/...`          |
| Login (server-side fetch) | `POST {BACKEND_URL}/api/v1/auth/login` | `apps/web/src/auth.ts` (NextAuth authorize) — **ուղիղ backend**, proxy-ից անկախ |

---

## 3. NestJS controller-ների քարտեզ (path prefix = `/api`)

Ստորև բերված են **controller path-երը** `@Controller(...)` արժեքներից (`apps/api/src` grep)։ HTTP մեթոդների ամբողջական ցուցակը տես **Swagger** `http://localhost:4000/api/docs` (production-ում՝ ձեր API host)։

| Controller ֆայլ                                     | `@Controller`           | Նշում                           |
| --------------------------------------------------- | ----------------------- | ------------------------------- |
| `health.controller.ts`                              | `health`                | Public health                   |
| `auth.controller.ts`                                | `v1/auth`               | Public login, invite            |
| `me.controller.ts`                                  | `me`                    | Current user profile            |
| `employees.controller.ts`                           | `employees`             | HR / staff                      |
| `invitations.controller.ts`                         | `invitations`           | Invites                         |
| `roles.controller.ts`                               | `roles`                 | RBAC roles                      |
| `permissions.controller.ts`                         | `permissions`           | Permission definitions          |
| `departments.controller.ts`                         | `departments`           | Departments                     |
| `crm/leads/leads.controller.ts`                     | `crm/leads`             | Leads                           |
| `crm/deals/deals.controller.ts`                     | `crm/deals`             | Deals                           |
| `marketing/marketing.controller.ts`                 | `marketing`             | Marketing                       |
| `projects/projects.controller.ts`                   | `projects`              | Projects                        |
| `projects/products/products.controller.ts`          | `projects/products`     | Products                        |
| `projects/extensions/extensions.controller.ts`      | `projects/extensions`   | Extensions                      |
| `clients/contacts/contacts.controller.ts`           | `clients/contacts`      | Contacts                        |
| `clients/companies/companies.controller.ts`         | `clients/companies`     | Companies                       |
| `partners/partners.controller.ts`                   | `partners`              | Partners                        |
| `finance/invoices/invoices.controller.ts`           | `finance/invoices`      | Invoices                        |
| `finance/orders/orders.controller.ts`               | `finance/orders`        | Orders                          |
| `finance/payments/payments.controller.ts`           | `finance/payments`      | Payments                        |
| `finance/subscriptions/subscriptions.controller.ts` | `finance/subscriptions` | Subscriptions                   |
| `finance/reports/reports.controller.ts`             | `finance/reports`       | Finance reports                 |
| `finance/summary/summary.controller.ts`             | `finance/summary`       | Summary                         |
| `billing/billing.controller.ts`                     | `billing`               | Billing                         |
| `expenses/expenses.controller.ts`                   | `expenses`              | Expenses                        |
| `expenses/expense-plans.controller.ts`              | `expense-plans`         | Expense plans                   |
| `payroll-runs/payroll-runs.controller.ts`           | `payroll-runs`          | Payroll                         |
| `client-services/client-services.controller.ts`     | `client-services`       | Client services                 |
| `bonus/bonus.controller.ts`                         | `bonus`                 | Bonus                           |
| `tasks/tasks.controller.ts`                         | `tasks`                 | Tasks                           |
| `tasks/task-boards.controller.ts`                   | `task-boards`           | Board stages                    |
| `tasks/recurring-tasks.controller.ts`               | `recurring-tasks`       | Recurring                       |
| `tasks/work-spaces.controller.ts`                   | `tasks/work-spaces`     | Work spaces                     |
| `support/support.controller.ts`                     | `support`               | Support tickets                 |
| `credentials/credentials.controller.ts`             | `credentials`           | Credentials vault               |
| `drive/drive.controller.ts`                         | `drive`                 | Files                           |
| `documents/documents.controller.ts`                 | `documents`             | Documents                       |
| `calendar/calendar.controller.ts`                   | `calendar`              | Calendar                        |
| `dashboard/dashboard.controller.ts`                 | `dashboard`             | Dashboard prefs/data            |
| `reports/reports.controller.ts`                     | `reports`               | Reports catalog/export/schedule |
| `scheduler/scheduler.controller.ts`                 | `scheduler`             | Scheduled jobs triggers         |
| `automation/auto-tasks.controller.ts`               | `automation`            | Automation                      |
| `notifications/notification.controller.ts`          | `notifications`         | Notifications                   |
| `messenger/messenger.controller.ts`                 | `messenger`             | Messenger REST                  |
| `mail/mail.controller.ts`                           | `mail`                  | Mail integration                |
| `audit/audit.controller.ts`                         | `audit`                 | Audit log                       |
| `system-lists/system-lists.controller.ts`           | `system-lists`          | List options                    |
| `technical/technical.controller.ts`                 | `technical`             | Technical profiles              |

---

## 4. Ֆրոնտի API client շերտ

Ֆայլեր՝ `apps/web/src/lib/api/*.ts` (tasks, finance, crm, …) + ընդհանուր `apps/web/src/lib/api.ts`։

### Մուտքագրում / ելք

- **Մուտք**՝ JSON body (POST/PATCH), query params (GET)։
- **Ելք**՝ Axios response-ից հետո interceptor-ը unwrap է անում `data` դաշտը, եթե պատասխանը `{ data, timestamp }` ձևաչափով է (`apps/web/src/lib/api.ts`)։

### Աուտենտիֆիկացիա

- Bearer JWT session-ից (`PermissionProvider` setAuthTokenGetter) կամ `getSession()`։
- **Ռիսկային հատված**՝ server component-ներից axios կանչելիս `window` չկա → token resolve-ը **կարող է null լինել** (`resolveAuthToken`) — եթե ապագայում SSR fetch ավելացվի, պետք է explicit server session pass։

---

## 5. Վալիդացիա

- **Nest**՝ `ValidationPipe` whitelist + class-validator DTO-ներ (controller մակարդակ)։
- **Web forms**՝ հաճախ `react-hook-form` + `zod` (օր. sign-in page)։

---

## 6. Սխալների մշակում

- API՝ `GlobalExceptionFilter` (`apps/api/src/common/filters/http-exception.filter.ts`)։
- Web՝ `apps/web/src/lib/api-errors.ts` + `toApiError` — ցուցադրման համար feature կոմպոնենտներում։

---

## 7. Caching

- **HTTP cache headers**՝ այս վերլուծությամբ **չենք համակարգել** ամբողջ API-ում — **Այս մասը հստակ չէ կոդից** առանց ամեն controller-ի ստուգման։
- **EmployeeGuard in-memory cache**՝ 60 վայրկյան (`employee.guard.ts`)։

---

## 8. Որտեղից են կանչվում API-ները

Ճանապարհ՝

`apps/web/src/app/(app)/**/page.tsx` → (հաճախ client) → `features/*` → `lib/api/*` → axios `/api/...`։

---

## 9. Որ API-ները «անվտանգ» են նախագծով

- `@Public()` endpoint-ներ՝ առնվազն `GET /api/health`, `POST /api/v1/auth/login`, invite endpoints (`auth.controller.ts`, `health.controller.ts`)։ **Սա նորմալ է**, բայց պետք է rate limit + monitoring (ThrottlerModule գլոբալ կա `app.module.ts`)։

---

## 10. Որ API-ները ռիսկային են

- **Բոլոր authenticated endpoint-ները**, եթե JWT գողանան — full access RBAC-ով։
- **Credential reveal** endpoint-ներ (եթե կան) — պետք է audit + extra checks (մանրամասն՝ security doc)։
- **Scheduler trigger endpoints** — եթե public կամ թույլ պաշտպանված լինեն, կարող են չարաշահվել — **պետք է ստուգել** `scheduler.controller.ts` permissions (`Unknown` մանրամասնություն առանց ֆայլի ամբողջական ընթերցման)։

---

## 11. Pagination / filtering

Յուրաքանչյուր list endpoint **տարբեր query params** կարող է ունենալ — Swagger-ը authoritative աղբյուրն է։ Ընդհանուր առաջարկ՝ նոր list API-ներում միշտ ավելացնել `cursor`/`page` + server-side max limit։

---

## 12. Ամբողջական տվյալների հոսքի քարտեզ (տեքստ)

```
User → Browser
  → Next.js page (client/server)
    → feature component
      → lib/api/<domain>.ts
        → axios (Authorization)
          → same-origin /api/...
            → next.config rewrites → Nest /api/...
              → Guards (Auth → Employee → Permission)
                → Service → Prisma → Postgres
              ← JSON response
            ← axios unwrap data
          ← React state / UI
```

---

_Հիմք՝ `apps/api/src` controller grep, `apps/web/src/lib/api.ts`, `next.config.ts`, `grep use server` (չկա), 2026-05-01։_
