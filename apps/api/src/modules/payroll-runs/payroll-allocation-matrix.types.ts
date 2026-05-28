import type { PayrollMatrixViewModeEnum, PayrollRunStatusEnum } from '@nbos/database';
import type { DeliveryPayableUnitDto } from './delivery-payable-unit.types';

export type PayrollMatrixCellState =
  | 'UNLINKED'
  | 'LINKED_EMPTY'
  | 'RELEASE_SET'
  | 'MANUAL'
  | 'EXTRA_BONUS'
  | 'OVER_FUNDING'
  | 'INVALID';

export type PayrollAllocationMatrixEmployeeRow = {
  employeeId: string;
  firstName: string;
  lastName: string;
  position: string | null;
  baseSalary: string;
  salaryLineId: string | null;
  bonusTotalThisRun: string;
  payableTotal: string;
};

export type PayrollAllocationMatrixCell = {
  employeeId: string;
  orderId: string;
  state: PayrollMatrixCellState;
  linked: boolean;
  bonusEntryId: string | null;
  bonusReleaseId: string | null;
  plannedAmount: string;
  originalAmount: string | null;
  currentAmount: string;
  releasedBefore: string;
  paidBefore: string;
  remaining: string;
  suggestedThisMonth: string;
  releaseThisMonth: string;
  warning: string | null;
  reasonRequired: boolean;
  editable: boolean;
};

export type PayrollAllocationMatrixLayoutDto = {
  viewMode: PayrollMatrixViewModeEnum;
  rowOrder: string[];
  columnOrder: string[];
  pinnedUnitIds: string[];
};

export type PayrollAllocationMatrixDto = {
  payrollRunId: string;
  payrollMonth: string;
  status: PayrollRunStatusEnum;
  editable: boolean;
  employees: PayrollAllocationMatrixEmployeeRow[];
  deliveryUnits: DeliveryPayableUnitDto[];
  cells: PayrollAllocationMatrixCell[];
  layout: PayrollAllocationMatrixLayoutDto;
  totals: {
    totalBaseSalary: string;
    totalBonuses: string;
    totalPayable: string;
    totalPaid: string;
    totalRemaining: string;
  };
};

export type PatchPayrollMatrixLayoutBody = {
  viewMode: PayrollMatrixViewModeEnum;
  rowOrder?: string[];
  columnOrder?: string[];
  pinnedUnitIds?: string[];
};

export type PatchPayrollMatrixCellBody = {
  employeeId: string;
  orderId: string;
  releaseThisMonth: string;
  reason?: string;
};

export type CreatePayrollMatrixManualBonusBody = {
  employeeId: string;
  orderId: string;
  title: string;
  amount: string;
  reason: string;
};
