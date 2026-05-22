# Global relation picker (search · select · create · open sheet)

Unified UX for linking entities (Client, Partner, Project, Contact, …) across NBOS. Design reference: deal sheet mockup.

## Phase 0 — Foundation

- [x] `RelationPickerField` — search dropdown, create bar, chip display, clear (X), open sheet on chip click
- [x] `EntityRelationHost` — nested Contact / Company / Partner sheets + shared create dialogs
- [x] Create dialogs accept prefill from search query (`CreateContactDialog`, `CreateCompanyDialog`, `CreateProjectHubDialog`, `CreatePartnerDialog`)
- [x] Deal sheet: Project (remove legacy “New Project” flag), Company, Contact, Partner, marketing client contact
- [x] Unit test: `parseRelationSearchName`

## Phase 1 — CRM sheets

- [x] Lead sheet — partner / client relation fields (marketing)
- [x] Lead sheet — seller (employee picker)
- [x] Deal — existing product picker (extension; open product page)
- [x] Deal — seller / PM / assistant (employee pickers)
- [x] CRM entity relation fields migrated (marketing attribution “Which one?” stays `SearchField` — composite id)

## Phase 2 — Other modules

- [x] Delivery board — team employee fields
- [x] Tasks sheet — assignee
- [ ] Project hub create / link fields (`create-project-hub-dialog-fields`)
- [ ] Finance (invoice, expense plan, client service)
- [ ] Support ticket triage
- [ ] Partners agreements card
- [ ] Company sheet contact pickers

## Phase 3 — Platform

- [x] Mount `EntityRelationHost` at app layout (`AppEntityRelationProvider`)
- [x] Employee open from picker (`EmployeeSheet`)
- [x] Product open from picker (`/projects/:projectId/products/:id`)
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
- [x] Icons per entity kind in picker rows

## Notes

- Reuse existing create forms so form changes propagate everywhere.
- [x] `isNewProject` removed from deal draft; project creation via create dialog + picker.
- Sheets register `useRegisterRelationCreated` to patch draft after inline create.
