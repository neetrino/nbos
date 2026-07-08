import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import {
  META_FACEBOOK_OAUTH_SCOPES,
  META_INSTAGRAM_OAUTH_SCOPES,
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
