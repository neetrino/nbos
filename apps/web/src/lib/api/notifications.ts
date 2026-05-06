import { api } from '../api';

export interface NotificationDto {
  id: string;
  type: string;
  category: string;
  priority: string;
  title: string;
  body: string;
  link: string | null;
  actionLabel: string | null;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
  archivedAt: string | null;
}

export interface NotificationsListParams {
  page?: number;
  pageSize?: number;
  category?: string;
  includeArchived?: boolean;
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

export interface NotificationPreferenceDto {
  eventType: string;
  enabled: boolean;
  channels: string[];
}

export interface NotificationAdminRuleDto {
  code: string;
  eventType: string;
  recipientResolver: string;
  enabled: boolean;
  priority: string;
  channels: string[];
}

export const notificationsApi = {
  async list(params: NotificationsListParams = {}): Promise<NotificationsListResponse> {
    const resp = await api.get<NotificationsListResponse>('/api/notifications', {
      params,
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

  async archive(id: string): Promise<NotificationDto> {
    const resp = await api.patch<NotificationDto>(`/api/notifications/${id}/archive`);
    return resp.data;
  },

  async getPreferences(): Promise<NotificationPreferenceDto[]> {
    const resp = await api.get<NotificationPreferenceDto[]>('/api/notifications/preferences');
    return resp.data;
  },

  async patchPreference(
    eventType: string,
    data: { enabled?: boolean; channels?: string[] },
  ): Promise<NotificationPreferenceDto> {
    const resp = await api.patch<NotificationPreferenceDto>(
      `/api/notifications/preferences/${encodeURIComponent(eventType)}`,
      data,
    );
    return resp.data;
  },

  async listAdminRules(): Promise<NotificationAdminRuleDto[]> {
    const resp = await api.get<NotificationAdminRuleDto[]>('/api/notifications/admin/rules');
    return resp.data;
  },

  async patchAdminRule(
    code: string,
    data: { enabled?: boolean; priority?: string; channels?: string[] },
  ): Promise<NotificationAdminRuleDto> {
    const resp = await api.patch<NotificationAdminRuleDto>(
      `/api/notifications/admin/rules/${encodeURIComponent(code)}`,
      data,
    );
    return resp.data;
  },
};
