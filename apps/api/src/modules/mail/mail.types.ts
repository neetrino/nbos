export interface MailAccountRow {
  id: string;
  emailAddress: string;
  displayName: string | null;
  providerType: string;
  status: string;
  lastSyncAt: string | null;
  lastErrorAt: string | null;
  providerConnection: MailProviderConnectionRow | null;
}

export interface MailProviderConnectionRow {
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
  lastValidatedAt: string | null;
  lastErrorAt: string | null;
  lastErrorMessage: string | null;
}

/** Thread aggregates per mailbox for health / overview UI (no live provider probe). */
export interface MailAccountHealthSummaryRow extends MailAccountRow {
  threadCount: number;
  unreadThreadCount: number;
  needsLinkThreadCount: number;
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
  assignedToEmployeeId: string | null;
  assignedToName: string | null;
}

export interface MailThreadListPageMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface MailThreadListPageDto {
  items: MailThreadListRow[];
  meta: MailThreadListPageMeta;
}

export interface MailRecipientRow {
  kind: string;
  email: string;
  displayName: string | null;
}

export interface MailAttachmentRow {
  id: string;
  fileAssetId: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: string | null;
  providerAttachmentId: string | null;
  isInline: boolean;
  downloadStatus: string;
  createdAt: string;
}

export interface MailMessageRow {
  id: string;
  direction: string;
  subject: string;
  bodyText: string | null;
  sentAt: string | null;
  receivedAt: string | null;
  readState: string;
  /** Outbound pipeline state; null for inbound / legacy rows. */
  deliveryStatus: string | null;
  recipients: MailRecipientRow[];
  attachments: MailAttachmentRow[];
}

export interface MailDeliveryLogRow {
  id: string;
  kind: string;
  detail: string | null;
  actorEmployeeId: string;
  createdAt: string;
}

export interface MailThreadDetailDto {
  mailAccount: MailAccountRow;
  thread: MailThreadListRow;
  messages: MailMessageRow[];
}

export interface MailAccountAccessEntryRow {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  role: string;
  grantedByEmployeeId: string | null;
  createdAt: string;
}

export interface MailAccountAccessListDto {
  mailAccountId: string;
  /** Effective role of the requesting viewer (owner/admin/sender/reader). */
  viewerRole: string;
  owner: { employeeId: string; employeeName: string; employeeEmail: string } | null;
  entries: MailAccountAccessEntryRow[];
}

export interface MailSyncLogRow {
  id: string;
  kind: string;
  detail: string | null;
  createdAt: string;
}
