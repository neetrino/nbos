import { describe, expect, it, vi } from 'vitest';
import { AtsCallbackClient, isAtsCallbackSuccessBody } from './ats-callback.client';
import type { AtsProviderConfig } from './ats-provider.config';

function jsonResponse(status: number, body: unknown, contentType = 'application/json'): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': contentType },
  });
}

describe('isAtsCallbackSuccessBody', () => {
  it('treats non-JSON 2xx as success', async () => {
    const response = new Response('OK', {
      status: 200,
      headers: { 'content-type': 'text/plain' },
    });
    await expect(isAtsCallbackSuccessBody(response)).resolves.toBe(true);
  });

  it('rejects JSON error payloads', async () => {
    await expect(isAtsCallbackSuccessBody(jsonResponse(200, { error: 'busy' }))).resolves.toBe(
      false,
    );
    await expect(isAtsCallbackSuccessBody(jsonResponse(200, { status: 'fail' }))).resolves.toBe(
      false,
    );
    await expect(isAtsCallbackSuccessBody(jsonResponse(200, { success: false }))).resolves.toBe(
      false,
    );
  });

  it('accepts success JSON', async () => {
    await expect(isAtsCallbackSuccessBody(jsonResponse(200, { status: 'success' }))).resolves.toBe(
      true,
    );
  });
});

describe('AtsCallbackClient.startCallbackCall', () => {
  it('returns accepted on HTTP 2xx', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { status: 'success' }));
    vi.stubGlobal('fetch', fetchMock);
    const client = new AtsCallbackClient({
      apiKey: 'test-key',
      isConfigured: () => true,
    } as AtsProviderConfig);

    await expect(client.startCallbackCall({ from: '3126107', to: '37499123456' })).resolves.toEqual(
      { kind: 'accepted' },
    );
    const calledUrl = String(fetchMock.mock.calls[0]?.[0]);
    expect(calledUrl).toContain('from=3126107');
    expect(calledUrl).toContain('to=37499123456');
    expect(calledUrl).toContain('key=test-key');
    vi.unstubAllGlobals();
  });

  it('returns rejected on ATS HTTP error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(500, { status: 'error' })));
    const client = new AtsCallbackClient({
      apiKey: 'test-key',
      isConfigured: () => true,
    } as AtsProviderConfig);

    await expect(client.startCallbackCall({ from: '3126107', to: '37499123456' })).resolves.toEqual(
      {
        kind: 'rejected',
      },
    );
    vi.unstubAllGlobals();
  });

  it('returns unknown on network errors so callers do not mark FAILED', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')));
    const client = new AtsCallbackClient({
      apiKey: 'test-key',
      isConfigured: () => true,
    } as AtsProviderConfig);

    await expect(client.startCallbackCall({ from: '3126107', to: '37499123456' })).resolves.toEqual(
      {
        kind: 'unknown',
      },
    );
    vi.unstubAllGlobals();
  });

  it('returns unconfigured without calling ATS when the API key is missing', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const client = new AtsCallbackClient({
      apiKey: '',
      isConfigured: () => false,
    } as AtsProviderConfig);

    await expect(client.startCallbackCall({ from: '3126107', to: '37499123456' })).resolves.toEqual(
      {
        kind: 'unconfigured',
      },
    );
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
