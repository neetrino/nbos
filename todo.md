# PageHero + unified search/filters + Settings sheet

**Goal:** One Drive-style page header on all list pages; Bitrix24-style search with inline filter chips; rare actions in Settings (right sheet, not dialog). Remove duplicate headers and old patterns.

**Status legend:** `[ ]` todo · `[~]` in progress · `[x]` done

---

## Two layout patterns

### Pattern A — single route

`PageHero` + `PageHeroTabs` / `ViewModeSwitch` + `IntegratedSearchFilters` on the page.

**Done:** Drive (partial), Tasks, Project Hub, Work Spaces, Partners, Delivery Board.

### Pattern B — multi-route module

`*/layout.tsx`: `ModuleHeroSlotProvider` + `PageHeroNavLinks`. Pages: `useModuleHeroSlots`.

**Done:** CRM, Clients, Marketing. **Deferred:** Finance.

---

## Phase 0 — Foundation (shared)

- [x] `PageHero`, `PageHeroTabs`, `PageHeroNavLinks`, `ModuleHeroSlotProvider`, `useModuleHeroSlots`
- [x] `PageHeroSearch`, `PageSettingsSheet`, `IntegratedSearchFilters`
- [x] `ViewModeSwitch`, exports from `components/shared`
- [x] `LIST_SEARCH_INPUT_PROPS` — browser autofill off on list search fields
- [x] `DriveViewModeSwitch` → shared `ViewModeSwitch`
- [ ] `DriveHero` → compose shared pieces
- [ ] Deprecate / remove `PageHeader` after all migrations

---

## Phase 1 — Pilot (Pattern A)

- [x] Tasks — PageHero + Settings sheet + integrated search
- [x] Project Hub — PageHero + Settings sheet
- [ ] Delete `TasksPageSettingsDialog.tsx`

---

## Phase 2 — CRM & workspaces

- [x] CRM (layout + leads / deals / dashboard)
- [x] Work Spaces
- [x] Clients (layout + contacts / companies)

---

## Phase 3 — Delivery Board (Pattern A)

- [x] Active/Closed tabs; `IntegratedSearchFilters` in hero
- [x] Type / Owner / Status (Active); Type / Project / Result (Closed); default Type = All
- [x] Module adapters: `delivery-board-kind-hero-filter`, `use-delivery-board-*-hero-filters`
- [ ] Visual QA + Settings sheet (optional)

---

## Phase 4 — Finance — **DEFERRED**

- [ ] `finance/layout.tsx` + `useModuleHeroSlots`; remove `*PageHeader.tsx`

---

## Phase 5 — Remaining modules

### List pages (priority)

- [x] **Team** — `/team`
- [x] **Documents** — `/documents` (hub; sections / detail later)
- [ ] **Mail** — `/mail`, thread detail
- [ ] **Reports** — reports center chrome
- [ ] **Support** — `/support` (custom stats row → hero)
- [x] **Credentials** — `/credentials`

### Other

- [x] Partners
- [x] Marketing (layout + board / dashboard / settings / attribution)
- [ ] Calendar, Dashboard — title-only or light Pattern A
- [ ] My Company sub-pages
- [ ] Settings (hub, roles, departments, lists, integrations)
- [ ] Tasks sub-routes: `/tasks/recurring`, `/tasks/automation`
- [ ] Support: `/support/change-control`

---

## Phase 6 — Cleanup

- [ ] Remove unused `*PageHeader.tsx`, `PartnersPageHeader`, old `*SettingsDialog`
- [ ] Remove `FilterBar` on migrated pages only
- [ ] Remove `ClientsDirectoryTabs` if unused
- [ ] Visual QA: mobile wrap, module nav scroll, settings sheet a11y
- [ ] Update `docs/IMPLEMENTATION_PROGRESS.md`

---

## Design rules

1. One hero card — title + tabs + search + view + CTA + settings
2. Pattern B: module title only in layout; no duplicate page title in hero
3. Filters in search — chips; panel on empty focus; hide panel while typing
4. Settings sheet for rare actions
5. **Shared UI + module adapters** — generic components in `components/shared`; filter config / state mapping in `features/*` when non-trivial

---

## File map

| File                           | Role                                         |
| ------------------------------ | -------------------------------------------- |
| `page-hero/PageHero.tsx`       | Shell                                        |
| `IntegratedSearchFilters.tsx`  | Search + filter panel                        |
| `list-search-input-props.ts`   | Autocomplete off                             |
| `features/*/…-hero-filters.ts` | Module-specific filter mapping (when needed) |
