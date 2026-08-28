import { describe, expect, it, vi } from 'vitest';
import { assertHttpsBaseUrl, WhatsAppGatewayClient } from './whatsapp-gateway.client';
import { WhatsAppGatewayHttpError } from './whatsapp-gateway.errors';

describe('assertHttpsBaseUrl', () => {
  it('accepts HTTPS URL without trailing slash', () => {
    expect(assertHttpsBaseUrl('https://wa-gateway.test', false)).toBe('https://wa-gateway.test');
  });

  it('strips one trailing slash', () => {
    expect(assertHttpsBaseUrl('https://wa-gateway.test/', false)).toBe('https://wa-gateway.test');
  });

  it('strips multiple trailing slashes', () => {
    expect(assertHttpsBaseUrl('https://wa-gateway.test///', false)).toBe('https://wa-gateway.test');
  });

  it('allows HTTP localhost when enabled', () => {
    expect(assertHttpsBaseUrl('http://localhost:3001/', true)).toBe('http://localhost:3001');
  });

  it('trims surrounding whitespace before validation', () => {
    expect(assertHttpsBaseUrl('  https://wa-gateway.test/  ', false)).toBe(
      'https://wa-gateway.test',
    );
  });

  it('rejects invalid URL', () => {
    expect(() => assertHttpsBaseUrl('not-a-url', false)).toThrow(WhatsAppGatewayHttpError);
  });

  it('rejects HTTP non-localhost even when localhost is allowed', () => {
    expect(() => assertHttpsBaseUrl('http://example.com', true)).toThrow(WhatsAppGatewayHttpError);
  });
});

describe('WhatsAppGatewayClient', () => {
  const client = new WhatsAppGatewayClient();
  const config = {
    baseUrl: 'https://wa-gateway.test',
    apiToken: 'gw_test_token',
  };

  it('maps successful create group response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { id: '120363@g.us', name: 'ACME · Website' },
        }),
      }),
    );

    const result = await client.createGroup(
      config,
      { name: 'ACME · Website', participants: ['37499123456@c.us'] },
      'whatsapp-product-group:create:p1',
    );
    expect(result.id).toBe('120363@g.us');
    expect(fetch).toHaveBeenCalledWith(
      'https://wa-gateway.test/api/groups',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer gw_test_token',
          'Idempotency-Key': 'whatsapp-product-group:create:p1',
        }),
      }),
    );
  });

  it('throws WhatsAppGatewayHttpError on unknown create outcome', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({
          success: false,
          error: { code: 'GROUP_CREATE_OUTCOME_UNKNOWN', message: 'Timeout' },
        }),
      }),
    );

    await expect(
      client.createGroup(config, { name: 'X', participants: ['37499123456@c.us'] }, 'key'),
    ).rejects.toBeInstanceOf(WhatsAppGatewayHttpError);
  });

  it('treats alreadyMembers as success payload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            groupId: '120363@g.us',
            status: 'completed',
            added: [],
            alreadyMembers: ['37499123456@c.us'],
            failed: [],
          },
        }),
      }),
    );
    const result = await client.addParticipants(
      config,
      '120363@g.us',
      ['37499123456@c.us'],
      'participant-key',
    );
    expect(result.alreadyMembers).toEqual(['37499123456@c.us']);
  });

  it('lists groups with pagination and search', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            groups: [{ id: '120363@g.us', name: 'Finance' }],
            pagination: { limit: 20, offset: 0, count: 1 },
          },
        }),
      }),
    );

    const result = await client.listGroups(config, { limit: 20, offset: 0, search: 'Finance' });
    expect(result.groups).toHaveLength(1);
    expect(fetch).toHaveBeenCalledWith(
      'https://wa-gateway.test/api/groups?limit=20&offset=0&search=Finance',
      expect.objectContaining({ method: 'GET' }),
    );
  });
});
