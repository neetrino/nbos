# Entity Detail Sheet and Quick Dialog Standard

> NBOS platform UI standard for opening, reading, editing, and creating entities from cards, boards, lists, and linked rows.

## Purpose

NBOS uses one clean interaction language for entity details:

- **Sheet** for opening an existing entity in context.
- **Quick dialog** for short creation or confirmation flows.
- **Full page** only for a real workspace.

The target style is compact, light, and operational: close to a fast task creation form, with minimal chrome, no duplicated labels, soft grouping, and color used only when it communicates state or priority.

This standard applies to:

- CRM leads and deals;
- Delivery items and product surfaces;
- Finance invoices, expenses, subscriptions, and client services;
- Support tickets;
- Tasks and Work Spaces.

Module-specific fields, business rules, and actions stay in module canon. This document defines the shared **detail view visual model**.

---

## Core Decision

Opening an entity from a card, board, list, search result, or linked entity should default to a right-side detail sheet.

```text
Card / row / linked entity click -> Entity detail sheet
Quick create / short action       -> Quick dialog
Deep work area                    -> Full page
```

Rules:

- Keep the user in the current board/list context unless the entity has its own workspace.
- Do not open a full page just to inspect or edit one object.
- Do not use a large centered popup for a full entity form.
- Do not duplicate the same entity information in multiple visual zones.

---

## Surface Selection

### Entity Detail Sheet

Use a sheet when the user opens an existing entity or needs to inspect/edit one entity without leaving context.

Examples:

- lead, deal, delivery item;
- invoice, expense, subscription, client service;
- support ticket;
- task.

Rules:

- Sheet is the default detail surface.
- Sheet may include tabs when the entity has clear areas such as General, Finance, Work Space, Files, History.
- Sheet should support deep links when the entity is important enough to share.
- Sheet content must stay compact and readable, not stretched into large empty blocks.

### Quick Dialog

Use a dialog for fast, lightweight flows.

Examples:

- quick task create;
- record payment;
- confirm cancellation;
- enter close reason;
- assign owner;
- upload one proof.

Rules:

- Dialog should be short and focused.
- Dialog should not duplicate a full entity sheet.
- Dialog should not contain long linked-data sections, history, or complex edit forms.
- Dialog labels may be omitted when the field role is visually obvious.

### Full Page

Use a full page only when the object is a dedicated workspace.

Examples:

- project workspace;
- complex reporting page;
- large document or file area;
- long operational workspace where the user works for a long session.

Rules:

- A full page must provide value beyond the entity sheet.
- A full page should not be created just because the entity has many fields.
- If the page and sheet would show the same content, use a sheet.

---

## Detail Sheet Layout

Each entity sheet follows the same visual sequence.

```text
Title / status / actions
Primary editable summary
Key people and dates
Operational sections
Linked entities
Files / proofs / history
```

Rules:

- The top title is the entity title. Do not label it again as `Name` or `Title`.
- The main description area is self-explanatory. Do not label it as `Description` unless the context is unclear.
- Use labels only where the field would be ambiguous without them.
- When labels are needed, make them small, quiet, and secondary.
- Prefer inline field rows and soft separators over nested bordered cards.
- Avoid large blocks for one short value.
- Avoid repeating the same value in the header, hero panel, and details grid.

---

## Field Label Rules

The design should feel like a working form, not a database record.

Use explicit labels for:

- dates with different meanings, such as `Due`, `Paid`, `Created`;
- money fields with different meanings, such as `Cost`, `Charge`, `Paid`, `Debt`;
- people roles, such as `Owner`, `Assignee`, `Client`;
- status-like values when multiple status dimensions exist.

Do not add visible labels for:

- title at the top of the sheet;
- obvious description/body text;
- single obvious file areas;
- values already explained by section context;
- badge text that already names the state.

When a label is needed:

- use small muted text;
- keep it close to the value;
- do not allocate a whole large row if the value is one word;
- do not repeat the same label in section title and field label.

---

## Density and Spacing

NBOS detail views should be compact and calm.

Rules:

- Prefer `gap-3` / `gap-4` density for related fields.
- Use `gap-5` / `gap-6` only between major sections.
- Use thin separators or whitespace before adding another bordered surface.
- A section surface should group related work, not wrap every small field.
- On wide sheets, use two or three columns for short fields.
- On narrow screens, collapse to one column without changing the content hierarchy.

Anti-patterns:

- big card with one short value;
- label/value rows where the label is longer than the content;
- repeated section titles and field labels;
- multiple borders around the same information;
- large empty hero panels for a single amount or status.

---

## Color Usage

Color is a signal, not decoration.

Use color for:

- status and outcome;
- overdue / blocked / risk;
- success / paid / completed;
- warnings that require action;
- selected state and primary actions.

Do not use color for:

- random section decoration;
- every card border;
- duplicated badges that do not add meaning;
- making a neutral field look important when it is not.

Rules:

- Keep neutral UI mostly white, muted, and low-border.
- Use soft tinted backgrounds for meaningful state only.
- Important colors must stay consistent across modules.
- If color does not help the user decide what to do, keep it neutral.

---

## Editing Pattern

Entity sheets should allow fast work without turning into heavy forms.

Rules:

- Prefer inline editable fields or focused edit controls where possible.
- Group edit controls near the data they change.
- Keep destructive actions visually separate.
- Use a quick dialog for small actions that need confirmation or a reason.
- Use stage-gate field highlights in the real sheet, not in a duplicate modal.

---

## Reference implementation (code)

| Pattern                                     | Location                                                                                   |
| ------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Quick create (compact dialog)               | `apps/web/src/components/shared/quick-create-task/QuickCreateTaskDialog.tsx`               |
| Task detail sheet (wide operational layout) | `apps/web/src/features/tasks/components/TaskSheet.tsx`                                     |
| Compact finance detail sheet                | `apps/web/src/features/finance/components/InvoiceSheet.tsx`, `SubscriptionDetailSheet.tsx` |
| Deep-link query keys                        | `OPEN_*_QUERY` constants under `apps/web/src/features/*/constants/*-deep-link.ts`          |

---

## Module Alignment

| Module                     | Status / target                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------- |
| CRM Leads / Deals          | Sheet-first ✓; stage-gate field highlights ✓                                                      |
| Delivery Board             | Detail sheet + readiness sections ✓                                                               |
| Product / Project surfaces | Sheets + stage-gate highlights on overview ✓                                                      |
| Finance Invoices           | Compact sheet ✓; money-status gate highlights on kanban move ✓                                    |
| Finance Subscriptions      | List sheet (`openSubscription`) + workspace page ✓                                                |
| Client Services            | Quick create dialog + detail sheet ✓                                                              |
| Support Tickets            | Title-first compact sheet ✓                                                                       |
| Tasks / Work Spaces        | **Visual reference** — shared `QuickCreateTaskDialog` + `TaskSheet` on `/tasks` and Work Spaces ✓ |

---

## Acceptance Criteria

- [ ] Clicking an entity card/row opens a sheet unless a full workspace is explicitly justified.
- [ ] Large centered dialogs are not used for full entity detail/edit forms.
- [ ] Quick dialogs stay short and action-focused.
- [ ] Titles and obvious descriptions are not labeled twice.
- [ ] Labels appear only when they add clarity.
- [ ] Sheet sections use compact spacing and avoid nested bordered boxes.
- [ ] Color communicates status, risk, selection, or action only.
- [ ] Finance, Support, Tasks, CRM, and Delivery feel like one product family while preserving local business fields.
