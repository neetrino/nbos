import { api } from '../api';

export interface SupportTicket {
  id: string;
  code: string;
  title: string;
  description: string | null;
  projectId: string;
  category: string;
  priority: string;
  status: string;
  billable: boolean;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  project: { id: string; code: string; name: string };
  contact: { id: string; firstName: string; lastName: string } | null;
  assignee: { id: string; firstName: string; lastName: string } | null;
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
  projectId?: string;
  search?: string;
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
  async delete(id: string): Promise<void> {
    await api.delete(`/api/support/${id}`);
  },
  async getStats() {
    const resp = await api.get('/api/support/stats');
    return resp.data;
  },
};
