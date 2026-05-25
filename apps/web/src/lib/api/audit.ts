import { api } from '../api';

export interface AuditActor {
  id: string;
  firstName: string;
  lastName: string;
}

export interface AuditLogEntry {
  id: string;
  projectId: string | null;
  entityType: string;
  entityId: string;
  action: string;
  userId: string;
  changes: unknown;
  ipAddress: string | null;
  createdAt: string;
  actor: AuditActor | null;
}

interface AuditListResponse {
  items: AuditLogEntry[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

export const auditApi = {
  async findByEntity(
    entityType: string,
    entityId: string,
    params?: { page?: number; pageSize?: number },
  ): Promise<AuditListResponse> {
    const resp = await api.get<AuditListResponse>('/api/audit', {
      params: { entityType, entityId, ...params },
    });
    return resp.data;
  },
};
