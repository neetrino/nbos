import { ConflictException } from '@nestjs/common';
import {
  findArtifactByIdempotency,
  findArtifactByStorageKey,
  type ArtifactOperationDb,
} from './drive-artifact-operation.repository';
import type { ArtifactOperationRow } from './drive-artifact-operation.row';
import type {
  ArtifactAuthorizationContext,
  ArtifactOperationResult,
  PrepareArtifactOperationInput,
} from './drive-artifact-operation.types';

export function requireArtifactResult(operation: ArtifactOperationRow): ArtifactOperationResult {
  if (!operation.fileAssetId) {
    throw new ConflictException('Completed artifact operation is missing fileAssetId.');
  }
  return {
    fileAssetId: operation.fileAssetId,
    fileVersionId: operation.fileVersionId,
    fileLinkId: operation.fileLinkId,
  };
}

export function toArtifactAuthContext(
  operation: ArtifactOperationRow,
): ArtifactAuthorizationContext {
  return {
    source: operation.source,
    actorType: operation.actorType,
    actorId: operation.actorId,
    createdByEmployeeId: operation.createdByEmployeeId,
    agentId: operation.agentId,
    entityType: operation.entityType,
    entityId: operation.entityId,
    targetFileAssetId: operation.targetFileAssetId,
    folderId: operation.folderId,
  };
}

export function assertSameArtifactFingerprint(
  row: ArtifactOperationRow,
  fingerprint?: string | null,
): void {
  if (!row.payloadFingerprint && !fingerprint) return;
  if (row.payloadFingerprint !== fingerprint) {
    throw new ConflictException('Artifact operation key was reused with a different payload.');
  }
}

export function assertSameArtifactTarget(
  row: ArtifactOperationRow,
  input: Pick<PrepareArtifactOperationInput, 'entityType' | 'entityId'>,
): void {
  if (row.entityType !== input.entityType || row.entityId !== input.entityId) {
    throw new ConflictException('Artifact operation key was reused with a different target.');
  }
}

export async function recoverPrepareConflict(
  db: ArtifactOperationDb,
  input: PrepareArtifactOperationInput,
  error: unknown,
): Promise<ArtifactOperationRow> {
  if (!isUniqueConstraintError(error)) {
    throw error;
  }
  const existing =
    (input.idempotencyKey
      ? await findArtifactByIdempotency(db, {
          source: input.source,
          actorId: input.actorId,
          idempotencyKey: input.idempotencyKey,
        })
      : null) ?? (await findArtifactByStorageKey(db, input.storageKey));
  if (!existing) throw error;
  assertSameArtifactFingerprint(existing, input.payloadFingerprint);
  assertSameArtifactTarget(existing, input);
  return existing;
}

function isUniqueConstraintError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const record = error as { code?: unknown };
  return record.code === 'P2002' || record.code === '23505';
}
