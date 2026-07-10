import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  buildMetaGraphUrl,
  extractGraphVersionFromBaseUrl,
  FACEBOOK_MESSAGING_PROFILE_FIELDS,
  fetchMetaGraphJson,
  INSTAGRAM_MESSAGING_PROFILE_FIELDS,
  META_GRAPH_FACEBOOK_ORIGIN,
  META_GRAPH_INSTAGRAM_ORIGIN,
  MetaGraphValidationError,
  validateMetaGraphResourceId,
  validateMetaGraphVersion,
} from './meta-fetch.util';

const ACCESS_TOKEN = 'test-access-token';

describe('validateMetaGraphResourceId', () => {
  it('accepts valid numeric senderScopedId', () => {
    expect(() => validateMetaGraphResourceId('17841400000000001')).not.toThrow();
  });

  it.each([
    ['', 'empty'],
    ['abc', 'non-numeric'],
    ['12/34', 'slash'],
    ['12\\34', 'backslash'],
    ['12?x=1', 'question mark'],
    ['12#frag', 'hash'],
    ['https://evil.example', 'protocol hostname'],
    ['12%2f34', 'encoded slash'],
    ['12%5c34', 'encoded backslash'],
  ])('rejects senderScopedId with %s', (value) => {
    expect(() => validateMetaGraphResourceId(value)).toThrow(MetaGraphValidationError);
  });
});

describe('validateMetaGraphVersion', () => {
  it('accepts valid graph version', () => {
    expect(() => validateMetaGraphVersion('v21.0')).not.toThrow();
  });

  it.each(['21.0', 'v21', 'v21.0/extra', 'v21.0evil'])(
    'rejects invalid graph version %s',
    (value) => {
      expect(() => validateMetaGraphVersion(value)).toThrow(MetaGraphValidationError);
    },
  );
});

describe('buildMetaGraphUrl', () => {
  it('builds Facebook origin URL', () => {
    const url = buildMetaGraphUrl({
      target: 'FACEBOOK',
      graphVersion: 'v21.0',
      resourceId: '12345',
      fields: FACEBOOK_MESSAGING_PROFILE_FIELDS,
      accessToken: ACCESS_TOKEN,
    });
    expect(url.origin).toBe(META_GRAPH_FACEBOOK_ORIGIN);
    expect(url.pathname).toBe('/v21.0/12345');
    expect(url.protocol).toBe('https:');
  });

  it('builds Instagram origin URL', () => {
    const url = buildMetaGraphUrl({
      target: 'INSTAGRAM',
      graphVersion: 'v21.0',
      resourceId: '67890',
      fields: INSTAGRAM_MESSAGING_PROFILE_FIELDS,
      accessToken: ACCESS_TOKEN,
    });
    expect(url.origin).toBe(META_GRAPH_INSTAGRAM_ORIGIN);
    expect(url.pathname).toBe('/v21.0/67890');
  });

  it('rejects non-allowlisted fields', () => {
    expect(() =>
      buildMetaGraphUrl({
        target: 'FACEBOOK',
        graphVersion: 'v21.0',
        resourceId: '12345',
        fields: ['evil_field'],
        accessToken: ACCESS_TOKEN,
      }),
    ).toThrow(MetaGraphValidationError);
  });

  it('rejects mismatched target and would-be injected origin via resource id', () => {
    expect(() =>
      buildMetaGraphUrl({
        target: 'FACEBOOK',
        graphVersion: 'v21.0',
        resourceId: '../evil',
        fields: FACEBOOK_MESSAGING_PROFILE_FIELDS,
        accessToken: ACCESS_TOKEN,
      }),
    ).toThrow(MetaGraphValidationError);
  });

  it('keeps the same pathname for valid numeric resource IDs after encoding', () => {
    const url = buildMetaGraphUrl({
      target: 'FACEBOOK',
      graphVersion: 'v21.0',
      resourceId: '17841400000000001',
      fields: FACEBOOK_MESSAGING_PROFILE_FIELDS,
      accessToken: ACCESS_TOKEN,
    });
    expect(url.pathname).toBe('/v21.0/17841400000000001');
  });

  it('keeps the same pathname for valid Graph versions after encoding', () => {
    const url = buildMetaGraphUrl({
      target: 'INSTAGRAM',
      graphVersion: 'v22.1',
      resourceId: '12345',
      fields: INSTAGRAM_MESSAGING_PROFILE_FIELDS,
      accessToken: ACCESS_TOKEN,
    });
    expect(url.pathname).toBe('/v22.1/12345');
  });
});

describe('extractGraphVersionFromBaseUrl', () => {
  it('extracts version from configured Facebook base URL', () => {
    expect(extractGraphVersionFromBaseUrl('https://graph.facebook.com/v21.0', 'FACEBOOK')).toBe(
      'v21.0',
    );
  });

  it('rejects non-allowlisted graph base URL origin', () => {
    expect(() => extractGraphVersionFromBaseUrl('https://evil.example/v21.0', 'FACEBOOK')).toThrow(
      MetaGraphValidationError,
    );
  });

  it('rejects HTTP protocol in graph base URL', () => {
    expect(() =>
      extractGraphVersionFromBaseUrl('http://graph.facebook.com/v21.0', 'FACEBOOK'),
    ).toThrow(MetaGraphValidationError);
  });

  it('rejects embedded credentials in graph base URL', () => {
    expect(() =>
      extractGraphVersionFromBaseUrl('https://user:pass@graph.facebook.com/v21.0', 'FACEBOOK'),
    ).toThrow(MetaGraphValidationError);
  });

  it('rejects non-standard port in graph base URL', () => {
    expect(() =>
      extractGraphVersionFromBaseUrl('https://graph.facebook.com:8443/v21.0', 'FACEBOOK'),
    ).toThrow(MetaGraphValidationError);
  });
});

describe('fetchMetaGraphJson', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls fetch with redirect error and Facebook origin', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ name: 'Test User' }),
    } as Response);

    await fetchMetaGraphJson({
      target: 'FACEBOOK',
      graphVersion: 'v21.0',
      resourceId: '1234567890',
      fields: FACEBOOK_MESSAGING_PROFILE_FIELDS,
      accessToken: ACCESS_TOKEN,
    });

    expect(fetch).toHaveBeenCalledTimes(1);
    const [calledUrl, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    const parsed = new URL(calledUrl);
    expect(parsed.origin).toBe(META_GRAPH_FACEBOOK_ORIGIN);
    expect(init.redirect).toBe('error');
    expect(calledUrl).not.toContain(ACCESS_TOKEN);
    expect(JSON.stringify(init)).not.toContain(ACCESS_TOKEN);
  });

  it('uses redirect error for Meta Graph fetch', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ username: 'nbos_test' }),
    } as Response);

    await fetchMetaGraphJson({
      target: 'INSTAGRAM',
      graphVersion: 'v21.0',
      resourceId: '9876543210',
      fields: INSTAGRAM_MESSAGING_PROFILE_FIELDS,
      accessToken: ACCESS_TOKEN,
    });

    const init = vi.mocked(fetch).mock.calls[0]?.[1] as RequestInit;
    expect(init.redirect).toBe('error');
  });

  it('returns timeout result without throwing', async () => {
    const abortError = new Error('aborted');
    abortError.name = 'AbortError';
    vi.mocked(fetch).mockRejectedValue(abortError);

    const result = await fetchMetaGraphJson({
      target: 'FACEBOOK',
      graphVersion: 'v21.0',
      resourceId: '111',
      fields: FACEBOOK_MESSAGING_PROFILE_FIELDS,
      accessToken: ACCESS_TOKEN,
      timeoutMs: 10,
    });

    expect(result.ok).toBe(false);
    expect(result.status).toBe(0);
  });

  it('rejects invalid resource id before fetch', async () => {
    await expect(
      fetchMetaGraphJson({
        target: 'FACEBOOK',
        graphVersion: 'v21.0',
        resourceId: 'not-numeric',
        fields: FACEBOOK_MESSAGING_PROFILE_FIELDS,
        accessToken: ACCESS_TOKEN,
      }),
    ).rejects.toThrow(MetaGraphValidationError);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    ['12/34', 'slash injection'],
    ['12%2f34', 'encoded slash injection'],
    ['12?x=1', 'question-mark injection'],
    ['12#frag', 'hash injection'],
  ])('rejects %s before fetch', async (resourceId) => {
    await expect(
      fetchMetaGraphJson({
        target: 'FACEBOOK',
        graphVersion: 'v21.0',
        resourceId,
        fields: FACEBOOK_MESSAGING_PROFILE_FIELDS,
        accessToken: ACCESS_TOKEN,
      }),
    ).rejects.toThrow(MetaGraphValidationError);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects arbitrary graph base origins before fetch', async () => {
    expect(() => extractGraphVersionFromBaseUrl('https://evil.example/v21.0', 'FACEBOOK')).toThrow(
      MetaGraphValidationError,
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it('keeps exact Facebook origin on fetch', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ name: 'Test User' }),
    } as Response);

    await fetchMetaGraphJson({
      target: 'FACEBOOK',
      graphVersion: 'v21.0',
      resourceId: '1234567890',
      fields: FACEBOOK_MESSAGING_PROFILE_FIELDS,
      accessToken: ACCESS_TOKEN,
    });

    const parsed = new URL(String(vi.mocked(fetch).mock.calls[0]?.[0]));
    expect(parsed.origin).toBe(META_GRAPH_FACEBOOK_ORIGIN);
  });

  it('keeps exact Instagram origin on fetch', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ username: 'nbos_test' }),
    } as Response);

    await fetchMetaGraphJson({
      target: 'INSTAGRAM',
      graphVersion: 'v21.0',
      resourceId: '9876543210',
      fields: INSTAGRAM_MESSAGING_PROFILE_FIELDS,
      accessToken: ACCESS_TOKEN,
    });

    const parsed = new URL(String(vi.mocked(fetch).mock.calls[0]?.[0]));
    expect(parsed.origin).toBe(META_GRAPH_INSTAGRAM_ORIGIN);
  });
});
