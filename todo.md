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

**Examples:** Drive (Library/Company/…), Project Hub (All/Active), Tasks (board views).

**Use:** `PageHero` on the page with `PageHeroTabs` + `onChange`.

---

### Pattern B — multi-route module (like CRM, Finance)

Several URLs under one module; tabs = **Links**.

```
[ModuleName] | [Dashboard] [Leads] [Deals] | search | view | actions
```

**Layout:** `ModuleHeroSlotProvider` + `PageHeroNavLinks` in `*/layout.tsx`.  
**Pages:** `useModuleHeroSlots({ search, viewMode, trailing })` — **no duplicate page title** in hero.

**Examples:** CRM (`/crm/layout.tsx`), next: Finance.

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
- [x] `/crm/leads`, `/crm/deals` — `useModuleHeroSlots` (no page title in hero)
- [x] `/crm/dashboard` — export in trailing slot

### Workspaces (Pattern A)

- [x] Work Spaces — PageHero + Settings

### Clients (Pattern A or B — TBD)

- [ ] companies + contacts — PageHero

---

## Phase 3 — Delivery Board (Pattern A + secondaryTabs)

- [ ] Active → PageHero + kind tabs
- [ ] Closed → minimal filters only
- [ ] Integrated search/filters; Settings

---

## Phase 4 — Finance (Pattern B — same as CRM)

- [ ] `finance/layout.tsx` → `Finance` + `PageHeroNavLinks` (scrollable tabs)
- [ ] Each list page → `useModuleHeroSlots`; remove `*PageHeader.tsx`
- [ ] Export / period → Settings sheet

---

## Phase 5 — Remaining modules

- [ ] Partners, Marketing layout (Pattern B if multi-route)
- [ ] Team, Mail, Documents, Support, Reports
- [ ] Calendar, Dashboard — title-only or Pattern A

---

## Phase 6 — Cleanup

- [ ] Remove unused `*PageHeader.tsx`, old `*SettingsDialog.tsx`
- [ ] Remove `FilterBar` on migrated pages
- [ ] Visual QA: mobile wrap, module nav scroll, settings sheet a11y
- [ ] Update `docs/IMPLEMENTATION_PROGRESS.md`

---

## Design rules

1. **One hero card** — module name + tabs + search + view + primary CTA + settings
2. **Pattern B:** module name only in layout; never repeat "Lead Pipeline" next to "Leads" tab
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
