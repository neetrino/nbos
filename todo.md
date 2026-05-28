# NBOS Finance / Payroll / Unit Economics Plan

## Progress legend

- 🟢 Done — shipped in code/docs for this slice
- 🟡 In progress — partial; see notes in phase
- ⚪ Not started

| Phase                       | Status | Notes                                                                                    |
| --------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| 1 Documentation             | 🟢     | Canon + UI spec + entities + P&L + cleanup/audit/roadmap cross-links (2026-05 slice)     |
| 2 Payroll Run Detail UX     | 🟢     | Matrix primary UX, row/column DnD, pin, reset, context panels, cell dialogs              |
| 3 Bonus logic / manual form | 🟢     | Matrix + Bonus Board manual + audit in matrix dialog and bonus entry sheet               |
| 4 Unit Economics Board      | 🟡     | Five tabs shipped; per-unit drill-down to invoices/payments still pending                |
| 5 API / data model          | 🟢     | Matrix CRUD, layout, planned/reassign, validation, unit-economics GET                    |
| 6 Frontend                  | 🟢     | Matrix workspace, unit economics page, manual bonus form fields                          |
| 7 Validation / audit        | 🟡     | Pre-review validation + audit writes + matrix cell audit read; layout audit optional     |
| 8 Tests / QA                | 🟡     | 147+ unit tests (resolver, matrix, validation, reassign, planned); E2E/manual QA pending |

## Implementation log (`development`)

| Commit      | Summary                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------ |
| `1e984c54`  | Phased plan in `todo.md`                                                                   |
| `11c4930b`  | Payroll allocation matrix + unit economics route                                           |
| `dc9e3942`  | Matrix cell releases + column layout controls                                              |
| `e73b88f4`  | Matrix v2 (DnD, planned/reassign, validation), unit economics API, bonus audit, docs slice |
| `a58237bb`  | P&L/cleanup docs, matrix bonus audit panel in cell dialog                                  |
| `c8c7e404`  | Refresh todo.md progress table after matrix commits                                        |
| `b6c38956`  | Unit economics Funding / cash tab                                                          |
| `84d40c50`  | Unit economics Expenses/Profitability tabs, shared bonus audit panel                       |
| `feef07ec`  | Compensation audit, cleanup register, implementation roadmap cross-links                   |
| _(pending)_ | Bonus entry audit panel pagination + reason display                                        |

---

## Decisions Locked

- `Payroll Run` list page (`/finance/payroll`) stays conceptually as the run index: list/calendar/board of monthly payroll runs.
- Main redesign scope is `Payroll Run Detail` (`/finance/payroll/[id]`).
- Payroll matrix columns are not generic `Project` and not all `Order` records. They are `Delivery Payable Units`: Product / Extension orders that represent real delivery work and can have delivery/team bonuses.
- Matrix includes:
  - all open / in-progress Product / Extension delivery units;
  - closed / done delivery units with unpaid or remaining bonus;
  - manually pinned delivery units when Finance needs to issue an extra/manual bonus later.
- Matrix does not include non-delivery orders such as domains, hosting, licenses, generic services, unless they are explicitly modeled as a delivery-payable unit.
- Manual row/column ordering is persisted in DB per user, per view mode, per payroll run.
- Current `Bonus Pool` concept must be expanded into a wider financial workspace that is not bonus-centric.
- New financial page name: `Unit Economics Board`.
- `Unit Economics Board` belongs in Finance Overview / main finance area, not inside Payroll & Bonus.
- `Bonus Pool` becomes one view/section inside `Unit Economics Board`, not the whole concept.

---

## Core Domain Language

### Delivery Payable Unit

A `Delivery Payable Unit` is a Product / Extension order that appears in delivery work and can generate team bonuses.

It can represent:

- initial product development;
- extension / change request;
- other delivery board unit where employees worked and bonuses may be paid.

It must not represent:

- domain purchase;
- hosting invoice;
- license;
- pass-through service;
- generic non-team expense order.

### Bonus Entry vs Bonus Release vs Expense Payment

These concepts must stay separate.

- `Bonus Entry` = the planned or earned bonus identity.
- `Bonus Release` = the amount included in a specific payroll month.
- `Expense Payment` = the real cash payment after payroll approval.

Payroll Run must not directly mean "money was paid". Payroll Run decides what enters the month. Expenses and payments confirm actual payout.

### Unit Economics

`Unit Economics` is the financial state of a Product / Extension / Order.

It includes:

- invoices;
- payments received;
- receivables remaining;
- expenses;
- planned bonuses;
- released bonuses;
- paid bonuses;
- available cash;
- expected profitability;
- actual profitability;
- over-funding risks.

---

## Phase 1 - Documentation Canon Update

### 1.1 Update Finance Compensation Canon

Update `docs/NBOS/02-Modules/04-Finance/05-Bonus-and-Payroll.md`.

Add or revise sections for:

- `Payroll Run Workspace`;
- `Allocation Matrix`;
- `Employee-centered view`;
- `Order-centered view`;
- `Delivery Payable Unit`;
- manual bonus exceptions from gray cells;
- persistent matrix ordering;
- active row/column financial context;
- clear separation between bonus plan, release, and payment.

Rules to document:

- `Payroll Run Detail` is the work screen for the selected month.
- `/finance/payroll` remains the payroll run index.
- Matrix is a view inside run detail, not the only source of truth.
- Salary lines remain the accounting total.
- Bonus release cells are editable only before payroll approval.
- After approval, changes require correction/adjustment flow.

### 1.2 Update Finance UI Specification

Update `docs/NBOS/05-UI-Specifications/04-Finance-Pages.md`.

Document the new `Payroll Run Detail` UI:

- header and summary;
- view switcher;
- employee-centered matrix;
- order-centered matrix;
- salary lines accounting table;
- bonus release details;
- audit/journal;
- sticky headers and sticky first column;
- horizontal and vertical scrolling;
- active row/column expansion behavior;
- compact default mode;
- expanded financial details only on selected row/column.

### 1.3 Update Core Entities / Data Model

Update `docs/NBOS/01-Platform-Overview/03-Core-Entities-and-Data-Model.md`.

Add or clarify:

- `Delivery Payable Unit` as a read/domain classification over Product / Extension orders;
- `Payroll Matrix Layout Preference`;
- bonus original amount vs current amount;
- bonus recipient reassignment rules;
- manual bonus reason/audit requirements;
- Unit Economics read model.

### 1.4 Update Finance P&L Canon

Update `docs/NBOS/02-Modules/04-Finance/06-PnL-Reports.md`.

Clarify that:

- `Unit Economics Board` is an operational finance workspace;
- P&L reports are read-only analytics;
- both use the same underlying source facts;
- Unit Economics supports drill-down to invoices, payments, expenses, and bonuses.

### 1.5 Update Cleanup / Roadmap Docs

Update:

- `docs/NBOS/02-Modules/04-Finance/10-Finance-Cleanup-Register.md`;
- `docs/NBOS/02-Modules/04-Finance/12-Compensation-Roadmap-Implementation-Audit.md`;
- `docs/NBOS/00-Implementation-Roadmap.md` if this becomes a roadmap slice.

Record:

- current compensation MVP is being superseded by Payroll Run Workspace v2;
- current bonus pool view is being folded into Unit Economics Board;
- implementation must happen in cohesive phases.

---

## Phase 2 - Payroll Run Detail UX Redesign

### 2.1 Replace Current Detail Experience

The current `Payroll Run Detail` page should be fully redesigned, not lightly patched.

Target path:

- `/finance/payroll/[id]`

Preserve required domain behavior:

- status transitions;
- approval creates expense cards;
- paying uses expense payments;
- salary line paid/remaining sync;
- audit trail;
- payroll exports if still useful.

Remove or redesign anything that is visually noisy, hard to use, or not aligned with the new workflow.

### 2.2 Page Structure

New page layout:

1. Header
   - payroll month;
   - status badge;
   - run actions;
   - quick link back to run index;
   - total base salary;
   - total bonuses;
   - total payable;
   - paid;
   - remaining.

2. View switcher
   - `Employee Matrix`;
   - `Order Matrix`;
   - `Salary Lines`;
   - optional `Audit`.

3. Main workspace
   - selected view content.

4. Context panel or expanded metadata area
   - only appears when a row/column/cell is active.

### 2.3 Employee Matrix View

Employee-centered view:

```text
Rows: Employees
Columns: Delivery Payable Units
Cell: Bonus release amount for employee x unit in this payroll run
```

Left sticky column:

- employee name;
- role/seat if useful;
- fixed salary;
- employee total bonus for this run;
- employee payable total.

Top sticky header:

- delivery unit name;
- project/client short label;
- status;
- total bonus to release in this run;
- remaining bonus;
- available cash/funding indicator.

Cell states:

- gray: employee is not linked to the delivery unit;
- blue: employee is linked but no release entered yet;
- green: release is included and valid;
- orange: manual exception / manual bonus / override;
- red: validation problem, over funding, missing reason, invalid amount.

Behavior:

- click editable blue/green/orange cell to edit release amount;
- click gray cell to create manual exception bonus;
- gray-to-orange requires reason;
- amount below remaining bonus means partial release;
- amount above planned remaining means `Extra Bonus`;
- amount above available funding means `Over Funding`;
- over funding requires approval/reason;
- early release before delivery completion requires reason.

### 2.4 Order Matrix View

Order-centered view:

```text
Rows: Delivery Payable Units
Columns: Employees
Cell: Bonus release amount for unit x employee in this payroll run
```

This view must provide the same editing and validation behavior as Employee Matrix.

Use cases:

- Finance wants to focus on one Product/Extension and distribute available money across people.
- CEO wants to see the full financial pressure of one delivery unit.
- Team bonus review is easier by order than by person.

### 2.5 Scrolling and Sticky Layout

Matrix must support many columns and rows.

Requirements:

- horizontal scrolling inside the matrix area;
- vertical scrolling inside the matrix area;
- top header stays sticky while scrolling vertically;
- first column stays sticky while scrolling horizontally;
- top-left corner stays sticky;
- active column/row remains visually highlighted;
- compact cells by default;
- expanded details only on active row/column/cell.

Expected scale:

- 30+ delivery units as columns;
- many employees;
- matrix must remain usable without page-level layout breaking.

### 2.6 Active Row / Active Column Details

Each row and column header has an activation icon/action.

When a column is activated:

- delivery unit column expands or opens side context;
- show global financial state for the unit;
- show total planned bonus;
- show released before;
- show paid before;
- show remaining bonus;
- show bonus to release in current run;
- show available cash for bonus;
- show over-funding amount if any;
- show invoice/payment summary;
- show expense summary if compactly possible.

When a row is activated:

- employee row expands or opens side context;
- show employee fixed salary;
- show employee total payroll for this run;
- show employee bonus by active units;
- show total remaining unpaid bonus across visible units;
- show paid/remaining if expenses already exist.

When a cell is activated:

- show employee x delivery unit breakdown;
- planned bonus for this employee on this unit;
- original amount;
- current amount;
- released before;
- paid before;
- remaining;
- suggested this month;
- release this month;
- warning labels;
- reason field when required;
- audit/history link.

### 2.7 Compact Data Display

Default cell must stay compact.

Recommended compact cell content:

- current release amount;
- small status color;
- optional warning dot/icon.

Do not show all details in every cell by default.

Details appear only when:

- row active;
- column active;
- cell active;
- validation error exists.

### 2.8 Manual Ordering

Finance/CEO can reorder:

- delivery unit columns;
- employee rows;
- employee columns in order-centered view;
- delivery unit rows in order-centered view.

Requirements:

- drag-and-drop reorder;
- order numbers visible or available;
- new delivery units are inserted by system default logic without resetting manual order;
- manual order persists in DB;
- persistence scope: user + payroll run + view mode;
- resetting to default order should be possible.

Suggested data model:

```text
PayrollMatrixLayoutPreference
  id
  userId
  payrollRunId
  viewMode
  rowOrder[]
  columnOrder[]
  pinnedUnitIds[]
  createdAt
  updatedAt
```

### 2.9 Delivery Unit Inclusion Logic

Matrix delivery unit list includes:

- open / in-progress Product / Extension delivery units;
- done/closed units where at least one bonus has unpaid remaining amount;
- manually pinned done/closed units for extra/manual bonus;
- units with bonus releases already included in this payroll run.

Matrix excludes:

- domain-only orders;
- hosting-only orders;
- license-only orders;
- pass-through/non-delivery orders;
- closed units with no remaining bonus and not pinned.

### 2.10 Payroll Run Status Rules

Draft:

- full editing allowed;
- create manual exception bonus;
- attach/detach bonus releases;
- reorder matrix.

Review:

- Finance review mode;
- editing allowed if policy permits;
- approval action available.

Approved:

- amounts locked;
- expense cards created/materialized;
- Pay Now link available.

Paying:

- payment progress shown;
- no direct release edits;
- payments recorded through expenses.

Closed:

- read-only;
- corrections only through adjustment flow in open period.

---

## Phase 3 - Bonus Logic and Manual Bonus Form

### 3.1 Bonus Identity

Each bonus needs a human-readable title/name.

Examples:

- `Development bonus - Website Product`;
- `PM bonus - CRM Extension`;
- `Manual support bonus - Product launch help`.

The title is not only decoration. It helps Finance identify the bonus when reassignment or audit is needed.

### 3.2 Bonus Recipient Can Change Before Payment

A bonus can be created for a work unit and assigned to one employee, then reassigned if the real worker changes.

Rules:

- reassignment allowed before the bonus is paid;
- reassignment after payment is not allowed directly;
- after payment, use correction/clawback/adjustment;
- every reassignment requires audit;
- UI must show current recipient and history.

### 3.3 Original Amount and Current Amount

Bonus must store:

- original planned amount;
- current amount;
- change reason;
- changed by;
- changed at.

If Finance changes amount:

- label bonus as edited/manual override;
- preserve original amount for comparison;
- show delta in UI.

### 3.4 Manual Bonus Form

Manual bonus creation must support these contexts:

- from Bonus Board;
- from Payroll Run Matrix gray cell;
- from Unit Economics Board;
- possibly from employee/order detail later.

Required fields:

- title;
- amount;
- recipient employee;
- reason.

Context fields:

- source scope: none / project / delivery unit / order / payroll run;
- delivery unit, if created from matrix or Unit Economics;
- payroll run, if created from a payroll run;
- type, default `Manual`;
- status.

Default behavior:

- if created from Payroll Run, attach to current payroll run as a manual release draft;
- if created from Bonus Board without payroll run, create as Active / ready for next open payroll;
- if created from Unit Economics, attach to selected delivery unit but not necessarily to a payroll run until released.

Fields not required for generic manual creation:

- order, unless source scope requires it;
- payroll month, unless created inside payroll;
- type, unless Finance wants to override default.

### 3.5 Manual Bonus from Gray Matrix Cell

When Finance clicks a gray cell:

- open manual bonus dialog;
- prefill employee;
- prefill delivery unit;
- prefill payroll run;
- require title;
- require amount;
- require reason;
- create bonus entry;
- create release for this payroll run;
- cell becomes orange.

### 3.6 Editing Bonus from Payroll Run

Payroll Run edits should primarily edit `Bonus Release`, not silently rewrite `Bonus Entry`.

Rules:

- lower amount than remaining = partial release;
- higher amount than remaining = extra release/extra bonus;
- if Finance intentionally changes total planned bonus, use explicit "Edit planned bonus" action;
- planned bonus edits require reason and audit;
- release edits before approval require audit;
- release edits after approval are blocked.

---

## Phase 4 - Unit Economics Board

### 4.1 Replace Narrow Bonus Pool Thinking

Current bonus pool is too narrow because the business decision is not only "how much bonus can we pay".

The real question:

```text
For this Product / Extension / Order:
How much money came in, what did we spend, what remains, what bonuses are planned/released/paid, and what is the margin?
```

So build a wider `Unit Economics Board`.

### 4.2 Navigation

Place `Unit Economics Board` in Finance Overview / main finance navigation.

It should not be hidden inside Payroll & Bonus because it covers:

- invoices;
- payments;
- expenses;
- bonuses;
- product/order profitability;
- cash availability.

### 4.3 Main Views

`Unit Economics Board` should have multiple views:

1. Overview
   - list of delivery units/orders;
   - received;
   - receivables;
   - expenses;
   - planned bonuses;
   - released bonuses;
   - paid bonuses;
   - available cash;
   - expected margin;
   - actual margin.

2. Funding / Cash
   - cash received;
   - cash spent;
   - currently available amount;
   - expected future incoming;
   - expected future outgoing.

3. Bonuses
   - planned;
   - released;
   - paid;
   - remaining;
   - extra;
   - over funding;
   - employee breakdown.

4. Invoices & Payments
   - invoice cards;
   - payments;
   - paid/unpaid/overdue;
   - subscription coverage if applicable.

5. Expenses
   - expense cards;
   - expense payments;
   - planned expenses;
   - categories.

6. Profitability
   - actual revenue;
   - actual direct costs;
   - expected revenue;
   - expected direct costs;
   - actual margin;
   - expected margin.

### 4.4 Drill-down

Every amount must drill down to source records.

Examples:

- received amount -> payments list;
- receivables -> invoice cards;
- expenses -> expense cards/payments;
- planned bonuses -> bonus entries;
- released bonuses -> bonus releases;
- paid bonuses -> expense payments;
- available cash -> calculation breakdown.

### 4.5 Cash vs Profitability

Do not mix these two concepts.

Cash available:

```text
cash received
- actual expense payments
- bonus releases already paid or reserved
- other direct cash commitments
```

Expected profitability:

```text
expected total revenue
- expected total direct costs
- planned bonuses
```

Actual profitability:

```text
actual received/recognized revenue
- actual direct costs
- paid/released bonuses depending on report basis
```

Subscription products can be profitable long-term while having low available cash today.

### 4.6 Relationship to Bonus Pool

Bonus Pool becomes a section/read model inside Unit Economics:

- planned bonus amount;
- released bonus amount;
- paid bonus amount;
- remaining bonus;
- extra bonus;
- over funding;
- employee breakdown.

The UI may still use "Bonus Pool" as a view label if needed, but domain thinking should move to Unit Economics.

### 4.7 Relationship to P&L Reports

`Unit Economics Board` is operational.

P&L reports are read-only management analytics.

Rule:

- Finance works in Unit Economics Board;
- CEO/Finance reviews high-level performance in P&L;
- both drill down to the same financial facts.

---

## Phase 5 - API and Data Model Work

### 5.1 Payroll Matrix Read Model

Add API for payroll run matrix:

```text
GET /api/payroll-runs/:id/allocation-matrix
```

Response should include:

- payroll run summary;
- employees;
- delivery payable units;
- cells;
- validation states;
- totals;
- layout preference;
- permissions.

Cell data:

- employeeId;
- deliveryUnitId;
- linked status;
- bonusEntryId;
- bonusReleaseId;
- plannedAmount;
- originalAmount;
- currentAmount;
- releasedBefore;
- paidBefore;
- remaining;
- suggestedThisMonth;
- releaseThisMonth;
- warning status;
- reason required flag.

### 5.2 Payroll Matrix Mutation APIs

Needed actions:

- update release amount;
- create manual bonus from cell;
- pin delivery unit;
- unpin delivery unit;
- reorder rows;
- reorder columns;
- reset layout;
- attach release;
- detach release;
- edit planned bonus with audit.

Suggested routes:

```text
PATCH /api/payroll-runs/:id/allocation-matrix/cells
POST /api/payroll-runs/:id/allocation-matrix/manual-bonus
PATCH /api/payroll-runs/:id/allocation-matrix/layout
POST /api/payroll-runs/:id/bonus-releases/:releaseId/attach
POST /api/payroll-runs/:id/bonus-releases/:releaseId/detach
```

Exact routes can follow existing API style.

### 5.3 Layout Persistence

Create DB-backed layout preferences.

Scope:

- user;
- payroll run;
- view mode.

Store:

- row order;
- column order;
- pinned units;
- maybe hidden units later.

### 5.4 Delivery Payable Unit Resolver

Create service/read model that returns eligible units for a payroll run:

- in-progress Product/Extension delivery units;
- done units with remaining unpaid bonus;
- units with included releases in this run;
- manually pinned units.

It must exclude non-delivery orders.

### 5.5 Unit Economics Read Model

Create a read model/service for Unit Economics:

- by delivery unit;
- by product;
- by order;
- grouped by project/client if needed.

Sources:

- invoice cards;
- payments;
- subscription invoices/payments;
- expense cards;
- expense payments;
- bonus entries;
- bonus releases;
- payroll run/salary lines where relevant.

Do not manually duplicate financial facts if existing source records can be aggregated.

---

## Phase 6 - Frontend Implementation

### 6.1 Payroll Run Detail Components

Replace/refactor current detail components into smaller responsibilities:

- page shell;
- summary cards;
- view switcher;
- employee matrix;
- order matrix;
- matrix grid engine;
- sticky header/column;
- cell editor;
- row context panel;
- column context panel;
- manual bonus dialog;
- salary lines table;
- audit trail.

Keep files under 300 lines where possible.

### 6.2 Matrix Interaction

Implement:

- click cell to edit;
- keyboard-friendly numeric input;
- save/cancel;
- validation messages;
- warning badges;
- active row;
- active column;
- active cell;
- drag-and-drop row/column reorder;
- reset layout.

### 6.3 Visual Design

Use modern minimal UI:

- compact matrix by default;
- clean status colors;
- no noisy full data in every cell;
- details shown only on demand;
- strong sticky behavior;
- clear totals;
- financial warning labels.

No inline styles. Use existing Tailwind/design system patterns.

### 6.4 Unit Economics Board UI

Create page in Finance Overview area.

Views:

- Overview;
- Funding / Cash;
- Bonuses;
- Invoices & Payments;
- Expenses;
- Profitability.

Support:

- filters by project/client/status;
- search;
- sort;
- drill-down drawers/sheets;
- CSV export later if needed.

---

## Phase 7 - Validation, Audit, and Permissions

### 7.1 Validation Rules

Before approving Payroll Run:

- no invalid matrix cells;
- all required reasons filled;
- over funding approvals present;
- early release reasons present;
- salary line totals match release totals;
- expense card materialization preview is valid.

### 7.2 Audit

Audit these actions:

- release amount changed;
- manual bonus created;
- planned bonus amount changed;
- recipient reassigned;
- gray cell manual exception created;
- over funding approved;
- early release approved;
- layout changed if useful;
- payroll status changed.

### 7.3 Permissions

CEO:

- all access;
- approve over funding;
- approve payroll.

Finance Director:

- create/edit releases before approval;
- create manual bonuses;
- approve payroll if allowed by current RBAC;
- record payments via expenses.

Employee:

- no payroll workspace access;
- wallet only.

Department Head:

- optional limited summary only if allowed by RBAC.

---

## Phase 8 - Tests and QA

### 8.1 API Tests

Add or update tests for:

- delivery payable unit resolver;
- matrix read model;
- partial release;
- extra bonus;
- over funding;
- early release;
- manual bonus from gray cell;
- recipient reassignment before paid;
- blocking reassignment after paid;
- layout persistence;
- approval validation.

### 8.2 Web Tests

Add tests for:

- employee matrix rendering;
- order matrix rendering;
- sticky/scroll behavior where practical;
- cell edit flow;
- manual bonus dialog;
- active row/column context;
- persisted layout restore;
- salary totals matching cells;
- warning badges.

### 8.3 Manual QA

Manual QA scenarios:

1. Create payroll run.
2. Open employee matrix.
3. Edit linked employee bonus release.
4. Create manual bonus from gray cell.
5. Partial release leaves remaining amount.
6. Extra bonus shows label and reason.
7. Over funding requires approval/reason.
8. Reorder columns and rows.
9. Reload page and verify order persists.
10. Switch to order-centered view.
11. Approve payroll.
12. Verify expense cards created.
13. Pay partially through expenses.
14. Verify salary line paid/remaining sync.
15. Close run.
16. Verify read-only state.
17. Open Unit Economics Board and drill down to related invoices/payments/expenses/bonuses.

---

## Phase 9 - Implementation Order

Recommended order:

1. Update docs and canon.
2. Add delivery payable unit resolver.
3. Add matrix read model API.
4. Add layout persistence.
5. Add matrix mutation APIs.
6. Redesign Payroll Run Detail shell.
7. Implement Employee Matrix.
8. Implement Order Matrix.
9. Implement manual bonus dialog and cell editing.
10. Integrate validation/audit.
11. Add Unit Economics read model.
12. Add Unit Economics Board UI.
13. Update reports/P&L links and navigation.
14. Add tests.
15. Run manual QA.

---

## Open Implementation Details To Decide Later

These do not block the plan, but must be decided before coding each slice.

- Exact DB table names for layout preferences.
- Exact API route naming to match existing module style.
- Whether matrix layout can be shared between users later.
- Whether Unit Economics uses a materialized read table or live aggregation first.
- Whether over funding approval requires CEO only or Finance Director can approve within a limit.
- Whether closed delivery units auto-disappear after all bonuses are paid or stay visible for N recent months.
- Exact default insertion logic for new delivery units in custom ordered matrix.
