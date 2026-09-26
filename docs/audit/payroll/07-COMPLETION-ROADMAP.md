# Payroll audit — completion roadmap

**Audit date:** 2026-09-26. This is a proposed sequence of future work, not authorization to change code, migrate databases or run production payroll. Defect IDs are in [04](04-FUNCTIONAL-DEFECTS.md); Product Owner decisions are in [06](06-BUSINESS-DECISIONS.md). Keep delivery v2 rollout constraints in `TODO.md` in force.

## Stage 0 — Contain financial access before a live payroll run

**Basis:** D-01 and D-06; documented Finance/CEO access in `docs/NBOS/03-Business-Logic/03-Bonus-Payroll-Logic.md:445-461`.

1. Inventory every read and mutation route under payroll runs, bonuses, sales policies, compensation profiles and expense payment linkage. Define read, edit and approval permissions and object scopes for Finance, CEO, employee self-view and prohibited roles.
2. Enforce those permissions at the API, including route/object checks. Bind approver to authenticated identity; implement separate approval only if BD-05 requires it. Preserve employee Wallet's owner check (`apps/api/src/modules/employees/employee-wallet.service.ts:68-83`).
3. Add negative integration tests for a role with `FINANCE_SALARY`/`FINANCE_BONUSES = NONE`, self-only employee, Finance and CEO. Include read by guessed UUID, manual bonus, rate change, release create/patch and payroll approval.

**Exit evidence:** documented permission matrix, passing negative/positive API tests, review of all affected routes, and a staging check that direct requests are denied independent of UI navigation. **Blocker:** real payroll must not begin before this gate.

## Stage 1 — Make salary source and historical periods correct

**Basis:** D-02 and BD-07/BD-08; profile canon `docs/NBOS/02-Modules/07-My-Company/07-Compensation-and-Policies.md:69-109`.

1. Get Owner decisions for midmonth changes, retro corrections, hire/termination/leave and salary currency (BD-06–BD-08). Do not invent proration.
2. Resolve profiles by effective period history, including archived versions, without making future profiles active too soon. Enforce nonoverlap/uniqueness for a day and define a deterministic month choice or prorated calculation according to Owner policy.
3. Review `Employee.baseSalary` fallback: specify when allowed, how it is displayed, and whether a missing profile blocks approval. Preserve a durable salary-source snapshot on the line sufficient to explain a later audit.
4. Add tests for past/current/future month, month boundary, two versions in one month, concurrent activation, no profile, terminated/rehired employees and currency mismatch. Validate migration/backfill only in an isolated environment if schema changes become necessary.

**Exit evidence:** a staging run whose salary line, source profile, currency and effective date match approved examples for every employment scenario; reviewer sign-off by Finance/Product Owner.

## Stage 2 — Make bonus accrual, reversals and failures reconcilable

**Basis:** D-03, D-05, D-07; BD-01, BD-04, BD-11, BD-14.

1. Decide partial-invoice trigger, authoritative rate date, refund/clawback for each release/payment state, and failed-accrual handling. Lock these as examples before changing formulas.
2. Resolve Sales policy by the approved event date; preserve an immutable applied-rate snapshot and stable tie/version rule. Verify Seller and Assistant independently, including one employee in both slots and recurring subscription invoices.
3. On client payment reversal, record an audited entitlement correction and refresh affected KPI, release, Wallet and pool state. For already paid amounts, use the Owner-approved recovery path rather than editing history silently.
4. Add idempotent retry/reconciliation for paid invoices missing bonus entries. Detect exceptions before payroll approval and assign Finance an explicit resolution task.
5. Add isolated database tests for duplicate/concurrent events, backdated policy changes, Classic partial payments, first/recurring subscriptions, complete/partial refunds and already paid clawback.

**Exit evidence:** every qualifying paid invoice reconciles to expected accrual slots or an explicit exception; refunded facts reconcile to correction records; no duplicate amounts in concurrent staging tests.

## Stage 3 — Reconcile payroll payment and release ledger

**Basis:** D-04, BD-12; existing `ExpensePayment → SalaryLine` path at `apps/api/src/modules/payroll-runs/payroll-salary-line-ledger-sync.ts:30-79`.

1. Decide attribution of partial salary payout between Fix and bonuses and the release state after reversal. Preserve an audit history of payment creation/deletion.
2. Make bonus paid state a consequence of actual expense payments; on payment deletion or correction, reconcile releases, entry statuses, product pool and Wallet. Prevent changes to a closed run except through an approved correction path.
3. Test complete and partial payment, deletion after full payment, repeated sync, concurrent payments, overpayment prevention, held lines and run closure.
4. Reconcile `PayrollRun.totalPayable/totalPaid`, salary lines, expenses, expense payments and release paid amounts by run and employee. Flag differences rather than hiding them.

**Exit evidence:** zero unexplained differences in a staged approved→paid→reversed scenario and a repeatable Finance reconciliation report.

## Stage 4 — Complete only the documented and approved department rules

**Basis:** documented hierarchy and Marketing rules in `docs/NBOS/02-Modules/07-My-Company/07-Compensation-and-Policies.md:31-65,113-145` and `docs/NBOS/03-Business-Logic/03-Bonus-Payroll-Logic.md:315-341`; BD-09/BD-10.

1. Decide whether the first release needs automated Marketing/Support compensation or an approved manual process. If automation is approved, specify metrics, source facts, eligibility, rates, effective dates and reversal behavior in canon first.
2. Implement the documented company/department/seat/level/employee precedence only after Owner approves the precise rules and audit requirements. Do not apply employee/grade overrides to delivery v2, whose canon expressly excludes them (`docs/NBOS/03-Business-Logic/11-Delivery-Compensation-Configurator.md:98-105`).
3. Define how a multi-department employee's fixed salary is reported and how order/project bonuses flow to cost reports. Keep one actual employee payment unless a separate split is approved.
4. Extend payroll reporting only to approved cost attribution and necessary Finance controls. Tax, payslip and bank transfer work depends on BD-13 and jurisdiction-specific requirements.

**Exit evidence:** approved business examples and source-to-report tracing for each supported department; no undocumented formula in code.

## Stage 5 — Delivery v2 and full acceptance

**Basis:** current `TODO.md:67-85,126-146`; delivery v2 canon `docs/NBOS/03-Business-Logic/11-Delivery-Compensation-Configurator.md`.

1. Owner publishes real role units, rates, core/function norms and profiles through the approved UI. Do not substitute test values for production pay.
2. On an isolated staging database, verify required migrations and grants, published norms, enrollment gating, first Development plan, scope/team revision, Product/Extension Done, partial/full funding, release, payroll approval and payout. Include legacy products to ensure they are not silently recalculated.
3. Perform browser QA of desktop/mobile Salary Board, Payroll matrix, Bonus Board, employee Wallet, Pay Now and compensation settings. Verify Finance versus employee access, monetary labels, rounding, currency and audit trail.
4. Finance and Product Owner compare staged calculation examples with an independently prepared expected payroll, including zero/negative/missing data and reversals. Review exception logs and reconciliation. Record dates, environment, fixtures, outputs and sign-offs.

**Exit evidence:** signed end-to-end staging payroll and negative authorization report. `IMPLEMENTED_NOT_VERIFIED` must remain until actual evidence exists; do not mark launch `DONE` merely because files or unit tests exist (`TODO.md:12-24`).

## Final release prerequisites

- D-01 through D-06 resolved with passing regression tests; D-07 has monitored recovery or an explicitly approved alternative.
- BD-01 through BD-14 resolved where applicable to the intended employees and pay types, with written policy examples. Unsupported pay types must be clearly excluded from first release.
- Verified currency handling, actual salary sources, approved rates, idempotency and reversal reconciliation.
- All required schema migrations applied and verified only on approved nonproduction environment first. Production migration/cutover requires a separate explicit authorization; this audit grants none.
- Successful end-to-end staging run and Finance/Owner sign-off on gross payable, employee payout records, Wallet, reports and exceptions. Production data and real employee balances remain untouched during this audit.

## Dependency order

```text
Access and authentic approvals
  → Owner rules for time/currency/KPI/reversal
  → salary and Sales/Delivery correctness
  → expense/release reconciliation
  → department scope and reporting as approved
  → staged end-to-end acceptance
  → separate launch decision
```
