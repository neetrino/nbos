import { BadRequestException } from '@nestjs/common';
import { isAiProviderType, type AiProviderType } from '@nbos/shared';
import { PROVIDER_METADATA_MAX_LENGTH, PROVIDER_NAME_MAX_LENGTH } from './ai-provider.constants';

export { normalizeOptionalBaseUrl } from './ai-provider-url';

export function requireProviderName(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new BadRequestException('name is required');
  }
  if (trimmed.length > PROVIDER_NAME_MAX_LENGTH) {
    throw new BadRequestException(`name exceeds ${PROVIDER_NAME_MAX_LENGTH} characters`);
  }
  return trimmed;
}

export function requireProviderType(value: string): AiProviderType {
  if (!isAiProviderType(value)) {
    throw new BadRequestException('provider must be OPENAI or ANTHROPIC');
  }
  return value;
}

export function normalizeOptionalMetadata(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length > PROVIDER_METADATA_MAX_LENGTH) {
    throw new BadRequestException(`metadata exceeds ${PROVIDER_METADATA_MAX_LENGTH} characters`);
  }
  return trimmed.length > 0 ? trimmed : null;
}
