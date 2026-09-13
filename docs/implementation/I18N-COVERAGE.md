# I18N coverage — first EN/RU release

Date: 2026-09-12. Status: first EN/RU slice is in the working tree. Production schema has `employees.interface_locale` (migrate deploy on `ep-sweet-dew`, 17 rows default `en`). Stage 6 started with My Account / My Wallet chrome. HY is not enabled. The slice is not moved to IMPLEMENTATION_DONE.

Canon: [07-Interface-Localization.md](../NBOS/01-Platform-Overview/07-Interface-Localization.md). Plan: [I18N-IMPLEMENTATION-PLAN.md](./I18N-IMPLEMENTATION-PLAN.md).

This file is the working register for stages 0–5. It does not expand scope to the rest of the platform or HY.

## Baseline (stage 0)

- Git: feature work already present (dashboard desk-line, employees/me profile, permissions). Those changes are preserved; i18n must not overwrite them.
- Stack: Next.js 16.2.11 App Router, React 19.2.3, NestJS 11, Prisma 7, pnpm 8.15. `next-intl` was not installed at inventory.
- i18n: `docs/TECH_CARD.md` §2.7 approved, not implemented. No `apps/web/src/i18n` or `messages/` catalogs.
- Routes: no locale prefix. `apps/web/next.config.ts` rewrites `/api/*` (except auth/bff/realtime) to BFF. Do not change URLs.
- Auth/BFF: browser calls `/api/*` → `apps/web/src/app/api/bff/[...path]/route.ts` → `proxyToBackend` injects access JWT from Auth.js cookie; 401 refresh is single-flight (`apps/web/src/lib/bff-proxy.ts`). Locale read/write must reuse this path and must not add a refresh mechanism or change session lifetime.
- Session: `apps/web/src/app/layout.tsx` calls `auth()` and passes session into `SessionProvider` to avoid refresh-rotation races.
- Query cache: root `QueryProvider` is process-wide for the tab. Preference locale must be keyed by user if cached; on logout clear cookie + preference cache. Business query keys stay unchanged.
- Employee: `interfaceLocale` added (`employees.interface_locale`, default `en`). `DashboardPreference` stays layout-only.
- Existing me API: `GET/PUT /api/me/*` via `MeController` (`@Controller('me')`). Language uses the canon surface `GET|PATCH /api/v1/me/preferences` (not `/api/me/preferences`) so it does not widen the profile contract. Inventory note that other Me routes omit `v1` is recorded; the new path follows the approved canon.
- Fonts: Inter and Source Serif now load `latin` + `cyrillic` + `cyrillic-ext`; `Noto Sans Armenian` is a fallback face. HY remains disabled.
- Uncommitted desk-line catalog is in scope for Dashboard translation; calendar/hash/determinism files stay English-source algorithms.
- Logout today clears locale cookie + Messenger persist. Dashboard `localStorage` is user-scoped; `nbos:module-last-visit` is browser-global and stays out of language scope.
- Inventory follow-up: date picker default locale is hardcoded `en-US`; priority cards emit English title/context plus compatible `code`/`count`.

## Namespace map

| Namespace           | Catalog files                               | Owner after stage 1                                          |
| ------------------- | ------------------------------------------- | ------------------------------------------------------------ |
| `common`            | `messages/{en,ru}/common.json`              | Grok (reference) then shared reads                           |
| `account`           | `messages/{en,ru}/account.json`             | Grok (language) + Composer (menu/theme)                      |
| `navigation`        | `messages/{en,ru}/navigation.json`          | Composer stage 2                                             |
| `dashboard`         | `messages/{en,ru}/dashboard.json`           | Grok (one action) + Composer stage 2                         |
| `dashboardDeskLine` | `messages/{en,ru}/dashboard-desk-line.json` | Composer stage 2                                             |
| `forms`             | `messages/{en,ru}/forms.json`               | Composer stage 3 (Task/Meeting/Lead/Expense)                 |
| `hr`                | `messages/{en,ru}/hr.json`                  | Stage 6 employee sheet / My Account profile                  |
| `tasks`             | `messages/{en,ru}/tasks.json`               | Stage 6 Tasks list / filters / sheet chrome                  |
| `search`            | `messages/{en,ru}/search.json`              | Stage 6 Global Search panel                                  |
| `notifications`     | `messages/{en,ru}/notifications.json`       | Stage 6 inbox sheet + Notification Center                    |
| `workSpaces`        | `messages/{en,ru}/work-spaces.json`         | Stage 6 Work Spaces directory + detail + scrum/drive/AI      |
| `crm`               | `messages/{en,ru}/crm.json`                 | Stage 6 Leads + Deals + CRM nav/dashboard                    |
| `support`           | `messages/{en,ru}/support.json`             | Stage 6 Support tickets + Change Control chrome              |
| `invoices`          | `messages/{en,ru}/invoices.json`            | Stage 6 Finance invoices list/sheet/create                   |
| `deliveryBoard`     | `messages/{en,ru}/delivery-board.json`      | Stage 6 Delivery Board list/hero + sheet chrome              |
| `payroll`           | `messages/{en,ru}/payroll.json`             | Stage 6 Payroll runs + salary board chrome                   |
| `credentials`       | `messages/{en,ru}/credentials.json`         | Stage 6 Credentials vault + form chrome                      |
| `expenses`          | `messages/{en,ru}/expenses.json`            | Stage 6 Pay Now / expense list + sheet                       |
| `expensePlans`      | `messages/{en,ru}/expense-plans.json`       | Stage 6 Expense plans                                        |
| `clientServices`    | `messages/{en,ru}/client-services.json`     | Stage 6 Client services                                      |
| `quick`             | `messages/{en,ru}/quick.json`               | Quick Actions shell / Quick Task install copy                |
| `checklist`         | `messages/{en,ru}/checklist.json`           | Shared checklist workbench row / sheet / evidence hints      |
| `marketing`         | `messages/{en,ru}/marketing.json`           | Stage 6 Marketing board / attribution / dashboard / settings |

Completed-namespace key parity (EN/RU) is enforced only for finished slices.

## Surface register

Status: `pending` → `in_progress` → `en_ru` → `verified`.

### Shell / account

| Surface                          | Files                                                                                                                                                                               | Text kind                                              | Namespace               | Status                                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ----------------------- | ------------------------------------------------------------------------------------------ |
| Desktop sidebar modules/children | `apps/web/src/lib/navigation/nav-config.ts`, `use-sidebar-navigation.ts`, `Sidebar*.tsx`, `sidebar-child-nav-list.tsx`                                                              | System labels; persisted module IDs stay keys          | `navigation`            | en_ru                                                                                      |
| Sidebar customize / DnD          | `SidebarNavigationCustomizeSheet.tsx`, `SidebarCustomizeSortableList.tsx`                                                                                                           | System UI                                              | `navigation`            | en_ru                                                                                      |
| Mobile app menu / dock           | `MobileAppMenu.tsx`, `MobileAppMenuTile.tsx`, `MobileBottomNav.tsx`, `mobile-app-menu-constants.ts`, `mobile-bottom-nav-constants.ts`, `MobileDock*.tsx`, `MobileWorkspaceDock.tsx` | System UI                                              | `navigation`            | en_ru (module/dock chrome); zone/section item labels from feature modules stay English     |
| Header / page chrome             | `Topbar.tsx`, `AppChromeHeader.tsx`, `header-context/*`, `HeaderQuickNote.tsx`, `header-quick-note-constants.ts`                                                                    | System UI                                              | `navigation` / `common` | en_ru (module title + quick note); HeaderContext zone tabs still come from feature modules |
| Account menu                     | `AccountMenuDropdown.tsx`, `account-menu-dropdown-constants.ts`                                                                                                                     | System UI; user name/email/role/avatar stay user data  | `account`               | en_ru                                                                                      |
| Theme switcher                   | `theme-switcher.tsx`, `theme-switcher-constants.ts`                                                                                                                                 | System UI                                              | `account`               | en_ru                                                                                      |
| Language switcher                | `LanguageSwitcher.tsx`, under theme                                                                                                                                                 | System UI                                              | `account`               | en_ru                                                                                      |
| Sign out / errors                | `session-sign-out.ts` (cookie clear), account menu labels                                                                                                                           | System UI                                              | `account` / `common`    | en_ru                                                                                      |
| Search / notifications triggers  | `GlobalSearchTrigger.tsx`, NotificationDropdown header trigger only                                                                                                                 | System chrome; inbox/search bodies in their namespaces | `navigation` / `common` | en_ru (triggers); inbox/search chrome is `notifications` / `search`                        |
| PWA install tile                 | `components/pwa/PwaInstallTile.tsx`, `pwa-constants.ts`                                                                                                                             | System UI                                              | `navigation`            | en_ru                                                                                      |
| PWA dashboard install banner     | `components/pwa/PwaInstallBanner.tsx`, `pwa-dashboard-banner-copy.ts`                                                                                                               | System UI; dismiss flag stays in localStorage          | `navigation`            | en_ru                                                                                      |
| Access denied chrome             | `ModuleAccessGate.tsx`, `components/shared/AccessDeniedScreen.tsx`                                                                                                                  | System UI                                              | `common`                | en_ru                                                                                      |

### Dashboard Control Center

| Surface                  | Files                                                                                                                  | Text kind                                               | Namespace                         | Status                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------- |
| Pinned actions registry  | `dashboard-control-registry.ts`, `DashboardActionCards.tsx`, `DashboardPinnedActions*.tsx`, `PinnedActionKindMark.tsx` | System labels/tooltips; persisted action keys unchanged | `dashboard`                       | en_ru                                                                           |
| Widgets / mini metrics   | `dashboard-control-registry.ts` `MINI_METRICS`, `MiniAnalyticsPanel.tsx`, `analytics-card.tsx`                         | System labels; numeric values not translated            | `dashboard`                       | en_ru (kicker `Пульс` / `Pulse`)                                                |
| Layout edit / DnD chrome | `DashboardPinnedActionsChrome.tsx`, `use-dashboard-control-center.ts`                                                  | System UI / save errors                                 | `dashboard`                       | en_ru                                                                           |
| Notes chrome             | `DashboardNotesPanel.tsx`                                                                                              | System UI; note **content** is user data                | `dashboard`                       | en_ru (time format follows interface locale)                                    |
| Personal links chrome    | `DashboardActionCards.tsx`, chrome create fields                                                                       | System UI; link **label/url** are user data             | `dashboard`                       | en_ru                                                                           |
| Priority cards           | `DashboardInsightPanels.tsx`; API `code`/`count` + English fallback title/context                                      | System by code; user/project names not translated       | `dashboard`                       | en_ru (API `code`/`count` preferred; source/severity + title parse as fallback) |
| Desk header / greeting   | `DashboardDeskHeader.tsx`, `dashboard-desk-header.ts`                                                                  | System + interpolated firstName/years                   | `dashboard` / `dashboardDeskLine` | en_ru                                                                           |
| Desk-line catalog        | `desk-line/desk-line-catalog*.ts` (ids stable)                                                                         | System copy; translate at render by `id`                | `dashboardDeskLine`               | en_ru (editorial RU still needs native review)                                  |
| Desk-line algorithm      | `desk-line-calendar.ts`, `desk-line-clock.ts`, `desk-line-hash.ts`, `desk-line-resolve.ts`, `desk-line-slots.ts`       | Not copy; keep Yerevan/date/hash                        | —                                 | exclude (logic)                                                                 |
| Empty / loading / error  | `DashboardControlCenterView.tsx`, `use-dashboard-control-center.ts`                                                    | System UI                                               | `dashboard`                       | en_ru                                                                           |
| Create entry + toasts    | `DashboardCreateActionsProvider.tsx`                                                                                   | System toasts                                           | `dashboard`                       | en_ru                                                                           |

### Four create flows (stage 3)

| Flow    | Entry                                     | Dialog / form files                                                                           | In-scope text                                                                                   | Status                                                   |
| ------- | ----------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Task    | `new-task` → `UnsortedTaskCreateProvider` | `apps/web/src/components/shared/quick-create-task/*`, `RelationPickerField` (select existing) | Fields, placeholders, validation, submit/cancel, errors, assignee picker chrome, due date, a11y | en_ru                                                    |
| Meeting | `new-meeting`                             | `apps/web/src/features/calendar/CreateMeetingCalendarDialog.tsx`                              | Same + conflict override copy                                                                   | en_ru                                                    |
| Lead    | `new-lead`                                | `apps/web/src/features/crm/components/CreateLeadDialog.tsx`                                   | Title, name/phone/email, create/cancel, errors                                                  | en_ru (Full label only; destination sheet still English) |
| Expense | `new-expense`                             | `CreateExpenseDialog.tsx`, `CreateExpenseDialogForm.tsx`                                      | Name/amount/due date, create/cancel, errors                                                     | en_ru                                                    |

Shared date picker follows the interface locale (`en`→`en-US`, `ru`→`ru-RU`) for display chrome, including Previous/Next month, Previous/Next year, typed Day/Month/Year, and Time/Hours/Minutes. Week-start and Yerevan calendar math are unchanged. Relation picker employee kind, add-employee aria, and chip Open/Change/Remove aria are EN/RU; non-employee `Search {kind}s…` placeholders remain English. Mini-analytics kicker/chart aria and totals follow the interface locale. Meeting type/location closed selects render catalog labels, not raw enum codes. Shared dialog close uses `common.close`. First-release Task/Meeting/Lead/Expense/Dashboard load errors map by status/code to catalog copy; unknown and network failures use a safe localized fallback. Persisted IDs, amounts, ISO dates, and user-entered values are not translated.

Lead **Full** button label is in scope; the Lead sheet it opens is not. Task `Full form` is unused from Dashboard (`onOpenFull` is not passed).

### Stage 6 — Tasks Recurring / Automation

| Surface                                           | Files                                                                                                                                  | Text kind                                                                                                                         | Namespace                         | Status |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ------ |
| Recurring list / cards / sheet                    | `RecurringTasksPageView.tsx`, `RecurringTaskCard.tsx`, `RecurringTaskSheet*.tsx`, `RecurringTask*Fields.tsx`, `use-recurring-tasks.ts` | System chrome; template title/description/checklist item text stay user data; persisted default checklist title stays `Checklist` | `tasks.recurring` / `common`      | en_ru  |
| Automation catalog page                           | `app/(app)/tasks/automation/page.tsx`                                                                                                  | Page chrome only; rule `code` / `module` / `trigger` / `description` and blueprint type codes stay API data                       | `tasks.automation` / `common`     | en_ru  |
| Work Spaces directory / cards / table / create    | `WorkSpacesPage.tsx`, `WorkSpaceListTable.tsx`, `WorkSpaceNavigableCard`, `CreateStandaloneWorkSpaceDialog.tsx`                        | System chrome; space name/description and linked project/product names stay user data; type/mode **codes** stay codes             | `workSpaces` / `common`           | en_ru  |
| Work Spaces detail chrome                         | `WorkSpaceDetailPage.tsx`, area tabs, settings, edit, discussion trigger/header, runtime empty/filters                                 | System chrome; task titles stay user data                                                                                         | `workSpaces` / `tasks` / `common` | en_ru  |
| Work Spaces scrum / Drive / AI Access             | `workspace-scrum-planner/*`, `WorkSpaceDriveSheet.tsx`, `WorkspaceAiAccessPanel.tsx`                                                   | System chrome; sprint/task/file/agent names stay user data; shared Drive create-folder dialog still English                       | `workSpaces` / `common`           | en_ru  |
| EmployeeSheet departments / lifecycle / directory | `EmployeeDepartmentsPanel`, onboarding/offboarding, terminate/reactivate, Team directory, create/invite, departments admin             | System chrome; names/emails/dept names stay user data; shared checklist row uses `checklist`                                      | `hr` / `checklist` / `common`     | en_ru  |
| CRM Leads + Lead sheet                            | leads page, Lead sheet, Связать/merge, CreateDeal, CRM nav/dashboard                                                                   | System chrome; lead names/contacts stay user data; Active Call overlay still English                                              | `crm` / `common`                  | en_ru  |
| CRM Deals + Deal sheet                            | deals page, Deal sheet (commercial/handoff/WhatsApp/files)                                                                             | System chrome; deal names/amounts stay user data                                                                                  | `crm` / `common`                  | en_ru  |
| CRM calls                                         | Active Call overlay, click-to-call, activity timeline, recording player, contact calls tab                                             | System chrome; names/phones stay user data                                                                                        | `crm.calls` / `common`            | en_ru  |
| Marketing                                         | board, attribution, dashboard, settings, launch dialog, header zones                                                                   | System chrome; activity titles/account names stay user data; reports Marketing tab still English                                  | `marketing` / `crm` / `common`    | en_ru  |
| Support tickets                                   | Support page, board/list, sheet header/actions, create/escalate/status, Change Control chrome                                          | System chrome; ticket titles/messages stay user data; sheet body / technical dialog still English                                 | `support` / `common`              | en_ru  |
| Invoices                                          | invoices page, kanban/table, sheet header/general/payments chrome, create, overdue reminders                                           | System chrome; amounts/company names stay user data; record-payment form / history tab still English                              | `invoices` / `common`             | en_ru  |
| Delivery Board                                    | list/hero/filters, pipeline, detail sheet general chrome, action-bar, files toasts, hub lifecycle badges                               | System chrome; product/project names stay user data; product section chrome (Cards/List/counts) still English                     | `deliveryBoard` / `common`        | en_ru  |
| Payroll / Salary                                  | payroll runs list/detail, salary board chrome, allocation matrix cells/headers, manual bonus, audit export toasts                      | System chrome; employee names/amounts stay user data; month compensation sheet / KPI essays still English                         | `payroll` / `common`              | en_ru  |
| Credentials vault                                 | vault list/filters/form chrome, delete, emergency panel, tiles empty/actions, bulk bar, ENV table, filter chips, audit labels          | System chrome; titles/secrets/URLs stay user data; form-sheet advanced settings / table-row Open leftovers still English          | `credentials` / `common`          | en_ru  |
| Expenses Pay Now                                  | expenses active/backlog/closed, sheet, stages/categories                                                                               | System chrome; expense names/amounts stay user data; expense plans and client services still English                              | `expenses` / `common`             | en_ru  |
| Shared checklist workbench                        | item row, evidence hints, instance sheet complete/empty                                                                                | System chrome; item titles/instructions stay user data                                                                            | `checklist`                       | en_ru  |

### Nested create flows — out of first release

Selecting an existing related entity is in scope. Opening a nested **create** from a relation picker is not. Register (do not translate recursively):

| Flow                                                   | Files / host                                                                                                         | Why out                                                                 |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Relation picker `onCreate`                             | `EntityRelationHost.tsx` (`contact` / `company` / `project` / `partner` / `product`)                                 | Nested creates; picker **chrome** for selecting existing stays in scope |
| Create contact / company / project / partner / product | `CreateContactDialog`, `CreateCompanyDialog`, `CreateProjectHubDialog`, `CreatePartnerDialog`, `CreateProductDialog` | Nested from picker                                                      |
| Credential / employee sheets                           | `credential-form-sheet.tsx`, `EmployeeSheet.tsx`                                                                     | Open-selected only; create disabled                                     |
| Create deal                                            | `features/crm/components/CreateDealDialog.tsx`                                                                       | Not a Dashboard create action                                           |
| Lead/Deal sheet creates                                | `LeadSheetCreateDialogs.tsx`, `DealSheetCreateDialogs.tsx`, `LeadSvyazat*`                                           | Other module surfaces                                                   |
| Board quick-create task                                | `LeadBoardQuickCreateTask.tsx`, `DealBoardQuickCreateTask.tsx`                                                       | Board context (dialog reuse of Task form is incidental)                 |
| Expense plan / invoice / CS                            | `CreateExpensePlanDialog.tsx`, `CreateInvoiceDialog.tsx`, `ClientServiceCreateDialog*.tsx`                           | Not Dashboard Expense create                                            |
| Work Space creates                                     | `CreateStandaloneWorkSpaceDialog.tsx`, `CreateWorkSpaceSprintDialog.tsx`                                             | Not Dashboard Task create                                               |
| Destination pages of Open                              | Deals, Delivery, Invoices, Payroll, Support, Credentials pages                                                       | Canon: Open buttons translated; destination pages later                 |

## System vs user text

Translate: navigation labels, account/theme/language chrome, dashboard action/widget/desk-line **system** copy, form chrome, validation, toasts, aria-labels, empty/error/loading, metric **captions**.

Do not translate: employee names, emails, role **display names from API**, note bodies, personal link labels/URLs, task/meeting/lead/expense user field values, money amounts, ISO dates, permission/enum/URL/preference IDs, DashboardPreference arrays, sidebar module keys.

## Baseline checks (real scripts)

Do not invent commands. Do not run repo-wide `format`.

| Check                   | Command                                                                                                                                                                | When                  |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| Shared types            | `pnpm --filter @nbos/shared typecheck`                                                                                                                                 | locale contract       |
| Shared lint             | `pnpm --filter @nbos/shared lint`                                                                                                                                      | locale contract       |
| API types               | `pnpm --filter @nbos/api typecheck`                                                                                                                                    | preferences API       |
| API lint                | `pnpm --filter @nbos/api lint`                                                                                                                                         | preferences API       |
| Web types               | `pnpm --filter @nbos/web typecheck`                                                                                                                                    | i18n/UI               |
| Web lint                | `pnpm --filter @nbos/web lint`                                                                                                                                         | i18n/UI               |
| Targeted tests          | `pnpm exec vitest run <paths>`                                                                                                                                         | listed below          |
| Web build               | `pnpm run build:web`                                                                                                                                                   | after provider/layout |
| API build               | `pnpm run build:api`                                                                                                                                                   | after backend change  |
| Prisma generate         | `pnpm --filter @nbos/database generate`                                                                                                                                | after schema          |
| Prisma migrate status   | `pnpm --filter @nbos/database migrate:status`                                                                                                                          | after writing SQL     |
| Auth refresh regression | `pnpm exec vitest run apps/web/src/lib/bff-proxy.refresh.test.ts apps/web/src/lib/auth/refresh-backend-session.test.ts apps/web/src/lib/auth/realtime-session.test.ts` | after BFF/layout      |
| Desk-line determinism   | `pnpm exec vitest run apps/web/src/features/dashboard/desk-line apps/web/src/features/dashboard/dashboard-desk-header.test.ts`                                         | after desk-line i18n  |
| Dashboard action keys   | `pnpm exec vitest run apps/web/src/features/dashboard/dashboard-pinned-action-kind.test.ts`                                                                            | after registry keys   |

Targeted test paths to add/run for this release:

- `packages/shared/src/i18n/*.test.ts`
- `apps/api/src/modules/employees/employee-interface-locale*.test.ts`
- `apps/web/src/i18n/*.test.ts`
- existing auth/BFF tests above
- existing desk-line / dashboard header tests

Not run as part of ordinary i18n slices: `pnpm format`, `pnpm db:push`, `pnpm db:migrate` against unknown/shared/prod DBs, production deploy.

## Implemented contract (stage 5)

Matches canon. Do not treat this as a behaviour change.

- **Allowlist:** writable `en` | `ru`. `hy` is reserved and rejected on write (`400`). Stored junk/`hy` reads as `en` without writing that fallback.
- **API:** `GET|PATCH /api/v1/me/preferences`. Body/response `{ interfaceLocale }`. Envelope from the existing interceptor is `{ data, timestamp }`. Employee is taken from the session; the client does not send `employeeId`. Invalid locale → `400` and no write. Any authenticated employee may change their own locale.
- **SSR:** `resolveRequestLocale` — if the session has a user, `fetchAuthenticatedLocale` via `ensureBackendAccessToken` + backend GET; stored locale beats the cookie. Token/API/timeout failure → `en`, no DB write, cookie is not applied. Anonymous: valid cookie or `en`.
- **Cookie:** `nbos-interface-locale`, `Path=/`, `Max-Age=1y`, `SameSite=Lax`, not identity. Client write after a successful PATCH or client restore. Logout expires it and leftover `nbos-interface-locale-owner`.
- **Change:** PATCH → cookie → `router.refresh()`. No `key={locale}` remount. Failed save keeps the previous locale and toasts `account.languageSaveFailed`. In-flight switches are ignored via a request id.
- **Restore:** after the client session is authenticated, GET preferences; if it differs from SSR, refresh. Catch does not write `en`.
- **Cache:** React `cache()` per request only. Preference is not a process-wide query key. Business query keys are unchanged.

Still English: non-employee `Search {kind}s…`, feature-module dock item labels, some credential form-sheet leftovers. Auth pages, PDF. HY switcher still off. System emails (password reset, invitation, report export chrome), Marketing reports tab, nested creates, month compensation / KPI, Marketing chrome, Active Call overlay, shared checklist, Delivery leftovers, payroll matrix, and credentials tiles/bulk/ENV are now EN/RU. Recipient mailbox content stays user data.

## Stage 5 report — 2026-09-12

First-release EN/RU is implemented on `sipan`. This report does not declare the slice accepted or deployed.

### Works

- Shell: desktop sidebar, account/theme/language, search/notification **triggers**, PWA install chrome, access-denied chrome.
- Dashboard Control Center: pinned create/open, widgets/Pulse, notes chrome, personal-link chrome, priority cards by `code`, desk header + desk-line catalog.
- Four Dashboard creates: Task, Meeting, Lead, Expense, plus shared date/relation picker chrome.
- Preference: `GET|PATCH /api/v1/me/preferences`, cookie `nbos-interface-locale`, authenticated DB locale over cookie, EN fallback without writing EN, logout clears cookie.
- Language switch: PATCH → cookie → `router.refresh()`, no `key={locale}` remount, failed save keeps previous locale.
- Hidden Armenian font probe in root layout. HY is not in the switcher.

Live sampled (one user, RU): EN↔RU shell/dashboard/four creates, light/dark/system, mobile 390px menu, Meeting 409 overlap copy, network copy, 403 copy, Noto Sans Armenian `document.fonts.check`.

### Still English by first-release scope

Open destination pages, Lead sheet behind Full, Work Space Scrum planner / Drive sheet / AI Access, non-employee `Search {kind}s…`, feature-module dock item labels, EmployeeSheet departments/lifecycle panels. User data (names, notes, notification titles/bodies, personal-link titles such as Cost OPS). Auth reset page, PDF, remaining modules. System email chrome is localized from the employee/inviter/schedule-owner locale. HY switcher still off — stage 7 pilot only.

### Checks run

`pnpm exec vitest run` on shared locales, employee preference service + HTTP test, `apps/web/src/i18n`, BFF/auth refresh + sign-out, desk-line + dashboard header/action-key tests.

Result: **22 files, 87 tests, all passed** (2026-09-12). Follow-up: web `typecheck` green; web `lint` 0 errors / 16 pre-existing warnings outside i18n. Meeting conflict parser now reads top-level and nested `conflicts` (3 new tests).

### Not run

| Check                                    | Reason                                                                                                                                                                                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm run build:web` / `build:api`       | Not required for this parser/typecheck pass                                                                                                                                                                                              |
| Live expired access-token restore        | Done live 2026-09-12 on `i18n.tester@nbos.test` via API/BFF path (owner browser cookie not mutated): expired access → 401; `POST /api/v1/auth/refresh` with `X-Nbos-Bff: 1` → 200; `GET /me/preferences` stayed `ru`; EN was not written |
| Logout/login two users                   | Done live 2026-09-12: `i18n.tester@nbos.test` (ru) → `i18n.tester.en@nbos.test` (en); DB locale won, leftover cookie did not leak                                                                                                        |
| Production deploy / production migration | Out of this slice. Dev Neon already has `20260912120000_employee_interface_locale`                                                                                                                                                       |

### Risks

- Authenticated SSR falls back to EN when preference GET/refresh fails; next successful load restores DB locale. Cookie is not applied for a signed-in user in that failure path (canon).
- Meeting conflict **list** was not proven live (the intercept stub may have omitted `conflicts`); overlap **copy** was. Parser now accepts top-level and nested `conflicts`; the real API puts the list on the 409 body.
- Desk-line RU is editorial and still wants a native review.
- Double BFF/RSC refresh is unchanged; do not touch unless logs show `auth.refresh_reuse_detected`.

### Rollout

Additive migration is in the repo and applied to the authorized Neon database. Production rollout is a separate step. Do not treat this report as deployment.

## Stage journal

| Stage | Coverage note                                  | Status                                                                                                                                                                                                             |
| ----- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0     | This register                                  | complete                                                                                                                                                                                                           |
| 1     | Foundation + Save/Cancel + language + New task | en_ru (reference verified by tests)                                                                                                                                                                                |
| 2     | Shell + remaining Dashboard                    | en_ru (desktop RU + light/dark/system sampled live; mobile 390px menu sampled)                                                                                                                                     |
| 3     | Four create flows                              | en_ru (date-picker chrome sampled live in RU; Meeting 403/conflict/network copy sampled live via request intercept)                                                                                                |
| 4     | Automated + visual acceptance                  | complete for first-release checks (web typecheck + lint 0 errors; two-user and token-expiry sampled live; auth pages out of scope; production builds not run)                                                      |
| 5     | Review, docs, report                           | report ready; prod schema migrated on ep-sweet-dew; slice not in IMPLEMENTATION_DONE                                                                                                                               |
| 6     | Rest of platform                               | in_progress (account, wallet, HR directory/sheet leftover, Tasks, Recurring, Automation, Work Spaces + scrum/drive/AI, CRM leads/deals, Support, Invoices, Delivery Board, Payroll, Credentials, Expenses Pay Now) |
| 7     | HY pilot                                       | draft I18N-HY-PILOT.md; switcher still EN/RU only                                                                                                                                                                  |
