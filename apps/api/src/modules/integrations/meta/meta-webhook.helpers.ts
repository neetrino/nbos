import { createHmac, timingSafeEqual } from 'crypto';
import type { MetaMessagingWebhookBody, ParsedMetaInboundMessage } from './meta.types';

/** Max length for Meta `hub.challenge` echoed during webhook verification. */
export const META_HUB_CHALLENGE_MAX_LENGTH = 512;

/** Express query values may be string or string[] when duplicated. */
export type HttpRequestParam = string | string[] | undefined;

/** Rejects duplicated query params; returns a scalar string or undefined. */
export function normalizeHttpRequestParam(value: HttpRequestParam): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return undefined;
  }
  return value;
}

/** Token-safe characters Meta uses for `hub.challenge` (no HTML/script metacharacters). */
const META_HUB_CHALLENGE_PATTERN = /^[A-Za-z0-9+/=_-]+$/;

/**
 * Validates `hub.challenge` before echoing it in the verification response.
 * Meta requires a verbatim echo; restrict to safe token-like strings only.
 */
export function assertSafeMetaHubChallenge(challenge: HttpRequestParam): string {
  const normalizedChallenge = normalizeHttpRequestParam(challenge);
  if (
    !normalizedChallenge ||
    normalizedChallenge.length === 0 ||
    normalizedChallenge.length > META_HUB_CHALLENGE_MAX_LENGTH ||
    !META_HUB_CHALLENGE_PATTERN.test(normalizedChallenge)
  ) {
    throw new Error('Invalid hub.challenge format');
  }
  return normalizedChallenge;
}

/** Verifies Meta webhook `X-Hub-Signature-256` header against raw request body. */
export function verifyMetaWebhookSignature(
  rawBody: Buffer | string,
  signatureHeader: string | undefined,
  appSecret: string,
): boolean {
  if (!signatureHeader || !appSecret) {
    return false;
  }
  const expected = 'sha256=' + createHmac('sha256', appSecret).update(rawBody).digest('hex');
  const expectedBuf = Buffer.from(expected, 'utf8');
  const actualBuf = Buffer.from(signatureHeader, 'utf8');
  if (expectedBuf.length !== actualBuf.length) {
    return false;
  }
  return timingSafeEqual(expectedBuf, actualBuf);
}

/** Collects non-empty webhook app secrets, deduplicated in stable order. */
export function collectConfiguredWebhookSecrets(secrets: readonly string[]): string[] {
  const seen = new Set<string>();
  const configured: string[] = [];
  for (const secret of secrets) {
    const trimmed = secret.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    configured.push(trimmed);
  }
  return configured;
}

/** Returns true when the signature validates against any configured app secret. */
export function verifyMetaWebhookSignatureAny(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  secrets: readonly string[],
): boolean {
  const configuredSecrets = collectConfiguredWebhookSecrets(secrets);
  if (configuredSecrets.length === 0 || !signatureHeader) {
    return false;
  }
  for (const secret of configuredSecrets) {
    if (verifyMetaWebhookSignature(rawBody, signatureHeader, secret)) {
      return true;
    }
  }
  return false;
}

/** Parses inbound messaging events from Meta webhook payload. Skips delivery/read/echo. */
export function parseMetaInboundMessages(
  body: MetaMessagingWebhookBody,
): ParsedMetaInboundMessage[] {
  const results: ParsedMetaInboundMessage[] = [];
  const objectType = body.object ?? '';
  const platform: ParsedMetaInboundMessage['platform'] =
    objectType === 'instagram' ? 'INSTAGRAM' : 'FACEBOOK';

  for (const entry of body.entry ?? []) {
    const objectId = entry.id;
    for (const event of entry.messaging ?? []) {
      if (event.delivery || event.read || event.postback) {
        continue;
      }
      const message = event.message;
      if (!message?.mid || message.is_echo) {
        continue;
      }
      const senderId = event.sender?.id ?? 'unknown';
      results.push({
        eventId: message.mid,
        objectId,
        platform,
        senderId,
        senderName: null,
        messageText: message.text ?? null,
        timestamp: event.timestamp ?? entry.time ?? null,
        pageId: objectId,
        instagramBusinessAccountId: platform === 'INSTAGRAM' ? objectId : null,
      });
    }
  }
  return results;
}
