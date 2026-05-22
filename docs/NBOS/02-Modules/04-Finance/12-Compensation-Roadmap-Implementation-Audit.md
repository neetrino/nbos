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

**Decision:** MVP does **not** require new DB columns for employee×month UX. Remaining gaps are **policy engine** (cap/carry-over automation, burned KPI line items) — show as copy/hints until engine ships.

## Web routes (canon)

| Screen       | Path                                          |
| ------------ | --------------------------------------------- |
| Salary board | `/finance/salary`                             |
| Bonus board  | `/finance/bonuses` (legacy `/bonus` redirect) |
| Bonus pools  | `/finance/bonus-pools`                        |
| Pay Now      | `/finance/expenses` (+ payroll preset query)  |
| Wallet       | `/my-account/wallet`                          |

## Tests (automated)

- API: `payroll-salary-line-ledger-sync`, `sales-kpi-payroll-payout`, `payroll-salary-board`, `expense-payroll-list-scope`, `employee-wallet`
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

Tracked in repo root [`todo.md`](../../../../todo.md) (single remaining-work list). Summary:

- **Policy engine:** cap, carry-over, burned KPI ledger + month/wallet explanations.
- **Product decisions:** wallet sheet variant, forecast scope, burned KPI display, Pay Now default.
- **UX gaps:** bonus pool employee breakdown, salary department filter, manual QA checklist.
- **My Company:** versioned Compensation Profile + universal Bonus/KPI policies ([`06-My-Company-Cleanup-Register`](../07-My-Company/06-My-Company-Cleanup-Register.md) C1–C3).
- Re-audit payloads when compensation profile schema changes.
