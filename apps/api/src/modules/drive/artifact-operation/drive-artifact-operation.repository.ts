import { Prisma, type PrismaClient } from '@nbos/database';
import type { ArtifactOperationRow } from './drive-artifact-operation.row';
import type { ArtifactOperationStatus } from './drive-artifact-operation.types';
import { ARTIFACT_OPERATION_ACTIVE_STATUSES } from './drive-artifact-operation.constants';
import { assertArtifactTransition } from './drive-artifact-operation.state';

export type ArtifactOperationDb = Pick<
  InstanceType<typeof PrismaClient>,
  'fileArtifactOperation'
> & {
  $transaction: InstanceType<typeof PrismaClient>['$transaction'];
};

export async function findArtifactOperation(
  db: ArtifactOperationDb,
  id: string,
): Promise<ArtifactOperationRow | null> {
  return db.fileArtifactOperation.findUnique({ where: { id } });
}

export async function findArtifactByIdempotency(
  db: ArtifactOperationDb,
  input: { source: ArtifactOperationRow['source']; actorId: string; idempotencyKey: string },
): Promise<ArtifactOperationRow | null> {
  return db.fileArtifactOperation.findFirst({
    where: {
      source: input.source,
      actorId: input.actorId,
      idempotencyKey: input.idempotencyKey,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function findArtifactByStorageKey(
  db: ArtifactOperationDb,
  storageKey: string,
): Promise<ArtifactOperationRow | null> {
  return db.fileArtifactOperation.findUnique({ where: { storageKey } });
}

export async function findActiveArtifactByStorageKey(
  db: ArtifactOperationDb,
  storageKey: string,
): Promise<ArtifactOperationRow | null> {
  return db.fileArtifactOperation.findFirst({
    where: {
      storageKey,
      status: { in: [...ARTIFACT_OPERATION_ACTIVE_STATUSES, 'COMPLETED'] },
    },
  });
}

export async function advanceArtifactStatus(
  db: ArtifactOperationDb,
  operation: ArtifactOperationRow,
  to: ArtifactOperationStatus,
  extra: Prisma.FileArtifactOperationUpdateInput = {},
): Promise<ArtifactOperationRow> {
  if (operation.status === to) {
    return operation;
  }
  assertArtifactTransition(operation.status, to);
  const updated = await db.fileArtifactOperation.updateMany({
    where: { id: operation.id, status: operation.status },
    data: { status: to, ...toScalarUpdate(extra) },
  });
  if (updated.count === 0) {
    const fresh = await findArtifactOperation(db, operation.id);
    if (fresh && (fresh.status === to || canStayIfAdvanced(fresh.status, to))) {
      return fresh;
    }
    throw new Error(`Concurrent artifact operation update on ${operation.id}`);
  }
  const fresh = await findArtifactOperation(db, operation.id);
  if (!fresh) throw new Error(`Artifact operation ${operation.id} vanished`);
  return fresh;
}

function canStayIfAdvanced(
  actual: ArtifactOperationStatus,
  intended: ArtifactOperationStatus,
): boolean {
  if (actual === 'COMPLETED') return true;
  if (intended === 'OBJECT_UPLOADED' && actual === 'OBJECT_VERIFIED') return true;
  return false;
}

function toScalarUpdate(
  extra: Prisma.FileArtifactOperationUpdateInput,
): Prisma.FileArtifactOperationUncheckedUpdateManyInput {
  const data: Prisma.FileArtifactOperationUncheckedUpdateManyInput = {};
  if (typeof extra.failedReason === 'string' || extra.failedReason === null) {
    data.failedReason = extra.failedReason;
  }
  if (extra.objectVerifiedAt instanceof Date) {
    data.objectVerifiedAt = extra.objectVerifiedAt;
  }
  if (typeof extra.checksum === 'string' || extra.checksum === null) {
    data.checksum = extra.checksum;
  }
  if (typeof extra.expectedSizeBytes === 'bigint' || extra.expectedSizeBytes === null) {
    data.expectedSizeBytes = extra.expectedSizeBytes;
  }
  if (typeof extra.recoveryAttemptCount === 'number') {
    data.recoveryAttemptCount = extra.recoveryAttemptCount;
  }
  if (extra.lastRecoveryAt instanceof Date) {
    data.lastRecoveryAt = extra.lastRecoveryAt;
  }
  return data;
}
