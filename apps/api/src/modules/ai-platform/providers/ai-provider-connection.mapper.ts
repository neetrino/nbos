import type { AiProviderConnectionStatus, AiProviderType } from '@nbos/shared';

export interface AiProviderConnectionView {
  id: string;
  provider: AiProviderType;
  name: string;
  status: AiProviderConnectionStatus;
  keyPrefix: string;
  providerOrganizationId: string | null;
  providerProjectId: string | null;
  baseUrl: string | null;
  lastValidatedAt: Date | null;
  lastModelSyncAt: Date | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

type ConnectionRow = AiProviderConnectionView;

/** Explicit projection — secret columns cannot leak by adding a Prisma field. */
export function toProviderConnectionView(row: ConnectionRow): AiProviderConnectionView {
  return {
    id: row.id,
    provider: row.provider,
    name: row.name,
    status: row.status,
    keyPrefix: row.keyPrefix,
    providerOrganizationId: row.providerOrganizationId,
    providerProjectId: row.providerProjectId,
    baseUrl: row.baseUrl,
    lastValidatedAt: row.lastValidatedAt,
    lastModelSyncAt: row.lastModelSyncAt,
    createdById: row.createdById,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function isProviderConnectionUsable(status: AiProviderConnectionStatus): boolean {
  return status === 'ACTIVE';
}
