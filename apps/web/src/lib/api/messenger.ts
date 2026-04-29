import { api } from '../api';

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
}

export interface MessengerListMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface MessengerPagedMessages {
  items: MessengerMessageRow[];
  meta: MessengerListMeta;
}

/** DM thread history includes the peer’s read cursor for receipts on your own messages. */
export interface MessengerDmPagedMessages extends MessengerPagedMessages {
  peerLastReadAt: string | null;
}

export interface MessengerDmConversationRow {
  recipientId: string;
  lastMessage: MessengerMessageRow;
  unreadCount: number;
}

const LIST_PAGE_SIZE = 100;

export const messengerApi = {
  async listChannels(): Promise<MessengerChannelRow[]> {
    const resp = await api.get<MessengerChannelRow[]>('/api/messenger/channels');
    return resp.data;
  },

  async listChannelMessages(
    channelId: string,
    params?: { page?: number; pageSize?: number },
  ): Promise<MessengerPagedMessages> {
    const resp = await api.get<MessengerPagedMessages>(
      `/api/messenger/channels/${channelId}/messages`,
      {
        params: {
          page: params?.page ?? 1,
          pageSize: params?.pageSize ?? LIST_PAGE_SIZE,
        },
      },
    );
    return resp.data;
  },

  async sendChannelMessage(
    channelId: string,
    body: { content: string },
  ): Promise<MessengerMessageRow> {
    const resp = await api.post<MessengerMessageRow>(
      `/api/messenger/channels/${channelId}/messages`,
      body,
    );
    return resp.data;
  },

  async markChannelRead(channelId: string): Promise<void> {
    await api.post(`/api/messenger/channels/${channelId}/read`);
  },

  async listDmConversations(): Promise<MessengerDmConversationRow[]> {
    const resp = await api.get<MessengerDmConversationRow[]>('/api/messenger/dm/conversations');
    return resp.data;
  },

  async listDirectMessages(
    userId1: string,
    userId2: string,
    params?: { page?: number; pageSize?: number },
  ): Promise<MessengerDmPagedMessages> {
    const resp = await api.get<MessengerDmPagedMessages>(
      `/api/messenger/dm/${userId1}/${userId2}`,
      {
        params: {
          page: params?.page ?? 1,
          pageSize: params?.pageSize ?? LIST_PAGE_SIZE,
        },
      },
    );
    return resp.data;
  },

  async sendDirectMessage(body: {
    recipientId: string;
    content: string;
  }): Promise<MessengerMessageRow> {
    const resp = await api.post<MessengerMessageRow>('/api/messenger/dm', body);
    return resp.data;
  },

  async markDmRead(recipientId: string): Promise<void> {
    await api.post('/api/messenger/dm/mark-read', { recipientId });
  },
};
