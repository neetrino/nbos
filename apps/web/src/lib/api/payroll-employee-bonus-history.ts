import { api } from '../api';
import type { DeliveryPayableUnit } from './payroll-allocation-matrix';
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

export type PayrollEmployeeBonusHistoryMeta = {
  payrollRunId: string;
  payrollMonth: string;
  runStatus: PayrollRunStatus;
  editable: boolean;
  payrollMonthFrom: string;
  payrollMonthTo: string;
  months: Omit<PayrollEmployeeBonusHistoryMonth, 'monthBonusTotal'>[];
  employees: PayrollEmployeeBonusHistoryEmployee[];
  deliveryUnits: DeliveryPayableUnit[];
};

export type PayrollEmployeeBonusHistorySlice = {
  employeeId: string;
  months: Array<{ payrollMonth: string; monthBonusTotal: string }>;
  projects: Array<
    Omit<PayrollEmployeeBonusHistoryProject, 'focusCell' | 'monthAmounts'> & {
      monthAmounts: (string | null)[];
    }
  >;
};

export const payrollEmployeeBonusHistoryApi = {
  async getMeta(payrollRunId: string): Promise<PayrollEmployeeBonusHistoryMeta> {
    const resp = await api.get<PayrollEmployeeBonusHistoryMeta>(
      `/api/payroll-runs/${payrollRunId}/employee-bonus-history/meta`,
    );
    return resp.data;
  },

  async getSlice(
    payrollRunId: string,
    employeeId: string,
  ): Promise<PayrollEmployeeBonusHistorySlice> {
    const resp = await api.get<PayrollEmployeeBonusHistorySlice>(
      `/api/payroll-runs/${payrollRunId}/employee-bonus-history/slice`,
      { params: { employeeId } },
    );
    return resp.data;
  },
};
