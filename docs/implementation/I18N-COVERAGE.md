# I18N coverage — first EN/RU release

Date: 2026-09-12. Status: first EN/RU slice is in the working tree. Desktop EN↔RU, light/dark, four create flows, mobile menu, and live Meeting 403/conflict/network copy were sampled. A hidden Armenian font probe is in the root layout without enabling HY. Live token-expiry restore (httpOnly session) and production rollout remain open.

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

| Namespace           | Catalog files                               | Owner after stage 1                          |
| ------------------- | ------------------------------------------- | -------------------------------------------- |
| `common`            | `messages/{en,ru}/common.json`              | Grok (reference) then shared reads           |
| `account`           | `messages/{en,ru}/account.json`             | Grok (language) + Composer (menu/theme)      |
| `navigation`        | `messages/{en,ru}/navigation.json`          | Composer stage 2                             |
| `dashboard`         | `messages/{en,ru}/dashboard.json`           | Grok (one action) + Composer stage 2         |
| `dashboardDeskLine` | `messages/{en,ru}/dashboard-desk-line.json` | Composer stage 2                             |
| `forms`             | `messages/{en,ru}/forms.json`               | Composer stage 3 (Task/Meeting/Lead/Expense) |

Completed-namespace key parity (EN/RU) is enforced only for finished slices.

## Surface register

Status: `pending` → `in_progress` → `en_ru` → `verified`.

### Shell / account

| Surface                          | Files                                                                                                                                                                               | Text kind                                             | Namespace               | Status                                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------ |
| Desktop sidebar modules/children | `apps/web/src/lib/navigation/nav-config.ts`, `use-sidebar-navigation.ts`, `Sidebar*.tsx`, `sidebar-child-nav-list.tsx`                                                              | System labels; persisted module IDs stay keys         | `navigation`            | en_ru                                                                                      |
| Sidebar customize / DnD          | `SidebarNavigationCustomizeSheet.tsx`, `SidebarCustomizeSortableList.tsx`                                                                                                           | System UI                                             | `navigation`            | en_ru                                                                                      |
| Mobile app menu / dock           | `MobileAppMenu.tsx`, `MobileAppMenuTile.tsx`, `MobileBottomNav.tsx`, `mobile-app-menu-constants.ts`, `mobile-bottom-nav-constants.ts`, `MobileDock*.tsx`, `MobileWorkspaceDock.tsx` | System UI                                             | `navigation`            | en_ru (module/dock chrome); zone/section item labels from feature modules stay English     |
| Header / page chrome             | `Topbar.tsx`, `AppChromeHeader.tsx`, `header-context/*`, `HeaderQuickNote.tsx`, `header-quick-note-constants.ts`                                                                    | System UI                                             | `navigation` / `common` | en_ru (module title + quick note); HeaderContext zone tabs still come from feature modules |
| Account menu                     | `AccountMenuDropdown.tsx`, `account-menu-dropdown-constants.ts`                                                                                                                     | System UI; user name/email/role/avatar stay user data | `account`               | en_ru                                                                                      |
| Theme switcher                   | `theme-switcher.tsx`, `theme-switcher-constants.ts`                                                                                                                                 | System UI                                             | `account`               | en_ru                                                                                      |
| Language switcher                | `LanguageSwitcher.tsx`, under theme                                                                                                                                                 | System UI                                             | `account`               | en_ru                                                                                      |
| Sign out / errors                | `session-sign-out.ts` (cookie clear), account menu labels                                                                                                                           | System UI                                             | `account` / `common`    | en_ru                                                                                      |
| Search / notifications triggers  | `GlobalSearchTrigger.tsx`, NotificationDropdown header trigger only                                                                                                                 | System chrome; full search/inbox later                | `navigation` / `common` | en_ru (triggers); dropdown/inbox body and GlobalSearch panel remain English                |
| PWA install tile                 | `components/pwa/PwaInstallTile.tsx`, `pwa-constants.ts`                                                                                                                             | System UI                                             | `navigation`            | en_ru                                                                                      |
| PWA dashboard install banner     | `components/pwa/PwaInstallBanner.tsx`, `pwa-dashboard-banner-copy.ts`                                                                                                               | System UI; dismiss flag stays in localStorage         | `navigation`            | en_ru                                                                                      |
| Access denied chrome             | `ModuleAccessGate.tsx`, `components/shared/AccessDeniedScreen.tsx`                                                                                                                  | System UI                                             | `common`                | en_ru                                                                                      |

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

Shared date picker follows the interface locale (`en`→`en-US`, `ru`→`ru-RU`) for display chrome, including Previous/Next month, typed Day/Month/Year, and Time/Hours/Minutes. Week-start and Yerevan calendar math are unchanged. Relation picker employee kind, add-employee aria, and chip Open/Change/Remove aria are EN/RU; non-employee `Search {kind}s…` placeholders remain English. Mini-analytics kicker/chart aria and totals follow the interface locale. Meeting type/location closed selects render catalog labels, not raw enum codes. Shared dialog close uses `common.close`. First-release Task/Meeting/Lead/Expense/Dashboard load errors map by status/code to catalog copy; unknown and network failures use a safe localized fallback. Persisted IDs, amounts, ISO dates, and user-entered values are not translated.

Lead **Full** button label is in scope; the Lead sheet it opens is not. Task `Full form` is unused from Dashboard (`onOpenFull` is not passed).

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

## Stage journal

| Stage | Coverage note                                  | Status                                                                                                                  |
| ----- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 0     | This register                                  | complete                                                                                                                |
| 1     | Foundation + Save/Cancel + language + New task | en_ru (reference verified by tests)                                                                                     |
| 2     | Shell + remaining Dashboard                    | en_ru (desktop RU + light/dark/system sampled live; mobile 390px menu sampled)                                          |
| 3     | Four create flows                              | en_ru (date-picker chrome sampled live in RU; Meeting 403/conflict/network copy sampled live via request intercept)     |
| 4     | Automated + visual acceptance                  | partial (light/dark + HY font probe + live Meeting errors done; live token-expiry and two-user logout/login still open) |
| 5     | Review, docs, report                           | in_progress (journals updated after this live pass; two-user login and production rollout not done)                     |
