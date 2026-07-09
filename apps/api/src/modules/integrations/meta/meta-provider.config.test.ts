import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import {
  META_FACEBOOK_OAUTH_SCOPES,
  META_INSTAGRAM_OAUTH_SCOPES,
  MetaProviderConfig,
  assertFacebookOAuthParams,
  assertInstagramOAuthParams,
  buildFacebookOAuthUrl,
  buildInstagramOAuthUrl,
} from './meta-provider.config';

const REDIRECT_URI = 'http://localhost:4000/api/integrations/meta/oauth/callback';
const STATE = 'signed-state';

describe('buildFacebookOAuthUrl', () => {
  it('builds a Facebook OAuth consent URL with Page scopes only', () => {
    const url = buildFacebookOAuthUrl({
      authorizeBaseUrl: 'https://www.facebook.com/v23.0/dialog/oauth',
      clientId: 'app-123',
      redirectUri: REDIRECT_URI,
      state: STATE,
      scopes: META_FACEBOOK_OAUTH_SCOPES,
    });
    expect(url.startsWith('https://www.facebook.com/')).toBe(true);
    expect(url).toContain('client_id=app-123');
    expect(url).toContain('pages_messaging');
    expect(url).toContain('pages_read_engagement');
    expect(url).not.toContain('instagram_business');
  });
});

describe('buildInstagramOAuthUrl', () => {
  it('builds an Instagram OAuth consent URL with Instagram scopes only', () => {
    const url = buildInstagramOAuthUrl({
      authorizeBaseUrl: 'https://www.instagram.com/oauth/authorize',
      clientId: 'app-123',
      redirectUri: REDIRECT_URI,
      state: STATE,
      scopes: META_INSTAGRAM_OAUTH_SCOPES,
    });
    expect(url.startsWith('https://www.instagram.com/oauth/authorize')).toBe(true);
    expect(url).toContain('instagram_business_basic');
    expect(url).toContain('instagram_business_manage_messages');
    expect(url).not.toContain('pages_messaging');
    expect(url).not.toContain('facebook.com');
  });
});

describe('assertFacebookOAuthParams', () => {
  it('rejects instagram.com authorize URLs', () => {
    expect(() =>
      assertFacebookOAuthParams(
        'https://www.instagram.com/oauth/authorize',
        META_FACEBOOK_OAUTH_SCOPES,
      ),
    ).toThrow(BadRequestException);
  });

  it('rejects Instagram scopes', () => {
    expect(() =>
      assertFacebookOAuthParams('https://www.facebook.com/v23.0/dialog/oauth', [
        'pages_messaging',
        'instagram_business_basic',
      ]),
    ).toThrow(BadRequestException);
  });
});

describe('assertInstagramOAuthParams', () => {
  it('rejects facebook.com authorize URLs', () => {
    expect(() =>
      assertInstagramOAuthParams(
        'https://www.facebook.com/v23.0/dialog/oauth',
        META_INSTAGRAM_OAUTH_SCOPES,
      ),
    ).toThrow(BadRequestException);
  });

  it('rejects Facebook Page scopes', () => {
    expect(() =>
      assertInstagramOAuthParams('https://www.instagram.com/oauth/authorize', [
        'instagram_business_basic',
        'pages_messaging',
      ]),
    ).toThrow(BadRequestException);
  });
});

describe('MetaProviderConfig credential helpers', () => {
  function createProviderConfig(env: Record<string, string | undefined>): MetaProviderConfig {
    return new MetaProviderConfig({
      get: (key: string) => env[key],
      getOrThrow: (key: string) => {
        const value = env[key];
        if (!value) {
          throw new Error(`${key} is required`);
        }
        return value;
      },
    } as never);
  }

  it('isMetaConfigured is true only when META_APP_ID and META_APP_SECRET are set', () => {
    const configured = createProviderConfig({
      META_APP_ID: 'facebook-app-1111',
      META_APP_SECRET: 'facebook-secret-test',
    });
    expect(configured.isMetaConfigured()).toBe(true);
    expect(configured.isInstagramConfigured()).toBe(false);
  });

  it('isInstagramConfigured is true only when INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET are set', () => {
    const configured = createProviderConfig({
      INSTAGRAM_APP_ID: 'instagram-app-4327',
      INSTAGRAM_APP_SECRET: 'instagram-secret-test',
    });
    expect(configured.isInstagramConfigured()).toBe(true);
    expect(configured.isMetaConfigured()).toBe(false);
  });

  it('exposes dedicated Instagram getters separate from Facebook appId/appSecret', () => {
    const configured = createProviderConfig({
      META_APP_ID: 'facebook-app-1111',
      META_APP_SECRET: 'facebook-secret-test',
      INSTAGRAM_APP_ID: 'instagram-app-4327',
      INSTAGRAM_APP_SECRET: 'instagram-secret-test',
    });
    expect(configured.appId).toBe('facebook-app-1111');
    expect(configured.instagramAppId).toBe('instagram-app-4327');
    expect(configured.appSecret).toBe('facebook-secret-test');
    expect(configured.instagramAppSecret).toBe('instagram-secret-test');
  });
});
