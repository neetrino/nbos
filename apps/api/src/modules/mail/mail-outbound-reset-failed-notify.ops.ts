import { MAIL_AUDIT_ENTITY_MESSAGE } from './mail-audit.constants';
import {
  MAIL_NOTIFICATION_TITLE_OUTBOUND_FAILED_RESET_TO_DRAFT,
  MAIL_NOTIFICATION_TYPE_OUTBOUND_FAILED_RESET_TO_DRAFT,
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
 * Notifies the actor and (if different) the mailbox owner after FAILED outbound is reset to DRAFT.
 */
export async function publishMailOutboundFailedResetToDraftNotifications(
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
  const body = `Failed send for “${subjectPreview}” from ${params.emailAddress} was reset to draft for retry.`;
  const base = {
    type: MAIL_NOTIFICATION_TYPE_OUTBOUND_FAILED_RESET_TO_DRAFT,
    title: MAIL_NOTIFICATION_TITLE_OUTBOUND_FAILED_RESET_TO_DRAFT,
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
