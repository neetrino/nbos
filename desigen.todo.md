# NBOS — Design Rollout TODO

`[ ]` open · `[x]` done · `[review]` waiting for visual approval

Canon:

- [`docs/NBOS/05-UI-Specifications/10-Entity-Detail-Sheet-Standard.md`](docs/NBOS/05-UI-Specifications/10-Entity-Detail-Sheet-Standard.md)
- [`docs/NBOS/05-UI-Specifications/09-Kanban-Board-and-List-Standard.md`](docs/NBOS/05-UI-Specifications/09-Kanban-Board-and-List-Standard.md)

---

## Goal

Bring opened entity cards, sheets, and quick dialogs to one NBOS visual language:

- clean task-style layout;
- no duplicated labels like `Name`, `Title`, `Description` when the meaning is obvious;
- fewer nested borders and oversized one-value panels;
- compact working density;
- color only for status, risk, selected state, or action;
- sheet for entity detail/edit;
- quick dialog only for short create/action flows;
- full page only for true workspace scenarios.

---

## Working Rule

1. **One checkpoint at a time** — implement one bullet (or one logical slice), then stop for visual review when the step says so.
2. **After each completed checkpoint** — update this file (`[x]` / `[review]` + short note what shipped) and **create a git commit** for that slice only (do not batch unrelated surfaces).
3. If the approved surface feels right, use it as the reference for the next surfaces. If not, adjust the standard and only then continue.

**Shared UI (reuse, do not reinvent per module):**

- `PipelineStagesBar`, `DetailSheetTabBar`, `DetailSheetSection`, `DetailSheetCollapsibleSection`, `InlineField`, `DetailSheetFormFooter`, `EntitySheetFloatingRail`
- Width tokens: `DETAIL_SHEET_CONTENT_WIDTH_COMPACT_CLASS` (invoice), `MEDIUM` (client service), `75VW` (deal/subscription workspace)

---

## Step 1 — Visual Reference Surface

- [x] ~~**Subscription detail sheet** — Deal-style draft + InlineField + Save/Cancel footer; list deep-link `openSubscription`~~
- [review] **Visual approval** — confirm sheet density/labels with product owner before treating as platform reference.

Why this first:

- it is smaller than Client Services;
- it has enough real fields to validate the style;
- it can prove the rule: list/card click opens a sheet, not a separate page;
- changes are easier to review before touching larger Finance surfaces.

Review target:

- user opens one subscription and checks whether the sheet feels like the desired clean Bitrix/task-style UI.

---

## Step 2 — Finance Invoice Detail

- [x] ~~**Invoice detail sheet (General / Payments / History tabs)**~~
- [x] ~~Compact sheet width (42rem), header = code + money badge only (no duplicate amount/type/project line)~~
- [x] ~~`PipelineStagesBar` chevron money stages (shared with Deal)~~
- [x] ~~Editable **Amount** + **Tax Status** (select Tax / Tax Free) + `DetailSheetFormFooter`; API `PATCH /finance/invoices/:id`~~
- [x] ~~Official invoice, linked, proofs sections; payments tab with `InlineField` record form~~
- [review] **Visual approval** — invoice sheet after Step 2 slice.

Review target:

- invoice from board/list opens in a clean operational sheet with no wasted blocks for small values.

---

## Step 3 — Client Services

- [x] ~~**Client service detail/edit sheet** — medium width (48rem), collapsible Basics/Billing/Dates, `InlineField`, proofs + connections, draft footer, floating rail + `openClientService`~~
- [x] ~~**Client service quick create** — remains compact dialog (`ClientServiceCreateDialog`, not full detail form)~~
- [review] **Visual approval** — client service sheet + create dialog.

Planned changes (done in code; review UI):

- open existing client service in a sheet;
- separate detail/edit layout from quick create;
- finance links, proofs in compact sections;
- avoid large centered popup for full edit/detail.

Review target:

- editing a client service feels like working with an entity card, not filling a heavy modal.

---

## Step 4 — Tasks / Work Spaces

- [ ] **Task quick create** — use the provided task popup style as visual reference.
- [ ] **Task detail sheet** — align full task detail with the same clean field hierarchy.

Planned changes:

- title as primary editable field without `Title` label;
- description area without heavy label unless needed;
- assignee, deadline, status, project as compact rows;
- files/checklists/project blocks as lightweight action chips or calm sections;
- keep completion and blocker states as meaningful color signals.

Review target:

- task create/detail feels fast, clean, and not like a database form.

---

## Step 5 — Support Ticket Detail

- [ ] **Support ticket detail sheet** — apply the same sheet-first style.

Planned changes:

- title-first layout;
- compact status, priority, assignee, client/project metadata;
- conversation/activity as the main work area;
- files and linked tasks as secondary compact sections;
- avoid large bordered blocks for one-line values.

Review target:

- ticket detail feels like the same product family as tasks and finance sheets.

---

## Step 6 — CRM / Delivery Cleanup Pass

- [ ] **CRM Lead sheet cleanup** — remove remaining duplicated labels/heavy chrome where found.
- [ ] **CRM Deal sheet cleanup** — keep existing sheet behavior but align density and labels.
- [ ] **Delivery item sheet cleanup** — preserve readiness logic, reduce visual noise if found.

Note: Deal pipeline stages now use shared `PipelineStagesBar` (Step 2 collateral).

Planned changes:

- do not change business logic;
- preserve stage-gate highlights;
- only adjust visual hierarchy, spacing, duplicated labels, and unnecessary card chrome;
- keep module-specific fields local.

Review target:

- already-working modules feel consistent with the new approved sheet style.

---

## Stop Conditions

Stop and ask before continuing if:

- the first subscription sheet does not match the desired style;
- a surface requires a real product decision, not just UI cleanup;
- replacing a page with a sheet would remove needed workspace behavior;
- a change touches schema, API contracts, or unrelated business logic.

---

## Done When

- [review] Subscription detail sheet approved as the first visual reference.
- [review] Invoice detail follows the approved compact pattern.
- [x] Client Services no longer uses a large full-form dialog for detail/edit.
- [ ] Tasks quick create/detail matches the clean task-style reference.
- [ ] Support ticket detail uses the same sheet-first hierarchy.
- [ ] CRM and Delivery cleanup pass completed without changing business behavior.
