# PageHero + unified search/filters + Settings sheet

**Goal:** One Drive-style page header on all list pages; Bitrix24-style search with inline filter chips; rare actions in Settings (right sheet, not dialog). Remove duplicate headers and old patterns.

**Status legend:** `[ ]` todo · `[~]` in progress · `[x]` done

---

## Phase 0 — Foundation (shared)

- [x] `PageHero` — title + pill tabs + center search slot + view mode + actions (Drive layout)
- [x] `ViewModeSwitch` — configurable options (icons + labels)
- [x] `PageHeroTabs` — pill tab list
- [x] `PageHeroSearch` — hero search field styling
- [x] `PageSettingsSheet` — Settings trigger + right sheet (replaces Dialog pattern)
- [x] `IntegratedSearchFilters` — search + filter chips + popover panel (Bitrix24-style v1)
- [x] Export all from `components/shared/index.ts`
- [x] `DriveViewModeSwitch` → thin wrapper over shared `ViewModeSwitch`
- [ ] `DriveHero` → compose shared pieces (no duplicate styles)
- [ ] Deprecate / remove `PageHeader` after all migrations

---

## Phase 1 — Pilot pages

### Tasks

- [x] Remove **Work Spaces** button from header
- [x] Move **Recurring**, **Automation**, **Export scope stats** → Settings sheet
- [x] Header → `PageHero` (title, view mode, + New Task, Settings)
- [x] `FilterBar` row → `IntegratedSearchFilters` inside `PageHero`
- [ ] Delete `TasksPageSettingsDialog.tsx` after sheet verified

### Project Hub

- [x] `projects/page.tsx` → `PageHero` + `IntegratedSearchFilters`
- [x] Settings → `PageSettingsSheet` (CSV export)
- [x] Remove inline header + separate `FilterBar` row

---

## Phase 2 — CRM & workspaces

- [x] `/crm/leads` — PageHero + integrated search/filters; + Lead primary; Settings for exports
- [x] `/crm/deals` — same
- [ ] `/work-spaces` — PageHero; Settings for directory options
- [ ] `/clients` companies + contacts — PageHero

---

## Phase 3 — Delivery Board

- [ ] Active tab → `PageHero` + `secondaryTabs` (kind: All / Products / Extensions)
- [ ] **Closed** tab → minimal filters only (search + essential closed filters; drop Role/Status noise)
- [ ] Integrated search/filters; Settings for exports/options

---

## Phase 4 — Finance (all list pages)

Move to header: period/view in hero tabs or view switch; **Export CSV**, **Export scope stats**, period tools → **Settings sheet**.

- [ ] Invoices — replace `InvoicesPageHeader` + `InvoiceFilters` row
- [ ] Payments — `PaymentsPageHeader`
- [ ] Expenses — `ExpensesPageHeader` + filter row
- [ ] Subscriptions — `SubscriptionsPageHeader`
- [ ] Orders — `OrdersPageHeader`
- [ ] Payroll / Wallet / Client services — align if list layout

**Delete after migration:** `features/finance/components/*/*PageHeader.tsx` (6 files)

---

## Phase 5 — Remaining modules

- [ ] Partners — `PartnersPageHeader`
- [ ] Team, Mail, Documents, Marketing dashboard, Support, Reports — PageHero or minimal title-only hero
- [ ] Calendar, Dashboard — title-only `PageHero` (no search)

---

## Phase 6 — Cleanup

- [ ] Remove unused `*PageHeader.tsx` feature files
- [ ] Remove `FilterBar` usages on migrated pages (keep component for legacy until Phase 6 end)
- [ ] Grep: no `PageHeader` on list pages except detail/placeholder
- [ ] Visual QA: mobile wrap, tab scroll, settings sheet a11y
- [ ] Update `docs/IMPLEMENTATION_PROGRESS.md` when Phase 1–2 complete

---

## Design rules (do not regress)

1. **One line hero** where possible: title | tabs | search | view | primary CTA | settings | refresh
2. **Filters live in search** — chips inside field; panel on focus (not a second toolbar row)
3. **Settings sheet** opens from the right; exports and rare links live there
4. **Primary CTA** stays visible (+ Project, + Lead, + Task, etc.)
5. **Delivery Board Closed** — intentionally reduced filter set

---

## File map (new shared)

| File                                                 | Role                            |
| ---------------------------------------------------- | ------------------------------- |
| `components/shared/page-hero/PageHero.tsx`           | Main hero shell                 |
| `components/shared/page-hero/PageHeroTabs.tsx`       | Pill tabs                       |
| `components/shared/page-hero/PageHeroSearch.tsx`     | Search input                    |
| `components/shared/page-hero/ViewModeSwitch.tsx`     | View mode pills                 |
| `components/shared/page-hero/page-hero-constants.ts` | Surfaces / scroll               |
| `components/shared/PageSettingsSheet.tsx`            | Settings right sheet            |
| `components/shared/IntegratedSearchFilters.tsx`      | Bitrix24-style search + filters |
