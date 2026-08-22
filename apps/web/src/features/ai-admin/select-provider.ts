import type { AiProviderConnectionView } from '@/lib/api/ai-admin';

export interface ProviderDraftValidateRequest {
  provider: AiProviderConnectionView['provider'];
  apiKey: string;
  baseUrl: string | null;
}

export function draftValidateRequest(params: {
  mode: 'create' | 'rotate';
  selected: AiProviderConnectionView['provider'];
  apiKey: string;
  selectedBaseUrl?: string | null;
  connectionProvider?: AiProviderConnectionView['provider'];
  connectionBaseUrl?: string | null;
}): ProviderDraftValidateRequest {
  if (params.mode === 'rotate') {
    if (!params.connectionProvider) {
      throw new Error('Rotate requires the stored connection provider');
    }
    return {
      provider: params.connectionProvider,
      apiKey: params.apiKey,
      baseUrl: params.connectionBaseUrl ?? null,
    };
  }
  return {
    provider: params.selected,
    apiKey: params.apiKey,
    baseUrl: params.selectedBaseUrl ?? null,
  };
}

export function draftValidateProvider(params: {
  mode: 'create' | 'rotate';
  selected: AiProviderConnectionView['provider'];
  connectionProvider?: AiProviderConnectionView['provider'];
}): AiProviderConnectionView['provider'] {
  return draftValidateRequest({ ...params, apiKey: '' }).provider;
}
