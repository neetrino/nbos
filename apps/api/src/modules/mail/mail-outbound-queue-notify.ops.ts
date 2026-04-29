import { MAIL_AUDIT_ENTITY_MESSAGE } from './mail-audit.constants';
import {
  MAIL_NOTIFICATION_TITLE_OUTBOUND_MESSAGE_QUEUED_IN_APP,
  MAIL_NOTIFICATION_TYPE_OUTBOUND_MESSAGE_QUEUED_IN_APP,
} from './mail-notification.constants';
import { mailThreadDetailAppPath } from './mail-thread-app-path';

type NotificationSink = {
  create: (params: {
    type: string;
    recipientId: string;
    title: string;
    body: string;
    link?: string;
    entityType?: string;
    entityId?: string;
  }) => Promise<unknown>;
};

/**
 * Notifies the actor and (if different) the mailbox owner after an outbound draft is queued (stub; no SMTP yet).
 */
export async function publishMailOutboundQueuedNotifications(
  sink: NotificationSink,
  params: {
    actorEmployeeId: string;
    threadId: string;
    messageId: string;
    subject: string;
    emailAddress: string;
    ownerEmployeeId: string | null;
  },
): Promise<void> {
  const subjectPreview = params.subject.trim() || '(No subject)';
  const body = `Outbound for “${subjectPreview}” from ${params.emailAddress} was queued for send (stub; no mail worker or SMTP yet).`;
  const base = {
    type: MAIL_NOTIFICATION_TYPE_OUTBOUND_MESSAGE_QUEUED_IN_APP,
    title: MAIL_NOTIFICATION_TITLE_OUTBOUND_MESSAGE_QUEUED_IN_APP,
    body,
    link: mailThreadDetailAppPath(params.threadId),
    entityType: MAIL_AUDIT_ENTITY_MESSAGE,
    entityId: params.messageId,
  };
  await sink.create({ ...base, recipientId: params.actorEmployeeId });
  const ownerId = params.ownerEmployeeId;
  if (ownerId && ownerId !== params.actorEmployeeId) {
    await sink.create({ ...base, recipientId: ownerId });
  }
}
