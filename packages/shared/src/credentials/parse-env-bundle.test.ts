import { describe, expect, it } from 'vitest';
import { parseEnvBundleText, serializeEnvBundle } from './parse-env-bundle';

describe('parseEnvBundleText', () => {
  it('parses simple KEY=value lines', () => {
    const result = parseEnvBundleText('FOO=bar\nBAZ="quoted"');
    expect(result.entries).toEqual([
      { key: 'FOO', value: 'bar' },
      { key: 'BAZ', value: 'quoted' },
    ]);
    expect(result.warnings).toHaveLength(0);
    expect(result.serialized).toBe('FOO=bar\nBAZ=quoted');
  });

  it('parses export-prefixed lines', () => {
    const result = parseEnvBundleText('export FOO=bar');
    expect(result.entries).toEqual([{ key: 'FOO', value: 'bar' }]);
  });

  it('skips comments and warns on invalid lines', () => {
    const result = parseEnvBundleText('# comment\nBAD LINE\nOK=1');
    expect(result.entries).toEqual([{ key: 'OK', value: '1' }]);
    expect(result.warnings.some((w) => w.includes('Line 2'))).toBe(true);
  });

  it('warns on duplicate keys', () => {
    const result = parseEnvBundleText('A=1\nA=2');
    expect(result.entries).toEqual([{ key: 'A', value: '2' }]);
    expect(result.warnings.some((w) => w.includes('Duplicate'))).toBe(true);
  });
});

describe('serializeEnvBundle', () => {
  it('round-trips through parse', () => {
    const entries = [{ key: 'X', value: 'y' }];
    expect(serializeEnvBundle(entries)).toBe('X=y');
  });
});
