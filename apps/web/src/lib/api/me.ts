import { api } from '../api';

export type WalletBonusPipelineGroup =
  | 'POTENTIAL'
  | 'IN_PROGRESS'
  | 'NEXT_PAYROLL'
  | 'PAID'
  | 'CORRECTIONS';

export interface EmployeeWalletBonusRow {
  id: string;
  type: string;
  status: string;
  walletGroup: WalletBonusPipelineGroup;
  /** Planned amount on the bonus entry. */
  amount: string;
  percent: string;
  releasedAmount: string;
  paidAmount: string;
  remainingAmount: string;
  payrollMonth: string | null;
  orderPaymentType: string | null;
  salesAccrualHint: string | null;
  /** Product / extension scope for this order (from bonus pool). */
  productLabel: string;
  project: { code: string; name: string };
  order: { code: string };
  createdAt: string;
}

export interface EmployeeWalletSalaryRow {
  id: string;
  payrollRunId: string;
  payrollMonth: string;
  runStatus: string;
  baseSalary: string;
  bonusesTotal: string;
  totalPayable: string;
  paidAmount: string;
  remainingAmount: string;
  lineStatus: string;
  expenseId: string | null;
}

export interface EmployeeWalletProjectBreakdownRow {
  orderId: string;
  projectId: string;
  project: { code: string; name: string };
  order: { code: string };
  productLabel: string;
  bonusTypesSummary: string;
  plannedBonus: string;
  releasedBonus: string;
  paidBonus: string;
  remainingBonus: string;
  fundingStatusLabels: string[];
  poolAvailableFunding: string | null;
  poolOverFunding: string | null;
  entryStatusesSummary: string;
  payoutState: 'UNPAID' | 'PARTIAL' | 'PAID';
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
  nextPayroll: EmployeeWalletNextPayroll | null;
  projectBreakdown: EmployeeWalletProjectBreakdownRow[];
  salaryHistory: EmployeeWalletSalaryRow[];
}

export const meApi = {
  async getWallet(): Promise<EmployeeWalletSnapshot> {
    const resp = await api.get<EmployeeWalletSnapshot>('/api/me/wallet');
    return resp.data;
  },
};
