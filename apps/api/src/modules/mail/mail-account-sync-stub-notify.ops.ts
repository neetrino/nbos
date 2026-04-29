import { MAIL_AUDIT_ENTITY_MAIL_ACCOUNT } from './mail-audit.constants';
import {
  MAIL_NOTIFICATION_TITLE_ACCOUNT_SYNC_STUB,
  MAIL_NOTIFICATION_TYPE_ACCOUNT_SYNC_STUB,
} from './mail-notification.constants';

const INBOX_LINK = '/mail';

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
 * Notifies the actor and (if different) the mailbox owner about a stub sync.
 */
export async function publishMailAccountSyncStubNotifications(
  sink: NotificationSink,
  params: {
    actorEmployeeId: string;
    accountId: string;
    emailAddress: string;
    ownerEmployeeId: string | null;
  },
): Promise<void> {
  const body = `Stub sync for ${params.emailAddress}: timestamps updated; no provider fetch ran.`;
  const base = {
    type: MAIL_NOTIFICATION_TYPE_ACCOUNT_SYNC_STUB,
    title: MAIL_NOTIFICATION_TITLE_ACCOUNT_SYNC_STUB,
    body,
    link: INBOX_LINK,
    entityType: MAIL_AUDIT_ENTITY_MAIL_ACCOUNT,
    entityId: params.accountId,
  };
  await sink.create({ ...base, recipientId: params.actorEmployeeId });
  const ownerId = params.ownerEmployeeId;
  if (ownerId && ownerId !== params.actorEmployeeId) {
    await sink.create({ ...base, recipientId: ownerId });
  }
}
