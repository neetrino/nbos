import { api } from '../api';

export type MessengerInternalTab = 'all' | 'deal' | 'project' | 'dev' | 'tasks';

export type MessengerL1EntityType = 'PROJECT' | 'PRODUCT' | 'DEAL' | 'TASK' | 'DIRECT_BUCKET';

export interface MessengerL1EntityRow {
  entityType: MessengerL1EntityType;
  entityId: string;
  title: string;
  subtitle: string | null;
  unreadCount: number;
  primaryConversationId: string | null;
}

export interface MessengerL2ConversationRow {
  id: string;
  type: string;
  title: string;
  status: string;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  unreadCount: number;
  primaryEntityType: string | null;
  primaryEntityId: string | null;
  peerEmployeeId: string | null;
}

export interface MessengerConversationDetail {
  id: string;
  type: string;
  title: string;
  status: string;
  canonicalKey: string | null;
  lastMessageAt: string | null;
  primaryEntityType: string | null;
  primaryEntityId: string | null;
  peerEmployeeId: string | null;
  canSend: boolean;
}

export interface MessengerMessageAttachmentRow {
  id: string;
  fileAssetId: string;
  createdAt: string;
}

export interface MessengerUnifiedMessageRow {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
  editedAt: string | null;
  attachments: MessengerMessageAttachmentRow[];
}

export interface MessengerListMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMoreOlder?: boolean;
}

export interface MessengerUnifiedPagedMessages {
  items: MessengerUnifiedMessageRow[];
  meta: MessengerListMeta;
  lastOwnMessageId: string | null;
  lastOwnMessageSeenByOthers: boolean;
  peerLastReadAt: string | null;
}

export interface MessengerUnifiedSearchResultRow {
  conversationId: string;
  conversationType: string;
  conversationTitle: string;
  messageId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

export type MessengerEnsureConversationBody =
  | { type: 'PROJECT_GENERAL' | 'PRODUCT' | 'DEAL' | 'TASK'; entityId: string }
  | { type: 'DIRECT'; peerEmployeeId: string };

const LIST_PAGE_SIZE = 100;

/** Legacy types kept for any residual callers. */
export interface MessengerChannelRow {
  id: string;
  name: string;
  projectId: string;
  type: 'project' | 'general' | 'announcement';
  createdAt: string;
  unreadCount: number;
}

export interface MessengerMessageRow {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
  editedAt: string | null;
  attachments: MessengerMessageAttachmentRow[];
}

export interface MessengerDmConversationRow {
  recipientId: string;
  lastMessage: MessengerMessageRow;
  unreadCount: number;
}

export interface MessengerSearchResultRow {
  scope: 'channel' | 'dm';
  channelId: string;
  recipientId: string | null;
  messageId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

export const messengerApi = {
  async listInternalEntities(
    tab: MessengerInternalTab,
    search?: string,
  ): Promise<MessengerL1EntityRow[]> {
    const resp = await api.get<MessengerL1EntityRow[]>('/api/messenger/internal/entities', {
      params: { tab, ...(search ? { search } : {}) },
    });
    return resp.data;
  },

  async listInternalConversations(params: {
    entityType?: MessengerL1EntityType;
    entityId?: string;
    projectTree?: boolean;
    includeInternalGroups?: boolean;
  }): Promise<MessengerL2ConversationRow[]> {
    const resp = await api.get<MessengerL2ConversationRow[]>(
      '/api/messenger/internal/conversations',
      {
        params: {
          ...(params.entityType ? { entityType: params.entityType } : {}),
          ...(params.entityId ? { entityId: params.entityId } : {}),
          ...(params.projectTree ? { projectTree: '1' } : {}),
          ...(params.includeInternalGroups ? { includeInternalGroups: '1' } : {}),
        },
      },
    );
    return resp.data;
  },

  async ensureConversation(
    body: MessengerEnsureConversationBody,
  ): Promise<{ id: string; type: string; title: string | null }> {
    const resp = await api.post<{ id: string; type: string; title: string | null }>(
      '/api/messenger/conversations/ensure',
      body,
    );
    return resp.data;
  },

  async getConversation(id: string): Promise<MessengerConversationDetail> {
    const resp = await api.get<MessengerConversationDetail>(`/api/messenger/conversations/${id}`);
    return resp.data;
  },

  async listConversationMessages(
    conversationId: string,
    params?: { before?: string; pageSize?: number },
  ): Promise<MessengerUnifiedPagedMessages> {
    const resp = await api.get<MessengerUnifiedPagedMessages>(
      `/api/messenger/conversations/${conversationId}/messages`,
      {
        params: {
          ...(params?.before ? { before: params.before } : {}),
          pageSize: params?.pageSize ?? LIST_PAGE_SIZE,
        },
      },
    );
    return resp.data;
  },

  async sendConversationMessage(
    conversationId: string,
    body: { content: string; fileAssetIds?: string[] },
  ): Promise<MessengerUnifiedMessageRow> {
    const resp = await api.post<MessengerUnifiedMessageRow>(
      `/api/messenger/conversations/${conversationId}/messages`,
      body,
    );
    return resp.data;
  },

  async markConversationRead(conversationId: string): Promise<void> {
    await api.post(`/api/messenger/conversations/${conversationId}/read`);
  },

  async searchInternal(q: string): Promise<{ items: MessengerUnifiedSearchResultRow[] }> {
    const resp = await api.get<{ items: MessengerUnifiedSearchResultRow[] }>(
      '/api/messenger/internal/search',
      { params: { q } },
    );
    return resp.data;
  },

  // Legacy (dual-compat)
  async listChannels(): Promise<MessengerChannelRow[]> {
    const resp = await api.get<MessengerChannelRow[]>('/api/messenger/channels');
    return resp.data;
  },

  async listDmConversations(): Promise<MessengerDmConversationRow[]> {
    const resp = await api.get<MessengerDmConversationRow[]>('/api/messenger/dm/conversations');
    return resp.data;
  },

  async search(q: string): Promise<{ items: MessengerSearchResultRow[] }> {
    const resp = await api.get<{ items: MessengerSearchResultRow[] }>('/api/messenger/search', {
      params: { q },
    });
    return resp.data;
  },
};
