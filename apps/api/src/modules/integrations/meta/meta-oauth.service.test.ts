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

function createConfig(): MetaProviderConfig {
  return {
    appId: 'meta-app-id',
    appSecret: 'meta-app-secret',
    oauthRedirectUri: 'http://localhost:4000/api/integrations/meta/oauth/callback',
    facebookOAuthDialogUrl: 'https://www.facebook.com/v23.0/dialog/oauth',
    instagramOAuthAuthorizeUrl: 'https://www.instagram.com/oauth/authorize',
    graphBaseUrl: 'https://graph.facebook.com/v23.0',
    instagramGraphBaseUrl: 'https://graph.instagram.com/v23.0',
    appUrl: 'http://localhost:3000',
    integrationsReturnPath: '/settings/integrations',
    isMetaConfigured: () => true,
    scopesForPlatform: (platform: 'FACEBOOK' | 'INSTAGRAM') =>
      platform === 'FACEBOOK' ? META_FACEBOOK_OAUTH_SCOPES : META_INSTAGRAM_OAUTH_SCOPES,
    authorizeUrlForPlatform: (platform: 'FACEBOOK' | 'INSTAGRAM') =>
      platform === 'FACEBOOK'
        ? 'https://www.facebook.com/v23.0/dialog/oauth'
        : 'https://www.instagram.com/oauth/authorize',
  } as MetaProviderConfig;
}

function createService(): MetaOAuthService {
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
    createConfig(),
    secretStore as never,
    configService as never,
  );
}

describe('MetaOAuthService.buildAuthUrl', () => {
  it('returns Facebook OAuth URL for FACEBOOK platform', () => {
    const service = createService();
    const url = service.buildAuthUrl('employee-1', 'FACEBOOK');
    expect(url.startsWith('https://www.facebook.com/')).toBe(true);
    expect(url).toContain('pages_messaging');
    expect(url).not.toContain('instagram_business');
    const state = new URL(url).searchParams.get('state');
    expect(state).toBeTruthy();
    const payload = jwt.verify(state!, JWT_SECRET) as { platform: string; employeeId: string };
    expect(payload.platform).toBe('FACEBOOK');
    expect(payload.employeeId).toBe('employee-1');
  });

  it('returns Instagram OAuth URL for INSTAGRAM platform', () => {
    const service = createService();
    const url = service.buildAuthUrl('employee-1', 'INSTAGRAM');
    expect(url.startsWith('https://www.instagram.com/oauth/authorize')).toBe(true);
    expect(url).toContain('instagram_business_basic');
    expect(url).not.toContain('pages_messaging');
    const state = new URL(url).searchParams.get('state');
    const payload = jwt.verify(state!, JWT_SECRET) as { platform: string; employeeId: string };
    expect(payload.platform).toBe('INSTAGRAM');
  });
});

describe('MetaOAuthService.handleCallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses Facebook callback branch when state.platform is FACEBOOK', async () => {
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

    expect(exchangeCodeForToken).toHaveBeenCalled();
    expect(fetchUserPages).toHaveBeenCalled();
    expect(MetaInstagramGraphClient).not.toHaveBeenCalled();
    expect(result.redirectUrl).toContain('/settings/integrations?oauth=success');
  });

  it('uses Instagram callback branch when state.platform is INSTAGRAM', async () => {
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

    expect(exchangeCodeForToken).toHaveBeenCalled();
    expect(fetchProfile).toHaveBeenCalled();
    expect(MetaGraphClient).not.toHaveBeenCalled();
    expect(result.accountCount).toBe(1);
    expect(result.redirectUrl).toContain('/settings/integrations?oauth=success');
  });
});
