import type { EntityLifecycleScope } from '@nbos/shared';
import { api } from '../api';

export interface ContactExtraPhone {
  id: string;
  e164: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  extraPhones?: ContactExtraPhone[];
  role: string;
  notes: string | null;
  messengerLinks: Record<string, string> | null;
  trashedAt?: string | null;
  mergedIntoId?: string | null;
  createdAt: string;
  updatedAt: string;
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
  phone: string | null;
  email: string | null;
  country: string | null;
  billingContactId: string | null;
  trashedAt?: string | null;
  createdAt: string;
  contact: { id: string; firstName: string; lastName: string } | null;
  billingContact: { id: string; firstName: string; lastName: string } | null;
  additionalContacts?: Array<{
    contact: { id: string; firstName: string; lastName: string };
  }>;
  _count: { projects: number; invoices: number };
  updatedAt: string;
}

interface ListData<T> {
  items: T[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

type ClientsListParams = Record<string, unknown> & { scope?: EntityLifecycleScope };

export type ContactMergeFieldSide = 'survivor' | 'absorbed';

export type ContactMergeFieldChoices = Partial<{
  firstName: ContactMergeFieldSide;
  lastName: ContactMergeFieldSide;
  phone: ContactMergeFieldSide;
  email: ContactMergeFieldSide;
  role: ContactMergeFieldSide;
}>;

export interface ContactMergeCandidate {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  role: string;
}

export const contactsApi = {
  async getAll(params?: ClientsListParams): Promise<ListData<Contact>> {
    const resp = await api.get<ListData<Contact>>('/api/clients/contacts', { params });
    return resp.data;
  },
  async getById(id: string): Promise<Contact> {
    const resp = await api.get<Contact>(`/api/clients/contacts/${id}`);
    return resp.data;
  },
  async create(data: Record<string, unknown>): Promise<Contact> {
    const resp = await api.post<Contact>('/api/clients/contacts', data);
    return resp.data;
  },
  async update(id: string, data: Record<string, unknown>): Promise<Contact> {
    const resp = await api.put<Contact>(`/api/clients/contacts/${id}`, data);
    return resp.data;
  },
  async moveToTrash(id: string): Promise<void> {
    await api.delete(`/api/clients/contacts/${id}`);
  },
  async restore(id: string): Promise<Contact> {
    const resp = await api.post<Contact>(`/api/clients/contacts/${id}/restore`);
    return resp.data;
  },
  async permanentDelete(id: string): Promise<void> {
    await api.delete(`/api/clients/contacts/${id}/permanent`);
  },
  async addExtraPhone(id: string, phone: string): Promise<Contact> {
    const resp = await api.post<Contact>(`/api/clients/contacts/${id}/phones`, { phone });
    return resp.data;
  },
  async removeExtraPhone(id: string, phoneId: string): Promise<Contact> {
    const resp = await api.delete<Contact>(`/api/clients/contacts/${id}/phones/${phoneId}`);
    return resp.data;
  },
  async findMergeCandidates(params: {
    q: string;
    excludeId: string;
  }): Promise<ContactMergeCandidate[]> {
    const resp = await api.get<ContactMergeCandidate[]>('/api/clients/contacts/duplicates', {
      params,
    });
    return resp.data;
  },
  async merge(
    survivorId: string,
    data: { absorbedId: string; fieldChoices?: ContactMergeFieldChoices },
  ): Promise<Contact> {
    const resp = await api.post<Contact>(`/api/clients/contacts/${survivorId}/merge`, data);
    return resp.data;
  },
};

export const companiesApi = {
  async getAll(params?: ClientsListParams): Promise<ListData<Company>> {
    const resp = await api.get<ListData<Company>>('/api/clients/companies', { params });
    return resp.data;
  },
  async getById(id: string): Promise<Company> {
    const resp = await api.get<Company>(`/api/clients/companies/${id}`);
    return resp.data;
  },
  async create(data: Record<string, unknown>): Promise<Company> {
    const resp = await api.post<Company>('/api/clients/companies', data);
    return resp.data;
  },
  async update(id: string, data: Record<string, unknown>): Promise<Company> {
    const resp = await api.put<Company>(`/api/clients/companies/${id}`, data);
    return resp.data;
  },
  async moveToTrash(id: string): Promise<void> {
    await api.delete(`/api/clients/companies/${id}`);
  },
  async restore(id: string): Promise<Company> {
    const resp = await api.post<Company>(`/api/clients/companies/${id}/restore`);
    return resp.data;
  },
  async permanentDelete(id: string): Promise<void> {
    await api.delete(`/api/clients/companies/${id}/permanent`);
  },
};
