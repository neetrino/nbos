import { createHmac } from 'crypto';
import { describe, expect, it } from 'vitest';
import {
  assertSafeMetaHubChallenge,
  collectConfiguredWebhookSecrets,
  normalizeHttpRequestParam,
  parseMetaInboundMessages,
  verifyMetaWebhookSignature,
  verifyMetaWebhookSignatureAny,
} from './meta-webhook.helpers';

function signBody(body: Buffer, secret: string): string {
  return 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');
}

describe('assertSafeMetaHubChallenge', () => {
  it('accepts token-like challenge strings', () => {
    expect(assertSafeMetaHubChallenge('1234567890')).toBe('1234567890');
    expect(assertSafeMetaHubChallenge('abcDEF_-+/')).toBe('abcDEF_-+/');
  });

  it('rejects HTML/script metacharacters and empty values', () => {
    expect(() => assertSafeMetaHubChallenge('')).toThrow('Invalid hub.challenge format');
    expect(() => assertSafeMetaHubChallenge('<script>alert(1)</script>')).toThrow(
      'Invalid hub.challenge format',
    );
    expect(() => assertSafeMetaHubChallenge('challenge with spaces')).toThrow(
      'Invalid hub.challenge format',
    );
  });

  it('rejects duplicated query params (string[])', () => {
    expect(() => assertSafeMetaHubChallenge(['1234567890', 'tampered'])).toThrow(
      'Invalid hub.challenge format',
    );
  });
});

describe('normalizeHttpRequestParam', () => {
  it('returns scalar strings and rejects arrays', () => {
    expect(normalizeHttpRequestParam('subscribe')).toBe('subscribe');
    expect(normalizeHttpRequestParam(undefined)).toBeUndefined();
    expect(normalizeHttpRequestParam(['a', 'b'])).toBeUndefined();
  });
});

describe('verifyMetaWebhookSignature', () => {
  it('accepts a valid signature', () => {
    const secret = 'test-secret';
    const body = Buffer.from('{"object":"page"}');
    const signature = signBody(body, secret);
    expect(verifyMetaWebhookSignature(body, signature, secret)).toBe(true);
  });

  it('rejects invalid signature', () => {
    expect(verifyMetaWebhookSignature(Buffer.from('{}'), 'sha256=deadbeef', 'secret')).toBe(false);
  });
});

describe('collectConfiguredWebhookSecrets', () => {
  it('removes empty values and deduplicates identical secrets', () => {
    expect(collectConfiguredWebhookSecrets([' fb ', '', 'fb', 'ig', 'ig'])).toEqual(['fb', 'ig']);
  });
});

describe('verifyMetaWebhookSignatureAny', () => {
  const facebookSecret = 'facebook-secret-test';
  const instagramSecret = 'instagram-secret-test';
  const body = Buffer.from('{"object":"page"}');

  it('accepts when any configured secret validates', () => {
    const signature = signBody(body, instagramSecret);
    expect(verifyMetaWebhookSignatureAny(body, signature, [facebookSecret, instagramSecret])).toBe(
      true,
    );
  });

  it('rejects when no secret validates', () => {
    const signature = signBody(body, 'other-secret');
    expect(verifyMetaWebhookSignatureAny(body, signature, [facebookSecret, instagramSecret])).toBe(
      false,
    );
  });

  it('rejects missing signature header', () => {
    expect(verifyMetaWebhookSignatureAny(body, undefined, [facebookSecret])).toBe(false);
  });

  it('rejects when no secrets are configured', () => {
    const signature = signBody(body, facebookSecret);
    expect(verifyMetaWebhookSignatureAny(body, signature, ['', '  '])).toBe(false);
  });

  it('validates against exact raw bytes that differ after JSON re-serialization', () => {
    const rawBody = Buffer.from('{\n  "object": "instagram",\n  "entry": [ ]\n}\n');
    const canonicalBody = Buffer.from(JSON.stringify(JSON.parse(rawBody.toString('utf8'))));
    expect(rawBody.equals(canonicalBody)).toBe(false);

    const signature = signBody(rawBody, instagramSecret);
    expect(verifyMetaWebhookSignatureAny(rawBody, signature, [instagramSecret])).toBe(true);
    expect(verifyMetaWebhookSignatureAny(canonicalBody, signature, [instagramSecret])).toBe(false);
  });
});

describe('parseMetaInboundMessages', () => {
  it('parses inbound text messages and skips echo/delivery', () => {
    const messages = parseMetaInboundMessages({
      object: 'instagram',
      entry: [
        {
          id: 'ig-123',
          messaging: [
            { delivery: { mids: ['m1'] } },
            { message: { mid: 'm-echo', is_echo: true, text: 'hi' } },
            {
              sender: { id: 'user-1' },
              timestamp: 1_700_000_000_000,
              message: { mid: 'mid-abc', text: 'Hello NBOS' },
            },
          ],
        },
      ],
    });
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      eventId: 'mid-abc',
      objectId: 'ig-123',
      platform: 'INSTAGRAM',
      senderId: 'user-1',
      messageText: 'Hello NBOS',
    });
  });
});
