# Payroll audit — executive summary

**Audit date:** 2026-09-26. **Decision:** NBOS payroll must **not yet be treated as ready for real employee payroll operations**. The repository contains much of the gross salary-and-bonus workflow, but the audit found financial access and correctness defects and did not verify a live end-to-end payout. This is a code-based assessment, not evidence that any real employee has been paid incorrectly.

## What already exists

- My Company can store an employee's fixed salary, versioned compensation profile and linked bonus/KPI policies. Finance can create one payroll run per month with employee salary lines. The monthly amount is fixed salary plus bonuses attached to that run (`apps/api/src/modules/compensation-profiles/compensation-profiles.service.ts:21-160`; `apps/api/src/modules/payroll-runs/payroll-runs.service.ts:137-207`; `payroll-salary-line-total-payable.ts:3-9`).
- Sales bonuses use independent Seller and Assistant rates based on where the Deal came from and whether payment is Classic, first subscription month or recurring subscription. Delivery v2 can plan bonuses from published work norms and role rates; completed funded work can produce releases (`apps/api/src/modules/bonus/sales-bonus-accrual.service.ts:144-266`; `apps/api/src/modules/delivery-compensation/materialize-initial-delivery-plan.ts:30-110`; `apps/api/src/modules/bonus/product-bonus-pool-auto-release.ts:52-145`).
- Finance can review a payroll matrix, approve a run, create linked expense cards and record partial/full payments. Salary Board, Bonus Board, employee Wallet and payroll report read the resulting records (`apps/api/src/modules/payroll-runs/payroll-runs.service.ts:210-309`; `apps/api/src/modules/expenses/expense-payment-create.ts:24-113`; `apps/api/src/modules/employees/employee-wallet.service.ts:68-124`).

## What was verified

Seven targeted automated test files ran successfully: **45 passing tests, zero failures**. They cover selected profile activation, payroll run behavior and statuses, salary payment syncing, Sales bonus accrual and bonus release validation. They use mocks; they do not verify current employee data, real rates, API access, concurrent transactions or a complete payout. The complete list is in [05-PAYROLL-TEST-REPORT](05-PAYROLL-TEST-REPORT.md).

## What is wrong or incomplete

1. **Financial API authorization:** Payroll and bonus controllers do not declare route permissions, and the global permission guard allows routes without a declared permission. This exposes other employees' financial data and money-changing operations to authenticated roles that should lack Finance rights. This is confirmed in code but was not attacked on a deployed system ([D-01](04-FUNCTIONAL-DEFECTS.md)).
2. **Salary history:** Activating a new profile archives the previous one immediately. A later payroll calculation for an earlier month searches only currently active profiles, so it can use the wrong fixed salary. Future-dated salary changes have the same timing problem ([D-02](04-FUNCTIONAL-DEFECTS.md)).
3. **Reversals:** Removing a client payment does not reverse its Sales bonus. Removing an employee payout changes the salary balance but does not undo bonus releases already marked paid ([D-03/D-04](04-FUNCTIONAL-DEFECTS.md)).
4. **Rate timing and approvals:** Sales rates are selected by data-processing time rather than payment date, and some approval IDs are accepted from request bodies rather than the authenticated approver ([D-05/D-06](04-FUNCTIONAL-DEFECTS.md)). A Sales accrual error can be logged while payment recording still succeeds, with no demonstrated automatic accrual retry ([D-07](04-FUNCTIONAL-DEFECTS.md)).
5. **Documented gaps:** The policy hierarchy and automated Marketing/Support incentives described in the canon are incomplete; department comparisons and scheduled payroll packets remain future work. Real delivery v2 norms/rates and several live acceptance checks remain outstanding (`docs/NBOS/02-Modules/07-My-Company/07-Compensation-and-Policies.md:31-65,113-145`; `docs/NBOS/03-Business-Logic/03-Bonus-Payroll-Logic.md:315-341`; `apps/api/src/modules/finance/reports/payroll-report.service.ts:15-20`; `TODO.md:67-85,126-146`).

## Decisions required from the Product Owner

The most urgent unanswered rules are: whether a partial Classic client payment earns a Sales bonus; what happens when Sales KPI facts are missing or fixed salary is zero; how refunds and reversed employee payouts affect unpaid versus paid bonuses; who can approve financial changes; which currencies payroll supports; and how salary changes, hires or terminations within a month are treated. Marketing/Support automation and multi-department cost attribution also need a scope decision. The full decision register is [06-BUSINESS-DECISIONS](06-BUSINESS-DECISIONS.md). No formula or rate has been inferred to fill these gaps.

## What must happen before real payroll

Enforce financial API permissions and authentic approvals; correct historical salary selection and reversal handling; settle the relevant Owner decisions; publish genuine delivery norms and rates; add targeted regression/integration tests; then complete a staged employee-to-payment-to-report rehearsal with Finance sign-off. Production migration and cutover need separate authorization. The sequenced work and evidence gates are in [07-COMPLETION-ROADMAP](07-COMPLETION-ROADMAP.md).

## Remaining uncertainty

This audit inspected code, schema, documentation and selected tests only. It did **not** inspect live database contents, production migration state, actual employee pay terms, real financial transactions, browser behavior, queue operation or external payouts. The observed defects establish risks in the implemented code paths; they do not quantify money lost or identify affected employees. See [01](01-EXISTING-FUNCTIONALITY.md) through [05](05-PAYROLL-TEST-REPORT.md) for evidence and verification boundaries.
