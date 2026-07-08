import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { parseMetaOAuthPlatform } from './meta-oauth.platform';

describe('parseMetaOAuthPlatform', () => {
  it('accepts FACEBOOK and INSTAGRAM', () => {
    expect(parseMetaOAuthPlatform('FACEBOOK')).toBe('FACEBOOK');
    expect(parseMetaOAuthPlatform('instagram')).toBe('INSTAGRAM');
  });

  it('rejects missing platform', () => {
    expect(() => parseMetaOAuthPlatform(undefined)).toThrow(BadRequestException);
    expect(() => parseMetaOAuthPlatform('')).toThrow(BadRequestException);
  });

  it('rejects unknown platform', () => {
    expect(() => parseMetaOAuthPlatform('TWITTER')).toThrow(BadRequestException);
  });
});
