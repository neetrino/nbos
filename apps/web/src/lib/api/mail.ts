import { api } from '../api';

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
  deliveryStatus: string | null;
  recipients: MailRecipientRow[];
}

export interface CreateMailOutboundDraftPayload {
  to: string[];
  cc?: string[];
  subject: string;
  bodyText: string;
}

export interface MailThreadDetailDto {
  mailAccount: MailAccountRow;
  thread: MailThreadListRow;
  messages: MailMessageRow[];
}

export const mailApi = {
  async listAccounts(): Promise<MailAccountRow[]> {
    const resp = await api.get<MailAccountRow[]>('/api/mail/accounts');
    return resp.data;
  },

  async listThreads(mailAccountId?: string, unreadOnly?: boolean): Promise<MailThreadListRow[]> {
    const params: Record<string, string> = {};
    if (mailAccountId) {
      params.mailAccountId = mailAccountId;
    }
    if (unreadOnly) {
      params.unreadOnly = 'true';
    }
    const resp = await api.get<MailThreadListRow[]>('/api/mail/threads', {
      params: Object.keys(params).length > 0 ? params : undefined,
    });
    return resp.data;
  },

  async getThread(threadId: string): Promise<MailThreadDetailDto> {
    const resp = await api.get<MailThreadDetailDto>(`/api/mail/threads/${threadId}`);
    return resp.data;
  },

  async markThreadRead(threadId: string): Promise<MailThreadDetailDto> {
    const resp = await api.post<MailThreadDetailDto>(`/api/mail/threads/${threadId}/mark-read`);
    return resp.data;
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
};
