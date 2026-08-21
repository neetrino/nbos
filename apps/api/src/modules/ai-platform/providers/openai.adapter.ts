import { Inject, Injectable } from '@nestjs/common';
import { OPENAI_DEFAULT_BASE_URL } from './ai-provider.constants';
import { AiProviderHttpError, providerHttpJson, trimBaseUrl } from './ai-provider-http';
import {
  AI_PROVIDER_FETCH,
  type AiProviderAdapter,
  type AiProviderCredentials,
  type AiProviderFetch,
  type AiProviderValidationResult,
  type DiscoveredProviderModel,
} from './ai-provider.types';

interface OpenAiModelRow {
  id?: unknown;
  object?: unknown;
  created?: unknown;
  owned_by?: unknown;
}

interface OpenAiModelList {
  data?: OpenAiModelRow[];
}

const OPENAI_SNAPSHOT_SUFFIX = /-\d{4}-\d{2}-\d{2}$/;

@Injectable()
export class OpenAiAdapter implements AiProviderAdapter {
  readonly provider = 'OPENAI' as const;

  constructor(@Inject(AI_PROVIDER_FETCH) private readonly fetchImpl: AiProviderFetch) {}

  async validate(credentials: AiProviderCredentials): Promise<AiProviderValidationResult> {
    try {
      await this.listModels(credentials);
      return { ok: true, errorCode: null };
    } catch (error) {
      return { ok: false, errorCode: toValidationCode(error) };
    }
  }

  async listModels(credentials: AiProviderCredentials): Promise<DiscoveredProviderModel[]> {
    const url = `${trimBaseUrl(credentials.baseUrl, OPENAI_DEFAULT_BASE_URL)}/models`;
    const payload = await providerHttpJson<OpenAiModelList>(
      this.fetchImpl,
      url,
      { method: 'GET', headers: openAiHeaders(credentials) },
      this.provider,
    );
    return (payload.data ?? []).flatMap((row) => toDiscoveredModel(row));
  }
}

function openAiHeaders(credentials: AiProviderCredentials): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${credentials.apiKey}`,
  };
  if (credentials.organizationId) {
    headers['OpenAI-Organization'] = credentials.organizationId;
  }
  if (credentials.projectId) {
    headers['OpenAI-Project'] = credentials.projectId;
  }
  return headers;
}

function toDiscoveredModel(row: OpenAiModelRow): DiscoveredProviderModel[] {
  if (typeof row.id !== 'string' || row.id.trim().length === 0) {
    return [];
  }
  const providerModelId = row.id.trim();
  return [
    {
      providerModelId,
      displayName: providerModelId,
      providerMetadata: {
        object: row.object ?? null,
        created: row.created ?? null,
        owned_by: row.owned_by ?? null,
      },
      aliasOf: null,
      snapshotId: OPENAI_SNAPSHOT_SUFFIX.test(providerModelId) ? providerModelId : null,
    },
  ];
}

function toValidationCode(error: unknown): string {
  return error instanceof AiProviderHttpError ? error.errorCode : 'PROVIDER_ERROR';
}
