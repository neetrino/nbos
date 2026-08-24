import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';
import { ArmeniaCompanyLookupClient } from './armenia-company-lookup.client';

function jsonResponse(body: unknown, status = 200, cookies: string[] = []): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...(cookies.length > 0 ? { 'Set-Cookie': cookies } : {}),
    },
  });
}

function htmlSessionResponse(): Response {
  const headers = new Headers();
  headers.append('Set-Cookie', 'XSRF-TOKEN=token%3D; Path=/');
  headers.append('Set-Cookie', 'laravel_session=sess; Path=/; HttpOnly');
  return new Response('<html></html>', { status: 200, headers });
}

describe('ArmeniaCompanyLookupClient', () => {
  const fetchMock = vi.fn();
  let client: ArmeniaCompanyLookupClient;

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    client = new ArmeniaCompanyLookupClient({
      get: (key: string) => (key === 'ARMENIA_SRC_BASE_URL' ? undefined : undefined),
    } as unknown as ConfigService);
  });

  it('sends CSRF cookies to SRC and returns taxpayer rows', async () => {
    fetchMock
      .mockResolvedValueOnce(htmlSessionResponse())
      .mockResolvedValueOnce(jsonResponse({ data: [{ tin: '00161665', name: 'EVOLVER' }] }));

    const rows = await client.searchRows({ kind: 'tin', value: '00161665' });
    expect(rows).toEqual([{ tin: '00161665', name: 'EVOLVER' }]);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/am/taxpayerSearchSystemPage/112');
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain('/am/taxpayerSearchData');
    const post = fetchMock.mock.calls[1]?.[1] as RequestInit;
    expect(post.method).toBe('POST');
    expect((post.headers as Record<string, string>)['X-XSRF-TOKEN']).toBe('token=');
    expect(JSON.parse(String(post.body))).toMatchObject({ tin: '00161665', name: '' });
  });

  it('maps an upstream failure to lookup unavailable', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network'));
    await expect(client.searchRows({ kind: 'tin', value: '00161665' })).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
