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

  it('shows revealed values when no local edits exist (Reveal after hydrate)', () => {
    const keyPreview = [
      { key: 'NODE_ENV', value: '' },
      { key: 'APP_URL', value: '' },
    ];
    const revealed = [
      { key: 'NODE_ENV', value: 'production' },
      { key: 'APP_URL', value: 'https://app' },
    ];

    const rows = buildEnvTableRows([], keyPreview, revealed, false);

    expect(rows).toEqual(revealed);
  });

  it('keeps masked key preview while values are locked', () => {
    const keyPreview = [{ key: 'NODE_ENV', value: '' }];

    const rows = buildEnvTableRows([], keyPreview, [], true);

    expect(rows).toEqual(keyPreview);
  });
});

describe('envRowValueIsMasked', () => {
  it('does not mask a new key that only exists in live form state', () => {
    const row = { key: 'NEW_VAR', value: '' };
    const liveKeys = envBundleStoredKeySet('NEW_VAR=\nNODE_ENV=');
    const baseline = envBundleStoredKeySet('NODE_ENV=');

    expect(envRowValueIsMasked(row, true, liveKeys)).toBe(true);
    expect(envRowValueIsMasked(row, true, baseline)).toBe(false);
  });

  it('does not mask when row already has a value', () => {
    const row = { key: 'NODE_ENV', value: 'production' };
    const serverKeys = envBundleStoredKeySet('NODE_ENV=');

    expect(envRowValueIsMasked(row, true, serverKeys)).toBe(false);
  });
});
