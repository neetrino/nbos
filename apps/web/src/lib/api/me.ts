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
  amount: string;
  percent: string;
  project: { code: string; name: string };
  order: { code: string };
  createdAt: string;
}

export interface EmployeeWalletSalaryRow {
  id: string;
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
  salaryHistory: EmployeeWalletSalaryRow[];
}

export const meApi = {
  async getWallet(): Promise<EmployeeWalletSnapshot> {
    const resp = await api.get<EmployeeWalletSnapshot>('/api/me/wallet');
    return resp.data;
  },
};
