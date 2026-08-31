import { api } from '../api';

export type MessengerCoreConversationType =
  | 'PROJECT_GENERAL'
  | 'PRODUCT'
  | 'DEAL'
  | 'TASK'
  | 'WORKSPACE'
  | 'DIRECT'
  | 'INTERNAL_GROUP'
  | 'EXTERNAL';

export type MessengerInternalSection =
  | 'all'
  | 'products'
  | 'tasks'
  | 'deals'
  | 'workspaces'
  | 'groups'
  | 'direct'
  | 'collections';

export interface MessengerCoreConversationRow {
  id: string;
  zone: 'INTERNAL' | 'CLIENT';
  type: MessengerCoreConversationType;
  title: string | null;
  status: string;
  canonicalKey: string | null;
  createdAt: string;
  lastMessageAt: string | null;
  lastMessagePreview?: string | null;
  unreadCount?: number;
  peerEmployeeId?: string | null;
  peerName?: string | null;
  isFavorite?: boolean;
  canWrite?: boolean;
}

export interface MessengerCoreMessageRow {
  id: string;
  conversationId: string;
  senderId: string | null;
  senderName: string;
  content: string;
  createdAt: string;
  editedAt: string | null;
  attachments: Array<{ id: string; fileAssetId: string; createdAt: string }>;
}

export interface MessengerCoreCollectionRow {
  id: string;
  name: string;
  visibility: 'PERSONAL' | 'SHARED';
  zone: 'INTERNAL' | 'CLIENT';
  ownerEmployeeId: string;
  items?: Array<{ conversationId: string }>;
  conversations?: MessengerCoreConversationRow[];
}

const INTERNAL_ROOT = '/api/messenger/core/internal';

export const messengerCoreApi = {
  async mapLegacy(): Promise<{ channels: number; threads: number }> {
    const resp = await api.post<{ channels: number; threads: number }>(
      `${INTERNAL_ROOT}/legacy-map`,
    );
    return resp.data;
  },

  async listConversations(params: {
    section?: MessengerInternalSection;
    q?: string;
    filter?: 'unread' | 'mentions';
  }): Promise<{ items: MessengerCoreConversationRow[]; mentionsAvailable: boolean }> {
    const resp = await api.get<{
      items: MessengerCoreConversationRow[];
      mentionsAvailable: boolean;
    }>(`${INTERNAL_ROOT}/conversations`, { params });
    return resp.data;
  },

  async createConversation(body: {
    type: 'INTERNAL_GROUP' | 'DIRECT';
    title?: string;
    peerEmployeeId?: string;
    participantIds?: string[];
  }): Promise<MessengerCoreConversationRow> {
    const resp = await api.post<MessengerCoreConversationRow>(
      `${INTERNAL_ROOT}/conversations`,
      body,
    );
    return resp.data;
  },

  async getConversation(id: string): Promise<MessengerCoreConversationRow> {
    const resp = await api.get<MessengerCoreConversationRow>(
      `${INTERNAL_ROOT}/conversations/${id}`,
    );
    return resp.data;
  },

  async listMessages(
    id: string,
    params?: { before?: string; pageSize?: number },
  ): Promise<{ items: MessengerCoreMessageRow[]; meta: { hasMoreOlder: boolean } }> {
    const resp = await api.get<{
      items: MessengerCoreMessageRow[];
      meta: { hasMoreOlder: boolean };
    }>(`${INTERNAL_ROOT}/conversations/${id}/messages`, { params });
    return resp.data;
  },

  async sendMessage(
    id: string,
    body: { content: string; fileAssetIds?: string[]; idempotencyKey?: string },
  ): Promise<MessengerCoreMessageRow> {
    const resp = await api.post<MessengerCoreMessageRow>(
      `${INTERNAL_ROOT}/conversations/${id}/messages`,
      body,
    );
    return resp.data;
  },

  async markRead(id: string): Promise<void> {
    await api.post(`${INTERNAL_ROOT}/conversations/${id}/read`);
  },

  async toggleFavorite(id: string): Promise<{ favorite: boolean; collectionId: string }> {
    const resp = await api.post<{ favorite: boolean; collectionId: string }>(
      `${INTERNAL_ROOT}/conversations/${id}/favorite`,
    );
    return resp.data;
  },

  async listCollections(): Promise<MessengerCoreCollectionRow[]> {
    const resp = await api.get<MessengerCoreCollectionRow[]>(`${INTERNAL_ROOT}/collections`);
    return resp.data;
  },

  async createCollection(body: {
    name: string;
    visibility: 'PERSONAL' | 'SHARED';
  }): Promise<MessengerCoreCollectionRow> {
    const resp = await api.post<MessengerCoreCollectionRow>(`${INTERNAL_ROOT}/collections`, body);
    return resp.data;
  },

  async getCollection(id: string): Promise<MessengerCoreCollectionRow> {
    const resp = await api.get<MessengerCoreCollectionRow>(`${INTERNAL_ROOT}/collections/${id}`);
    return resp.data;
  },

  async addCollectionItem(collectionId: string, conversationId: string): Promise<{ id: string }> {
    const resp = await api.post<{ id: string }>(
      `${INTERNAL_ROOT}/collections/${collectionId}/items`,
      {
        conversationId,
      },
    );
    return resp.data;
  },

  async ensureProduct(productId: string): Promise<MessengerCoreConversationRow> {
    const resp = await api.post<MessengerCoreConversationRow>(
      `${INTERNAL_ROOT}/entities/products/${productId}`,
    );
    return resp.data;
  },

  async ensureWorkSpace(workspaceId: string): Promise<MessengerCoreConversationRow> {
    const resp = await api.post<MessengerCoreConversationRow>(
      `${INTERNAL_ROOT}/entities/work-spaces/${workspaceId}`,
    );
    return resp.data;
  },

  async ensureDeal(dealId: string): Promise<MessengerCoreConversationRow> {
    const resp = await api.post<MessengerCoreConversationRow>(
      `${INTERNAL_ROOT}/entities/deals/${dealId}`,
    );
    return resp.data;
  },

  async ensureProjectGeneral(projectId: string): Promise<MessengerCoreConversationRow> {
    const resp = await api.post<MessengerCoreConversationRow>(
      `${INTERNAL_ROOT}/entities/projects/${projectId}/general`,
    );
    return resp.data;
  },
};
