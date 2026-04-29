import { MAIL_AUDIT_ENTITY_MESSAGE } from './mail-audit.constants';
import {
  MAIL_NOTIFICATION_TITLE_OUTBOUND_DRAFT_CREATED_IN_APP,
  MAIL_NOTIFICATION_TYPE_OUTBOUND_DRAFT_CREATED_IN_APP,
} from './mail-notification.constants';
import { mailThreadDetailAppPath } from './mail-thread-app-path';
import type { MailInAppNotificationSink } from './mail-in-app-notification-sink.types';

/**
 * Notifies the actor and (if different) the mailbox owner after an outbound draft is saved (no SMTP).
 */
export async function publishMailOutboundDraftCreatedNotifications(
  sink: MailInAppNotificationSink,
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
  const body = `Draft outbound for “${subjectPreview}” from ${params.emailAddress} was saved (not sent).`;
  const base = {
    type: MAIL_NOTIFICATION_TYPE_OUTBOUND_DRAFT_CREATED_IN_APP,
    title: MAIL_NOTIFICATION_TITLE_OUTBOUND_DRAFT_CREATED_IN_APP,
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
