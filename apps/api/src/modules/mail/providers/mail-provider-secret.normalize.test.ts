import { describe, expect, it } from 'vitest';
import {
  gmailSecretHasLegacyFields,
  normalizeGmailMailSecret,
  normalizeMailProviderSecret,
  mailProviderSecretNeedsNormalization,
} from './mail-provider-secret.normalize';

describe('normalizeGmailMailSecret', () => {
  it('keeps only refreshToken', () => {
    expect(
      normalizeGmailMailSecret({
        kind: 'gmail',
        refreshToken: 'rt-1',
        accessToken: 'at-1',
        expiryDate: 123,
      }),
    ).toEqual({ kind: 'gmail', refreshToken: 'rt-1' });
  });
});

describe('mailProviderSecretNeedsNormalization', () => {
  it('detects legacy Gmail fields', () => {
    expect(
      mailProviderSecretNeedsNormalization({
        kind: 'gmail',
        refreshToken: 'rt-1',
        accessToken: 'at-1',
      }),
    ).toBe(true);
  });

  it('ignores corporate secrets', () => {
    expect(mailProviderSecretNeedsNormalization({ kind: 'corporate', password: 'pw' })).toBe(false);
  });

  it('ignores minimal gmail secret', () => {
    expect(gmailSecretHasLegacyFields({ kind: 'gmail', refreshToken: 'rt-1' })).toBe(false);
    expect(normalizeMailProviderSecret({ kind: 'gmail', refreshToken: 'rt-1' })).toEqual({
      kind: 'gmail',
      refreshToken: 'rt-1',
    });
  });
});
