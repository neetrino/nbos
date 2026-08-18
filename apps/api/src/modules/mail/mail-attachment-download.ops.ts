import type { Prisma, PrismaClient } from '@nbos/database';
import { MAIL_ATTACHMENT_MAX_BYTES } from './mail-attachment.constants';

export type MailAttachmentDownloadRow = Prisma.EmailAttachmentGetPayload<{
  include: {
    message: {
      include: {
        mailAccount: { include: { providerConnection: true } };
      };
    };
  };
}>;

export async function loadAttachmentDownloadRow(
  prisma: InstanceType<typeof PrismaClient>,
  attachmentId: string,
): Promise<MailAttachmentDownloadRow | null> {
  return prisma.emailAttachment.findUnique({
    where: { id: attachmentId },
    include: {
      message: {
        include: {
          mailAccount: { include: { providerConnection: true } },
        },
      },
    },
  });
}

export function isStoredAttachmentOversize(sizeBytes: bigint | null): boolean {
  const value = sizeBytes == null ? null : Number(sizeBytes);
  return value != null && value > MAIL_ATTACHMENT_MAX_BYTES;
}

export async function markAttachmentFailed(
  prisma: InstanceType<typeof PrismaClient>,
  attachmentId: string,
): Promise<void> {
  await prisma.emailAttachment.update({
    where: { id: attachmentId },
    data: { downloadStatus: 'FAILED' },
  });
}

export async function markAttachmentReady(
  prisma: InstanceType<typeof PrismaClient>,
  attachmentId: string,
  fileAssetId: string,
  sizeBytes: number,
): Promise<void> {
  await prisma.emailAttachment.update({
    where: { id: attachmentId },
    data: { downloadStatus: 'READY', fileAssetId, sizeBytes: BigInt(sizeBytes) },
  });
}
