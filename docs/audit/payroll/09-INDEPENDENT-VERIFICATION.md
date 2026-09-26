# Payroll — independent verification

**Audit date:** 2026-09-26. **Documentation authorized:** Product Owner approval in the audit conversation, after completion of the independent investigation. **Audited source revision:** `68465d3148d104261729351b0b94cd86e3135115`.

This document records the completed investigation; its creation did not restart the audit. Source references describe the audited revision, not an assertion about a deployed installation. The project is named NBOS in the repository; the request referred to NBIOS.

**Conclusion:** the conditions for real employee payroll operations have not been met. The previous audit's principal defects are supported, but its completion roadmap is incomplete. Additional defects affect combined Sales roles, multiple bonus entries, required compensation profiles, currencies, carry-over, payout concurrency, and financial history.

This is not evidence that production employees have actually been underpaid or overpaid. No production or staging database, real financial operation, external payout provider, or deployed exploit was used.

Related documents:

- [Previous functionality inventory](01-EXISTING-FUNCTIONALITY.md)
- [Previous workflows](02-BUSINESS-WORKFLOWS.md)
- [Previous requirements analysis](03-REQUIREMENTS-GAP-ANALYSIS.md)
- [Previous defects](04-FUNCTIONAL-DEFECTS.md)
- [Previous test report](05-PAYROLL-TEST-REPORT.md)
- [Previous business decisions](06-BUSINESS-DECISIONS.md)
- [Previous roadmap](07-COMPLETION-ROADMAP.md)
- [Previous executive summary](08-EXECUTIVE-SUMMARY.md)
- [Independent launch readiness](10-LAUNCH-READINESS.md)
- [Consolidated completion plan and decision register](11-FINAL-COMPLETION-PLAN.md)

## 1. Scope, method, and evidence labels

The investigation compared all eight previous audit documents with product canon, application source, Prisma schema and migrations, available isolated tests, and additional in-memory execution of selected source functions.

Protected assets included employee compensation, bonus entitlements, payroll approvals, payout records, private financial snapshots, and financial history. Entry points included employee onboarding, compensation activation, payroll and bonus controllers, client payment recording/removal, expense payments, allocation materialization, Wallet projections, and reports.

| Label      | Meaning                                                                                                                                               |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Confirmed  | Supported by a traced source path and, where stated, isolated execution. Does not imply a production incident.                                        |
| Incorrect  | A specific prior assertion conflicts with source, schema, or existing canon.                                                                          |
| Incomplete | The original observation is supported but omits an important condition, consequence, or already documented rule.                                      |
| Unverified | Evidence does not establish the claimed behavior at the required level, such as deployed constraints, browser behavior, or real database concurrency. |

A test that asserts existing behavior does not establish that the behavior satisfies business requirements. A mocked insertion does not prove PostgreSQL uniqueness or transaction behavior.

### Governing requirements

- `docs/NBOS/03-Business-Logic/03-Bonus-Payroll-Logic.md`: Fix plus variable pay; independent Seller/Assistant rates; both roles for one employee; payment-event snapshots; KPI gate; cap/carry; clawback and termination treatment.
- `docs/NBOS/02-Modules/07-My-Company/07-Compensation-and-Policies.md`: effective compensation versions, required profile before payroll, currencies, approvals, policy hierarchy.
- `docs/NBOS/02-Modules/04-Finance/05-Bonus-and-Payroll.md`: monthly payroll lifecycle, allocation matrix, exception reasons, release and payout records, permissions.
- `docs/NBOS/03-Business-Logic/11-Delivery-Compensation-Configurator.md`: Delivery v2 role units and rates, snapshots, AMD compatibility, rounding, enrollment and revision controls.
- `TODO.md`: outstanding Delivery acceptance and owner publication of real norms/rates. Documentation of an outstanding item is not a query of production configuration.

Delivery v2 takes precedence over legacy percentage and developer 70/30 rules. No statutory minimum salary, tax formula, attendance formula, commercial rate, or undocumented compensation rule was inferred.

## 2. Verification of all prior defect IDs

### D-01 — financial API authorization: Confirmed, scope incomplete

**Evidence:** `apps/api/src/modules/payroll-runs/payroll-runs.controller.ts` and `apps/api/src/modules/bonus/bonus.controller.ts` have no financial permission decorators. `apps/api/src/common/guards/permission.guard.ts:14-21` permits a route without permission metadata. Global authentication and employee/session controls exist in `apps/api/src/app.module.ts`; they are not a substitute for financial authorization. The inspected services do not introduce the missing financial scope checks.

**Independent execution:** an undecorated-handler guard invocation with financial rights set to `NONE` returned `true` (P-01). This was not a deployed HTTP attack.

**Impact and precondition:** an authenticated employee able to reach these routes may read other employees' financial data and invoke payroll/bonus mutations. The same inventory must cover private Delivery normative snapshots returned by broad bonus queries and adjacent employee/compensation surfaces, not only menu visibility.

**Existing mitigation:** authentication remains required; the employee Wallet month-detail path separately checks ownership. Those controls do not close the broad payroll/bonus routes.

**Required correction/validation:** enforce action and object scope on every financial route; test forbidden, own-only, department, Finance, CEO and owner cases with actual guards. See M-01.

### D-02 — historical/future compensation selection: Confirmed

**Evidence:** `compensation-profiles/compensation-profiles.service.ts:113-160` immediately archives other active profiles and copies the activated salary onto Employee. `resolve-active-compensation-profile.ts:13-36` selects only `ACTIVE` profiles overlapping the requested month. `payroll-runs/payroll-runs.service.ts:158-181` falls back to Employee salary when none is found. `employees/employee-wallet.service.ts:162-191` selects an active profile without an as-of date.

**Independent execution:** activating a December profile of 200,000 archived a January profile of 100,000; September resolution returned null while Employee fallback became 200,000 (P-02). Figures were synthetic.

**Impact:** current, backdated and future calculations can use the wrong fixed salary. The profile changes are in a transaction; the defect is not absence of any transaction. Concurrent effective-period integrity remains unverified.

**Required correction/validation:** resolve historical effective intervals, preserve future scheduling, and test period boundaries and concurrent activation. Do not invent a midmonth formula. See M-02.

### D-03 — client payment removal leaves Sales accrual: Confirmed

**Evidence:** `finance/payments/payments.service.ts:279-313` invokes Sales accrual on a fully paid invoice, but deletion resynchronizes invoice/order/pool without Sales reversal or corresponding KPI refresh. Partner reversal on that path does not reverse employee Sales bonuses.

**Impact:** entitlement may remain after the source cash fact is removed. Recovery from already paid bonuses needs a governed correction path.

**Existing mitigation:** deletion checks whether the payment's finance posting period is open. This does not repair open-period Sales reversal behavior.

**Requirement correction:** canon already states that clawback is taken from future bonuses, not fixed salary (`03-Bonus-Payroll-Logic.md:417`). BD-04 must not reopen this as an unspecified salary deduction choice. See M-07.

### D-04 — payout removal leaves bonus releases paid: Confirmed, incomplete

**Evidence:** `expenses/expenses.service.ts:236-248` deletes an expense payment and calls salary synchronization. `payroll-salary-line-ledger-sync.ts:51-78` only marks releases paid when the line becomes paid; it has no inverse path. `payroll-bonus-release-paid-mark.ts:11-74` updates included releases to `PAID`. Entry status synchronization treats `PAID` as terminal.

**Impact:** salary balance can become unpaid while bonus records still say paid. N-07 further establishes overstatement even without a reversal; N-08 adds journal inconsistency.

**Required correction/validation:** reconcile payout, release, entry, pool, Wallet and journal in both directions, including partial allocation and closed-history adjustments. See M-06/M-07.

### D-05 — Sales policy date uses processing time: Confirmed

**Evidence:** `bonus/sales-bonus-accrual.service.ts:133-142,196-213,239-249` derives the earned month from invoice paid date but selects the policy with `effectiveFrom <= new Date()`. The payment service sets invoice paid date from the latest recorded payment date.

**Impact:** delayed/backdated entry can select a later rate. A snapshot preserves the selected result but does not make the selection correct.

**Boundary:** event-based rate snapshots are already required. Exact qualifying event, timezone, tie/version handling and correction behavior still need precise acceptance examples. See M-04.

### D-06 — supplied approver identity: Confirmed

**Evidence:** `compensation-profiles/compensation-profiles.controller.ts:40-45` forwards body `approvedById`. `bonus/bonus.controller.ts` does the same for direct release create/patch. `bonus/bonus-release.service.ts:225-237` checks a nonempty supplied ID for over-funding, not authenticated approval authority.

**Impact:** an authorized or otherwise reachable caller can name someone else as approver. A valid employee foreign key does not establish consent.

**Boundary:** payroll status approval itself uses the authenticated actor. Do not generalize the spoofing finding to every approval route. Independent maker/checker separation is an unresolved business choice; authentic attribution is not. See M-01/M-08.

### D-07 — failed accrual only logged: Confirmed

**Evidence:** `bonus/sales-bonus-accrual.service.ts:54-66` catches errors and logs them. The only non-test caller found was the payment path. Scheduler KPI backfill repairs snapshots for existing entries; it does not demonstrate creation of entirely missing Sales accruals.

**Impact:** a recorded client payment can lack an owed bonus until detected. Neither incident frequency nor live operational alerting was established.

**Required correction/validation:** durable idempotent recovery, an owned exception process and failure-injection tests. See M-04 and BD-14.

## 3. Prior risk IDs and requirement claims

| Prior item                                          | Independent disposition                                            | Evidence and qualification                                                                                                                                                                                  |
| --------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| U-01 Currency                                       | Incomplete; missing compatibility control is confirmed             | N-05/P-05 demonstrates that a USD-linked line materializes an expense without currency or rejection. Actual wrong-currency production payment is unverified.                                                |
| U-02 Missing KPI                                    | Confirmed behavior; unresolved business handling                   | `bonus-payable-snapshot.ts:35-70` can return factor 1 without required facts/profile linkage. `resolve-employee-sales-kpi.ts:61-70` also has a full-factor fallback. BD-02 remains necessary.               |
| U-03 Zero salary cap                                | Confirmed behavior; unresolved exception policy                    | `payroll-bonus-cap.ts:35-37` bypasses cap for base salary at or below zero. BD-03 remains necessary.                                                                                                        |
| U-04 Concurrency                                    | Incomplete                                                         | N-06/P-06 identifies a concrete check-then-write payout race. Live PostgreSQL release, approval, activation and payout races remain unverified.                                                             |
| U-05 Partial Classic trigger                        | Current behavior confirmed; intended boundary unverified           | Code waits for fully `PAID`. Canon uses both first received money and paid invoice wording. BD-01 needs an explicit scenario.                                                                               |
| Fix + bonus                                         | Component formula confirmed, complete operation unverified         | `payroll-salary-line-total-payable.ts` adds Decimal base and bonus. Bad source salary or omitted bonus still produces an incorrect payroll.                                                                 |
| Compensation versions                               | Implemented but defective                                          | D-02 and N-01. Existing already-created salary lines store their base; the finding does not assert that every old line is rewritten on profile activation.                                                  |
| Minimum/base salary                                 | One documented field, not two engines                              | Compensation canon calls `base_salary` minimum/fixed salary. A separate statutory floor or guaranteed-income top-up formula was not established.                                                            |
| Approval/policy audit                               | Partly implemented, controls incomplete                            | D-06/N-04. Timestamps and approver fields alone do not authenticate approval.                                                                                                                               |
| Company/department/seat/level/employee hierarchy    | Documented but not established as implemented                      | `compensation.prisma` and `bonus-policies.service.ts` provide named templates/scope and profile links, not the complete precedence resolver. Delivery v2 explicitly excludes employee/grade rate overrides. |
| Sales formulas and sources                          | Component calculations confirmed; end-to-end defective             | D-03/D-05/D-07/N-02. Separate recurring policy exists.                                                                                                                                                      |
| Same employee Seller + Assistant receives both      | Incorrect as a persistence claim under the repository migration    | The row builder generates both amounts, but the invoice/employee unique index conflicts with them (N-02).                                                                                                   |
| KPI gate and cap/carry                              | Implemented but incompletely verified and defective in integration | U-02/U-03/N-07. Unit assertions are not proof of retained debt or correct paid totals.                                                                                                                      |
| Delivery v2                                         | Calculation and controls exist; complete workflow unverified       | Role/component math, snapshots, configuration lock and readiness code exist; N-03/N-07/N-09 affect its payroll integration. Live rates and rollout were not inspected.                                      |
| Marketing automation                                | Documented but not established as implemented                      | Canon describes KPI plus marketing-source sales; `MARKETING_MANUAL_PLANNED` is a manual template.                                                                                                           |
| Support automation                                  | Partly specified/implemented                                       | `SUPPORT_MANUAL_PLANNED` exists. No verified automated Support performance calculation or complete approved formula was established. Absence of a SUPPORT enum alone would not prove this.                  |
| Payroll review/expense/payment/close                | Paths exist; end-to-end unverified                                 | Transitions, materialization and positive-line close checks exist, but D-01/D-04/N-04/N-06/N-08 affect operational safety.                                                                                  |
| Salary corrections after approval/payment           | Incomplete                                                         | No complete governed historical salary correction workflow was established. Preserve the canon requirement for correction/adjustment.                                                                       |
| Department/project reporting                        | Partial                                                            | Multiple memberships and board filtering exist; one employee/month salary line remains. Payroll report explicitly defers department comparison work.                                                        |
| Tax, bank execution, payslips, statutory deductions | Scope unresolved, functionality not established                    | They must not be declared mandatory product features or safe omissions without BD-13. No jurisdictional/legal audit was performed.                                                                          |
| Automatic payroll creation                          | Not established                                                    | Manual creation exists; no payroll-creation scheduler was demonstrated. This is a scope/operational decision, not evidence of automatic monthly coverage.                                                   |

The previous roadmap remains useful but is insufficient without the additional blockers and acceptance gates in documents 10 and 11. The previous executive conclusion that readiness is not established is supported; the original 45-test report is superseded for coverage description by the execution below, not converted into end-to-end certification.

## 4. Additional defects and incomplete critical paths

### N-01 — payroll without an approved effective profile

**Classification:** confirmed requirement violation; high launch priority.

`payroll-runs.service.ts:158-181` seeds every currently non-terminated employee, resolves a profile, then uses Employee salary or zero. Approval validation checks release totals, not required profile presence. Employee creation and invitation acceptance do not establish a completed approved compensation workflow.

Canon explicitly forbids starting payroll without an active compensation profile for an included employee (`07-Compensation-and-Policies.md:358`). This is not a new optional safeguard.

**Impact:** a new employee can be included with an unapproved fallback or zero. Implement a period-correct profile gate and actionable remediation; do not silently convert missing data into an approved zero salary. Tests: V-01/V-02.

### N-02 — combined Sales roles collide with uniqueness

**Classification:** confirmed source/schema incompatibility; high launch priority. Deployment and real insert not tested.

- `bonus/sales-bonus-accrual-rows.ts:13-41` creates independent Seller and Assistant rows, including when both employee IDs are equal.
- `persistSalesBonusRows` uses `createMany({ skipDuplicates: true })`.
- `packages/database/prisma/migrations/20260523230000_bonus_entry_sales_accrual_unique/migration.sql:6-8` uniquely indexes `(order_id, sales_accrual_invoice_id, employee_id)` for Sales rows with an invoice.
- The slot-specific index does not remove this additional conflict. Recurring row generation also needs coverage.

P-04 generated 80,000 and 20,000 for a synthetic 1,000,000 base and confirmed identical keys under the invoice/employee index. This did not execute PostgreSQL. With the migration applied, both rows cannot be stored together and duplicate-skipping can discard an entitlement.

**Required invariant:** the one employee receives both rates once; retry protection must not erase a legitimate role. See M-04/V-05.

### N-03 — allocation matrix selects only one employee/order bonus

**Classification:** confirmed functional defect; high launch priority.

`payroll-allocation-matrix.service.ts:255-258,433-434` uses `.find(...)` for a single eligible entry. Read-side release aggregation spans the employee/order, while planned amount comes from one entry. Draft uniqueness is also per run/employee/order. Delivery v2 legitimately produces multiple role/component entries.

P-09 executed the matrix with two eligible entries of 50 and 70; displayed planned amount was 50, not 120. Patching also bound the draft to the first entry.

**Impact:** omitted compensation, misleading remaining amounts, and ordinary compensation potentially treated as extra. The matrix must aggregate and allocate explicitly across source entries while preserving traceability. Tests: V-06/V-07.

### N-04 — alternate paths bypass lifecycle and exception controls

**Classification:** confirmed functional/control defects; high launch priority.

`bonus-release.service.ts:104-129` accepts caller status, defaults to `APPROVED`, and checks only existence of an optional payroll run. P-03 accepted a direct `PAID` release with no payroll or payout evidence. Pool synchronization was stubbed in that probe; persistence acceptance was exercised.

`payroll-allocation-matrix.service.ts:339,488-511` exposes `reasonRequired: false` and permits a null reason for extra allocations. P-10 accepted an `EXTRA_BONUS` draft of 150 without a reason. `payroll-bonus-allocation-materialize.ts:74-76,139-140` does not restore the missing exception reason check and bypasses ordinary remaining limits for EXTRA/OVER_FUNDING.

**Impact:** false paid records and unaudited exceptions remain possible even after adding route permissions. Enforce lifecycle and exception invariants in all entry paths. Tests: V-12/V-15.

### N-05 — salary currency is lost at expense creation

**Classification:** confirmed missing currency compatibility control; high launch priority for any potentially incompatible profile.

`CompensationProfile.currency` is accepted by profile creation. SalaryLine has no currency field. `payroll-materialize-expenses.ts:49-91` selects profile currency but neither persists nor validates it. P-05 materialized a synthetic USD profile line of 1,000 as an expense of 1,000 with no currency field or rejection.

**Impact:** an unsupported currency may be interpreted as a different currency, particularly when combined with AMD Delivery bonuses. No conversion was found or assumed. An AMD-only launch still needs an enforced incompatibility blocker. Tests: V-03.

### N-06 — payout balance check and insert are not atomic

**Classification:** confirmed check-then-write defect; database concurrency outcome unverified.

`expense-payment-create.ts:33-67` reads the expense/payment balance, checks the amount, then inserts a payment without a shared transaction lock/atomic limit across those steps. `ExpensesService.addPayment` invokes that helper without adding such a boundary.

P-06 invoked two concurrent calls against the same synthetic remaining balance of 100. Both accepted 100; the in-memory ledger contained 200. Downstream synchronization and posting checks were stubbed; this does not substitute for concurrent PostgreSQL/API testing.

**Impact:** duplicate or excessive recorded employee payouts. Release auto-generation and payroll approval require their own concurrency tests rather than extrapolation from this probe. Tests: V-13/V-14.

### N-07 — cap carry is misrepresented as paid and depends on a new attach

**Classification:** confirmed integration defects; high launch priority.

- `payroll-bonus-release-attach.ts` stores the included and deferred portions separately.
- `payroll-bonus-release-paid-mark.ts` marks the original release paid after its salary line is fully paid.
- `bonus-entry-status-sync.ts:57-63` compares the gross paid release amount against planned amount, ignoring remaining cap carry.
- `employees/employee-wallet-bonus-release-rollups.ts:42-43` also adds gross `release.amount` as paid.
- `applyPendingPayrollCarryOver` is called from attach, not ordinary salary line seeding or an independent carry-only materialization pass.

P-07 demonstrated that a release amount of 300 with included amount 200 and remaining carry 100 can mark the entire entry `PAID`. P-08 demonstrated that approving no new bonus drafts does not enter the attachment/carry path.

**Impact:** Wallet/entry/pool projections can overstate paid money; a month without a new bonus can omit a debt already owed. Preserve source-level carried debt and pay it independently of new earnings. Tests: V-09/V-10.

### N-08 — payout deletion leaves the operational journal uncorrected

**Classification:** confirmed source-path defect; high financial-integrity priority.

`createExpensePaymentRecord` appends a cash journal line. `finance/journal/operational-journal.service.ts:239-255` uses idempotency key `expense-payment:<id>`. `ExpensesService.deletePayment:236-248` deletes the payment and synchronizes expense/salary, but does not reverse that journal line. No relevant database trigger was found in the reviewed migration search.

**Impact:** operational journal and payroll payment ledger can disagree after an allowed open-period deletion. The posting-period guard is a real mitigation for closed periods, not a solution for open-period reversals. Tests: V-11/V-14.

### N-09 — older unpaid bonuses and terminated employees lack a demonstrated complete settlement path

**Classification:** confirmed restrictive predicates; incomplete required settlement workflow; no live loss quantified.

`payroll-bonus-release-base.ts:14-26` accepts only the previous earned month. P-11 confirmed rejection of August when the expected earned month was September; the month-offset dependency was fixed to that expected value in the probe. Older unpaid ordinary bonuses therefore cannot enter this matrix path merely because funding arrives later. This is distinct from cap carry.

`payroll-runs.service.ts:158-161` excludes currently terminated employees. Attach requires an existing salary line. Canon still requires payment of Active bonuses after termination (`03-Bonus-Payroll-Logic.md:485`). Offboarding notification to review final settlement is not an implemented payout path.

**Impact:** late-funded work, deferred ordinary releases and final settlements can remain outside the demonstrated payroll workflow. Verify both inclusion and debt preservation without changing earned-period history or creating a fictitious new bonus. Tests: V-10/V-16.

## 5. Executed checks

### Existing automated tests

**Result:** 141 test files, 646 tests passed, zero failed across two runs. No full repository suite, build, typecheck, lint, deployed API or browser run was performed. The Vite configuration emitted a compatibility warning about ESM syntax loaded as CommonJS; both runs completed successfully.

First run: **121 files / 533 tests**.

```bash
pnpm exec vitest run --no-cache \
  apps/api/src/modules/compensation-profiles \
  apps/api/src/modules/payroll-runs \
  apps/api/src/modules/bonus \
  apps/api/src/modules/delivery-compensation \
  apps/api/src/modules/employees/employee-wallet \
  apps/api/src/modules/employees/wallet-delivery-normative-label.test.ts \
  apps/api/src/modules/employees/employees.service.test.ts \
  apps/api/src/modules/expenses/expenses.service.test.ts \
  apps/api/src/modules/expenses/expense-payment-rollup.test.ts \
  apps/api/src/modules/expenses/expense-status-ledger-sync.test.ts \
  apps/api/src/modules/finance/reports/payroll-report.service.test.ts
```

Second run: **20 files / 113 tests**.

```bash
pnpm exec vitest run --no-cache \
  packages/shared/src/delivery-compensation \
  apps/api/src/modules/auth/accept-employee-invite.test.ts \
  apps/api/src/modules/finance/payments/payments.service.test.ts \
  apps/api/src/modules/finance/journal/operational-journal.service.test.ts
```

The tests exercise pure functions and mocked/synthetic dependencies. Invitation tests do not establish the complete employee-to-approved-compensation onboarding journey. The matrix service test file primarily tests cell-state classification; its passing result did not cover multiple-entry materialization.

### Additional source-function probes

Source TypeScript was read, transpiled and evaluated in memory using explicit dependency substitutions and synthetic records. No probe source file or database record was created. These probes are session evidence, not permanent regression tests. Their assertions described below must become durable tests during authorized implementation.

| ID   | Observed result                                                                                                   | Limits                                                                 |
| ---- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| P-01 | PermissionGuard allowed an undecorated route with financial rights NONE.                                          | No deployed HTTP/authentication exploit.                               |
| P-02 | Future activation archived the old profile; September resolved null and fallback changed from 100,000 to 200,000. | In-memory profile store, not PostgreSQL activation concurrency.        |
| P-03 | Direct release accepted PAID without payroll/payout evidence.                                                     | Pool sync stubbed; no financial operation.                             |
| P-04 | Two same-employee Sales rows had amounts 80,000/20,000 and identical invoice/employee unique keys.                | Insert/skip behavior inferred from migration; actual SQL not executed. |
| P-05 | USD-linked salary materialized an expense without currency or incompatibility rejection.                          | Synthetic expense capture only.                                        |
| P-06 | Two concurrent calls accepted 100 each against a shared 100 balance.                                              | In-memory insert; downstream sync stubbed.                             |
| P-07 | Gross 300, included 200, carry 100 marked entire bonus entry PAID.                                                | Status function with synthetic release aggregate.                      |
| P-08 | No bonus drafts meant no attach/carry invocation during materialization.                                          | Did not run a live month-close.                                        |
| P-09 | Two eligible employee/order entries 50+70 produced matrix planned amount 50.                                      | Mocked query results and layout/unit dependencies.                     |
| P-10 | Matrix accepted an EXTRA_BONUS draft of 150 without a reason.                                                     | Draft capture; approval path additionally traced in source.            |
| P-11 | Older earned-period entry was excluded by equality to the expected previous month.                                | Expected-month dependency supplied; pure predicate result only.        |

One initial matrix probe attempt stopped on an unstubbed import before its assertions. After supplying the isolated dependency, P-09–P-11 completed. No application code or configuration was changed to obtain these results.

## 6. Verification limits and handoff

No current production salary, policy, employee, database migration state, grant, queue, external transfer, deployment or browser state was inspected. Database partial indexes and transactions require real isolated-database validation. No real-world discrepancy amount or impacted employee was established.

The completed investigation was read-only. Documents 09–11 are separately authorized audit outputs; no implementation, production migration, deployment, or correction of financial data is authorized by them. Launch conditions are in document 10, and required actions, dependencies, scenarios and unresolved Owner decisions are in document 11.
