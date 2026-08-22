import type { AiProviderType } from '@nbos/shared';

export interface AiProviderCredentials {
  apiKey: string;
  baseUrl?: string | null;
  organizationId?: string | null;
  projectId?: string | null;
}

export interface DiscoveredProviderModel {
  providerModelId: string;
  displayName: string;
  providerMetadata: Record<string, unknown>;
  aliasOf: string | null;
  snapshotId: string | null;
}

export interface AiProviderValidationResult {
  ok: boolean;
  errorCode: string | null;
}

/**
 * One adapter interface for every provider. Business modules depend on this
 * contract, never on an OpenAI or Anthropic SDK.
 */
export interface AiProviderAdapter {
  readonly provider: AiProviderType;
  validate(credentials: AiProviderCredentials): Promise<AiProviderValidationResult>;
  listModels(credentials: AiProviderCredentials): Promise<DiscoveredProviderModel[]>;
}

export type AiProviderFetch = (input: string, init?: RequestInit) => Promise<Response>;

export const AI_PROVIDER_FETCH = Symbol('AI_PROVIDER_FETCH');
