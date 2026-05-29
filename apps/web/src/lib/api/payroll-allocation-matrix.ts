import { api } from '../api';

export type PayrollMatrixViewMode = 'EMPLOYEE_MATRIX' | 'ORDER_MATRIX';

export type PayrollMatrixCellState =
  | 'UNLINKED'
  | 'LINKED_EMPTY'
  | 'READY'
  | 'PARTIALLY_FUNDED'
  | 'PROGRESS'
  | 'MANUAL_BONUS'
  | 'RELEASE_SET'
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
  bonusTitle: string | null;
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

export type PayrollMatrixValidationIssue = {
  code: string;
  message: string;
  releaseId?: string;
  employeeId?: string;
  orderId?: string;
};

export const payrollAllocationMatrixApi = {
  async getValidation(payrollRunId: string): Promise<{ issues: PayrollMatrixValidationIssue[] }> {
    const resp = await api.get<{ issues: PayrollMatrixValidationIssue[] }>(
      `/api/payroll-runs/${payrollRunId}/allocation-matrix/validation`,
    );
    return resp.data;
  },

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

  async reassignRecipient(
    payrollRunId: string,
    body: {
      fromEmployeeId: string;
      orderId: string;
      toEmployeeId: string;
      reason: string;
    },
  ): Promise<PayrollAllocationMatrix> {
    const resp = await api.patch<PayrollAllocationMatrix>(
      `/api/payroll-runs/${payrollRunId}/allocation-matrix/reassign-recipient`,
      body,
    );
    return resp.data;
  },

  async resetLayout(
    payrollRunId: string,
    viewMode: PayrollMatrixViewMode,
  ): Promise<PayrollAllocationMatrix> {
    const resp = await api.post<PayrollAllocationMatrix>(
      `/api/payroll-runs/${payrollRunId}/allocation-matrix/layout/reset`,
      { viewMode },
    );
    return resp.data;
  },

  async patchPlannedBonus(
    payrollRunId: string,
    body: {
      employeeId: string;
      orderId: string;
      amount: string;
      title?: string;
      reason: string;
    },
  ): Promise<PayrollAllocationMatrix> {
    const resp = await api.patch<PayrollAllocationMatrix>(
      `/api/payroll-runs/${payrollRunId}/allocation-matrix/planned-bonus`,
      body,
    );
    return resp.data;
  },
};
