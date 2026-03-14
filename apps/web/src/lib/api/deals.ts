import { api } from '../api';

export interface DealInvoice {
  id: string;
  code: string;
  status: string;
  amount: number;
  paidDate?: string | null;
  payments: Array<{ id: string; amount: number; paymentDate?: string }>;
}

export interface DealOrder {
  id: string;
  code: string;
  status: string;
  totalAmount: number | null;
  projectId: string;
  invoices: DealInvoice[];
}

export interface Deal {
  id: string;
  code: string;
  name: string | null;
  status: string;
  type: string;
  amount: number | null;
  paymentType: string | null;
  projectId: string | null;
  taxStatus?: string;
  companyId?: string | null;
  company?: { id: string; name: string } | null;
  source: string | null;
  sourceDetail: string | null;
  sourcePartnerId: string | null;
  sourceContactId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  lead: { id: string; code: string; contactName: string } | null;
  contact: { id: string; firstName: string; lastName: string; email: string | null };
  seller: { id: string; firstName: string; lastName: string };
  orders: DealOrder[];
  sourcePartner: { id: string; name: string } | null;
  sourceContact: { id: string; firstName: string; lastName: string } | null;
}

export interface DealListData {
  items: Deal[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

interface DealQueryParams {
  page?: number;
  pageSize?: number;
  status?: string;
  type?: string;
  sellerId?: string;
  search?: string;
}

export const dealsApi = {
  async getAll(params?: DealQueryParams): Promise<DealListData> {
    const resp = await api.get<DealListData>('/api/crm/deals', { params });
    return resp.data;
  },

  async getById(id: string): Promise<Deal> {
    const resp = await api.get<Deal>(`/api/crm/deals/${id}`);
    return resp.data;
  },

  async create(data: {
    name?: string;
    leadId?: string;
    contactId: string;
    type: string;
    amount?: number;
    paymentType?: string;
    sellerId: string;
    source?: string;
    notes?: string;
  }): Promise<Deal> {
    const resp = await api.post<Deal>('/api/crm/deals', data);
    return resp.data;
  },

  async update(id: string, data: Partial<Deal>): Promise<Deal> {
    const resp = await api.put<Deal>(`/api/crm/deals/${id}`, data);
    return resp.data;
  },

  async updateStatus(id: string, status: string): Promise<Deal> {
    const resp = await api.patch<Deal>(`/api/crm/deals/${id}/status`, { status });
    return resp.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/crm/deals/${id}`);
  },

  async getStats() {
    const resp = await api.get('/api/crm/deals/stats');
    return resp.data;
  },
};
