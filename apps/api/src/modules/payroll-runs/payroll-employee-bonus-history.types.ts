import type { PayrollRunStatusEnum } from '@nbos/database';
import type { PayrollAllocationMatrixCell } from './payroll-allocation-matrix.types';

/** Rolling month window ending on the focus payroll run month (inclusive). */
export const PAYROLL_EMPLOYEE_BONUS_HISTORY_MONTH_COUNT = 12;

export type PayrollEmployeeBonusHistoryMonthDto = {
  payrollMonth: string;
  payrollRunId: string | null;
  runStatus: PayrollRunStatusEnum | null;
  /** True for the payroll run page being viewed. */
  isFocusMonth: boolean;
  /** Sum of bonus amounts for this employee across projects in this month. */
  monthBonusTotal: string;
  /** Closed or approved+ — historical cells are read-only. */
  readOnly: boolean;
};

export type PayrollEmployeeBonusHistoryProjectDto = {
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
  /** One entry per month in `months` (same order). */
  monthAmounts: (string | null)[];
  /** Full matrix cell for the focus month when present (editable when run is DRAFT). */
  focusCell: PayrollAllocationMatrixCell | null;
};

export type PayrollEmployeeBonusHistoryEmployeeDto = {
  employeeId: string;
  firstName: string;
  lastName: string;
  position: string | null;
  salaryLineId: string | null;
  bonusTotalThisRun: string;
};

export type PayrollEmployeeBonusHistoryDto = {
  payrollRunId: string;
  payrollMonth: string;
  runStatus: PayrollRunStatusEnum;
  editable: boolean;
  payrollMonthFrom: string;
  payrollMonthTo: string;
  months: PayrollEmployeeBonusHistoryMonthDto[];
  employees: PayrollEmployeeBonusHistoryEmployeeDto[];
  selectedEmployeeId: string;
  projects: PayrollEmployeeBonusHistoryProjectDto[];
};
