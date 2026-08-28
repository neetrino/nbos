export interface GoogleContactsJobPayload {
  contactId: string;
}

export interface GoogleContactsConnectionView {
  connected: boolean;
  oauthConfigured: boolean;
  googleEmail: string | null;
  status: 'DISCONNECTED' | 'CONNECTED' | 'ERROR';
  lastSyncedAt: string | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
}

export interface GoogleContactPersonInput {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  extraPhones: Array<{ e164: string }>;
}
