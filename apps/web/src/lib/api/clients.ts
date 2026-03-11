import { api } from '../api';

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  role: string;
  notes: string | null;
  messengerLinks: Record<string, string> | null;
  createdAt: string;
  companies: Array<{ id: string; name: string }>;
  _count: { projects: number; leads: number; deals: number };
}

export interface Company {
  id: string;
  name: string;
  type: string;
  taxId: string | null;
  taxStatus: string;
  legalAddress: string | null;
  notes: string | null;
  createdAt: string;
  contact: { id: string; firstName: string; lastName: string };
  _count: { projects: number; invoices: number };
}

interface ListData<T> {
  items: T[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

export const contactsApi = {
  async getAll(params?: Record<string, unknown>): Promise<ListData<Contact>> {
    const resp = await api.get<ListData<Contact>>('/api/clients/contacts', { params });
    return resp.data;
  },
  async create(data: Record<string, unknown>): Promise<Contact> {
    const resp = await api.post<Contact>('/api/clients/contacts', data);
    return resp.data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`/api/clients/contacts/${id}`);
  },
};

export const companiesApi = {
  async getAll(params?: Record<string, unknown>): Promise<ListData<Company>> {
    const resp = await api.get<ListData<Company>>('/api/clients/companies', { params });
    return resp.data;
  },
  async create(data: Record<string, unknown>): Promise<Company> {
    const resp = await api.post<Company>('/api/clients/companies', data);
    return resp.data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`/api/clients/companies/${id}`);
  },
};
