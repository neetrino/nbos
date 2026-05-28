import { api } from '../api';

export type PayrollMatrixViewMode = 'EMPLOYEE_MATRIX' | 'ORDER_MATRIX';

export type PayrollMatrixCellState =
  | 'UNLINKED'
  | 'LINKED_EMPTY'
  | 'RELEASE_SET'
  | 'MANUAL'
  | 'EXTRA_BONUS'
  | 'OVER_FUNDING'
  | 'INVALID';

export type DeliveryPayableUnit = {
  orderId: string;
  orderCode: string;
  orderType: 'PRODUCT' | 'EXTENSION';
  projectId: string;
  projectCode: string;
  label: string;
  productId: string | null;
  extensionId: string | null;
  deliveryOpen: boolean;
  totalPlannedBonus: string;
  totalReleasedBonus: string;
  totalPaidBonus: string;
  totalRemainingBonus: string;
  availableFunding: string;
  overFundingAmount: string;
  inclusionReason: string;
};

export type PayrollAllocationMatrixEmployee = {
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

export type PayrollAllocationMatrix = {
  payrollRunId: string;
  payrollMonth: string;
  status: string;
  editable: boolean;
  employees: PayrollAllocationMatrixEmployee[];
  deliveryUnits: DeliveryPayableUnit[];
  cells: PayrollAllocationMatrixCell[];
  layout: {
    viewMode: PayrollMatrixViewMode;
    rowOrder: string[];
    columnOrder: string[];
    pinnedUnitIds: string[];
  };
  totals: {
    totalBaseSalary: string;
    totalBonuses: string;
    totalPayable: string;
    totalPaid: string;
    totalRemaining: string;
  };
};

export const payrollAllocationMatrixApi = {
  async get(
    payrollRunId: string,
    viewMode: PayrollMatrixViewMode = 'EMPLOYEE_MATRIX',
  ): Promise<PayrollAllocationMatrix> {
    const resp = await api.get<PayrollAllocationMatrix>(
      `/api/payroll-runs/${payrollRunId}/allocation-matrix`,
      { params: { viewMode } },
    );
    return resp.data;
  },

  async patchLayout(
    payrollRunId: string,
    body: {
      viewMode: PayrollMatrixViewMode;
      rowOrder?: string[];
      columnOrder?: string[];
      pinnedUnitIds?: string[];
    },
  ): Promise<PayrollAllocationMatrix> {
    const resp = await api.patch<PayrollAllocationMatrix>(
      `/api/payroll-runs/${payrollRunId}/allocation-matrix/layout`,
      body,
    );
    return resp.data;
  },

  async patchCell(
    payrollRunId: string,
    body: {
      employeeId: string;
      orderId: string;
      releaseThisMonth: string;
      reason?: string;
    },
  ): Promise<PayrollAllocationMatrix> {
    const resp = await api.patch<PayrollAllocationMatrix>(
      `/api/payroll-runs/${payrollRunId}/allocation-matrix/cells`,
      body,
    );
    return resp.data;
  },

  async createManualBonus(
    payrollRunId: string,
    body: {
      employeeId: string;
      orderId: string;
      title: string;
      amount: string;
      reason: string;
    },
  ): Promise<PayrollAllocationMatrix> {
    const resp = await api.post<PayrollAllocationMatrix>(
      `/api/payroll-runs/${payrollRunId}/allocation-matrix/manual-bonus`,
      body,
    );
    return resp.data;
  },
};
