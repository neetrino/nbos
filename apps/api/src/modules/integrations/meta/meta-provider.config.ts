import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const DEFAULT_GRAPH_API_VERSION = 'v21.0';

/** Meta OAuth scopes for page + Instagram DM webhook ingestion. */
export const META_OAUTH_SCOPES = [
  'pages_show_list',
  'pages_manage_metadata',
  'pages_messaging',
  'instagram_business_basic',
  'instagram_business_manage_messages',
  'business_management',
] as const;

/**
 * Meta integration environment config. Values are optional in local dev so the
 * API boots without Meta setup (mirrors Gmail optional-in-dev pattern).
 */
@Injectable()
export class MetaProviderConfig {
  constructor(private readonly config: ConfigService) {}

  get appUrl(): string {
    return this.config.get<string>('APP_URL')?.trim() || 'http://localhost:3000';
  }

  get backendUrl(): string {
    return this.config.getOrThrow<string>('BACKEND_URL').trim();
  }

  get appId(): string {
    return this.config.get<string>('META_APP_ID')?.trim() ?? '';
  }

  get appSecret(): string {
    return this.config.get<string>('META_APP_SECRET')?.trim() ?? '';
  }

  get webhookVerifyToken(): string {
    return this.config.get<string>('META_WEBHOOK_VERIFY_TOKEN')?.trim() ?? '';
  }

  get graphApiVersion(): string {
    const raw = this.config.get<string>('META_GRAPH_API_VERSION')?.trim();
    if (!raw) {
      return DEFAULT_GRAPH_API_VERSION;
    }
    return raw.startsWith('v') ? raw : `v${raw}`;
  }

  get oauthRedirectUri(): string {
    return new URL('/api/integrations/meta/oauth/callback', this.backendUrl).toString();
  }

  get webhookUrl(): string {
    return new URL('/api/integrations/meta/webhook', this.backendUrl).toString();
  }

  get graphBaseUrl(): string {
    return `https://graph.facebook.com/${this.graphApiVersion}`;
  }

  get oauthDialogUrl(): string {
    return `https://www.facebook.com/${this.graphApiVersion}/dialog/oauth`;
  }

  get integrationsReturnPath(): string {
    return '/settings/integrations';
  }

  isMetaConfigured(): boolean {
    return Boolean(this.appId && this.appSecret);
  }

  isWebhookVerifyConfigured(): boolean {
    return Boolean(this.webhookVerifyToken);
  }
}

/** Builds Meta OAuth consent URL (pure helper for tests). */
export function buildMetaOAuthUrl(params: {
  dialogBaseUrl: string;
  appId: string;
  redirectUri: string;
  state: string;
  scopes: readonly string[];
}): string {
  const url = new URL(params.dialogBaseUrl);
  url.searchParams.set('client_id', params.appId);
  url.searchParams.set('redirect_uri', params.redirectUri);
  url.searchParams.set('state', params.state);
  url.searchParams.set('scope', params.scopes.join(','));
  url.searchParams.set('response_type', 'code');
  return url.toString();
}
