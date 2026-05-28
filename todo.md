# NBOS Finance / Payroll / Unit Economics Plan

## Progress legend

- 🟢 Done — shipped in code/docs for this slice
- 🟡 In progress — partial; see notes in phase
- ⚪ Not started

| Phase                       | Status | Notes                                                                                    |
| --------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| 1 Documentation             | 🟢     | Canon + UI spec + entities + P&L + cleanup/audit/roadmap cross-links (2026-05 slice)     |
| 2 Payroll Run Detail UX     | 🟢     | Matrix primary UX, row/column DnD, pin, reset, context panels, cell dialogs              |
| 3 Bonus logic / manual form | 🟡     | Manual/audit shipped; KPI/payable bonus architecture correction now required             |
| 4 Unit Economics Board      | 🟡     | Five tabs + invoices/payments drill-down sheet; expenses/bonuses source lists pending    |
| 5 API / data model          | 🟡     | Matrix/UE shipped; KPI Result + payable bonus snapshot must replace payroll KPI inputs   |
| 6 Frontend                  | 🟡     | Matrix/UE shipped; remove manual KPI input UX from payroll and show read-only results    |
| 7 Validation / audit        | 🟡     | Validation + audit writes + paginated bonus entry audit read; layout audit optional      |
| 8 Tests / QA                | 🟡     | 147+ unit tests (resolver, matrix, validation, reassign, planned); E2E/manual QA pending |

## Implementation log (`development`)

| Commit          | Summary                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| `1e984c54`      | Phased plan in `todo.md`                                                                                |
| `11c4930b`      | Payroll allocation matrix + unit economics route                                                        |
| `dc9e3942`      | Matrix cell releases + column layout controls                                                           |
| `e73b88f4`      | Matrix v2 (DnD, planned/reassign, validation), unit economics API, bonus audit, docs slice              |
| `a58237bb`      | P&L/cleanup docs, matrix bonus audit panel in cell dialog                                               |
| `c8c7e404`      | Refresh todo.md progress table after matrix commits                                                     |
| `b6c38956`      | Unit economics Funding / cash tab                                                                       |
| `84d40c50`      | Unit economics Expenses/Profitability tabs, shared bonus audit panel                                    |
| `feef07ec`      | Compensation audit, cleanup register, implementation roadmap cross-links                                |
| `53ff808b`      | Bonus entry audit panel pagination + reason display                                                     |
| `10861549`      | Unit economics invoices/payments drill-down API + sheet                                                 |
| `01adae4e`      | UE drill-down docs; migration `20260528120000_payroll_matrix_layout_bonus_title` applied                |
| `06b231fc`      | Realign payroll plan around KPI policy ownership                                                        |
| `990d11da`      | Remove editable payroll KPI forms; split Bonus Releases into standalone section                         |
| `51445b01`      | Remove public payroll KPI patch endpoints; keep payroll as KPI result consumer                          |
| `c50718e3`      | Add `KpiResult` read model schema + migration                                                           |
| `3c03c58d`      | KPI Result API/service: derive Sales actual snapshot from payment source facts                          |
| `8d0ec889`      | Extend KPI policy parameters with target/plan source and Sales monthly target amount                    |
| `6dbcee54`      | Wire payroll bonus attach to consume `KpiResult` payoutFactor instead of legacy fields                  |
| `d45e8baa`      | Add payroll UI action/read section for syncing and displaying KPI Result snapshots                      |
| `62163ccf`      | Align employee month KPI sheet with `KpiResult` read model; drop legacy fields from month API           |
| `59dd9e49`      | Remove legacy `kpiSales*` hints from payroll run list/detail API and salary line rows                   |
| `26e0594b`      | Realign plan: KPI belongs in Salary Board/Wallet, not Payroll Run Detail                                |
| `60158cfd`      | Remove Payroll-owned KPI sync/results UI/API and clean Payroll Detail to matrix workspace               |
| `531282fe`      | Salary Board KPI strip; month sheet tabs (General/Bonuses/KPI); earned-period read model                |
| `63313b01`      | Align `KpiResult` sync + bonus attach to earned sales month (not payout payroll month)                  |
| _(this commit)_ | Event-driven KPI + `BonusEntry` payable snapshot; attach by `earnedPeriod`; remove manual sync API/cron |

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
- KPI configuration belongs in `My Company / Compensation / KPI Policies`, not inside monthly payroll.
- Payroll must not ask Finance to enter, sync, or calculate KPI plan/actual every month. Payroll consumes already payable bonus releases only.
- Missing KPI policy/result means 100% payout for that bonus type until a policy exists. This is the current/default behavior for Delivery / PM / Developer / Designer / Marketing.
- For Sales, KPI policy can reduce the payable part of a sales bonus. The system must preserve both the original 100% bonus amount and the KPI-adjusted payable amount.
- Burned/forfeited KPI amount is a business result of KPI gate rules, not a manual payroll edit.
- Sales KPI result/status belongs in employee Salary Board month card/sheet and employee Wallet, not Payroll Run Detail.
- Sales bonus is created active when deal is won and is payable in the next payroll month; its payable percentage is fixed by the finalized KPI result for the **earned sales month** (prior month vs payout payroll month).
- Salary Board month card (compact): for Sales with KPI policy — earned month label, attainment %, payout % (or “not finalized”).
- Employee month sheet (Salary Board + Wallet): tabs **General** (totals + short KPI line + payments), **Bonuses**, **KPI** (Sales with policy only); wide sheet layout.

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

### KPI Policy vs KPI Result vs Payroll

These concepts must stay separate.

- `KPI Policy` = reusable rule configured in `My Company` for company / department / role / level / employee override.
- `KPI Result` = earned sales month snapshot: plan, actual, attainment %, payout factor, source facts, status/finalization time, and effective policy.
- `Payroll Run` = payment workspace: who gets paid, from which project/order, how much is included this month, and payment/expense status. It is not the place to configure, sync, or calculate KPI.

Rules:

- KPI policies live in `My Company / Compensation`, not in Finance Payroll UI.
- KPI policies can be role-level first, with employee-level overrides later when needed.
- Sales KPI snapshots refresh **on business events** (client payment, sales bonus accrual) — not via Finance manual month-close buttons or mandatory “close month” actions.
- **Month boundary = implicit freeze:** when calendar month changes, new sales/KPI apply only to the new `YYYY-MM`. Prior-month bonuses keep their last running KPI % and payable amounts (month/year no longer match → naturally read-only). No forced “close March” workflow for normal ops.
- Optional `POST /api/scheduler/sales-kpi-month-close` = **repair/backfill only** (not part of daily process).
- Sales currently has KPI gate rules; other roles default to 100% payout until their own KPI policies are introduced.
- If no KPI policy/result applies, the employee receives 100% of the bonus that is otherwise eligible.
- **Per earned month (running):** one KPI payout % for the employee → recalculates **payable** on all open Sales bonuses for that month (`full amount × month KPI %`). New sale updates month KPI; all same-month bonuses move together until month rolls over.
- **Per bonus (frozen after month roll):** store `earnedPeriod` (`YYYY-MM`), `amount` (100% policy), `kpiPayoutFactorAtFreeze`, `payableAmount` (active). Payroll attach uses **bonus earned period**, not payroll month − 1 (supports delayed payout: March bonuses paid in May keep March KPI).
- If KPI applies, the bonus record/release must show: full amount, month KPI %, payable amount, burned/forfeited (if any), policy/result reference.
- Payroll Run Detail must not show standalone KPI sync/results sections. KPI status is visible in Salary Board employee month card/sheet and employee Wallet.
- Payroll can show KPI-adjusted payable amounts only as part of bonus release/payment facts, not as a separate KPI workspace.

**Future — manual & rule-based bonus adjustments (not in current slice):**

- From Bonus Board / bonus card: optional adjustment fields (default 0) — manual **increase** or **decrease** by amount or dedicated columns; may change full bonus and/or payable without breaking audit trail.
- Rule examples later: auto **+30%** in some cases, auto **−10%** in others (on top of KPI gate); design when implementing adjustment module.

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

### 3.7 KPI-Gated Bonus Amounts

Current correction: KPI must not be manually configured in Payroll Run.

Correct model:

- bonus creation follows `Bonus Policy`;
- KPI configuration follows `KPI Policy` in `My Company`;
- monthly KPI result is resolved before or during bonus eligibility calculation;
- Payroll receives only already available/payable bonus releases.

For every KPI-gated bonus, store or expose:

- original amount at 100% payout;
- KPI result reference;
- payout factor;
- payable amount;
- burned/forfeited amount;
- carry-over amount only if policy explicitly says carry forward.

Sales example:

```text
Original sales bonus: 100,000
KPI result: 55%
Policy band: 50-69% -> 50% payout
Payable bonus: 50,000
Burned amount: 50,000
```

Non-sales default:

```text
No KPI policy/result applies
Payout factor: 100%
Payable bonus = original bonus
Burned amount = 0
```

### 3.8 Payroll KPI UI Correction

Remove or replace the current manual payroll KPI input sections:

- `Sales KPI (payout gate)`;
- `Employee sales KPI`.

They should not be editable payroll forms.

Replacement:

- optional read-only `KPI payout results` summary;
- show only when at least one included/eligible bonus has a KPI policy/result;
- explain that non-KPI roles receive 100% payout;
- link to `My Company / KPI Policies` and the employee compensation profile;
- show source facts and audit trail if KPI affected payable amount.

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

### 5.6 KPI Result and Payable Bonus Read Model

Add a proper KPI result layer instead of storing monthly KPI inputs on Payroll Run as the source of truth.

Canonical source:

- `KpiPolicy` + `CompensationProfile.kpiPolicyId` define which KPI applies;
- KPI policy defines metrics, period, target source, result source, and gate bands;
- monthly/period result snapshot resolves plan, actual, attainment, payout factor.

Needed model/API direction:

- `KPI Result` by employee/role/policy/period;
- effective policy reference;
- plan amount / target values;
- actual values from source modules (Sales payments first);
- attainment percentage;
- payout factor;
- locked/burned/carry decision;
- audit/source metadata.

Payroll/bonus attachment should consume this result:

- Sales bonus release uses KPI result to calculate payable amount;
- non-sales bonus releases use 100% payout until a policy applies;
- payroll no longer stores editable `kpiSalesPlanAmount` / `kpiSalesActualAmount` as the business source of truth;
- existing DB fields can remain temporarily as legacy compatibility, but UI must stop treating them as the canonical workflow.

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

### 6.5 KPI / Payroll UX Correction

Immediate UI correction before continuing payroll polish:

- remove manual monthly KPI input forms from Payroll Run Detail;
- split `Bonus releases` away from the current `Sales KPI & bonus releases` accordion;
- make bonus releases a normal payroll section;
- add a read-only KPI payout result section only when KPI actually affected bonuses;
- show Sales KPI outcome as explanation, not editable form;
- link policy editing to `My Company / KPI Policies`;
- in employee rows, do not show KPI inputs for non-sales roles.

Target user understanding:

```text
My Company configures KPI rules.
System calculates KPI result.
Bonus becomes payable according to rules.
Payroll pays already resolved payable bonuses.
```

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

- KPI result resolver: no KPI policy -> 100% payout;
- Sales KPI result -> payout factor from policy bands;
- Sales bonus stores original/payable/burned amounts;
- non-sales bonuses are not reduced by Sales KPI policy;
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
2. Verify Payroll Run has no editable KPI plan/actual form.
3. Verify Bonus Releases are visible as a payroll section, not hidden under Sales KPI setup.
4. Verify Sales bonus shows original/payable/burned KPI result when applicable.
5. Verify Delivery / PM / Developer / Designer bonuses show 100% payout when no KPI policy applies.
6. Open employee matrix.
7. Edit linked employee bonus release.
8. Create manual bonus from gray cell.
9. Partial release leaves remaining amount.
10. Extra bonus shows label and reason.
11. Over funding requires approval/reason.
12. Reorder columns and rows.
13. Reload page and verify order persists.
14. Switch to order-centered view.
15. Approve payroll.
16. Verify expense cards created.
17. Pay partially through expenses.
18. Verify salary line paid/remaining sync.
19. Close run.
20. Verify read-only state.
21. Open Unit Economics Board and drill down to related invoices/payments/expenses/bonuses.

---

## Phase 9 - Implementation Order

Recommended order:

1. Correct KPI/payroll architecture in docs and UI plan.
2. Remove editable KPI plan/actual workflow from Payroll Run Detail.
3. Split Bonus Releases into its own payroll section.
4. Add/read KPI Result + payable bonus snapshot model.
5. Wire Sales bonus payable amount from KPI Result / policy bands.
6. Keep non-sales bonuses at 100% payout until policy applies.
7. Add delivery payable unit resolver.
8. Add matrix read model API.
9. Add layout persistence.
10. Add matrix mutation APIs.
11. Redesign Payroll Run Detail shell.
12. Implement Employee Matrix.
13. Implement Order Matrix.
14. Implement manual bonus dialog and cell editing.
15. Integrate validation/audit.
16. Add Unit Economics read model.
17. Add Unit Economics Board UI.
18. Update reports/P&L links and navigation.
19. Add tests.
20. Run manual QA.

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
- Final KPI Result table/API naming.
- Whether Sales KPI monthly targets are role-level policy parameters only, or also allow employee-level override in this slice.
- Whether existing `PayrollRun.kpiSales*` and `SalaryLine.kpiSales*` fields are migrated away now or kept as legacy/read-only compatibility until the KPI Result table ships.
