import { api } from '../api';
import type { Deal } from './deals';
import type { Task } from './tasks';

export interface SupportTicket {
  id: string;
  code: string;
  title: string;
  description: string | null;
  projectId: string;
  productId: string | null;
  extensionDealId: string | null;
  category: string;
  priority: string;
  status: string;
  coverageDecision: string | null;
  billable: boolean;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  project: { id: string; code: string; name: string };
  product: { id: string; name: string; status: string } | null;
  extensionDeal: {
    id: string;
    code: string;
    name: string | null;
    status: string;
    amount: number | string | null;
  } | null;
  contact: { id: string; firstName: string; lastName: string } | null;
  assignee: { id: string; firstName: string; lastName: string } | null;
  slaState: {
    state: 'ON_TRACK' | 'AT_RISK' | 'BREACHED' | 'CLOSED';
    responseDeadline: string | null;
    resolveDeadline: string | null;
  };
  executionTasks?: Task[];
}

interface ListData<T> {
  items: T[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

interface TicketQueryParams {
  page?: number;
  pageSize?: number;
  status?: string;
  priority?: string;
  category?: string;
  coverageDecision?: string;
  projectId?: string;
  productId?: string;
  search?: string;
}

/** Workspace aggregates from `GET /api/support/stats` (Prisma `groupBy`). */
export interface SupportStats {
  byStatus: Array<{ status: string; _count: number }>;
  byPriority: Array<{ priority: string; _count: number }>;
  byCategory: Array<{ category: string; _count: number }>;
  byCoverage: Array<{ coverageDecision: string | null; _count: number }>;
}

export const supportApi = {
  async getAll(params?: TicketQueryParams): Promise<ListData<SupportTicket>> {
    const resp = await api.get<ListData<SupportTicket>>('/api/support', { params });
    return resp.data;
  },
  async getById(id: string): Promise<SupportTicket> {
    const resp = await api.get<SupportTicket>(`/api/support/${id}`);
    return resp.data;
  },
  async create(data: {
    title: string;
    projectId: string;
    category: string;
    priority?: string;
    description?: string;
    productId?: string;
    coverageDecision?: string | null;
    contactId?: string;
    billable?: boolean;
  }): Promise<SupportTicket> {
    const resp = await api.post<SupportTicket>('/api/support', data);
    return resp.data;
  },
  async update(id: string, data: Record<string, unknown>): Promise<SupportTicket> {
    const resp = await api.put<SupportTicket>(`/api/support/${id}`, data);
    return resp.data;
  },
  async updateStatus(id: string, status: string): Promise<SupportTicket> {
    const resp = await api.patch<SupportTicket>(`/api/support/${id}/status`, { status });
    return resp.data;
  },
  async reopen(id: string, reason?: string): Promise<SupportTicket> {
    const resp = await api.post<SupportTicket>(`/api/support/${id}/actions/reopen`, { reason });
    return resp.data;
  },
  async createExecutionTask(
    id: string,
    data: { creatorId: string; title?: string; description?: string; dueDate?: string | null },
  ): Promise<Task> {
    const resp = await api.post<Task>(`/api/support/${id}/actions/create-task`, data);
    return resp.data;
  },
  async createExtensionDeal(
    id: string,
    data: {
      sellerId: string;
      contactId?: string;
      amount?: number;
      paymentType?: string;
      name?: string;
      notes?: string;
    },
  ): Promise<Deal> {
    const resp = await api.post<Deal>(`/api/support/${id}/actions/create-extension-deal`, data);
    return resp.data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`/api/support/${id}`);
  },
  async getStats(): Promise<SupportStats> {
    const resp = await api.get<SupportStats>('/api/support/stats');
    return resp.data;
  },
};
