# Տվյալների բազա և մոդելներ (NBOS)

---

## 1. Տեխնոլոգիա

- **Համակարգ**՝ PostgreSQL (`.env.example` մեջ նշված է Neon pooler URL օրինակով)։
- **ORM**՝ Prisma 7 (`packages/database/package.json`)։
- **Prisma client output**՝ `packages/database/src/generated/prisma/` (գեներացված, չխմբագրել)։
- **Package export**՝ `packages/database/src/index.ts` → `PrismaClient`, enums, types։

---

## 2. Սխեմայի տեղադրություն

Հիմնական ֆայլ՝ `packages/database/prisma/schema.prisma`։

**Prisma 7 կոնֆիգ**՝ `packages/database/prisma.config.ts` — `dotenv` բեռնում է monorepo արմատի `../../.env.local`, `datasource.url` վերցնում է **`DIRECT_URL`** env-ից (`env('DIRECT_URL')`)։ `.env.example` մեջ նշված են և `DATABASE_URL`, և `DIRECT_URL` (Neon pooler vs direct)։

---

## 3. Մոդելների ցուցակ (Prisma `model` declarations)

Հետևյալ մոդելները հաստատված են `schema.prisma` մեջ `^model ` grep-ով.

`Contact`, `Company`, `Project`, `ProjectKickoffChecklistItem`, `Product`, `Extension`, `MarketingAccount`, `MarketingActivity`, `Lead`, `Deal`, `Order`, `Invoice`, `Payment`, `Subscription`, `ExpensePlan`, `Expense`, `ExpensePayment`, `BonusEntry`, `PayrollRun`, `SalaryLine`, `WorkSpace`, `Task`, `TaskLink`, `TaskChecklist`, `TaskChecklistItem`, `FileAsset`, `FileVersion`, `FileLink`, `FileAuditEvent`, `FileUploadSession`, `ReportExportJob`, `ReportSchedule`, `SavedReportView`, `DocumentSection`, `ExternalDocumentLink`, `Document`, `DocumentTag`, `DocumentTagOnDocument`, `DocumentAttachment`, `DocumentActivityEvent`, `TaskBoardStage`, `RecurringTaskTemplate`, `SupportTicket`, `Credential`, `Domain`, `ClientServiceRecord`, `Department`, `EmployeeDepartment`, `Role`, `Permission`, `RolePermission`, `Invitation`, `Employee`, `DashboardPreference`, `PersonalLink`, `Partner`, `MessengerChannel`, `MessengerChannelMessage`, `MessengerChannelMessageAttachment`, `MessengerChannelReadState`, `MessengerDirectThread`, `MessengerDirectMessage`, `MessengerDirectMessageAttachment`, `MessengerDirectThreadReadState`, `MailAccount`, `MailProviderConnection`, `EmailThread`, `EmailMessage`, `EmailAttachment`, `MailDeliveryLog`, `EmailRecipient`, `InAppNotification`, `NotificationEvent`, `NotificationRule`, `NotificationJob`, `NotificationDelivery`, `ProductTechnicalProfile`, `TechnicalAsset`, `TechnicalEnvironment`, `CalendarMeeting`, `PersonalCalendarEvent`, `AuditLog`, `SystemListOption`։

---

## 4. Կապերի տրամաբանություն (բարձր մակարդակ)

- **Project** կենտրոնական հանգույց է՝ կապված է արտադրանքներ, extensions, պատվերներ, subscriptions, tasks, support, expenses, audit, technical assets և այլն հետ (`Project` մոդելի relation դաշտերը `schema.prisma` մեջ)։
- **Employee** ↔ **Role** ↔ **Permission** RBAC եռյակ է։
- **CRM**՝ `Lead`, `Deal` կապված են `Contact` և այլն հետ։

---

## 5. Միգրացիաներ

Թղթապանակ՝ `packages/database/prisma/migrations/`։

- Միգրացիաների անունները արտահայտում են feature-ներ (documents, mail, messenger, reports, credentials, …)։
- **Ռիսկային հատված**՝ migration պատմությունը մեծ է — merge conflict-ների դեպքում պետք է ուշադիր conflict resolution Prisma-ի հետ։

---

## 6. Seed սկրիպտեր

- `packages/database/prisma/seed.ts`
- `seed-admin.ts`, `seed-rbac.ts`, `seed-system-lists.ts`, `seed-messenger.ts`, `seed-mail.ts`, …

`package.json` script՝ `pnpm db:seed` → `pnpm --filter @nbos/database seed`։

---

## 7. Որ մոդուլներն օգտագործում են որ մոդելները

Քարտեզագրումը **ամբողջական չէ** այս փաստաթղթում — յուրաքանչյուր Nest `*.service.ts` օգտագործում է Prisma query-ներ։ Որոնման heuristic՝ բացել `apps/api/src/modules/<domain>/*.service.ts` և grep `prisma.`։

---

## 8. Հնարավոր consistency / performance խնդիրներ

| Թեմա              | Բացատրություն                                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- |
| Nullable FK-ներ   | Օր. `Project.companyId` optional — բիզնես կանոններ պետք է ապահովեն, որ finance flow-ը չկոտրվի                    |
| Մեծ JSON դաշտեր   | Օր. `Contact.messengerLinks Json?` — schema flexibility, բայց validation-ը պետք է API DTO-ում լինի               |
| Որոնման վեկտորներ | Documents migrations-ում search vector — DB ծանրաբեռնվածության ռիսկ մեծ տվյալում                                 |
| Index-ներ         | Պետք է վերլուծել `@@index` pragma-ները schema-ում առանձին բաժնով (այս փաստաթուղթը չի պատճենում բոլոր index-ները) |

---

## 9. Եթե «տվյալների բազա չկա»

Այս նախագծում **տվյալների բազա կա** և այն **PostgreSQL + Prisma** է։ Այլընտրանքային պահեստներ.

- **R2** ֆայլերի համար (`.env.example`)։
- **Redis** cache/queue (env փոփոխականներ, մանրամասն օգտագործումը՝ տես API մոդուլների որոնում `ioredis` / BullMQ)։

---

## 10. Առաջարկվող հետագա բարելավումներ

1. ER դիագրամ generate անել Prisma studio-ից կամ գործիքով (փաստաթղթավորում)։
2. Կրիտիկական list query-ների համար `EXPLAIN ANALYZE` production-like տվյալով։
3. DB constraint-ների և soft-delete pattern-ների համաձայնեցում `docs/NBOS` կանոնների հետ։

---

_Հիմք՝ `packages/database/prisma/schema.prisma` (մասնակի ընթերցում + model list grep), migrations թղթապանակ, `.env.example`, 2026-05-01։_
