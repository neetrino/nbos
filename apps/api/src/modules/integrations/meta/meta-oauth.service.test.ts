import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import * as jwt from 'jsonwebtoken';
import { MetaOAuthService } from './meta-oauth.service';
import {
  META_FACEBOOK_OAUTH_SCOPES,
  META_INSTAGRAM_OAUTH_SCOPES,
  MetaProviderConfig,
} from './meta-provider.config';
import { MetaGraphClient } from './meta-graph.client';
import { MetaInstagramGraphClient } from './meta-instagram-graph.client';

vi.mock('./meta-graph.client');
vi.mock('./meta-instagram-graph.client');

const JWT_SECRET = 'test-jwt-secret';
const FACEBOOK_APP_ID = 'facebook-app-1111';
const FACEBOOK_APP_SECRET = 'facebook-secret-test';
const INSTAGRAM_APP_ID = 'instagram-app-4327';
const INSTAGRAM_APP_SECRET = 'instagram-secret-test';

interface ConfigOverrides {
  isMetaConfigured?: () => boolean;
  isInstagramConfigured?: () => boolean;
}

function createConfig(overrides: ConfigOverrides = {}): MetaProviderConfig {
  return {
    appId: FACEBOOK_APP_ID,
    appSecret: FACEBOOK_APP_SECRET,
    instagramAppId: INSTAGRAM_APP_ID,
    instagramAppSecret: INSTAGRAM_APP_SECRET,
    oauthRedirectUri: 'http://localhost:4000/api/integrations/meta/oauth/callback',
    facebookOAuthDialogUrl: 'https://www.facebook.com/v23.0/dialog/oauth',
    instagramOAuthAuthorizeUrl: 'https://www.instagram.com/oauth/authorize',
    graphBaseUrl: 'https://graph.facebook.com/v23.0',
    instagramGraphBaseUrl: 'https://graph.instagram.com/v23.0',
    appUrl: 'http://localhost:3000',
    integrationsReturnPath: '/settings/integrations',
    isMetaConfigured: overrides.isMetaConfigured ?? (() => true),
    isInstagramConfigured: overrides.isInstagramConfigured ?? (() => true),
    scopesForPlatform: (platform: 'FACEBOOK' | 'INSTAGRAM') =>
      platform === 'FACEBOOK' ? META_FACEBOOK_OAUTH_SCOPES : META_INSTAGRAM_OAUTH_SCOPES,
    authorizeUrlForPlatform: (platform: 'FACEBOOK' | 'INSTAGRAM') =>
      platform === 'FACEBOOK'
        ? 'https://www.facebook.com/v23.0/dialog/oauth'
        : 'https://www.instagram.com/oauth/authorize',
  } as MetaProviderConfig;
}

function createService(overrides: ConfigOverrides = {}): MetaOAuthService {
  const prisma = {
    metaConnectedAccount: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 'account-1' }),
      update: vi.fn(),
    },
  };
  const secretStore = {
    store: vi.fn().mockResolvedValue(undefined),
  };
  const configService = {
    getOrThrow: vi.fn().mockReturnValue(JWT_SECRET),
  };
  return new MetaOAuthService(
    prisma as never,
    createConfig(overrides),
    secretStore as never,
    configService as never,
  );
}

describe('MetaOAuthService.buildAuthUrl', () => {
  it('returns Facebook OAuth URL with META_APP_ID for FACEBOOK platform', () => {
    const service = createService();
    const url = service.buildAuthUrl('employee-1', 'FACEBOOK');
    const parsed = new URL(url);

    expect(parsed.hostname).toBe('www.facebook.com');
    expect(parsed.searchParams.get('client_id')).toBe(FACEBOOK_APP_ID);
    expect(parsed.searchParams.get('client_id')).not.toBe(INSTAGRAM_APP_ID);
    expect(url).toContain('pages_messaging');
    expect(url).toContain('pages_read_engagement');
    expect(url).not.toContain('instagram_business');

    const state = parsed.searchParams.get('state');
    expect(state).toBeTruthy();
    const payload = jwt.verify(state!, JWT_SECRET) as { platform: string; employeeId: string };
    expect(payload.platform).toBe('FACEBOOK');
    expect(payload.employeeId).toBe('employee-1');
  });

  it('returns Instagram OAuth URL with INSTAGRAM_APP_ID for INSTAGRAM platform', () => {
    const service = createService();
    const url = service.buildAuthUrl('employee-1', 'INSTAGRAM');
    const parsed = new URL(url);

    expect(parsed.hostname).toBe('www.instagram.com');
    expect(parsed.pathname).toBe('/oauth/authorize');
    expect(parsed.searchParams.get('client_id')).toBe(INSTAGRAM_APP_ID);
    expect(parsed.searchParams.get('client_id')).not.toBe(FACEBOOK_APP_ID);
    expect(url).toContain('instagram_business_basic');
    expect(url).toContain('instagram_business_manage_messages');
    expect(url).not.toContain('pages_messaging');

    const state = parsed.searchParams.get('state');
    const payload = jwt.verify(state!, JWT_SECRET) as { platform: string; employeeId: string };
    expect(payload.platform).toBe('INSTAGRAM');
  });

  it('fails Instagram OAuth start when Instagram credentials are missing', () => {
    const service = createService({ isInstagramConfigured: () => false });
    expect(() => service.buildAuthUrl('employee-1', 'INSTAGRAM')).toThrow(BadRequestException);
    expect(() => service.buildAuthUrl('employee-1', 'INSTAGRAM')).toThrow(
      /Instagram OAuth is not configured/,
    );
  });

  it('allows Facebook OAuth start when only Facebook credentials are configured', () => {
    const service = createService({
      isMetaConfigured: () => true,
      isInstagramConfigured: () => false,
    });
    const url = service.buildAuthUrl('employee-1', 'FACEBOOK');
    expect(new URL(url).searchParams.get('client_id')).toBe(FACEBOOK_APP_ID);
  });

  it('fails Facebook OAuth start when Facebook credentials are missing', () => {
    const service = createService({ isMetaConfigured: () => false });
    expect(() => service.buildAuthUrl('employee-1', 'FACEBOOK')).toThrow(BadRequestException);
    expect(() => service.buildAuthUrl('employee-1', 'FACEBOOK')).toThrow(
      /Facebook OAuth is not configured/,
    );
  });

  it('allows Instagram OAuth start when only Instagram credentials are configured', () => {
    const service = createService({
      isMetaConfigured: () => false,
      isInstagramConfigured: () => true,
    });
    const url = service.buildAuthUrl('employee-1', 'INSTAGRAM');
    expect(new URL(url).searchParams.get('client_id')).toBe(INSTAGRAM_APP_ID);
  });
});

describe('MetaOAuthService.handleCallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses Facebook callback branch with META credentials when state.platform is FACEBOOK', async () => {
    const service = createService();
    const fetchUserPages = vi.fn().mockResolvedValue([
      {
        id: 'page-1',
        name: 'Test Page',
        access_token: 'page-token',
      },
    ]);
    const exchangeCodeForToken = vi.fn().mockResolvedValue({ access_token: 'short-token' });
    const exchangeForLongLivedToken = vi.fn().mockResolvedValue({
      access_token: 'long-token',
      expires_in: 3600,
    });
    const subscribePageToWebhook = vi.fn().mockResolvedValue(undefined);
    vi.mocked(MetaGraphClient).mockImplementation(
      class MockMetaGraphClient {
        exchangeCodeForToken = exchangeCodeForToken;
        exchangeForLongLivedToken = exchangeForLongLivedToken;
        fetchUserPages = fetchUserPages;
        subscribePageToWebhook = subscribePageToWebhook;
      } as unknown as typeof MetaGraphClient,
    );

    const state = jwt.sign({ employeeId: 'employee-1', platform: 'FACEBOOK' }, JWT_SECRET, {
      expiresIn: 600,
    });
    const result = await service.handleCallback('auth-code', state);

    expect(MetaGraphClient).toHaveBeenCalledWith(
      'https://graph.facebook.com/v23.0',
      FACEBOOK_APP_ID,
      FACEBOOK_APP_SECRET,
    );
    expect(exchangeCodeForToken).toHaveBeenCalled();
    expect(fetchUserPages).toHaveBeenCalled();
    expect(MetaInstagramGraphClient).not.toHaveBeenCalled();
    expect(result.redirectUrl).toContain('/settings/integrations?oauth=success');
  });

  it('uses Instagram callback branch with Instagram credentials when state.platform is INSTAGRAM', async () => {
    const service = createService();
    const exchangeCodeForToken = vi.fn().mockResolvedValue({
      access_token: 'ig-short-token',
      user_id: '17841400000000000',
    });
    const exchangeForLongLivedToken = vi.fn().mockResolvedValue({
      access_token: 'ig-long-token',
      expires_in: 3600,
    });
    const fetchProfile = vi.fn().mockResolvedValue({
      id: '17841400000000000',
      username: 'nbos_test',
      name: 'NBOS Test',
    });
    vi.mocked(MetaInstagramGraphClient).mockImplementation(
      class MockMetaInstagramGraphClient {
        exchangeCodeForToken = exchangeCodeForToken;
        exchangeForLongLivedToken = exchangeForLongLivedToken;
        fetchProfile = fetchProfile;
      } as unknown as typeof MetaInstagramGraphClient,
    );

    const state = jwt.sign({ employeeId: 'employee-1', platform: 'INSTAGRAM' }, JWT_SECRET, {
      expiresIn: 600,
    });
    const result = await service.handleCallback('auth-code', state);

    expect(MetaInstagramGraphClient).toHaveBeenCalledWith(
      'https://graph.instagram.com/v23.0',
      INSTAGRAM_APP_ID,
      INSTAGRAM_APP_SECRET,
    );
    expect(MetaInstagramGraphClient).not.toHaveBeenCalledWith(
      expect.anything(),
      FACEBOOK_APP_ID,
      expect.anything(),
    );
    expect(exchangeCodeForToken).toHaveBeenCalled();
    expect(fetchProfile).toHaveBeenCalled();
    expect(MetaGraphClient).not.toHaveBeenCalled();
    expect(result.accountCount).toBe(1);
    expect(result.redirectUrl).toContain('/settings/integrations?oauth=success');
  });

  it('rejects callback state missing platform instead of defaulting to Facebook', async () => {
    const service = createService();
    const state = jwt.sign({ employeeId: 'employee-1' }, JWT_SECRET, { expiresIn: 600 });

    await expect(service.handleCallback('auth-code', state)).rejects.toThrow(
      /Invalid or expired OAuth state/,
    );
    expect(MetaGraphClient).not.toHaveBeenCalled();
    expect(MetaInstagramGraphClient).not.toHaveBeenCalled();
  });

  it('fails Instagram callback when Instagram credentials are missing even if Facebook is configured', async () => {
    const service = createService({ isInstagramConfigured: () => false });
    const state = jwt.sign({ employeeId: 'employee-1', platform: 'INSTAGRAM' }, JWT_SECRET, {
      expiresIn: 600,
    });

    await expect(service.handleCallback('auth-code', state)).rejects.toThrow(
      /Instagram OAuth is not configured/,
    );
    expect(MetaInstagramGraphClient).not.toHaveBeenCalled();
  });

  it('fails Facebook callback when Facebook credentials are missing even if Instagram is configured', async () => {
    const service = createService({ isMetaConfigured: () => false });
    const state = jwt.sign({ employeeId: 'employee-1', platform: 'FACEBOOK' }, JWT_SECRET, {
      expiresIn: 600,
    });

    await expect(service.handleCallback('auth-code', state)).rejects.toThrow(
      /Facebook OAuth is not configured/,
    );
    expect(MetaGraphClient).not.toHaveBeenCalled();
  });
});
