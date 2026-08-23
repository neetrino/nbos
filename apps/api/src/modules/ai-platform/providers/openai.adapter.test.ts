import { describe, expect, it, vi } from 'vitest';
import { OpenAiAdapter } from './openai.adapter';
import type { AiProviderFetch } from './ai-provider.types';

const API_KEY = 'sk-test-openai-secret-value-aaaa';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('OpenAiAdapter', () => {
  it('lists models behind the shared adapter interface', async () => {
    const fetchImpl = vi.fn<AiProviderFetch>().mockResolvedValue(
      jsonResponse({
        data: [
          { id: 'gpt-4o-2024-08-06', object: 'model', created: 1, owned_by: 'openai' },
          { id: 'gpt-4o', object: 'model', created: 2, owned_by: 'openai' },
        ],
      }),
    );
    const adapter = new OpenAiAdapter(fetchImpl);
    const models = await adapter.listModels({ apiKey: API_KEY });
    expect(adapter.provider).toBe('OPENAI');
    expect(models.map((model) => model.providerModelId)).toEqual(['gpt-4o-2024-08-06', 'gpt-4o']);
    expect(models[0]?.snapshotId).toBe('gpt-4o-2024-08-06');
    expect(models[1]?.snapshotId).toBeNull();
    expect(models.every((model) => !JSON.stringify(model).includes(API_KEY))).toBe(true);
    expect(fetchImpl.mock.calls[0]?.[1]).toEqual(expect.objectContaining({ redirect: 'manual' }));
  });

  it('does not follow a provider redirect', async () => {
    const fetchImpl = vi
      .fn<AiProviderFetch>()
      .mockResolvedValue(new Response(null, { status: 302 }));
    const result = await new OpenAiAdapter(fetchImpl).validate({ apiKey: API_KEY });
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe('PROVIDER_REDIRECT_BLOCKED');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('refuses a private baseUrl override at request time', async () => {
    const fetchImpl = vi.fn<AiProviderFetch>();
    await expect(
      new OpenAiAdapter(fetchImpl).listModels({
        apiKey: API_KEY,
        baseUrl: 'https://127.0.0.1/v1',
      }),
    ).rejects.toThrow(/HTTPS|not allowed|allowlist/i);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('validates without returning the secret', async () => {
    const fetchImpl = vi.fn<AiProviderFetch>().mockResolvedValue(jsonResponse({ data: [] }));
    const result = await new OpenAiAdapter(fetchImpl).validate({ apiKey: API_KEY });
    expect(result).toEqual({ ok: true, errorCode: null });
    expect(result).not.toHaveProperty('apiKey');
  });

  it('maps 401 to a secret-free validation failure', async () => {
    const fetchImpl = vi
      .fn<AiProviderFetch>()
      .mockResolvedValue(jsonResponse({ error: 'no' }, 401));
    const result = await new OpenAiAdapter(fetchImpl).validate({ apiKey: API_KEY });
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe('PROVIDER_AUTH_FAILED');
    expect(JSON.stringify(result)).not.toContain(API_KEY);
  });
});
