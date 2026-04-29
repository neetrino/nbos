export interface MailAccountRow {
  id: string;
  emailAddress: string;
  displayName: string | null;
  providerType: string;
  status: string;
  lastSyncAt: string | null;
  lastErrorAt: string | null;
}

export interface MailThreadListRow {
  id: string;
  mailAccountId: string;
  subjectNormalized: string;
  lastMessageAt: string;
  lastInboundAt: string | null;
  lastOutboundAt: string | null;
  hasUnread: boolean;
  needsBusinessLink: boolean;
  status: string;
}

export interface MailRecipientRow {
  kind: string;
  email: string;
  displayName: string | null;
}

export interface MailMessageRow {
  id: string;
  direction: string;
  subject: string;
  bodyText: string | null;
  sentAt: string | null;
  receivedAt: string | null;
  readState: string;
  recipients: MailRecipientRow[];
}

export interface MailThreadDetailDto {
  mailAccount: MailAccountRow;
  thread: MailThreadListRow;
  messages: MailMessageRow[];
}
