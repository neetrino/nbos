import { describe, expect, it } from 'vitest';
import { mergeEnvBundleEntries } from './merge-env-bundle-entries';

describe('mergeEnvBundleEntries', () => {
  it('overwrites duplicate keys from incoming', () => {
    const merged = mergeEnvBundleEntries(
      [{ key: 'A', value: '1' }],
      [
        { key: 'A', value: '2' },
        { key: 'B', value: '3' },
      ],
    );
    expect(merged).toEqual([
      { key: 'A', value: '2' },
      { key: 'B', value: '3' },
    ]);
  });
});
