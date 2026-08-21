import type { AiModelStatus, AiProviderType } from '@nbos/shared';

export interface AiModelView {
  id: string;
  connectionId: string;
  provider: AiProviderType;
  providerModelId: string;
  displayName: string;
  status: AiModelStatus;
  discoveredAt: Date;
  lastSeenAt: Date;
  providerMetadata: Record<string, unknown>;
  suitabilityTags: string[];
  notes: string | null;
  aliasOf: string | null;
  snapshotId: string | null;
  activatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

type ModelRow = Omit<AiModelView, 'providerMetadata'> & {
  providerMetadata: unknown;
};

export function toAiModelView(row: ModelRow): AiModelView {
  return {
    id: row.id,
    connectionId: row.connectionId,
    provider: row.provider,
    providerModelId: row.providerModelId,
    displayName: row.displayName,
    status: row.status,
    discoveredAt: row.discoveredAt,
    lastSeenAt: row.lastSeenAt,
    providerMetadata: asMetadata(row.providerMetadata),
    suitabilityTags: row.suitabilityTags,
    notes: row.notes,
    aliasOf: row.aliasOf,
    snapshotId: row.snapshotId,
    activatedAt: row.activatedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function asMetadata(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}
