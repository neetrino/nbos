import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { MetaInstagramGraphClient } from './meta-instagram-graph.client';
import { MetaInstagramOAuthException } from './meta-instagram-oauth.errors';

const GRAPH_BASE_URL = 'https://graph.instagram.com/v21.0';
const APP_ID = 'test-instagram-app-id';
const APP_SECRET = 'test-instagram-app-secret';
const REDIRECT_URI = 'http://localhost:4000/api/integrations/meta/oauth/callback';

function createClient(): MetaInstagramGraphClient {
  return new MetaInstagramGraphClient(GRAPH_BASE_URL, APP_ID, APP_SECRET);
}

function mockFetchJson(body: unknown, ok = true): void {
  vi.mocked(fetch).mockResolvedValue({
    ok,
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

  it('rejects an empty data envelope', async () => {
    mockFetchJson({ data: [] });
    await expect(createClient().exchangeCodeForToken('auth-code', REDIRECT_URI)).rejects.toThrow(
      MetaInstagramOAuthException,
    );
    await expect(createClient().exchangeCodeForToken('auth-code', REDIRECT_URI)).rejects.toThrow(
      /empty/i,
    );
  });

  it('rejects a response without access_token and user_id', async () => {
    mockFetchJson({ data: [{ permissions: 'instagram_business_basic' }] });
    await expect(createClient().exchangeCodeForToken('auth-code', REDIRECT_URI)).rejects.toThrow(
      /access_token/i,
    );
  });

  it('rejects a response without user_id', async () => {
    mockFetchJson({ access_token: 'test-token' });
    await expect(createClient().exchangeCodeForToken('auth-code', REDIRECT_URI)).rejects.toThrow(
      /user_id/i,
    );
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

  it('rejects an empty data envelope', async () => {
    mockFetchJson({ data: [] });
    await expect(createClient().fetchProfile('profile-token')).rejects.toThrow(
      MetaInstagramOAuthException,
    );
    await expect(createClient().fetchProfile('profile-token')).rejects.toThrow(/empty/i);
  });

  it('rejects a profile response missing user_id and id', async () => {
    mockFetchJson({ username: 'nbos_orphan' });
    await expect(createClient().fetchProfile('profile-token')).rejects.toThrow(/account id/i);
  });
});
