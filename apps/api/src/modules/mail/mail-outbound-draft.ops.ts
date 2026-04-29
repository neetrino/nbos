import type { PrismaClient, TransactionClient } from '@nbos/database';
import type { CreateMailOutboundDraftDto } from './dto/create-mail-outbound-draft.dto';
import {
  buildOutboundDraftRecipients,
  dedupeEmailsCaseInsensitive,
} from './mail-outbound-draft.helpers';

export async function persistOutboundDraftMessage(
  prisma: InstanceType<typeof PrismaClient>,
  params: {
    threadId: string;
    account: { id: string; emailAddress: string; displayName: string | null };
    dto: CreateMailOutboundDraftDto;
  },
): Promise<{ messageId: string }> {
  const { threadId, account, dto } = params;
  const toList = dedupeEmailsCaseInsensitive(dto.to);
  const ccList = dedupeEmailsCaseInsensitive(dto.cc ?? []);
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
    await tx.emailThread.update({
      where: { id: threadId },
      data: {
        lastMessageAt: now,
        lastOutboundAt: now,
        hasUnread: false,
      },
    });
    return { messageId: created.id };
  });
}
