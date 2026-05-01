import { MAIL_AUDIT_ENTITY_MESSAGE } from './mail-audit.constants';
import {
  MAIL_NOTIFICATION_TITLE_OUTBOUND_SEND_STUB_FAILED,
  MAIL_NOTIFICATION_TYPE_OUTBOUND_SEND_STUB_FAILED,
} from './mail-notification.constants';
import { mailThreadDetailAppPath } from './mail-thread-app-path';
import { MAIL_OUTBOUND_STUB_FAIL_REASON_NO_PROVIDER } from './mail-outbound-stub.constants';
import type { MailInAppNotificationSink } from './mail-in-app-notification-sink.types';

/**
 * Notifies the actor and (if different) the mailbox owner after stub finalize sets outbound FAILED.
 */
export async function publishMailOutboundSendStubFailedNotifications(
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
  const body = `Queued send for “${subjectPreview}” from ${params.emailAddress} was marked FAILED (${MAIL_OUTBOUND_STUB_FAIL_REASON_NO_PROVIDER}).`;
  const base = {
    type: MAIL_NOTIFICATION_TYPE_OUTBOUND_SEND_STUB_FAILED,
    title: MAIL_NOTIFICATION_TITLE_OUTBOUND_SEND_STUB_FAILED,
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
