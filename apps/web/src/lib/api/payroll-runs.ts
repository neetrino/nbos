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
  /** Read-only milestones from run timestamps (no intermediate status audit yet). */
  journal: PayrollJournalEntry[];
  /** Audit log rows for this run (`CREATED`, `STATUS_CHANGED`, …). */
  auditTrail: PayrollAuditTrailRow[];
}

export interface PayrollRunListParams {
  page?: number;
  pageSize?: number;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const payrollRunsApi = {
  async getAll(params?: PayrollRunListParams): Promise<ListData<PayrollRunListRow>> {
    const resp = await api.get<ListData<PayrollRunListRow>>('/api/payroll-runs', { params });
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
};
