import type { PrismaClient } from '@nbos/database';
import { ARTIFACT_OPERATION_CLEANUP_STATUSES } from './drive-artifact-operation.constants';
import type { DriveArtifactStorage } from './drive-artifact-operation.types';

type OrphanDb = Pick<
  InstanceType<typeof PrismaClient>,
  'fileArtifactOperation' | 'fileAsset' | 'fileVersion'
>;

/**
 * Conservative orphan delete: the operation must already be terminal, must own
 * the storage key, and no FileAsset / FileVersion may reference it.
 */
export async function deleteOwnedOrphanObject(params: {
  db: OrphanDb;
  storage: DriveArtifactStorage;
  operationId: string;
}): Promise<'deleted' | 'skipped'> {
  const operation = await params.db.fileArtifactOperation.findUnique({
    where: { id: params.operationId },
  });
  if (!operation) return 'skipped';
  if (!(ARTIFACT_OPERATION_CLEANUP_STATUSES as readonly string[]).includes(operation.status)) {
    return 'skipped';
  }
  const asset = await params.db.fileAsset.findFirst({
    where: { storageKey: operation.storageKey },
    select: { id: true },
  });
  if (asset) return 'skipped';
  const version = await params.db.fileVersion.findFirst({
    where: { storageKey: operation.storageKey },
    select: { id: true },
  });
  if (version) return 'skipped';
  const head = await params.storage.headObject(operation.storageKey);
  if (!head) return 'skipped';
  await params.storage.deleteObject(operation.storageKey);
  return 'deleted';
}
