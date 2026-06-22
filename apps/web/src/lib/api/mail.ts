import { api } from '../api';

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
  isSpam: boolean;
  status: string;
  assignedToEmployeeId: string | null;
  assignedToName: string | null;
  trashedAt: string | null;
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

export interface MailMessageRow {
  id: string;
  direction: string;
  subject: string;
  bodyText: string | null;
  /** Server-sanitized HTML body; null when only plain text was available. */
  bodyHtmlSanitized: string | null;
  sentAt: string | null;
  receivedAt: string | null;
  readState: string;
  deliveryStatus: string | null;
  recipients: MailRecipientRow[];
  attachments: MailAttachmentRow[];
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

export interface CreateMailOutboundDraftPayload {
  to: string[];
  cc?: string[];
  subject: string;
  bodyText: string;
  fileAssetIds?: string[];
}

export interface MailThreadDetailDto {
  mailAccount: MailAccountRow;
  thread: MailThreadListRow;
  messages: MailMessageRow[];
}

export interface MailBulkThreadActionFailedItem {
  threadId: string;
  error: string;
}

export interface MailBulkThreadActionResultDto {
  total: number;
  succeeded: number;
  failed: number;
  succeededThreadIds: string[];
  failedItems: MailBulkThreadActionFailedItem[];
}

export interface PatchMailThreadPayload {
  needsBusinessLink: boolean;
}

export interface MailDeliveryLogRow {
  id: string;
  kind: string;
  detail: string | null;
  actorEmployeeId: string;
  createdAt: string;
}

export interface MailSyncLogRow {
  id: string;
  kind: string;
  detail: string | null;
  createdAt: string;
}

export type MailSecureMode = 'SSL' | 'STARTTLS' | 'NONE';

export interface ConnectCorporateMailboxPayload {
  email: string;
  displayName?: string;
  imapHost: string;
  imapPort: number;
  imapSecure: MailSecureMode;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: MailSecureMode;
  login: string;
  password: string;
}

export type MailAccountAccessRole = 'ADMIN' | 'READER' | 'SENDER';

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
  viewerRole: string;
  owner: { employeeId: string; employeeName: string; employeeEmail: string } | null;
  entries: MailAccountAccessEntryRow[];
}

export interface ComposeMailPayload {
  mailAccountId: string;
  to: string[];
  cc?: string[];
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  fileAssetIds?: string[];
}

export interface ReplyMailPayload {
  to: string[];
  cc?: string[];
  subject?: string;
  bodyText: string;
  fileAssetIds?: string[];
}

export interface ListMailThreadsOptions {
  mailAccountId?: string;
  unreadOnly?: boolean;
  needsLinkOnly?: boolean;
  assignedToMe?: boolean;
  sentOnly?: boolean;
  spamOnly?: boolean;
  scope?: 'active' | 'trash';
  search?: string;
  page?: number;
  pageSize?: number;
}

export const mailApi = {
  async listAccounts(): Promise<MailAccountRow[]> {
    const resp = await api.get<MailAccountRow[]>('/api/mail/accounts');
    return resp.data;
  },

  async listAccountHealthSummaries(): Promise<MailAccountHealthSummaryRow[]> {
    const resp = await api.get<MailAccountHealthSummaryRow[]>('/api/mail/accounts/health-summary');
    return resp.data;
  },

  async recordMailAccountSyncStub(accountId: string): Promise<MailAccountRow> {
    const resp = await api.post<MailAccountRow>(`/api/mail/accounts/${accountId}/sync-stub`);
    return resp.data;
  },

  async listThreads(options: ListMailThreadsOptions = {}): Promise<MailThreadListPageDto> {
    const params: Record<string, string> = {};
    if (options.mailAccountId) {
      params.mailAccountId = options.mailAccountId;
    }
    if (options.unreadOnly) {
      params.unreadOnly = 'true';
    }
    if (options.needsLinkOnly) {
      params.needsLinkOnly = 'true';
    }
    if (options.assignedToMe) {
      params.assignedToMe = 'true';
    }
    if (options.sentOnly) {
      params.sentOnly = 'true';
    }
    if (options.spamOnly) {
      params.spamOnly = 'true';
    }
    if (options.scope) {
      params.scope = options.scope;
    }
    if (options.search !== undefined && options.search.trim() !== '') {
      params.q = options.search.trim();
    }
    if (options.page !== undefined) {
      params.page = String(options.page);
    }
    if (options.pageSize !== undefined) {
      params.pageSize = String(options.pageSize);
    }
    const resp = await api.get<MailThreadListPageDto>('/api/mail/threads', {
      params: Object.keys(params).length > 0 ? params : undefined,
    });
    return resp.data;
  },

  async getThread(threadId: string): Promise<MailThreadDetailDto> {
    const resp = await api.get<MailThreadDetailDto>(`/api/mail/threads/${threadId}`);
    return resp.data;
  },

  async listMessageDeliveryLogs(
    threadId: string,
    messageId: string,
  ): Promise<MailDeliveryLogRow[]> {
    const resp = await api.get<MailDeliveryLogRow[]>(
      `/api/mail/threads/${threadId}/messages/${messageId}/delivery-log`,
    );
    return resp.data;
  },

  async patchThread(threadId: string, body: PatchMailThreadPayload): Promise<MailThreadDetailDto> {
    const resp = await api.patch<MailThreadDetailDto>(`/api/mail/threads/${threadId}`, body);
    return resp.data;
  },

  async markThreadRead(threadId: string): Promise<MailThreadDetailDto> {
    const resp = await api.post<MailThreadDetailDto>(`/api/mail/threads/${threadId}/mark-read`);
    return resp.data;
  },

  async bulkMarkThreadsRead(threadIds: string[]): Promise<MailBulkThreadActionResultDto> {
    const resp = await api.post<MailBulkThreadActionResultDto>('/api/mail/threads/bulk-mark-read', {
      threadIds,
    });
    return resp.data;
  },

  async bulkMarkThreadsUnread(threadIds: string[]): Promise<MailBulkThreadActionResultDto> {
    const resp = await api.post<MailBulkThreadActionResultDto>(
      '/api/mail/threads/bulk-mark-unread',
      { threadIds },
    );
    return resp.data;
  },

  async deleteThread(threadId: string): Promise<{ trashed: true; threadId: string }> {
    const resp = await api.post<{ trashed: true; threadId: string }>(
      `/api/mail/threads/${threadId}/delete`,
    );
    return resp.data;
  },

  async restoreThread(threadId: string): Promise<MailThreadDetailDto> {
    const resp = await api.post<MailThreadDetailDto>(`/api/mail/threads/${threadId}/restore`);
    return resp.data;
  },

  async permanentDeleteThread(threadId: string): Promise<void> {
    await api.delete(`/api/mail/threads/${threadId}/permanent`);
  },

  async createOutboundDraft(
    threadId: string,
    body: CreateMailOutboundDraftPayload,
  ): Promise<MailThreadDetailDto> {
    const resp = await api.post<MailThreadDetailDto>(`/api/mail/threads/${threadId}/drafts`, body);
    return resp.data;
  },

  async queueOutboundDraft(threadId: string, messageId: string): Promise<MailThreadDetailDto> {
    const resp = await api.post<MailThreadDetailDto>(
      `/api/mail/threads/${threadId}/messages/${messageId}/queue`,
    );
    return resp.data;
  },

  async finalizeQueuedOutboundStub(
    threadId: string,
    messageId: string,
  ): Promise<MailThreadDetailDto> {
    const resp = await api.post<MailThreadDetailDto>(
      `/api/mail/threads/${threadId}/messages/${messageId}/finalize-send-stub`,
    );
    return resp.data;
  },

  async cancelOutboundDraftOrQueued(
    threadId: string,
    messageId: string,
  ): Promise<MailThreadDetailDto> {
    const resp = await api.post<MailThreadDetailDto>(
      `/api/mail/threads/${threadId}/messages/${messageId}/cancel`,
    );
    return resp.data;
  },

  async resetFailedOutboundToDraft(
    threadId: string,
    messageId: string,
  ): Promise<MailThreadDetailDto> {
    const resp = await api.post<MailThreadDetailDto>(
      `/api/mail/threads/${threadId}/messages/${messageId}/reset-failed-to-draft`,
    );
    return resp.data;
  },

  async connectCorporate(payload: ConnectCorporateMailboxPayload): Promise<MailAccountRow> {
    const resp = await api.post<MailAccountRow>('/api/mail/accounts/corporate/connect', payload);
    return resp.data;
  },

  async startGmailOAuth(): Promise<{ url: string }> {
    const resp = await api.get<{ url: string }>('/api/mail/oauth/google/start');
    return resp.data;
  },

  async disconnectAccount(accountId: string): Promise<MailAccountRow> {
    const resp = await api.post<MailAccountRow>(`/api/mail/accounts/${accountId}/disconnect`);
    return resp.data;
  },

  async syncAccount(accountId: string): Promise<{ queued: boolean }> {
    const resp = await api.post<{ queued: boolean }>(`/api/mail/accounts/${accountId}/sync`);
    return resp.data;
  },

  async listSyncLogs(accountId: string): Promise<MailSyncLogRow[]> {
    const resp = await api.get<MailSyncLogRow[]>(`/api/mail/accounts/${accountId}/sync-logs`);
    return resp.data;
  },

  async listAccess(accountId: string): Promise<MailAccountAccessListDto> {
    const resp = await api.get<MailAccountAccessListDto>(`/api/mail/accounts/${accountId}/access`);
    return resp.data;
  },

  async grantAccess(
    accountId: string,
    employeeId: string,
    role: MailAccountAccessRole,
  ): Promise<MailAccountAccessListDto> {
    const resp = await api.post<MailAccountAccessListDto>(
      `/api/mail/accounts/${accountId}/access`,
      { employeeId, role },
    );
    return resp.data;
  },

  async updateAccessRole(
    accountId: string,
    employeeId: string,
    role: MailAccountAccessRole,
  ): Promise<MailAccountAccessListDto> {
    const resp = await api.patch<MailAccountAccessListDto>(
      `/api/mail/accounts/${accountId}/access/${employeeId}`,
      { role },
    );
    return resp.data;
  },

  async removeAccess(accountId: string, employeeId: string): Promise<MailAccountAccessListDto> {
    const resp = await api.delete<MailAccountAccessListDto>(
      `/api/mail/accounts/${accountId}/access/${employeeId}`,
    );
    return resp.data;
  },

  async assignThread(threadId: string, employeeId: string): Promise<MailThreadDetailDto> {
    const resp = await api.post<MailThreadDetailDto>(`/api/mail/threads/${threadId}/assign`, {
      employeeId,
    });
    return resp.data;
  },

  async unassignThread(threadId: string): Promise<MailThreadDetailDto> {
    const resp = await api.post<MailThreadDetailDto>(`/api/mail/threads/${threadId}/unassign`);
    return resp.data;
  },

  async markThreadUnread(threadId: string): Promise<MailThreadDetailDto> {
    const resp = await api.post<MailThreadDetailDto>(`/api/mail/threads/${threadId}/mark-unread`);
    return resp.data;
  },

  async markThreadSpam(threadId: string): Promise<MailThreadDetailDto> {
    const resp = await api.post<MailThreadDetailDto>(`/api/mail/threads/${threadId}/mark-spam`);
    return resp.data;
  },

  async compose(payload: ComposeMailPayload): Promise<MailThreadDetailDto> {
    const resp = await api.post<MailThreadDetailDto>('/api/mail/compose', payload);
    return resp.data;
  },

  async reply(threadId: string, payload: ReplyMailPayload): Promise<MailThreadDetailDto> {
    const resp = await api.post<MailThreadDetailDto>(
      `/api/mail/threads/${threadId}/reply`,
      payload,
    );
    return resp.data;
  },
};
