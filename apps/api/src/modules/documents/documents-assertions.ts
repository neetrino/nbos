import { NotFoundException, BadRequestException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import type { DocumentAttachmentPurposeEnum } from '@nbos/database';
import {
  employeeCanReadDocumentRow,
  resolveDocumentsReadContext,
  type DocumentsReadAccess,
} from './documents-access-read';

export async function assertDocumentReadableByAccess(
  prisma: InstanceType<typeof PrismaClient>,
  id: string,
  access: DocumentsReadAccess,
): Promise<void> {
  const read = await resolveDocumentsReadContext(prisma, access);
  if (read.denied) throw new NotFoundException(`Document ${id} not found`);
  const doc = await prisma.document.findUnique({
    where: { id },
    select: {
      ownerId: true,
      createdById: true,
      listScopeOverride: true,
      section: { select: { defaultListScope: true } },
    },
  });
  if (!doc) throw new NotFoundException(`Document ${id} not found`);
  if (
    !employeeCanReadDocumentRow(
      {
        ownerId: doc.ownerId,
        createdById: doc.createdById,
        listScopeOverride: doc.listScopeOverride,
        section: doc.section,
      },
      read.viewScope,
      access.employeeId,
      read.colleagueIds,
    )
  ) {
    throw new NotFoundException(`Document ${id} not found`);
  }
}

export async function assertDocumentModifiable(
  prisma: InstanceType<typeof PrismaClient>,
  documentId: string,
): Promise<void> {
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) throw new NotFoundException(`Document ${documentId} not found`);
  if (doc.status === 'ARCHIVED') {
    throw new BadRequestException('Cannot change attachments on an archived document.');
  }
}

export async function assertFileLinkedToDocument(
  prisma: InstanceType<typeof PrismaClient>,
  fileAssetId: string,
  documentId: string,
): Promise<void> {
  const link = await prisma.fileLink.findFirst({
    where: { fileAssetId, entityType: 'DOCUMENT', entityId: documentId, unlinkedAt: null },
  });
  if (!link) {
    throw new BadRequestException(
      'File must be uploaded to this document first (Drive link DOCUMENT + document id).',
    );
  }
}

/** Ensures the caller may load bytes for this file in the context of a native document (preview / img). */
export async function assertFilePreviewableForDocument(
  prisma: InstanceType<typeof PrismaClient>,
  fileAssetId: string,
  documentId: string,
  access: DocumentsReadAccess,
): Promise<void> {
  await assertDocumentReadableByAccess(prisma, documentId, access);
  const attachment = await prisma.documentAttachment.findFirst({
    where: { documentId, fileAssetId },
  });
  if (attachment) return;
  const link = await prisma.fileLink.findFirst({
    where: { fileAssetId, entityType: 'DOCUMENT', entityId: documentId, unlinkedAt: null },
  });
  if (!link) {
    throw new NotFoundException(`File asset ${fileAssetId} not found`);
  }
}

export async function assertPurposeMatchesMime(
  prisma: InstanceType<typeof PrismaClient>,
  purpose: DocumentAttachmentPurposeEnum,
  fileAssetId: string,
): Promise<void> {
  if (purpose !== 'INLINE_IMAGE') return;
  const asset = await prisma.fileAsset.findUnique({ where: { id: fileAssetId } });
  const mime = asset?.mimeType ?? '';
  if (!mime.startsWith('image/')) {
    throw new BadRequestException('INLINE_IMAGE requires an image/* MIME type.');
  }
}
