import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { MetaOAuthPlatform } from './meta-oauth.platform';

const DEFAULT_GRAPH_API_VERSION = 'v21.0';

/** Facebook Page / Messenger OAuth scopes (no Instagram scopes). */
export const META_FACEBOOK_OAUTH_SCOPES = [
  'pages_show_list',
  'pages_manage_metadata',
  'pages_messaging',
  'pages_read_engagement',
  'business_management',
] as const;

/** Instagram Login OAuth scopes (no Facebook Page scopes). */
export const META_INSTAGRAM_OAUTH_SCOPES = [
  'instagram_business_basic',
  'instagram_business_manage_messages',
] as const;

const FORBIDDEN_FACEBOOK_SCOPES = [
  'instagram_business_basic',
  'instagram_business_manage_messages',
  'instagram_basic',
  'instagram_manage_messages',
] as const;

const FORBIDDEN_INSTAGRAM_SCOPES = [
  'pages_show_list',
  'pages_manage_metadata',
  'pages_messaging',
  'pages_read_engagement',
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

  get instagramAppId(): string {
    return this.config.get<string>('INSTAGRAM_APP_ID')?.trim() ?? '';
  }

  get instagramAppSecret(): string {
    return this.config.get<string>('INSTAGRAM_APP_SECRET')?.trim() ?? '';
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

  get instagramGraphBaseUrl(): string {
    return `https://graph.instagram.com/${this.graphApiVersion}`;
  }

  get facebookOAuthDialogUrl(): string {
    return `https://www.facebook.com/${this.graphApiVersion}/dialog/oauth`;
  }

  get instagramOAuthAuthorizeUrl(): string {
    return 'https://www.instagram.com/oauth/authorize';
  }

  get integrationsReturnPath(): string {
    return '/settings/integrations';
  }

  isMetaConfigured(): boolean {
    return Boolean(this.appId && this.appSecret);
  }

  isInstagramConfigured(): boolean {
    return Boolean(this.instagramAppId && this.instagramAppSecret);
  }

  isWebhookVerifyConfigured(): boolean {
    return Boolean(this.webhookVerifyToken);
  }

  scopesForPlatform(platform: MetaOAuthPlatform): readonly string[] {
    return platform === 'FACEBOOK' ? META_FACEBOOK_OAUTH_SCOPES : META_INSTAGRAM_OAUTH_SCOPES;
  }

  authorizeUrlForPlatform(platform: MetaOAuthPlatform): string {
    return platform === 'FACEBOOK' ? this.facebookOAuthDialogUrl : this.instagramOAuthAuthorizeUrl;
  }
}

interface BuildOAuthUrlParams {
  authorizeBaseUrl: string;
  clientId: string;
  redirectUri: string;
  state: string;
  scopes: readonly string[];
}

/** Builds Facebook OAuth consent URL (pure helper for tests). */
export function buildFacebookOAuthUrl(params: BuildOAuthUrlParams): string {
  assertFacebookOAuthParams(params.authorizeBaseUrl, params.scopes);
  return buildOAuthAuthorizeUrl(params);
}

/** Builds Instagram OAuth consent URL (pure helper for tests). */
export function buildInstagramOAuthUrl(params: BuildOAuthUrlParams): string {
  assertInstagramOAuthParams(params.authorizeBaseUrl, params.scopes);
  return buildOAuthAuthorizeUrl(params);
}

function buildOAuthAuthorizeUrl(params: BuildOAuthUrlParams): string {
  const url = new URL(params.authorizeBaseUrl);
  url.searchParams.set('client_id', params.clientId);
  url.searchParams.set('redirect_uri', params.redirectUri);
  url.searchParams.set('state', params.state);
  url.searchParams.set('scope', params.scopes.join(','));
  url.searchParams.set('response_type', 'code');
  return url.toString();
}

/** Validates Facebook OAuth URL and scopes before returning to the client. */
export function assertFacebookOAuthParams(authorizeUrl: string, scopes: readonly string[]): void {
  if (authorizeUrl.includes('instagram.com')) {
    throw new BadRequestException('Facebook OAuth URL must not use instagram.com');
  }
  for (const scope of scopes) {
    if (FORBIDDEN_FACEBOOK_SCOPES.includes(scope as (typeof FORBIDDEN_FACEBOOK_SCOPES)[number])) {
      throw new BadRequestException(`Facebook OAuth must not request Instagram scope "${scope}"`);
    }
    if (scope.startsWith('instagram_')) {
      throw new BadRequestException(`Facebook OAuth must not request Instagram scope "${scope}"`);
    }
  }
}

/** Validates Instagram OAuth URL and scopes before returning to the client. */
export function assertInstagramOAuthParams(authorizeUrl: string, scopes: readonly string[]): void {
  if (authorizeUrl.includes('facebook.com')) {
    throw new BadRequestException('Instagram OAuth URL must not use facebook.com');
  }
  for (const scope of scopes) {
    if (FORBIDDEN_INSTAGRAM_SCOPES.includes(scope as (typeof FORBIDDEN_INSTAGRAM_SCOPES)[number])) {
      throw new BadRequestException(`Instagram OAuth must not request Facebook scope "${scope}"`);
    }
    if (scope.startsWith('pages_')) {
      throw new BadRequestException(`Instagram OAuth must not request Facebook scope "${scope}"`);
    }
  }
}
