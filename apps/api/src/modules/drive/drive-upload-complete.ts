import type { Prisma } from '@nbos/database';
import type { CompleteUploadSessionDto, FileUploadSessionCompleteRow } from './drive.types';
import {
  buildInitialVersion,
  buildLinkCreateInput,
  pickConfidentiality,
  pickFileType,
  pickPurpose,
  pickVisibility,
} from './drive-metadata';

/**
 * Builds Prisma create input for a File Asset after a successful R2 upload session.
 */
export function buildFileAssetCreateInputForCompletedSession(
  session: FileUploadSessionCompleteRow,
  userId: string,
  complete: CompleteUploadSessionDto,
): Prisma.FileAssetCreateInput {
  const versionFields = {
    storageKey: session.storageKey,
    createdById: userId,
    sizeBytes: complete.sizeBytes,
    checksum: complete.checksum,
  };
  return {
    displayName: session.displayName,
    originalName: session.originalName,
    fileType: pickFileType(
      undefined,
      session.displayName,
      session.mimeType ?? undefined,
      undefined,
    ),
    purpose: pickPurpose(session.purpose ?? undefined),
    sourceModule: session.sourceModule,
    ownerId: userId,
    createdById: userId,
    visibility: pickVisibility(session.visibility),
    confidentiality: pickConfidentiality(session.confidentiality),
    storageProvider: 'R2',
    storageKey: session.storageKey,
    mimeType: session.mimeType,
    sizeBytes: complete.sizeBytes,
    checksum: complete.checksum,
    versions: { create: buildInitialVersion(versionFields) },
    links: {
      create: buildLinkCreateInput({
        entityType: session.entityType,
        entityId: session.entityId,
        linkType: session.linkType,
        linkedById: userId,
      }),
    },
    auditEvents: { create: { action: 'created', actorId: userId } },
  };
}
