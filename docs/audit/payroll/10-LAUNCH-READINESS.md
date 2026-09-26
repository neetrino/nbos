# Payroll — launch readiness

**Assessment date:** 2026-09-26. **Basis:** completed independent verification of revision `68465d3148d104261729351b0b94cd86e3135115`; see [09-INDEPENDENT-VERIFICATION](09-INDEPENDENT-VERIFICATION.md). This document records that audit and does not assert a newly inspected deployment state.

**Decision: launch conditions are not satisfied. Do not treat the existing implementation as approved for real employee payroll operations.** This is an evidence-based readiness assessment, not a claim that a production financial incident occurred.

## 1. Product Owner explanation

The system contains much of the intended workflow: salary terms, bonus calculations, monthly payroll, approval, expense cards, payment recording and employee balances. The central problem is that these parts do not yet reliably preserve the same amount and history throughout the complete process.

For example, a future salary can replace today's fallback, two legitimate Sales roles can collide during saving, several bonuses can appear as only one in payroll, and a deferred bonus portion can appear already paid. Removing a payment can leave other financial records unchanged. These are launch blockers even when individual formula tests pass.

**Verified:** 646 existing automated tests passed in 141 files, plus 11 completed isolated source-function probes. **Not verified:** the deployed system, real PostgreSQL concurrency and constraints, actual pay terms, full browser journeys, migration state, or a complete staged payroll rehearsal.

## 2. Readiness conditions

| Condition                                                                       | Current evidence                                                              | Status                                                                          |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Salary plus bonus formula exists                                                | Decimal addition in salary-line total helper; component tests passed          | Satisfied at component level only                                               |
| Sales rates and payment models exist                                            | Independent rates; Classic/first subscription/recurring paths                 | Implemented; correctness blocked by D-03/D-05/D-07/N-02                         |
| Delivery v2 component calculation exists                                        | Role units × rates, snapshots, readiness/locking, rounding tests              | Satisfied at component level; complete payroll integration unverified/defective |
| Monthly payroll lifecycle exists                                                | Draft/review/approval/payment/close paths and tests                           | Implemented, not operationally accepted                                         |
| Some duplicate constraints exist                                                | Unique run/month, line/run/employee, Sales indexes, Delivery allocation links | Source/schema evidence only; N-02 conflict and concurrency gaps remain          |
| Employee Wallet ownership control exists                                        | Month-detail owner check                                                      | Positive control; broad financial API gaps remain                               |
| Financial operations limited to authorized people                               | D-01/D-06 and alternate paths N-04                                            | Not satisfied                                                                   |
| Every included employee has approved period-correct terms                       | D-02/N-01                                                                     | Not satisfied                                                                   |
| Every legitimate bonus component is retained and payable once                   | N-02/N-03/N-07/N-09                                                           | Not satisfied                                                                   |
| Currency stays explicit and compatible                                          | N-05                                                                          | Not satisfied                                                                   |
| Paid amounts reflect actual payment records                                     | D-04/N-07/N-08                                                                | Not satisfied                                                                   |
| Reversal preserves consistent financial history                                 | D-03/D-04/N-08                                                                | Not satisfied                                                                   |
| Concurrent requests cannot exceed obligations or duplicate records              | N-06; other races unverified                                                  | Not satisfied                                                                   |
| Missing KPI, zero Fix and incomplete employment periods have approved treatment | BD-02/03/07/08                                                                | Unresolved requirements                                                         |
| Intended launch departments and payroll boundary are approved                   | BD-09/10/13 and policy hierarchy scope                                        | Unresolved scope                                                                |
| Real Delivery norms/rates and applicable migrations are accepted                | TODO records outstanding rollout/acceptance work                              | Unverified; Owner publication and environment evidence required                 |
| Finance independently reconciled a full staging payroll                         | No such execution in this audit                                               | Unverified                                                                      |

“Component-level satisfied” is not permission to use that feature for real pay while its surrounding safeguards fail.

## 3. Mandatory launch blockers

| Blocker                                  | Evidence IDs                          | Business consequence                                                      | Required exit evidence                                                                         |
| ---------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Financial access and authentic approvals | D-01/D-06                             | Salary disclosure and unauthorized or falsely attributed decisions        | Action/object permission matrix; negative/positive HTTP tests; actor spoofing rejected         |
| Salary source and effective periods      | D-02/N-01                             | Wrong fixed pay or payroll without agreed terms                           | Historical/current/future fixtures; missing-profile rejection; approved period examples        |
| Complete Sales entitlements              | D-05/D-07/N-02                        | Wrong rate, missing role amount, or missed bonus after failure            | Two-role database test; event-date snapshots; idempotent recovery and exception reconciliation |
| Multiple bonus entries reach payroll     | N-03                                  | Underpayment of legitimate roles/components                               | Exact source-entry-to-line sum across multiple entries and orders                              |
| Bonus release invariants                 | N-04                                  | False PAID records or exceptions without reasons                          | All write paths reject unsupported status/approval/reason combinations                         |
| Explicit currency handling               | N-05                                  | Wrong-unit payment or mixed-currency addition                             | Approved currency contract; incompatible inputs blocked or explicitly handled                  |
| Debt/carry and final settlement          | N-07/N-09                             | Deferred or old amounts omitted; terminated employee obligations stranded | Carry-only month, late-funded work and final-settlement scenarios pass                         |
| Reversal and history integrity           | D-03/D-04/N-08                        | Cash, salary, bonus and journal disagree                                  | Audited corrections reconcile every affected register before/after payout                      |
| Atomic financial writes                  | N-06/U-04                             | Excessive or duplicate financial records                                  | Concurrent PostgreSQL and failure-retry tests with no excess or duplicate effect               |
| Unresolved applicable business rules     | Normalized BD register in document 11 | Different operators can produce different pay for the same facts          | Owner-selected rules, effective scope and acceptance examples                                  |
| Unverified complete workflow             | V-01–V-17 in document 11              | Unit tests miss integration errors                                        | Independent expected payroll, staging execution, browser checks and Finance/Owner acceptance   |

An organization-wide launch is not supported by the available evidence. A narrower first launch is a possible future Owner scope decision, not an approved workaround. Excluded populations, currencies and pay types must be explicit and enforced; a scope restriction does not excuse common-path defects such as missing authorization or false paid balances.

## 4. Separate defects, requirements and optional work

### Confirmed defects requiring correction

D-01–D-07 and N-01–N-08 require correction or a complete, explicitly approved control satisfying the underlying requirement. N-09 requires completion and validation of old-obligation/final-settlement paths. Changing payroll permissions alone does not address salary history, amount aggregation or ledger integrity.

### Missing documented functionality

The full company/department/seat/level/employee policy hierarchy was not established as implemented. Automated Marketing incentives are documented but not demonstrated. Support has a manual template, not a verified complete automatic compensation process. A complete paid-salary correction workflow and terminated-employee settlement path were not established. These gaps must be completed for the populations/processes relying on them, or formally excluded from an explicitly approved initial scope with a controlled alternative.

### Unresolved business requirements

The normalized register in document 11 includes partial Classic payment triggering, missing KPI facts, zero-base cap, currencies, midmonth changes, hire/termination/leave proration, approval separation, reversal attribution, department cost treatment, launch departments, statutory/bank scope, and failed-accrual operations.

Existing requirements must not be relabeled as optional decisions: payroll needs a valid effective profile; one employee in both Sales roles receives both amounts; clawback is not deducted from fixed salary; Active termination bonuses remain payable; Delivery v2 does not inherit legacy 70/30 or employee-grade rate overrides.

### Optional or conditional future improvements

| Item                                                                                 | Treatment                                                                                                                       |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Richer department comparisons, scheduled reporting packets and additional dashboards | Can be deferred if first-launch reconciliation and required cost attribution remain sufficient                                  |
| Additional UI convenience, bulk operations and nonessential reporting automation     | Optional after correctness and access controls                                                                                  |
| Automated Marketing/Support calculations                                             | Conditional: mandatory if the launch relies on them; otherwise require an explicit approved manual process/scope restriction    |
| Full non-Delivery policy hierarchy                                                   | Conditional on first-launch compensation agreements; do not silently disregard existing overrides                               |
| Multiple-currency payroll                                                            | Conditional scope; an enforced incompatibility blocker is mandatory even for an AMD-only launch                                 |
| Tax calculation, statutory deductions, payslips, bank transfer execution             | Scope decision, not automatically optional or automatically required; jurisdiction/accountability must be specified if included |
| Automatic monthly run creation                                                       | Decide operational ownership and scope; no verified payroll cron should be assumed                                              |

## 5. Required acceptance package

The detailed V-01–V-17 scenarios are specified in [11-FINAL-COMPLETION-PLAN](11-FINAL-COMPLETION-PLAN.md). Before launch the evidence package must contain:

1. An approved rule record identifying launch employees/pay types/currencies, effective dates, unresolved exclusions and accountable approvers.
2. An independently calculated synthetic expected payroll, including amount, currency, source profile, source bonus entries, expected debt/carry and payment dates.
3. An isolated nonproduction database with verified relevant migrations, indexes and grants. Source SQL presence alone does not prove installation.
4. Executed positive and negative API tests through real authorization boundaries, including alternate financial write paths.
5. Concurrency and failure-injection tests for payouts, releases, approval and activation, with idempotent replay checks.
6. A complete employee-to-bonus-to-payroll-to-payment-to-report rehearsal, including partial payment, later funding, reversal, closed-history adjustment and final settlement.
7. Reconciliation by employee and run across SalaryLine, PayrollRun, Expense, ExpensePayment, BonusRelease, carry balances, Wallet, ProductBonusPool and operational journal. No unexplained difference is acceptable.
8. Desktop/mobile browser acceptance for compensation, matrix, Salary Board, Bonus Board, Wallet and payment recording, with correct visibility and currency labels.
9. Finance acceptance of the expected/actual comparison and Product Owner acceptance of scope and unresolved exclusions.

Real commercial Delivery norms/rates remain the Owner's responsibility. Synthetic test values must not become production pay terms. Production deployment, migration, cutover and financial corrections require separate authorization; this audit and these documents do not grant it.

## 6. Current decision status

No new compensation rule is approved merely because the Product Owner authorized these documents. Interactive decision-making follows document creation, in Russian, two or three related questions at a time. Recommendations and selected rules must be stored separately.

Until the relevant decisions, corrections and acceptance evidence are complete, the appropriate status is **not accepted for real payroll**, not “ready with minor improvements.”
