# Payroll audit — functional defects and risks

**Audit date:** 2026-09-26. No production traffic or real employee record was used. “Confirmed from code” means the path and missing control are visible in source; it does not claim that a live exploit or financial discrepancy was reproduced. Priority reflects possible employee/payroll impact, not an observed incident. Reproduction steps below are for an isolated test or staging fixture only.

## D-01 — Payroll and bonus APIs lack declared Finance permissions

- **Priority / status:** Critical; **confirmed from code**, live exploitability untested.
- **Affected:** payroll runs, salary board and detail, bonus entry/release read and writes, sales rate edits.
- **Expected:** Finance/CEO can perform authorized payroll work; an employee sees only their own salary/bonus data, as required by `docs/NBOS/03-Business-Logic/03-Bonus-Payroll-Logic.md:445-461` and `docs/NBOS/02-Modules/04-Finance/05-Bonus-and-Payroll.md:648-653`.
- **Actual:** `PayrollRunsController` and `BonusController` have no `@RequirePermission` on the class or routes. The global `PermissionGuard` returns `true` when no permission metadata is present. Global authentication still applies; the finding is an authorization failure for authenticated users. Some other sensitive controllers do declare `COMPANY` permissions.
- **Evidence:** `apps/api/src/modules/payroll-runs/payroll-runs.controller.ts:14-19,224-254`; `apps/api/src/modules/bonus/bonus.controller.ts:21-42,173-215,252-284`; `apps/api/src/common/guards/permission.guard.ts:14-21`; `apps/api/src/app.module.ts:139-156`; comparison `apps/api/src/modules/compensation-profiles/compensation-profiles.controller.ts:16-59`; RBAC intent `packages/database/prisma/seed-rbac.ts:280-327`.
- **Impact:** Disclosure of other employees' salary and bonus records; unauthorized creation, approval or change of payable amounts, rates or statuses.
- **Staging reproduction:** Authenticate as a role whose `FINANCE_SALARY` and `FINANCE_BONUSES` rights are `NONE`; request `GET /payroll-runs/salary-board`, `GET /bonus`, then attempt a disposable draft-run or manual-bonus write. Check that requests are rejected _before_ financial service calls. Current decorator/guard path predicts they will not be denied by the permission guard.
- **Correction:** Add explicit read/write permission and scope enforcement at each route and object; use signed-in actor identity; add negative API authorization tests for a no-Finance employee, own-only employee, Finance and CEO. Do not rely on navigation visibility.

## D-02 — Profile activation breaks historical and future salary selection

- **Priority / status:** Critical; **confirmed from code**, monetary effect needs staging fixture.
- **Affected:** base salary for retroactive/current/future payroll runs and Wallet current salary.
- **Expected:** Finance uses the profile effective during the payroll period; a future-dated change must not retire the current salary early (`docs/NBOS/02-Modules/07-My-Company/07-Compensation-and-Policies.md:69-109`).
- **Actual:** Activation immediately archives every other active profile and overwrites `Employee.baseSalary`, regardless of the new `effectiveFrom`. Month resolution searches only `status: ACTIVE` profiles that overlap a month. A past month can no longer select its archived profile and falls back to the employee's latest salary; a future-dated profile can leave the present month without a matching active profile.
- **Evidence:** `apps/api/src/modules/compensation-profiles/compensation-profiles.service.ts:113-160`; `apps/api/src/modules/compensation-profiles/resolve-active-compensation-profile.ts:13-36`; `apps/api/src/modules/payroll-runs/payroll-runs.service.ts:158-181`; `apps/api/src/modules/employees/employee-wallet.service.ts:162-191`. Existing tests cover only activation copy and an `ACTIVE` query, not two effective periods (`apps/api/src/modules/compensation-profiles/compensation-profiles.service.test.ts:5-59`; `resolve-active-compensation-profile.test.ts:4-25`).
- **Impact:** Underpayment or overpayment of fixed salary, especially on retro runs or scheduled pay changes.
- **Staging reproduction:** Create an employee with salary A effective in month M; activate salary B effective in M+1; create M and M+1 payroll runs after activation. Compare each line's profile ID/base with A/B. Repeat with B effective in a future month while viewing the current Wallet.
- **Correction:** Resolve version history by effective interval, not current lifecycle status alone; preserve nonoverlapping historical periods; defer a future profile's effect until its start; make activation atomic and concurrency-safe; add boundary tests for month start/end, retro and future dates.

## D-03 — Removing a client payment leaves accrued sales bonus behind

- **Priority / status:** High; **confirmed from code**, exact downstream amount needs staging fixture.
- **Affected:** Sales bonus entitlement, KPI, release/Wallet after payment reversal.
- **Expected:** Refund/chargeback should result in a governed clawback/correction while preserving audit history (`docs/NBOS/03-Business-Logic/03-Bonus-Payroll-Logic.md:344-365,465-472`).
- **Actual:** On a fully paid invoice, payment creation invokes sales accrual. `PaymentsService.delete` removes the payment and resyncs invoice/order/pool, but it never invokes a sales bonus reversal or KPI refresh. `CLAWBACK` exists as a status, but no reversal call is on this delete path.
- **Evidence:** `apps/api/src/modules/finance/payments/payments.service.ts:279-295,298-313`; `apps/api/src/modules/bonus/sales-bonus-accrual.service.ts:49-66`; `packages/database/prisma/schema/finance.prisma:503-512`.
- **Impact:** Bonus can remain payable after the underlying client money is withdrawn, and the employee Wallet can overstate entitlement.
- **Staging reproduction:** Pay a disposable invoice in full, confirm a Sales `BonusEntry`, delete its only payment, then inspect the entry, release eligibility, KPI result and Wallet. Current delete path has no sales reversal step.
- **Correction:** Define a reversible, audited correction/clawback rule for unpaid and already paid bonuses; trigger it on payment reversal; recalculate affected KPI and releases; test partial and full reversals. The exact recovery policy needs [BD-04](06-BUSINESS-DECISIONS.md).

## D-04 — Removing an employee payout does not unmark paid bonus releases

- **Priority / status:** High; **confirmed from code**, live discrepancy untested.
- **Affected:** paid bonus ledger, Wallet and pool/report totals.
- **Expected:** Paid bonus state must match the expense-payment ledger after a payout is reversed.
- **Actual:** Deleting an expense payment calls salary line reconciliation. That can change a line from `PAID` to `APPROVED` or `PARTIALLY_PAID`. The reconciliation only calls `markPayrollBonusReleasesPaidForSalaryLine` when status is `PAID`; it never reverses releases already marked `PAID`. The paid-mark function writes `PAID` to all matching included releases.
- **Evidence:** `apps/api/src/modules/expenses/expenses.service.ts:236-248`; `apps/api/src/modules/payroll-runs/payroll-salary-line-ledger-sync.ts:51-78`; `apps/api/src/modules/payroll-runs/payroll-bonus-release-paid-mark.ts:11-74`; existing line test only asserts line status after all payments removed (`apps/api/src/modules/payroll-runs/payroll-salary-line-ledger-sync.test.ts:87-100`).
- **Impact:** Employee bonus ledger and pools can show paid money that is no longer recorded as paid.
- **Staging reproduction:** Approve a payroll with an included bonus, fully pay its expense, confirm release `PAID`, delete the expense payment and compare release status with salary line/expense balance.
- **Correction:** Reconcile release paid state from the actual expense ledger, including reversal; preserve an audit event and handle partial-pay attribution explicitly. Add a paid→unpaid regression test.

## D-05 — Sales policy effective date is evaluated at processing time

- **Priority / status:** High; **confirmed from code**, business difference requires policy fixture.
- **Affected:** Seller/Assistant rate on backdated or delayed client-payment entry.
- **Expected:** A rate effective for the qualifying payment is snapshotted at that event (`docs/NBOS/03-Business-Logic/03-Bonus-Payroll-Logic.md:60-65,87-90`).
- **Actual:** `runAccrual` derives earned month from invoice `paidDate`, but `loadPolicy` filters `effectiveFrom <= new Date()`. A backdated payment can select a later rate. The resulting snapshot faithfully records the wrong selected rate.
- **Evidence:** `apps/api/src/modules/bonus/sales-bonus-accrual.service.ts:133-142,196-213,239-249`; `packages/database/prisma/schema/finance.prisma:481-500`.
- **Impact:** Historical seller/assistant bonus can be over- or under-calculated when rates change between payment date and data entry.
- **Staging reproduction:** Create two policies for one `From`/payment model with different effective dates/rates; record a paid invoice dated between those dates after the second date; inspect the stored rate snapshot.
- **Correction:** Resolve policy as of the qualifying payment's authoritative date and define timezone/tie rules. Keep the selected policy version/snapshot; test delayed/backdated transactions and equal effective dates.

## D-06 — Approver identity is accepted from request bodies

- **Priority / status:** High; **confirmed from code**, scope depends on D-01 and role grants.
- **Affected:** compensation profile activation and over-funding bonus releases.
- **Expected:** The application records the authenticated approving actor, with role authorization and an independent approval step where required.
- **Actual:** Profile activation accepts `approvedById` from the body and forwards it to the service. Bonus release create/patch likewise accepts caller-supplied `approvedById`; over-funding validation checks only that it is nonempty. A caller can name another employee without that employee approving.
- **Evidence:** `apps/api/src/modules/compensation-profiles/compensation-profiles.controller.ts:40-45`; `apps/api/src/modules/compensation-profiles/compensation-profiles.service.ts:144-150`; `apps/api/src/modules/bonus/bonus.controller.ts:173-215`; `apps/api/src/modules/bonus/bonus-release.service.ts:225-237`.
- **Impact:** Approval/audit records can falsely attribute financial decisions. Missing bonus route permissions magnify exposure.
- **Staging reproduction:** As an authorized test actor, submit an over-funding release or profile activation with another employee's ID in `approvedById`; inspect persisted approver. Do not use real employee IDs.
- **Correction:** Derive actor from authenticated request, verify required approval authority, and separate proposer/approver if policy demands two people. Test spoofed IDs and audit attribution.

## D-07 — Sales accrual failure is logged but does not fail payment recording

- **Priority / status:** Medium; **confirmed from code**, frequency unverified.
- **Affected:** completeness of Sales bonus accrual following fully paid invoices.
- **Expected:** A failed downstream accrual must be recoverable and visible to Finance so an owed bonus is not silently omitted.
- **Actual:** `onInvoicePaid` catches any accrual exception and logs it, without propagating failure or queuing a retry. Payment creation then returns normally. A repair endpoint exists for KPI/payable snapshots, but it is not evidence of a general missing Sales-accrual retry.
- **Evidence:** `apps/api/src/modules/bonus/sales-bonus-accrual.service.ts:54-66`; `apps/api/src/modules/finance/payments/payments.service.ts:279-295`; `apps/api/src/modules/scheduler/scheduler-job-catalog.ts:32-37`.
- **Impact:** A confirmed client payment can have no corresponding seller bonus until detected manually.
- **Staging reproduction:** Inject a mocked accrual database error during invoice-paid handling; verify payment path returns and no bonus entry is created, then check operational alert/retry behavior.
- **Correction:** Add an idempotent retry/reconciliation mechanism or a blocking financial exception policy approved by the Owner, plus an exception queue/report and test.

## Unverified risks and requirements questions (not confirmed defects)

- **U-01 Currency:** Profile accepts currency while salary line/expense do not carry it (`packages/database/prisma/schema/compensation.prisma:77-79`; `packages/database/prisma/schema/finance.prisma:775-805`; `apps/api/src/modules/payroll-runs/payroll-materialize-expenses.ts:54-86`). Verify an actual non-AMD profile in staging; determine currency conversion/blocker policy in [BD-06](06-BUSINESS-DECISIONS.md).
- **U-02 KPI defaults:** A missing KPI result or missing plan/actual yields factor 1 (`apps/api/src/modules/bonus/bonus-payable-snapshot.ts:35-46`; `apps/api/src/modules/payroll-runs/resolve-employee-sales-kpi.ts:61-70`). Code behavior is confirmed; whether this is a defect depends on [BD-02](06-BUSINESS-DECISIONS.md).
- **U-03 Zero fixed salary:** Cap is bypassed for a base salary at or below zero (`apps/api/src/modules/payroll-runs/payroll-bonus-cap.ts:35-37`). Code behavior is confirmed; desired cap is [BD-03](06-BUSINESS-DECISIONS.md).
- **U-04 Concurrent release/payout operations:** Targeted tests use mocks, not simultaneous database transactions. Unique keys guard some duplicates, but no live race test establishes correctness of simultaneous approval, release or payment creation. Validate on an isolated staging database.
- **U-05 Partial-invoice Sales trigger:** Canon mentions first received money and a paid invoice; code waits for fully `PAID` (`apps/api/src/modules/finance/payments/payments.service.ts:279-284`). Resolve [BD-01](06-BUSINESS-DECISIONS.md) before calling it a defect.
