import { EmailRecipientKind, type PrismaClient, type TransactionClient } from '@nbos/database';
import {
  persistInboundAttachments,
  type MailPendingAttachmentDownload,
} from './mail-sync-upsert-attachments.ops';
import { isUniqueConstraintError } from './mail-unique-violation';
import type { NormalizedMessage } from './providers/mail-provider-adapter';
import { normalizeEmailSubject, sanitizeEmailHtml } from './providers/mail-html-sanitize';

export type UpsertNormalizedMessagesResult = {
  stored: number;
  pendingDownloads: MailPendingAttachmentDownload[];
};

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

async function persistRecipients(
  tx: TransactionClient,
  messageId: string,
  message: NormalizedMessage,
): Promise<void> {
  if (message.recipients.length === 0) {
    return;
  }
  await tx.emailRecipient.createMany({
    data: message.recipients.map((r) => ({
      messageId,
      kind: r.kind as EmailRecipientKind,
      email: r.email,
      displayName: r.displayName,
    })),
  });
}

async function persistMessage(
  tx: TransactionClient,
  mailAccountId: string,
  threadId: string,
  message: NormalizedMessage,
): Promise<MailPendingAttachmentDownload[] | null> {
  const existing = await tx.emailMessage.findFirst({
    where: { mailAccountId, providerMessageId: message.providerMessageId },
    select: { id: true },
  });
  if (existing) {
    return null;
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
  await persistRecipients(tx, created.id, message);
  const pendingDownloads = await persistInboundAttachments(tx, created.id, message.attachments);
  await tx.emailThread.update({
    where: { id: threadId },
    data: {
      lastMessageAt: message.receivedAt ?? new Date(),
      lastInboundAt: message.receivedAt ?? new Date(),
      hasUnread: true,
    },
  });
  return pendingDownloads;
}

/**
 * Normalizes provider messages into EmailThread/EmailMessage/EmailRecipient,
 * deduping by providerMessageId. Unique skip does not re-enqueue attachments.
 */
export async function upsertNormalizedMessages(
  prisma: InstanceType<typeof PrismaClient>,
  mailAccountId: string,
  messages: NormalizedMessage[],
): Promise<UpsertNormalizedMessagesResult> {
  let stored = 0;
  const pendingDownloads: MailPendingAttachmentDownload[] = [];
  for (const message of messages) {
    try {
      const inserted = await prisma.$transaction(async (tx: TransactionClient) => {
        const threadId = await resolveThreadId(tx, mailAccountId, message);
        return persistMessage(tx, mailAccountId, threadId, message);
      });
      if (inserted) {
        stored += 1;
        pendingDownloads.push(...inserted);
      }
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }
    }
  }
  return { stored, pendingDownloads };
}
