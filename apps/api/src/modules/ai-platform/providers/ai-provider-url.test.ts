import { describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { assertSafeProviderRequestUrl, normalizeOptionalBaseUrl } from './ai-provider-url';

describe('provider URL allowlist', () => {
  it('accepts the official HTTPS OpenAI and Anthropic hosts', () => {
    expect(normalizeOptionalBaseUrl('https://api.openai.com/v1', 'OPENAI')).toBe(
      'https://api.openai.com/v1',
    );
    expect(normalizeOptionalBaseUrl('https://api.anthropic.com/v1', 'ANTHROPIC')).toBe(
      'https://api.anthropic.com/v1',
    );
    expect(
      assertSafeProviderRequestUrl('https://api.openai.com/v1/models', 'OPENAI').hostname,
    ).toBe('api.openai.com');
  });

  it('rejects http, userinfo, private hosts and off-allowlist destinations', () => {
    const blocked = [
      ['http://api.openai.com/v1', 'OPENAI'],
      ['https://user:pass@api.openai.com/v1', 'OPENAI'],
      ['https://127.0.0.1/v1', 'OPENAI'],
      ['https://10.0.0.8/v1', 'OPENAI'],
      ['https://169.254.169.254/latest', 'OPENAI'],
      ['https://192.168.1.10/v1', 'OPENAI'],
      ['https://localhost/v1', 'OPENAI'],
      ['https://[::1]/v1', 'OPENAI'],
      ['https://evil.example/v1', 'OPENAI'],
      ['https://api.openai.com.evil.example/v1', 'OPENAI'],
      ['https://api.anthropic.com/v1', 'OPENAI'],
    ] as const;
    for (const [url, provider] of blocked) {
      expect(() => normalizeOptionalBaseUrl(url, provider)).toThrow(BadRequestException);
      expect(() => assertSafeProviderRequestUrl(url, provider)).toThrow(BadRequestException);
    }
  });
});
