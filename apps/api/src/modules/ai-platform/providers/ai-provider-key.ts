import { BadRequestException } from '@nestjs/common';
import {
  PROVIDER_API_KEY_MIN_LENGTH,
  PROVIDER_KEY_PREFIX_CHARS,
  PROVIDER_KEY_SUFFIX_CHARS,
  PROVIDER_SECRET_FIELD_NAMES,
} from './ai-provider.constants';

export function requireProviderApiKey(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length < PROVIDER_API_KEY_MIN_LENGTH) {
    throw new BadRequestException(
      `apiKey must be at least ${PROVIDER_API_KEY_MIN_LENGTH} characters`,
    );
  }
  return trimmed;
}

/** Safe display fragment. Never the full key. */
export function toProviderKeyPrefix(apiKey: string): string {
  const start = apiKey.slice(0, PROVIDER_KEY_PREFIX_CHARS);
  const end = apiKey.slice(-PROVIDER_KEY_SUFFIX_CHARS);
  return `${start}…${end}`;
}

export function containsProviderSecretField(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value !== 'object') {
    return false;
  }
  if (Array.isArray(value)) {
    return value.some((item) => containsProviderSecretField(item));
  }
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if ((PROVIDER_SECRET_FIELD_NAMES as readonly string[]).includes(key)) {
      return true;
    }
    if (containsProviderSecretField(record[key])) {
      return true;
    }
  }
  return false;
}

export function assertNoProviderSecretFields(value: unknown): void {
  if (containsProviderSecretField(value)) {
    throw new Error('Provider secret fields must not leave the secret store');
  }
}
