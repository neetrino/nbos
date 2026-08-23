import { describe, expect, it, vi } from 'vitest';
import type { AiProviderAdapterRegistry } from './ai-provider-adapter.registry';
import { validateUnsavedProviderKey } from './ai-provider-draft-validate';

describe('validateUnsavedProviderKey', () => {
  it('validates an Anthropic key with the Anthropic adapter', async () => {
    const anthropic = { validate: vi.fn().mockResolvedValue({ ok: true, errorCode: null }) };
    const openai = { validate: vi.fn().mockResolvedValue({ ok: true, errorCode: null }) };
    const adapters = {
      get: vi.fn((provider: string) => (provider === 'ANTHROPIC' ? anthropic : openai)),
    } as unknown as AiProviderAdapterRegistry;

    await validateUnsavedProviderKey(adapters, {
      provider: 'ANTHROPIC',
      apiKey: 'sk-ant-test-provider-secret-value-12345',
    });

    expect(adapters.get).toHaveBeenCalledWith('ANTHROPIC');
    expect(anthropic.validate).toHaveBeenCalled();
    expect(openai.validate).not.toHaveBeenCalled();
  });

  it('validates against the supplied custom baseUrl', async () => {
    const anthropic = { validate: vi.fn().mockResolvedValue({ ok: true, errorCode: null }) };
    const adapters = {
      get: vi.fn(() => anthropic),
    } as unknown as AiProviderAdapterRegistry;

    await validateUnsavedProviderKey(adapters, {
      provider: 'ANTHROPIC',
      apiKey: 'sk-ant-test-provider-secret-value-12345',
      baseUrl: 'https://api.anthropic.com/v1',
    });

    expect(anthropic.validate).toHaveBeenCalledWith(
      expect.objectContaining({ baseUrl: 'https://api.anthropic.com/v1' }),
    );
  });

  it('validates an OpenAI key with the OpenAI adapter', async () => {
    const anthropic = { validate: vi.fn() };
    const openai = { validate: vi.fn().mockResolvedValue({ ok: true, errorCode: null }) };
    const adapters = {
      get: vi.fn((provider: string) => (provider === 'ANTHROPIC' ? anthropic : openai)),
    } as unknown as AiProviderAdapterRegistry;

    await validateUnsavedProviderKey(adapters, {
      provider: 'OPENAI',
      apiKey: 'sk-test-provider-secret-value-12345',
    });

    expect(adapters.get).toHaveBeenCalledWith('OPENAI');
    expect(openai.validate).toHaveBeenCalled();
    expect(anthropic.validate).not.toHaveBeenCalled();
  });
});
