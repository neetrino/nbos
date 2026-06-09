import type { PrismaClient } from '@nbos/database';
import type { ConnectionForAdapter } from './providers/mail-provider-adapter.factory';
import type { SendMessageInput } from './providers/mail-provider-adapter';

export interface OutboundSendContext {
  connection: ConnectionForAdapter;
  fromEmail: string;
  fromName: string | null;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  bodyText: string;
  bodyHtml: string | null;
  providerThreadId: string | null;
  inReplyToMessageIdHeader: string | null;
  references: string | null;
}

function recipientsByKind(
  recipients: Array<{ kind: string; email: string }>,
  kind: string,
): string[] {
  return recipients.filter((r) => r.kind === kind).map((r) => r.email);
}

/** Loads everything needed to send a QUEUED outbound message; null if not sendable. */
export async function loadOutboundSendContext(
  prisma: InstanceType<typeof PrismaClient>,
  mailAccountId: string,
  messageId: string,
): Promise<OutboundSendContext | null> {
  const message = await prisma.emailMessage.findUnique({
    where: { id: messageId },
    include: { recipients: true, thread: { select: { providerThreadId: true } } },
  });
  if (
    !message ||
    message.mailAccountId !== mailAccountId ||
    message.direction !== 'OUTBOUND' ||
    message.deliveryStatus !== 'QUEUED'
  ) {
    return null;
  }
  const account = await prisma.mailAccount.findUnique({
    where: { id: mailAccountId },
    include: { providerConnection: true },
  });
  if (!account?.providerConnection) {
    return null;
  }
  const conn = account.providerConnection;
  const lastInbound = await prisma.emailMessage.findFirst({
    where: { threadId: message.threadId, direction: 'INBOUND', messageIdHeader: { not: null } },
    orderBy: { receivedAt: 'desc' },
    select: { messageIdHeader: true },
  });
  return {
    connection: {
      mailAccountId,
      emailAddress: account.emailAddress,
      displayName: account.displayName,
      providerType: account.providerType,
      username: conn.username,
      imapHost: conn.imapHost,
      imapPort: conn.imapPort,
      secureMode: conn.secureMode,
      smtpHost: conn.smtpHost,
      smtpPort: conn.smtpPort,
      smtpSecureMode: conn.smtpSecureMode,
    },
    fromEmail: account.emailAddress,
    fromName: account.displayName,
    to: recipientsByKind(message.recipients, 'TO'),
    cc: recipientsByKind(message.recipients, 'CC'),
    bcc: recipientsByKind(message.recipients, 'BCC'),
    subject: message.subject,
    bodyText: message.bodyText ?? '',
    bodyHtml: message.bodyHtmlSanitized,
    providerThreadId: message.thread.providerThreadId,
    inReplyToMessageIdHeader: lastInbound?.messageIdHeader ?? null,
    references: lastInbound?.messageIdHeader ?? null,
  };
}

export function buildSendMessageInput(context: OutboundSendContext): SendMessageInput {
  return {
    fromEmail: context.fromEmail,
    fromName: context.fromName,
    to: context.to,
    cc: context.cc,
    bcc: context.bcc,
    subject: context.subject,
    bodyText: context.bodyText,
    bodyHtml: context.bodyHtml ?? undefined,
    inReplyToMessageIdHeader: context.inReplyToMessageIdHeader,
    references: context.references,
    providerThreadId: context.providerThreadId,
  };
}
