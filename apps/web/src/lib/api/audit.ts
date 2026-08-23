import { api } from '../api';

export interface AuditActor {
  id: string;
  type?: string;
  displayName?: string;
  firstName: string;
  lastName: string;
}

export interface AuditLogEntry {
  id: string;
  projectId: string | null;
  entityType: string;
  entityId: string;
  action: string;
  userId: string | null;
  actorType?: string | null;
  actorId?: string | null;
  onBehalfOfType?: string | null;
  onBehalfOfId?: string | null;
  channel?: string | null;
  protocol?: string | null;
  correlationId?: string | null;
  changes: unknown;
  ipAddress: string | null;
  createdAt: string;
  actor: AuditActor | null;
}

export function formatAuditActorLabel(entry: AuditLogEntry): string {
  if (entry.actor?.displayName) {
    return entry.actor.displayName;
  }
  if (entry.actor) {
    return `${entry.actor.firstName} ${entry.actor.lastName}`.trim();
  }
  const fallbackId = entry.userId ?? entry.actorId;
  return fallbackId ? fallbackId.slice(0, 8) : 'Unknown actor';
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
