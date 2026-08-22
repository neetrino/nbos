import { describe, expect, it, vi } from 'vitest';
import { AnthropicAdapter } from './anthropic.adapter';
import type { AiProviderFetch } from './ai-provider.types';

const API_KEY = 'sk-ant-test-secret-value-bbbbbb';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('AnthropicAdapter', () => {
  it('paginates the model list through the shared adapter interface', async () => {
    const fetchImpl = vi
      .fn<AiProviderFetch>()
      .mockResolvedValueOnce(
        jsonResponse({
          data: [{ id: 'claude-sonnet-4-20250514', display_name: 'Claude Sonnet 4' }],
          has_more: true,
          last_id: 'claude-sonnet-4-20250514',
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          data: [{ id: 'claude-opus-4-20250514', display_name: 'Claude Opus 4' }],
          has_more: false,
        }),
      );
    const models = await new AnthropicAdapter(fetchImpl).listModels({ apiKey: API_KEY });
    expect(models).toHaveLength(2);
    expect(models[0]?.displayName).toBe('Claude Sonnet 4');
    expect(models[0]?.snapshotId).toBe('claude-sonnet-4-20250514');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('validates with a bounded list call', async () => {
    const fetchImpl = vi.fn<AiProviderFetch>().mockResolvedValue(jsonResponse({ data: [] }));
    const result = await new AnthropicAdapter(fetchImpl).validate({ apiKey: API_KEY });
    expect(result.ok).toBe(true);
    expect(String(fetchImpl.mock.calls[0]?.[0])).toContain('limit=1');
  });
});
