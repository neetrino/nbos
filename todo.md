# Global relation picker (search · select · create · open sheet)

Unified UX for linking entities (Client, Partner, Project, Contact, …) across NBOS. Design reference: deal sheet mockup.

## Phase 0 — Foundation

- [x] `RelationPickerField` — search dropdown, create bar, chip display, clear (X), open sheet on chip click
- [x] `EntityRelationHost` — nested Contact / Company / Partner sheets + shared create dialogs
- [x] Create dialogs accept prefill from search query (`CreateContactDialog`, `CreateCompanyDialog`, `CreateProjectHubDialog`, `CreatePartnerDialog`)
- [x] Deal sheet: Project (remove legacy “New Project” flag), Company, Contact, Partner, marketing client contact
- [x] Unit test: `parseRelationSearchName`

## Phase 1 — CRM sheets

- [ ] Lead sheet — contact link fields where applicable
- [ ] Deal — products / attribution pickers (optional `entityKind` extensions)
- [ ] Migrate remaining `SearchField` relation usages in CRM

## Phase 2 — Other modules

- [ ] Delivery board — team / contact fields
- [ ] Tasks sheet
- [ ] Project hub create / link fields
- [ ] Finance (invoice, expense plan, client service)
- [ ] Support ticket triage
- [ ] Partners agreements card
- [ ] HR employee pickers (open only; create N/A)

## Phase 3 — Platform

- [ ] Mount `EntityRelationHost` at `(app)` layout so nested sheets work on every page
- [x] Project open from picker (`/projects/:id`)
- [ ] Product entity sheet + create flow
- [ ] Docs: `docs/NBOS` pattern for relation fields
- [ ] Deprecate legacy `SearchField` for relation use cases (keep for non-entity search)

## Contact multi-select

- [x] `RelationPickerField` `multiple` mode (chips, toggle in list, per-chip clear)
- [ ] API + draft: `contactIds[]` on Deal / Lead / Delivery when canon allows
- [ ] Enable `multiple` on Deal Contact when backend ships

## Design checklist (1:1 target)

- [x] Popover search input on open
- [x] Row: kind label + title + optional subtitle; selected row highlight + checkmark
- [x] Bottom bar: blue tint, `+` circle, “Create …”
- [x] Closed: chip with icon/avatar, label click → sheet, X → clear only
- [ ] Icons per entity kind in picker rows — polish pass

## Notes

- Reuse existing create forms so form changes propagate everywhere.
- [x] `isNewProject` removed from deal draft; project creation via create dialog + picker.
