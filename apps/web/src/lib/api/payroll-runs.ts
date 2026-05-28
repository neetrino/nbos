import { api } from '../api';
import type { ListData } from './finance-common';

export type PayrollRunStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PAYING' | 'CLOSED';

export type PayrollJournalKind = 'CREATED' | 'APPROVED' | 'CLOSED';

export interface PayrollJournalEntry {
  kind: PayrollJournalKind;
  at: string;
  actorEmployeeId: string | null;
  actorName: string | null;
  summary: string;
}

export interface PayrollAuditTrailRow {
  id: string;
  action: string;
  createdAt: string;
  changes: unknown;
  actor: { id: string; firstName: string; lastName: string };
}

export type SalaryLineStatus = 'PENDING' | 'APPROVED' | 'PARTIALLY_PAID' | 'PAID' | 'HELD';

export type EmployeeSalesKpiSource = 'KPI_RESULT' | 'NO_KPI_POLICY' | 'NOT_SYNCED';

export interface SalaryBoardSalesKpiSummary {
  earnedPeriod: string;
  source: EmployeeSalesKpiSource;
  planAmount: string | null;
  actualAmount: string | null;
  attainmentPct: string | null;
  payoutFactorPct: string | null;
}

export interface SalaryBoardCell {
  salaryLineId: string;
  payrollRunId: string;
  payrollMonth: string;
  runStatus: PayrollRunStatus;
  lineStatus: SalaryLineStatus;
  payoutPhase: CompensationPayoutPhase;
  totalPayable: string;
  paidAmount: string;
  remainingAmount: string;
  salesKpiSummary?: SalaryBoardSalesKpiSummary;
}

export interface SalaryBoardColumn {
  payrollMonth: string;
  payrollRunId: string | null;
  runStatus: PayrollRunStatus | null;
}

export interface SalaryBoardRow {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    position: string | null;
    departmentIds: string[];
    primaryDepartmentId: string | null;
  };
  cells: (SalaryBoardCell | null)[];
}

export interface SalaryBoardResponse {
  payrollMonthFrom: string;
  payrollMonthTo: string;
  months: string[];
  columns: SalaryBoardColumn[];
  rows: SalaryBoardRow[];
}

export interface PayrollRunListRow {
  id: string;
  payrollMonth: string;
  status: PayrollRunStatus;
  totalBaseSalary: string;
  totalBonuses: string;
  totalAdjustments: string;
  totalDeductions: string;
  totalPayable: string;
  totalPaid: string;
  createdAt: string;
  updatedAt: string;
  _count: { salaryLines: number };
  /** Salary lines with `expense_id` set (materialized expense cards). */
  materializedExpenseLineCount: number;
}

export interface PayrollRunEmployeeRef {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface SalaryLineExpenseRef {
  id: string;
  name: string;
  amount: string;
  status: string;
}

export interface SalaryLineRow {
  id: string;
  payrollRunId: string;
  employeeId: string;
  baseSalary: string;
  bonusesTotal: string;
  adjustmentsTotal: string;
  deductionsTotal: string;
  totalPayable: string;
  paidAmount: string;
  remainingAmount: string;
  status: SalaryLineStatus;
  expenseId: string | null;
  createdAt: string;
  updatedAt: string;
  employee: PayrollRunEmployeeRef;
  expense: SalaryLineExpenseRef | null;
}

export interface PayrollRunDetail extends PayrollRunListRow {
  salaryLines: SalaryLineRow[];
  createdBy: { id: string; firstName: string; lastName: string } | null;
  approvedBy: { id: string; firstName: string; lastName: string } | null;
  approvedAt: string | null;
  closedAt: string | null;
  /** Bonus releases currently INCLUDED_IN_PAYROLL on this run (KPI inputs locked until detached). */
  includedBonusReleaseCount: number;
  /** Read-only milestones from run timestamps (no intermediate status audit yet). */
  journal: PayrollJournalEntry[];
  /** Audit log rows for this run (`CREATED`, `STATUS_CHANGED`, …). */
  auditTrail: PayrollAuditTrailRow[];
}

export interface EmployeeSalesKpiDetail {
  planAmount: string | null;
  actualAmount: string | null;
  attainmentPct: string | null;
  payoutFactor: string | null;
  source: EmployeeSalesKpiSource;
  effectivePayoutScaleLabel: string | null;
}

export interface PayrollRunListParams {
  page?: number;
  pageSize?: number;
  status?: string;
  payrollMonthFrom?: string;
  payrollMonthTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export type SalaryBoardParams = Pick<PayrollRunListParams, 'payrollMonthFrom' | 'payrollMonthTo'>;

export type CompensationPayoutPhase = 'past_paid' | 'active_payout' | 'accumulating';

export interface SalaryLineMonthPaymentRow {
  id: string;
  amount: string;
  paymentDate: string;
  notes: string | null;
}

export type BonusPolicyBreakdownStatus = 'INCOMING' | 'BURNED' | 'CARRY_OVER' | 'CLAWBACK';

export interface BonusBreakdownSummary {
  incomingCount: number;
  burnedTotal: string;
  carryOverTotal: string;
  clawbackCount: number;
}

export interface SalaryLineMonthBonusRow {
  bonusEntryId: string;
  bonusReleaseId: string;
  entryStatus: string;
  policyBreakdownStatuses: BonusPolicyBreakdownStatus[];
  type: string;
  releaseType: string;
  releaseStatus: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  orderCode: string;
  productLabel: string;
  plannedAmount: string;
  earnedPeriod: string | null;
  fullAmount: string | null;
  payableAmount: string | null;
  kpiPayoutFactorPct: string | null;
  releaseAmount: string;
  includedAmount: string | null;
  kpiBurnedAmount: string | null;
  kpiBurnedReason: string | null;
  payrollCarryOverAmount: string | null;
  paidAmount: string;
  remainingAmount: string;
  reason: string | null;
}

export interface SalaryLineMonthDetail {
  payoutPhase: CompensationPayoutPhase;
  pendingPayrollCarryOver: string | null;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    position: string | null;
  };
  payrollMonth: string;
  payrollRun: {
    id: string;
    status: PayrollRunStatus;
  };
  hasKpiPolicy: boolean;
  earnedPeriod: string | null;
  employeeSalesKpi: EmployeeSalesKpiDetail;
  salaryLine: {
    id: string;
    status: SalaryLineStatus;
    baseSalary: string;
    bonusesTotal: string;
    payrollCarryAppliedAmount: string | null;
    adjustmentsTotal: string;
    deductionsTotal: string;
    totalPayable: string;
    paidAmount: string;
    remainingAmount: string;
    compensationProfileId: string | null;
  };
  expense: {
    id: string;
    name: string;
    amount: string;
    status: string;
    paymentStatus: string;
    paidAmount: string;
    remainingAmount: string;
    payments: SalaryLineMonthPaymentRow[];
  } | null;
  bonusBreakdownSummary: BonusBreakdownSummary;
  bonusBreakdown: SalaryLineMonthBonusRow[];
}

export interface PayrollRunStats {
  runCount: number;
  totals: {
    totalBaseSalary: string;
    totalBonuses: string;
    totalAdjustments: string;
    totalDeductions: string;
    totalPayable: string;
    totalPaid: string;
    totalRemaining: string;
  };
  byStatus: Array<{
    status: PayrollRunStatus;
    runCount: number;
    totalPayable: string;
    totalPaid: string;
    totalRemaining: string;
  }>;
}

export type PayrollRunStatsParams = Pick<
  PayrollRunListParams,
  'status' | 'payrollMonthFrom' | 'payrollMonthTo'
>;

export const payrollRunsApi = {
  async getAll(params?: PayrollRunListParams): Promise<ListData<PayrollRunListRow>> {
    const resp = await api.get<ListData<PayrollRunListRow>>('/api/payroll-runs', { params });
    return resp.data;
  },

  async getStats(params?: PayrollRunStatsParams): Promise<PayrollRunStats> {
    const resp = await api.get<PayrollRunStats>('/api/payroll-runs/stats', { params });
    return resp.data;
  },

  async getSalaryBoard(params?: SalaryBoardParams): Promise<SalaryBoardResponse> {
    const resp = await api.get<SalaryBoardResponse>('/api/payroll-runs/salary-board', { params });
    return resp.data;
  },

  async getSalaryLineMonthDetail(salaryLineId: string): Promise<SalaryLineMonthDetail> {
    const resp = await api.get<SalaryLineMonthDetail>(
      `/api/payroll-runs/salary-lines/${salaryLineId}/month-detail`,
    );
    return resp.data;
  },

  async getById(id: string): Promise<PayrollRunDetail> {
    const resp = await api.get<PayrollRunDetail>(`/api/payroll-runs/${id}`);
    return resp.data;
  },

  async create(body: { payrollMonth: string; seedLines?: boolean }): Promise<PayrollRunDetail> {
    const resp = await api.post<PayrollRunDetail>('/api/payroll-runs', body);
    return resp.data;
  },

  async updateStatus(id: string, status: PayrollRunStatus): Promise<PayrollRunDetail> {
    const resp = await api.patch<PayrollRunDetail>(`/api/payroll-runs/${id}/status`, { status });
    return resp.data;
  },

  async getBonusReleases(payrollRunId: string): Promise<PayrollRunBonusReleases> {
    const resp = await api.get<PayrollRunBonusReleases>(
      `/api/payroll-runs/${payrollRunId}/bonus-releases`,
    );
    return resp.data;
  },

  async attachBonusReleases(payrollRunId: string, releaseIds: string[]): Promise<PayrollRunDetail> {
    const resp = await api.post<PayrollRunDetail>(
      `/api/payroll-runs/${payrollRunId}/bonus-releases/attach`,
      { releaseIds },
    );
    return resp.data;
  },

  async detachBonusReleases(payrollRunId: string, releaseIds: string[]): Promise<PayrollRunDetail> {
    const resp = await api.post<PayrollRunDetail>(
      `/api/payroll-runs/${payrollRunId}/bonus-releases/detach`,
      { releaseIds },
    );
    return resp.data;
  },
};

export interface PayrollRunBonusReleaseRow {
  id: string;
  bonusEntryId: string;
  employeeId: string;
  employeeName: string;
  projectCode: string;
  projectName: string;
  orderCode: string;
  productLabel: string;
  bonusType: string;
  releaseType: string;
  status: string;
  amount: string;
  payrollIncludedAmount: string | null;
}

export interface PayrollRunBonusReleases {
  payrollRunId: string;
  payrollMonth: string;
  runStatus: PayrollRunStatus;
  canAttach: boolean;
  included: PayrollRunBonusReleaseRow[];
  availableToAttach: PayrollRunBonusReleaseRow[];
}
