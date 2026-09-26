# Մոդուլների խորը վերլուծություն (NBOS)

Յուրաքանչյուր բաժինը համապատասխանում է **իրականում գոյություն ունեցող** կոդի թղթապանակներին։ Եթե ինչ-որ մանրամաստ **հստակ չէ** միայն կոդը կարդալով, նշված է համապատասխանաբար։

---

## Ինչպես կարդալ այս աղյուսակը

- **Վիճակ**՝ Done / Partial / Not done / Unknown — ըստ ֆայլերի և `docs/IMPLEMENTATION_PROGRESS.md`։
- **Ռիսկ**՝ տես նաև `09_BUGS_RISKS_AND_FIX_PLAN_HY.md`։

---

## 1. Պլատֆորմի կեղծուք (Shell)

|                     |                                                                                                                                                 |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ֆայլեր**          | `apps/web/src/app/layout.tsx`, `apps/web/src/app/(app)/layout.tsx`, `apps/web/src/components/layout/AppLayout.tsx`, `Sidebar.tsx`, `Topbar.tsx` |
| **Նպատակ**          | Նավիգացիա, ընդհանուր UI կմախք, session provider, permission context։                                                                            |
| **Կապ**             | Բոլոր `(app)` երթուղիները։                                                                                                                      |
| **Տվյալների մուտք** | NextAuth session (`useSession`), `GET /api/me` permissions-ի համար։                                                                             |
| **Վիճակ**           | **Done** (MVP)                                                                                                                                  |
| **Ռիսկ**            | Sidebar-ում permission key-երի համապատասխանություն backend-ի հետ պետք է պահել sync (սխալ key → թաքնված մենյու)։                                 |

---

## 2. Աուտենտիֆիկացիա և հրավերներ

|             |                                                                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Ֆայլեր**  | `apps/web/src/auth.ts`, `apps/web/src/app/api/auth/[...nextauth]/route.ts`, `apps/web/src/app/(auth)/sign-in/page.tsx`, `apps/web/src/app/(auth)/accept-invite/page.tsx` |
| **API**     | `apps/api/src/modules/auth/auth.controller.ts` (`POST v1/auth/login`, `POST accept-invite`, `GET invite-info`)                                                           |
| **Նպատակ**  | Մուտք, հրավերի ընդունում։                                                                                                                                                |
| **Տվյալ**   | Email/password → JWT access token session-ում։                                                                                                                           |
| **Վիճակ**   | **Done** (login + invite flow կոդ կա)                                                                                                                                    |
| **Partial** | Լենդինգում `/sign-up` հղում կա (`apps/web/src/app/page.tsx`), բայց **`apps/web/src/app/**/sign-up` route չկա** — **Not done\*\* UX։                                      |
| **Ռիսկ**    | Next middleware բացակայում (տես auth doc)։                                                                                                                               |

---

## 3. RBAC, թույլտվություններ, «Ես» (Me)

|            |                                                                                                                                                            |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ֆայլեր** | `apps/web/src/lib/permissions/*`, `apps/api/src/common/guards/employee.guard.ts`, `permission.guard.ts`, `apps/api/src/modules/employees/me.controller.ts` |
| **Նպատակ** | Ֆրոնտում `can()` / `scope()`, բեքենդում guard-ներ։                                                                                                         |
| **Տվյալ**  | `GET /api/me` → employee profile + flat permission map։                                                                                                    |
| **Վիճակ**  | **Done**                                                                                                                                                   |
| **Ռիսկ**   | `PermissionContext.tsx` catch բլոկը **լուռ է** (`catch { /* noop */ }`) — սխալների դեպքում UI-ը կարող է «դատարկ permissions» ցույց տալ առանց հայտնի սխալի։ |

---

## 4. CRM (Leads, Deals)

|           |                                                                                                            |
| --------- | ---------------------------------------------------------------------------------------------------------- |
| **Web**   | `apps/web/src/app/(app)/crm/*`, `apps/web/src/features/crm/*`, `apps/web/src/lib/api/leads.ts`, `deals.ts` |
| **API**   | `apps/api/src/modules/crm/leads/`, `crm/deals/`                                                            |
| **DB**    | `Lead`, `Deal`, `Contact`, … (`schema.prisma`)                                                             |
| **Վիճակ** | **Done** (progress doc Phase 2)                                                                            |

---

## 5. Marketing

|           |                                                                                                                |
| --------- | -------------------------------------------------------------------------------------------------------------- |
| **Web**   | `apps/web/src/app/(app)/marketing/*`, `apps/web/src/features/marketing/*`, `apps/web/src/lib/api/marketing.ts` |
| **API**   | `apps/api/src/modules/marketing/`                                                                              |
| **DB**    | `MarketingAccount`, `MarketingActivity`                                                                        |
| **Վիճակ** | **Done** (MVP շրջանակ, progress)                                                                               |

---

## 6. Projects Hub (նախագծեր, արտադրանք, ընդլայնումներ)

|           |                                                                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Web**   | `apps/web/src/app/(app)/projects/*`, `apps/web/src/features/projects/*`, `apps/web/src/lib/api/projects.ts`, `products.ts`, `extensions.ts` |
| **API**   | `apps/api/src/modules/projects/*` (ներառյալ `products`, `extensions`, kickoff checklist)                                                    |
| **DB**    | `Project`, `Product`, `Extension`, `ProjectKickoffChecklistItem`                                                                            |
| **Վիճակ** | **Done** (delivery ops փուլեր)                                                                                                              |
| **Ռիսկ**  | Մեծ feature թղթապանակ — նոր մշակողը պետք է սկսի `ProjectsPage` / router params `projects/[id]` էջերից։                                      |

---

## 7. Tasks և Work Spaces

|           |                                                                                       |
| --------- | ------------------------------------------------------------------------------------- |
| **Web**   | `apps/web/src/app/(app)/tasks`, `work-spaces`, `features/tasks/*`, `lib/api/tasks.ts` |
| **API**   | `apps/api/src/modules/tasks/*` (tasks, task-boards, recurring-tasks, work-spaces)     |
| **DB**    | `Task`, `TaskBoardStage`, `WorkSpace`, checklist մոդելներ                             |
| **Վիճակ** | **Done**                                                                              |

---

## 8. Finance (ֆինանսական մեծ մոդուլ)

|                     |                                                                                                                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Web**             | `apps/web/src/app/(app)/finance/*`, `features/finance/*`, `lib/api/finance*.ts`, `subscriptions.ts`, `payroll-runs.ts`, `expense-plans.ts`, `client-services.ts`, `bonus.ts` |
| **API**             | `apps/api/src/modules/finance/*`, `expenses`, `payroll-runs`, `bonus`, `client-services`                                                                                     |
| **DB**              | `Invoice`, `Order`, `Payment`, `Subscription`, `Expense`, `ExpensePlan`, `PayrollRun`, …                                                                                     |
| **Վիճակ**           | **Done** (progress Phase 3)                                                                                                                                                  |
| **Ռիսկային հատված** | Ֆինանսական տրանզակցիաների ցանկացած փոփոխություն պետք է անի audit + թեստեր (կան finance-related tests API-ում)։                                                               |

---

## 9. Clients և Partners

|           |                                                                                                             |
| --------- | ----------------------------------------------------------------------------------------------------------- |
| **Web**   | `apps/web/src/app/(app)/clients/*`, `partners/*`, `features/clients/*`, `lib/api/clients.ts`, `partners.ts` |
| **API**   | `apps/api/src/modules/clients/*`, `partners/`                                                               |
| **DB**    | `Contact`, `Company`, `Partner`                                                                             |
| **Վիճակ** | **Done**                                                                                                    |

---

## 10. Support (տոմսեր)

|           |                                                                              |
| --------- | ---------------------------------------------------------------------------- |
| **Web**   | `apps/web/src/app/(app)/support`, `features/support/*`, `lib/api/support.ts` |
| **API**   | `apps/api/src/modules/support/`                                              |
| **DB**    | `SupportTicket`                                                              |
| **Վիճակ** | **Done**                                                                     |

---

## 11. Credentials (գաղտնիքների պահոց)

|                     |                                                                                                          |
| ------------------- | -------------------------------------------------------------------------------------------------------- |
| **Web**             | `apps/web/src/app/(app)/credentials`, `features/credentials/*`, `lib/api/credentials.ts`                 |
| **API**             | `apps/api/src/modules/credentials/`                                                                      |
| **DB**              | `Credential`                                                                                             |
| **Վիճակ**           | **Done** (P0 closure progress)                                                                           |
| **Ռիսկային հատված** | Շիֆրում/բանալիներ — `.env.example` մեջ `CREDENTIALS_ENCRYPTION_KEY` — production-ում պարտադիր valid key։ |

---

## 12. Drive (ֆայլերի պահոց)

|           |                                                    |
| --------- | -------------------------------------------------- |
| **Web**   | `apps/web/src/app/(app)/drive`, `lib/api/drive.ts` |
| **API**   | `apps/api/src/modules/drive/`                      |
| **DB**    | `FileAsset`, `FileVersion`, `FileUploadSession`, … |
| **Վիճակ** | **Done** (P0)                                      |

---

## 13. Documents

|           |                                                                                            |
| --------- | ------------------------------------------------------------------------------------------ |
| **Web**   | `apps/web/src/app/(app)/documents/*`, `features/documents/*`, `lib/api/documents.ts`       |
| **API**   | `apps/api/src/modules/documents/`                                                          |
| **DB**    | `Document`, `DocumentSection`, `DocumentAttachment`, search vector դաշտեր migration-ներում |
| **Վիճակ** | **Done** (P0)                                                                              |

---

## 14. Messenger

|           |                                                                                       |
| --------- | ------------------------------------------------------------------------------------- |
| **Web**   | `apps/web/src/app/(app)/messenger`, `features/messenger/*`, `useMessengerRealtime.ts` |
| **API**   | `apps/api/src/modules/messenger/`                                                     |
| **DB**    | `MessengerChannel*`, `MessengerDirect*` մոդելներ                                      |
| **Վիճակ** | **Done** (realtime socket.io-client օգտագործում կա)                                   |

---

## 15. Mail

|           |                                                                       |
| --------- | --------------------------------------------------------------------- |
| **Web**   | `apps/web/src/app/(app)/mail/*`, `features/mail/*`, `lib/api/mail.ts` |
| **API**   | `apps/api/src/modules/mail/`                                          |
| **DB**    | `MailAccount`, `EmailThread`, `EmailMessage`, …                       |
| **Վիճակ** | **Done** (P0)                                                         |

---

## 16. Notifications

|           |                                                                                           |
| --------- | ----------------------------------------------------------------------------------------- |
| **Web**   | `apps/web/src/app/(app)/notifications`, `lib/notifications/*`, `lib/api/notifications.ts` |
| **API**   | `apps/api/src/modules/notifications/`                                                     |
| **DB**    | `InAppNotification`, `NotificationEvent`, …                                               |
| **Վիճակ** | **Done**                                                                                  |

---

## 17. Calendar

|           |                                            |
| --------- | ------------------------------------------ |
| **Web**   | `apps/web/src/app/(app)/calendar/*`        |
| **API**   | `apps/api/src/modules/calendar/`           |
| **DB**    | `CalendarMeeting`, `PersonalCalendarEvent` |
| **Վիճակ** | **Done**                                   |

---

## 18. Dashboard և Reports

|             |                                                                                                                                   |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Web**     | `apps/web/src/app/(app)/dashboard`, `reports`, `features/dashboard/*`, `features/reports/*`, `lib/api/dashboard.ts`, `reports.ts` |
| **API**     | `apps/api/src/modules/dashboard/`, `reports/` + scheduler/report export workers                                                   |
| **DB**      | `DashboardPreference`, `ReportExportJob`, `ReportSchedule`, `SavedReportView`                                                     |
| **Վիճակ**   | **Done** (P0 reports foundation, progress Phase 6)                                                                                |
| **Partial** | «Ավելի խորը BI»-ը progress doc-ում նշված է որպես հետագա — **կիսատ իրականացում** պլանավորման մակարդակով, ոչ թե կոդի սխալ։          |

---

## 19. HR / My company / Team / Settings

|           |                                                                                                                     |
| --------- | ------------------------------------------------------------------------------------------------------------------- |
| **Web**   | `apps/web/src/app/(app)/my-company/*`, `my-account`, `team`, `settings/*`, `features/my-company/*`, `features/hr/*` |
| **API**   | `employees`, `departments`, `roles`, `invitations`, `audit`, `system-lists` մոդուլներ                               |
| **Վիճակ** | **Done** (shell + settings areas) — մանրամասն UX ամեն էջի համար **Unknown** առանց ձեռքով QA։                        |

---

## 20. Bonus

|           |                                                    |
| --------- | -------------------------------------------------- |
| **Web**   | `apps/web/src/app/(app)/bonus`, `lib/api/bonus.ts` |
| **API**   | `apps/api/src/modules/bonus/`                      |
| **DB**    | `BonusEntry`                                       |
| **Վիճակ** | **Done** (կոդ կա)                                  |

---

## 21. Technical (արտադրանքի տեխնիկական պրոֆիլ)

|           |                                                                                                |
| --------- | ---------------------------------------------------------------------------------------------- |
| **Web**   | `lib/api/technical.ts`, project product tabs (`features/projects/.../ProductTechnicalTab.tsx`) |
| **API**   | `apps/api/src/modules/technical/`                                                              |
| **DB**    | `ProductTechnicalProfile`, `TechnicalAsset`, `TechnicalEnvironment`                            |
| **Վիճակ** | **Done**                                                                                       |

---

## 22. Automation և Scheduler

|         |                                                                                                                   |
| ------- | ----------------------------------------------------------------------------------------------------------------- |
| **API** | `apps/api/src/modules/automation/`, `scheduler/` (cron jobs, օր. expense plan auto-due)                           |
| **Web** | UI կապը **պետք է ստուգվի** endpoint-ներով — այս փաստաթղթում **Partial/Unknown** առանց ամեն UI կանչի քարտեզագրման։ |
| **Env** | `.env.example` scheduler expense plan flags                                                                       |

---

## 23. Audit

|           |                                                                                 |
| --------- | ------------------------------------------------------------------------------- |
| **API**   | `apps/api/src/modules/audit/`                                                   |
| **DB**    | `AuditLog`                                                                      |
| **Web**   | Settings audit log route (`apps/web/src/app/(app)/settings/audit-log/page.tsx`) |
| **Վիճակ** | **Done** (կոդ կա)                                                               |

---

## 24. System lists

|           |                                            |
| --------- | ------------------------------------------ |
| **API**   | `apps/api/src/modules/system-lists/`       |
| **Web**   | `settings/lists`, `lib/api/systemLists.ts` |
| **DB**    | `SystemListOption`                         |
| **Վիճակ** | **Done**                                   |

---

## 25. Տեխնիկական / Health

|            |                                                                     |
| ---------- | ------------------------------------------------------------------- |
| **API**    | `apps/api/src/health.controller.ts` — `@Public()` `GET /api/health` |
| **Նպատակ** | Load balancer probes                                                |

---

## Մոդուլների միջև տվյալների հոսք (կարճ քայլեր)

**Օրինակ՝ Deal ստեղծում.**

1. UI `features/crm` կամ համանման էջ → `dealsApi.create` (`lib/api/deals.ts`)։
2. `POST /api/crm/deals` (proxy) → `DealsController`։
3. Guards → `DealsService` → Prisma `Deal` insert + կապված `Contact`/`Project`։
4. Պատասխան → UI refresh։

---

## Ամփոփում

NBOS-ը **լայն domain monolith** է մեկ API-ում և մեկ web հավելվածում։ Նոր մշակողը պետք է ընտրի **մեկ feature թղթապանակ** `apps/web/src/features/<name>` և համապատասխան `apps/api/src/modules/<name>`, հետո միացնի Prisma մոդելները։

---

_Հիմք՝ `app.module.ts`, `apps/web/src/app/(app)/`, `features/` թղթապանակների ցուցակ, Prisma schema մոդելների ցուցակ, `IMPLEMENTATION_PROGRESS.md` — 2026-05-01։_
