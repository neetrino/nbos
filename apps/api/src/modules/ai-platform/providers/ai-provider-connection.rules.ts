import { BadRequestException } from '@nestjs/common';
import { isAiProviderType, type AiProviderType } from '@nbos/shared';
import {
  validationRelevantFieldsChanged,
  type LockedProviderConnection,
} from './ai-provider-connection.lock';
import { PROVIDER_METADATA_MAX_LENGTH, PROVIDER_NAME_MAX_LENGTH } from './ai-provider.constants';
import { normalizeOptionalBaseUrl } from './ai-provider-url';

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

export type ProviderConnectionEdits = {
  name?: string;
  providerOrganizationId?: string | null;
  providerProjectId?: string | null;
  baseUrl?: string | null;
};

export type ProviderConnectionUpdateData = ProviderConnectionEdits & {
  lastValidatedAt?: null;
};

/**
 * Turns a partial edit into the exact column set to write.
 *
 * An omitted field keeps its stored value, and changing the endpoint or the
 * account scope clears `lastValidatedAt`, because the previous success proves
 * nothing about the new target.
 */
export function resolveProviderConnectionUpdate(
  locked: Pick<
    LockedProviderConnection,
    'provider' | 'baseUrl' | 'providerOrganizationId' | 'providerProjectId'
  >,
  input: ProviderConnectionEdits,
): ProviderConnectionUpdateData {
  const next = {
    baseUrl:
      input.baseUrl === undefined
        ? locked.baseUrl
        : (normalizeOptionalBaseUrl(input.baseUrl, locked.provider) ?? null),
    providerOrganizationId:
      input.providerOrganizationId === undefined
        ? locked.providerOrganizationId
        : (normalizeOptionalMetadata(input.providerOrganizationId) ?? null),
    providerProjectId:
      input.providerProjectId === undefined
        ? locked.providerProjectId
        : (normalizeOptionalMetadata(input.providerProjectId) ?? null),
  };
  return {
    ...(input.name === undefined ? {} : { name: input.name }),
    ...(input.providerOrganizationId === undefined
      ? {}
      : { providerOrganizationId: next.providerOrganizationId }),
    ...(input.providerProjectId === undefined ? {} : { providerProjectId: next.providerProjectId }),
    ...(input.baseUrl === undefined ? {} : { baseUrl: next.baseUrl }),
    ...(validationRelevantFieldsChanged(locked, next) ? { lastValidatedAt: null } : {}),
  };
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
