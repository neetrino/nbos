import { api } from '../api';
import { ApiError } from '../api-errors';

export const CRM_ACTIVITY_TYPE_CALL = 'CALL' as const;

export type CallDirection = 'INBOUND' | 'OUTBOUND';
export type CallRecordingStatus = 'PENDING' | 'DOWNLOADING' | 'READY' | 'FAILED';
export type ActiveCallPhase = 'ringing' | 'answered' | 'ended';

export interface ActiveCallScreenSnapshot {
  callId: string;
  uid: string;
  direction: CallDirection | null;
  phase: ActiveCallPhase;
  phone: string | null;
  displayName: string | null;
  contact: {
    id: string | null;
    name: string | null;
    companyName: string | null;
    phones: string[];
  };
  deal: {
    id: string | null;
    name: string | null;
    stage: string | null;
    amount: string | null;
  };
  projectName: string | null;
  productName: string | null;
  leadId: string | null;
  leadName: string | null;
  durationSec: number | null;
  disposition: string | null;
  note: string | null;
  noteVersion: number;
  recordingStatus: CallRecordingStatus | null;
  recentCalls: Array<{
    id: string;
    direction: CallDirection | null;
    phase: ActiveCallPhase;
    createdAt: string;
    durationSec: number | null;
  }>;
}

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
  recordingStatus: CallRecordingStatus | null;
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

export type ClickToCallTargetType = 'LEAD' | 'CONTACT' | 'DEAL';

export const callsApi = {
  async list(query: CallActivityListQuery): Promise<CallActivityListData> {
    const resp = await api.get<CallActivityListData>('/api/crm/calls', { params: query });
    return resp.data;
  },
  async getById(id: string): Promise<CallActivity> {
    const resp = await api.get<CallActivity>(`/api/crm/calls/${id}`);
    return resp.data;
  },
  async startClickToCall(
    body: {
      targetType: ClickToCallTargetType;
      targetId: string;
    },
    idempotencyKey: string,
  ): Promise<CallActivity> {
    const resp = await api.post<CallActivity>('/api/crm/calls/click-to-call', body, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
    if (resp.status === 202) {
      const payload = resp.data as { message?: string; code?: string };
      throw new ApiError(payload.message ?? 'This click-to-call is already in progress', {
        statusCode: 202,
        code: payload.code ?? 'CLICK_TO_CALL_IN_PROGRESS',
      });
    }
    return resp.data;
  },
  async getScreen(id: string): Promise<ActiveCallScreenSnapshot> {
    const resp = await api.get<ActiveCallScreenSnapshot>(`/api/crm/calls/${id}/screen`);
    return resp.data;
  },
  async updateNote(
    id: string,
    body: { note: string | null; expectedNoteVersion: number },
  ): Promise<ActiveCallScreenSnapshot> {
    const resp = await api.patch<ActiveCallScreenSnapshot>(`/api/crm/calls/${id}/note`, body);
    return resp.data;
  },
};

export function callRecordingSrc(callId: string): string {
  return `/api/crm/calls/${callId}/recording`;
}
