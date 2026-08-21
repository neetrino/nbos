import { Inject, Injectable } from '@nestjs/common';
import {
  AI_PROVIDER_MODEL_LIST_MAX_PAGES,
  ANTHROPIC_API_VERSION,
  ANTHROPIC_DEFAULT_BASE_URL,
  ANTHROPIC_MODELS_PAGE_SIZE,
} from './ai-provider.constants';
import { AiProviderHttpError, providerHttpJson, trimBaseUrl } from './ai-provider-http';
import {
  AI_PROVIDER_FETCH,
  type AiProviderAdapter,
  type AiProviderCredentials,
  type AiProviderFetch,
  type AiProviderValidationResult,
  type DiscoveredProviderModel,
} from './ai-provider.types';

interface AnthropicModelRow {
  id?: unknown;
  display_name?: unknown;
  created_at?: unknown;
  type?: unknown;
}

interface AnthropicModelList {
  data?: AnthropicModelRow[];
  has_more?: unknown;
  last_id?: unknown;
}

@Injectable()
export class AnthropicAdapter implements AiProviderAdapter {
  readonly provider = 'ANTHROPIC' as const;

  constructor(@Inject(AI_PROVIDER_FETCH) private readonly fetchImpl: AiProviderFetch) {}

  async validate(credentials: AiProviderCredentials): Promise<AiProviderValidationResult> {
    try {
      const url = `${this.base(credentials)}/models?limit=1`;
      await providerHttpJson<AnthropicModelList>(
        this.fetchImpl,
        url,
        { method: 'GET', headers: anthropicHeaders(credentials) },
        this.provider,
      );
      return { ok: true, errorCode: null };
    } catch (error) {
      return {
        ok: false,
        errorCode: error instanceof AiProviderHttpError ? error.errorCode : 'PROVIDER_ERROR',
      };
    }
  }

  async listModels(credentials: AiProviderCredentials): Promise<DiscoveredProviderModel[]> {
    const models: DiscoveredProviderModel[] = [];
    let afterId: string | null = null;
    for (let page = 0; page < AI_PROVIDER_MODEL_LIST_MAX_PAGES; page += 1) {
      const payload = await this.fetchPage(credentials, afterId);
      models.push(...(payload.data ?? []).flatMap((row) => toDiscoveredModel(row)));
      if (payload.has_more !== true) {
        break;
      }
      afterId = typeof payload.last_id === 'string' ? payload.last_id : null;
      if (!afterId) {
        break;
      }
    }
    return models;
  }

  private base(credentials: AiProviderCredentials): string {
    return trimBaseUrl(credentials.baseUrl, ANTHROPIC_DEFAULT_BASE_URL);
  }

  private fetchPage(
    credentials: AiProviderCredentials,
    afterId: string | null,
  ): Promise<AnthropicModelList> {
    const params = new URLSearchParams({ limit: String(ANTHROPIC_MODELS_PAGE_SIZE) });
    if (afterId) {
      params.set('after_id', afterId);
    }
    return providerHttpJson<AnthropicModelList>(
      this.fetchImpl,
      `${this.base(credentials)}/models?${params.toString()}`,
      { method: 'GET', headers: anthropicHeaders(credentials) },
      this.provider,
    );
  }
}

function anthropicHeaders(credentials: AiProviderCredentials): Record<string, string> {
  return {
    'x-api-key': credentials.apiKey,
    'anthropic-version': ANTHROPIC_API_VERSION,
  };
}

function toDiscoveredModel(row: AnthropicModelRow): DiscoveredProviderModel[] {
  if (typeof row.id !== 'string' || row.id.trim().length === 0) {
    return [];
  }
  const providerModelId = row.id.trim();
  const displayName = typeof row.display_name === 'string' ? row.display_name : providerModelId;
  return [
    {
      providerModelId,
      displayName,
      providerMetadata: {
        type: row.type ?? null,
        created_at: row.created_at ?? null,
        display_name: displayName,
      },
      aliasOf: null,
      snapshotId: providerModelId,
    },
  ];
}
