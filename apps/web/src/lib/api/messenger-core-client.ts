import { api } from '../api';
import type {
  MessengerCoreCollectionRow,
  MessengerCoreConversationRow,
  MessengerCoreMessageRow,
} from './messenger-core';
import { listClientMessengerDelta, type MessengerDeltaPage } from './messenger-core-delta';

export type MessengerClientSection = 'inbox' | 'sales' | 'clients' | 'collections';

export type MessengerClientListFilter = 'unread' | 'needs_response' | 'assigned';

export type MessengerClientProvider = 'WHATSAPP' | 'INSTAGRAM' | 'FACEBOOK';

export interface MessengerClientConversationRow extends MessengerCoreConversationRow {
  canSend?: boolean;
  canWrite?: boolean;
  lastMessageDirection?: 'INBOUND' | 'OUTBOUND' | 'INTERNAL' | null;
  provider?: MessengerClientProvider | null;
  leadId?: string | null;
  attention?: Array<{
    productId: string;
    purpose: 'WORK' | 'FINANCE';
    productName?: string;
    ownerKind: 'EMPLOYEE' | 'QUEUE' | 'ROLE';
    ownerQueue: 'SUPPORT_INTAKE' | 'FINANCE' | null;
    label: string;
    isManual: boolean;
  }>;
}

const CLIENT_ROOT = '/api/messenger/core/client';

export const messengerClientApi = {
  async listConversations(params: {
    section?: MessengerClientSection;
    q?: string;
    filter?: MessengerClientListFilter;
    provider?: MessengerClientProvider;
    cursor?: string;
  }): Promise<{ items: MessengerClientConversationRow[]; hasMore?: boolean; nextCursor?: string }> {
    const resp = await api.get<{
      items: MessengerClientConversationRow[];
      hasMore?: boolean;
      nextCursor?: string;
    }>(`${CLIENT_ROOT}/conversations`, { params });
    return resp.data;
  },

  async bootstrap(): Promise<{
    summaries: { items: MessengerClientConversationRow[]; hasMore?: boolean };
    collections: MessengerCoreCollectionRow[];
    recoveryMode?: 'FULL' | 'DELTA' | null;
    checkpoint?: string | null;
    authorizationEpoch?: string | null;
  }> {
    const resp = await api.post<{
      summaries: { items: MessengerClientConversationRow[]; hasMore?: boolean };
      collections: MessengerCoreCollectionRow[];
      recoveryMode?: 'FULL' | 'DELTA' | null;
      checkpoint?: string | null;
      authorizationEpoch?: string | null;
    }>(`${CLIENT_ROOT}/bootstrap`);
    return resp.data;
  },

  async listDelta(params: {
    after: string;
    cursor?: string;
    authorizationEpoch?: string;
  }): Promise<MessengerDeltaPage<MessengerClientConversationRow>> {
    return listClientMessengerDelta(params);
  },

  async getConversation(id: string): Promise<MessengerClientConversationRow> {
    const resp = await api.get<MessengerClientConversationRow>(
      `${CLIENT_ROOT}/conversations/${id}`,
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
    }>(`${CLIENT_ROOT}/conversations/${id}/messages`, { params });
    return resp.data;
  },

  async sendMessage(
    id: string,
    body: {
      content: string;
      fileAssetIds?: string[];
      idempotencyKey?: string;
      replyToMessageId?: string;
      mentionedEmployeeIds?: string[];
    },
  ): Promise<MessengerCoreMessageRow> {
    const resp = await api.post<MessengerCoreMessageRow>(
      `${CLIENT_ROOT}/conversations/${id}/messages`,
      body,
    );
    return resp.data;
  },

  async markRead(id: string): Promise<void> {
    await api.post(`${CLIENT_ROOT}/conversations/${id}/read`);
  },

  async toggleFavorite(id: string): Promise<{ favorite: boolean; collectionId: string }> {
    const resp = await api.post<{ favorite: boolean; collectionId: string }>(
      `${CLIENT_ROOT}/conversations/${id}/favorite`,
    );
    return resp.data;
  },

  async inviteReadOnly(
    conversationId: string,
    employeeId: string,
  ): Promise<{ employeeId: string }> {
    const resp = await api.post<{ employeeId: string }>(
      `${CLIENT_ROOT}/conversations/${conversationId}/participants`,
      { employeeId },
    );
    return resp.data;
  },

  async assignAttention(
    conversationId: string,
    body: {
      productId: string;
      purpose: 'WORK' | 'FINANCE';
      ownerKind: 'EMPLOYEE' | 'QUEUE' | 'ROLE';
      ownerEmployeeId?: string;
      ownerQueue?: 'SUPPORT_INTAKE' | 'FINANCE';
    },
  ): Promise<NonNullable<MessengerClientConversationRow['attention']>> {
    const resp = await api.patch<NonNullable<MessengerClientConversationRow['attention']>>(
      `${CLIENT_ROOT}/conversations/${conversationId}/attention`,
      body,
    );
    return resp.data;
  },

  async listCollections(): Promise<MessengerCoreCollectionRow[]> {
    const resp = await api.get<MessengerCoreCollectionRow[]>(`${CLIENT_ROOT}/collections`);
    return resp.data;
  },

  async createCollection(body: {
    name: string;
    visibility: 'PERSONAL' | 'SHARED';
  }): Promise<MessengerCoreCollectionRow> {
    const resp = await api.post<MessengerCoreCollectionRow>(`${CLIENT_ROOT}/collections`, body);
    return resp.data;
  },

  async getCollection(id: string): Promise<MessengerCoreCollectionRow> {
    const resp = await api.get<MessengerCoreCollectionRow>(`${CLIENT_ROOT}/collections/${id}`);
    return resp.data;
  },

  async addCollectionItem(collectionId: string, conversationId: string): Promise<{ id: string }> {
    const resp = await api.post<{ id: string }>(
      `${CLIENT_ROOT}/collections/${collectionId}/items`,
      {
        conversationId,
      },
    );
    return resp.data;
  },
};
