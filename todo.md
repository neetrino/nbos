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
- [x] Project hub create — contact / company pickers
- [x] Finance — client service project, expense plan project, invoice create project
- [x] Support — create ticket + triage assignee / product / contact
- [x] Partners agreements — agreement owner (employee)
- [x] Company sheet + create dialog — primary / billing contact

## Phase 3 — Platform

- [x] Mount `EntityRelationHost` at app layout (`AppEntityRelationProvider`)
- [x] Employee open from picker (`EmployeeSheet`)
- [x] Product open from picker (`/projects/:projectId/products/:id`)
- [x] Project open from picker (`/projects/:id`)
- [x] Shared search loaders (`useContactRelationSearch`, etc.)
- [x] Product entity sheet + create flow (open route; create via `CreateProductDialog` when `projectId` set)
- [x] Docs: `docs/NBOS/03-Business-Logic/07-Relation-Field-Picker.md`
- [x] Deprecate legacy `SearchField` for relation use cases (JSDoc; Drive / marketing attribution stay)

## Contact multi-select

- [x] `RelationPickerField` `multiple` mode (chips, toggle in list, per-chip clear)
- [x] Deal: `additionalContactIds[]` API + draft + **Additional contacts** multi picker
- [ ] Lead / Delivery: multi-contact when canon + API extend beyond single `contactId`

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
