import { api } from '../api';

export interface Lead {
  id: string;
  code: string;
  name: string | null;
  contactName: string;
  phone: string | null;
  email: string | null;
  source: string;
  sourceDetail: string | null;
  sourcePartnerId: string | null;
  sourceContactId: string | null;
  status: string;
  assignedTo: string | null;
  contactId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  assignee: { id: string; firstName: string; lastName: string } | null;
  sourcePartner: { id: string; name: string } | null;
  sourceContact: { id: string; firstName: string; lastName: string } | null;
  deal: { id: string; code: string; status: string } | null;
}

export interface LeadListData {
  items: Lead[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface LeadStats {
  total: number;
  byStatus: Array<{ status: string; _count: number }>;
  bySource: Array<{ source: string; _count: number }>;
}

interface LeadQueryParams {
  page?: number;
  pageSize?: number;
  status?: string;
  source?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const leadsApi = {
  async getAll(params?: LeadQueryParams): Promise<LeadListData> {
    const resp = await api.get<LeadListData>('/api/crm/leads', { params });
    return resp.data;
  },

  async getById(id: string): Promise<Lead> {
    const resp = await api.get<Lead>(`/api/crm/leads/${id}`);
    return resp.data;
  },

  async create(data: {
    name?: string;
    contactName: string;
    phone?: string;
    email?: string;
    source: string;
    notes?: string;
  }): Promise<Lead> {
    const resp = await api.post<Lead>('/api/crm/leads', data);
    return resp.data;
  },

  async update(id: string, data: Partial<Lead>): Promise<Lead> {
    const resp = await api.put<Lead>(`/api/crm/leads/${id}`, data);
    return resp.data;
  },

  async updateStatus(id: string, status: string): Promise<Lead> {
    const resp = await api.patch<Lead>(`/api/crm/leads/${id}/status`, { status });
    return resp.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/crm/leads/${id}`);
  },

  async getStats(): Promise<LeadStats> {
    const resp = await api.get<LeadStats>('/api/crm/leads/stats');
    return resp.data;
  },

  async convertToDeal(
    id: string,
    data: { dealType: string; amount?: number; paymentType?: string; sellerId: string },
  ) {
    const resp = await api.post(`/api/crm/leads/${id}/convert`, data);
    return resp.data;
  },
};
