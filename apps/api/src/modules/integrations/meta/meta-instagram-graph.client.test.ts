import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { MetaInstagramGraphClient } from './meta-instagram-graph.client';
import { MetaOAuthCallbackError } from './meta-oauth-callback.error';

const GRAPH_BASE_URL = 'https://graph.instagram.com/v21.0';
const APP_ID = 'test-instagram-app-id';
const APP_SECRET = 'test-instagram-app-secret';
const REDIRECT_URI = 'http://localhost:4000/api/integrations/meta/oauth/callback';

function createClient(): MetaInstagramGraphClient {
  return new MetaInstagramGraphClient(GRAPH_BASE_URL, APP_ID, APP_SECRET);
}

function mockFetchJson(body: unknown, ok = true, status = ok ? 200 : 400): void {
  vi.mocked(fetch).mockResolvedValue({
    ok,
    status,
    json: async () => body,
  } as Response);
}

describe('MetaInstagramGraphClient.exchangeCodeForToken', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('accepts a flat token response', async () => {
    mockFetchJson({ access_token: 'test-token', user_id: '123' });
    const result = await createClient().exchangeCodeForToken('auth-code', REDIRECT_URI);
    expect(result.access_token).toBe('test-token');
    expect(result.user_id).toBe('123');
  });

  it('accepts a wrapped token response with data array', async () => {
    mockFetchJson({
      data: [{ access_token: 'test-token', user_id: '123' }],
    });
    const result = await createClient().exchangeCodeForToken('auth-code', REDIRECT_URI);
    expect(result.access_token).toBe('test-token');
    expect(result.user_id).toBe('123');
  });

  it('rejects an empty data envelope with instagram_response_invalid', async () => {
    mockFetchJson({ data: [] });
    await expect(
      createClient().exchangeCodeForToken('auth-code', REDIRECT_URI),
    ).rejects.toMatchObject({
      publicReason: 'instagram_response_invalid',
      stage: 'instagram_response_parsing',
    });
  });

  it('rejects a response without access_token with instagram_response_invalid', async () => {
    mockFetchJson({ data: [{ permissions: 'instagram_business_basic' }] });
    await expect(
      createClient().exchangeCodeForToken('auth-code', REDIRECT_URI),
    ).rejects.toMatchObject({
      publicReason: 'instagram_response_invalid',
      stage: 'instagram_response_parsing',
    });
  });

  it('maps upstream token exchange failures to instagram_token_exchange_failed', async () => {
    mockFetchJson(
      {
        error_type: 'OAuthException',
        code: 400,
        error_message: 'Invalid redirect URI',
      },
      false,
      400,
    );
    await expect(
      createClient().exchangeCodeForToken('auth-code', REDIRECT_URI),
    ).rejects.toMatchObject({
      publicReason: 'instagram_token_exchange_failed',
      stage: 'instagram_token_exchange',
      upstreamStatus: 400,
      upstreamCode: 400,
      upstreamType: 'OAuthException',
    });
  });
});

describe('MetaInstagramGraphClient.fetchProfile', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('accepts a flat profile response', async () => {
    mockFetchJson({ user_id: '123', username: 'nbos_test', name: 'NBOS Test' });
    const profile = await createClient().fetchProfile('profile-token');
    expect(profile.id).toBe('123');
    expect(profile.username).toBe('nbos_test');
    expect(profile.name).toBe('NBOS Test');
  });

  it('accepts a wrapped profile response with data array', async () => {
    mockFetchJson({
      data: [{ user_id: '123', username: 'nbos_test', name: 'NBOS Test' }],
    });
    const profile = await createClient().fetchProfile('profile-token');
    expect(profile.id).toBe('123');
    expect(profile.username).toBe('nbos_test');
  });

  it('accepts id as fallback when user_id is absent', async () => {
    mockFetchJson({ id: '456', username: 'nbos_fallback' });
    const profile = await createClient().fetchProfile('profile-token');
    expect(profile.id).toBe('456');
    expect(profile.username).toBe('nbos_fallback');
  });

  it('rejects an empty data envelope with instagram_response_invalid', async () => {
    mockFetchJson({ data: [] });
    await expect(createClient().fetchProfile('profile-token')).rejects.toMatchObject({
      publicReason: 'instagram_response_invalid',
      stage: 'instagram_response_parsing',
    });
  });

  it('rejects a profile response missing user_id and id', async () => {
    mockFetchJson({ username: 'nbos_orphan' });
    await expect(createClient().fetchProfile('profile-token')).rejects.toMatchObject({
      publicReason: 'instagram_profile_failed',
      stage: 'instagram_profile',
    });
  });
});

describe('MetaInstagramGraphClient.exchangeForLongLivedToken', () => {
  const SHORT_LIVED_TOKEN = 'ig-short-lived-token-test';

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses GET with query params and no request body', async () => {
    mockFetchJson({
      access_token: 'ig-long-lived-token-test',
      token_type: 'bearer',
      expires_in: 5_184_000,
    });

    await createClient().exchangeForLongLivedToken(SHORT_LIVED_TOKEN);

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit | undefined];
    expect(url.startsWith('https://graph.instagram.com/access_token')).toBe(true);
    expect(url).not.toContain('/v21.0/');

    const parsedUrl = new URL(url);
    expect(parsedUrl.searchParams.get('grant_type')).toBe('ig_exchange_token');
    expect(parsedUrl.searchParams.get('client_secret')).toBe(APP_SECRET);
    expect(parsedUrl.searchParams.get('access_token')).toBe(SHORT_LIVED_TOKEN);

    expect(init?.method).toBe('GET');
    expect(init?.body).toBeUndefined();
  });

  it('returns access_token, token_type, and expires_in on success', async () => {
    mockFetchJson({
      access_token: 'ig-long-lived-token-test',
      token_type: 'bearer',
      expires_in: 5_184_000,
    });

    const result = await createClient().exchangeForLongLivedToken(SHORT_LIVED_TOKEN);
    expect(result.access_token).toBe('ig-long-lived-token-test');
    expect(result.token_type).toBe('bearer');
    expect(result.expires_in).toBe(5_184_000);
  });

  it('maps HTTP 400 failures to instagram_long_lived_token_failed', async () => {
    mockFetchJson(
      {
        error: {
          message:
            "Unsupported post request. Object with ID 'access_token' does not exist, cannot be loaded due to missing permissions, or does not support this operation",
          type: 'IGApiException',
          code: 100,
        },
      },
      false,
      400,
    );

    await expect(createClient().exchangeForLongLivedToken(SHORT_LIVED_TOKEN)).rejects.toMatchObject(
      {
        publicReason: 'instagram_long_lived_token_failed',
        stage: 'instagram_long_lived_token',
        upstreamStatus: 400,
        upstreamCode: 100,
        upstreamType: 'IGApiException',
      },
    );
  });

  it('rejects a success response without access_token', async () => {
    mockFetchJson({ token_type: 'bearer', expires_in: 5_184_000 });

    await expect(createClient().exchangeForLongLivedToken(SHORT_LIVED_TOKEN)).rejects.toMatchObject(
      {
        publicReason: 'instagram_response_invalid',
        stage: 'instagram_response_parsing',
      },
    );
  });
});

describe('MetaOAuthCallbackError.fromPrismaPersistence', () => {
  it('maps prisma persistence failures to instagram_account_save_failed', () => {
    const error = MetaOAuthCallbackError.fromPrismaPersistence({ code: 'P2002' });
    expect(error.publicReason).toBe('instagram_account_save_failed');
    expect(error.stage).toBe('instagram_account_persistence');
    expect(error.safeDetails).toBe('prisma_code=P2002');
  });
});
