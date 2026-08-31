import { api } from '../api';

export interface WhatsAppGatewayConnectionView {
  configured: boolean;
  baseUrl: string | null;
  hasToken: boolean;
  status: string;
  lastHealthCheckAt: string | null;
  lastConnectedAt: string | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  accountingGroupChatId: string | null;
  healthOk?: boolean;
}

export interface ProductWhatsAppState {
  productId: string;
  dealId?: string;
  binding: {
    id: string;
    groupChatId: string | null;
    groupName: string | null;
    status: string;
    lastSuccessfulSyncAt: string | null;
    lastErrorCode: string | null;
    lastErrorMessage: string | null;
  } | null;
  participants: Array<{
    employeeId: string;
    status: string;
    sourceRoles: unknown;
    lastErrorCode: string | null;
  }>;
  invitation: {
    id: string;
    status: string;
    contactId: string | null;
    attemptCount: number;
    sentAt: string | null;
    lastErrorCode: string | null;
    lastErrorMessage: string | null;
  } | null;
  latestOperation: {
    id: string;
    type: string;
    status: string;
    errorCode: string | null;
    errorMessage: string | null;
    createdAt: string;
    completedAt: string | null;
  } | null;
}

export interface WhatsAppAvailableGroup {
  id: string;
  name: string;
  participantCount?: number | null;
  pictureUrl?: string | null;
  missingFromGateway?: boolean;
}

export interface WhatsAppGatewayGroupsPage {
  groups: WhatsAppAvailableGroup[];
  pagination: { limit: number; offset: number; count: number };
}

export type WhatsAppGatewayChatType = 'group' | 'direct';

export interface WhatsAppGatewayChatItem {
  id: string;
  name: string;
  type: WhatsAppGatewayChatType;
}

export interface WhatsAppGatewayChatsPage {
  items: WhatsAppGatewayChatItem[];
  pagination: { limit: number; offset: number; count: number };
}

export const whatsappGatewayApi = {
  async getConnection(): Promise<WhatsAppGatewayConnectionView> {
    const resp = await api.get<WhatsAppGatewayConnectionView>('/api/integrations/whatsapp-gateway');
    return resp.data;
  },
  async upsert(body: {
    baseUrl?: string;
    apiToken?: string;
    accountingGroupChatId?: string | null;
  }): Promise<WhatsAppGatewayConnectionView> {
    const resp = await api.put<WhatsAppGatewayConnectionView>(
      '/api/integrations/whatsapp-gateway',
      body,
    );
    return resp.data;
  },
  async test(): Promise<WhatsAppGatewayConnectionView> {
    const resp = await api.post<WhatsAppGatewayConnectionView>(
      '/api/integrations/whatsapp-gateway/test',
    );
    return resp.data;
  },
  async disconnect(): Promise<WhatsAppGatewayConnectionView> {
    const resp = await api.delete<WhatsAppGatewayConnectionView>(
      '/api/integrations/whatsapp-gateway',
    );
    return resp.data;
  },
  async listGroups(params?: {
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<WhatsAppGatewayGroupsPage> {
    const resp = await api.get<WhatsAppGatewayGroupsPage>(
      '/api/integrations/whatsapp-gateway/groups',
      { params },
    );
    return resp.data;
  },
  async listChats(params?: {
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<WhatsAppGatewayChatsPage> {
    const resp = await api.get<WhatsAppGatewayChatsPage>(
      '/api/integrations/whatsapp-gateway/chats',
      { params: { ...params, search: params?.search ?? '' } },
    );
    return resp.data;
  },
};

export const productWhatsAppApi = {
  async getState(productId: string): Promise<ProductWhatsAppState> {
    const resp = await api.get<ProductWhatsAppState>(
      `/api/projects/products/${productId}/whatsapp`,
    );
    return resp.data;
  },
  async ensure(productId: string): Promise<ProductWhatsAppState> {
    const resp = await api.post<ProductWhatsAppState>(
      `/api/projects/products/${productId}/whatsapp/ensure`,
    );
    return resp.data;
  },
  async availableGroups(
    productId: string,
    search?: string,
  ): Promise<{ groups: WhatsAppAvailableGroup[]; currentGroupChatId: string | null }> {
    const resp = await api.get<{
      groups: WhatsAppAvailableGroup[];
      currentGroupChatId: string | null;
    }>(`/api/projects/products/${productId}/whatsapp/available-groups`, {
      params: search ? { search } : undefined,
    });
    return resp.data;
  },
  async bind(
    productId: string,
    body: { groupChatId: string; replace?: boolean; persistIfUnreachable?: boolean },
  ): Promise<ProductWhatsAppState> {
    const resp = await api.put<ProductWhatsAppState>(
      `/api/projects/products/${productId}/whatsapp/binding`,
      body,
    );
    return resp.data;
  },
  async sync(productId: string): Promise<ProductWhatsAppState> {
    const resp = await api.post<ProductWhatsAppState>(
      `/api/projects/products/${productId}/whatsapp/sync`,
    );
    return resp.data;
  },
  async clientInvite(
    productId: string,
    body?: { forceResend?: boolean },
  ): Promise<ProductWhatsAppState> {
    const resp = await api.post<ProductWhatsAppState>(
      `/api/projects/products/${productId}/whatsapp/client-invite`,
      body ?? {},
    );
    return resp.data;
  },
  async operations(productId: string) {
    const resp = await api.get<{
      items: Array<{
        id: string;
        type: string;
        status: string;
        source: string;
        errorCode: string | null;
        errorMessage: string | null;
        attemptCount: number;
        createdAt: string;
        completedAt: string | null;
        failedAt: string | null;
      }>;
    }>(`/api/projects/products/${productId}/whatsapp/operations`);
    return resp.data;
  },
};

export type DealWhatsAppState = ProductWhatsAppState & {
  dealId: string;
  productId: string | null;
  source?: 'DEAL' | 'PRODUCT';
};

export const dealWhatsAppApi = {
  async getState(dealId: string): Promise<DealWhatsAppState> {
    const resp = await api.get<DealWhatsAppState>(`/api/crm/deals/${dealId}/whatsapp-group`);
    return resp.data;
  },
  async ensure(dealId: string): Promise<DealWhatsAppState> {
    const resp = await api.post<DealWhatsAppState>(
      `/api/crm/deals/${dealId}/whatsapp-group/ensure`,
    );
    return resp.data;
  },
  async bind(
    dealId: string,
    body: { groupChatId: string; persistIfUnreachable?: boolean },
  ): Promise<DealWhatsAppState> {
    const resp = await api.post<DealWhatsAppState>(
      `/api/crm/deals/${dealId}/whatsapp-group/bind`,
      body,
    );
    return resp.data;
  },
};
