/**
 * Provider adapter boundary (canon: `docs/NBOS/02-Modules/17-Mail/03-Mail-Architecture.md`).
 * Core Mail never talks to Gmail API / IMAP / SMTP directly — only through this contract.
 * Gmail and corporate IMAP/SMTP both normalize into the same NBOS data model.
 */

export type NormalizedRecipientKind = 'FROM' | 'TO' | 'CC' | 'BCC' | 'REPLY_TO';

export interface NormalizedRecipient {
  kind: NormalizedRecipientKind;
  email: string;
  displayName: string | null;
}

export interface NormalizedAttachment {
  providerAttachmentId: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  isInline: boolean;
}

export interface NormalizedMessage {
  providerMessageId: string;
  messageIdHeader: string | null;
  providerThreadId: string | null;
  subject: string;
  bodyText: string | null;
  /** Raw provider HTML (sanitized by core before persistence/rendering). */
  bodyHtml: string | null;
  sentAt: Date | null;
  receivedAt: Date | null;
  direction: 'INBOUND' | 'OUTBOUND';
  recipients: NormalizedRecipient[];
  attachments?: NormalizedAttachment[];
}

export interface DownloadedAttachment {
  filename: string;
  contentType: string;
  content: Buffer;
}

export interface ValidateConnectionResult {
  ok: boolean;
  error?: string;
  /** Stable provider account identifier (Gmail address / IMAP login). */
  providerAccountId?: string;
}

export interface SendMessageAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
  contentId?: string;
  isInline?: boolean;
}

export interface SendMessageInput {
  fromEmail: string;
  fromName: string | null;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  inReplyToMessageIdHeader?: string | null;
  references?: string | null;
  providerThreadId?: string | null;
  attachments?: SendMessageAttachment[];
}

export interface SendMessageResult {
  providerMessageId: string | null;
  messageIdHeader: string | null;
  providerThreadId: string | null;
}

/** Opaque per-provider sync cursor (Gmail historyId or IMAP uidValidity/lastUid). */
export interface ProviderSyncCursor {
  gmailHistoryId?: string | null;
  imapUidValidity?: string | null;
  imapLastUid?: string | null;
}

export interface FetchDeltaResult {
  messages: NormalizedMessage[];
  cursor: ProviderSyncCursor;
}

export interface ProviderHealth {
  ok: boolean;
  detail: string | null;
}

export interface MarkThreadReadInput {
  providerThreadId: string | null;
  /** Provider-native message ids (Gmail message id or IMAP UID). */
  providerMessageIds: string[];
}

export interface WatchOrIdleResult {
  /** Gmail `users.watch` expiry; null/absent when watch is skipped or IMAP. */
  watchExpiresAt?: Date | null;
}

export interface MailProviderAdapter {
  validateConnection(): Promise<ValidateConnectionResult>;
  /** Start Gmail Pub/Sub watch or IMAP IDLE (IMAP adapter is a no-op). */
  startWatchOrIdle(): Promise<WatchOrIdleResult>;
  fetchDelta(cursor: ProviderSyncCursor): Promise<FetchDeltaResult>;
  fetchMessage(providerMessageId: string): Promise<NormalizedMessage | null>;
  downloadAttachment(input: {
    providerMessageId: string;
    providerAttachmentId: string;
  }): Promise<DownloadedAttachment>;
  sendMessage(input: SendMessageInput): Promise<SendMessageResult>;
  /** Removes UNREAD / \\Seen on provider when supported. */
  markThreadRead(input: MarkThreadReadInput): Promise<void>;
  getHealth(): Promise<ProviderHealth>;
  reconnect(): Promise<ValidateConnectionResult>;
}
