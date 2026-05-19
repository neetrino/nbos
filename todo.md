# PageHero + unified search/filters + Settings sheet

**Goal:** One Drive-style page header on all list pages; Bitrix24-style search with inline filter chips; rare actions in Settings (right sheet, not dialog). Remove duplicate headers and old patterns.

**Status legend:** `[ ]` todo · `[~]` in progress · `[x]` done

---

## Two layout patterns (decide per module)

### Pattern A — single route (like Drive)

One URL; tabs = **in-page state** (not navigation).

```
[ModuleName] | [tab] [tab] | search | view | actions
```

**Examples:** Drive (Library/Company/…), Project Hub (All/Active), Tasks (board views), Partners, Delivery Board.

**Use:** `PageHero` on the page with `PageHeroTabs` + `onChange`.

---

### Pattern B — multi-route module (like CRM, Clients, Marketing)

Several URLs under one module; tabs = **Links**.

```
[ModuleName] | [Dashboard] [Leads] [Deals] | search | view | actions
```

**Layout:** `ModuleHeroSlotProvider` + `PageHeroNavLinks` in `*/layout.tsx`.  
**Pages:** `useModuleHeroSlots({ search, viewMode, trailing })` — **no duplicate page title** in hero.

**Examples:** CRM, Clients, Marketing. **Finance — deferred** (return later).

| Component                | Role                                            |
| ------------------------ | ----------------------------------------------- |
| `ModuleHeroSlotProvider` | Layout: title + route tabs + merges child slots |
| `PageHeroNavLinks`       | Pill tabs as `Link` (active by pathname)        |
| `useModuleHeroSlots`     | Child page registers search/view/CTA            |

---

## Phase 0 — Foundation (shared)

- [x] `PageHero` — title + pill tabs + center search slot + view mode + actions
- [x] `ViewModeSwitch` — configurable options
- [x] `PageHeroTabs` — pill tabs (state)
- [x] `PageHeroNavLinks` — pill tabs (routes) — **Pattern B**
- [x] `ModuleHeroSlotProvider` + `useModuleHeroSlots` — **Pattern B**
- [x] `PageHeroSearch` — hero search field styling
- [x] `PageSettingsSheet` — Settings right sheet
- [x] `IntegratedSearchFilters` — search + chips + panel (closes on type)
- [x] Export all from `components/shared/index.ts`
- [x] `DriveViewModeSwitch` → shared `ViewModeSwitch`
- [ ] `DriveHero` → compose shared pieces
- [ ] Deprecate / remove `PageHeader` after all migrations

---

## Phase 1 — Pilot pages (Pattern A)

### Tasks

- [x] PageHero, Settings sheet, integrated search
- [ ] Delete `TasksPageSettingsDialog.tsx`

### Project Hub

- [x] PageHero + integrated search + Settings sheet

---

## Phase 2 — CRM & workspaces

### CRM (Pattern B) — done

- [x] `crm/layout.tsx` — `CRM` + Dashboard / Leads / Deals in PageHero
- [x] Remove old `border-b` tab strip
- [x] `/crm/leads`, `/crm/deals` — `useModuleHeroSlots`
- [x] `/crm/dashboard` — export in trailing slot

### Workspaces (Pattern A)

- [x] Work Spaces — PageHero + Settings

### Clients (Pattern B)

- [x] `clients/layout.tsx` — Contacts / Companies nav
- [x] `clients/contacts`, `clients/companies` — `useModuleHeroSlots`

---

## Phase 3 — Delivery Board (Pattern A + secondaryTabs)

- [x] `DeliveryBoardPageHero` — Active/Closed + kind tabs + closed minimal filters
- [x] Removed duplicate header + `DeliveryBoardClosedFiltersBar` from closed tab body
- [ ] Visual QA + Settings sheet (if needed)

---

## Phase 4 — Finance (Pattern B) — **DEFERRED**

> Skip until other modules are done; then same as CRM (`finance/layout.tsx` + `useModuleHeroSlots`).

- [ ] `finance/layout.tsx` → `Finance` + `PageHeroNavLinks`
- [ ] Each list page → `useModuleHeroSlots`; remove `*PageHeader.tsx`
- [ ] Export / period → Settings sheet

---

## Phase 5 — Remaining modules

- [x] Partners — Pattern A (`PageHero` + Settings sheet)
- [x] Marketing — Pattern B (`marketing/layout.tsx`, board/dashboard/settings/attribution)
- [ ] Team, Mail, Documents, Support, Reports
- [ ] Calendar, Dashboard — title-only or Pattern A
- [ ] My Company sub-pages, Settings, Credentials

---

## Phase 6 — Cleanup

- [ ] Remove unused `*PageHeader.tsx`, old `*SettingsDialog.tsx` (Partners, Tasks, Projects)
- [ ] Remove `FilterBar` on migrated pages
- [ ] Remove `ClientsDirectoryTabs` if unused
- [ ] Visual QA: mobile wrap, module nav scroll, settings sheet a11y
- [ ] Update `docs/IMPLEMENTATION_PROGRESS.md`

---

## Design rules

1. **One hero card** — module name + tabs + search + view + primary CTA + settings
2. **Pattern B:** module name only in layout; never repeat page title next to tab
3. **Filters in search** — chips; panel on empty-field focus; hide panel while typing
4. **Settings sheet** — rare actions (export, links), not dialog
5. **Primary CTA** visible (+ Lead, + Deal, + Project, …)

---

## File map

| File                                   | Pattern            |
| -------------------------------------- | ------------------ |
| `page-hero/PageHero.tsx`               | A + B shell        |
| `page-hero/PageHeroTabs.tsx`           | A — state tabs     |
| `page-hero/PageHeroNavLinks.tsx`       | B — route tabs     |
| `page-hero/ModuleHeroSlotProvider.tsx` | B — layout + slots |
| `IntegratedSearchFilters.tsx`          | A + B search       |
| `PageSettingsSheet.tsx`                | A + B settings     |
