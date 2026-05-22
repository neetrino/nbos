import type { BonusStatusEnum } from '@nbos/database';
import type { CompensationPayoutPhase } from '../payroll-runs/compensation-payout-phase';

import type { EmployeeWalletActivityItem } from './employee-wallet-activity';
import type { WalletBonusPipelineGroup } from './employee-wallet-bonus-group';
import type { EmployeeWalletProjectBreakdownRow } from './employee-wallet-project-breakdown';

export interface EmployeeWalletBonusRow {
  id: string;
  type: string;
  status: BonusStatusEnum;
  walletGroup: WalletBonusPipelineGroup;
  /** Planned accrual on the bonus entry (NBOS). */
  amount: string;
  percent: string;
  /** Sum of release amounts in APPROVED / INCLUDED_IN_PAYROLL / PAID. */
  releasedAmount: string;
  /** Sum of release amounts in PAID. */
  paidAmount: string;
  /** Planned minus paid releases, floored at zero. */
  remainingAmount: string;
  /** Payroll month when a release is on a run (latest qualifying). */
  payrollMonth: string | null;
  /** Sum of persisted SALES KPI burned on releases for this entry. */
  kpiBurnedAmount: string | null;
  payrollCarryOverAmount: string | null;
  orderPaymentType: string | null;
  salesAccrualHint: string | null;
  /** Product name, extension label, or order fallback (same source as project breakdown pool). */
  productLabel: string;
  project: { code: string; name: string };
  order: { code: string };
  createdAt: string;
}

export interface EmployeeWalletSalaryRow {
  id: string;
  payrollRunId: string;
  payrollMonth: string;
  payoutPhase: CompensationPayoutPhase;
  runStatus: string;
  baseSalary: string;
  bonusesTotal: string;
  totalPayable: string;
  paidAmount: string;
  remainingAmount: string;
  lineStatus: string;
  expenseId: string | null;
}

export interface EmployeeWalletNextPayroll {
  salaryLineId: string;
  payrollRunId: string;
  payrollMonth: string;
  runStatus: string;
  baseSalary: string;
  bonusesTotal: string;
  adjustmentsTotal: string;
  deductionsTotal: string;
  totalPayable: string;
  paidAmount: string;
  remainingAmount: string;
  lineStatus: string;
  expenseId: string | null;
  /** Expense outgoing payments linked to this salary line (partial payout dates). */
  partialPayments: Array<{ paymentDate: string; amount: string }>;
}

export interface EmployeeWalletSnapshot {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    position: string | null;
    level: string | null;
    baseSalary: string | null;
    roleName: string;
  };
  bonuses: EmployeeWalletBonusRow[];
  /** Nearest open payroll run that includes this employee (NBOS Next Payroll). */
  nextPayroll: EmployeeWalletNextPayroll | null;
  /** Per-order bonus roll-up + product pool funding (NBOS §5). */
  projectBreakdown: EmployeeWalletProjectBreakdownRow[];
  /** Read-only timeline derived from bonus releases, salary payments, closed payrolls. */
  activity: EmployeeWalletActivityItem[];
  salaryHistory: EmployeeWalletSalaryRow[];
}

export type { EmployeeWalletActivityItem } from './employee-wallet-activity';
