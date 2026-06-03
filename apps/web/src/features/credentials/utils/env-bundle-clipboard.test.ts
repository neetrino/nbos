import { describe, expect, it } from 'vitest';
import { clipLooksLikeEnvBundle, clipSingleEnvPair } from './env-bundle-clipboard';

describe('env-bundle-clipboard', () => {
  it('detects multiline paste as bundle', () => {
    expect(clipLooksLikeEnvBundle('A=1\nB=2')).toBe(true);
  });

  it('detects single KEY=value as pair not bundle', () => {
    expect(clipLooksLikeEnvBundle('FOO=bar')).toBe(false);
    expect(clipSingleEnvPair('FOO=bar')).toEqual({ key: 'FOO', value: 'bar' });
  });
});
