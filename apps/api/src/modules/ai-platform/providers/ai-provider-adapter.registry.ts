import { Injectable } from '@nestjs/common';
import type { AiProviderType } from '@nbos/shared';
import { AnthropicAdapter } from './anthropic.adapter';
import { OpenAiAdapter } from './openai.adapter';
import type { AiProviderAdapter } from './ai-provider.types';

@Injectable()
export class AiProviderAdapterRegistry {
  constructor(
    private readonly openai: OpenAiAdapter,
    private readonly anthropic: AnthropicAdapter,
  ) {}

  get(provider: AiProviderType): AiProviderAdapter {
    if (provider === 'OPENAI') {
      return this.openai;
    }
    return this.anthropic;
  }
}
