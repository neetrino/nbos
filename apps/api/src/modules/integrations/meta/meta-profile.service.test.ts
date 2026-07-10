import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { MetaProfileService } from './meta-profile.service';
import type { MetaProviderConfig } from './meta-provider.config';
import type { MetaProviderSecretStore } from './meta-provider-secret.store';
import { META_PROFILE_CACHE_MS } from './meta-lead-ingest.helpers';

function createService(secret: { pageAccessToken: string } | null): MetaProfileService {
  const config = {
    graphBaseUrl: 'https://graph.facebook.com/v21.0',
    instagramGraphBaseUrl: 'https://graph.instagram.com/v21.0',
    appId: 'fb-app',
    appSecret: 'fb-secret',
    instagramAppId: 'ig-app',
    instagramAppSecret: 'ig-secret',
  } as MetaProviderConfig;

  const secretStore = {
    read: vi.fn().mockResolvedValue(secret),
  } as unknown as MetaProviderSecretStore;

  return new MetaProfileService(config, secretStore);
}

describe('MetaProfileService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-10T12:00:00Z'));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('uses Instagram graph host for Instagram Login accounts', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        name: 'Karo Gabrielyan',
        username: 'karo_gabrielyan',
      }),
    } as Response);

    const service = createService({ pageAccessToken: 'ig-token' });
    const result = await service.resolveSenderProfile(
      {
        id: 'acc-1',
        platform: 'INSTAGRAM',
        scopes: ['instagram_business_basic', 'instagram_business_manage_messages'],
      },
      '17841400000000001',
      null,
    );

    const calledUrl = String(vi.mocked(fetch).mock.calls[0]?.[0]);
    expect(calledUrl).toContain('graph.instagram.com');
    expect(result.profile.displayName).toBe('Karo Gabrielyan');
    expect(result.profile.username).toBe('karo_gabrielyan');
  });

  it('skips lookup when cache is fresh', async () => {
    const service = createService({ pageAccessToken: 'ig-token' });
    const result = await service.resolveSenderProfile(
      {
        id: 'acc-1',
        platform: 'INSTAGRAM',
        scopes: ['instagram_business_basic'],
      },
      '17841400000000001',
      {
        displayName: 'Cached Name',
        username: 'cached_user',
        firstName: null,
        lastName: null,
        profilePictureUrl: null,
        profileFetchedAt: new Date(Date.now() - META_PROFILE_CACHE_MS + 60_000),
        profileFetchStatus: 'OK',
        lastProfileFetchError: null,
      },
    );

    expect(fetch).not.toHaveBeenCalled();
    expect(result.profile.displayName).toBe('Cached Name');
    expect(result.profileFetchStatus).toBe('SKIPPED');
  });

  it('preserves cached profile on lookup failure', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: { message: 'Permissions error', code: 200 } }),
    } as Response);

    const service = createService({ pageAccessToken: 'page-token' });
    const result = await service.resolveSenderProfile(
      {
        id: 'acc-1',
        platform: 'FACEBOOK',
        scopes: ['pages_messaging'],
      },
      '1234567890123456',
      {
        displayName: 'Cached Name',
        username: null,
        firstName: null,
        lastName: null,
        profilePictureUrl: null,
        profileFetchedAt: new Date(Date.now() - META_PROFILE_CACHE_MS - 60_000),
        profileFetchStatus: 'OK',
        lastProfileFetchError: null,
      },
    );

    expect(result.profile.displayName).toBe('Cached Name');
    expect(result.profileFetchStatus).toBe('FAILED');
  });
});
