# Compensation roadmap — implementation audit (2026-05)

Working roadmap: repository root `todo.md`. This document closes **Phase 1 audit** items and records **residual policy-engine** work.

## Canonical flow (verified)

```text
PayrollRun → SalaryLine → (APPROVED) → Expense → ExpensePayment → syncSalaryLinePaidFromExpenseLedger → SalaryLine status/paid/remaining + PayrollRun totals
```

| Step                            | Implementation                                                                                                          |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Materialize expense on approval | `payroll-runs` approval path sets `SalaryLine.expenseId`                                                                |
| Pay Now                         | `GET /expenses` with `payrollLinked`, `payrollMonth`, `payrollEmployeeId`; `linkedPayrollRun` on rows                   |
| Payment                         | `expense-payment-create` → `syncSalaryLinePaidFromExpenseLedger`                                                        |
| Partial / full                  | `resolveSalaryLineStatus` → `APPROVED` / `PARTIALLY_PAID` / `PAID` (tests in `payroll-salary-line-ledger-sync.test.ts`) |
| Bonus paid mark                 | `markPayrollBonusReleasesPaidForSalaryLine` when line `PAID`                                                            |

## DTOs (no new persisted fields required for MVP UX)

| Surface            | Type / route                                                    | Notes                                                         |
| ------------------ | --------------------------------------------------------------- | ------------------------------------------------------------- |
| Finance month card | `SalaryLineMonthDetailDto`                                      | `GET /api/payroll-runs/salary-lines/:id/month-detail`         |
| Wallet month       | Same DTO via `GET /api/me/wallet/salary-lines/:id/month-detail` | Read-only scope in web                                        |
| Wallet snapshot    | `EmployeeWalletSnapshot`                                        | `salaryHistory`, `bonuses`, `nextPayroll`, `projectBreakdown` |
| Salary board cell  | `SalaryBoardCell`                                               | Includes `payoutPhase`, line amounts                          |
| Pay Now payroll    | Expense list + `linkedPayrollRun`                               | Filters in `expense-payroll-list-scope`                       |

**Decision:** Employee×month UX uses existing payroll/bonus DTOs plus policy-engine fields below (no separate ledger table for MVP).

## Web routes (canon)

| Screen       | Path                                          |
| ------------ | --------------------------------------------- |
| Salary board | `/finance/salary`                             |
| Bonus board  | `/finance/bonuses` (legacy `/bonus` redirect) |
| Bonus pools  | `/finance/bonus-pools`                        |
| Pay Now      | `/finance/expenses` (+ payroll preset query)  |
| Wallet       | `/my-account/wallet`                          |

## Policy engine (2026-05 re-audit)

| Area                            | Shipped | Notes                                                                                                                               |
| ------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `bonus_policies` + profile FK   | Yes     | Seeded: `SALES_COMPANY_RATES`, `MANUAL_ONLY`, `DELIVERY_PROPORTIONAL_FUNDING`, `MARKETING_MANUAL_PLANNED`, `SUPPORT_MANUAL_PLANNED` |
| `kpi_policies` + cap multiplier | Yes     | Gate bands + `bonusCapBaseSalaryMultiplier` (1–3×) on payroll SALES attach                                                          |
| Sales accrual                   | Yes     | Invoice paid → `SalesBonusAccrualService`; idempotent `sales_accrual_invoice_id`                                                    |
| Delivery pool funding           | Yes     | `syncProductBonusPoolForOrder` + proportional AUTO when Done + funded                                                               |
| Payroll attach                  | Yes     | SALES KPI (run + per-employee line), cap, `kpiBurnedAmount`, carry FIFO + detach reversal                                           |
| Month / wallet breakdown        | Yes     | `policyBreakdownStatuses`, `employeeSalesKpi`, burned/carry columns                                                                 |

### API (compensation / policy)

| Route                                                        | Purpose                                                             |
| ------------------------------------------------------------ | ------------------------------------------------------------------- |
| `GET/POST/PATCH /api/bonus-policies`                         | List, create, update bonus policy bundles                           |
| `GET/POST/PATCH /api/compensation-profiles`                  | Profile versions + `bonusPolicyId` / `kpiPolicyId`                  |
| `GET/POST/PATCH /api/kpi-policies`                           | KPI gate templates                                                  |
| `GET /api/payroll-runs/:id`                                  | Run detail + scorecard metrics + payment KPI hints (run + per line) |
| `PATCH /api/payroll-runs/:id`                                | Run-level sales KPI plan/actual                                     |
| `PATCH /api/payroll-runs/:id/salary-lines/:lineId/sales-kpi` | Per-employee sales KPI override                                     |
| `GET /api/payroll-runs/salary-lines/:id/month-detail`        | Month sheet + `employeeSalesKpi` + breakdown                        |

### Residual (canon backlog)

- Manual bonus create UI on `/finance/bonuses` (`POST /api/bonus`) — marketing/support until KPI accrual rules ship.
- Bonus policy template parameters beyond name/notes (per-template config UI).
- KPI scorecard metrics per non-sales role (sales plan/actual links ship on `kpi_policies`).

## Tests (automated)

- API: `payroll-salary-line-ledger-sync`, `sales-kpi-payroll-payout`, `sales-bonus-accrual`, `payroll-bonus-release-attach`, `resolve-employee-sales-kpi`, `product-bonus-pool-sync`, `product-bonus-pool-auto-release`, `payroll-salary-board`, `expense-payroll-list-scope`, `employee-wallet`
- Web: `salary-board-filtered-totals`, `bonus-board-grouping`, `export-salary-board-csv`, `sales-kpi-gate-summary`, `bonus-board-url`

## Manual visual QA checklist (Bitrix parity)

Use after deploy or large UX change:

1. **Salary board** — open employee×month sheet: fix, bonuses, payable, paid, remaining, bonus list by project.
2. **Partial pay** — Pay Now → expense → record payment → sheet and board show updated paid/remaining.
3. **Full pay** — line status `PAID`; payroll run totals updated.
4. **Bonus board** — release ledger; Early/Extra/Over funding badges; payroll month grouping.
5. **Wallet** — read-only month sheet; no Finance edit links.
6. **Payroll run** — attach/detach bonus releases; link to Pay Now preset.

## Follow-up (out of MVP roadmap closure)

Tracked in repo root [`todo.md`](../../../../todo.md). Summary:

- **Policy engine:** company anchor order for planned bonuses; per-template rates in admin UI.
- **KPI:** `KPI Plan` / `KPI Result` entities; automated targets beyond prior-month + payment hints.
- **Notifications:** separate mobile/web push channel (in-app wallet notify ships for KPI + carry).
- **Ops:** manual visual QA checklist (§ above); staging deploy smoke.
- **My Company:** employee overrides + policy audit trail ([`06-My-Company-Cleanup-Register`](../07-My-Company/06-My-Company-Cleanup-Register.md) C1–C3).
