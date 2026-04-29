import type {
  MailAccountRow,
  MailMessageRow,
  MailRecipientRow,
  MailThreadListRow,
} from './mail.types';

export interface MessageWithRecipients {
  id: string;
  direction: string;
  subject: string;
  bodyText: string | null;
  sentAt: Date | null;
  receivedAt: Date | null;
  readState: string;
  deliveryStatus: string | null;
  recipients: Array<{ kind: string; email: string; displayName: string | null }>;
}

export function toAccountRow(row: {
  id: string;
  emailAddress: string;
  displayName: string | null;
  providerType: string;
  status: string;
  lastSyncAt: Date | null;
  lastErrorAt: Date | null;
}): MailAccountRow {
  return {
    id: row.id,
    emailAddress: row.emailAddress,
    displayName: row.displayName,
    providerType: row.providerType,
    status: row.status,
    lastSyncAt: row.lastSyncAt?.toISOString() ?? null,
    lastErrorAt: row.lastErrorAt?.toISOString() ?? null,
  };
}

export function toThreadListRow(row: {
  id: string;
  mailAccountId: string;
  subjectNormalized: string;
  lastMessageAt: Date;
  lastInboundAt: Date | null;
  lastOutboundAt: Date | null;
  hasUnread: boolean;
  needsBusinessLink: boolean;
  status: string;
}): MailThreadListRow {
  return {
    id: row.id,
    mailAccountId: row.mailAccountId,
    subjectNormalized: row.subjectNormalized,
    lastMessageAt: row.lastMessageAt.toISOString(),
    lastInboundAt: row.lastInboundAt?.toISOString() ?? null,
    lastOutboundAt: row.lastOutboundAt?.toISOString() ?? null,
    hasUnread: row.hasUnread,
    needsBusinessLink: row.needsBusinessLink,
    status: row.status,
  };
}

function toRecipientRow(r: {
  kind: string;
  email: string;
  displayName: string | null;
}): MailRecipientRow {
  return { kind: r.kind, email: r.email, displayName: r.displayName };
}

export function toMessageRow(m: MessageWithRecipients): MailMessageRow {
  return {
    id: m.id,
    direction: m.direction,
    subject: m.subject,
    bodyText: m.bodyText,
    sentAt: m.sentAt?.toISOString() ?? null,
    receivedAt: m.receivedAt?.toISOString() ?? null,
    readState: m.readState,
    deliveryStatus: m.deliveryStatus ?? null,
    recipients: m.recipients.map(toRecipientRow),
  };
}
