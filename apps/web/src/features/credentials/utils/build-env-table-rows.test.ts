import { describe, expect, it } from 'vitest';
import {
  buildEnvTableRows,
  envBundleStoredKeySet,
  envRowValueIsMasked,
} from './build-env-table-rows';

describe('buildEnvTableRows', () => {
  it('merges revealed values into local rows after Add then Reveal', () => {
    const local = [
      { key: '', value: '' },
      { key: 'NODE_ENV', value: '' },
    ];
    const revealed = [{ key: 'NODE_ENV', value: 'production' }];

    const rows = buildEnvTableRows(local, [], revealed, false);

    expect(rows[0]).toEqual({ key: '', value: '' });
    expect(rows[1]).toEqual({ key: 'NODE_ENV', value: 'production' });
  });
});

describe('envRowValueIsMasked', () => {
  it('does not mask a new key that only exists in live form state', () => {
    const row = { key: 'NEW_VAR', value: '' };
    const liveKeys = envBundleStoredKeySet('NEW_VAR=\nNODE_ENV=');
    const baseline = envBundleStoredKeySet('NODE_ENV=');

    expect(envRowValueIsMasked(row, true, liveKeys, new Map())).toBe(true);
    expect(envRowValueIsMasked(row, true, baseline, new Map())).toBe(false);
  });
});
