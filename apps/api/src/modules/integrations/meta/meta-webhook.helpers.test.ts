import { createHmac } from 'crypto';
import { describe, expect, it } from 'vitest';
import { buildMetaOAuthUrl } from './meta-provider.config';
import {
  assertSafeMetaHubChallenge,
  normalizeHttpRequestParam,
  parseMetaInboundMessages,
  verifyMetaWebhookSignature,
} from './meta-webhook.helpers';

describe('buildMetaOAuthUrl', () => {
  it('builds a Meta OAuth consent URL with scopes', () => {
    const url = buildMetaOAuthUrl({
      dialogBaseUrl: 'https://www.facebook.com/v21.0/dialog/oauth',
      appId: 'app-123',
      redirectUri: 'http://localhost:4000/api/integrations/meta/oauth/callback',
      state: 'signed-state',
      scopes: ['pages_messaging', 'instagram_manage_messages'],
    });
    expect(url).toContain('client_id=app-123');
    expect(url).toContain('redirect_uri=');
    expect(url).toContain('state=signed-state');
    expect(url).toContain('pages_messaging');
  });
});

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
    const signature = 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');
    expect(verifyMetaWebhookSignature(body, signature, secret)).toBe(true);
  });

  it('rejects invalid signature', () => {
    expect(verifyMetaWebhookSignature(Buffer.from('{}'), 'sha256=deadbeef', 'secret')).toBe(false);
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
