# PageHero migration

**Status:** `[ ]` todo · `[x]` done

---

## Priority order

### Tier 1 — Easy `[x]` (done)

- [x] Tasks: `/tasks/recurring`, `/tasks/automation`
- [x] Support: `/support/change-control`
- [x] Dashboard
- [x] Calendar
- [x] Settings: hub, departments, roles, lists, module-settings, integrations
- [x] My Company: hub, KPI, SOP, compensation, sales-bonus, checklist-templates list, checklist-stage-rules
- [x] Documents: `/documents/sections/[sectionId]`

### Tier 2 — Medium `[x]` (done)

- [x] `DriveHero` → shared `PageHero` + insights panel below
- [x] Documents: `/documents/[id]` detail
- [x] My Company: checklist template `new`, `[id]` (forms)
- [x] Phase 6 cleanup (`TasksPageSettingsDialog`, `PartnersPageHeader` removed)
- [ ] Delivery Board: visual QA in browser, optional Settings sheet (manual)

### Tier 3 — Hard (last — design first)

- [x] **Support** `/support` — split monolith, PageHero + IntegratedSearchFilters (stats removed)
- [ ] **Finance** — Pattern B layout + all list pages

---

## Already done (main modules)

Foundation, CRM, Clients, Marketing, Tasks, Project Hub, Work Spaces, Partners, Delivery Board, Team, Documents hub, Mail, Reports, Credentials

---

## Design rules

Shared `PageHero` + module adapters only when filters are non-trivial.
