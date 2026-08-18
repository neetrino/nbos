import { MailDeliveryLogKind, PrismaClient, type InputJsonValue } from '@nbos/database';
import { AuditService } from '../audit/audit.service';
import {
  MAIL_AUDIT_ACTION_OUTBOUND_SEND_FAILED,
  MAIL_AUDIT_ACTION_OUTBOUND_SENT,
  MAIL_AUDIT_ENTITY_MESSAGE,
} from './mail-audit.constants';
import { appendMailDeliveryLog } from './mail-delivery-log-append.ops';

const LAST_ERROR_MAX_CHARS = 400;

export async function markOutboundSent(params: {
  prisma: InstanceType<typeof PrismaClient>;
  auditService: AuditService;
  messageId: string;
  mailAccountId: string;
  actorEmployeeId: string;
  providerMessageId: string | null;
  messageIdHeader: string | null;
}): Promise<void> {
  const now = new Date();
  const message = await params.prisma.emailMessage.update({
    where: { id: params.messageId },
    data: {
      deliveryStatus: 'SENT',
      sentAt: now,
      ...(params.providerMessageId ? { providerMessageId: params.providerMessageId } : {}),
      ...(params.messageIdHeader ? { messageIdHeader: params.messageIdHeader } : {}),
    },
    select: { threadId: true },
  });
  await params.prisma.emailThread.update({
    where: { id: message.threadId },
    data: { lastOutboundAt: now, lastMessageAt: now },
  });
  await appendMailDeliveryLog(params.prisma, {
    emailMessageId: params.messageId,
    mailAccountId: params.mailAccountId,
    actorEmployeeId: params.actorEmployeeId,
    kind: MailDeliveryLogKind.OUTBOUND_SENT,
  });
  const changes: InputJsonValue = { mailAccountId: params.mailAccountId };
  await params.auditService.log({
    entityType: MAIL_AUDIT_ENTITY_MESSAGE,
    entityId: params.messageId,
    action: MAIL_AUDIT_ACTION_OUTBOUND_SENT,
    userId: params.actorEmployeeId,
    changes,
  });
}

export async function markOutboundFailed(params: {
  prisma: InstanceType<typeof PrismaClient>;
  auditService: AuditService;
  messageId: string;
  mailAccountId: string;
  actorEmployeeId: string;
  detail: string;
  kind: MailDeliveryLogKind;
}): Promise<void> {
  await params.prisma.emailMessage.update({
    where: { id: params.messageId },
    data: { deliveryStatus: 'FAILED' },
  });
  await appendMailDeliveryLog(params.prisma, {
    emailMessageId: params.messageId,
    mailAccountId: params.mailAccountId,
    actorEmployeeId: params.actorEmployeeId,
    kind: params.kind,
    detail: params.detail,
  });
  const changes: InputJsonValue = { mailAccountId: params.mailAccountId, error: params.detail };
  await params.auditService.log({
    entityType: MAIL_AUDIT_ENTITY_MESSAGE,
    entityId: params.messageId,
    action: MAIL_AUDIT_ACTION_OUTBOUND_SEND_FAILED,
    userId: params.actorEmployeeId,
    changes,
  });
}

export async function markMailboxNeedsReconnect(
  prisma: InstanceType<typeof PrismaClient>,
  mailAccountId: string,
  detail: string,
): Promise<void> {
  const clipped = detail.slice(0, LAST_ERROR_MAX_CHARS);
  const now = new Date();
  await prisma.mailAccount.updateMany({
    where: { id: mailAccountId },
    data: { status: 'NEEDS_RECONNECT', lastErrorAt: now },
  });
  await prisma.mailProviderConnection.updateMany({
    where: { mailAccountId },
    data: { status: 'NEEDS_RECONNECT', lastErrorAt: now, lastErrorMessage: clipped },
  });
}
