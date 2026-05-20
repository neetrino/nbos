# Kanban Board and List Standard

> NBOS platform UI standard for board/list screens with active and closed scopes.

## Purpose

This document fixes one visual standard for modules that show work items in a kanban board and a list/table view.

It applies to:

- CRM Leads / Deals;
- Delivery Board;
- Tasks / Work Spaces;
- Support tickets;
- Finance boards where workflow stages exist.

Business rules, stage-gates and module-specific fields stay in module canon. This document defines the shared **visual model**.

---

## Core Decision

NBOS uses one visual model:

```text
Scope: Active | Closed | All
View:  Board | List
```

Changing `Active / Closed / All` changes the data scope. It must not switch the user into a different visual product.

Changing `Board / List` changes the presentation. It must not change the meaning of statuses or available entity details.

---

## Board Standard

### Active Board

Active board shows active workflow stages as columns.

Examples:

- Deal: `Start Conversation → Discuss Needs → Send Offer → Get Answer → Deposit & Contract`
- Delivery: `Starting → Development → QA → Transfer`
- Support: `New → In Progress → Waiting Client`

Rules:

- Columns use the shared kanban surface, spacing and scroll behavior.
- Cards use the same entity card component as the closed board for that module.
- Drag between active stages follows the module's transition rules.
- Terminal outcomes are not mixed into active columns as normal work stages.

### Terminal Drop Zones / Terminal Actions

Closing an item should be visible and fast, like Deal terminal drop zones.

Allowed terminal outcomes are shown as a dedicated close area or action group:

- Deal: `Won`, `Failed`
- Delivery: `Done`, `Cancelled`
- Support: `Resolved`, `Cancelled`, `Duplicate`
- Finance: `Paid`, `Cancelled`, `Written off`

Rules:

- Successful and unsuccessful closure are outcomes, not active workflow stages.
- If drag closure is available, terminal drop zones use the same visual treatment across modules.
- If action buttons are used inside a sheet/card, they must trigger the same transition flow as terminal drop zones.
- Required confirmation/reason dialogs are lightweight and do not duplicate the entity form.

### Closed Board

Closed board uses the same board/card visual system as active board.

Closed columns are terminal outcome columns:

```text
Done | Cancelled
Won  | Failed
Resolved | Cancelled | Duplicate
Paid | Written off | Cancelled
```

Rules:

- Closed board must not have a custom unrelated layout.
- Column width, gutters, card density and scroll behavior must match the active board unless the module has a documented responsive exception.
- Closed cards are read-only by default.
- Mutation actions are hidden or disabled; details/open actions remain available.
- Outcome badges replace active stage progress indicators.

---

## List Standard

Every kanban module should provide list view parity:

```text
Active + List
Closed + List
All + List
```

Rules:

- Active list and closed list use the same table/list component.
- Columns remain stable across scopes where possible.
- Scope-specific columns may be appended, not replace the whole visual language.
- Closed list adds outcome-oriented fields such as `Result`, `Closed at`, `Reason`, `Closed by` when available.
- Active list keeps operational fields such as current stage, owner, deadline, priority and blocker state.

Delivery Board currently has Closed List but no Active List. The target standard requires adding Active List and making both scopes share one row/table renderer.

---

## Card Standard

Each module owns its card content, but the layout contract is shared.

Required zones:

1. **Header:** type/icon, title, short subtitle/context.
2. **Primary meta:** amount, deadline, owner, project/client, priority — based on module.
3. **Status/outcome badge:** active stage or terminal result.
4. **Risk/readiness marker:** blockers, overdue, readiness count, if applicable.
5. **Actions:** open details; optional contextual quick actions.

Rules:

- The same module card component should render in active and closed board states.
- Closed cards can reduce actions but should not become a different design family.
- Density variants are allowed (`normal`, `compact`) only when they preserve the same visual language.
- Card colors indicate entity type/risk consistently across active and closed scopes.

---

## Stage-Gate UX Integration

This standard works together with the stage-gate UX standard:

- blocked transition opens the entity sheet;
- required fields are highlighted in the real sheet/card form;
- no heavy transition modal with duplicate fields;
- action blockers appear in readiness/summary sections with deep links;
- active board must not leave a blocked card in the wrong column.

Reference plan: `../01-Platform-Overview/04-Stage-Gate-UX-Standard-Plan.md`.

---

## Module Alignment

| Module           | Current State                                            | Target                                                         |
| ---------------- | -------------------------------------------------------- | -------------------------------------------------------------- |
| CRM Deals        | Active/Closed board and list are visually consistent     | Reference visual implementation                                |
| CRM Leads        | Same visual family as Deals                              | Keep aligned with Deals                                        |
| Delivery Board   | Closed board/list use custom layout; Active List missing | Same board/list visual standard across Active and Closed       |
| Product Overview | Inline stage card pattern                                | Align terminal actions and blocked transition UX with standard |
| Finance          | Mixed workflow surfaces                                  | Adopt standard when kanban/workflow boards exist               |
| Support          | Future / TBD                                             | Adopt standard from first implementation                       |
| Tasks            | Existing work-space boards                               | Align card density, terminal outcomes and list parity          |

---

## Delivery Board Specific Target

Delivery Board must move from special closed layouts to the shared model:

```text
Active + Board  → Delivery kanban columns with delivery cards
Closed + Board  → Same board/card renderer, columns Done | Cancelled
Active + List   → Same row renderer as Closed List, filtered to active lifecycle
Closed + List   → Same row renderer, filtered to terminal lifecycle
```

Implementation notes:

- Replace the custom visual behavior of `DeliveryBoardClosedBoard` with the shared board renderer.
- Replace separate closed-table-only row logic with one `DeliveryBoardList` / row renderer that supports active and closed scopes.
- Keep Delivery-specific fields, but preserve the same table structure and card family across scopes.

---

## Acceptance Criteria

- [ ] Active and Closed scopes do not switch to unrelated visual layouts.
- [ ] Board view always feels like the same kanban component.
- [ ] List view always feels like the same list/table component.
- [ ] Terminal outcomes are visually separated from active stages.
- [ ] Closed cards are read-only but visually consistent with active cards.
- [ ] Every module with `Board` view has matching `List` view unless explicitly documented.
- [ ] Stage-gate blockers use the shared sheet-highlight UX.
