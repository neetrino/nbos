import { EmailRecipientKind, type PrismaClient, type TransactionClient } from '@nbos/database';
import type { NormalizedMessage } from './providers/mail-provider-adapter';
import { normalizeEmailSubject, sanitizeEmailHtml } from './providers/mail-html-sanitize';

async function resolveThreadId(
  tx: TransactionClient,
  mailAccountId: string,
  message: NormalizedMessage,
): Promise<string> {
  const subjectNormalized = normalizeEmailSubject(message.subject);
  const receivedAt = message.receivedAt ?? new Date();
  if (message.providerThreadId) {
    const existing = await tx.emailThread.findFirst({
      where: { mailAccountId, providerThreadId: message.providerThreadId },
      select: { id: true },
    });
    if (existing) {
      return existing.id;
    }
  }
  const created = await tx.emailThread.create({
    data: {
      mailAccountId,
      providerThreadId: message.providerThreadId,
      subjectNormalized: subjectNormalized || '(no subject)',
      lastMessageAt: receivedAt,
      lastInboundAt: receivedAt,
      hasUnread: true,
    },
  });
  return created.id;
}

async function persistMessage(
  tx: TransactionClient,
  mailAccountId: string,
  threadId: string,
  message: NormalizedMessage,
): Promise<boolean> {
  const existing = await tx.emailMessage.findFirst({
    where: { mailAccountId, providerMessageId: message.providerMessageId },
    select: { id: true },
  });
  if (existing) {
    return false;
  }
  const created = await tx.emailMessage.create({
    data: {
      threadId,
      mailAccountId,
      providerMessageId: message.providerMessageId,
      messageIdHeader: message.messageIdHeader,
      direction: 'INBOUND',
      subject: message.subject,
      bodyText: message.bodyText,
      bodyHtmlSanitized: sanitizeEmailHtml(message.bodyHtml),
      receivedAt: message.receivedAt,
      sentAt: message.sentAt,
      readState: 'UNREAD',
    },
  });
  if (message.recipients.length > 0) {
    await tx.emailRecipient.createMany({
      data: message.recipients.map((r) => ({
        messageId: created.id,
        kind: r.kind as EmailRecipientKind,
        email: r.email,
        displayName: r.displayName,
      })),
    });
  }
  await tx.emailThread.update({
    where: { id: threadId },
    data: {
      lastMessageAt: message.receivedAt ?? new Date(),
      lastInboundAt: message.receivedAt ?? new Date(),
      hasUnread: true,
    },
  });
  return true;
}

/**
 * Normalizes provider messages into EmailThread/EmailMessage/EmailRecipient,
 * deduping by providerMessageId. Returns the count of newly stored inbound messages.
 */
export async function upsertNormalizedMessages(
  prisma: InstanceType<typeof PrismaClient>,
  mailAccountId: string,
  messages: NormalizedMessage[],
): Promise<number> {
  let stored = 0;
  for (const message of messages) {
    const inserted = await prisma.$transaction(async (tx: TransactionClient) => {
      const threadId = await resolveThreadId(tx, mailAccountId, message);
      return persistMessage(tx, mailAccountId, threadId, message);
    });
    if (inserted) {
      stored += 1;
    }
  }
  return stored;
}
