import { NotFoundException } from '@nestjs/common';
import { MailDeliveryLogKind, type PrismaClient, type TransactionClient } from '@nbos/database';
import type { CreateMailOutboundDraftDto } from './dto/create-mail-outbound-draft.dto';
import {
  buildOutboundDraftRecipients,
  dedupeEmailsCaseInsensitive,
} from './mail-outbound-draft.helpers';

function uniqueFileAssetIds(dto: CreateMailOutboundDraftDto): string[] {
  return [...new Set(dto.fileAssetIds?.map((id) => id.trim()).filter(Boolean) ?? [])];
}

async function createDraftAttachments(
  tx: TransactionClient,
  messageId: string,
  fileAssetIds: string[],
): Promise<void> {
  if (fileAssetIds.length === 0) {
    return;
  }
  const assets = await tx.fileAsset.findMany({
    where: { id: { in: fileAssetIds } },
    select: { id: true, displayName: true, originalName: true, mimeType: true, sizeBytes: true },
  });
  if (assets.length !== fileAssetIds.length) {
    throw new NotFoundException('One or more Drive FileAsset attachments were not found');
  }
  await tx.emailAttachment.createMany({
    data: assets.map((asset) => ({
      messageId,
      fileAssetId: asset.id,
      fileName: asset.originalName ?? asset.displayName,
      mimeType: asset.mimeType,
      sizeBytes: asset.sizeBytes,
      downloadStatus: 'READY',
    })),
  });
}

export async function persistOutboundDraftMessage(
  prisma: InstanceType<typeof PrismaClient>,
  params: {
    threadId: string;
    actorEmployeeId: string;
    account: { id: string; emailAddress: string; displayName: string | null };
    dto: CreateMailOutboundDraftDto;
  },
): Promise<{ messageId: string }> {
  const { threadId, account, dto, actorEmployeeId } = params;
  const toList = dedupeEmailsCaseInsensitive(dto.to);
  const ccList = dedupeEmailsCaseInsensitive(dto.cc ?? []);
  const fileAssetIds = uniqueFileAssetIds(dto);
  const now = new Date();
  return prisma.$transaction(async (tx: TransactionClient) => {
    const created = await tx.emailMessage.create({
      data: {
        threadId,
        mailAccountId: account.id,
        direction: 'OUTBOUND',
        subject: dto.subject,
        bodyText: dto.bodyText,
        readState: 'READ',
        deliveryStatus: 'DRAFT',
      },
    });
    await tx.emailRecipient.createMany({
      data: buildOutboundDraftRecipients(created.id, account, toList, ccList),
    });
    await createDraftAttachments(tx, created.id, fileAssetIds);
    await tx.emailThread.update({
      where: { id: threadId },
      data: {
        lastMessageAt: now,
        lastOutboundAt: now,
        hasUnread: false,
      },
    });
    await tx.mailDeliveryLog.create({
      data: {
        emailMessageId: created.id,
        mailAccountId: account.id,
        actorEmployeeId,
        kind: MailDeliveryLogKind.OUTBOUND_DRAFT_SAVED,
      },
    });
    return { messageId: created.id };
  });
}
