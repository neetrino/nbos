export interface MetaProviderSecretPayload {
  pageAccessToken: string;
  userAccessToken?: string;
}

export type MetaOAuthErrorReason =
  | 'missing_code'
  | 'access_denied'
  | 'invalid_state'
  | 'token_exchange_failed'
  | 'instagram_token_exchange_failed'
  | 'instagram_long_lived_token_failed'
  | 'instagram_profile_failed'
  | 'instagram_callback_failed'
  | 'missing_pages'
  | 'not_configured'
  | 'unknown';

export interface MetaConnectedAccountRow {
  id: string;
  provider: string;
  platform: string;
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
  marketingAccount?: {
    id: string;
    name: string;
    channel: string;
  } | null;
}

export interface MetaGraphPage {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: { id: string; username?: string; name?: string } | null;
}

export interface MetaGraphTokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
}

export interface MetaMessagingWebhookBody {
  object?: string;
  entry?: MetaWebhookEntry[];
}

export interface MetaWebhookEntry {
  id: string;
  time?: number;
  messaging?: MetaMessagingEvent[];
}

export interface MetaMessagingEvent {
  sender?: { id: string };
  recipient?: { id: string };
  timestamp?: number;
  message?: {
    mid?: string;
    text?: string;
    is_echo?: boolean;
  };
  delivery?: unknown;
  read?: unknown;
  postback?: unknown;
}

export interface ParsedMetaInboundMessage {
  eventId: string;
  objectId: string;
  platform: 'INSTAGRAM' | 'FACEBOOK';
  senderId: string;
  senderName: string | null;
  messageText: string | null;
  timestamp: number | null;
  pageId: string;
  instagramBusinessAccountId: string | null;
}
