import type { PrismaClient, TransactionClient } from '@nbos/database';
import type { CreateMailOutboundDraftDto } from './dto/create-mail-outbound-draft.dto';
import {
  buildOutboundDraftRecipients,
  dedupeEmailsCaseInsensitive,
} from './mail-outbound-draft.helpers';
import { normalizeEmailSubject, sanitizeEmailHtml } from './providers/mail-html-sanitize';

export async function updateOutboundDraftMessage(
  prisma: InstanceType<typeof PrismaClient>,
  params: {
    threadId: string;
    messageId: string;
    account: { emailAddress: string; displayName: string | null };
    dto: CreateMailOutboundDraftDto;
  },
): Promise<boolean> {
  const toList = dedupeEmailsCaseInsensitive(params.dto.to ?? []);
  const ccList = dedupeEmailsCaseInsensitive(params.dto.cc ?? []);
  const subject = params.dto.subject?.trim() ?? '';
  const now = new Date();
  return prisma.$transaction(async (tx: TransactionClient) => {
    const updated = await tx.emailMessage.updateMany({
      where: {
        id: params.messageId,
        threadId: params.threadId,
        direction: 'OUTBOUND',
        deliveryStatus: 'DRAFT',
      },
      data: {
        subject,
        bodyText: params.dto.bodyText ?? '',
        bodyHtmlSanitized: sanitizeEmailHtml(params.dto.bodyHtml ?? null),
      },
    });
    if (updated.count === 0) {
      return false;
    }
    await replaceOutboundDraftRecipients(tx, {
      messageId: params.messageId,
      account: params.account,
      toList,
      ccList,
    });
    await tx.emailThread.update({
      where: { id: params.threadId },
      data: {
        lastMessageAt: now,
        subjectNormalized: normalizeEmailSubject(subject) || '(no subject)',
      },
    });
    return true;
  });
}

async function replaceOutboundDraftRecipients(
  tx: TransactionClient,
  params: {
    messageId: string;
    account: { emailAddress: string; displayName: string | null };
    toList: string[];
    ccList: string[];
  },
): Promise<void> {
  await tx.emailRecipient.deleteMany({
    where: { messageId: params.messageId, kind: { in: ['TO', 'CC'] } },
  });
  const rows = buildOutboundDraftRecipients(
    params.messageId,
    params.account,
    params.toList,
    params.ccList,
  ).filter((row) => row.kind !== 'FROM');
  if (rows.length === 0) {
    return;
  }
  await tx.emailRecipient.createMany({ data: rows });
}
