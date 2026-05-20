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

We change one surface first, then stop for visual review.

If the approved surface feels right, use it as the reference for the next surfaces. If not, adjust the standard and only then continue.

---

## Step 1 — Visual Reference Surface

- [x] ~~**Subscription detail sheet** — Deal-style draft + InlineField + Save/Cancel footer~~

Why this first:

- it is smaller than Client Services;
- it has enough real fields to validate the style;
- it can prove the rule: list/card click opens a sheet, not a separate page;
- changes are easier to review before touching larger Finance surfaces.

Planned changes:

- open subscription details in a right-side sheet from the subscription surface;
- keep create/edit flow compact;
- remove unnecessary repeated field names where the value is self-explanatory;
- use small muted labels only for ambiguous fields like billing day, billing frequency, project, partner, tax status;
- use soft spacing and separators instead of many bordered cards;
- keep status and money colors meaningful, not decorative;
- avoid separate page unless subscription becomes a real workspace.

Review target:

- user opens one subscription and checks whether the sheet feels like the desired clean Bitrix/task-style UI.

---

## Step 2 — Finance Invoice Detail

- [x] ~~**Invoice detail sheet** — money stages bar + Deal-style sections; inline official/payments~~

Planned changes:

- remove oversized one-value hero panels;
- make amount, paid/debt/overdue state, due date, and tax state a compact summary;
- reduce duplicated labels and repeated values;
- group linked entities as clean compact rows/chips;
- keep payments and proofs as operational sections, not visual noise;
- keep color only for paid, debt, overdue, cancelled, selected actions.

Review target:

- invoice from board/list opens in a clean operational sheet with no wasted blocks for small values.

---

## Step 3 — Client Services

- [ ] **Client service detail/edit sheet** — replace large edit/detail dialog with sheet.
- [ ] **Client service quick create** — keep as quick dialog only if the create flow stays short.

Planned changes:

- open existing client service in a sheet;
- separate detail/edit layout from quick create;
- move finance links, proofs, renewals, and linked project info into compact sections;
- avoid a large centered popup for full edit/detail;
- keep create dialog focused on the minimum required fields if quick create remains useful.

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

- [ ] Subscription detail sheet approved as the first visual reference.
- [ ] Invoice detail follows the approved compact pattern.
- [ ] Client Services no longer uses a large full-form dialog for detail/edit.
- [ ] Tasks quick create/detail matches the clean task-style reference.
- [ ] Support ticket detail uses the same sheet-first hierarchy.
- [ ] CRM and Delivery cleanup pass completed without changing business behavior.
