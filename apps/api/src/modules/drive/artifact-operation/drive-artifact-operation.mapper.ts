import type { Prisma } from '@nbos/database';
import { pickConfidentiality, pickLinkType, pickPurpose, pickVisibility } from '../drive-metadata';
import type { PrepareArtifactOperationInput } from './drive-artifact-operation.types';
import { ARTIFACT_OPERATION_TTL_MS } from './drive-artifact-operation.constants';

export function toArtifactCreateData(
  input: PrepareArtifactOperationInput,
): Prisma.FileArtifactOperationCreateInput {
  const expiresAt = input.expiresAt ?? new Date(Date.now() + ARTIFACT_OPERATION_TTL_MS);
  return {
    ...(input.id ? { id: input.id } : {}),
    status: input.ingress === 'PRESIGNED' ? 'UPLOAD_PENDING' : 'PREPARED',
    source: input.source,
    ingress: input.ingress,
    kind: input.kind ?? 'CREATE_ASSET',
    storageKey: input.storageKey,
    entityType: input.entityType,
    entityId: input.entityId,
    targetFileAssetId: input.targetFileAssetId ?? undefined,
    displayName: input.displayName,
    originalName: input.originalName ?? undefined,
    mimeType: input.mimeType ?? undefined,
    purpose: pickPurpose(asOptionalString(input.purpose)),
    sourceModule: input.sourceModule ?? undefined,
    visibility: pickVisibility(asOptionalString(input.visibility)),
    confidentiality: pickConfidentiality(asOptionalString(input.confidentiality)),
    linkType: pickLinkType(asOptionalString(input.linkType)),
    expectedSizeBytes:
      input.expectedSizeBytes === null || input.expectedSizeBytes === undefined
        ? undefined
        : BigInt(input.expectedSizeBytes),
    checksum: input.checksum ?? undefined,
    payloadFingerprint: input.payloadFingerprint ?? undefined,
    createdByEmployeeId: input.createdByEmployeeId ?? undefined,
    actorType: input.actorType,
    actorId: input.actorId,
    agentId: input.agentId ?? undefined,
    correlationId: input.correlationId ?? undefined,
    idempotencyKey: input.idempotencyKey ?? undefined,
    folderId: input.folderId ?? undefined,
    fileAssetId: input.fileAssetId ?? undefined,
    expiresAt,
  };
}

export function readCreatedLinkId(created: {
  id: unknown;
  links?: Array<{ id?: unknown }>;
}): string | null {
  const linkId = created.links?.[0]?.id;
  return typeof linkId === 'string' && linkId.length > 0 ? linkId : null;
}

function asOptionalString(value: string | null | undefined): string | undefined {
  return value ?? undefined;
}

export function toNumberOrNull(value: bigint | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return typeof value === 'bigint' ? Number(value) : value;
}
