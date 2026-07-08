import { api } from '../api';

export interface MetaConnectedAccount {
  id: string;
  provider: string;
  platform: 'INSTAGRAM' | 'FACEBOOK';
  displayName: string;
  pageId: string;
  instagramBusinessAccountId: string | null;
  externalAccountId: string;
  marketingAccountId: string | null;
  connectedByUserId: string;
  status: string;
  tokenExpiresAt: string | null;
  scopes: unknown;
  lastErrorAt: string | null;
  lastErrorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  marketingAccount: { id: string; name: string; channel: string } | null;
}

export const metaIntegrationApi = {
  async startOAuth(): Promise<{ url: string }> {
    const resp = await api.get<{ url: string }>('/api/integrations/meta/oauth/start');
    return resp.data;
  },

  async listAccounts(): Promise<MetaConnectedAccount[]> {
    const resp = await api.get<MetaConnectedAccount[]>('/api/integrations/meta/accounts');
    return resp.data;
  },

  async linkMarketingAccount(
    accountId: string,
    marketingAccountId: string | null,
  ): Promise<MetaConnectedAccount> {
    const resp = await api.patch<MetaConnectedAccount>(
      `/api/integrations/meta/accounts/${accountId}/marketing-account`,
      { marketingAccountId },
    );
    return resp.data;
  },

  async disconnect(accountId: string): Promise<void> {
    await api.delete(`/api/integrations/meta/accounts/${accountId}`);
  },
};
