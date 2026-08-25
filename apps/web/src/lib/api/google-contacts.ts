import { api } from '../api';

export interface GoogleContactsConnectionView {
  connected: boolean;
  oauthConfigured: boolean;
  googleEmail: string | null;
  status: 'DISCONNECTED' | 'CONNECTED' | 'ERROR';
  lastSyncedAt: string | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  enqueued?: number;
}

export const googleContactsApi = {
  async getConnection(): Promise<GoogleContactsConnectionView> {
    const resp = await api.get<GoogleContactsConnectionView>('/api/integrations/google-contacts');
    return resp.data;
  },

  async startOAuth(): Promise<{ url: string }> {
    const resp = await api.post<{ url: string }>('/api/integrations/google-contacts/oauth/start');
    return resp.data;
  },

  async syncNow(): Promise<GoogleContactsConnectionView> {
    const resp = await api.post<GoogleContactsConnectionView>(
      '/api/integrations/google-contacts/sync',
    );
    return resp.data;
  },

  async disconnect(): Promise<GoogleContactsConnectionView> {
    const resp = await api.delete<GoogleContactsConnectionView>(
      '/api/integrations/google-contacts',
    );
    return resp.data;
  },
};
