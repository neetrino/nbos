import type { TransactionClient } from '@nbos/database';
import type { ArtifactOperationRow } from './drive-artifact-operation.row';
import { FILE_ASSET_INCLUDE } from '../drive-file-asset-include';
import {
  buildInitialVersion,
  buildLinkCreateInput,
  pickFileType,
  pickPurpose,
  pickConfidentiality,
  pickVisibility,
} from '../drive-metadata';
import type { ArtifactOperationResult, FinalizeHints } from './drive-artifact-operation.types';
import { readCreatedLinkId } from './drive-artifact-operation.mapper';

type ArtifactDb = Pick<
  TransactionClient,
  'fileAsset' | 'fileVersion' | 'fileLink' | 'fileArtifactOperation' | 'driveFolderItem'
>;

export async function finalizeArtifactOperationInTx(
  tx: ArtifactDb,
  operation: ArtifactOperationRow,
  hints: FinalizeHints,
): Promise<ArtifactOperationResult> {
  if (operation.status === 'COMPLETED' && operation.fileAssetId) {
    return {
      fileAssetId: operation.fileAssetId,
      fileVersionId: operation.fileVersionId,
      fileLinkId: operation.fileLinkId,
    };
  }
  if (operation.kind === 'CREATE_VERSION') {
    return finalizeVersionInTx(tx, operation, hints);
  }
  return finalizeAssetInTx(tx, operation, hints);
}

async function finalizeAssetInTx(
  tx: ArtifactDb,
  operation: ArtifactOperationRow,
  hints: FinalizeHints,
): Promise<ArtifactOperationResult> {
  const existing = await findExistingAsset(tx, operation);
  if (existing) {
    await markOperationCompleted(tx, operation.id, existing);
    return existing;
  }
  const actorId = operation.createdByEmployeeId ?? undefined;
  const file = await tx.fileAsset.create({
    data: {
      ...(operation.fileAssetId ? { id: operation.fileAssetId } : {}),
      displayName: operation.displayName,
      originalName: operation.originalName,
      fileType: pickFileType(undefined, operation.displayName, operation.mimeType ?? undefined),
      purpose: pickPurpose(operation.purpose ?? undefined),
      sourceModule: operation.sourceModule,
      ownerId: actorId,
      createdById: actorId,
      visibility: pickVisibility(operation.visibility),
      confidentiality: pickConfidentiality(operation.confidentiality),
      storageProvider: 'R2',
      storageKey: operation.storageKey,
      mimeType: operation.mimeType,
      sizeBytes: hints.sizeBytes ?? toSize(operation.expectedSizeBytes),
      checksum: hints.checksum ?? operation.checksum,
      versions: {
        create: buildInitialVersion({
          storageKey: operation.storageKey,
          createdById: actorId,
          sizeBytes: hints.sizeBytes ?? toSize(operation.expectedSizeBytes),
          checksum: hints.checksum ?? operation.checksum ?? undefined,
        }),
      },
      links: {
        create: buildLinkCreateInput({
          entityType: operation.entityType,
          entityId: operation.entityId,
          linkType: operation.linkType,
          linkedById: actorId,
        }),
      },
      auditEvents: { create: { action: 'created', actorId } },
    },
    include: FILE_ASSET_INCLUDE,
  });
  if (operation.folderId) {
    await tx.driveFolderItem.create({
      data: {
        folderId: operation.folderId,
        itemType: 'FILE',
        fileAssetId: file.id,
        placedById: actorId,
      },
    });
  }
  const result = {
    fileAssetId: file.id,
    fileVersionId: file.versions[0]?.id ?? null,
    fileLinkId: readCreatedLinkId(file),
  };
  await markOperationCompleted(tx, operation.id, result);
  return result;
}

async function finalizeVersionInTx(
  tx: ArtifactDb,
  operation: ArtifactOperationRow,
  hints: FinalizeHints,
): Promise<ArtifactOperationResult> {
  const fileAssetId = requireTargetAsset(operation);
  const existing = await tx.fileVersion.findFirst({
    where: { fileAssetId, storageKey: operation.storageKey },
  });
  if (existing) {
    const result = {
      fileAssetId,
      fileVersionId: existing.id,
      fileLinkId: operation.fileLinkId,
    };
    await markOperationCompleted(tx, operation.id, result);
    return result;
  }
  const latest = await tx.fileVersion.findFirst({
    where: { fileAssetId },
    orderBy: { versionNumber: 'desc' },
  });
  const versionNumber = (latest?.versionNumber ?? 0) + 1;
  await tx.fileVersion.updateMany({ where: { fileAssetId }, data: { isCurrent: false } });
  const version = await tx.fileVersion.create({
    data: {
      fileAssetId,
      versionNumber,
      storageKey: operation.storageKey,
      uploadedById: operation.createdByEmployeeId,
      sizeBytes: hints.sizeBytes ?? toSize(operation.expectedSizeBytes),
      checksum: hints.checksum ?? operation.checksum,
      changeNote: hints.changeNote?.trim() || null,
      isCurrent: true,
    },
  });
  await tx.fileAsset.update({
    where: { id: fileAssetId },
    data: {
      storageKey: operation.storageKey,
      sizeBytes: hints.sizeBytes ?? toSize(operation.expectedSizeBytes),
      checksum: hints.checksum ?? operation.checksum,
      currentVersionId: version.id,
      auditEvents: {
        create: { action: 'version_uploaded', actorId: operation.createdByEmployeeId },
      },
    },
  });
  const result = { fileAssetId, fileVersionId: version.id, fileLinkId: operation.fileLinkId };
  await markOperationCompleted(tx, operation.id, result);
  return result;
}

async function findExistingAsset(
  tx: ArtifactDb,
  operation: ArtifactOperationRow,
): Promise<ArtifactOperationResult | null> {
  if (operation.fileAssetId) {
    const byId = await tx.fileAsset.findUnique({
      where: { id: operation.fileAssetId },
      include: { versions: true, links: { where: { unlinkedAt: null } } },
    });
    if (byId) {
      return {
        fileAssetId: byId.id,
        fileVersionId: byId.versions[0]?.id ?? null,
        fileLinkId: readCreatedLinkId(byId),
      };
    }
  }
  const byKey = await tx.fileAsset.findFirst({
    where: { storageKey: operation.storageKey, deletedAt: null },
    include: { versions: true, links: { where: { unlinkedAt: null } } },
  });
  if (!byKey) return null;
  return {
    fileAssetId: byKey.id,
    fileVersionId: byKey.versions[0]?.id ?? null,
    fileLinkId: readCreatedLinkId(byKey),
  };
}

async function markOperationCompleted(
  tx: ArtifactDb,
  operationId: string,
  result: ArtifactOperationResult,
): Promise<void> {
  await tx.fileArtifactOperation.update({
    where: { id: operationId },
    data: {
      status: 'COMPLETED',
      fileAssetId: result.fileAssetId,
      fileVersionId: result.fileVersionId,
      fileLinkId: result.fileLinkId,
      failedReason: null,
    },
  });
}

function requireTargetAsset(operation: ArtifactOperationRow): string {
  if (!operation.targetFileAssetId) {
    throw new Error('CREATE_VERSION operation is missing targetFileAssetId');
  }
  return operation.targetFileAssetId;
}

function toSize(value: bigint | null): number | undefined {
  return value === null ? undefined : Number(value);
}
