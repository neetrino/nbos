import { api } from '../api';

export interface NotificationDto {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

export interface NotificationsListResponse {
  items: NotificationDto[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export const notificationsApi = {
  async list(page = 1, pageSize = 20): Promise<NotificationsListResponse> {
    const resp = await api.get<NotificationsListResponse>('/api/notifications', {
      params: { page, pageSize },
    });
    return resp.data;
  },

  async getUnreadCount(): Promise<{ count: number }> {
    const resp = await api.get<{ count: number }>('/api/notifications/unread-count');
    return resp.data;
  },

  async markAsRead(id: string): Promise<NotificationDto> {
    const resp = await api.patch<NotificationDto>(`/api/notifications/${id}/read`);
    return resp.data;
  },

  async markAllAsRead(): Promise<{ updated: number }> {
    const resp = await api.patch<{ updated: number }>('/api/notifications/read-all');
    return resp.data;
  },
};
