# Payroll audit — actual business workflows

**Audit date:** 2026-09-26. This describes paths present in source, not a completed live payroll rehearsal. Terms in plain language: _bonus entry_ is a recorded entitlement/plan; _release_ is an amount made available for payroll; _salary line_ is one employee's monthly payable record; _expense payment_ is the recorded payout.

## 1. Configure an employee

1. My Company records an employee and may set `Employee.baseSalary` (`packages/database/prisma/schema/employees.prisma:18-43`). A draft compensation profile can specify `baseSalary`, currency, payout schedule, start date and bonus/KPI policy IDs (`packages/database/prisma/schema/compensation.prisma:74-101`; `apps/api/src/modules/compensation-profiles/compensation-profiles.service.ts:31-64`).
2. The service permits edits only while the profile is `DRAFT`. Activation archives other `ACTIVE` profiles, stamps an approver/time and copies the new salary to Employee (`apps/api/src/modules/compensation-profiles/compensation-profiles.service.ts:66-160`). The activation endpoint accepts an `approvedById` from the request body (`apps/api/src/modules/compensation-profiles/compensation-profiles.controller.ts:40-45`), so approver identity is not reliably derived from the signed-in actor.
3. At payroll creation, the run seeds non-terminated employees and resolves a profile for that payroll month, falling back to `Employee.baseSalary`, then zero (`apps/api/src/modules/payroll-runs/payroll-runs.service.ts:137-186`). This path has a historical-profile defect: the resolver filters `status: ACTIVE`, excluding archived profiles that were effective in an earlier month (`apps/api/src/modules/compensation-profiles/resolve-active-compensation-profile.ts:19-36`). Future-dated activation also archives the present profile immediately. See [D-02](04-FUNCTIONAL-DEFECTS.md).

## 2. Sales activity to bonus

```text
Lead/Deal (`From`, Seller, Assistant)
  → Order → Invoice → confirmed client Payment → invoice fully PAID
  → SalesBonusPolicy lookup → BonusEntry for Seller/Assistant
  → earned-month KPI/payable snapshot → BonusRelease → payroll
```

`PaymentsService.create` saves the payment, updates invoice/order status and calls sales accrual only when the refreshed invoice is `PAID` (`apps/api/src/modules/finance/payments/payments.service.ts:233-295`). Accrual requires an order, deal and source; a free payment-mode order is excluded. A missing `From` causes a logged skip (`apps/api/src/modules/bonus/sales-bonus-accrual.service.ts:101-131`). Classic uses order total; subscription first month uses one paid month's base; subsequent subscription invoices use a separate recurring policy (`apps/api/src/modules/bonus/sales-bonus-accrual.service.ts:144-193`). Seller and assistant amounts use their independent rates, including both slots for one employee when applicable (`apps/api/src/modules/bonus/sales-bonus-accrual-rows.ts:13-41`). Entries record invoice, source, rate, base and earned-period snapshots (`apps/api/src/modules/bonus/sales-bonus-accrual.service.ts:239-266`). The lookup currently uses processing time for `effectiveFrom` rather than paid date ([D-05](04-FUNCTIONAL-DEFECTS.md)).

The code checks for prior order/invoice rows and writes with `skipDuplicates`, backed by partial unique sales indexes (`apps/api/src/modules/bonus/sales-bonus-accrual-idempotency.ts:7-53`; `apps/api/src/modules/bonus/sales-bonus-accrual-rows.ts:73-77`; `packages/database/prisma/schema/finance.prisma:586-588`). This establishes intended duplicate protection, not a proven concurrent live transaction test. A removed client payment resyncs invoice/order but has no observed sales bonus reversal ([D-03](04-FUNCTIONAL-DEFECTS.md)).

## 3. Delivery work to bonus

```text
Deal/Order → Product or Extension with team and scope
  → published core/function norms + role rates
  → first Development materializes role/employee BonusEntries
  → Done + client funding → ProductBonusPool AUTO releases
  → payroll allocation → salary line
```

Newly enrolled delivery v2 uses role units and role rates, not a percentage of order price (`docs/NBOS/03-Business-Logic/11-Delivery-Compensation-Configurator.md:86-105`). The Development transition performs readiness and materializes a plan (`apps/api/src/modules/delivery-compensation/materialize-initial-delivery-plan.ts:30-110`). Scope changes can add, remove or revise bonus allocations; release floors constrain reductions (`apps/api/src/modules/delivery-compensation/apply-scope-add-feature.ts:100-133`; `apps/api/src/modules/delivery-compensation/reduce-removed-feature-allocations.ts:17-52`). The Done/funding path allocates available received funds proportionally and creates approved releases (`apps/api/src/modules/bonus/product-bonus-pool-auto-release.ts:52-145`). `ProductBonusPool` is recomputed from entries, releases and payments (`apps/api/src/modules/bonus/product-bonus-pool-sync.ts:18-113`). Legacy products retain older rules; v2 norms and actual tariffs require Owner publication. `TODO.md:67-85,126-146` expressly records live migration/browser limitations and that real rates must not be invented.

A person may hold two compensated roles or work on multiple orders; entries remain separate by employee/order/project. Payroll collapses that work into one employee-month salary line. Department membership is a board filter, not a demonstrated pay-allocation key (`packages/database/prisma/schema/finance.prisma:530-536,775-812`; `apps/api/src/modules/payroll-runs/payroll-salary-board.ts:53-62`).

## 4. Determine what can enter payroll

Finance can create manual entries and releases, or use matrix drafts (`apps/api/src/modules/bonus/bonus.service.ts:170-215`; `apps/api/src/modules/bonus/bonus-release.service.ts:104-134`; `apps/api/src/modules/payroll-runs/payroll-bonus-allocation-materialize.ts:1-130`). For Sales, an earned-period KPI result/policy determines the payable snapshot; a manual adjustment can change the ceiling (`apps/api/src/modules/bonus/bonus-payable-snapshot.ts:22-103`). Payroll attachment applies a monthly cap based on the salary line's fixed salary and carries excess forward (`apps/api/src/modules/payroll-runs/payroll-bonus-release-attach.ts:106-245`; `apps/api/src/modules/payroll-runs/payroll-bonus-cap.ts:16-53`). When salary is zero, the cap function currently includes the entire bonus (`payroll-bonus-cap.ts:35-37`); whether that is policy is unresolved.

The release is not the same as a cash payment. It becomes `INCLUDED_IN_PAYROLL` on attachment; it is marked `PAID` only when the linked salary expense is fully paid (`apps/api/src/modules/payroll-runs/payroll-bonus-release-attach.ts:217-227`; `apps/api/src/modules/payroll-runs/payroll-bonus-release-paid-mark.ts:11-74`).

## 5. Review, approve, pay and report

1. Finance creates a monthly `DRAFT` run. There is one run per month (`packages/database/prisma/schema/finance.prisma:689-719`). The detailed matrix supports employee and order views and draft allocations; `REVIEW` locks the draft according to the canon (`docs/NBOS/02-Modules/04-Finance/05-Bonus-and-Payroll.md:687-698`).
2. `REVIEW → APPROVED` validates line/release sums, materializes drafts and creates an expense for each positive salary line in the same database transaction; a run audit row is recorded (`apps/api/src/modules/payroll-runs/payroll-runs.service.ts:219-283`; `apps/api/src/modules/payroll-runs/payroll-materialize-expenses.ts:49-91`).
3. Finance records full or partial payments on those expenses. The salary line and run totals then follow the expense-payment ledger (`apps/api/src/modules/expenses/expense-payment-create.ts:24-113`; `apps/api/src/modules/payroll-runs/payroll-salary-line-ledger-sync.ts:30-79`). `PAYING → CLOSED` requires every positive line to be `PAID` or `HELD` (`apps/api/src/modules/payroll-runs/payroll-run-close-validation.ts:4-31`).
4. Salary Board, the employee Wallet and a payroll report read the resulting state. Wallet month detail verifies that the salary line belongs to the signed-in employee (`apps/api/src/modules/employees/employee-wallet.service.ts:68-83`). Payroll report aggregates run totals and expense payments, but its own notes say department comparisons and scheduled payroll packets remain future work (`apps/api/src/modules/finance/reports/payroll-report.service.ts:15-20,22-60`).

## When facts change later

| Change                                       | Observed effect                                                                   | Limit                                                                                               |
| -------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| New compensation profile                     | Old `ACTIVE` profile archived and Employee fallback overwritten                   | Historical/future periods can select the wrong salary ([D-02](04-FUNCTIONAL-DEFECTS.md)).           |
| Another qualifying paid subscription invoice | Separate recurring-policy accrual, subject to invoice/employee duplicate check    | Current policy-rate timing uses processing date.                                                    |
| Delivery scope/team change after plan        | Revision/allocation code updates entries with accepted/released floor constraints | Live end-to-end effect not exercised.                                                               |
| Client payment deleted                       | Invoice/order and product pool resynced                                           | No sales clawback/reversal observed ([D-03](04-FUNCTIONAL-DEFECTS.md)).                             |
| Employee expense payment deleted             | Salary paid/remaining/status recalculated                                         | Already `PAID` bonus releases stay paid ([D-04](04-FUNCTIONAL-DEFECTS.md)).                         |
| KPI/payment facts change after snapshot      | Event refresh and manual repair code exist                                        | Reconciliation of an already approved/paid payroll was not established; test in staging before use. |

There is no evidence from this read-only audit that a scheduler automatically creates payroll runs, executes employee bank transfers, computes tax withholding, or produces employee payslips. The documented process is manual Finance approval and payment recording; those other capabilities require explicit Product Owner decisions before being treated as release requirements.
