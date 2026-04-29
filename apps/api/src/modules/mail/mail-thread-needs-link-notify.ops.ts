import { MAIL_AUDIT_ENTITY_THREAD } from './mail-audit.constants';
import {
  MAIL_NOTIFICATION_TITLE_THREAD_NEEDS_LINK_CLEARED,
  MAIL_NOTIFICATION_TITLE_THREAD_NEEDS_LINK_FLAGGED,
  MAIL_NOTIFICATION_TYPE_THREAD_NEEDS_LINK_CLEARED,
  MAIL_NOTIFICATION_TYPE_THREAD_NEEDS_LINK_FLAGGED,
} from './mail-notification.constants';
import { mailThreadDetailAppPath } from './mail-thread-app-path';
import type { MailInAppNotificationSink } from './mail-in-app-notification-sink.types';

/**
 * Notifies the actor and (if different) the mailbox owner when `needsBusinessLink` changes.
 */
export async function publishMailThreadNeedsLinkChangedNotifications(
  sink: MailInAppNotificationSink,
  params: {
    actorEmployeeId: string;
    threadId: string;
    to: boolean;
    subjectNormalized: string;
    emailAddress: string;
    ownerEmployeeId: string | null;
  },
): Promise<void> {
  const flagged = params.to;
  const subjectPreview = params.subjectNormalized.trim() || '(No subject)';
  const body = flagged
    ? `Thread “${subjectPreview}” (${params.emailAddress}) was flagged as needing a business link.`
    : `Thread “${subjectPreview}” (${params.emailAddress}) no longer has the needs-link flag.`;
  const base = {
    type: flagged
      ? MAIL_NOTIFICATION_TYPE_THREAD_NEEDS_LINK_FLAGGED
      : MAIL_NOTIFICATION_TYPE_THREAD_NEEDS_LINK_CLEARED,
    title: flagged
      ? MAIL_NOTIFICATION_TITLE_THREAD_NEEDS_LINK_FLAGGED
      : MAIL_NOTIFICATION_TITLE_THREAD_NEEDS_LINK_CLEARED,
    body,
    link: mailThreadDetailAppPath(params.threadId),
    entityType: MAIL_AUDIT_ENTITY_THREAD,
    entityId: params.threadId,
  };
  await sink.create({ ...base, recipientId: params.actorEmployeeId });
  const ownerId = params.ownerEmployeeId;
  if (ownerId && ownerId !== params.actorEmployeeId) {
    await sink.create({ ...base, recipientId: ownerId });
  }
}
