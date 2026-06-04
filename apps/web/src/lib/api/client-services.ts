import { api } from '../api';
import type { ExpensePlan } from './expense-plans';
import type { Expense, Invoice } from './finance';
import type { ListData } from './finance-common';
import type { Task } from './tasks';

/** Linked finance/tasks for a client service (present on `getById`, create, update responses). */
export interface ClientServiceFinanceLinks {
  invoices: Array<{
    id: string;
    code: string;
    moneyStatus: string;
    amount: string;
    type: string;
  }>;
  expensePlans: Array<{ id: string; name: string; category: string; amount: string }>;
  expenses: Array<{
    id: string;
    name: string;
    status: string;
    amount: string;
    type: string;
    category: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    dueDate: string | null;
    workspaceId: string | null;
  }>;
}

/** Computed payment lifecycle stage (server-derived, not a stored field). */
export type ClientServicePaymentStage = 'active' | 'upcoming' | 'invoice' | 'pay_now';

export interface ClientServiceRecord {
  id: string;
  projectId: string;
  productId: string | null;
  type: string;
  name: string;
  provider: string | null;
  providerAccountId: string | null;
  status: string;
  billingModel: string;
  pricingModel: string;
  frequency: string;
  ourCost: string | null;
  clientCharge: string | null;
  taxStatus: string;
  notificationsEnabled: boolean;
  startDate: string | null;
  renewalDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  project: { id: string; code: string; name: string };
  product: { id: string; name: string } | null;
  providerAccount: { id: string; name: string; provider: string | null } | null;
  _count: { invoices: number; expensePlans: number; expenses: number };
  /** Present on list responses (`getAll`); absent on detail/create/update. */
  paymentStage?: ClientServicePaymentStage;
  /** Cross-cutting overdue overlay flag (present on list responses). */
  overdue?: boolean;
  financeLinks?: ClientServiceFinanceLinks;
}

export interface ClientServiceRecordPayload {
  projectId: string;
  productId?: string | null;
  type: string;
  name: string;
  provider?: string | null;
  providerAccountId?: string | null;
  status?: string;
  billingModel?: string;
  pricingModel?: string;
  frequency?: string;
  ourCost?: number | null;
  clientCharge?: number | null;
  taxStatus?: string;
  notificationsEnabled?: boolean;
  startDate?: string | null;
  renewalDate?: string | null;
  notes?: string | null;
}

export interface ClientServiceRecordListParams {
  page?: number;
  pageSize?: number;
  projectId?: string;
  productId?: string;
  type?: string;
  status?: string;
  billingModel?: string;
  search?: string;
  renewalFrom?: string;
  renewalTo?: string;
  stage?: ClientServicePaymentStage;
}

export interface ClientServiceStatsParams {
  projectId?: string;
  productId?: string;
  type?: string;
  status?: string;
  billingModel?: string;
  year?: number;
}

export interface ClientServiceStageStat {
  stage: ClientServicePaymentStage;
  count: number;
  sum: string;
}

export interface ClientServiceMonthStat {
  month: number;
  count: number;
  sum: string;
}

export interface ClientServiceStats {
  total: number;
  dueSoon: number;
  byStatus: Array<{ status: string; _count: { _all: number } }>;
  byType: Array<{ type: string; _count: { _all: number } }>;
  byBillingModel: Array<{ billingModel: string; _count: { _all: number } }>;
  byStage: ClientServiceStageStat[];
  overdue: number;
  year: number;
  byMonth: ClientServiceMonthStat[];
}

export type ClientServiceBoardView = 'status' | 'months';

export interface ClientServiceBoardQueryParams extends ClientServiceRecordListParams {
  view: ClientServiceBoardView;
  year?: number;
}

export interface ClientServiceBoardColumnPayload {
  key: string;
  count: number;
  sum: string;
  items: ClientServiceRecord[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

export interface ClientServiceBoardPayload {
  view: ClientServiceBoardView;
  year: number;
  columns: ClientServiceBoardColumnPayload[];
}

export const clientServicesApi = {
  async getAll(params?: ClientServiceRecordListParams): Promise<ListData<ClientServiceRecord>> {
    const resp = await api.get<ListData<ClientServiceRecord>>('/api/client-services', { params });
    return resp.data;
  },

  async getStats(params?: ClientServiceStatsParams): Promise<ClientServiceStats> {
    const resp = await api.get<ClientServiceStats>('/api/client-services/stats', { params });
    return resp.data;
  },

  async getBoard(params: ClientServiceBoardQueryParams): Promise<ClientServiceBoardPayload> {
    const resp = await api.get<ClientServiceBoardPayload>('/api/client-services/board', {
      params,
    });
    return resp.data;
  },

  async getById(id: string): Promise<ClientServiceRecord> {
    const resp = await api.get<ClientServiceRecord>(`/api/client-services/${id}`);
    return resp.data;
  },

  async create(data: ClientServiceRecordPayload): Promise<ClientServiceRecord> {
    const resp = await api.post<ClientServiceRecord>('/api/client-services', data);
    return resp.data;
  },

  async update(
    id: string,
    data: Partial<ClientServiceRecordPayload>,
  ): Promise<ClientServiceRecord> {
    const resp = await api.put<ClientServiceRecord>(`/api/client-services/${id}`, data);
    return resp.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/client-services/${id}`);
  },

  async createInvoice(
    id: string,
    data?: { amount?: number; dueDate?: string | null; type?: string },
  ): Promise<Invoice> {
    const resp = await api.post<Invoice>(
      `/api/client-services/${id}/actions/create-invoice`,
      data ?? {},
    );
    return resp.data;
  },

  async createExpensePlan(
    id: string,
    data?: { amount?: number; nextDueDate?: string | null; autoGenerate?: boolean },
  ): Promise<ExpensePlan> {
    const resp = await api.post<ExpensePlan>(
      `/api/client-services/${id}/actions/create-expense-plan`,
      data ?? {},
    );
    return resp.data;
  },

  async createExpense(
    id: string,
    data?: { amount?: number; dueDate?: string | null },
  ): Promise<Expense> {
    const resp = await api.post<Expense>(
      `/api/client-services/${id}/actions/create-expense`,
      data ?? {},
    );
    return resp.data;
  },

  async createTask(
    id: string,
    data: { creatorId: string; title?: string; description?: string; dueDate?: string | null },
  ): Promise<Task> {
    const resp = await api.post<Task>(`/api/client-services/${id}/actions/create-task`, data);
    return resp.data;
  },
};
