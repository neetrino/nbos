import type { MessengerExternalProvider } from '@nbos/database';

export function metaProviderMessageKey(
  platform: string,
  accountId: string,
  providerMessageId: string,
): string {
  return `${platform}:${accountId}:${providerMessageId}`;
}

export function metaProviderFromPlatform(platform: string): MessengerExternalProvider {
  return platform === 'FACEBOOK' ? 'FACEBOOK' : 'INSTAGRAM';
}

export function metaInboundIdempotencyKey(providerMessageKey: string): string {
  return `meta:${providerMessageKey}`;
}
