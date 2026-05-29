import { api } from '../api';
import type { PayrollAllocationMatrixCell } from './payroll-allocation-matrix';
import type { PayrollRunStatus } from './payroll-runs';

export type PayrollEmployeeBonusHistoryMonth = {
  payrollMonth: string;
  payrollRunId: string | null;
  runStatus: PayrollRunStatus | null;
  isFocusMonth: boolean;
  monthBonusTotal: string;
  readOnly: boolean;
};

export type PayrollEmployeeBonusHistoryProject = {
  orderId: string;
  projectId: string;
  projectCode: string;
  label: string;
  deliveryOpen: boolean;
  totalPlannedBonus: string;
  totalReleasedBonus: string;
  totalPaidBonus: string;
  totalRemainingBonus: string;
  availableFunding: string;
  monthAmounts: (string | null)[];
  focusCell: PayrollAllocationMatrixCell | null;
};

export type PayrollEmployeeBonusHistoryEmployee = {
  employeeId: string;
  firstName: string;
  lastName: string;
  position: string | null;
  salaryLineId: string | null;
  bonusTotalThisRun: string;
};

export type PayrollEmployeeBonusHistory = {
  payrollRunId: string;
  payrollMonth: string;
  runStatus: PayrollRunStatus;
  editable: boolean;
  payrollMonthFrom: string;
  payrollMonthTo: string;
  months: PayrollEmployeeBonusHistoryMonth[];
  employees: PayrollEmployeeBonusHistoryEmployee[];
  selectedEmployeeId: string;
  projects: PayrollEmployeeBonusHistoryProject[];
};

export const payrollEmployeeBonusHistoryApi = {
  async get(payrollRunId: string, employeeId?: string): Promise<PayrollEmployeeBonusHistory> {
    const resp = await api.get<PayrollEmployeeBonusHistory>(
      `/api/payroll-runs/${payrollRunId}/employee-bonus-history`,
      { params: employeeId ? { employeeId } : undefined },
    );
    return resp.data;
  },
};
