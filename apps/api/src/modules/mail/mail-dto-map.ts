import type {
  MailAttachmentRow,
  MailAccountRow,
  MailMessageRow,
  MailProviderConnectionRow,
  MailRecipientRow,
  MailThreadListRow,
} from './mail.types';

export interface MessageWithRecipients {
  id: string;
  direction: string;
  subject: string;
  bodyText: string | null;
  bodyHtmlSanitized: string | null;
  sentAt: Date | null;
  receivedAt: Date | null;
  readState: string;
  deliveryStatus: string | null;
  recipients: Array<{ kind: string; email: string; displayName: string | null }>;
  attachments: Array<{
    id: string;
    fileAssetId: string;
    fileName: string;
    mimeType: string | null;
    sizeBytes: bigint | null;
    providerAttachmentId: string | null;
    isInline: boolean;
    downloadStatus: string;
    createdAt: Date;
  }>;
}

function toProviderConnectionRow(
  row: {
    id: string;
    providerType: string;
    status: string;
    credentialId: string | null;
    providerAccountId: string | null;
    username: string | null;
    imapHost: string | null;
    imapPort: number | null;
    smtpHost: string | null;
    smtpPort: number | null;
    secureMode: string | null;
    lastValidatedAt: Date | null;
    lastErrorAt: Date | null;
    lastErrorMessage: string | null;
  } | null,
): MailProviderConnectionRow | null {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    providerType: row.providerType,
    status: row.status,
    credentialId: row.credentialId,
    providerAccountId: row.providerAccountId,
    username: row.username,
    imapHost: row.imapHost,
    imapPort: row.imapPort,
    smtpHost: row.smtpHost,
    smtpPort: row.smtpPort,
    secureMode: row.secureMode,
    lastValidatedAt: row.lastValidatedAt?.toISOString() ?? null,
    lastErrorAt: row.lastErrorAt?.toISOString() ?? null,
    lastErrorMessage: row.lastErrorMessage,
  };
}

export function toAccountRow(row: {
  id: string;
  emailAddress: string;
  displayName: string | null;
  providerType: string;
  status: string;
  lastSyncAt: Date | null;
  lastErrorAt: Date | null;
  providerConnection?: Parameters<typeof toProviderConnectionRow>[0];
}): MailAccountRow {
  return {
    id: row.id,
    emailAddress: row.emailAddress,
    displayName: row.displayName,
    providerType: row.providerType,
    status: row.status,
    lastSyncAt: row.lastSyncAt?.toISOString() ?? null,
    lastErrorAt: row.lastErrorAt?.toISOString() ?? null,
    providerConnection: toProviderConnectionRow(row.providerConnection ?? null),
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
  isSpam: boolean;
  status: string;
  assignedToEmployeeId?: string | null;
  assignedTo?: { firstName: string; lastName: string } | null;
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
    isSpam: row.isSpam,
    status: row.status,
    assignedToEmployeeId: row.assignedToEmployeeId ?? null,
    assignedToName: row.assignedTo
      ? `${row.assignedTo.firstName} ${row.assignedTo.lastName}`.trim()
      : null,
  };
}

function toRecipientRow(r: {
  kind: string;
  email: string;
  displayName: string | null;
}): MailRecipientRow {
  return { kind: r.kind, email: r.email, displayName: r.displayName };
}

function toAttachmentRow(a: MessageWithRecipients['attachments'][number]): MailAttachmentRow {
  return {
    id: a.id,
    fileAssetId: a.fileAssetId,
    fileName: a.fileName,
    mimeType: a.mimeType,
    sizeBytes: a.sizeBytes?.toString() ?? null,
    providerAttachmentId: a.providerAttachmentId,
    isInline: a.isInline,
    downloadStatus: a.downloadStatus,
    createdAt: a.createdAt.toISOString(),
  };
}

export function toMessageRow(m: MessageWithRecipients): MailMessageRow {
  return {
    id: m.id,
    direction: m.direction,
    subject: m.subject,
    bodyText: m.bodyText,
    bodyHtmlSanitized: m.bodyHtmlSanitized,
    sentAt: m.sentAt?.toISOString() ?? null,
    receivedAt: m.receivedAt?.toISOString() ?? null,
    readState: m.readState,
    deliveryStatus: m.deliveryStatus ?? null,
    recipients: m.recipients.map(toRecipientRow),
    attachments: m.attachments.map(toAttachmentRow),
  };
}
