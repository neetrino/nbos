# Payroll, Salary, Bonus, Wallet - plan to bring the UX to NBOS canon

## How to use this file

This file is the working roadmap for the Payroll / Salary / Bonus / Wallet redesign.

Progress format:

- Not started: `- [ ] Task`
- In progress: `- [ ] Task _(in progress)_`
- Done: `- [x] ~~Task~~`
- Blocked: `- [ ] Task _(blocked: reason)_`

Implementation must move by phases from top to bottom. Do not skip to visual polish before the data contract and canonical payment flow are verified.

## Goal

Create a clear, beautiful, finance-grade view of employee compensation:

- CEO and Finance must see salary, bonuses, payroll status, payments, and unpaid/remaining amounts for every employee.
- Each employee must see the same compensation story in `My wallet`, but read-only and scoped only to themselves.
- Bonuses must not be shown as one flat number only. Every month must explain where the money came from: project, product/extension/order, bonus type, planned amount, released amount, paid amount, remaining amount, KPI impact, and exceptions.

## Existing canon that must stay

The old Bitrix salary flow matches the NBOS direction and must be preserved in a cleaner architecture.

Canonical payment flow:

```text
Payroll Run
-> Salary Lines
-> Payroll Approved
-> Expense Cards
-> Expenses / Pay Now
-> Expense Payments
-> Salary Line paid / remaining / status sync
-> Payroll Closed
```

Important rules:

- `Payroll` is the calculation and approval workspace.
- `Pay Now` is the actual payment workspace.
- Salary and bonus payouts must become expenses only after payroll approval.
- Payments must be recorded through `Expense Payment`, not by manually changing salary status.
- Partial payments must keep salary line, expense card, payroll totals, and wallet in sync.

## Bitrix parity requirements

The new UX must keep the useful part of the old Bitrix salary board:

- One salary card per employee per month.
- The card starts with fix salary and empty/zero bonus total.
- During the month, bonuses accumulate and become visible on that employee/month card.
- At month close, the card has fix, total bonuses, total payable, and bonus list.
- On the 1st of the next month, the previous month becomes active for payout.
- Payment can be full or partial.
- Every partial payment must be visible in the payment tab/timeline.
- When fully paid, the card becomes paid/closed.
- After payroll approval, salary cards must appear in `Expenses / Pay Now` as payable expense cards.

The difference from Bitrix: NBOS must make the hidden logic explicit through `PayrollRun`, `SalaryLine`, `BonusRelease`, `Expense`, and `ExpensePayment`, while keeping the user experience simple.

## Canonical monthly compensation view

Every employee/month must be represented as a single compensation month card.

The card must contain:

- Employee.
- Payroll month.
- Base salary / fix.
- Bonus total for the month.
- KPI adjustment / burned amount, if applicable.
- Total payable.
- Paid amount.
- Remaining amount.
- Salary line status.
- Linked expense card and payment state.
- Bonus breakdown list grouped by source.

Bonus breakdown row must show:

- Project.
- Product / Extension / Order.
- Bonus type: Sales, Delivery, PM, Design, Marketing, Manual.
- Planned bonus amount.
- Released into payroll.
- Included amount after KPI/cap.
- Paid amount.
- Remaining amount.
- Status: Incoming, Active, Included in payroll, Partially paid, Paid, Burned, Carry-over, Clawback.
- Explanation: why partial, why burned, why moved to next month, why over-funded, etc.

## Three compensation card types

### 1. Past paid months

Purpose: history and audit.

Shows months that are already closed or fully paid.

Must show:

- Final base salary.
- Final bonuses.
- Final paid amount.
- Payment dates.
- Bonus sources from all projects/products.
- What was paid fully.
- What was partially paid and moved.
- What was burned because of KPI or policy.

### 2. Previous month active payout

Purpose: current payout window.

This is the previous month that is now payable, usually paid between the 1st and 15th of the current month.

Must show:

- Payroll run status.
- Approved/active bonuses for that month.
- What is ready to pay now.
- What is already paid.
- What remains unpaid.
- Which bonuses are delayed or carried forward.
- Linked expense cards and partial payments.

### 3. Current month accumulating bonuses

Purpose: live forecast.

This is the current month. It is not complete yet and will usually be paid next month.

Must show:

- Current base salary expectation.
- Bonuses already earned/collected during this month.
- Incoming/pending bonuses that can still change.
- Project/product sources.
- Expected payroll month.
- Clear label that this is not final yet.

## Required Finance views

### Finance -> Salary

Current screen should evolve into the main compensation grid.

Views needed:

- Grid: employees x months.
- Cards: month cards grouped by employee.
- List: detailed searchable compensation rows.
- Board by payout state: Accumulating, Ready to pay, Partially paid, Paid, Held.

Cell click opens `Employee Month Compensation Sheet`.

Month header click opens `Payroll Run Detail`.

This screen is the closest replacement for the old Bitrix salary board. It must answer: "What did each employee earn in each month, what is payable, what is paid, and what remains?"

### Finance -> Payroll

Payroll remains the operational monthly run screen.

Views needed:

- List of payroll runs.
- Board by status: Draft, Review, Approved, Paying, Closed.
- Calendar/month view.

Payroll run detail must get a stronger workspace:

- Salary lines table.
- Bonus release workspace.
- KPI/cap review.
- Expense materialization status.
- Payment progress.
- Audit trail.

Payroll must not become a visual employee salary history screen. That job belongs to `Finance -> Salary`. Payroll is for month-level control, approval, and operational reconciliation.

### Finance -> Expenses / Pay Now

Pay Now is the payment execution screen for approved payroll expenses.

Views needed:

- Board by payment urgency/status.
- List of payable salary/bonus expense cards.
- Payroll filter: show expenses created from a payroll run.
- Employee filter.
- Month filter.
- Partial payment timeline.

Salary expense cards must show:

- Employee.
- Payroll month.
- Original payable amount.
- Paid amount.
- Remaining amount.
- Linked payroll run.
- Linked salary line.
- Payment status.

Click on a payroll expense opens `Payroll Expense Payment Sheet`.

Pay Now actions:

- Add full payment.
- Add partial payment.
- See payment history.
- Open salary month sheet.
- Open payroll run.
- Marking paid directly without `Expense Payment` must not be allowed.

### Finance -> Bonus

Bonus board must become a real bonus control center.

Views needed:

- Board by status.
- List with filters.
- Employee view.
- Product/Project view.
- Month/history view.
- Payroll preview.

Click on a bonus opens `Bonus Detail / Release Sheet`.

### Finance -> Bonus pools

Bonus pools must become a product funding control screen.

Views needed:

- Product/Extension pool table.
- Expandable product rows.
- Employee breakdown inside each pool.
- Warning view for over-funding, extra bonus, early release.

Click on a pool opens `Product Bonus Pool Sheet`.

## Required sheets

### Employee Month Compensation Sheet

Used by Finance/CEO and read-only in Wallet.

Sections:

- Header: employee, month, status, payroll run.
- Summary cards: fix, bonuses, total, paid, remaining.
- Bonus breakdown list.
- Payment timeline.
- KPI/cap/carry-over explanation.
- Linked expense card.
- Audit/history.

Finance mode actions:

- Open payroll run.
- Open expense card.
- Open bonus release.
- Export.

Wallet mode:

- No edit actions.
- Friendly explanation of what is paid, what is pending, and what is expected.

### Bonus Detail / Release Sheet

Sections:

- Bonus entry details.
- Source: project, product/extension/order, invoice/payment trigger.
- Planned amount.
- Release ledger.
- Payroll inclusion.
- Paid/remaining.
- KPI/cap impact.
- Warnings and reason fields.

Finance actions:

- Create release.
- Adjust release before approval.
- Attach/detach to payroll while allowed.
- Add reason for early/extra/over-funding.

### Product Bonus Pool Sheet

Sections:

- Product/Extension/Order summary.
- Client received amount.
- Planned bonus total.
- Released total.
- Paid total.
- Remaining total.
- Available funding.
- Over-funding.
- Employee rows.

Finance actions:

- Review auto suggested release.
- Adjust release amount.
- Approve release.
- Explain exceptions.

### Payroll Run Workspace Sheet / Page

Sections:

- Payroll status and actions.
- Salary lines.
- Bonus releases included this month.
- KPI sales inputs.
- Expense cards created/not created.
- Payment progress.
- Audit trail.

Actions:

- Move Draft -> Review -> Approved -> Paying -> Closed.
- Create/materialize expense cards on approval.
- Attach/detach approved bonus releases before approval.
- Export salary lines, journal, audit.

### Payroll Expense Payment Sheet

Used from `Expenses / Pay Now` for salary and bonus expense cards created by payroll.

Sections:

- Employee and payroll month.
- Linked salary line.
- Linked payroll run.
- Original payable amount.
- Paid amount.
- Remaining amount.
- Payment timeline.
- Related bonus breakdown summary.

Actions:

- Add partial payment.
- Add full remaining payment.
- Open employee month compensation sheet.
- Open payroll run.
- Open expense audit.

## Employee Wallet requirements

Wallet must show the employee's own compensation by month.

Views needed:

- Month cards.
- Timeline/history.
- Current payout card.
- Current accumulating month card.

Each month card must show:

- Fix.
- Bonus total.
- Total payable.
- Paid.
- Remaining.
- Status.
- Bonus list by project/product.
- Partial progress like `20,000 / 60,000`.
- Explanation when a bonus is partial, delayed, carried forward, burned by KPI, or paid.

Wallet must not allow editing.

## Design standard

The UI must be modern, minimal, and financial-control oriented.

Design principles:

- Use cards for high-level month summaries.
- Use sheets for details and actions.
- Use tables only when density is needed.
- Use status chips and color carefully.
- Always show totals at the top, details below.
- Avoid hiding important money logic behind a single total.
- Every amount must have a source and status.
- Finance screens can be dense; Wallet must be calmer and easier to understand.

## Implementation roadmap

### Phase 1 - Data contract and audit of current implementation

- [ ] Compare current API payloads with required monthly compensation model.
- [ ] Verify existing canonical flow: `PayrollRun -> SalaryLine -> Expense -> ExpensePayment`.
- [x] Define `EmployeeMonthlyCompensation` DTO (`SalaryLineMonthDetailDto` + `GET …/month-detail`).
- [x] Define bonus breakdown DTO (`SalaryLineMonthBonusRow` in month detail).
- [ ] Define wallet monthly DTO.
- [ ] Define payroll expense/payment projection for `Pay Now`.
- [ ] Identify whether missing fields can be derived from existing `PayrollRun`, `SalaryLine`, `BonusEntry`, `BonusRelease`, `Expense`, and `ExpensePayment`.
- [ ] Decide if additional persisted fields are required.
- [ ] Document exact gaps between current implementation and this roadmap.

### Phase 2 - Backend projections

- [x] Add monthly compensation projection for Finance (`querySalaryLineMonthDetail`).
- [x] Add read-only employee wallet monthly projection (`GET /me/wallet/salary-lines/:id/month-detail`).
- [ ] Add payroll-linked expenses projection for Pay Now.
- [x] Include bonus source breakdown by project/product/extension/order.
- [x] Include paid/remaining from linked expense payments.
- [ ] Include KPI/cap/carry-over/burned explanations where data exists.
- [ ] Guarantee sync after every payroll-linked `ExpensePayment`.
- [ ] Add tests for partial payment, full payment, carried bonus, KPI reduced payout, and current month forecast.

### Phase 3 - Finance Salary UX

- [x] Upgrade `/finance/salary` from basic grid to full compensation grid (views + client filters).
- [x] Add view switcher: Grid / Cards / List / Board.
- [x] Add Board view by payout state (active_payout / accumulating / past_paid).
- [x] Add `Employee Month Compensation Sheet` (Salary Board; URL `openSalaryLineId`).
- [x] Add filters by employee, line status, payout phase, month range (URL + client).
- [ ] Add totals and clear visual statuses.
- [x] Preserve Bitrix parity (sheet): fix, bonus total, total payable, paid, remaining, bonus list.

### Phase 4 - Payroll workspace UX

- [x] Improve payroll run detail as operational workspace (KPI, bonus releases, salary lines, month sheet).
- [x] Add bonus release workspace inside payroll (attach/detach APPROVED releases).
- [x] Show included bonus releases with source breakdown (employee, project, product, amounts).
- [x] Show expense materialization and payment progress clearly (paid/remaining + Pay now link).
- [x] Add sheet actions where editing is needed (month compensation sheet on run).
- [x] Keep Payroll focused on approval/reconciliation, not employee salary history (Details → month sheet only).

### Phase 4.5 - Pay Now payroll payment UX

- [x] Upgrade `Expenses / Pay Now` for payroll-created expense cards (filters + preset banner).
- [x] Add payroll/month/employee filters (`payrollLinked`, `payrollMonth`, `payrollEmployeeId`).
- [x] Add `Payroll Expense Payment Sheet` (payments tab focus on payroll-linked expense sheet).
- [x] Show partial payment timeline (existing `ExpenseDetailPaymentSection` + ledger on cards).
- [x] Link every payroll expense back to employee month sheet and payroll run (`ExpensePayrollLinkBanner`).
- [x] Ensure payment actions create `ExpensePayment` and never directly mutate salary status (unchanged API path).

### Phase 5 - Bonus and Bonus pools UX

- [x] Upgrade Bonus Board views: Board / List / Employee / Product / Month / Payroll Preview (`ViewModeSwitch`, `bonus-board-view.ts`).
- [x] Upgrade Bonus Pools with expandable rows and `Product Bonus Pool Sheet`.
- [x] Add release warnings: Early, Extra, Over Funding, Partial, Carry-over (release type badges + pool ledger hints).
- [x] Ensure each bonus can be traced to project/product/extension/order and payroll inclusion (board filters, pool sheet links, payroll month on cards).

### Phase 6 - Employee Wallet UX

- [x] Build month-card based wallet (`WalletSalaryMonthCards` by payout phase).
- [x] Add current payout card (active_payout column + next payroll CTA).
- [x] Add current accumulating month card (accumulating column).
- [x] Add past paid history (past_paid column + salary table).
- [x] Add month detail sheet (read-only `EmployeeMonthCompensationSheet`, wallet scope).
- [x] Show bonus list by project/product inside every wallet month (sheet breakdown).
- [x] Show partial progress like `20,000 / 60,000` (cards + sheet payments).
- [x] Keep all actions read-only (no Finance links in wallet sheet).

### Phase 7 - Polish, consistency, and documentation

- [x] Align route names with Finance canon (`/finance/bonuses` canonical; `/bonus` redirects with query preserved).
- [ ] Update NBOS docs if final UX decisions differ from current docs.
- [ ] Add loading, empty, and error states for every new view.
- [ ] Add CSV/export where useful for Finance.
- [ ] Add tests for projections and critical UI utilities.
- [ ] Add visual QA pass against the old Bitrix workflow: salary card, bonus list, partial payments, paid status, Pay Now linkage.

## Open product decisions

- ~~Should `Bonus` route be moved…~~ **Resolved:** `/finance/bonuses` canonical; `/bonus` legacy redirect.
- Should Wallet use exactly the same month sheet as Finance in read-only mode, or a calmer employee-specific sheet?
- Should current month forecast include only earned bonuses, or also incoming predicted bonuses?
- How should burned KPI amount be shown: as separate negative line, status on bonus row, or both?
- Should cap/carry-over be applied automatically now, or first shown as planned behavior until the policy engine is complete?
- Should `Pay Now` show payroll expenses mixed with all expenses by default, or provide a dedicated Payroll sub-filter/preset?
