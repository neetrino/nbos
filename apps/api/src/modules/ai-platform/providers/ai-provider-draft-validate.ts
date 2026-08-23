import type { AiProviderValidationResult } from './ai-provider.types';
import type { AiProviderAdapterRegistry } from './ai-provider-adapter.registry';
import { normalizeOptionalBaseUrl, requireProviderType } from './ai-provider-connection.rules';
import { requireProviderApiKey } from './ai-provider-key';

export async function validateUnsavedProviderKey(
  adapters: AiProviderAdapterRegistry,
  input: { provider: string; apiKey: string; baseUrl?: string | null },
): Promise<AiProviderValidationResult> {
  const provider = requireProviderType(input.provider);
  const apiKey = requireProviderApiKey(input.apiKey);
  const baseUrl = normalizeOptionalBaseUrl(input.baseUrl, provider) ?? null;
  return adapters.get(provider).validate({ apiKey, baseUrl });
}
