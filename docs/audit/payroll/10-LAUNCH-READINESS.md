# Payroll — launch readiness

**Audit basis:** completed independent verification dated 2026-09-26 at revision `68465d3148d104261729351b0b94cd86e3135115`, recorded in [09-INDEPENDENT-VERIFICATION](09-INDEPENDENT-VERIFICATION.md). **Decision consolidation:** 2026-09-27, after direct Owner answers through Q-38 and delegated small technical choices Q-39–Q-46 in [11-FINAL-COMPLETION-PLAN](11-FINAL-COMPLETION-PLAN.md). No new deployment audit or application change is asserted.

**Readiness: not accepted for real payroll. Business rules are now resolved for the bounded launch, but required fixes and end-to-end acceptance remain outstanding.** Documentation approval and decision closure do not authorize real payments, migration or deployment.

## 1. Product Owner explanation

The main business uncertainty has been removed: salary months, Sales KPI, Probation, the per-order Sales ceiling, manual project payments, corrections and first-launch scope are recorded. The existing software still has confirmed financial-integrity defects. It also contains a salary-linked monthly bonus ceiling the Owner explicitly rejected; the desired 300,000 AMD Sales order ceiling was not established in the inspected calculation path.

A future salary can affect the wrong period, one of two legitimate Sales roles can be lost on saving, multiple project bonuses can appear as only one, and deferred money can appear already paid. Removing a payment can leave other financial records unchanged. Resolving policy does not repair these paths.

**Historical test evidence:** 646 automated tests in 141 files passed, plus 11 completed isolated source-function probes. These are results of the completed audit, not tests rerun during document consolidation. **Not verified:** deployed settings/data, real PostgreSQL races/installed constraints, full browser journeys, actual employee balances, or complete staged payroll acceptance.

## 2. Agreed first-launch scope

| Area                  | Current approved outcome                                                                                                                                                   | Remaining implementation/validation                                                                     |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Periods               | Full fixed salary from chosen current/future month; prior service month ordinarily paid next month; no hard days 1–15 restriction                                          | Historical/current/future terms, explicit period labels and manual corrections                          |
| Currency/accounting   | AMD amounts payable to employee; taxes/accounting/bank transfers handled externally                                                                                        | Reject incompatible inputs, reconcile actual employee receipts, no double deduction                     |
| Salary/access         | Access date independent of salary start; manual final salary and absence adjustments; valid old obligations retained                                                       | Distinguish missing terms, agreed no-fixed-salary Sales Probation and future salary; preserve history   |
| Sales Probation       | Same calendar-month model and KPI scale as active Sales; individually assigned monthly targets; Owner/CEO decides hiring freely                                            | No whole-probation accumulator or automatic hiring gate; no target day-proration                        |
| KPI                   | >=70% → full; >=50% and <70% → half; below50% → zero payout; missing required facts hold affected bonus                                                                    | Stable earned-month snapshots and current/future target changes, no missing-data full-factor default    |
| Sales order bonus     | Both roles required, same employee may occupy both; combined maximum 300,000 AMD per order before KPI, including cumulative subscription first/recurring accrual           | Preserve both role amounts, proportional split, no duplicate per-role/per-invoice allowance             |
| Monthly bonus ceiling | No limit derived from salary, regardless of number of eligible orders                                                                                                      | Remove rejected shared cap mechanism; preserve/reconcile existing unpaid carry                          |
| Invoice eligibility   | First fully paid qualifying product invoice; exclude domain/unrelated service; unpaid duplicate replacement allowed; creation minimum covers combined capped Sales accrual | Validate all entry/edit paths and event-date rates, no hidden minimum override                          |
| Project payments      | Finance/CEO/Owner manually selects employee/project amounts; hired Development installments allowed before completion; extra reward separate from original plan            | Reuse matrix, aggregate every source, show actual paid versus selected allocation and remaining amounts |
| Actual partial payout | Fixed salary first; explicitly chosen project allocation thereafter, no project FIFO                                                                                       | Allocation totals equal actual payout; reverse original allocations exactly                             |
| Authority             | One authorized Finance/Director/CEO/Owner can prepare and approve alone                                                                                                    | Actual actor and scoped permissions, reasons, lifecycle and cash evidence                               |
| Manual scope          | Manual monthly run, manual Marketing/Support, no department fixed-salary split                                                                                             | Existing paths correctly materialize and reconcile; no new scheduler/formula engine required            |
| History/cutover       | New rules from selected month; Finance reviews old unpaid balances; paid history preserved; rare current-period manual corrections and residual recovery                   | No mass retroactive repricing, debt erasure, fixed-salary clawback or unapproved live mutation          |

Detailed provenance and bounded delegated defaults are in document 11. Actual salaries, targets, effective cutover month and Delivery tariffs are inputs still to be supplied by authorized people, not values to invent.

## 3. Readiness conditions

| Condition                                                                              | Evidence                                                          | Status                                                                       |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Salary-plus-bonus math, Sales/Delivery component calculations, payroll lifecycle exist | Original source review and component tests                        | Component-level evidence only                                                |
| Business model and launch scope resolved                                               | BR record, Q-37/38 and delegated Q-39–46 in document 11           | Satisfied as decision record, not implementation                             |
| Authorized access and truthful approval/payment facts                                  | D-01/D-06/N-04                                                    | Not satisfied                                                                |
| Period-correct approved compensation and explicit Probation terms                      | D-02/N-01/N-09, current Owner decisions                           | Not satisfied                                                                |
| Desired Sales ceiling/invoice rules and no salary ceiling                              | Targeted source findings in document 09 addendum; BR-29–36        | Source-policy conflict/gaps require implementation; live settings unverified |
| All legitimate bonus components reach payment once                                     | N-02/N-03/N-07/N-09                                               | Not satisfied                                                                |
| AMD compatibility and accurate actual-paid balances                                    | N-05/D-04/N-07/N-08                                               | Not satisfied                                                                |
| Reversal/history and atomic writes                                                     | D-03/D-04/N-06/N-08                                               | Not satisfied; PostgreSQL race verification also outstanding                 |
| Commercial inputs, deployed constraints and migration state accepted                   | No production inspection; Delivery rollout inputs belong to Owner | Unverified execution prerequisites                                           |
| Full independent payroll comparison, API/database/browser rehearsal                    | No such completed acceptance in this audit                        | Unverified                                                                   |

Component evidence or an approved rule is not permission for real payroll while its surrounding controls fail.

## 4. Mandatory launch blockers and exit evidence

| Blocker                                       | Evidence / business impact                                                                                   | Mandatory exit evidence                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Financial permissions and authentic approvals | D-01/D-06: unauthorized disclosure/changes or false approver                                                 | M-01/M-08, real guard/API positive and negative tests, actual actor cannot be forged                                            |
| Salary periods and employee inclusion         | D-02/N-01/N-09: wrong current/history/final salary or missing terms silently zero                            | M-02, chosen-month and explicit Probation fixtures, no fallback errors, valid terminated obligations payable                    |
| Sales entitlements, limit and event selection | D-05/D-07/N-02 and post-audit policy clarification: lost roles, wrong rates, missing accrual, wrong ceilings | M-04/M-06/M-08, both roles on real constraints, invoice minimum, cumulative order cap, cap-before-KPI, no salary ceiling, retry |
| Project aggregation and old obligations       | N-03/N-09: underpayment or forgotten old amount                                                              | M-05/M-06, multiple sources summed, manual project selections, late funding/final settlement without fake new bonuses           |
| Unsupported PAID and unaudited exceptions     | N-04: false payout/extra award records                                                                       | All paths enforce cash evidence, reason and genuine authorization, while allowing authorized early/extra workflow               |
| Currency contract                             | N-05: wrong currency interpreted as AMD                                                                      | M-03, incompatible currency rejected and intended AMD/net meaning preserved                                                     |
| Paid/deferred/history reconciliation          | D-03/D-04/N-07/N-08: balances/journal disagree                                                               | M-06/M-07, partial payments and exact reversals, preserved old carry and manual corrections                                     |
| Concurrency/recovery                          | N-06/U-04: excess, duplicate or partial records                                                              | M-09, isolated PostgreSQL races and failure replay with one financial effect                                                    |
| Controlled transition of old records          | Q-37 A: old data not inspected and may use rejected/absent rules                                             | V-18, approved cutover month, reviewed old unpaid inventory, no automatic repricing of paid history                             |
| Complete operational proof                    | Component-only audit evidence                                                                                | M-11, V-01–V-19 executed with expected/actual reconciliation, browser acceptance and Finance/Owner sign-off                     |

## 5. Distinguish required fixes from deferred scope

**Confirmed defects:** original D-01–D-07 and N-01–N-08 remain defects unless later verified fixes demonstrate otherwise. N-09 is a confirmed restrictive path and incomplete settlement workflow. Removing the salary ceiling does not forgive existing carried debt or fix incorrect paid projections by itself. No production incident or affected amount was established.

**Newly clarified requirement conflicts/gaps:** salary-multiple monthly ceiling is contrary to Owner policy; the desired shared 300,000 order ceiling and exact invoice-minimum/role-closure rules need implementation verification and any missing work. The audit did not prove every live path/configuration lacks those checks; do not claim a complete deployed absence.

**Mandatory, using existing architecture:** simple manual adjustments, partial/early Development payouts, extra entries, authentic approval, period correctness, residual debt visibility and final settlement. “Keep it simple” does not mean a manual edit may lose money or history. No separate large correction subsystem is required.

**Deferred/external:** automatic monthly payroll creation; automatic Marketing/Support formulas; department fixed-salary allocation; general non-Delivery hierarchy; FX/multi-currency payroll; statutory/tax/payslip/bank execution engines; nonessential dashboards. Existing real agreements that cannot be represented in the approved bounded scope must be explicitly reviewed, not silently ignored. Delivery v2 units/rates remain the existing calculation model, without legacy70/30 or employee-grade overrides.

## 6. Required acceptance and handoff

The business-decision phase is closed for this scope. Proceed to the ordered implementation plan only under separate authorization; do not restart the general questionnaire. Small delegated choices and responsibilities are recorded in document 11. Real inputs and implementation evidence remain outstanding:

1. Select the cutover month and supply explicit employee terms, individual monthly targets and approved policies/norms. Finance owns input/exception reconciliation, with CEO/Owner substitution.
2. Prepare independent synthetic expected amounts for every supported scenario, including same-person Sales roles, both-role cap/KPI, no-salary Probation, early Development installments, manual extras and old unpaid balances.
3. Validate relevant migrations, constraints and permission grants in an explicitly isolated nonproduction database; execute real API authorization, concurrency and failure-recovery tests.
4. Execute V-01–V-19 from document 11, including worked Owner examples, late records and transition inventory. Preserve legitimate old debts rather than silently applying new caps to them.
5. Reconcile SalaryLine, PayrollRun, Expense, ExpensePayment, BonusRelease, historical carry, Wallet, ProductBonusPool and operational journal. Draft/release/approval is not actual payment.
6. Complete desktop/mobile verification of terms, matrix, boards, Wallet and actual payout recording. Have Finance compare expected versus actual results and the Owner accept the operational scope.
7. Obtain separate authorization for any real deployment, migration, live record correction or launch. Recording these decisions performs none of those actions.

**Status:** requirements/documentation complete at the chosen scope; implementation, commercial-input review and real-payroll acceptance incomplete. No readiness percentage, production discrepancy total or release date is supported.
