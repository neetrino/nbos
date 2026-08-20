import { api } from '../api';

export const CRM_ACTIVITY_TYPE_CALL = 'CALL' as const;

export type CallDirection = 'INBOUND' | 'OUTBOUND';

export interface CallActivity {
  type: typeof CRM_ACTIVITY_TYPE_CALL;
  id: string;
  uid: string;
  direction: CallDirection | null;
  phone: string | null;
  status: string | null;
  durationSec: number | null;
  disposition: string | null;
  rate: string | null;
  leadId: string | null;
  contactId: string | null;
  dealId: string | null;
  responsibleEmployeeId: string | null;
  answeredEmployeeId: string | null;
  contactName: string | null;
  leadName: string | null;
  dealName: string | null;
  employeeName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CallActivityListData {
  items: CallActivity[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export type CallActivityListQuery =
  | { leadId: string; contactId?: never; dealId?: never; page?: number; pageSize?: number }
  | { contactId: string; leadId?: never; dealId?: never; page?: number; pageSize?: number }
  | { dealId: string; leadId?: never; contactId?: never; page?: number; pageSize?: number };

export const callsApi = {
  async list(query: CallActivityListQuery): Promise<CallActivityListData> {
    const resp = await api.get<CallActivityListData>('/api/crm/calls', { params: query });
    return resp.data;
  },
  async getById(id: string): Promise<CallActivity> {
    const resp = await api.get<CallActivity>(`/api/crm/calls/${id}`);
    return resp.data;
  },
};
