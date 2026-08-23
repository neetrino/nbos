import { adminGet, adminPost } from './ai-admin-http';

export type AiApprovalStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'CONSUMED';

export interface AiApprovalRequestView {
  id: string;
  requester: { actorType: string; actorId: string };
  capabilityKey: string;
  resource: {
    resourceType: string;
    resourceId: string;
    scopeType: string | null;
    scopeId: string | null;
  };
  payloadDigest: string;
  safePayloadSummary: string;
  riskClass: string;
  status: AiApprovalStatus;
  requestedAt: string;
  expiresAt: string;
  decidedByEmployeeId: string | null;
  decidedAt: string | null;
  decisionReason: string | null;
  consumedAt: string | null;
  correlationId: string | null;
}

export const aiAdminApprovalsApi = {
  listPending: () => adminGet<AiApprovalRequestView[]>('/api/ai-admin/approvals'),
  getById: (id: string) => adminGet<AiApprovalRequestView>(`/api/ai-admin/approvals/${id}`),
  approve: (id: string, reason?: string) =>
    adminPost<AiApprovalRequestView>(`/api/ai-admin/approvals/${id}/approve`, { reason }),
  reject: (id: string, reason?: string) =>
    adminPost<AiApprovalRequestView>(`/api/ai-admin/approvals/${id}/reject`, { reason }),
  cancel: (id: string, reason?: string) =>
    adminPost<AiApprovalRequestView>(`/api/ai-admin/approvals/${id}/cancel`, { reason }),
};
