import type { ParsedMetaInboundMessage } from './meta.types';

export const META_MESSAGE_PREVIEW_MAX = 200;
export const META_PROFILE_CACHE_MS = 24 * 60 * 60 * 1000;
export const META_TX_MAX_RETRIES = 3;

export type MetaInboundMessageType = 'TEXT' | 'EMPTY' | 'UNSUPPORTED';

export function resolveInboundMessageType(text: string | null | undefined): MetaInboundMessageType {
  if (text === null || text === undefined) {
    return 'UNSUPPORTED';
  }
  if (text.trim().length === 0) {
    return 'EMPTY';
  }
  return 'TEXT';
}

export function buildLatestMessagePreview(text: string | null | undefined): string | null {
  if (text === null || text === undefined) {
    return null;
  }
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.length <= META_MESSAGE_PREVIEW_MAX) {
    return trimmed;
  }
  return `${trimmed.slice(0, META_MESSAGE_PREVIEW_MAX)}…`;
}

export function resolveMessageSentAt(timestamp: number | null | undefined): Date | null {
  if (timestamp === null || timestamp === undefined) {
    return null;
  }
  const millis = timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp;
  return new Date(millis);
}

export function isPrismaUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'P2002'
  );
}

export function isPrismaSerializationFailure(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'P2034'
  );
}

export function normalizeAccountScopes(scopes: unknown): string[] {
  if (!Array.isArray(scopes)) {
    return [];
  }
  return scopes.filter((scope): scope is string => typeof scope === 'string');
}

export function usesInstagramLoginGraph(scopes: unknown): boolean {
  const normalized = normalizeAccountScopes(scopes);
  return normalized.some((scope) => scope.startsWith('instagram_business_'));
}

export function buildMinimalProviderMetadata(
  message: ParsedMetaInboundMessage,
): Record<string, unknown> | null {
  const metadata: Record<string, unknown> = {};
  if (message.recipientId) {
    metadata.recipientId = message.recipientId;
  }
  if (message.replyToMid) {
    metadata.replyToMid = message.replyToMid;
  }
  if (message.attachmentTypes && message.attachmentTypes.length > 0) {
    metadata.attachmentTypes = message.attachmentTypes;
  }
  return Object.keys(metadata).length > 0 ? metadata : null;
}
